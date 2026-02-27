import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  SRV_CODE_COLLISION_LIMIT_ERROR,
  SRV_CODE_COLLISION_MAX_RETRY,
  generateSrvCodeCandidate,
} from './srv_code.js';
import { runTransactionVoid } from './transaction_helpers.js';

export async function createRouteWithSrvCode({
  db,
  routeData,
  ownerUid,
  createdAtIso,
}: {
  db: Firestore;
  routeData: Record<string, unknown>;
  ownerUid: string;
  createdAtIso: string;
}): Promise<{ routeId: string; srvCode: string }> {
  for (let attempt = 1; attempt <= SRV_CODE_COLLISION_MAX_RETRY; attempt += 1) {
    const srvCode = generateSrvCodeCandidate();
    const routeRef = db.collection('routes').doc();
    const srvCodeRef = db.collection('_srv_codes').doc(srvCode);

    try {
      await runTransactionVoid(db, async (tx) => {
        const srvCodeSnap = await tx.get(srvCodeRef);
        if (srvCodeSnap.exists) {
          throw new Error(SRV_CODE_COLLISION_LIMIT_ERROR);
        }

        tx.set(routeRef, {
          ...routeData,
          srvCode,
        });

        tx.set(srvCodeRef, {
          routeId: routeRef.id,
          createdBy: ownerUid,
          createdAt: createdAtIso,
        });
      });

      return {
        routeId: routeRef.id,
        srvCode,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === SRV_CODE_COLLISION_LIMIT_ERROR &&
        attempt < SRV_CODE_COLLISION_MAX_RETRY
      ) {
        continue;
      }
      if (error instanceof Error && error.message === SRV_CODE_COLLISION_LIMIT_ERROR) {
        throw new HttpsError(
          'resource-exhausted',
          `${SRV_CODE_COLLISION_LIMIT_ERROR}: retry limiti asildi.`,
        );
      }
      throw error;
    }
  }

  throw new HttpsError(
    'resource-exhausted',
    `${SRV_CODE_COLLISION_LIMIT_ERROR}: retry limiti asildi.`,
  );
}
