import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { findUserProfileByEmail, readUserProfileByUid, upsertAuthUserProfile } from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { lookupIdentityToolkitUserByIdToken, signInWithEmailPasswordViaIdentityToolkit } from "./identity-toolkit.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

const scryptAsync = promisify(scryptCallback);
const PASSWORD_HASH_ALGORITHM = "scrypt";

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
      emailVerified: false,
      providerData: [{ providerId: "password" }],
      signInProvider: "password",
    },
    {},
  );
  await upsertPasswordCredential(authUser.uid, email, password);
  return authUser;
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

  const legacyLogin = await signInWithEmailPasswordViaIdentityToolkit({ email, password });
  const legacyUser = await lookupIdentityToolkitUserByIdToken(legacyLogin.idToken);
  const hydratedUser = await upsertAuthUserProfile(db, legacyUser);
  await upsertPasswordCredential(hydratedUser.uid, email, password);
  return hydratedUser;
}
