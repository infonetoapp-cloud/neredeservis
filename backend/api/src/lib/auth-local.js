import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { findUserProfileByEmail, readUserProfileByUid, upsertAuthUserProfile } from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

const scryptAsync = promisify(scryptCallback);
const PASSWORD_HASH_ALGORITHM = "scrypt";
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function requirePostgresPool() {
  if (!isPostgresConfigured()) {
    throw new HttpError(412, "failed-precondition", "Yerel auth depolamasi hazir degil.");
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new HttpError(412, "failed-precondition", "Yerel auth depolamasi hazir degil.");
  }
  return pool;
}

function requireEmail(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "auth/invalid-email", "Gecerli bir e-posta gereklidir.");
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new HttpError(400, "auth/invalid-email", "Gecerli bir e-posta gereklidir.");
  }

  return normalized;
}

function requirePassword(rawValue, { minLength = 6 } = {}) {
  if (typeof rawValue !== "string" || rawValue.length < minLength) {
    throw new HttpError(400, "auth/weak-password", `Sifre en az ${minLength} karakter olmalidir.`);
  }
  return rawValue;
}

function normalizeDisplayName(rawValue) {
  if (typeof rawValue !== "string") {
    return null;
  }
  const normalized = rawValue.trim();
  return normalized.length > 0 ? normalized : null;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${PASSWORD_HASH_ALGORITHM}$${salt}$${Buffer.from(derivedKey).toString("base64url")}`;
}

async function verifyPassword(password, storedHash) {
  const normalizedHash = typeof storedHash === "string" ? storedHash.trim() : "";
  const [algorithm, salt, encodedHash] = normalizedHash.split("$");
  if (algorithm !== PASSWORD_HASH_ALGORITHM || !salt || !encodedHash) {
    return false;
  }

  const expected = Buffer.from(encodedHash, "base64url");
  const derivedKey = Buffer.from(await scryptAsync(password, salt, expected.length));
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

async function readCredentialRowByEmail(email) {
  const pool = requirePostgresPool();
  const result = await pool.query(
    `
      SELECT uid, email_lowercase, password_hash, password_algorithm, created_at, updated_at, password_changed_at
      FROM auth_password_credentials
      WHERE email_lowercase = $1
      LIMIT 1
    `,
    [email],
  );
  return result.rows[0] ?? null;
}

async function upsertPasswordCredential(uid, email, password) {
  const pool = requirePostgresPool();
  const nowIso = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  await pool.query(
    `
      INSERT INTO auth_password_credentials (
        uid,
        email_lowercase,
        password_hash,
        password_algorithm,
        created_at,
        updated_at,
        password_changed_at
      )
      VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7::timestamptz
      )
      ON CONFLICT (uid) DO UPDATE
      SET
        email_lowercase = EXCLUDED.email_lowercase,
        password_hash = EXCLUDED.password_hash,
        password_algorithm = EXCLUDED.password_algorithm,
        updated_at = EXCLUDED.updated_at,
        password_changed_at = EXCLUDED.password_changed_at
    `,
    [uid, email, passwordHash, PASSWORD_HASH_ALGORITHM, nowIso, nowIso, nowIso],
  );
  return true;
}

function hashPasswordResetToken(rawToken) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function requirePasswordResetCode(rawValue) {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!value) {
    throw new HttpError(400, "auth/invalid-action-code", "Gecersiz veya kullanilmis link.");
  }
  return value;
}

function mapPasswordResetTokenRow(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const uid = typeof row.uid === "string" ? row.uid.trim() : "";
  const email = typeof row.email_lowercase === "string" ? row.email_lowercase.trim() : "";
  if (!uid || !email) {
    return null;
  }

  return {
    uid,
    email,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
  };
}

function assertActivePasswordResetToken(tokenRow) {
  if (!tokenRow) {
    return null;
  }

  const expiresAtMs = Date.parse(String(tokenRow.expiresAt ?? ""));
  if (!Number.isFinite(expiresAtMs)) {
    throw new HttpError(400, "auth/invalid-action-code", "Gecersiz veya kullanilmis link.");
  }
  if (tokenRow.consumedAt) {
    throw new HttpError(400, "auth/invalid-action-code", "Gecersiz veya kullanilmis link.");
  }
  if (expiresAtMs <= Date.now()) {
    throw new HttpError(400, "auth/expired-action-code", "Bu linkin suresi dolmus.");
  }

  return tokenRow;
}

async function readPasswordResetTokenRow(rawToken) {
  if (!isPostgresConfigured()) {
    return null;
  }

  const pool = requirePostgresPool();
  const tokenHash = hashPasswordResetToken(requirePasswordResetCode(rawToken));
  const result = await pool.query(
    `
      SELECT token_hash, uid, email_lowercase, expires_at, consumed_at
      FROM auth_password_reset_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash],
  );
  return mapPasswordResetTokenRow(result.rows[0] ?? null);
}

export async function createManagedUserLocally(db, input) {
  const email = requireEmail(input?.email);
  const password = requirePassword(input?.password);
  const displayName = normalizeDisplayName(input?.displayName);

  const existingUser = await findUserProfileByEmail(db, email).catch(() => null);
  if (existingUser?.uid) {
    throw new HttpError(409, "auth/email-already-in-use", "Bu e-posta ile zaten bir hesap var.");
  }

  const authUser = await upsertAuthUserProfile(
    db,
    {
      uid: `usr_${randomBytes(12).toString("hex")}`,
      email,
      displayName,
      emailVerified: true,
      providerData: [{ providerId: "password" }],
      signInProvider: "password",
    },
    {},
  );
  await upsertPasswordCredential(authUser.uid, email, password);
  return authUser;
}

export async function createAnonymousUserLocally(db, input = {}) {
  const displayName = normalizeDisplayName(input?.displayName);
  return upsertAuthUserProfile(
    db,
    {
      uid: `anon_${randomBytes(12).toString("hex")}`,
      email: null,
      displayName,
      emailVerified: false,
      providerData: [{ providerId: "anonymous" }],
      signInProvider: "anonymous",
    },
    {
      role: "guest",
      mobileOnlyAuth: true,
      webPanelAccess: false,
    },
  );
}

export async function issuePasswordResetTokenLocally(db, input) {
  const uid = typeof input?.uid === "string" ? input.uid.trim() : "";
  const email = requireEmail(input?.email);
  const createdBy = typeof input?.createdBy === "string" ? input.createdBy.trim() : null;
  if (!uid) {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }

  const pool = requirePostgresPool();
  const client = await pool.connect();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashPasswordResetToken(rawToken);
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS).toISOString();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        DELETE FROM auth_password_reset_tokens
        WHERE uid = $1 OR email_lowercase = $2
      `,
      [uid, email],
    );
    await client.query(
      `
        INSERT INTO auth_password_reset_tokens (
          token_hash,
          uid,
          email_lowercase,
          purpose,
          created_by,
          created_at,
          expires_at,
          consumed_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, 'password_reset', $4, $5::timestamptz, $6::timestamptz, NULL, $5::timestamptz
        )
      `,
      [tokenHash, uid, email, createdBy, nowIso, expiresAtIso],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }

  return {
    token: rawToken,
    expiresAt: expiresAtIso,
  };
}

export async function verifyPasswordResetCodeLocally(rawOobCode) {
  const tokenRow = assertActivePasswordResetToken(await readPasswordResetTokenRow(rawOobCode));
  if (!tokenRow) {
    return null;
  }

  return {
    uid: tokenRow.uid,
    email: tokenRow.email,
  };
}

export async function confirmPasswordResetLocally(db, input) {
  const rawToken = requirePasswordResetCode(input?.oobCode);
  const password = requirePassword(input?.password);
  const pool = requirePostgresPool();
  const client = await pool.connect();
  const tokenHash = hashPasswordResetToken(rawToken);
  const nowIso = new Date().toISOString();

  try {
    await client.query("BEGIN");
    const tokenResult = await client.query(
      `
        SELECT token_hash, uid, email_lowercase, expires_at, consumed_at
        FROM auth_password_reset_tokens
        WHERE token_hash = $1
        FOR UPDATE
      `,
      [tokenHash],
    );
    const tokenRow = assertActivePasswordResetToken(mapPasswordResetTokenRow(tokenResult.rows[0] ?? null));
    if (!tokenRow) {
      await client.query("ROLLBACK");
      return null;
    }

    const passwordHash = await hashPassword(password);
    await client.query(
      `
        INSERT INTO auth_password_credentials (
          uid,
          email_lowercase,
          password_hash,
          password_algorithm,
          created_at,
          updated_at,
          password_changed_at
        )
        VALUES (
          $1, $2, $3, $4, $5::timestamptz, $5::timestamptz, $5::timestamptz
        )
        ON CONFLICT (uid) DO UPDATE
        SET
          email_lowercase = EXCLUDED.email_lowercase,
          password_hash = EXCLUDED.password_hash,
          password_algorithm = EXCLUDED.password_algorithm,
          updated_at = EXCLUDED.updated_at,
          password_changed_at = EXCLUDED.password_changed_at
      `,
      [tokenRow.uid, tokenRow.email, passwordHash, PASSWORD_HASH_ALGORITHM, nowIso],
    );
    await client.query(
      `
        UPDATE auth_password_reset_tokens
        SET consumed_at = $2::timestamptz,
            updated_at = $2::timestamptz
        WHERE uid = $1
      `,
      [tokenRow.uid, nowIso],
    );
    await client.query("COMMIT");

    return {
      email: tokenRow.email,
      success: true,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function registerWithEmailPasswordLocally(db, input) {
  const authUser = await createManagedUserLocally(db, input);
  const user = await readUserProfileByUid(db, authUser.uid);
  if (!user?.uid) {
    throw new HttpError(500, "internal", "Kayit sonrasi kullanici okunamadi.");
  }

  return {
    user,
    verificationEmailSent: false,
  };
}

export async function signInWithEmailPasswordLocally(db, input) {
  const email = requireEmail(input?.email);
  const password = requirePassword(input?.password);

  const credentialRow = await readCredentialRowByEmail(email);
  if (credentialRow?.uid) {
    const isValid = await verifyPassword(password, credentialRow.password_hash);
    if (!isValid) {
      throw new HttpError(401, "auth/invalid-credential", "E-posta veya sifre hatali.");
    }

    const user = await readUserProfileByUid(db, credentialRow.uid);
    if (!user?.uid) {
      throw new HttpError(401, "auth/invalid-credential", "E-posta veya sifre hatali.");
    }
    return user;
  }

  const existingUser = await findUserProfileByEmail(db, email).catch(() => null);
  if (existingUser?.uid) {
    throw new HttpError(
      412,
      "auth/password-reset-required",
      "Bu hesap yeni sisteme tasindi. Lutfen sifre sifirlama baglantisi isteyip yeni sifre belirleyin.",
    );
  }

  throw new HttpError(401, "auth/invalid-credential", "E-posta veya sifre hatali.");
}
