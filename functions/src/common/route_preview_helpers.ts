import { createHmac } from 'node:crypto';

import { HttpsError } from 'firebase-functions/v2/https';

import { pickString } from './runtime_value_helpers.js';
import { asRecord } from './type_guards.js';

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

export function readRoutePreviewSigningSecret(): string {
  const secret = process.env.ROUTE_PREVIEW_SIGNING_SECRET?.trim() ?? '';
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
