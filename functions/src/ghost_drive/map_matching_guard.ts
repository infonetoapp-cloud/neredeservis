import { FieldValue, type Firestore } from 'firebase-admin/firestore';

import type { GhostTracePoint } from './trace_processing.js';

interface MapMatchingGuardConfig {
  enabled: boolean;
  monthlyRequestMax: number;
  timeoutMs: number;
}

export interface MapMatchingResult {
  tracePoints: GhostTracePoint[];
  fallbackUsed: boolean;
  source: 'map_matching' | 'fallback';
  confidence: number;
}

const DEFAULT_MONTHLY_MAX = 10_000;
const DEFAULT_TIMEOUT_MS = 1_500;

export function readMapMatchingGuardConfigFromEnv(): MapMatchingGuardConfig {
  const enabledRaw = process.env.MAP_MATCHING_ENABLED ?? 'false';
  const maxRaw = process.env.MAP_MATCHING_MONTHLY_MAX ?? `${DEFAULT_MONTHLY_MAX}`;
  const timeoutRaw = process.env.MAP_MATCHING_TIMEOUT_MS ?? `${DEFAULT_TIMEOUT_MS}`;

  const enabled = enabledRaw.toLowerCase() === 'true';
  const monthlyRequestMax = parsePositiveInt(maxRaw, DEFAULT_MONTHLY_MAX);
  const timeoutMs = parsePositiveInt(timeoutRaw, DEFAULT_TIMEOUT_MS);

  return {
    enabled,
    monthlyRequestMax,
    timeoutMs,
  };
}

export async function applyMapMatchingWithGuard({
  db,
  tracePoints,
}: {
  db: Firestore;
  tracePoints: readonly GhostTracePoint[];
}): Promise<MapMatchingResult> {
  const envConfig = readMapMatchingGuardConfigFromEnv();
  const config = await readMapMatchingRuntimeConfig(db, envConfig);
  if (!config.enabled) {
    return {
      tracePoints: [...tracePoints],
      fallbackUsed: true,
      source: 'fallback',
      confidence: 0,
    };
  }

  const budgetReserved = await reserveMonthlyBudget(db, config.monthlyRequestMax);
  if (!budgetReserved) {
    return {
      tracePoints: [...tracePoints],
      fallbackUsed: true,
      source: 'fallback',
      confidence: 0,
    };
  }

  try {
    const matched = await withTimeout(runMapMatchingProvider(tracePoints), config.timeoutMs);
    return {
      tracePoints: matched,
      fallbackUsed: false,
      source: 'map_matching',
      confidence: 0.5,
    };
  } catch {
    return {
      tracePoints: [...tracePoints],
      fallbackUsed: true,
      source: 'fallback',
      confidence: 0,
    };
  }
}

async function readMapMatchingRuntimeConfig(
  db: Firestore,
  fallback: MapMatchingGuardConfig,
): Promise<MapMatchingGuardConfig> {
  try {
    const snap = await db.collection('_runtime_flags').doc('map_matching').get();
    const data = snap.data() as Record<string, unknown> | undefined;
    if (!data) {
      return fallback;
    }

    const enabled = typeof data.enabled === 'boolean' ? data.enabled : fallback.enabled;
    const monthlyRequestMax =
      typeof data.monthlyRequestMax === 'number' &&
      Number.isFinite(data.monthlyRequestMax) &&
      data.monthlyRequestMax > 0
        ? data.monthlyRequestMax
        : fallback.monthlyRequestMax;
    const timeoutMs =
      typeof data.timeoutMs === 'number' && Number.isFinite(data.timeoutMs) && data.timeoutMs > 0
        ? data.timeoutMs
        : fallback.timeoutMs;

    return {
      enabled,
      monthlyRequestMax,
      timeoutMs,
    };
  } catch {
    return fallback;
  }
}

function parsePositiveInt(raw: string, fallback: number): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

async function reserveMonthlyBudget(db: Firestore, monthlyMax: number): Promise<boolean> {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const counterRef = db.collection('_usage_counters').doc(`map_matching_${monthKey}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = snap.data() as Record<string, unknown> | undefined;
    const existingCountRaw = data?.count;
    const existingCount =
      typeof existingCountRaw === 'number' && Number.isFinite(existingCountRaw)
        ? existingCountRaw
        : 0;

    if (existingCount >= monthlyMax) {
      return false;
    }

    tx.set(
      counterRef,
      {
        count: existingCount + 1,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  });
}

function runMapMatchingProvider(
  tracePoints: readonly GhostTracePoint[],
): Promise<GhostTracePoint[]> {
  // Provider entegrasyonu 236D sonrasi icin burada baglanacak.
  return Promise.resolve([...tracePoints]);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('MAP_MATCHING_TIMEOUT'));
    }, timeoutMs);
    timeoutId.unref?.();
  });
  return Promise.race([promise, timeoutPromise]);
}
