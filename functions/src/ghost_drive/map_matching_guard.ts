import { createHmac } from 'node:crypto';

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
  const provider = (process.env.MAP_MATCHING_PROVIDER ?? 'passthrough').toLowerCase().trim();
  if (provider !== 'mapbox') {
    return Promise.resolve([...tracePoints]);
  }

  const token = process.env.MAPBOX_SECRET_TOKEN?.trim() ?? process.env.MAPBOX_TOKEN?.trim() ?? '';
  if (!token) {
    return Promise.resolve([...tracePoints]);
  }

  return runMapboxMapMatching(tracePoints, token);
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

async function runMapboxMapMatching(
  tracePoints: readonly GhostTracePoint[],
  mapboxToken: string,
): Promise<GhostTracePoint[]> {
  const chunks = splitTraceIntoChunks(tracePoints, 100);
  const merged: GhostTracePoint[] = [];

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunk = chunks[chunkIndex];
    if (!chunk || chunk.length < 2) {
      continue;
    }

    const coordinates = chunk.map((point) => `${point.lng},${point.lat}`).join(';');
    const url = buildMapMatchingUrl(coordinates, mapboxToken);
    const signature = buildMapboxRequestSignature(url);
    const headers: Record<string, string> = {};
    if (signature) {
      headers['X-Nsv-Signature'] = signature;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error(`MAP_MATCHING_UPSTREAM_${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const snappedCoordinates = extractSnappedCoordinates(payload);
    const mapped = mapSnappedCoordinatesToTrace(snappedCoordinates, chunk);
    if (mapped.length < 2) {
      throw new Error('MAP_MATCHING_EMPTY_RESULT');
    }

    if (merged.length === 0) {
      merged.push(...mapped);
      continue;
    }

    const first = mapped[0];
    const lastMerged = merged[merged.length - 1];
    if (
      first &&
      lastMerged &&
      Math.abs(first.lat - lastMerged.lat) < 1e-7 &&
      Math.abs(first.lng - lastMerged.lng) < 1e-7
    ) {
      merged.push(...mapped.slice(1));
    } else {
      merged.push(...mapped);
    }
  }

  if (merged.length < 2) {
    throw new Error('MAP_MATCHING_MERGED_TOO_SHORT');
  }
  return merged;
}

function splitTraceIntoChunks(
  tracePoints: readonly GhostTracePoint[],
  maxChunkSize: number,
): GhostTracePoint[][] {
  if (tracePoints.length <= maxChunkSize) {
    return [Array.from(tracePoints)];
  }

  const chunks: GhostTracePoint[][] = [];
  const step = Math.max(2, maxChunkSize - 1);
  for (let start = 0; start < tracePoints.length; start += step) {
    const endExclusive = Math.min(tracePoints.length, start + maxChunkSize);
    const chunk = tracePoints.slice(start, endExclusive);
    if (chunk.length >= 2) {
      chunks.push(chunk);
    }
    if (endExclusive >= tracePoints.length) {
      break;
    }
  }
  return chunks;
}

function buildMapMatchingUrl(coordinates: string, token: string): string {
  const profile = (process.env.MAPBOX_MAP_MATCHING_PROFILE ?? 'driving').trim();
  const baseUrl = (process.env.MAPBOX_BASE_URL ?? 'https://api.mapbox.com').replace(/\/+$/, '');
  const query = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    tidy: 'true',
    steps: 'false',
    access_token: token,
  });
  return `${baseUrl}/matching/v5/mapbox/${profile}/${coordinates}?${query.toString()}`;
}

function buildMapboxRequestSignature(url: string): string | null {
  const signingSecret = process.env.MAPBOX_PROXY_SIGNING_SECRET?.trim() ?? '';
  if (!signingSecret) {
    return null;
  }
  return createHmac('sha256', signingSecret).update(url).digest('hex');
}

function extractSnappedCoordinates(payload: unknown): Array<{ lat: number; lng: number }> {
  const payloadRecord = payload as Record<string, unknown> | null;
  const matchingsRaw = payloadRecord?.['matchings'];
  if (!Array.isArray(matchingsRaw)) {
    throw new Error('MAP_MATCHING_RESPONSE_INVALID');
  }

  for (const matchingRaw of matchingsRaw) {
    const matching = matchingRaw as Record<string, unknown> | null;
    const geometry = matching?.['geometry'] as Record<string, unknown> | null;
    const coordinatesRaw = geometry?.['coordinates'];
    if (!Array.isArray(coordinatesRaw)) {
      continue;
    }

    const coordinates: Array<{ lat: number; lng: number }> = [];
    for (const item of coordinatesRaw) {
      if (!Array.isArray(item) || item.length < 2) {
        continue;
      }
      const itemValues = item as unknown[];
      const lngCandidate = itemValues[0];
      const latCandidate = itemValues[1];
      const lng = typeof lngCandidate === 'number' ? lngCandidate : Number.NaN;
      const lat = typeof latCandidate === 'number' ? latCandidate : Number.NaN;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        continue;
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }
      coordinates.push({ lat, lng });
    }

    if (coordinates.length >= 2) {
      return coordinates;
    }
  }

  throw new Error('MAP_MATCHING_EMPTY_COORDINATES');
}

function mapSnappedCoordinatesToTrace(
  snappedCoordinates: readonly { lat: number; lng: number }[],
  sourceTrace: readonly GhostTracePoint[],
): GhostTracePoint[] {
  if (snappedCoordinates.length === 0 || sourceTrace.length === 0) {
    return [];
  }
  if (snappedCoordinates.length === 1) {
    const firstSource = sourceTrace[0];
    const firstCoordinate = snappedCoordinates[0];
    if (!firstSource) {
      return [];
    }
    if (!firstCoordinate) {
      return [];
    }
    return [
      {
        lat: firstCoordinate.lat,
        lng: firstCoordinate.lng,
        accuracy: firstSource.accuracy,
        sampledAtMs: firstSource.sampledAtMs,
      },
    ];
  }

  const maxSourceIndex = sourceTrace.length - 1;
  return snappedCoordinates.map((coordinate, index) => {
    const ratio = index / (snappedCoordinates.length - 1);
    const sourceIndex = Math.round(ratio * maxSourceIndex);
    const sourcePoint = sourceTrace[sourceIndex] ?? sourceTrace[maxSourceIndex];

    return {
      lat: coordinate.lat,
      lng: coordinate.lng,
      accuracy: sourcePoint?.accuracy ?? 10,
      sampledAtMs: sourcePoint?.sampledAtMs ?? Date.now(),
    };
  });
}
