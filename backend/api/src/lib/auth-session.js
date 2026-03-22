import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { HttpError } from "./http.js";
import { lookupIdentityToolkitUserByIdToken } from "./identity-toolkit.js";

const WEB_SESSION_COOKIE_NAME = "ns_session_token";
const WEB_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const WEB_SESSION_MAX_AGE_MS = WEB_SESSION_MAX_AGE_SECONDS * 1000;

function shouldUseSecureCookies() {
  const rawOverride = (process.env.WEB_SESSION_COOKIE_SECURE ?? "").trim().toLowerCase();
  if (rawOverride === "false" || rawOverride === "0" || rawOverride === "no") {
    return false;
  }
  if (rawOverride === "true" || rawOverride === "1" || rawOverride === "yes") {
    return true;
  }
  return (process.env.NODE_ENV ?? "").trim() === "production";
}

function buildCookieHeader(value, maxAgeSeconds) {
  const parts = [
    `${WEB_SESSION_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (shouldUseSecureCookies()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function appendSetCookieHeader(response, cookieHeaderValue) {
  const existing = response.getHeader("Set-Cookie");
  if (!existing) {
    response.setHeader("Set-Cookie", cookieHeaderValue);
    return;
  }
  if (Array.isArray(existing)) {
    response.setHeader("Set-Cookie", [...existing, cookieHeaderValue]);
    return;
  }
  response.setHeader("Set-Cookie", [existing, cookieHeaderValue]);
}

function readWebSessionSecret() {
  const explicitSecret = (process.env.WEB_SESSION_SECRET ?? "").trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  const legacyFallbackSeed =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    "";
  if (legacyFallbackSeed) {
    return createHash("sha256").update(legacyFallbackSeed).digest("hex");
  }

  throw new HttpError(500, "internal", "WEB_SESSION_SECRET sunucu degiskeni tanimlanmamis.");
}

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function signWebSessionPayload(encodedPayload) {
  return createHmac("sha256", readWebSessionSecret()).update(encodedPayload).digest("base64url");
}

function createSignedWebSessionToken(payload) {
  const encodedPayload = encodeBase64UrlJson(payload);
  const signature = signWebSessionPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function readSignedWebSessionPayload(rawCookieValue) {
  const cookieValue = typeof rawCookieValue === "string" ? rawCookieValue.trim() : "";
  if (!cookieValue) {
    return null;
  }

  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const encodedPayload = cookieValue.slice(0, separatorIndex);
  const signature = cookieValue.slice(separatorIndex + 1);
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signWebSessionPayload(encodedPayload);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = decodeBase64UrlJson(encodedPayload);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const expiresAtMs = Number((payload).exp ?? 0);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return null;
  }

  return payload;
}

function parseCookieHeader(rawCookieHeader) {
  if (!rawCookieHeader || typeof rawCookieHeader !== "string") {
    return new Map();
  }

  const cookies = new Map();
  for (const segment of rawCookieHeader.split(";")) {
    const separatorIndex = segment.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = segment.slice(0, separatorIndex).trim();
    const value = segment.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }
    cookies.set(key, value);
  }
  return cookies;
}

export function readWebSessionCookie(request) {
  const cookies = parseCookieHeader(request.headers.cookie ?? "");
  const cookieValue = cookies.get(WEB_SESSION_COOKIE_NAME) ?? "";
  return cookieValue.trim() || null;
}

export function readAuthenticatedWebSession(request) {
  const payload = readSignedWebSessionPayload(readWebSessionCookie(request));
  if (!payload) {
    return null;
  }

  const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
  if (!uid) {
    return null;
  }

  const providerData = Array.isArray(payload.providerData)
    ? payload.providerData
        .map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return null;
          }
          const providerId = typeof item.providerId === "string" ? item.providerId.trim() : "";
          return providerId ? { providerId } : null;
        })
        .filter(Boolean)
    : [];

  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : null,
    displayName: typeof payload.displayName === "string" ? payload.displayName : null,
    emailVerified: payload.emailVerified === true,
    providerData,
    signInProvider: typeof payload.signInProvider === "string" ? payload.signInProvider : null,
  };
}

export function clearWebSessionCookie(response) {
  appendSetCookieHeader(response, buildCookieHeader("", 0));
}

export function exchangeAuthenticatedUserForWebSession(response, sessionUser) {
  if (!sessionUser.uid) {
    throw new HttpError(401, "unauthenticated", "Oturum dogrulanamadi. Tekrar giris yap.");
  }
  if (sessionUser.signInProvider === "anonymous") {
    throw new HttpError(412, "failed-precondition", "Anonim oturum bu islem icin desteklenmiyor.");
  }

  const now = Date.now();
  const sessionCookie = createSignedWebSessionToken({
    uid: sessionUser.uid,
    email: sessionUser.email,
    displayName: sessionUser.displayName,
    emailVerified: sessionUser.emailVerified === true,
    providerData: Array.isArray(sessionUser.providerData) ? sessionUser.providerData : [],
    signInProvider: sessionUser.signInProvider ?? null,
    iat: now,
    exp: now + WEB_SESSION_MAX_AGE_MS,
  });
  appendSetCookieHeader(response, buildCookieHeader(sessionCookie, WEB_SESSION_MAX_AGE_SECONDS));
  return sessionUser;
}

export async function exchangeIdTokenForWebSession(response, rawIdToken) {
  const idToken = typeof rawIdToken === "string" ? rawIdToken.trim() : "";
  if (!idToken) {
    throw new HttpError(400, "invalid-argument", "idToken zorunludur.");
  }

  const sessionUser = await lookupIdentityToolkitUserByIdToken(idToken);
  return exchangeAuthenticatedUserForWebSession(response, sessionUser);
}

export async function readCurrentAuthSessionUser(subject) {
  if (subject && typeof subject === "object" && !Array.isArray(subject)) {
    const uid = typeof subject.uid === "string" ? subject.uid.trim() : "";
    if (uid) {
      const role = typeof subject.role === "string" ? subject.role.trim() : "";
      const phone = typeof subject.phone === "string" ? subject.phone.trim() : "";
      const photoUrl = typeof subject.photoUrl === "string" ? subject.photoUrl.trim() : "";
      const photoPath = typeof subject.photoPath === "string" ? subject.photoPath.trim() : "";
      return {
        uid,
        email: typeof subject.email === "string" ? subject.email : null,
        displayName: typeof subject.displayName === "string" ? subject.displayName : null,
        emailVerified: subject.emailVerified === true,
        providerData: Array.isArray(subject.providerData)
          ? subject.providerData
              .map((provider) => {
                if (!provider || typeof provider !== "object" || Array.isArray(provider)) {
                  return null;
                }
                const providerId =
                  typeof provider.providerId === "string" ? provider.providerId.trim() : "";
                return providerId ? { providerId } : null;
              })
              .filter(Boolean)
          : [],
        role: role || null,
        phone: phone || null,
        photoUrl: photoUrl || null,
        photoPath: photoPath || null,
        mobileOnlyAuth: subject.mobileOnlyAuth === true,
        webPanelAccess:
          typeof subject.webPanelAccess === "boolean" ? subject.webPanelAccess : null,
      };
    }
  }

  if (!subject || typeof subject !== "string") {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }
  throw new HttpError(404, "auth/user-not-found", "Kullanici hesabi bulunamadi.");
}
