import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { asRecord, pickString } from "./runtime-value.js";

function normalizeUid(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }

  const uid = rawValue.trim();
  if (!uid) {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }

  return uid;
}

function normalizeEmail(rawValue) {
  if (typeof rawValue !== "string") {
    return null;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return null;
  }

  return normalized;
}

function normalizeDisplayName(rawValue) {
  if (typeof rawValue !== "string") {
    return null;
  }

  const normalized = rawValue.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeProviderData(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((item) => {
      const provider = asRecord(item);
      const providerId = pickString(provider, "providerId");
      return providerId ? { providerId } : null;
    })
    .filter(Boolean);
}

function toIsoString(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

function toUserProfile(record) {
  const userRecord = asRecord(record) ?? {};
  const providerData = normalizeProviderData(userRecord.providerData);
  const signInProvider =
    pickString(userRecord, "signInProvider") ?? providerData[0]?.providerId ?? null;

  return {
    uid: pickString(userRecord, "uid"),
    email: normalizeEmail(userRecord.email),
    displayName: normalizeDisplayName(userRecord.displayName),
    emailVerified: userRecord.emailVerified === true,
    providerData,
    signInProvider,
    createdAt: pickString(userRecord, "createdAt"),
    updatedAt: pickString(userRecord, "updatedAt"),
    deletedAt: pickString(userRecord, "deletedAt"),
    role: pickString(userRecord, "role"),
    mobileOnlyAuth: userRecord.mobileOnlyAuth === true,
    webPanelAccess:
      typeof userRecord.webPanelAccess === "boolean" ? userRecord.webPanelAccess : null,
  };
}

function mapSqlUserRow(row) {
  const profileData = asRecord(row?.profile_data) ?? {};
  return toUserProfile({
    uid: row?.uid,
    email: row?.email,
    displayName: row?.display_name,
    emailVerified: row?.email_verified === true,
    providerData: Array.isArray(row?.provider_data) ? row.provider_data : [],
    signInProvider: row?.sign_in_provider,
    createdAt: toIsoString(row?.created_at),
    updatedAt: toIsoString(row?.updated_at),
    deletedAt: toIsoString(row?.deleted_at),
    ...profileData,
  });
}

function normalizeProfileExtras(rawValue) {
  const record = asRecord(rawValue) ?? {};
  const nextRecord = { ...record };
  delete nextRecord.uid;
  delete nextRecord.email;
  delete nextRecord.displayName;
  delete nextRecord.emailVerified;
  delete nextRecord.providerData;
  delete nextRecord.signInProvider;
  delete nextRecord.createdAt;
  delete nextRecord.updatedAt;
  delete nextRecord.deletedAt;
  return nextRecord;
}

export async function readUserProfileByUid(db, rawUid) {
  const uid = normalizeUid(rawUid);
  if (isPostgresConfigured()) {
    const pool = getPostgresPool();
    const result = await pool.query(
      `
        SELECT
          uid,
          email,
          email_lowercase,
          display_name,
          email_verified,
          provider_data,
          sign_in_provider,
          profile_data,
          created_at,
          updated_at,
          deleted_at
        FROM auth_users
        WHERE uid = $1
        LIMIT 1
      `,
      [uid],
    );
    const row = result.rows[0] ?? null;
    if (!row) {
      return null;
    }
    const profile = mapSqlUserRow(row);
    return profile.uid ? profile : null;
  }

  const snapshot = await db.collection("users").doc(uid).get().catch(() => null);
  if (!snapshot?.exists) {
    return null;
  }

  const profile = toUserProfile({
    uid,
    ...(asRecord(snapshot.data()) ?? {}),
  });
  return profile.uid ? profile : null;
}

async function queryUserProfileByEmailField(db, fieldName, email) {
  if (isPostgresConfigured()) {
    const pool = getPostgresPool();
    const columnName = fieldName === "emailLowercase" ? "email_lowercase" : "email";
    const result = await pool.query(
      `
        SELECT
          uid,
          email,
          email_lowercase,
          display_name,
          email_verified,
          provider_data,
          sign_in_provider,
          profile_data,
          created_at,
          updated_at,
          deleted_at
        FROM auth_users
        WHERE ${columnName} = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [email],
    );
    const row = result.rows[0] ?? null;
    if (!row) {
      return null;
    }
    const profile = mapSqlUserRow(row);
    return profile.uid ? profile : null;
  }

  const snapshot = await db
    .collection("users")
    .where(fieldName, "==", email)
    .limit(1)
    .get()
    .catch(() => null);
  const userSnapshot = snapshot?.docs?.[0] ?? null;
  if (!userSnapshot?.exists) {
    return null;
  }

  const profile = toUserProfile({
    uid: userSnapshot.id,
    ...(asRecord(userSnapshot.data()) ?? {}),
  });
  return profile.uid ? profile : null;
}

export async function findUserProfileByEmail(db, rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir e-posta gereklidir.");
  }

  const primaryMatch = await queryUserProfileByEmailField(db, "email", email);
  if (primaryMatch) {
    return primaryMatch;
  }

  return queryUserProfileByEmailField(db, "emailLowercase", email);
}

export async function upsertAuthUserProfile(db, authUser, extra = {}) {
  const userRecord = asRecord(authUser);
  const uid = normalizeUid(userRecord?.uid);
  const existingProfile = await readUserProfileByUid(db, uid);
  const nowIso = new Date().toISOString();
  const email = normalizeEmail(userRecord?.email) ?? existingProfile?.email ?? null;
  const displayName =
    normalizeDisplayName(userRecord?.displayName) ?? existingProfile?.displayName ?? null;
  const providerData =
    normalizeProviderData(userRecord?.providerData).length > 0
      ? normalizeProviderData(userRecord?.providerData)
      : existingProfile?.providerData ?? [];
  const signInProvider =
    (typeof userRecord?.signInProvider === "string" ? userRecord.signInProvider.trim() : "") ||
    existingProfile?.signInProvider ||
    providerData[0]?.providerId ||
    null;
  const extraRecord = asRecord(extra) ?? {};
  const createdAt = pickString(extraRecord, "createdAt") ?? existingProfile?.createdAt ?? nowIso;
  const updatedAt = pickString(extraRecord, "updatedAt") ?? nowIso;
  const deletedAt =
    Object.prototype.hasOwnProperty.call(extraRecord, "deletedAt") && extraRecord.deletedAt === null
      ? null
      : pickString(extraRecord, "deletedAt");
  const profileExtras = normalizeProfileExtras(extraRecord);

  if (isPostgresConfigured()) {
    const pool = getPostgresPool();
    await pool.query(
      `
        INSERT INTO auth_users (
          uid,
          email,
          email_lowercase,
          display_name,
          email_verified,
          provider_data,
          sign_in_provider,
          profile_data,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::jsonb,
          $7,
          $8::jsonb,
          $9::timestamptz,
          $10::timestamptz,
          $11::timestamptz
        )
        ON CONFLICT (uid) DO UPDATE
        SET
          email = EXCLUDED.email,
          email_lowercase = EXCLUDED.email_lowercase,
          display_name = EXCLUDED.display_name,
          email_verified = EXCLUDED.email_verified,
          provider_data = EXCLUDED.provider_data,
          sign_in_provider = EXCLUDED.sign_in_provider,
          profile_data = COALESCE(auth_users.profile_data, '{}'::jsonb) || EXCLUDED.profile_data,
          updated_at = EXCLUDED.updated_at,
          deleted_at = EXCLUDED.deleted_at
      `,
      [
        uid,
        email,
        email,
        displayName,
        userRecord?.emailVerified === true || existingProfile?.emailVerified === true,
        JSON.stringify(providerData),
        signInProvider,
        JSON.stringify(profileExtras),
        createdAt,
        updatedAt,
        deletedAt,
      ],
    );

    return {
      uid,
      email,
      displayName,
      emailVerified: userRecord?.emailVerified === true || existingProfile?.emailVerified === true,
      providerData,
      signInProvider,
      ...profileExtras,
    };
  }

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        uid,
        email,
        emailLowercase: email,
        displayName,
        emailVerified:
          userRecord?.emailVerified === true || existingProfile?.emailVerified === true,
        providerData,
        signInProvider,
        createdAt,
        updatedAt,
        deletedAt,
        ...profileExtras,
      },
      { merge: true },
    );

  return {
    uid,
    email,
    displayName,
    emailVerified: userRecord?.emailVerified === true || existingProfile?.emailVerified === true,
    providerData,
    signInProvider,
  };
}
