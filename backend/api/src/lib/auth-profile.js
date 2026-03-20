import { readCurrentAuthSessionUser } from "./auth-session.js";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "./firebase-admin.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

function requireUid(rawUid) {
  if (typeof rawUid !== "string" || rawUid.trim().length === 0) {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }
  return rawUid.trim();
}

function normalizeDisplayName(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "Ad soyad zorunludur.");
  }

  const normalized = rawValue
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

  if (normalized.length < 2) {
    throw new HttpError(400, "invalid-argument", "Ad soyad en az 2 karakter olmalidir.");
  }
  if (normalized.length > 80) {
    throw new HttpError(400, "invalid-argument", "Ad soyad en fazla 80 karakter olabilir.");
  }

  return normalized;
}

export async function readCurrentAuthProfile(rawUid) {
  const uid = requireUid(rawUid);
  return readCurrentAuthSessionUser(uid);
}

export async function updateCurrentAuthProfile(rawUid, input) {
  const uid = requireUid(rawUid);
  const displayName = normalizeDisplayName(input?.displayName);
  const adminAuth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();

  await adminAuth.updateUser(uid, { displayName }).catch(() => {
    throw new HttpError(500, "internal", "Kullanici profili guncellenemedi.");
  });

  const [userRecord, userSnap] = await Promise.all([
    adminAuth.getUser(uid).catch(() => {
      throw new HttpError(404, "auth/user-not-found", "Kullanici hesabi bulunamadi.");
    }),
    db.collection("users").doc(uid).get().catch(() => null),
  ]);

  const existing = asRecord(userSnap?.data()) ?? {};
  const nowIso = new Date().toISOString();

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        displayName,
        email: pickString(existing, "email") ?? userRecord.email ?? null,
        createdAt: pickString(existing, "createdAt") ?? nowIso,
        updatedAt: nowIso,
        deletedAt: null,
      },
      { merge: true },
    );

  return {
    user: await readCurrentAuthSessionUser(uid),
    updatedAt: nowIso,
  };
}
