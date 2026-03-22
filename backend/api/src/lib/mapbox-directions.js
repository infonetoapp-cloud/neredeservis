import { createHmac } from "node:crypto";

import { HttpError } from "./http.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";
import {
  readGuestTrackingSnapshot,
  readPassengerTrackingSnapshot,
} from "./passenger-tracking.js";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MONTHLY_MAX = 20000;
const DEFAULT_PER_ROUTE_WINDOW_MS = 60000;
const DEFAULT_PER_ROUTE_MAX_CALLS = 12;

const routeRateBuckets = new Map();
const monthlyUsageBuckets = new Map();

function parsePositiveInteger(rawValue, fallback) {
  if (typeof rawValue === "number" && Number.isFinite(rawValue) && rawValue > 0) {
    return Math.floor(rawValue);
  }

  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
    const parsed = Number.parseInt(rawValue.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}

function readMapboxToken() {
  const token =
    process.env.MAPBOX_SECRET_TOKEN?.trim() ??
    process.env.MAPBOX_TOKEN?.trim() ??
    "";
  return token.length > 0 ? token : null;
}

function readDirectionsConfig() {
  const enabledRaw = process.env.MAPBOX_DIRECTIONS_ENABLED?.trim().toLowerCase();
  const token = readMapboxToken();
  const enabled =
    enabledRaw === "true" || (enabledRaw !== "false" && token !== null);

  return {
    enabled,
    token,
    timeoutMs: parsePositiveInteger(process.env.MAPBOX_DIRECTIONS_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    monthlyRequestMax: parsePositiveInteger(
      process.env.MAPBOX_DIRECTIONS_MONTHLY_MAX,
      DEFAULT_MONTHLY_MAX,
    ),
    perRouteWindowMs: parsePositiveInteger(
      process.env.MAPBOX_DIRECTIONS_RATE_WINDOW_MS,
      DEFAULT_PER_ROUTE_WINDOW_MS,
    ),
    perRouteMaxCalls: parsePositiveInteger(
      process.env.MAPBOX_DIRECTIONS_RATE_MAX_CALLS,
      DEFAULT_PER_ROUTE_MAX_CALLS,
    ),
  };
}

function normalizePathToken(rawValue, fieldLabel) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const normalized = rawValue.trim();
  if (!normalized) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return normalized;
}

function normalizeCoordinate(rawValue, fieldLabel) {
  const record = asRecord(rawValue);
  if (!record) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const lat = pickFiniteNumber(record, "lat");
  const lng = pickFiniteNumber(record, "lng");
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return { lat, lng };
}

function normalizeWaypointList(rawValue) {
  if (rawValue == null) {
    return [];
  }
  if (!Array.isArray(rawValue)) {
    throw new HttpError(400, "invalid-argument", "waypoints gecersiz.");
  }

  return rawValue.map((item, index) =>
    normalizeCoordinate(item, `waypoints[${index}]`),
  );
}

function normalizeProfile(rawValue) {
  if (rawValue == null) {
    return "driving";
  }
  if (rawValue === "driving" || rawValue === "driving-traffic") {
    return rawValue;
  }
  throw new HttpError(400, "invalid-argument", "profile gecersiz.");
}

function buildCoordinatePath(points) {
  return points.map((point) => `${point.lng},${point.lat}`).join(";");
}

function buildMapboxDirectionsUrl({ profile, coordinatePath, token }) {
  const baseUrl = (process.env.MAPBOX_BASE_URL ?? "https://api.mapbox.com").replace(/\/+$/, "");
  const query = new URLSearchParams({
    geometries: "polyline6",
    overview: "full",
    steps: "false",
    access_token: token,
  });
  return `${baseUrl}/directions/v5/mapbox/${profile}/${coordinatePath}?${query.toString()}`;
}

function buildRequestSignature(routeId, profile, coordinatePath) {
  const secret = process.env.MAPBOX_PROXY_SIGNING_SECRET?.trim() ?? "";
  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret)
    .update(`${routeId}|${profile}|${coordinatePath}`)
    .digest("hex");
}

async function fetchJsonWithTimeout({ url, timeoutMs, headers }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new HttpError(
        503,
        "unavailable",
        `MAPBOX_DIRECTIONS_UPSTREAM_${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    const errorRecord = asRecord(error);
    if (pickString(errorRecord, "name") === "AbortError") {
      throw new HttpError(504, "deadline-exceeded", "MAPBOX_DIRECTIONS_TIMEOUT");
    }

    throw new HttpError(503, "unavailable", "MAPBOX_DIRECTIONS_UPSTREAM_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}

function parseDirectionsPayload(payload) {
  const body = asRecord(payload) ?? {};
  const routes = Array.isArray(body.routes) ? body.routes : [];
  const firstRoute = asRecord(routes[0]) ?? {};
  const geometry = pickString(firstRoute, "geometry");
  const distanceMeters = pickFiniteNumber(firstRoute, "distance");
  const durationSeconds = pickFiniteNumber(firstRoute, "duration");

  if (!geometry || distanceMeters == null || durationSeconds == null) {
    throw new HttpError(503, "unavailable", "MAPBOX_DIRECTIONS_INVALID_RESPONSE");
  }

  return {
    geometry,
    distanceMeters,
    durationSeconds,
  };
}

function buildMonthKey(now = new Date()) {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

function reserveMonthlyUsage(config) {
  if (config.monthlyRequestMax <= 0) {
    return true;
  }

  const monthKey = buildMonthKey();
  const current = monthlyUsageBuckets.get(monthKey) ?? 0;
  if (current >= config.monthlyRequestMax) {
    return false;
  }

  monthlyUsageBuckets.set(monthKey, current + 1);
  return true;
}

function reserveRouteRateBudget(routeId, config) {
  const now = Date.now();
  const windowStartedAt = now - config.perRouteWindowMs;
  const existing = routeRateBuckets.get(routeId) ?? [];
  const active = existing.filter((timestamp) => timestamp >= windowStartedAt);
  if (active.length >= config.perRouteMaxCalls) {
    routeRateBuckets.set(routeId, active);
    return false;
  }

  active.push(now);
  routeRateBuckets.set(routeId, active);
  return true;
}

async function assertTrackingAccess({ db, uid, routeId, guestSessionId }) {
  const normalizedGuestSessionId =
    typeof guestSessionId === "string" && guestSessionId.trim().length > 0
      ? guestSessionId.trim()
      : null;

  if (normalizedGuestSessionId) {
    const snapshot = await readGuestTrackingSnapshot(db, uid, normalizedGuestSessionId);
    if (pickString(snapshot, "routeId") !== routeId) {
      throw new HttpError(403, "permission-denied", "Bu route icin misafir erisimi bulunmuyor.");
    }
    if (snapshot?.routeData?.isArchived === true) {
      throw new HttpError(412, "failed-precondition", "Arsivlenmis route icin directions kapali.");
    }
    return snapshot;
  }

  const snapshot = await readPassengerTrackingSnapshot(db, uid, routeId);
  if (snapshot?.routeData?.isArchived === true) {
    throw new HttpError(412, "failed-precondition", "Arsivlenmis route icin directions kapali.");
  }
  return snapshot;
}

export async function resolvePassengerDirections(db, uid, routeId, rawInput) {
  const normalizedRouteId = normalizePathToken(routeId, "routeId");
  const input = asRecord(rawInput) ?? {};
  const origin = normalizeCoordinate(input.origin, "origin");
  const destination = normalizeCoordinate(input.destination, "destination");
  const waypoints = normalizeWaypointList(input.waypoints);
  const profile = normalizeProfile(input.profile);
  const guestSessionId = pickString(input, "guestSessionId");

  await assertTrackingAccess({
    db,
    uid,
    routeId: normalizedRouteId,
    guestSessionId,
  });

  const config = readDirectionsConfig();
  if (!config.enabled) {
    throw new HttpError(412, "failed-precondition", "MAPBOX_DIRECTIONS_DISABLED");
  }
  if (!config.token) {
    throw new HttpError(412, "failed-precondition", "MAPBOX_TOKEN_MISSING");
  }
  if (!reserveRouteRateBudget(normalizedRouteId, config)) {
    throw new HttpError(
      429,
      "resource-exhausted",
      "Mapbox directions route limiti asildi, lutfen bekleyip tekrar dene.",
    );
  }
  if (!reserveMonthlyUsage(config)) {
    throw new HttpError(429, "resource-exhausted", "MAPBOX_DIRECTIONS_MONTHLY_CAP_REACHED");
  }

  const coordinatePath = buildCoordinatePath([origin, ...waypoints, destination]);
  const requestSignature = buildRequestSignature(normalizedRouteId, profile, coordinatePath);
  const payload = await fetchJsonWithTimeout({
    url: buildMapboxDirectionsUrl({
      profile,
      coordinatePath,
      token: config.token,
    }),
    timeoutMs: config.timeoutMs,
    headers: {
      "User-Agent": "neredeservis-backend-api/1.0",
      ...(requestSignature ? { "X-Nsv-Signature": requestSignature } : {}),
    },
  });
  const parsed = parseDirectionsPayload(payload);

  return {
    routeId: normalizedRouteId,
    profile,
    geometry: parsed.geometry,
    distanceMeters: parsed.distanceMeters,
    durationSeconds: parsed.durationSeconds,
    source: "mapbox",
    requestSignature,
  };
}
