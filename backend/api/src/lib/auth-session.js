import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { HttpError } from "./http.js";

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

export function clearWebSessionCookie(response) {
  appendSetCookieHeader(response, buildCookieHeader("", 0));
}

export async function exchangeIdTokenForWebSession(response, rawIdToken) {
  const idToken = typeof rawIdToken === "string" ? rawIdToken.trim() : "";
  if (!idToken) {
    throw new HttpError(400, "invalid-argument", "idToken zorunludur.");
  }

  const adminAuth = getFirebaseAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken).catch(() => {
    throw new HttpError(401, "unauthenticated", "Oturum dogrulanamadi. Tekrar giris yap.");
  });

  if (decodedToken?.firebase?.sign_in_provider === "anonymous") {
    throw new HttpError(412, "failed-precondition", "Anonim oturum bu islem icin desteklenmiyor.");
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: WEB_SESSION_MAX_AGE_MS,
  });
  appendSetCookieHeader(response, buildCookieHeader(sessionCookie, WEB_SESSION_MAX_AGE_SECONDS));
  return decodedToken;
}

export async function readCurrentAuthSessionUser(uid) {
  if (!uid || typeof uid !== "string") {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }

  const userRecord = await getFirebaseAdminAuth().getUser(uid).catch(() => {
    throw new HttpError(404, "auth/user-not-found", "Kullanici hesabi bulunamadi.");
  });

  return {
    uid: userRecord.uid,
    email: userRecord.email ?? null,
    displayName: userRecord.displayName ?? null,
    emailVerified: userRecord.emailVerified === true,
    providerData: Array.isArray(userRecord.providerData)
      ? userRecord.providerData.map((provider) => ({
          providerId: typeof provider.providerId === "string" ? provider.providerId : null,
        }))
      : [],
  };
}
