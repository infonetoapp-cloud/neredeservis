import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

import { apiOk } from '../common/api_response.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous, type AuthContext } from '../middleware/auth_middleware.js';
import { landingConfigSchema } from '../schemas/landing_config_schema.js';

// ─── Platform Owner Guard (reuse pattern) ─────────────────────────────────────

function requirePlatformOwner(auth: AuthContext): void {
  const ownerUid = (process.env.PLATFORM_OWNER_UID ?? '').trim();
  if (!ownerUid) {
    throw new HttpsError(
      'internal',
      'PLATFORM_OWNER_UID sunucu degiskeni tanimlanmamis.',
    );
  }
  if (auth.uid !== ownerUid) {
    throw new HttpsError('permission-denied', 'Bu islem yalnizca platform sahibi tarafindan yapilabilir.');
  }
}

const DOC_PATH = 'site_config/landing_page';

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPlatformLandingCallables({ db }: { db: Firestore }) {
  /**
   * Landing page config'ini getirir. Doküman yoksa { exists: false } döner.
   */
  const platformGetLandingConfig = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const snap = await db.doc(DOC_PATH).get();

    if (!snap.exists) {
      return apiOk({ exists: false as const, config: null });
    }

    const data = snap.data() ?? {};
    // Remove internal fields before sending
    const { updatedAt, updatedBy, version, ...config } = data;

    return apiOk({
      exists: true as const,
      config,
      updatedAt: updatedAt?.toDate?.()?.toISOString?.() ?? null,
      updatedBy: updatedBy ?? null,
    });
  });

  /**
   * Landing page config'ini günceller (merge).
   */
  const platformUpdateLandingConfig = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    requirePlatformOwner(auth);

    const rawData = asRecord(request.data);
    if (!rawData) {
      throw new HttpsError('invalid-argument', 'Gecersiz istek verisi.');
    }

    const configRaw = rawData['config'];
    if (!configRaw || typeof configRaw !== 'object') {
      throw new HttpsError('invalid-argument', 'config alani zorunludur.');
    }

    // Validate with Zod
    const parseResult = landingConfigSchema.safeParse(configRaw);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      const path = firstError?.path?.join('.') ?? '';
      const msg = firstError?.message ?? 'Dogrulama hatasi';
      throw new HttpsError('invalid-argument', `Config dogrulama hatasi: ${path} — ${msg}`);
    }

    await db.doc(DOC_PATH).set(
      {
        ...parseResult.data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: auth.uid,
      },
      { merge: true },
    );

    return apiOk({ success: true });
  });

  return {
    platformGetLandingConfig,
    platformUpdateLandingConfig,
  };
}
