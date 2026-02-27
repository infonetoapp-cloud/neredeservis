import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { isDevelopmentProject } from '../common/environment_flags.js';
import { readJoinRouteRateMaxCalls, readJoinRouteRateWindowMs } from '../common/mapbox_route_preview_helpers.js';
import type { JoinRouteBySrvCodeOutput, LeaveRouteOutput } from '../common/output_contract_types.js';
import { pickString, pickStringArray } from '../common/runtime_value_helpers.js';
import type { WriteRouteAuditEventInput } from '../common/route_audit_helpers.js';
import { runTransactionVoid } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { enforceRateLimit } from '../middleware/rate_limit_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface JoinRouteBySrvCodeInput {
  srvCode: string;
  name: string;
  phone?: string;
  showPhoneToDriver: boolean;
  boardingArea?: string;
  notificationTime?: string;
}

interface LeaveRouteInput {
  routeId: string;
}

export function createPassengerMembershipCallables({
  db,
  joinRouteBySrvCodeInputSchema,
  leaveRouteInputSchema,
  joinRouteRateWindowMs,
  joinRouteRateMaxCalls,
  writeRouteAuditEvent,
}: {
  db: Firestore;
  joinRouteBySrvCodeInputSchema: ZodType<unknown>;
  leaveRouteInputSchema: ZodType<unknown>;
  joinRouteRateWindowMs: number;
  joinRouteRateMaxCalls: number;
  writeRouteAuditEvent: (input: WriteRouteAuditEventInput) => Promise<void>;
}) {
  const joinRouteBySrvCode = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const allowOwnerJoinBypass = isDevelopmentProject();
    const joinAllowedRoles = allowOwnerJoinBypass
      ? (['passenger', 'driver'] as const)
      : (['passenger'] as const);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: joinAllowedRoles,
    });
    const effectiveJoinRouteRateWindowMs = readJoinRouteRateWindowMs(joinRouteRateWindowMs);
    const effectiveJoinRouteRateMaxCalls = readJoinRouteRateMaxCalls(joinRouteRateMaxCalls);
    await enforceRateLimit({
      db,
      key: `join_route_${auth.uid}`,
      windowMs: effectiveJoinRouteRateWindowMs,
      maxCalls: effectiveJoinRouteRateMaxCalls,
      exceededMessage: 'SRV katilim deneme limiti asildi. Lutfen daha sonra tekrar dene.',
    });

    const input = validateInput(joinRouteBySrvCodeInputSchema, request.data) as JoinRouteBySrvCodeInput;
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
    const routeData = asRecord(routeDoc.data());
    const routeDriverUid = pickString(routeData, 'driverId');
    if (routeDriverUid === auth.uid && !allowOwnerJoinBypass) {
      throw new HttpsError('permission-denied', "Route sahibi kendi route'a katilamaz.");
    }
    if (routeDriverUid === auth.uid && allowOwnerJoinBypass) {
      console.warn(
        JSON.stringify({
          eventType: 'route_join_owner_bypass_dev',
          uid: auth.uid,
          routeId: routeDoc.id,
        }),
      );
    }
    const routeName = pickString(routeData, 'name') ?? '';

    const routeRef = db.collection('routes').doc(routeDoc.id);
    const passengerRef = routeRef.collection('passengers').doc(auth.uid);
    const nowIso = new Date().toISOString();

    await runTransactionVoid(db, async (tx) => {
      const routeSnap = await tx.get(routeRef);
      if (!routeSnap.exists) {
        throw new HttpsError('not-found', 'Route bulunamadi.');
      }

      const currentRoute = asRecord(routeSnap.data()) ?? {};
      const currentRouteDriverUid = pickString(currentRoute, 'driverId');
      if (currentRouteDriverUid === auth.uid && !allowOwnerJoinBypass) {
        throw new HttpsError('permission-denied', "Route sahibi kendi route'a katilamaz.");
      }
      if (currentRoute.isArchived === true) {
        throw new HttpsError('failed-precondition', "Arsivlenmis route'a katilim kapali.");
      }

      const passengerSnap = await tx.get(passengerRef);
      const existingPassenger = asRecord(passengerSnap.data());

      tx.set(
        passengerRef,
        {
          name: input.name,
          phone: input.phone ?? null,
          showPhoneToDriver: input.showPhoneToDriver,
          boardingArea: input.boardingArea,
          virtualStop: null,
          virtualStopLabel: null,
          notificationTime: input.notificationTime,
          joinedAt: pickString(existingPassenger, 'joinedAt') ?? nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });
    await writeRouteAuditEvent({
      eventType: 'route_joined_by_srv',
      actorUid: auth.uid,
      routeId: routeDoc.id,
      srvCode: input.srvCode,
      metadata: {
        showPhoneToDriver: input.showPhoneToDriver,
      },
    });

    return apiOk<JoinRouteBySrvCodeOutput>({
      routeId: routeDoc.id,
      routeName,
      role: 'passenger',
    });
  });

  const leaveRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['passenger'],
    });

    const input = validateInput(leaveRouteInputSchema, request.data) as LeaveRouteInput;
    const routeRef = db.collection('routes').doc(input.routeId);
    const passengerRef = routeRef.collection('passengers').doc(auth.uid);
    let left = false;

    await runTransactionVoid(db, async (tx) => {
      const routeSnap = await tx.get(routeRef);
      if (!routeSnap.exists) {
        throw new HttpsError('not-found', 'Route bulunamadi.');
      }

      const routeData = asRecord(routeSnap.data()) ?? {};
      const routeDriverUid = pickString(routeData, 'driverId');
      if (routeDriverUid === auth.uid) {
        throw new HttpsError('permission-denied', 'Route sahibi leaveRoute kullanamaz.');
      }
      const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
      if (authorizedDriverIds.includes(auth.uid)) {
        throw new HttpsError(
          'permission-denied',
          'Yetkili sofor leaveRoute kullanamaz; route sahibi cikarmalidir.',
        );
      }

      const passengerSnap = await tx.get(passengerRef);
      const hasPassengerRecord = passengerSnap.exists;

      tx.delete(passengerRef);
      left = hasPassengerRecord;
    });

    return apiOk<LeaveRouteOutput>({
      routeId: input.routeId,
      left,
    });
  });

  return {
    joinRouteBySrvCode,
    leaveRoute,
  };
}


