import { readCurrentAuthSessionUser } from "./auth-session.js";
import { readUserProfileByUid, upsertAuthUserProfile } from "./auth-user-store.js";
import { HttpError } from "./http.js";

function requireUid(subject) {
  if (typeof subject === "string" && subject.trim().length > 0) {
    return subject.trim();
  }

  if (
    subject &&
    typeof subject === "object" &&
    !Array.isArray(subject) &&
    typeof subject.uid === "string" &&
    subject.uid.trim().length > 0
  ) {
    return subject.uid.trim();
  }

  throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
}

function normalizeAuthSubject(subject, profile) {
  const uid = requireUid(subject);
  const providerData =
    subject && typeof subject === "object" && !Array.isArray(subject) ? subject.providerData : [];

  return {
    uid,
    email: profile?.email ?? (typeof subject?.email === "string" ? subject.email : null),
    displayName:
      profile?.displayName ?? (typeof subject?.displayName === "string" ? subject.displayName : null),
    emailVerified:
      profile?.emailVerified === true ||
      (subject && typeof subject === "object" && !Array.isArray(subject)
        ? subject.emailVerified === true
        : false),
    providerData: Array.isArray(providerData) ? providerData : [],
    signInProvider:
      typeof subject?.signInProvider === "string" ? subject.signInProvider : profile?.signInProvider ?? null,
  };
}

export async function readCurrentAuthProfile(db, subject) {
  const uid = requireUid(subject);
  const profile = await readUserProfileByUid(db, uid);
  const currentSubject = normalizeAuthSubject(subject, profile);
  if (!currentSubject.uid) {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }
  return readCurrentAuthSessionUser(currentSubject);
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

export async function updateCurrentAuthProfile(db, subject, input) {
  const uid = requireUid(subject);
  const displayName = normalizeDisplayName(input?.displayName);
  const nowIso = new Date().toISOString();
  const existingProfile = await readUserProfileByUid(db, uid);
  const nextSubject = normalizeAuthSubject(subject, existingProfile);
  nextSubject.displayName = displayName;

  const user = await upsertAuthUserProfile(
    db,
    {
      ...nextSubject,
      uid,
      displayName,
    },
    {
      createdAt: existingProfile?.createdAt ?? nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    },
  );

  return {
    user: await readCurrentAuthSessionUser(user),
    updatedAt: nowIso,
  };
}
