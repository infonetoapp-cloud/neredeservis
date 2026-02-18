import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { asRecord } from '../common/type_guards.js';

interface RateLimitConfig {
  db: Firestore;
  key: string;
  windowMs: number;
  maxCalls: number;
  exceededMessage: string;
}

export async function enforceRateLimit({
  db,
  key,
  windowMs,
  maxCalls,
  exceededMessage,
}: RateLimitConfig): Promise<void> {
  const nowMs = Date.now();
  const ref = db.collection('_rate_limits').doc(key);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = asRecord(snap.data()) ?? {};

    const dataWindowStart = data.windowStartMs;
    const dataCount = data.count;

    let windowStartMs =
      typeof dataWindowStart === 'number' && Number.isFinite(dataWindowStart)
        ? dataWindowStart
        : nowMs;
    let count = typeof dataCount === 'number' && Number.isFinite(dataCount) ? dataCount : 0;

    if (nowMs - windowStartMs >= windowMs) {
      windowStartMs = nowMs;
      count = 1;
    } else {
      count += 1;
    }

    if (count > maxCalls) {
      throw new HttpsError('resource-exhausted', exceededMessage);
    }

    tx.set(
      ref,
      {
        windowStartMs,
        count,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}
