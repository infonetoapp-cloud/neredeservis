import { readCurrentAuthProfile } from "./auth-profile.js";
import { readUserProfileByUid, upsertAuthUserProfile } from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const DRIVER_SUBSCRIPTION_FALLBACK_STATUS = "trial";

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

function hasFirestoreDb(db) {
  return Boolean(db && typeof db.collection === "function");
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

function normalizeRequiredText(rawValue, fieldLabel, minLength = 1, maxLength = 512) {
  const normalized = normalizeOptionalText(rawValue, fieldLabel, maxLength);
  if (normalized == null || normalized.length < minLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }
  return normalized;
}

function normalizeOptionalUrl(rawValue, fieldLabel) {
  const normalized = normalizeOptionalText(rawValue, fieldLabel, 2048);
  if (normalized == null || normalized === undefined) {
    return normalized;
  }

  try {
    new URL(normalized);
  } catch {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return normalized;
}

function normalizeRequiredBoolean(rawValue, fieldLabel) {
  if (typeof rawValue !== "boolean") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }
  return rawValue;
}

function normalizeConsentPlatform(rawValue) {
  const normalized = normalizeRequiredText(rawValue, "Platform", 2, 16).toLowerCase();
  if (normalized !== "android" && normalized !== "ios") {
    throw new HttpError(400, "invalid-argument", "Platform gecersiz.");
  }
  return normalized;
}

function normalizePlate(rawValue) {
  const normalized = normalizeRequiredText(rawValue, "Plaka", 2, 20)
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!normalized) {
    throw new HttpError(400, "invalid-argument", "Plaka gecersiz.");
  }
  return normalized;
}

function pickBoolean(record, key) {
  return typeof record?.[key] === "boolean" ? record[key] : null;
}

function sanitizeDriverProfile(rawValue) {
  const record = asRecord(rawValue);
  if (!record) {
    return null;
  }

  const sanitized = {
    name: pickString(record, "name"),
    phone: pickString(record, "phone"),
    plate: pickString(record, "plate")?.toUpperCase() ?? null,
    showPhoneToPassengers: pickBoolean(record, "showPhoneToPassengers"),
    photoUrl: pickString(record, "photoUrl"),
    photoPath: pickString(record, "photoPath"),
    companyId:
      Object.prototype.hasOwnProperty.call(record, "companyId") && record.companyId == null
        ? null
        : pickString(record, "companyId"),
    subscriptionStatus: pickString(record, "subscriptionStatus"),
    trialStartDate: pickString(record, "trialStartDate"),
    trialEndsAt: pickString(record, "trialEndsAt"),
    lastPaywallShownAt: pickString(record, "lastPaywallShownAt"),
    activeDeviceId: pickString(record, "activeDeviceId"),
    activeDeviceToken: pickString(record, "activeDeviceToken"),
    lastSeenAt: pickString(record, "lastSeenAt"),
    createdAt: pickString(record, "createdAt"),
    updatedAt: pickString(record, "updatedAt"),
  };

  const hasData =
    sanitized.name != null ||
    sanitized.phone != null ||
    sanitized.plate != null ||
    sanitized.showPhoneToPassengers != null ||
    sanitized.photoUrl != null ||
    sanitized.photoPath != null ||
    sanitized.companyId != null ||
    sanitized.subscriptionStatus != null ||
    sanitized.trialStartDate != null ||
    sanitized.trialEndsAt != null ||
    sanitized.lastPaywallShownAt != null ||
    sanitized.activeDeviceId != null ||
    sanitized.activeDeviceToken != null ||
    sanitized.lastSeenAt != null ||
    sanitized.createdAt != null ||
    sanitized.updatedAt != null;

  return hasData ? sanitized : null;
}

function sanitizeConsent(rawValue) {
  const record = asRecord(rawValue);
  if (!record) {
    return null;
  }

  const sanitized = {
    privacyVersion: pickString(record, "privacyVersion"),
    kvkkTextVersion: pickString(record, "kvkkTextVersion"),
    locationConsent: pickBoolean(record, "locationConsent"),
    acceptedAt: pickString(record, "acceptedAt"),
    platform: pickString(record, "platform"),
  };

  const hasData =
    sanitized.privacyVersion != null ||
    sanitized.kvkkTextVersion != null ||
    sanitized.locationConsent != null ||
    sanitized.acceptedAt != null ||
    sanitized.platform != null;

  return hasData ? sanitized : null;
}

async function readLegacyDoc(db, collectionName, uid) {
  if (!hasFirestoreDb(db)) {
    return null;
  }

  const snapshot = await db.collection(collectionName).doc(uid).get().catch(() => null);
  return asRecord(snapshot?.data()) ?? null;
}

function appendIfDefined(target, key, value) {
  if (value !== undefined) {
    target[key] = value;
  }
}

async function bestEffortMirrorUserDoc(db, uid, rawPayload) {
  if (!hasFirestoreDb(db)) {
    return;
  }

  const payload = asRecord(rawPayload);
  if (!payload) {
    return;
  }

  await db
    .collection("users")
    .doc(uid)
    .set(payload, { merge: true })
    .catch(() => null);
}

async function bestEffortMirrorDriverDoc(db, uid, rawDriverProfile, fallbackDisplayName) {
  if (!hasFirestoreDb(db)) {
    return;
  }

  const driverProfile = sanitizeDriverProfile(rawDriverProfile);
  if (!driverProfile) {
    return;
  }

  const payload = {
    name: driverProfile.name ?? fallbackDisplayName ?? "Sofor",
    phone: driverProfile.phone ?? null,
    plate: driverProfile.plate ?? null,
    showPhoneToPassengers: driverProfile.showPhoneToPassengers ?? false,
    photoUrl: driverProfile.photoUrl ?? null,
    photoPath: driverProfile.photoPath ?? null,
    companyId: driverProfile.companyId ?? null,
    subscriptionStatus:
      driverProfile.subscriptionStatus ?? DRIVER_SUBSCRIPTION_FALLBACK_STATUS,
    trialStartDate: driverProfile.trialStartDate ?? null,
    trialEndsAt: driverProfile.trialEndsAt ?? null,
    lastPaywallShownAt: driverProfile.lastPaywallShownAt ?? null,
    activeDeviceId: driverProfile.activeDeviceId ?? null,
    activeDeviceToken: driverProfile.activeDeviceToken ?? null,
    lastSeenAt: driverProfile.lastSeenAt ?? null,
    createdAt: driverProfile.createdAt ?? new Date().toISOString(),
    updatedAt: driverProfile.updatedAt ?? new Date().toISOString(),
  };

  await db
    .collection("drivers")
    .doc(uid)
    .set(payload, { merge: true })
    .catch(() => null);
}

async function bestEffortMirrorConsentDoc(db, uid, rawConsent) {
  if (!hasFirestoreDb(db)) {
    return;
  }

  const consent = sanitizeConsent(rawConsent);
  if (!consent) {
    return;
  }

  await db
    .collection("consents")
    .doc(uid)
    .set(consent, { merge: true })
    .catch(() => null);
}

async function hydrateLegacyAuthBundle(db, subject, existingProfile) {
  const uid = requireUid(subject);
  if (!hasFirestoreDb(db)) {
    return existingProfile;
  }

  const legacyUser = await readLegacyDoc(db, "users", uid);
  const legacyDriver =
    sanitizeDriverProfile(existingProfile?.driverProfile) == null
      ? sanitizeDriverProfile(await readLegacyDoc(db, "drivers", uid))
      : null;
  const legacyConsent =
    sanitizeConsent(existingProfile?.consent) == null
      ? sanitizeConsent(await readLegacyDoc(db, "consents", uid))
      : null;

  const nextExtra = {};
  const nextAuthUser = {
    uid,
  };

  let shouldHydrate = false;
  const nowIso = new Date().toISOString();

  const role = existingProfile?.role ?? pickString(legacyUser, "role");
  const displayName =
    existingProfile?.displayName ?? pickString(legacyUser, "displayName");
  const phone = existingProfile?.phone ?? pickString(legacyUser, "phone");
  const photoUrl = existingProfile?.photoUrl ?? pickString(legacyUser, "photoUrl");
  const photoPath = existingProfile?.photoPath ?? pickString(legacyUser, "photoPath");

  appendIfDefined(nextAuthUser, "email", existingProfile?.email ?? pickString(legacyUser, "email"));
  appendIfDefined(nextAuthUser, "displayName", displayName);
  appendIfDefined(nextAuthUser, "emailVerified", existingProfile?.emailVerified);
  appendIfDefined(
    nextAuthUser,
    "providerData",
    Array.isArray(existingProfile?.providerData) ? existingProfile.providerData : undefined,
  );
  appendIfDefined(
    nextAuthUser,
    "signInProvider",
    existingProfile?.signInProvider ?? pickString(legacyUser, "signInProvider"),
  );

  if (!existingProfile?.role && role) {
    nextExtra.role = role;
    shouldHydrate = true;
  }
  if (!existingProfile?.phone && phone) {
    nextExtra.phone = phone;
    shouldHydrate = true;
  }
  if (!existingProfile?.photoUrl && photoUrl) {
    nextExtra.photoUrl = photoUrl;
    shouldHydrate = true;
  }
  if (!existingProfile?.photoPath && photoPath) {
    nextExtra.photoPath = photoPath;
    shouldHydrate = true;
  }

  if (
    typeof existingProfile?.mobileOnlyAuth !== "boolean" &&
    typeof legacyUser?.mobileOnlyAuth === "boolean"
  ) {
    nextExtra.mobileOnlyAuth = legacyUser.mobileOnlyAuth;
    shouldHydrate = true;
  }
  if (
    typeof existingProfile?.webPanelAccess !== "boolean" &&
    typeof legacyUser?.webPanelAccess === "boolean"
  ) {
    nextExtra.webPanelAccess = legacyUser.webPanelAccess;
    shouldHydrate = true;
  }
  if (legacyDriver) {
    nextExtra.driverProfile = legacyDriver;
    shouldHydrate = true;
  }
  if (legacyConsent) {
    nextExtra.consent = legacyConsent;
    shouldHydrate = true;
  }

  if (!shouldHydrate) {
    return existingProfile;
  }

  nextExtra.updatedAt = nowIso;
  if (!existingProfile?.createdAt) {
    nextExtra.createdAt = pickString(legacyUser, "createdAt") ?? nowIso;
  }
  if (
    Object.prototype.hasOwnProperty.call(legacyUser ?? {}, "deletedAt") &&
    legacyUser?.deletedAt === null
  ) {
    nextExtra.deletedAt = null;
  }

  await upsertAuthUserProfile(db, nextAuthUser, nextExtra);
  return readUserProfileByUid(db, uid);
}

function buildBaseAuthUser(profile, subject, fallbackDisplayName = null) {
  return {
    uid: requireUid(subject),
    email: profile?.email ?? (typeof subject?.email === "string" ? subject.email : undefined),
    displayName:
      profile?.displayName ??
      (typeof subject?.displayName === "string" ? subject.displayName : undefined) ??
      fallbackDisplayName ??
      undefined,
    emailVerified:
      profile?.emailVerified === true ||
      (subject && typeof subject === "object" && !Array.isArray(subject)
        ? subject.emailVerified === true
        : false),
    providerData:
      Array.isArray(profile?.providerData) && profile.providerData.length > 0
        ? profile.providerData
        : subject && typeof subject === "object" && Array.isArray(subject.providerData)
          ? subject.providerData
          : undefined,
    signInProvider:
      profile?.signInProvider ??
      (typeof subject?.signInProvider === "string" ? subject.signInProvider : undefined),
  };
}

export async function readCurrentAuthBundle(db, subject) {
  const uid = requireUid(subject);
  let profile = await readUserProfileByUid(db, uid);
  profile = await hydrateLegacyAuthBundle(db, subject, profile);
  const user = await readCurrentAuthProfile(db, profile ?? subject);

  return {
    user,
    driverProfile: sanitizeDriverProfile(profile?.driverProfile),
    consent: sanitizeConsent(profile?.consent),
  };
}

export async function updateCurrentAuthConsent(db, subject, rawInput) {
  const uid = requireUid(subject);
  let profile = await readUserProfileByUid(db, uid);
  profile = await hydrateLegacyAuthBundle(db, subject, profile);

  const input = asRecord(rawInput) ?? {};
  const nowIso = new Date().toISOString();
  const currentConsent = sanitizeConsent(profile?.consent) ?? {};
  const nextConsent = {
    ...currentConsent,
    privacyVersion: normalizeRequiredText(input.privacyVersion, "Gizlilik surumu", 1, 32),
    kvkkTextVersion: normalizeRequiredText(input.kvkkTextVersion, "KVKK surumu", 1, 32),
    locationConsent: normalizeRequiredBoolean(input.locationConsent, "Konum izni"),
    platform: normalizeConsentPlatform(input.platform),
    acceptedAt: nowIso,
  };

  await upsertAuthUserProfile(db, buildBaseAuthUser(profile, subject), {
    createdAt: profile?.createdAt ?? nowIso,
    updatedAt: nowIso,
    deletedAt: profile?.deletedAt ?? null,
    consent: nextConsent,
  });
  await bestEffortMirrorConsentDoc(db, uid, nextConsent);

  return {
    uid,
    acceptedAt: nowIso,
    consent: sanitizeConsent(nextConsent),
  };
}

export async function upsertCurrentDriverProfile(db, subject, rawInput) {
  const uid = requireUid(subject);
  let profile = await readUserProfileByUid(db, uid);
  profile = await hydrateLegacyAuthBundle(db, subject, profile);

  const input = asRecord(rawInput) ?? {};
  const nowIso = new Date().toISOString();
  const currentDriverProfile = sanitizeDriverProfile(profile?.driverProfile) ?? {};
  const nextDriverProfile = {
    ...currentDriverProfile,
    name: normalizeRequiredText(input.name, "Ad soyad", 2, 80),
    phone: normalizeRequiredText(input.phone, "Telefon", 7, 24),
    plate: normalizePlate(input.plate),
    showPhoneToPassengers: normalizeRequiredBoolean(
      input.showPhoneToPassengers,
      "Telefon gorunurlugu",
    ),
    photoUrl:
      normalizeOptionalUrl(input.photoUrl, "Profil fotografi adresi") ??
      currentDriverProfile.photoUrl ??
      null,
    photoPath:
      normalizeOptionalText(input.photoPath, "Profil fotografi yolu", 256) ??
      currentDriverProfile.photoPath ??
      null,
    companyId:
      Object.prototype.hasOwnProperty.call(input, "companyId")
        ? normalizeOptionalText(input.companyId, "Sirket", 64)
        : currentDriverProfile.companyId ?? null,
    subscriptionStatus:
      currentDriverProfile.subscriptionStatus ?? DRIVER_SUBSCRIPTION_FALLBACK_STATUS,
    trialStartDate: currentDriverProfile.trialStartDate ?? null,
    trialEndsAt: currentDriverProfile.trialEndsAt ?? null,
    lastPaywallShownAt: currentDriverProfile.lastPaywallShownAt ?? null,
    activeDeviceId: currentDriverProfile.activeDeviceId ?? null,
    activeDeviceToken: currentDriverProfile.activeDeviceToken ?? null,
    lastSeenAt: currentDriverProfile.lastSeenAt ?? null,
    createdAt: currentDriverProfile.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  const user = await upsertAuthUserProfile(db, buildBaseAuthUser(profile, subject, nextDriverProfile.name), {
    createdAt: profile?.createdAt ?? nowIso,
    updatedAt: nowIso,
    deletedAt: profile?.deletedAt ?? null,
    role: "driver",
    phone: nextDriverProfile.phone,
    photoUrl: nextDriverProfile.photoUrl,
    photoPath: nextDriverProfile.photoPath,
    driverProfile: nextDriverProfile,
  });

  await bestEffortMirrorUserDoc(db, uid, {
    role: "driver",
    preferredRole: "driver",
    displayName: user.displayName ?? nextDriverProfile.name,
    phone: nextDriverProfile.phone,
    photoUrl: nextDriverProfile.photoUrl,
    photoPath: nextDriverProfile.photoPath,
    updatedAt: nowIso,
    deletedAt: null,
  });
  await bestEffortMirrorDriverDoc(db, uid, nextDriverProfile, user.displayName ?? nextDriverProfile.name);

  return {
    driverId: uid,
    updatedAt: nowIso,
    driverProfile: sanitizeDriverProfile(nextDriverProfile),
  };
}

export async function registerCurrentDriverDevice(db, subject, rawInput) {
  const uid = requireUid(subject);
  let profile = await readUserProfileByUid(db, uid);
  profile = await hydrateLegacyAuthBundle(db, subject, profile);

  const currentDriverProfile = sanitizeDriverProfile(profile?.driverProfile);
  if (!currentDriverProfile) {
    throw new HttpError(412, "failed-precondition", "Sofor profili bulunamadi.");
  }

  const input = asRecord(rawInput) ?? {};
  const nowIso = new Date().toISOString();
  const deviceId = normalizeRequiredText(input.deviceId, "Cihaz kimligi", 4, 128);
  const activeDeviceToken = normalizeRequiredText(input.activeDeviceToken, "Bildirim tokeni", 8, 4096);
  const lastSeenAt = normalizeOptionalText(input.lastSeenAt, "Son gorulme", 64) ?? nowIso;
  const previousDeviceId = currentDriverProfile.activeDeviceId ?? null;
  const previousDeviceRevoked = previousDeviceId != null && previousDeviceId !== deviceId;

  const nextDriverProfile = {
    ...currentDriverProfile,
    activeDeviceId: deviceId,
    activeDeviceToken,
    lastSeenAt,
    updatedAt: nowIso,
    createdAt: currentDriverProfile.createdAt ?? nowIso,
  };

  const fallbackDisplayName =
    currentDriverProfile.name ?? profile?.displayName ?? subject?.displayName ?? "Sofor";
  const user = await upsertAuthUserProfile(db, buildBaseAuthUser(profile, subject, fallbackDisplayName), {
    createdAt: profile?.createdAt ?? nowIso,
    updatedAt: nowIso,
    deletedAt: profile?.deletedAt ?? null,
    role: profile?.role ?? "driver",
    phone: currentDriverProfile.phone ?? profile?.phone ?? null,
    photoUrl: currentDriverProfile.photoUrl ?? profile?.photoUrl ?? null,
    photoPath: currentDriverProfile.photoPath ?? profile?.photoPath ?? null,
    driverProfile: nextDriverProfile,
  });

  await bestEffortMirrorDriverDoc(
    db,
    uid,
    nextDriverProfile,
    user.displayName ?? fallbackDisplayName,
  );

  return {
    activeDeviceId: deviceId,
    previousDeviceRevoked,
    updatedAt: nowIso,
  };
}
