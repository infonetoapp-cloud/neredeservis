import type { Database } from 'firebase-admin/database';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import {
  createTripRequestRef,
  readTripRequestReplay,
  setTripRequestRecord,
} from '../common/idempotency_repository.js';
import { buildWriterRevokeTaskId } from '../common/index_domain_helpers.js';
import type { FinishTripOutput, StartTripOutput } from '../common/output_contract_types.js';
import {
  maskPhoneForSnapshot,
  parseIsoToMs,
  pickString,
  pickStringArray,
  readTransitionVersion,
  toErrorMessage,
} from '../common/runtime_value_helpers.js';
import { runTransactionVoid, runTransactionWithResult } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { requireDriverProfile } from '../middleware/driver_profile_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface StartTripInput {
  routeId: string;
  expectedTransitionVersion: number;
  idempotencyKey: string;
  deviceId: string;
}

interface FinishTripInput {
  tripId: string;
  expectedTransitionVersion: number;
  idempotencyKey: string;
  deviceId: string;
}

export function createTripLifecycleCallables({
  db,
  rtdb,
  startTripInputSchema,
  finishTripInputSchema,
  tripRequestTtlDays,
  tripStartedNotificationCooldownMs,
  writerRevokeTaskRetentionDays,
}: {
  db: Firestore;
  rtdb: Database;
  startTripInputSchema: ZodType<unknown>;
  finishTripInputSchema: ZodType<unknown>;
  tripRequestTtlDays: number;
  tripStartedNotificationCooldownMs: number;
  writerRevokeTaskRetentionDays: number;
}) {
  const startTrip = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);

    const input = validateInput(startTripInputSchema, request.data) as StartTripInput;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const requestExpiresAtIso = new Date(
      now + tripRequestTtlDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const routeRef = db.collection('routes').doc(input.routeId);
    const driverRef = db.collection('drivers').doc(auth.uid);
    const requestRef = createTripRequestRef(db, auth.uid, input.idempotencyKey);
    const activeTripQuery = db
      .collection('trips')
      .where('routeId', '==', input.routeId)
      .where('status', '==', 'active')
      .limit(1);

    const output = await runTransactionWithResult<StartTripOutput>(db, async (tx) => {
      const routeSnap = await tx.get(routeRef);
      if (!routeSnap.exists) {
        throw new HttpsError('not-found', 'Route bulunamadi.');
      }
      const routeData = asRecord(routeSnap.data()) ?? {};
      if (routeData.isArchived === true) {
        throw new HttpsError('failed-precondition', 'Arsivlenmis route icin trip baslatilamaz.');
      }

      const routeOwnerUid = pickString(routeData, 'driverId');
      const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
      const canStartTrip = routeOwnerUid === auth.uid || authorizedDriverIds.includes(auth.uid);
      if (!canStartTrip) {
        throw new HttpsError('permission-denied', 'Bu route icin startTrip yetkin yok.');
      }

      const existingTripId = await readTripRequestReplay({
        tx,
        requestRef,
        expectedRequestType: 'start_trip',
      });
      if (existingTripId) {
        const existingTripRef = db.collection('trips').doc(existingTripId);
        const existingTripSnap = await tx.get(existingTripRef);
        if (!existingTripSnap.exists) {
          throw new HttpsError(
            'failed-precondition',
            'Idempotency kaydi ilgili trip dokumanini bulamadi.',
          );
        }

        const existingTripData = asRecord(existingTripSnap.data()) ?? {};
        const existingStatus = pickString(existingTripData, 'status');
        if (existingStatus !== 'active') {
          throw new HttpsError(
            'failed-precondition',
            'Idempotency kaydi aktif olmayan trip durumuna isaret ediyor.',
          );
        }

        return {
          tripId: existingTripRef.id,
          status: 'active',
          transitionVersion: readTransitionVersion(existingTripData),
        };
      }

      const activeTripSnap = await tx.get(activeTripQuery);
      const activeTripDoc = activeTripSnap.docs[0];
      const activeTripData = asRecord(activeTripDoc?.data());
      const currentTransitionVersion = readTransitionVersion(activeTripData);

      if (input.expectedTransitionVersion !== currentTransitionVersion) {
        throw new HttpsError(
          'failed-precondition',
          `TRANSITION_VERSION_MISMATCH: expected=${input.expectedTransitionVersion}, actual=${currentTransitionVersion}`,
        );
      }

      if (activeTripDoc) {
        const activeTripDriverUid = pickString(activeTripData, 'driverId');
        const activeTripDeviceId = pickString(activeTripData, 'startedByDeviceId');
        if (activeTripDriverUid !== auth.uid || activeTripDeviceId !== input.deviceId) {
          throw new HttpsError('failed-precondition', 'Route icin zaten aktif bir trip var.');
        }

        setTripRequestRecord({
          tx,
          requestRef,
          requestType: 'start_trip',
          uid: auth.uid,
          tripId: activeTripDoc.id,
          createdAt: nowIso,
          expiresAt: requestExpiresAtIso,
        });

        return {
          tripId: activeTripDoc.id,
          status: 'active',
          transitionVersion: currentTransitionVersion,
        };
      }

      const driverSnap = await tx.get(driverRef);
      if (!driverSnap.exists) {
        throw new HttpsError('not-found', 'Driver profile bulunamadi.');
      }
      const driverData = asRecord(driverSnap.data()) ?? {};
      const showPhoneToPassengers = driverData.showPhoneToPassengers === true;
      const snapshotPhone = showPhoneToPassengers
        ? maskPhoneForSnapshot(pickString(driverData, 'phone'))
        : null;

      const tripRef = db.collection('trips').doc();
      const transitionVersion = currentTransitionVersion + 1;

      tx.set(tripRef, {
        routeId: input.routeId,
        driverId: auth.uid,
        driverSnapshot: {
          name: pickString(driverData, 'name') ?? '',
          plate: pickString(driverData, 'plate') ?? '',
          phone: snapshotPhone,
        },
        status: 'active',
        startedAt: nowIso,
        endedAt: null,
        lastLocationAt: nowIso,
        endReason: null,
        startedByDeviceId: input.deviceId,
        transitionVersion,
        updatedAt: nowIso,
      });

      setTripRequestRecord({
        tx,
        requestRef,
        requestType: 'start_trip',
        uid: auth.uid,
        tripId: tripRef.id,
        createdAt: nowIso,
        expiresAt: requestExpiresAtIso,
      });

      const lastTripStartedNotificationAt = pickString(routeData, 'lastTripStartedNotificationAt');
      const lastTripStartedNotificationAtMs = parseIsoToMs(lastTripStartedNotificationAt);
      const shouldRefreshTripStartedNotification =
        lastTripStartedNotificationAtMs == null ||
        now - lastTripStartedNotificationAtMs >= tripStartedNotificationCooldownMs;

      tx.update(routeRef, {
        updatedAt: nowIso,
        lastTripStartedNotificationAt: shouldRefreshTripStartedNotification
          ? nowIso
          : lastTripStartedNotificationAt,
      });

      return {
        tripId: tripRef.id,
        status: 'active',
        transitionVersion,
      };
    });

    await rtdb.ref(`routeWriters/${input.routeId}/${auth.uid}`).set(true);

    return apiOk<StartTripOutput>(output);
  });

  const finishTrip = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);

    const input = validateInput(finishTripInputSchema, request.data) as FinishTripInput;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const requestExpiresAtIso = new Date(
      now + tripRequestTtlDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const writerRevokeTaskExpiresAtIso = new Date(
      now + writerRevokeTaskRetentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const tripRef = db.collection('trips').doc(input.tripId);
    const requestRef = createTripRequestRef(db, auth.uid, input.idempotencyKey);

    let output: FinishTripOutput | null = null;
    let routeIdForWriterRevoke: string | null = null;
    let writerRevokeTaskId: string | null = null;

    await runTransactionVoid(db, async (tx) => {
      const tripSnap = await tx.get(tripRef);
      if (!tripSnap.exists) {
        throw new HttpsError('not-found', 'Trip bulunamadi.');
      }

      const tripData = asRecord(tripSnap.data()) ?? {};
      const tripDriverUid = pickString(tripData, 'driverId');
      if (tripDriverUid !== auth.uid) {
        throw new HttpsError('permission-denied', 'Bu trip icin finishTrip yetkin yok.');
      }

      const routeId = pickString(tripData, 'routeId');
      if (!routeId) {
        throw new HttpsError('failed-precondition', 'Trip routeId alani gecersiz.');
      }
      routeIdForWriterRevoke = routeId;
      const queueWriterRevokeTask = (taskRouteId: string, taskTripId: string) => {
        const writerRevokeTaskRef = db
          .collection('_writer_revoke_tasks')
          .doc(buildWriterRevokeTaskId(taskRouteId, auth.uid, taskTripId));
        writerRevokeTaskId = writerRevokeTaskRef.id;
        tx.set(
          writerRevokeTaskRef,
          {
            tripId: taskTripId,
            routeId: taskRouteId,
            driverId: auth.uid,
            source: 'finish_trip',
            status: 'pending',
            createdAt: nowIso,
            updatedAt: nowIso,
            expiresAt: writerRevokeTaskExpiresAtIso,
            lastError: null,
          },
          { merge: true },
        );
      };

      const existingTripId = await readTripRequestReplay({
        tx,
        requestRef,
        expectedRequestType: 'finish_trip',
      });
      if (existingTripId) {
        const existingTripRef = db.collection('trips').doc(existingTripId);
        const existingTripSnap = await tx.get(existingTripRef);
        if (!existingTripSnap.exists) {
          throw new HttpsError(
            'failed-precondition',
            'Idempotency kaydi ilgili trip dokumanini bulamadi.',
          );
        }

        const existingTripData = asRecord(existingTripSnap.data()) ?? {};
        const existingStatus = pickString(existingTripData, 'status');
        const existingEndedAt = pickString(existingTripData, 'endedAt');
        if (
          (existingStatus !== 'completed' && existingStatus !== 'abandoned') ||
          existingEndedAt == null
        ) {
          throw new HttpsError(
            'failed-precondition',
            'Idempotency kaydi terminal olmayan trip durumuna isaret ediyor.',
          );
        }

        const existingRouteId = pickString(existingTripData, 'routeId');
        if (!existingRouteId) {
          throw new HttpsError('failed-precondition', 'Idempotency kaydi routeId iceremiyor.');
        }
        routeIdForWriterRevoke = existingRouteId;
        queueWriterRevokeTask(existingRouteId, existingTripRef.id);
        output = {
          tripId: existingTripRef.id,
          status: existingStatus,
          endedAt: existingEndedAt,
          transitionVersion: readTransitionVersion(existingTripData),
        };
        return;
      }

      const currentStatus = pickString(tripData, 'status');
      const currentTransitionVersion = readTransitionVersion(tripData);

      if (input.expectedTransitionVersion !== currentTransitionVersion) {
        throw new HttpsError(
          'failed-precondition',
          `TRANSITION_VERSION_MISMATCH: expected=${input.expectedTransitionVersion}, actual=${currentTransitionVersion}`,
        );
      }

      if (currentStatus === 'completed' || currentStatus === 'abandoned') {
        const endedAt = pickString(tripData, 'endedAt') ?? nowIso;
        setTripRequestRecord({
          tx,
          requestRef,
          requestType: 'finish_trip',
          uid: auth.uid,
          tripId: tripRef.id,
          createdAt: nowIso,
          expiresAt: requestExpiresAtIso,
        });
        queueWriterRevokeTask(routeId, tripRef.id);

        output = {
          tripId: tripRef.id,
          status: currentStatus,
          endedAt,
          transitionVersion: currentTransitionVersion,
        };
        return;
      }

      if (currentStatus !== 'active') {
        throw new HttpsError('failed-precondition', 'Trip aktif degil; finishTrip uygulanamaz.');
      }

      const startedByDeviceId = pickString(tripData, 'startedByDeviceId');
      if (startedByDeviceId !== input.deviceId) {
        throw new HttpsError(
          'permission-denied',
          'finishTrip sadece startedByDeviceId ile yapilabilir.',
        );
      }

      const nextTransitionVersion = currentTransitionVersion + 1;
      tx.update(tripRef, {
        status: 'completed',
        endedAt: nowIso,
        endReason: 'driver_finished',
        transitionVersion: nextTransitionVersion,
        updatedAt: nowIso,
      });

      setTripRequestRecord({
        tx,
        requestRef,
        requestType: 'finish_trip',
        uid: auth.uid,
        tripId: tripRef.id,
        createdAt: nowIso,
        expiresAt: requestExpiresAtIso,
      });
      queueWriterRevokeTask(routeId, tripRef.id);

      output = {
        tripId: tripRef.id,
        status: 'completed',
        endedAt: nowIso,
        transitionVersion: nextTransitionVersion,
      };
    });

    if (!output) {
      throw new HttpsError('internal', 'finishTrip sonucu hesaplanamadi.');
    }
    const routeIdForWriterRevokeValue = String(routeIdForWriterRevoke ?? '');
    if (!routeIdForWriterRevokeValue) {
      throw new HttpsError('internal', 'finishTrip route baglantisi bulunamadi.');
    }

    const writerRevokeTaskRef = db
      .collection('_writer_revoke_tasks')
      .doc(
        writerRevokeTaskId ??
          buildWriterRevokeTaskId(routeIdForWriterRevokeValue, auth.uid, input.tripId),
      );
    const writerRevokeAttemptAtIso = new Date().toISOString();

    try {
      await rtdb.ref(`routeWriters/${routeIdForWriterRevokeValue}/${auth.uid}`).set(false);
      await writerRevokeTaskRef.set(
        {
          status: 'applied',
          appliedAt: writerRevokeAttemptAtIso,
          lastAttemptAt: writerRevokeAttemptAtIso,
          updatedAt: writerRevokeAttemptAtIso,
          lastError: null,
        },
        { merge: true },
      );
    } catch (error) {
      const errorMessage = toErrorMessage(error);
      console.error('finishTrip writer revoke failed', {
        routeId: routeIdForWriterRevokeValue,
        driverId: auth.uid,
        tripId: input.tripId,
        errorMessage,
      });
      await writerRevokeTaskRef.set(
        {
          status: 'pending',
          lastAttemptAt: writerRevokeAttemptAtIso,
          updatedAt: writerRevokeAttemptAtIso,
          lastError: errorMessage,
        },
        { merge: true },
      );
    }

    return apiOk<FinishTripOutput>(output);
  });

  return {
    startTrip,
    finishTrip,
  };
}


