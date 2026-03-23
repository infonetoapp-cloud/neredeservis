import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { readCurrentAuthSessionUser, readWebSessionSecret } from "./auth-session.js";
import { readUserProfileByUid } from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

const MOBILE_ACCESS_TOKEN_TTL_SECONDS = Number.parseInt(
  process.env.MOBILE_ACCESS_TOKEN_TTL_SECONDS ?? "3600",
  10,
);
const MOBILE_REFRESH_TOKEN_TTL_SECONDS = Number.parseInt(
  process.env.MOBILE_REFRESH_TOKEN_TTL_SECONDS ?? String(30 * 24 * 60 * 60),
  10,
);

function readAccessTokenSecret() {
  const explicitSecret = (process.env.MOBILE_ACCESS_TOKEN_SECRET ?? "").trim();
  if (explicitSecret) {
    return explicitSecret;
  }
  return createHash("sha256").update(`mobile-access:${readWebSessionSecret()}`).digest("hex");
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

function signPayload(encodedPayload) {
  return createHmac("sha256", readAccessTokenSecret()).update(encodedPayload).digest("base64url");
}

function createSignedAccessToken(payload) {
  const encodedPayload = encodeBase64UrlJson(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function readSignedAccessTokenPayload(rawToken) {
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!token) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const encodedPayload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
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

  const expiresAtMs = Number(payload.exp ?? 0);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return null;
  }

  if (payload.typ !== "mobile_access") {
    return null;
  }

  return payload;
}

function mapSessionUserFromPayload(payload) {
  const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
  if (!uid) {
    return null;
  }

  const providerData = Array.isArray(payload.providerData)
    ? payload.providerData
        .map((provider) => {
          if (!provider || typeof provider !== "object" || Array.isArray(provider)) {
            return null;
          }
          const providerId =
            typeof provider.providerId === "string" ? provider.providerId.trim() : "";
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
    role: typeof payload.role === "string" ? payload.role : null,
    phone: typeof payload.phone === "string" ? payload.phone : null,
    photoUrl: typeof payload.photoUrl === "string" ? payload.photoUrl : null,
    photoPath: typeof payload.photoPath === "string" ? payload.photoPath : null,
    mobileOnlyAuth: payload.mobileOnlyAuth === true,
    webPanelAccess:
      typeof payload.webPanelAccess === "boolean" ? payload.webPanelAccess : null,
    isAnonymous: payload.isAnonymous === true,
  };
}

function hashRefreshToken(rawToken) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function buildAccessTokenPayload(sessionUser, expiresAtMs) {
  return {
    typ: "mobile_access",
    uid: sessionUser.uid,
    email: sessionUser.email ?? null,
    displayName: sessionUser.displayName ?? null,
    emailVerified: sessionUser.emailVerified === true,
    providerData: Array.isArray(sessionUser.providerData) ? sessionUser.providerData : [],
    signInProvider: sessionUser.signInProvider ?? null,
    role: sessionUser.role ?? null,
    phone: sessionUser.phone ?? null,
    photoUrl: sessionUser.photoUrl ?? null,
    photoPath: sessionUser.photoPath ?? null,
    mobileOnlyAuth: sessionUser.mobileOnlyAuth === true,
    webPanelAccess:
      typeof sessionUser.webPanelAccess === "boolean" ? sessionUser.webPanelAccess : null,
    isAnonymous: sessionUser.isAnonymous === true,
    iat: Date.now(),
    exp: expiresAtMs,
  };
}

async function createStoredMobileAuthUser(subject) {
  const sessionUser = await readCurrentAuthSessionUser(subject);
  if (!sessionUser?.uid) {
    throw new HttpError(401, "unauthenticated", "Oturum dogrulanamadi. Tekrar giris yap.");
  }
  return sessionUser;
}

function requireRefreshToken(rawValue) {
  const token = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!token) {
    throw new HttpError(400, "invalid-argument", "refreshToken zorunludur.");
  }
  return token;
}

function readSafeTtlSeconds(rawValue, fallbackValue) {
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : fallbackValue;
}

function mapRefreshTokenRow(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const uid = typeof row.uid === "string" ? row.uid.trim() : "";
  if (!uid) {
    return null;
  }

  return {
    tokenHash: typeof row.token_hash === "string" ? row.token_hash.trim() : "",
    uid,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    signInProvider:
      typeof row.sign_in_provider === "string" ? row.sign_in_provider.trim() : null,
    sessionData:
      row.session_data && typeof row.session_data === "object" && !Array.isArray(row.session_data)
        ? row.session_data
        : {},
  };
}

function assertActiveRefreshToken(refreshTokenRow) {
  if (!refreshTokenRow) {
    throw new HttpError(401, "unauthenticated", "Oturum suresi doldu. Tekrar giris yap.");
  }
  if (refreshTokenRow.revokedAt) {
    throw new HttpError(401, "unauthenticated", "Oturum suresi doldu. Tekrar giris yap.");
  }

  const expiresAtMs = Date.parse(String(refreshTokenRow.expiresAt ?? ""));
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    throw new HttpError(401, "unauthenticated", "Oturum suresi doldu. Tekrar giris yap.");
  }

  return refreshTokenRow;
}

async function insertRefreshTokenRow(pool, rawRefreshToken, sessionUser, options = {}) {
  const refreshTokenTtlSeconds = readSafeTtlSeconds(
    MOBILE_REFRESH_TOKEN_TTL_SECONDS,
    30 * 24 * 60 * 60,
  );
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + refreshTokenTtlSeconds * 1000).toISOString();
  const tokenHash = hashRefreshToken(rawRefreshToken);

  await pool.query(
    `
      INSERT INTO auth_refresh_tokens (
        token_hash,
        uid,
        sign_in_provider,
        client_kind,
        session_data,
        created_at,
        expires_at,
        last_used_at,
        revoked_at,
        revoke_reason,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6::timestamptz,
        $7::timestamptz,
        $6::timestamptz,
        NULL,
        NULL,
        $6::timestamptz
      )
    `,
    [
      tokenHash,
      sessionUser.uid,
      sessionUser.signInProvider ?? null,
      options.clientKind ?? "mobile",
      JSON.stringify({
        uid: sessionUser.uid,
        email: sessionUser.email ?? null,
        displayName: sessionUser.displayName ?? null,
        role: sessionUser.role ?? null,
      }),
      nowIso,
      expiresAtIso,
    ],
  );

  return { refreshToken: rawRefreshToken, expiresAtIso };
}

async function rotateRefreshToken(pool, currentTokenHash, sessionUser, options = {}) {
  const nextRefreshToken = randomBytes(32).toString("base64url");
  const issuedToken = await insertRefreshTokenRow(pool, nextRefreshToken, sessionUser, options);
  await pool.query(
    `
      UPDATE auth_refresh_tokens
      SET revoked_at = NOW(),
          revoke_reason = 'rotated',
          updated_at = NOW()
      WHERE token_hash = $1
    `,
    [currentTokenHash],
  );
  return issuedToken;
}

function buildTokenResponse(sessionUser, refreshToken, refreshExpiresAtIso) {
  const accessTokenTtlSeconds = readSafeTtlSeconds(MOBILE_ACCESS_TOKEN_TTL_SECONDS, 3600);
  const accessExpiresAtMs = Date.now() + accessTokenTtlSeconds * 1000;
  return {
    user: sessionUser,
    accessToken: createSignedAccessToken(buildAccessTokenPayload(sessionUser, accessExpiresAtMs)),
    refreshToken,
    expiresInSeconds: accessTokenTtlSeconds,
    refreshTokenExpiresAt: refreshExpiresAtIso,
    tokenType: "Bearer",
    authMode: "backend",
  };
}

export function readAuthenticatedMobileAccessToken(rawToken) {
  const payload = readSignedAccessTokenPayload(rawToken);
  if (!payload) {
    return null;
  }
  return mapSessionUserFromPayload(payload);
}

export async function issueMobileAuthTokens(db, subject, options = {}) {
  if (!isPostgresConfigured()) {
    return null;
  }

  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const sessionUser = await createStoredMobileAuthUser(subject);
  const rawRefreshToken = randomBytes(32).toString("base64url");
  const refreshTokenRecord = await insertRefreshTokenRow(pool, rawRefreshToken, sessionUser, options);
  return buildTokenResponse(
    sessionUser,
    refreshTokenRecord.refreshToken,
    refreshTokenRecord.expiresAtIso,
  );
}

export async function refreshMobileAuthTokens(db, rawRefreshToken, options = {}) {
  if (!isPostgresConfigured()) {
    throw new HttpError(412, "failed-precondition", "Mobil auth yenileme hazir degil.");
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new HttpError(412, "failed-precondition", "Mobil auth yenileme hazir degil.");
  }

  const refreshToken = requireRefreshToken(rawRefreshToken);
  const client = await pool.connect();
  const tokenHash = hashRefreshToken(refreshToken);

  try {
    await client.query("BEGIN");
    const refreshTokenResult = await client.query(
      `
        SELECT token_hash, uid, sign_in_provider, session_data, expires_at, revoked_at
        FROM auth_refresh_tokens
        WHERE token_hash = $1
        FOR UPDATE
      `,
      [tokenHash],
    );
    const currentRefreshToken = assertActiveRefreshToken(
      mapRefreshTokenRow(refreshTokenResult.rows[0] ?? null),
    );

    const latestUserProfile = await readUserProfileByUid(db, currentRefreshToken.uid);
    const sessionSubject = latestUserProfile ?? {
      uid: currentRefreshToken.uid,
      ...(currentRefreshToken.sessionData ?? {}),
      signInProvider: currentRefreshToken.signInProvider ?? null,
    };
    const sessionUser = await createStoredMobileAuthUser(sessionSubject);
    const rotatedRefreshToken = await rotateRefreshToken(
      client,
      currentRefreshToken.tokenHash,
      sessionUser,
      options,
    );

    await client.query("COMMIT");
    return buildTokenResponse(
      sessionUser,
      rotatedRefreshToken.refreshToken,
      rotatedRefreshToken.expiresAtIso,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeMobileAuthRefreshToken(rawRefreshToken, reason = "logout") {
  if (!isPostgresConfigured()) {
    return false;
  }

  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const refreshToken = requireRefreshToken(rawRefreshToken);
  const tokenHash = hashRefreshToken(refreshToken);
  const result = await pool.query(
    `
      UPDATE auth_refresh_tokens
      SET revoked_at = NOW(),
          revoke_reason = $2,
          updated_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL
    `,
    [tokenHash, reason],
  );
  return Number(result.rowCount ?? 0) > 0;
}
