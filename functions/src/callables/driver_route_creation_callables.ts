import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { inferStopsFromTrace, mapGhostTraceValidationError } from '../common/index_domain_helpers.js';
import type { CreateRouteFromGhostDriveOutput, CreateRouteOutput } from '../common/output_contract_types.js';
import { normalizeAuthorizedDriverIds } from '../common/runtime_value_helpers.js';
import { createRouteWithSrvCode } from '../common/route_creation_helpers.js';
import { applyMapMatchingWithGuard } from '../ghost_drive/map_matching_guard.js';
import {
  GhostTraceValidationError,
  type GhostTracePoint,
  encodeTracePolyline,
  processGhostTrace,
} from '../ghost_drive/trace_processing.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface CreateRouteInput {
  name: string;
  authorizedDriverIds?: string[];
  allowGuestTracking: boolean;
  startPoint: unknown;
  startAddress: string;
  endPoint: unknown;
  endAddress: string;
  scheduledTime: string;
  timeSlot: 'morning' | 'evening';
}

interface CreateRouteFromGhostDriveInput {
  name: string;
  authorizedDriverIds?: string[];
  allowGuestTracking: boolean;
  tracePoints: readonly GhostTracePoint[];
  scheduledTime: string;
  timeSlot: 'morning' | 'evening';
}

export function createDriverRouteCreationCallables({
  db,
  createRouteInputSchema,
  createRouteFromGhostDriveInputSchema,
}: {
  db: Firestore;
  createRouteInputSchema: ZodType<unknown>;
  createRouteFromGhostDriveInputSchema: ZodType<unknown>;
}) {
  const createRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });

    const input = validateInput(createRouteInputSchema, request.data) as CreateRouteInput;
    const nowIso = new Date().toISOString();
    const authorizedDriverIds = normalizeAuthorizedDriverIds(
      input.authorizedDriverIds ?? [],
      auth.uid,
    );
    const memberIds = Array.from(new Set<string>([auth.uid, ...authorizedDriverIds]));

    const created = await createRouteWithSrvCode({
      db,
      ownerUid: auth.uid,
      createdAtIso: nowIso,
      routeData: {
        name: input.name,
        driverId: auth.uid,
        authorizedDriverIds,
        memberIds,
        companyId: null,
        visibility: 'private',
        allowGuestTracking: input.allowGuestTracking,
        creationMode: 'manual_pin',
        routePolyline: null,
        startPoint: input.startPoint,
        startAddress: input.startAddress,
        endPoint: input.endPoint,
        endAddress: input.endAddress,
        scheduledTime: input.scheduledTime,
        timeSlot: input.timeSlot,
        isArchived: false,
        vacationUntil: null,
        passengerCount: 0,
        lastTripStartedNotificationAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    });

    return apiOk<CreateRouteOutput>(created);
  });

  const createRouteFromGhostDrive = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });

    const input = validateInput(
      createRouteFromGhostDriveInputSchema,
      request.data,
    ) as CreateRouteFromGhostDriveInput;
    const nowIso = new Date().toISOString();
    const authorizedDriverIds = normalizeAuthorizedDriverIds(
      input.authorizedDriverIds ?? [],
      auth.uid,
    );
    const memberIds = Array.from(new Set<string>([auth.uid, ...authorizedDriverIds]));

    let processedTrace;
    try {
      processedTrace = processGhostTrace(input.tracePoints);
    } catch (error) {
      if (error instanceof GhostTraceValidationError) {
        throw mapGhostTraceValidationError(error);
      }
      throw error;
    }

    const mapMatched = await applyMapMatchingWithGuard({
      db,
      tracePoints: processedTrace.simplifiedTrace,
    });
    const finalTrace = mapMatched.tracePoints;
    const finalPolyline = encodeTracePolyline(finalTrace);
    const inferredStops = inferStopsFromTrace(finalTrace);

    const firstPoint = finalTrace[0];
    const lastPoint = finalTrace[finalTrace.length - 1];
    if (!firstPoint || !lastPoint) {
      throw new HttpsError('failed-precondition', 'Ghost trace route uretimi icin yetersiz.');
    }

    const created = await createRouteWithSrvCode({
      db,
      ownerUid: auth.uid,
      createdAtIso: nowIso,
      routeData: {
        name: input.name,
        driverId: auth.uid,
        authorizedDriverIds,
        memberIds,
        companyId: null,
        visibility: 'private',
        allowGuestTracking: input.allowGuestTracking,
        creationMode: 'ghost_drive',
        routePolyline: finalPolyline,
        startPoint: {
          lat: firstPoint.lat,
          lng: firstPoint.lng,
        },
        startAddress: 'Ghost Baslangic',
        endPoint: {
          lat: lastPoint.lat,
          lng: lastPoint.lng,
        },
        endAddress: 'Ghost Bitis',
        scheduledTime: input.scheduledTime,
        timeSlot: input.timeSlot,
        isArchived: false,
        vacationUntil: null,
        passengerCount: 0,
        lastTripStartedNotificationAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        ghostTraceMeta: {
          sanitizedCount: processedTrace.sanitizedTrace.length,
          simplifiedCount: processedTrace.simplifiedTrace.length,
          finalCount: finalTrace.length,
          mapMatchingFallbackUsed: mapMatched.fallbackUsed,
          mapMatchingSource: mapMatched.source,
          mapMatchingConfidence: mapMatched.confidence,
        },
      },
    });

    return apiOk<CreateRouteFromGhostDriveOutput>({
      routeId: created.routeId,
      srvCode: created.srvCode,
      inferredStops,
    });
  });

  return {
    createRoute,
    createRouteFromGhostDrive,
  };
}


