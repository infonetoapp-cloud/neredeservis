import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { mapGhostTraceValidationError } from '../common/index_domain_helpers.js';
import type {
  DynamicRoutePreviewOutput,
  GenerateRouteShareLinkOutput,
  MapboxDirectionsProfile,
  MapboxDirectionsProxyOutput,
  MapboxMapMatchingProxyOutput,
} from '../common/output_contract_types.js';
import { requireRouteMember } from '../common/route_membership_helpers.js';
import { pickString } from '../common/runtime_value_helpers.js';
import type { WriteRouteAuditEventInput } from '../common/route_audit_helpers.js';
import {
  buildDirectionsCoordinatePath,
  buildMapboxDirectionsUrl,
  buildMapboxRequestSignature,
  buildRoutePreviewToken,
  fetchJsonWithTimeout,
  parseMapboxDirectionsResponse,
  readMapboxDirectionsConfigFromEnv,
  readMapboxDirectionsRuntimeConfig,
  readMapboxToken,
  readRequestIpAddress,
  readRoutePreviewRateMaxCalls,
  readRoutePreviewRateWindowMs,
  readRouteTimeSlot,
  reserveMonthlyUsageBudget,
  verifyRoutePreviewToken,
} from '../common/mapbox_route_preview_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { applyMapMatchingWithGuard } from '../ghost_drive/map_matching_guard.js';
import {
  GhostTraceValidationError,
  type GhostTracePoint,
  processGhostTrace,
} from '../ghost_drive/trace_processing.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { requireDriverProfile } from '../middleware/driver_profile_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { enforceRateLimit } from '../middleware/rate_limit_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface MapboxDirectionsProxyInput {
  routeId: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: { lat: number; lng: number }[];
  profile?: MapboxDirectionsProfile;
}

interface MapboxMapMatchingProxyInput {
  tracePoints: readonly GhostTracePoint[];
}

interface GenerateRouteShareLinkInput {
  routeId: string;
  customText?: string;
}

interface DynamicRoutePreviewInput {
  srvCode: string;
  token: string;
}

export function createMapboxPreviewCallables({
  db,
  mapboxDirectionsProxyInputSchema,
  mapboxMapMatchingProxyInputSchema,
  generateRouteShareLinkInputSchema,
  dynamicRoutePreviewInputSchema,
  mapboxDirectionsDefaultMonthlyMax,
  mapboxDirectionsDefaultTimeoutMs,
  mapboxDirectionsRateWindowMs,
  mapboxDirectionsRateMaxCalls,
  routePreviewRateWindowMs,
  routePreviewRateMaxCalls,
  routePreviewTokenDefaultTtlSeconds,
  routeShareBaseUrl,
  writeRouteAuditEvent,
  writeRouteAuditEventSafe,
}: {
  db: Firestore;
  mapboxDirectionsProxyInputSchema: ZodType<unknown>;
  mapboxMapMatchingProxyInputSchema: ZodType<unknown>;
  generateRouteShareLinkInputSchema: ZodType<unknown>;
  dynamicRoutePreviewInputSchema: ZodType<unknown>;
  mapboxDirectionsDefaultMonthlyMax: number;
  mapboxDirectionsDefaultTimeoutMs: number;
  mapboxDirectionsRateWindowMs: number;
  mapboxDirectionsRateMaxCalls: number;
  routePreviewRateWindowMs: number;
  routePreviewRateMaxCalls: number;
  routePreviewTokenDefaultTtlSeconds: number;
  routeShareBaseUrl: string;
  writeRouteAuditEvent: (input: WriteRouteAuditEventInput) => Promise<void>;
  writeRouteAuditEventSafe: (input: WriteRouteAuditEventInput) => Promise<void>;
}) {
  const normalizedRouteShareBaseUrl = routeShareBaseUrl.replace(/\/+$/, '');
  const mapboxDirectionsProxy = onCall(
    { secrets: ['MAPBOX_SECRET_TOKEN'] },
    async (request: CallableRequest<unknown>) => {
      const auth = requireAuth(request);
      requireNonAnonymous(auth);

      await requireRole({
        db,
        uid: auth.uid,
        allowedRoles: ['driver', 'passenger'],
      });

      const input = validateInput(
        mapboxDirectionsProxyInputSchema,
        request.data,
      ) as MapboxDirectionsProxyInput;
      const routeData = await requireRouteMember(db, input.routeId, auth.uid);
      if (routeData.isArchived === true) {
        throw new HttpsError(
          'failed-precondition',
          'Arsivlenmis route icin directions cagrisi yapilamaz.',
        );
      }

      const directionsConfig = await readMapboxDirectionsRuntimeConfig(
        db,
        readMapboxDirectionsConfigFromEnv({
          monthlyRequestMaxDefault: mapboxDirectionsDefaultMonthlyMax,
          timeoutMsDefault: mapboxDirectionsDefaultTimeoutMs,
          perRouteWindowMsDefault: mapboxDirectionsRateWindowMs,
          perRouteMaxCallsDefault: mapboxDirectionsRateMaxCalls,
        }),
      );
      if (!directionsConfig.enabled) {
        throw new HttpsError('failed-precondition', 'MAPBOX_DIRECTIONS_DISABLED');
      }

      const mapboxToken = readMapboxToken();
      if (!mapboxToken) {
        throw new HttpsError('failed-precondition', 'MAPBOX_TOKEN_MISSING');
      }

      await enforceRateLimit({
        db,
        key: `mapbox_directions_route_${input.routeId}`,
        windowMs: directionsConfig.perRouteWindowMs,
        maxCalls: directionsConfig.perRouteMaxCalls,
        exceededMessage: 'Mapbox directions route limiti asildi, lutfen bekleyip tekrar dene.',
      });

      const budgetReserved = await reserveMonthlyUsageBudget(
        db,
        'mapbox_directions',
        directionsConfig.monthlyRequestMax,
      );
      if (!budgetReserved) {
        throw new HttpsError('resource-exhausted', 'MAPBOX_DIRECTIONS_MONTHLY_CAP_REACHED');
      }

      const profile: MapboxDirectionsProfile = input.profile ?? 'driving';
      const waypoints = input.waypoints ?? [];
      const coordinates = [input.origin, ...waypoints, input.destination];
      const coordinatePath = buildDirectionsCoordinatePath(coordinates);
      const requestSignature = buildMapboxRequestSignature(input.routeId, profile, coordinatePath);

      const headers: Record<string, string> = {
        'User-Agent': 'neredeservis-functions/1.0',
      };
      if (requestSignature) {
        headers['X-Nsv-Signature'] = requestSignature;
      }

      const payload = await fetchJsonWithTimeout({
        url: buildMapboxDirectionsUrl({
          profile,
          coordinatePath,
          token: mapboxToken,
        }),
        timeoutMs: directionsConfig.timeoutMs,
        headers,
      });
      const parsed = parseMapboxDirectionsResponse(payload);

      return apiOk<MapboxDirectionsProxyOutput>({
        routeId: input.routeId,
        profile,
        geometry: parsed.geometry,
        distanceMeters: parsed.distanceMeters,
        durationSeconds: parsed.durationSeconds,
        source: 'mapbox',
        requestSignature,
      });
    },
  );

  const mapboxMapMatchingProxy = onCall(
    { secrets: ['MAPBOX_SECRET_TOKEN'] },
    async (request: CallableRequest<unknown>) => {
      const auth = requireAuth(request);
      requireNonAnonymous(auth);

      await requireRole({
        db,
        uid: auth.uid,
        allowedRoles: ['driver'],
      });
      await requireDriverProfile(db, auth.uid);

      const input = validateInput(
        mapboxMapMatchingProxyInputSchema,
        request.data,
      ) as MapboxMapMatchingProxyInput;

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

      return apiOk<MapboxMapMatchingProxyOutput>({
        tracePoints: mapMatched.tracePoints,
        fallbackUsed: mapMatched.fallbackUsed,
        source: mapMatched.source,
        confidence: mapMatched.confidence,
      });
    },
  );

  const generateRouteShareLink = onCall(
    { secrets: ['ROUTE_PREVIEW_SIGNING_SECRET'] },
    async (request: CallableRequest<unknown>) => {
      const auth = requireAuth(request);
      requireNonAnonymous(auth);

      await requireRole({
        db,
        uid: auth.uid,
        allowedRoles: ['driver', 'passenger'],
      });

      const input = validateInput(
        generateRouteShareLinkInputSchema,
        request.data,
      ) as GenerateRouteShareLinkInput;
      const routeData = await requireRouteMember(db, input.routeId, auth.uid);
      const srvCode = pickString(routeData, 'srvCode');
      if (!srvCode) {
        throw new HttpsError('failed-precondition', 'Route srvCode alani bulunamadi.');
      }

      const nowMs = Date.now();
      const previewTokenBundle = buildRoutePreviewToken({
        srvCode,
        nowMs,
        defaultTtlSeconds: routePreviewTokenDefaultTtlSeconds,
      });

      const landingUrl = `${normalizedRouteShareBaseUrl}/${encodeURIComponent(srvCode)}`;
      const signedLandingUrl = `${landingUrl}?t=${encodeURIComponent(previewTokenBundle.token)}`;
      const systemShareTextRaw = input.customText?.trim();
      const systemShareText =
        systemShareTextRaw && systemShareTextRaw.length > 0
          ? `${systemShareTextRaw} ${signedLandingUrl}`
          : `Nerede Servis daveti: ${signedLandingUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(systemShareText)}`;
      await writeRouteAuditEvent({
        eventType: 'route_share_link_generated',
        actorUid: auth.uid,
        routeId: input.routeId,
        srvCode,
        metadata: {
          customTextProvided: systemShareTextRaw != null && systemShareTextRaw.length > 0,
        },
      });

      return apiOk<GenerateRouteShareLinkOutput>({
        routeId: input.routeId,
        srvCode,
        landingUrl,
        signedLandingUrl,
        previewToken: previewTokenBundle.token,
        previewTokenExpiresAt: previewTokenBundle.expiresAtIso,
        whatsappUrl,
        systemShareText,
      });
    },
  );

  const getDynamicRoutePreview = onCall(
    { secrets: ['ROUTE_PREVIEW_SIGNING_SECRET'] },
    async (request: CallableRequest<unknown>) => {
      const input = validateInput(
        dynamicRoutePreviewInputSchema,
        request.data,
      ) as DynamicRoutePreviewInput;
      const normalizedSrvCode = input.srvCode.trim().toUpperCase();
      const requestIp = readRequestIpAddress(request.rawRequest);
      const nowMs = Date.now();

      try {
        await enforceRateLimit({
          db,
          key: `route_preview_${normalizedSrvCode}_${requestIp}`,
          windowMs: readRoutePreviewRateWindowMs(routePreviewRateWindowMs),
          maxCalls: readRoutePreviewRateMaxCalls(routePreviewRateMaxCalls),
          exceededMessage: 'Route preview limiti asildi. Lutfen daha sonra tekrar dene.',
        });

        verifyRoutePreviewToken({
          srvCode: normalizedSrvCode,
          token: input.token,
          nowMs,
        });

        const routeQuerySnap = await db
          .collection('routes')
          .where('srvCode', '==', normalizedSrvCode)
          .where('isArchived', '==', false)
          .limit(1)
          .get();
        if (routeQuerySnap.empty) {
          throw new HttpsError('not-found', 'Route preview bulunamadi.');
        }

        const routeDoc = routeQuerySnap.docs[0];
        if (!routeDoc) {
          throw new HttpsError('not-found', 'Route preview bulunamadi.');
        }
        const routeData = asRecord(routeDoc.data()) ?? {};
        const routeName = pickString(routeData, 'name');
        if (!routeName) {
          throw new HttpsError('failed-precondition', 'Route ad alani eksik.');
        }

        const driverUid = pickString(routeData, 'driverId');
        if (!driverUid) {
          throw new HttpsError('failed-precondition', 'Route owner bilgisi eksik.');
        }

        const driverDoc = await db.collection('drivers').doc(driverUid).get();
        const driverData = asRecord(driverDoc.data());
        const userDoc = await db.collection('users').doc(driverUid).get();
        const userData = asRecord(userDoc.data());
        const driverDisplayName =
          pickString(driverData, 'name') ?? pickString(userData, 'displayName') ?? 'Servis Soforu';

        const output: DynamicRoutePreviewOutput = {
          routeId: routeDoc.id,
          srvCode: normalizedSrvCode,
          routeName,
          driverDisplayName,
          scheduledTime: pickString(routeData, 'scheduledTime'),
          timeSlot: readRouteTimeSlot(routeData.timeSlot),
          allowGuestTracking: routeData.allowGuestTracking === true,
          deepLinkUrl: `neredeservis://route-preview?srvCode=${normalizedSrvCode}`,
        };
        await writeRouteAuditEventSafe({
          eventType: 'route_preview_accessed',
          actorUid: null,
          routeId: output.routeId,
          srvCode: output.srvCode,
          requestIp,
          metadata: {
            allowGuestTracking: output.allowGuestTracking,
          },
        });
        return apiOk<DynamicRoutePreviewOutput>(output);
      } catch (error) {
        await writeRouteAuditEventSafe({
          eventType: 'route_preview_denied',
          actorUid: null,
          srvCode: normalizedSrvCode,
          status: 'denied',
          reason: error instanceof HttpsError ? String(error.code) : 'internal',
          requestIp,
        });
        throw error;
      }
    },
  );

  return {
    mapboxDirectionsProxy,
    mapboxMapMatchingProxy,
    generateRouteShareLink,
    getDynamicRoutePreview,
  };
}
