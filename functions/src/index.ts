import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { z } from 'zod';

import { apiOk } from './common/api_response.js';
import { asRecord } from './common/type_guards.js';
import { requireAuth, requireNonAnonymous } from './middleware/auth_middleware.js';
import { requireDriverProfile } from './middleware/driver_profile_middleware.js';
import { validateInput } from './middleware/input_validation_middleware.js';
import { enforceRateLimit } from './middleware/rate_limit_middleware.js';
import { requireRole } from './middleware/role_middleware.js';

setGlobalOptions({
  region: 'europe-west3',
  timeoutSeconds: 30,
  memory: '256MiB',
});

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const DRIVER_SEARCH_MAX_LIMIT = 10;
const DRIVER_SEARCH_RATE_WINDOW_MS = 60_000;
const DRIVER_SEARCH_RATE_MAX_CALLS = 30;

interface HealthCheckOutput {
  ok: boolean;
  timestamp: number;
  region: string;
}

interface DriverDirectoryResult {
  driverId: string;
  displayName: string;
  plateMasked: string;
}

interface SearchDriverDirectoryOutput {
  results: DriverDirectoryResult[];
}

const searchDriverDirectoryInputSchema = z.object({
  queryHash: z
    .string()
    .trim()
    .min(8, 'minimum 8 karakter olmalidir.')
    .max(128, 'maksimum 128 karakter olmalidir.')
    .transform((value) => value.toLowerCase()),
  limit: z.number().int().min(1).max(DRIVER_SEARCH_MAX_LIMIT).optional().default(5),
});

export const healthCheck = onCall(() => {
  return apiOk<HealthCheckOutput>({
    ok: true,
    timestamp: Date.now(),
    region: 'europe-west3',
  });
});

export const searchDriverDirectory = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  const input = validateInput(searchDriverDirectoryInputSchema, request.data);
  const limit = input.limit ?? 5;

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);
  await enforceRateLimit({
    db,
    key: `driver_directory_${auth.uid}`,
    windowMs: DRIVER_SEARCH_RATE_WINDOW_MS,
    maxCalls: DRIVER_SEARCH_RATE_MAX_CALLS,
    exceededMessage: 'Arama limiti asildi. Lutfen daha sonra tekrar dene.',
  });

  const [phoneSnap, plateSnap] = await Promise.all([
    db
      .collection('driver_directory')
      .where('searchPhoneHash', '==', input.queryHash)
      .limit(limit)
      .get(),
    db
      .collection('driver_directory')
      .where('searchPlateHash', '==', input.queryHash)
      .limit(limit)
      .get(),
  ]);

  const merged = new Map<string, DriverDirectoryResult>();
  const docs = [...phoneSnap.docs, ...plateSnap.docs];

  for (const doc of docs) {
    if (merged.size >= limit) {
      break;
    }

    const data = asRecord(doc.data());
    if (!data || data.isActive !== true) {
      continue;
    }

    if (typeof data.displayName !== 'string' || typeof data.plateMasked !== 'string') {
      continue;
    }

    if (!merged.has(doc.id)) {
      merged.set(doc.id, {
        driverId: doc.id,
        displayName: data.displayName,
        plateMasked: data.plateMasked,
      });
    }
  }

  return apiOk<SearchDriverDirectoryOutput>({
    results: Array.from(merged.values()),
  });
});
