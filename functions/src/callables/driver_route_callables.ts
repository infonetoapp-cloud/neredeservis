import type { Firestore } from 'firebase-admin/firestore';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type { DeleteStopOutput, UpdateRouteOutput, UpsertStopOutput } from '../common/output_contract_types.js';
import { normalizeAuthorizedDriverIds } from '../common/runtime_value_helpers.js';
import { pickString, pickStringArray } from '../common/runtime_value_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { requireDriverProfile } from '../middleware/driver_profile_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface UpdateRouteInput {
  routeId: string;
  name?: string;
  startPoint?: unknown;
  startAddress?: string;
  endPoint?: unknown;
  endAddress?: string;
  scheduledTime?: string;
  timeSlot?: 'morning' | 'evening';
  allowGuestTracking?: boolean;
  isArchived?: boolean;
  vacationUntil?: string | null;
  authorizedDriverIds?: string[];
}

interface UpsertStopInput {
  routeId: string;
  stopId?: string;
  name: string;
  location: unknown;
  order: number;
}

interface DeleteStopInput {
  routeId: string;
  stopId: string;
}

export function createDriverRouteCallables({
  db,
  updateRouteInputSchema,
  upsertStopInputSchema,
  deleteStopInputSchema,
  requireOwnedRoute,
}: {
  db: Firestore;
  updateRouteInputSchema: ZodType<unknown>;
  upsertStopInputSchema: ZodType<unknown>;
  deleteStopInputSchema: ZodType<unknown>;
  requireOwnedRoute: (db: Firestore, routeId: string, uid: string) => Promise<Record<string, unknown>>;
}) {
  const updateRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);

    const input = validateInput(updateRouteInputSchema, request.data) as UpdateRouteInput;
    const nowIso = new Date().toISOString();
    const routeRef = db.collection('routes').doc(input.routeId);
    const routeData = await requireOwnedRoute(db, input.routeId, auth.uid);

    const updatePayload: Record<string, unknown> = {
      updatedAt: nowIso,
    };

    if (input.name != null) {
      updatePayload['name'] = input.name;
    }
    if (input.startPoint != null) {
      updatePayload['startPoint'] = input.startPoint;
    }
    if (input.startAddress != null) {
      updatePayload['startAddress'] = input.startAddress;
    }
    if (input.endPoint != null) {
      updatePayload['endPoint'] = input.endPoint;
    }
    if (input.endAddress != null) {
      updatePayload['endAddress'] = input.endAddress;
    }
    if (input.scheduledTime != null) {
      updatePayload['scheduledTime'] = input.scheduledTime;
    }
    if (input.timeSlot != null) {
      updatePayload['timeSlot'] = input.timeSlot;
    }
    if (input.allowGuestTracking != null) {
      updatePayload['allowGuestTracking'] = input.allowGuestTracking;
    }
    if (input.isArchived != null) {
      updatePayload['isArchived'] = input.isArchived;
    }
    if (input.vacationUntil !== undefined) {
      updatePayload['vacationUntil'] = input.vacationUntil;
    }

    if (input.authorizedDriverIds != null) {
      const existingAuthorized = pickStringArray(routeData, 'authorizedDriverIds');
      const existingMemberIds = pickStringArray(routeData, 'memberIds');
      const passengerMembers = existingMemberIds.filter(
        (memberUid) => memberUid !== auth.uid && !existingAuthorized.includes(memberUid),
      );
      const newAuthorizedDriverIds = normalizeAuthorizedDriverIds(
        input.authorizedDriverIds,
        auth.uid,
      );
      const newMemberIds = Array.from(
        new Set<string>([auth.uid, ...newAuthorizedDriverIds, ...passengerMembers]),
      );

      updatePayload['authorizedDriverIds'] = newAuthorizedDriverIds;
      updatePayload['memberIds'] = newMemberIds;
    }

    await routeRef.update(updatePayload);

    return apiOk<UpdateRouteOutput>({
      routeId: input.routeId,
      updatedAt: nowIso,
    });
  });

  const upsertStop = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);

    const input = validateInput(upsertStopInputSchema, request.data) as UpsertStopInput;
    await requireOwnedRoute(db, input.routeId, auth.uid);

    const nowIso = new Date().toISOString();
    const stopRef = input.stopId
      ? db.collection('routes').doc(input.routeId).collection('stops').doc(input.stopId)
      : db.collection('routes').doc(input.routeId).collection('stops').doc();
    const stopSnap = await stopRef.get();
    const existing = asRecord(stopSnap.data());
    const existingCreatedAt = pickString(existing, 'createdAt');

    await stopRef.set(
      {
        name: input.name,
        location: input.location,
        order: input.order,
        createdAt: existingCreatedAt ?? nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );

    return apiOk<UpsertStopOutput>({
      routeId: input.routeId,
      stopId: stopRef.id,
      updatedAt: nowIso,
    });
  });

  const deleteStop = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);

    const input = validateInput(deleteStopInputSchema, request.data) as DeleteStopInput;
    await requireOwnedRoute(db, input.routeId, auth.uid);

    await db.collection('routes').doc(input.routeId).collection('stops').doc(input.stopId).delete();

    return apiOk<DeleteStopOutput>({
      routeId: input.routeId,
      stopId: input.stopId,
      deleted: true,
    });
  });

  return {
    updateRoute,
    upsertStop,
    deleteStop,
  };
}


