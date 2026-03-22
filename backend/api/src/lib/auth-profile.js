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
  const subjectRecord =
    subject && typeof subject === "object" && !Array.isArray(subject) ? subject : null;

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
    role:
      profile?.role ?? (typeof subjectRecord?.role === "string" ? subjectRecord.role : null),
    phone:
      profile?.phone ?? (typeof subjectRecord?.phone === "string" ? subjectRecord.phone : null),
    photoUrl:
      profile?.photoUrl ??
      (typeof subjectRecord?.photoUrl === "string" ? subjectRecord.photoUrl : null),
    photoPath:
      profile?.photoPath ??
      (typeof subjectRecord?.photoPath === "string" ? subjectRecord.photoPath : null),
    mobileOnlyAuth:
      profile?.mobileOnlyAuth === true || subjectRecord?.mobileOnlyAuth === true,
    webPanelAccess:
      typeof profile?.webPanelAccess === "boolean"
        ? profile.webPanelAccess
        : typeof subjectRecord?.webPanelAccess === "boolean"
          ? subjectRecord.webPanelAccess
          : null,
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

function normalizeOptionalText(rawValue, fieldLabel, maxLength = 512) {
  if (rawValue === undefined) {
    return undefined;
  }
  if (rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const normalized = rawValue.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > maxLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} cok uzun.`);
  }

  return normalized;
}

function normalizePreferredRole(rawValue) {
  if (rawValue === undefined) {
    return undefined;
  }
  if (rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "Rol bilgisi gecersiz.");
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "driver" || normalized === "passenger" || normalized === "guest") {
    return normalized;
  }

  throw new HttpError(400, "invalid-argument", "Rol bilgisi gecersiz.");
}

export async function updateCurrentAuthProfile(db, subject, input) {
  const uid = requireUid(subject);
  const displayName = normalizeDisplayName(input?.displayName);
  const phone = normalizeOptionalText(input?.phone, "Telefon", 32);
  const photoUrl = normalizeOptionalText(input?.photoUrl, "Profil fotografi adresi", 2048);
  const photoPath = normalizeOptionalText(input?.photoPath, "Profil fotografi yolu", 1024);
  const preferredRole = normalizePreferredRole(input?.preferredRole);
  const nowIso = new Date().toISOString();
  const existingProfile = await readUserProfileByUid(db, uid);
  const nextSubject = normalizeAuthSubject(subject, existingProfile);
  nextSubject.displayName = displayName;
  const resolvedRole = preferredRole ?? nextSubject.role ?? existingProfile?.role ?? null;
  if (resolvedRole) {
    nextSubject.role = resolvedRole;
  }
  if (phone !== undefined) {
    nextSubject.phone = phone;
  }
  if (photoUrl !== undefined) {
    nextSubject.photoUrl = photoUrl;
  }
  if (photoPath !== undefined) {
    nextSubject.photoPath = photoPath;
  }

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
      ...(resolvedRole != null ? { role: resolvedRole } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(photoPath !== undefined ? { photoPath } : {}),
    },
  );

  return {
    user: await readCurrentAuthSessionUser(user),
    updatedAt: nowIso,
    createdOrUpdated: true,
  };
}
