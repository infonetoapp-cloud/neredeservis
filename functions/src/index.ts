import { randomUUID } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

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
const DRIVER_SEARCH_DEFAULT_LIMIT = 5;
const DRIVER_SEARCH_MIN_HASH_LENGTH = 8;
const DRIVER_SEARCH_MAX_HASH_LENGTH = 128;
const DRIVER_SEARCH_RATE_WINDOW_MS = 60_000;
const DRIVER_SEARCH_RATE_MAX_CALLS = 30;

interface ApiOk<T> {
  requestId: string;
  serverTime: string;
  data: T;
}

interface HealthCheckOutput {
  ok: boolean;
  timestamp: number;
  region: string;
}

interface SearchDriverDirectoryInput {
  queryHash: unknown;
  limit?: unknown;
}

interface DriverDirectoryResult {
  driverId: string;
  displayName: string;
  plateMasked: string;
}

interface SearchDriverDirectoryOutput {
  results: DriverDirectoryResult[];
}

interface RateLimitDoc {
  windowStartMs?: unknown;
  count?: unknown;
}

function apiOk<T>(data: T): ApiOk<T> {
  return {
    requestId: randomUUID(),
    serverTime: new Date().toISOString(),
    data,
  };
}

function assertSignedIn(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Auth zorunludur.');
  }
  return uid;
}

function assertHashInput(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new HttpsError('invalid-argument', 'queryHash string olmalidir.');
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized.length < DRIVER_SEARCH_MIN_HASH_LENGTH) {
    throw new HttpsError(
      'invalid-argument',
      `queryHash minimum ${DRIVER_SEARCH_MIN_HASH_LENGTH} karakter olmalidir.`,
    );
  }
  if (normalized.length > DRIVER_SEARCH_MAX_HASH_LENGTH) {
    throw new HttpsError(
      'invalid-argument',
      `queryHash maksimum ${DRIVER_SEARCH_MAX_HASH_LENGTH} karakter olmalidir.`,
    );
  }
  return normalized;
}

function assertLimit(rawLimit: unknown): number {
  if (rawLimit === undefined || rawLimit === null) {
    return DRIVER_SEARCH_DEFAULT_LIMIT;
  }
  if (typeof rawLimit !== 'number' || !Number.isInteger(rawLimit)) {
    throw new HttpsError('invalid-argument', 'limit integer olmalidir.');
  }
  if (rawLimit < 1 || rawLimit > DRIVER_SEARCH_MAX_LIMIT) {
    throw new HttpsError(
      'invalid-argument',
      `limit 1..${DRIVER_SEARCH_MAX_LIMIT} araliginda olmalidir.`,
    );
  }
  return rawLimit;
}

async function assertDriverRole(uid: string): Promise<void> {
  const userSnap = await db.collection('users').doc(uid).get();
  const userData = userSnap.data() as Record<string, unknown> | undefined;
  const role = typeof userData?.role === 'string' ? userData.role : null;
  if (role !== 'driver') {
    throw new HttpsError('permission-denied', 'Sadece sofor rolu arama yapabilir.');
  }
}

async function enforceDriverSearchRateLimit(uid: string): Promise<void> {
  const nowMs = Date.now();
  const ref = db.collection('_rate_limits').doc(`driver_directory_${uid}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.data() ?? {}) as RateLimitDoc;

    let windowStartMs =
      typeof data.windowStartMs === 'number' && Number.isFinite(data.windowStartMs)
        ? data.windowStartMs
        : nowMs;
    let count = typeof data.count === 'number' && Number.isFinite(data.count) ? data.count : 0;

    if (nowMs - windowStartMs >= DRIVER_SEARCH_RATE_WINDOW_MS) {
      windowStartMs = nowMs;
      count = 1;
    } else {
      count += 1;
    }

    if (count > DRIVER_SEARCH_RATE_MAX_CALLS) {
      throw new HttpsError(
        'resource-exhausted',
        'Arama limiti asildi. Lutfen daha sonra tekrar dene.',
      );
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

export const healthCheck = onCall(() => {
  return apiOk<HealthCheckOutput>({
    ok: true,
    timestamp: Date.now(),
    region: 'europe-west3',
  });
});

export const searchDriverDirectory = onCall<SearchDriverDirectoryInput>(async (request) => {
  const uid = assertSignedIn(request);
  const limit = assertLimit(request.data.limit);
  const queryHash = assertHashInput(request.data.queryHash);

  await assertDriverRole(uid);
  await enforceDriverSearchRateLimit(uid);

  const [phoneSnap, plateSnap] = await Promise.all([
    db.collection('driver_directory').where('searchPhoneHash', '==', queryHash).limit(limit).get(),
    db.collection('driver_directory').where('searchPlateHash', '==', queryHash).limit(limit).get(),
  ]);

  const merged = new Map<string, DriverDirectoryResult>();
  const docs = [...phoneSnap.docs, ...plateSnap.docs];

  for (const doc of docs) {
    if (merged.size >= limit) {
      break;
    }

    const data = doc.data() as Record<string, unknown>;
    if (data.isActive !== true) {
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
