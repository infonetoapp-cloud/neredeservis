import type { Database } from 'firebase-admin/database';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { readRole } from '../common/index_domain_helpers.js';
import type {
  CreateGuestSessionOutput,
  SubmitSkipTodayOutput,
  UpdatePassengerSettingsOutput,
} from '../common/output_contract_types.js';
import { buildIstanbulDateKey, pickGeoPoint, pickString } from '../common/runtime_value_helpers.js';
import { runTransactionVoid } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface UpdatePassengerSettingsInput {
  routeId: string;
  showPhoneToDriver: boolean;
  phone?: string;
  boardingArea?: string;
  virtualStop?: unknown;
  virtualStopLabel?: string;
  notificationTime?: string;
}

interface SubmitSkipTodayInput {
  routeId: string;
  dateKey: string;
  idempotencyKey: string;
}

interface CreateGuestSessionInput {
  srvCode: string;
  name?: string;
  ttlMinutes?: number;
}

export function createPassengerOpsCallables({
  db,
  rtdb,
  updatePassengerSettingsInputSchema,
  submitSkipTodayInputSchema,
  createGuestSessionInputSchema,
  guestSessionTtlMinutesDefault,
}: {
  db: Firestore;
  rtdb: Database;
  updatePassengerSettingsInputSchema: ZodType<unknown>;
  submitSkipTodayInputSchema: ZodType<unknown>;
  createGuestSessionInputSchema: ZodType<unknown>;
  guestSessionTtlMinutesDefault: number;
}) {
  const updatePassengerSettings = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['passenger'],
    });

    const input = validateInput(
      updatePassengerSettingsInputSchema,
      request.data,
    ) as UpdatePassengerSettingsInput;
    const routeRef = db.collection('routes').doc(input.routeId);
    const passengerRef = routeRef.collection('passengers').doc(auth.uid);
    const nowIso = new Date().toISOString();

    await runTransactionVoid(db, async (tx) => {
      const routeSnap = await tx.get(routeRef);
      if (!routeSnap.exists) {
        throw new HttpsError('not-found', 'Route bulunamadi.');
      }

      const routeData = asRecord(routeSnap.data()) ?? {};
      if (pickString(routeData, 'driverId') === auth.uid) {
        throw new HttpsError('permission-denied', 'Route sahibi passenger ayari guncelleyemez.');
      }
      if (routeData.isArchived === true) {
        throw new HttpsError('failed-precondition', 'Arsivlenmis route icin ayar guncellenemez.');
      }

      const passengerSnap = await tx.get(passengerRef);
      if (!passengerSnap.exists) {
        throw new HttpsError('not-found', 'Passenger kaydi bulunamadi.');
      }
      const passengerData = asRecord(passengerSnap.data()) ?? {};

      tx.set(
        passengerRef,
        {
          showPhoneToDriver: input.showPhoneToDriver,
          phone: input.phone ?? pickString(passengerData, 'phone') ?? null,
          boardingArea: input.boardingArea,
          virtualStop: input.virtualStop ?? pickGeoPoint(passengerData, 'virtualStop'),
          virtualStopLabel: input.virtualStopLabel ?? pickString(passengerData, 'virtualStopLabel'),
          notificationTime: input.notificationTime,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });

    return apiOk<UpdatePassengerSettingsOutput>({
      routeId: input.routeId,
      updatedAt: nowIso,
    });
  });

  const submitSkipToday = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['passenger'],
    });

    const input = validateInput(submitSkipTodayInputSchema, request.data) as SubmitSkipTodayInput;
    const routeRef = db.collection('routes').doc(input.routeId);
    const passengerRef = routeRef.collection('passengers').doc(auth.uid);
    const skipRequestRef = routeRef.collection('skip_requests').doc(`${auth.uid}_${input.dateKey}`);
    const now = new Date();
    const nowIso = now.toISOString();
    const todayKey = buildIstanbulDateKey(now);

    if (input.dateKey !== todayKey) {
      throw new HttpsError(
        'failed-precondition',
        `submitSkipToday sadece bugun icin kabul edilir. beklenenDateKey=${todayKey}`,
      );
    }

    await runTransactionVoid(db, async (tx) => {
      const routeSnap = await tx.get(routeRef);
      if (!routeSnap.exists) {
        throw new HttpsError('not-found', 'Route bulunamadi.');
      }
      const routeData = asRecord(routeSnap.data()) ?? {};
      if (routeData.isArchived === true) {
        throw new HttpsError('failed-precondition', 'Arsivlenmis route icin skip kaydi acilamaz.');
      }

      const passengerSnap = await tx.get(passengerRef);
      if (!passengerSnap.exists) {
        throw new HttpsError('permission-denied', 'Bu route icin passenger kaydin bulunmuyor.');
      }

      const skipRequestSnap = await tx.get(skipRequestRef);
      const existingSkipRequest = asRecord(skipRequestSnap.data());
      const existingPassengerId = pickString(existingSkipRequest, 'passengerId');
      const existingDateKey = pickString(existingSkipRequest, 'dateKey');
      if (
        skipRequestSnap.exists &&
        (existingPassengerId !== auth.uid || existingDateKey !== input.dateKey)
      ) {
        throw new HttpsError(
          'failed-precondition',
          'skip_requests kaydi beklenmeyen kimlik iceriyor.',
        );
      }
      const existingCreatedAt = pickString(existingSkipRequest, 'createdAt');
      const existingUpdatedAt = pickString(existingSkipRequest, 'updatedAt');
      const existingIdempotencyKey = pickString(existingSkipRequest, 'idempotencyKey');

      tx.set(
        skipRequestRef,
        {
          passengerId: auth.uid,
          dateKey: input.dateKey,
          status: 'skip_today',
          idempotencyKey: existingIdempotencyKey ?? input.idempotencyKey,
          createdAt: existingCreatedAt ?? nowIso,
          updatedAt: existingUpdatedAt ?? nowIso,
        },
        { merge: true },
      );
    });

    return apiOk<SubmitSkipTodayOutput>({
      routeId: input.routeId,
      dateKey: input.dateKey,
      status: 'skip_today',
    });
  });

  const createGuestSession = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    const input = validateInput(createGuestSessionInputSchema, request.data) as CreateGuestSessionInput;

    const routeQuery = await db
      .collection('routes')
      .where('srvCode', '==', input.srvCode)
      .where('isArchived', '==', false)
      .limit(1)
      .get();

    if (routeQuery.empty) {
      throw new HttpsError('not-found', 'SRV kodu ile route bulunamadi.');
    }

    const routeDoc = routeQuery.docs[0];
    if (!routeDoc) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }
    const routeData = asRecord(routeDoc.data()) ?? {};
    if (routeData.allowGuestTracking !== true) {
      throw new HttpsError('permission-denied', 'Bu route icin misafir takip kapali.');
    }

    const now = Date.now();
    const ttlMinutes = input.ttlMinutes ?? guestSessionTtlMinutesDefault;
    const expiresAtMs = now + ttlMinutes * 60_000;
    const nowIso = new Date(now).toISOString();
    const expiresAtIso = new Date(expiresAtMs).toISOString();
    const routeName = pickString(routeData, 'name') ?? 'Misafir Takip';

    const sessionRef = db.collection('guest_sessions').doc();
    const userRef = db.collection('users').doc(auth.uid);
    let guestDisplayName = input.name?.trim() ?? 'Misafir';

    await runTransactionVoid(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const existingUser = asRecord(userSnap.data());
      const existingRole = readRole(existingUser?.role);
      const existingCreatedAt = pickString(existingUser, 'createdAt');
      const existingDisplayName = pickString(existingUser, 'displayName');
      const existingPhone = pickString(existingUser, 'phone');
      const existingEmail = pickString(existingUser, 'email');
      guestDisplayName = input.name?.trim() ?? existingDisplayName ?? 'Misafir';

      if (!userSnap.exists || existingRole == null || existingRole === 'guest') {
        tx.set(
          userRef,
          {
            role: 'guest',
            displayName: guestDisplayName,
            phone: existingPhone,
            email: existingEmail,
            createdAt: existingCreatedAt ?? nowIso,
            updatedAt: nowIso,
            deletedAt: null,
          },
          { merge: true },
        );
      }

      tx.set(sessionRef, {
        routeId: routeDoc.id,
        routeName,
        guestUid: auth.uid,
        guestDisplayName,
        expiresAt: expiresAtIso,
        status: 'active',
        createdAt: nowIso,
      });
    });

    try {
      await rtdb.ref(`guestReaders/${routeDoc.id}/${auth.uid}`).set({
        active: true,
        expiresAtMs,
        updatedAtMs: now,
      });
    } catch {
      await sessionRef.set(
        {
          status: 'revoked',
          revokedAt: nowIso,
          revokeReason: 'RTDB_WRITE_FAILED',
        },
        { merge: true },
      );
      throw new HttpsError('internal', 'Guest reader erisimi acilamadi.');
    }

    return apiOk<CreateGuestSessionOutput>({
      sessionId: sessionRef.id,
      routeId: routeDoc.id,
      routeName,
      guestDisplayName,
      expiresAt: expiresAtIso,
      rtdbReadPath: `/locations/${routeDoc.id}`,
    });
  });

  return {
    updatePassengerSettings,
    submitSkipToday,
    createGuestSession,
  };
}


