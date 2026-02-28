import type { Firestore } from 'firebase-admin/firestore';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type { DriverDirectoryResult, SearchDriverDirectoryOutput } from '../common/output_contract_types.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { requireDriverProfile } from '../middleware/driver_profile_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { enforceRateLimit } from '../middleware/rate_limit_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface SearchDriverDirectoryInput {
  queryHash: string;
  limit?: number;
}

export function createSearchDriverDirectoryCallable({
  db,
  searchDriverDirectoryInputSchema,
  driverSearchRateWindowMs,
  driverSearchRateMaxCalls,
}: {
  db: Firestore;
  searchDriverDirectoryInputSchema: ZodType<unknown>;
  driverSearchRateWindowMs: number;
  driverSearchRateMaxCalls: number;
}) {
  return onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const input = validateInput(
      searchDriverDirectoryInputSchema,
      request.data,
    ) as SearchDriverDirectoryInput;
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
      windowMs: driverSearchRateWindowMs,
      maxCalls: driverSearchRateMaxCalls,
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
}


