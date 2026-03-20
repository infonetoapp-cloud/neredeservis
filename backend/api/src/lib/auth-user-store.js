import { HttpError } from "./http.js";
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
  };
}

export async function readUserProfileByUid(db, rawUid) {
  const uid = normalizeUid(rawUid);
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
        createdAt: existingProfile?.createdAt ?? nowIso,
        updatedAt: nowIso,
        deletedAt: null,
        ...extra,
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
