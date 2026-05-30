import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type {
  DynamicRoutePreviewOutput,
  GenerateRouteShareLinkOutput,
} from '../common/output_contract_types.js';
import { requireRouteMember } from '../common/route_membership_helpers.js';
import { pickString } from '../common/runtime_value_helpers.js';
import type { WriteRouteAuditEventInput } from '../common/route_audit_helpers.js';
import {
  buildRoutePreviewToken,
  readRequestIpAddress,
  readRoutePreviewRateMaxCalls,
  readRoutePreviewRateWindowMs,
  readRouteTimeSlot,
  verifyRoutePreviewToken,
} from '../common/route_preview_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { enforceRateLimit } from '../middleware/rate_limit_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface GenerateRouteShareLinkInput {
  routeId: string;
  customText?: string;
}

interface DynamicRoutePreviewInput {
  srvCode: string;
  token: string;
}

export function createRoutePreviewCallables({
  db,
  generateRouteShareLinkInputSchema,
  dynamicRoutePreviewInputSchema,
  routePreviewRateWindowMs,
  routePreviewRateMaxCalls,
  routePreviewTokenDefaultTtlSeconds,
  routeShareBaseUrl,
  writeRouteAuditEvent,
  writeRouteAuditEventSafe,
}: {
  db: Firestore;
  generateRouteShareLinkInputSchema: ZodType<unknown>;
  dynamicRoutePreviewInputSchema: ZodType<unknown>;
  routePreviewRateWindowMs: number;
  routePreviewRateMaxCalls: number;
  routePreviewTokenDefaultTtlSeconds: number;
  routeShareBaseUrl: string;
  writeRouteAuditEvent: (input: WriteRouteAuditEventInput) => Promise<void>;
  writeRouteAuditEventSafe: (input: WriteRouteAuditEventInput) => Promise<void>;
}) {
  const normalizedRouteShareBaseUrl = routeShareBaseUrl.replace(/\/+$/, '');
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
    generateRouteShareLink,
    getDynamicRoutePreview,
  };
}
