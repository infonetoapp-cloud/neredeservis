import { createHmac } from 'node:crypto';

import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { pickString } from './runtime_value_helpers.js';
import { asRecord } from './type_guards.js';

type MapboxDirectionsProfile = 'driving' | 'driving-traffic';

export interface MapboxDirectionsRuntimeConfig {
  enabled: boolean;
  monthlyRequestMax: number;
  timeoutMs: number;
  perRouteWindowMs: number;
  perRouteMaxCalls: number;
}

export type RouteTimeSlot = 'morning' | 'evening' | 'midday' | 'custom';

export function parsePositiveIntValue(rawValue: unknown, fallback: number): number {
  let parsed: number;
  if (typeof rawValue === 'number') {
    parsed = rawValue;
  } else if (typeof rawValue === 'string') {
    parsed = Number.parseInt(rawValue, 10);
  } else {
    return fallback;
  }
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function readJoinRouteRateWindowMs(defaultValue: number): number {
  return parsePositiveIntValue(process.env.JOIN_ROUTE_RATE_WINDOW_MS, defaultValue);
}

export function readJoinRouteRateMaxCalls(defaultValue: number): number {
  return parsePositiveIntValue(process.env.JOIN_ROUTE_RATE_MAX_CALLS, defaultValue);
}

export function readMapboxDirectionsConfigFromEnv({
  monthlyRequestMaxDefault,
  timeoutMsDefault,
  perRouteWindowMsDefault,
  perRouteMaxCallsDefault,
}: {
  monthlyRequestMaxDefault: number;
  timeoutMsDefault: number;
  perRouteWindowMsDefault: number;
  perRouteMaxCallsDefault: number;
}): MapboxDirectionsRuntimeConfig {
  const enabled = (process.env.MAPBOX_DIRECTIONS_ENABLED ?? 'false').toLowerCase() === 'true';
  const monthlyRequestMax = parsePositiveIntValue(
    process.env.MAPBOX_DIRECTIONS_MONTHLY_MAX,
    monthlyRequestMaxDefault,
  );
  const timeoutMs = parsePositiveIntValue(process.env.MAPBOX_DIRECTIONS_TIMEOUT_MS, timeoutMsDefault);
  const perRouteWindowMs = parsePositiveIntValue(
    process.env.MAPBOX_DIRECTIONS_RATE_WINDOW_MS,
    perRouteWindowMsDefault,
  );
  const perRouteMaxCalls = parsePositiveIntValue(
    process.env.MAPBOX_DIRECTIONS_RATE_MAX_CALLS,
    perRouteMaxCallsDefault,
  );

  return {
    enabled,
    monthlyRequestMax,
    timeoutMs,
    perRouteWindowMs,
    perRouteMaxCalls,
  };
}

export async function readMapboxDirectionsRuntimeConfig(
  db: Firestore,
  fallback: MapboxDirectionsRuntimeConfig,
): Promise<MapboxDirectionsRuntimeConfig> {
  try {
    const snap = await db.collection('_runtime_flags').doc('mapbox_directions').get();
    const data = asRecord(snap.data()) ?? {};

    return {
      enabled: typeof data.enabled === 'boolean' ? data.enabled : fallback.enabled,
      monthlyRequestMax: parsePositiveIntValue(data.monthlyRequestMax, fallback.monthlyRequestMax),
      timeoutMs: parsePositiveIntValue(data.timeoutMs, fallback.timeoutMs),
      perRouteWindowMs: parsePositiveIntValue(data.perRouteWindowMs, fallback.perRouteWindowMs),
      perRouteMaxCalls: parsePositiveIntValue(data.perRouteMaxCalls, fallback.perRouteMaxCalls),
    };
  } catch {
    return fallback;
  }
}

export async function reserveMonthlyUsageBudget(
  db: Firestore,
  usageKey: string,
  monthlyMax: number,
): Promise<boolean> {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const counterRef = db.collection('_usage_counters').doc(`${usageKey}_${monthKey}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = asRecord(snap.data()) ?? {};
    const existingCount = parsePositiveIntValue(data.count, 0);

    if (existingCount >= monthlyMax) {
      return false;
    }

    tx.set(
      counterRef,
      {
        count: existingCount + 1,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return true;
  });
}

export function readMapboxToken(): string | null {
  const token = process.env.MAPBOX_SECRET_TOKEN?.trim() ?? process.env.MAPBOX_TOKEN?.trim() ?? '';
  return token.length > 0 ? token : null;
}

export function buildDirectionsCoordinatePath(points: readonly { lat: number; lng: number }[]): string {
  return points.map((point) => `${point.lng},${point.lat}`).join(';');
}

export function buildMapboxRequestSignature(
  routeId: string,
  profile: MapboxDirectionsProfile,
  coordinatePath: string,
): string | null {
  const signingSecret = process.env.MAPBOX_PROXY_SIGNING_SECRET?.trim() ?? '';
  if (!signingSecret) {
    return null;
  }

  const payload = `${routeId}|${profile}|${coordinatePath}`;
  return createHmac('sha256', signingSecret).update(payload).digest('hex');
}

export function buildMapboxDirectionsUrl({
  profile,
  coordinatePath,
  token,
}: {
  profile: MapboxDirectionsProfile;
  coordinatePath: string;
  token: string;
}): string {
  const baseUrl = (process.env.MAPBOX_BASE_URL ?? 'https://api.mapbox.com').replace(/\/+$/, '');
  const query = new URLSearchParams({
    geometries: 'polyline6',
    overview: 'full',
    steps: 'false',
    access_token: token,
  });

  return `${baseUrl}/directions/v5/mapbox/${profile}/${coordinatePath}?${query.toString()}`;
}

export async function fetchJsonWithTimeout({
  url,
  timeoutMs,
  headers,
}: {
  url: string;
  timeoutMs: number;
  headers: Record<string, string>;
}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new HttpsError('unavailable', `MAPBOX_DIRECTIONS_UPSTREAM_${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const errorRecord = asRecord(error as Record<string, unknown> | null);
    if (pickString(errorRecord, 'name') === 'AbortError') {
      throw new HttpsError('deadline-exceeded', 'MAPBOX_DIRECTIONS_TIMEOUT');
    }
    throw new HttpsError('unavailable', 'MAPBOX_DIRECTIONS_UPSTREAM_FAILED');
  } finally {
    clearTimeout(timeout);
  }
}

export function parseMapboxDirectionsResponse(payload: unknown): {
  geometry: string;
  distanceMeters: number;
  durationSeconds: number;
} {
  const body = asRecord(payload) ?? {};
  const routes = Array.isArray(body.routes) ? body.routes : [];
  const firstRoute = asRecord(routes[0]) ?? {};
  const geometry = pickString(firstRoute, 'geometry');
  const distanceRaw = firstRoute.distance;
  const durationRaw = firstRoute.duration;
  const distanceMeters = typeof distanceRaw === 'number' && Number.isFinite(distanceRaw) ? distanceRaw : null;
  const durationSeconds = typeof durationRaw === 'number' && Number.isFinite(durationRaw) ? durationRaw : null;

  if (!geometry || distanceMeters == null || durationSeconds == null) {
    throw new HttpsError('unavailable', 'MAPBOX_DIRECTIONS_INVALID_RESPONSE');
  }

  return {
    geometry,
    distanceMeters,
    durationSeconds,
  };
}

export function readRoutePreviewSigningSecret(): string {
  const secret =
    process.env.ROUTE_PREVIEW_SIGNING_SECRET?.trim() ?? process.env.MAPBOX_PROXY_SIGNING_SECRET?.trim() ?? '';
  if (!secret) {
    throw new HttpsError('failed-precondition', 'ROUTE_PREVIEW_SIGNING_SECRET_MISSING');
  }
  return secret;
}

export function readRoutePreviewRateWindowMs(defaultValue: number): number {
  return parsePositiveIntValue(process.env.ROUTE_PREVIEW_RATE_WINDOW_MS, defaultValue);
}

export function readRoutePreviewRateMaxCalls(defaultValue: number): number {
  return parsePositiveIntValue(process.env.ROUTE_PREVIEW_RATE_MAX_CALLS, defaultValue);
}

export function readRoutePreviewTokenTtlSeconds(defaultValue: number): number {
  return parsePositiveIntValue(process.env.ROUTE_PREVIEW_TOKEN_TTL_SECONDS, defaultValue);
}

export function buildRoutePreviewToken({
  srvCode,
  nowMs,
  defaultTtlSeconds,
}: {
  srvCode: string;
  nowMs: number;
  defaultTtlSeconds: number;
}): {
  token: string;
  expiresAtIso: string;
} {
  const ttlSeconds = readRoutePreviewTokenTtlSeconds(defaultTtlSeconds);
  const expiresAtMs = nowMs + ttlSeconds * 1000;
  const expiresAtSeconds = Math.floor(expiresAtMs / 1000);
  const payload = `${srvCode}.${expiresAtSeconds}`;
  const signature = createHmac('sha256', readRoutePreviewSigningSecret())
    .update(payload)
    .digest('hex');
  return {
    token: `${payload}.${signature}`,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
  };
}

export function verifyRoutePreviewToken({
  srvCode,
  token,
  nowMs,
}: {
  srvCode: string;
  token: string;
  nowMs: number;
}): void {
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_INVALID');
  }

  const [tokenSrvCodeRaw, expiresAtSecondsRaw, signature] = tokenParts;
  const tokenSrvCode = tokenSrvCodeRaw?.trim().toUpperCase();
  if (!tokenSrvCode || tokenSrvCode !== srvCode) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_SCOPE_MISMATCH');
  }

  const expiresAtSeconds = Number.parseInt(expiresAtSecondsRaw ?? '', 10);
  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds <= 0) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_INVALID');
  }

  if (expiresAtSeconds * 1000 < nowMs) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_EXPIRED');
  }

  const payload = `${tokenSrvCode}.${expiresAtSeconds}`;
  const expectedSignature = createHmac('sha256', readRoutePreviewSigningSecret())
    .update(payload)
    .digest('hex');
  if (expectedSignature !== signature) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_INVALID_SIGNATURE');
  }
}

export function readRequestIpAddress(rawRequest: unknown): string {
  const requestRecord = asRecord(rawRequest) ?? {};
  const directIp = pickString(requestRecord, 'ip');
  if (directIp) {
    return directIp;
  }

  const requestHeaders = asRecord(requestRecord.headers) ?? {};
  const forwardedFor = pickString(requestHeaders, 'x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return 'unknown';
}

export function readRouteTimeSlot(value: unknown): RouteTimeSlot | null {
  if (value === 'morning' || value === 'evening' || value === 'midday' || value === 'custom') {
    return value;
  }
  return null;
}
