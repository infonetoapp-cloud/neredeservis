import { createHash, createHmac } from "node:crypto";

import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const ROUTE_AUDIT_COLLECTION = "_audit_route_events";
const ROUTE_PREVIEW_RATE_WINDOW_MS_DEFAULT = 60_000;
const ROUTE_PREVIEW_RATE_MAX_CALLS_DEFAULT = 60;
const ROUTE_PREVIEW_TOKEN_DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;
const ROUTE_SHARE_BASE_URL_DEFAULT = "https://app.neredeservis.app/r";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function parsePositiveIntValue(rawValue, fallback) {
  let parsed;
  if (typeof rawValue === "number") {
    parsed = rawValue;
  } else if (typeof rawValue === "string") {
    parsed = Number.parseInt(rawValue, 10);
  } else {
    return fallback;
  }

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalizeRouteId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "routeId gecersiz.");
  }

  const routeId = rawValue.trim();
  if (!routeId || routeId.length > 128) {
    throw new HttpError(400, "invalid-argument", "routeId gecersiz.");
  }

  return routeId;
}

function normalizeSrvCode(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "srvCode gecersiz.");
  }

  const srvCode = rawValue.trim().toUpperCase();
  if (!srvCode || srvCode.length > 64) {
    throw new HttpError(400, "invalid-argument", "srvCode gecersiz.");
  }

  return srvCode;
}

function normalizeCustomText(rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "customText gecersiz.");
  }

  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  if (value.length > 500) {
    throw new HttpError(400, "invalid-argument", "customText maksimum 500 karakter olabilir.");
  }
  return value;
}

function readAllowedUserRole(userData, allowedRoles) {
  const role = pickString(userData, "role");
  if (!allowedRoles.has(role ?? "")) {
    throw new HttpError(403, "permission-denied", "Bu islem icin yetkin bulunmuyor.");
  }
  return role;
}

async function requireAllowedUserRole(db, uid, allowedRoles) {
  const userSnapshot = await db.collection("users").doc(uid).get();
  const userData = asRecord(userSnapshot.data()) ?? {};
  return readAllowedUserRole(userData, allowedRoles);
}

async function requireRouteMember(db, routeId, uid) {
  const routeSnapshot = await db.collection("routes").doc(routeId).get();
  if (!routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  const routeOwnerUid = pickString(routeData, "driverId");
  const authorizedDriverIds = pickStringArray(routeData, "authorizedDriverIds");
  const memberIds = pickStringArray(routeData, "memberIds");
  const isMember =
    routeOwnerUid === uid || authorizedDriverIds.includes(uid) || memberIds.includes(uid);
  if (!isMember) {
    throw new HttpError(403, "permission-denied", "Bu route icin erisim yetkin yok.");
  }

  return routeData;
}

function readRoutePreviewSigningSecret() {
  const secret =
    process.env.ROUTE_PREVIEW_SIGNING_SECRET?.trim() ??
    process.env.MAPBOX_PROXY_SIGNING_SECRET?.trim() ??
    "";
  if (!secret) {
    throw new HttpError(
      412,
      "failed-precondition",
      "ROUTE_PREVIEW_SIGNING_SECRET_MISSING",
    );
  }
  return secret;
}

function readRoutePreviewRateWindowMs() {
  return parsePositiveIntValue(
    process.env.ROUTE_PREVIEW_RATE_WINDOW_MS,
    ROUTE_PREVIEW_RATE_WINDOW_MS_DEFAULT,
  );
}

function readRoutePreviewRateMaxCalls() {
  return parsePositiveIntValue(
    process.env.ROUTE_PREVIEW_RATE_MAX_CALLS,
    ROUTE_PREVIEW_RATE_MAX_CALLS_DEFAULT,
  );
}

function readRoutePreviewTokenTtlSeconds() {
  return parsePositiveIntValue(
    process.env.ROUTE_PREVIEW_TOKEN_TTL_SECONDS,
    ROUTE_PREVIEW_TOKEN_DEFAULT_TTL_SECONDS,
  );
}

function readRouteShareBaseUrl() {
  return (
    process.env.ROUTE_SHARE_BASE_URL?.trim() || ROUTE_SHARE_BASE_URL_DEFAULT
  ).replace(/\/+$/, "");
}

function buildRoutePreviewToken({ srvCode, nowMs }) {
  const ttlSeconds = readRoutePreviewTokenTtlSeconds();
  const expiresAtMs = nowMs + ttlSeconds * 1000;
  const expiresAtSeconds = Math.floor(expiresAtMs / 1000);
  const payload = `${srvCode}.${expiresAtSeconds}`;
  const signature = createHmac("sha256", readRoutePreviewSigningSecret())
    .update(payload)
    .digest("hex");
  return {
    token: `${payload}.${signature}`,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
  };
}

function verifyRoutePreviewToken({ srvCode, token, nowMs }) {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new HttpError(403, "permission-denied", "Route preview token bulunamadi.");
  }

  const tokenParts = token.trim().split(".");
  if (tokenParts.length !== 3) {
    throw new HttpError(403, "permission-denied", "Route preview token gecersiz.");
  }

  const [tokenSrvCodeRaw, expiresAtSecondsRaw, signature] = tokenParts;
  const tokenSrvCode = tokenSrvCodeRaw?.trim().toUpperCase();
  if (!tokenSrvCode || tokenSrvCode !== srvCode) {
    throw new HttpError(403, "permission-denied", "Route preview token kapsam hatasi.");
  }

  const expiresAtSeconds = Number.parseInt(expiresAtSecondsRaw ?? "", 10);
  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds <= 0) {
    throw new HttpError(403, "permission-denied", "Route preview token gecersiz.");
  }
  if (expiresAtSeconds * 1000 < nowMs) {
    throw new HttpError(403, "permission-denied", "Route preview token suresi dolmus.");
  }

  const payload = `${tokenSrvCode}.${expiresAtSeconds}`;
  const expectedSignature = createHmac("sha256", readRoutePreviewSigningSecret())
    .update(payload)
    .digest("hex");
  if (expectedSignature !== signature) {
    throw new HttpError(403, "permission-denied", "Route preview token imzasi gecersiz.");
  }
}

async function enforceRoutePreviewRateLimit(db, key) {
  const nowMs = Date.now();
  const ref = db.collection("_rate_limits").doc(key);
  const windowMs = readRoutePreviewRateWindowMs();
  const maxCalls = readRoutePreviewRateMaxCalls();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = asRecord(snapshot.data()) ?? {};
    const dataWindowStart = data.windowStartMs;
    const dataCount = data.count;

    let windowStartMs =
      typeof dataWindowStart === "number" && Number.isFinite(dataWindowStart)
        ? dataWindowStart
        : nowMs;
    let count = typeof dataCount === "number" && Number.isFinite(dataCount) ? dataCount : 0;

    if (nowMs - windowStartMs >= windowMs) {
      windowStartMs = nowMs;
      count = 1;
    } else {
      count += 1;
    }

    if (count > maxCalls) {
      throw new HttpError(
        429,
        "resource-exhausted",
        "Route preview limiti asildi. Lutfen daha sonra tekrar dene.",
      );
    }

    transaction.set(
      ref,
      {
        windowStartMs,
        count,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  });
}

function readRequestIpAddress(request) {
  const forwardedForHeader = request.headers["x-forwarded-for"];
  if (typeof forwardedForHeader === "string" && forwardedForHeader.trim().length > 0) {
    const first = forwardedForHeader.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return request.socket?.remoteAddress?.trim?.() || "unknown";
}

function buildAuditFingerprint(value) {
  if (!value) {
    return null;
  }
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

async function writeRouteAuditEvent(db, input) {
  await db.collection(ROUTE_AUDIT_COLLECTION).add({
    eventType: input.eventType,
    actorUid: input.actorUid ?? null,
    actorType: input.actorUid ? "authenticated" : "public",
    routeId: input.routeId ?? null,
    srvCode: input.srvCode ?? null,
    status: input.status ?? "success",
    reason: input.reason ?? null,
    requestIpHash: buildAuditFingerprint(input.requestIp ?? null),
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });
}

async function writeRouteAuditEventSafe(db, input) {
  try {
    await writeRouteAuditEvent(db, input);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "warn",
        event: "route_audit_write_failed",
        routeEventType: input.eventType,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
  }
}

function readRouteTimeSlot(value) {
  if (value === "morning" || value === "evening" || value === "midday" || value === "custom") {
    return value;
  }
  return null;
}

export async function generateRouteShareLink(db, uid, input) {
  await requireAllowedUserRole(db, uid, new Set(["driver", "passenger"]));

  const routeId = normalizeRouteId(input?.routeId);
  const customText = normalizeCustomText(input?.customText);
  const routeData = await requireRouteMember(db, routeId, uid);
  const srvCode = pickString(routeData, "srvCode");
  if (!srvCode) {
    throw new HttpError(412, "failed-precondition", "Route srvCode alani bulunamadi.");
  }

  const previewTokenBundle = buildRoutePreviewToken({
    srvCode,
    nowMs: Date.now(),
  });
  const landingUrl = `${readRouteShareBaseUrl()}/${encodeURIComponent(srvCode)}`;
  const signedLandingUrl = `${landingUrl}?t=${encodeURIComponent(previewTokenBundle.token)}`;
  const systemShareText = customText
    ? `${customText} ${signedLandingUrl}`
    : `Nerede Servis daveti: ${signedLandingUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(systemShareText)}`;

  await writeRouteAuditEvent(db, {
    eventType: "route_share_link_generated",
    actorUid: uid,
    routeId,
    srvCode,
    metadata: {
      customTextProvided: customText != null,
    },
  });

  return {
    routeId,
    srvCode,
    landingUrl,
    signedLandingUrl,
    previewToken: previewTokenBundle.token,
    previewTokenExpiresAt: previewTokenBundle.expiresAtIso,
    whatsappUrl,
    systemShareText,
  };
}

function toAuditReason(error) {
  if (error instanceof HttpError) {
    return error.code;
  }
  return "internal";
}

export async function getDynamicRoutePreview(db, request, input) {
  const srvCode = normalizeSrvCode(input?.srvCode);
  const token = typeof input?.token === "string" ? input.token : "";
  const requestIp = readRequestIpAddress(request);
  const nowMs = Date.now();

  try {
    await enforceRoutePreviewRateLimit(db, `route_preview_${srvCode}_${requestIp}`);
    verifyRoutePreviewToken({
      srvCode,
      token,
      nowMs,
    });

    const routeQuerySnapshot = await db
      .collection("routes")
      .where("srvCode", "==", srvCode)
      .where("isArchived", "==", false)
      .limit(1)
      .get();
    if (routeQuerySnapshot.empty) {
      throw new HttpError(404, "not-found", "Route preview bulunamadi.");
    }

    const routeDocument = routeQuerySnapshot.docs[0];
    const routeData = asRecord(routeDocument.data()) ?? {};
    const routeName = pickString(routeData, "name");
    if (!routeName) {
      throw new HttpError(412, "failed-precondition", "Route ad alani eksik.");
    }

    const driverUid = pickString(routeData, "driverId");
    if (!driverUid) {
      throw new HttpError(412, "failed-precondition", "Route owner bilgisi eksik.");
    }

    const [driverSnapshot, userSnapshot] = await Promise.all([
      db.collection("drivers").doc(driverUid).get(),
      db.collection("users").doc(driverUid).get(),
    ]);
    const driverData = asRecord(driverSnapshot.data());
    const userData = asRecord(userSnapshot.data());
    const driverDisplayName =
      pickString(driverData, "name") ?? pickString(userData, "displayName") ?? "Servis Soforu";

    const output = {
      routeId: routeDocument.id,
      srvCode,
      routeName,
      driverDisplayName,
      scheduledTime: pickString(routeData, "scheduledTime"),
      timeSlot: readRouteTimeSlot(routeData.timeSlot),
      allowGuestTracking: routeData.allowGuestTracking === true,
      deepLinkUrl: `neredeservis://route-preview?srvCode=${srvCode}`,
    };

    await writeRouteAuditEventSafe(db, {
      eventType: "route_preview_accessed",
      actorUid: null,
      routeId: output.routeId,
      srvCode,
      requestIp,
      metadata: {
        allowGuestTracking: output.allowGuestTracking,
      },
    });

    return output;
  } catch (error) {
    await writeRouteAuditEventSafe(db, {
      eventType: "route_preview_denied",
      actorUid: null,
      srvCode,
      status: "denied",
      reason: toAuditReason(error),
      requestIp,
    });
    throw error;
  }
}
