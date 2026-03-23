import { randomUUID } from "node:crypto";

import { readUserProfileByUid, upsertAuthUserProfile } from "./auth-user-store.js";
import { readRouteBySrvCodeFromPostgres, readRouteFromPostgres } from "./company-route-store.js";
import { HttpError } from "./http.js";
import {
  deleteRoutePassengerFromPostgres,
  readRoutePassengerFromPostgres,
  readRouteSkipRequestFromPostgres,
  revokeGuestTrackingSessionInPostgres,
  shouldUsePostgresPassengerStore,
  upsertGuestTrackingSessionToPostgres,
  upsertRoutePassengerToPostgres,
  upsertRouteSkipRequestToPostgres,
} from "./passenger-store.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

const GUEST_SESSION_TTL_MINUTES_MIN = 5;
const GUEST_SESSION_TTL_MINUTES_MAX = 24 * 60;

function hasFirestoreDb(db) {
  return Boolean(db && typeof db.collection === "function");
}

function requireFirestoreDb(db) {
  if (!hasFirestoreDb(db) || typeof db.runTransaction !== "function") {
    throw new HttpError(412, "failed-precondition", "Passenger depolamasi hazir degil.");
  }
  return db;
}

function ensurePassengerStorageReady(db) {
  if (shouldUsePostgresPassengerStore()) {
    return db ?? null;
  }
  return requireFirestoreDb(db);
}

function normalizeRequiredString(rawValue, fieldLabel, maxLength = 128) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const normalized = rawValue.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return normalized;
}

function normalizeText(rawValue, fieldLabel, maxLength = 128) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const normalized = rawValue.trim();
  if (normalized.length > maxLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return normalized;
}

function normalizeOptionalString(rawValue, fieldLabel, maxLength = 128) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const normalized = normalizeText(rawValue, fieldLabel, maxLength);
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredBoolean(rawValue, fieldLabel) {
  if (typeof rawValue !== "boolean") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }
  return rawValue;
}

function normalizeGeoPoint(rawValue, fieldLabel) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const record = asRecord(rawValue);
  if (!record) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const lat = pickFiniteNumber(record, "lat");
  const lng = pickFiniteNumber(record, "lng");
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return { lat, lng };
}

function normalizeOptionalPositiveInteger(rawValue, fieldLabel) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  if (!Number.isInteger(rawValue) || rawValue <= 0) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return rawValue;
}

function clampGuestSessionTtlMinutes(rawValue) {
  if (!Number.isFinite(rawValue)) {
    return 30;
  }

  return Math.min(
    GUEST_SESSION_TTL_MINUTES_MAX,
    Math.max(GUEST_SESSION_TTL_MINUTES_MIN, Math.floor(rawValue)),
  );
}

function buildIstanbulDateKey(when = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

function pickGeoPoint(record, key) {
  const value = asRecord(record?.[key]);
  if (!value) {
    return null;
  }

  const lat = pickFiniteNumber(value, "lat");
  const lng = pickFiniteNumber(value, "lng");
  if (lat == null || lng == null) {
    return null;
  }

  return { lat, lng };
}

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function normalizeRole(rawRole) {
  switch (rawRole) {
    case "passenger":
    case "driver":
    case "guest":
    case "owner":
    case "admin":
    case "dispatcher":
    case "viewer":
      return rawRole;
    default:
      return null;
  }
}

async function readUserRoleRecord(db, uid) {
  const authProfile = await readUserProfileByUid(db, uid).catch(() => null);
  let firestoreProfile = null;

  if ((!authProfile || !pickString(authProfile, "role")) && db?.collection) {
    const snapshot = await db.collection("users").doc(uid).get().catch(() => null);
    if (snapshot?.exists) {
      firestoreProfile = asRecord(snapshot.data()) ?? {};
    }
  }

  return {
    role: normalizeRole(pickString(authProfile, "role") ?? pickString(firestoreProfile, "role")),
    displayName:
      pickString(authProfile, "displayName") ?? pickString(firestoreProfile, "displayName"),
    phone: pickString(authProfile, "phone") ?? pickString(firestoreProfile, "phone"),
    email: pickString(authProfile, "email") ?? pickString(firestoreProfile, "email"),
    createdAt: pickString(authProfile, "createdAt") ?? pickString(firestoreProfile, "createdAt"),
  };
}

async function requirePassengerRole(db, uid) {
  const userRecord = await readUserRoleRecord(db, uid);
  if (userRecord.role !== "passenger") {
    throw new HttpError(403, "permission-denied", "Yolcu erisim yetkin bulunmuyor.");
  }
  return userRecord;
}

async function findRouteBySrvCode(db, srvCode) {
  if (shouldUsePostgresPassengerStore()) {
    const postgresRoute = await readRouteBySrvCodeFromPostgres(srvCode).catch(() => null);
    if (postgresRoute && postgresRoute.isArchived !== true) {
      const routeRef = hasFirestoreDb(db) ? db.collection("routes").doc(postgresRoute.routeId) : null;
      return {
        routeId: postgresRoute.routeId,
        routeRef,
        routeData: postgresRoute,
      };
    }
  }

  const firestoreDb = requireFirestoreDb(db);
  const snapshot = await firestoreDb
    .collection("routes")
    .where("srvCode", "==", srvCode)
    .where("isArchived", "==", false)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpError(404, "not-found", "SRV kodu ile route bulunamadi.");
  }

  const documentSnapshot = snapshot.docs[0];
  if (!documentSnapshot) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  return {
    routeId: documentSnapshot.id,
    routeRef: documentSnapshot.ref,
    routeData: asRecord(documentSnapshot.data()) ?? {},
  };
}

async function readRouteById(db, routeId) {
  const normalizedRouteId = normalizeRequiredString(routeId, "routeId");
  if (shouldUsePostgresPassengerStore()) {
    const postgresRoute = await readRouteFromPostgres(normalizedRouteId).catch(() => null);
    if (postgresRoute) {
      return {
        routeId: normalizedRouteId,
        routeRef: hasFirestoreDb(db) ? db.collection("routes").doc(normalizedRouteId) : null,
        routeData: postgresRoute,
      };
    }
  }

  const firestoreDb = requireFirestoreDb(db);
  const routeRef = firestoreDb.collection("routes").doc(normalizedRouteId);
  const routeSnapshot = await routeRef.get();
  if (!routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  return {
    routeId: normalizedRouteId,
    routeRef,
    routeData: asRecord(routeSnapshot.data()) ?? {},
  };
}

function assertPassengerRouteAccess(routeData, uid, message) {
  if (pickString(routeData, "driverId") === uid) {
    throw new HttpError(403, "permission-denied", message);
  }
}

async function bestEffortMirrorPassengerToFirestore(routeRef, passengerUid, payload) {
  if (!routeRef?.collection || !passengerUid) {
    return;
  }

  await routeRef.collection("passengers").doc(passengerUid).set(payload, { merge: true }).catch(() => undefined);
}

async function bestEffortDeletePassengerFromFirestore(routeRef, passengerUid) {
  if (!routeRef?.collection || !passengerUid) {
    return;
  }

  await routeRef.collection("passengers").doc(passengerUid).delete().catch(() => undefined);
}

async function bestEffortMirrorSkipRequestToFirestore(routeRef, docId, payload) {
  if (!routeRef?.collection || !docId) {
    return;
  }

  await routeRef.collection("skip_requests").doc(docId).set(payload, { merge: true }).catch(() => undefined);
}

async function bestEffortMirrorGuestUserToFirestore(db, uid, payload) {
  if (!hasFirestoreDb(db) || !uid) {
    return;
  }

  await db.collection("users").doc(uid).set(payload, { merge: true }).catch(() => undefined);
}

async function bestEffortMirrorGuestSessionToFirestore(sessionRef, payload) {
  if (!sessionRef?.set) {
    return;
  }

  await sessionRef.set(payload, { merge: true }).catch(() => undefined);
}

async function revokeGuestSession(sessionContext, nowIso, reason) {
  if (sessionContext?.sessionId) {
    await revokeGuestTrackingSessionInPostgres(sessionContext.sessionId, {
      status: "revoked",
      revokeReason: reason,
      updatedAt: nowIso,
    }).catch(() => undefined);
  }

  if (sessionContext?.sessionRef?.set) {
    await sessionContext.sessionRef
      .set(
        {
          status: "revoked",
          revokedAt: nowIso,
          revokeReason: reason,
          updatedAt: nowIso,
        },
        { merge: true },
      )
      .catch(() => undefined);
  }
}

export async function joinPassengerRouteBySrvCode(db, uid, input) {
  const storageDb = ensurePassengerStorageReady(db);
  await requirePassengerRole(storageDb, uid);

  const normalizedInput = {
    srvCode: normalizeRequiredString(input?.srvCode, "srvCode", 40),
    name: normalizeRequiredString(input?.name, "Ad", 120),
    phone: normalizeOptionalString(input?.phone, "Telefon", 40),
    showPhoneToDriver: normalizeRequiredBoolean(
      input?.showPhoneToDriver,
      "showPhoneToDriver",
    ),
    boardingArea: normalizeText(input?.boardingArea ?? "", "Binis alani", 160),
    notificationTime: normalizeText(input?.notificationTime ?? "", "Bildirim saati", 32),
  };

  const { routeId, routeRef, routeData } = await findRouteBySrvCode(storageDb, normalizedInput.srvCode);
  assertPassengerRouteAccess(routeData, uid, "Route sahibi kendi route'una katilamaz.");
  if (routeData.isArchived === true) {
    throw new HttpError(412, "failed-precondition", "Arsivlenmis route'a katilim kapali.");
  }

  const routeName = pickString(routeData, "name") ?? "";
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresPassengerStore()) {
    const existingPassenger = await readRoutePassengerFromPostgres(routeId, uid).catch(() => null);
    await upsertRoutePassengerToPostgres({
      routeId,
      companyId: pickString(routeData, "companyId"),
      passengerUid: uid,
      name: normalizedInput.name,
      phone: normalizedInput.phone,
      showPhoneToDriver: normalizedInput.showPhoneToDriver,
      boardingArea: normalizedInput.boardingArea,
      virtualStop: existingPassenger?.virtualStop ?? null,
      virtualStopLabel: existingPassenger?.virtualStopLabel ?? null,
      notificationTime: normalizedInput.notificationTime,
      joinedAt: existingPassenger?.joinedAt ?? nowIso,
      updatedAt: nowIso,
    });

    await bestEffortMirrorPassengerToFirestore(routeRef, uid, {
      name: normalizedInput.name,
      phone: normalizedInput.phone,
      showPhoneToDriver: normalizedInput.showPhoneToDriver,
      boardingArea: normalizedInput.boardingArea,
      virtualStop: existingPassenger?.virtualStop ?? null,
      virtualStopLabel: existingPassenger?.virtualStopLabel ?? null,
      notificationTime: normalizedInput.notificationTime,
      joinedAt: existingPassenger?.joinedAt ?? nowIso,
      updatedAt: nowIso,
    });
  } else {
    const firestoreDb = requireFirestoreDb(storageDb);
    await firestoreDb.runTransaction(async (transaction) => {
      const routeSnapshot = await transaction.get(routeRef);
      if (!routeSnapshot.exists) {
        throw new HttpError(404, "not-found", "Route bulunamadi.");
      }

      const currentRoute = asRecord(routeSnapshot.data()) ?? {};
      assertPassengerRouteAccess(currentRoute, uid, "Route sahibi kendi route'una katilamaz.");
      if (currentRoute.isArchived === true) {
        throw new HttpError(412, "failed-precondition", "Arsivlenmis route'a katilim kapali.");
      }

      const passengerRef = routeRef.collection("passengers").doc(uid);
      const passengerSnapshot = await transaction.get(passengerRef);
      const existingPassenger = asRecord(passengerSnapshot.data()) ?? {};

      transaction.set(
        passengerRef,
        {
          name: normalizedInput.name,
          phone: normalizedInput.phone,
          showPhoneToDriver: normalizedInput.showPhoneToDriver,
          boardingArea: normalizedInput.boardingArea,
          virtualStop: null,
          virtualStopLabel: null,
          notificationTime: normalizedInput.notificationTime,
          joinedAt: pickString(existingPassenger, "joinedAt") ?? nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });
  }

  await upsertAuthUserProfile(
    storageDb,
    {
      uid,
      displayName: normalizedInput.name,
    },
    {
      role: "passenger",
      phone: normalizedInput.phone,
      updatedAt: nowIso,
      deletedAt: null,
    },
  ).catch(() => undefined);

  return {
    routeId,
    routeName,
    role: "passenger",
  };
}

export async function leavePassengerRoute(db, uid, input) {
  const storageDb = ensurePassengerStorageReady(db);
  await requirePassengerRole(storageDb, uid);

  const routeId = normalizeRequiredString(input?.routeId, "routeId");
  const { routeRef, routeData } = await readRouteById(storageDb, routeId);
  assertPassengerRouteAccess(routeData, uid, "Route sahibi leaveRoute kullanamaz.");
  const authorizedDriverIds = pickStringArray(routeData, "authorizedDriverIds");
  if (authorizedDriverIds.includes(uid)) {
    throw new HttpError(
      403,
      "permission-denied",
      "Yetkili sofor leaveRoute kullanamaz; route sahibi cikarmalidir.",
    );
  }

  let left = false;
  if (shouldUsePostgresPassengerStore()) {
    left = await deleteRoutePassengerFromPostgres(routeId, uid).catch(() => false);
    await bestEffortDeletePassengerFromFirestore(routeRef, uid);
  } else {
    const firestoreDb = requireFirestoreDb(storageDb);
    const passengerRef = routeRef.collection("passengers").doc(uid);
    await firestoreDb.runTransaction(async (transaction) => {
      const passengerSnapshot = await transaction.get(passengerRef);
      left = passengerSnapshot.exists;
      transaction.delete(passengerRef);
    });
  }

  return {
    routeId,
    left,
  };
}

export async function updatePassengerSettings(db, uid, input) {
  const storageDb = ensurePassengerStorageReady(db);
  await requirePassengerRole(storageDb, uid);

  const normalizedInput = {
    routeId: normalizeRequiredString(input?.routeId, "routeId"),
    showPhoneToDriver: normalizeRequiredBoolean(
      input?.showPhoneToDriver,
      "showPhoneToDriver",
    ),
    phone: normalizeOptionalString(input?.phone, "Telefon", 40),
    boardingArea: normalizeText(input?.boardingArea ?? "", "Binis alani", 160),
    notificationTime: normalizeText(input?.notificationTime ?? "", "Bildirim saati", 32),
    virtualStop: normalizeGeoPoint(input?.virtualStop, "virtualStop"),
    virtualStopLabel: normalizeOptionalString(input?.virtualStopLabel, "virtualStopLabel", 160),
  };

  const { routeRef, routeData } = await readRouteById(storageDb, normalizedInput.routeId);
  const nowIso = new Date().toISOString();
  if (pickString(routeData, "driverId") === uid) {
    throw new HttpError(
      403,
      "permission-denied",
      "Route sahibi passenger ayari guncelleyemez.",
    );
  }
  if (routeData.isArchived === true) {
    throw new HttpError(
      412,
      "failed-precondition",
      "Arsivlenmis route icin ayar guncellenemez.",
    );
  }

  if (shouldUsePostgresPassengerStore()) {
    const passengerData = await readRoutePassengerFromPostgres(normalizedInput.routeId, uid).catch(
      () => null,
    );
    if (!passengerData) {
      throw new HttpError(404, "not-found", "Passenger kaydi bulunamadi.");
    }

    const nextPassenger = {
      ...passengerData,
      phone: normalizedInput.phone ?? passengerData.phone ?? null,
      showPhoneToDriver: normalizedInput.showPhoneToDriver,
      boardingArea: normalizedInput.boardingArea,
      virtualStop: normalizedInput.virtualStop ?? passengerData.virtualStop ?? null,
      virtualStopLabel: normalizedInput.virtualStopLabel ?? passengerData.virtualStopLabel ?? null,
      notificationTime: normalizedInput.notificationTime,
      updatedAt: nowIso,
    };

    await upsertRoutePassengerToPostgres({
      routeId: normalizedInput.routeId,
      companyId: pickString(routeData, "companyId"),
      passengerUid: uid,
      name: passengerData.name,
      phone: nextPassenger.phone,
      showPhoneToDriver: nextPassenger.showPhoneToDriver,
      boardingArea: nextPassenger.boardingArea,
      virtualStop: nextPassenger.virtualStop,
      virtualStopLabel: nextPassenger.virtualStopLabel,
      notificationTime: nextPassenger.notificationTime,
      joinedAt: passengerData.joinedAt ?? nowIso,
      updatedAt: nowIso,
    });

    await bestEffortMirrorPassengerToFirestore(routeRef, uid, {
      showPhoneToDriver: nextPassenger.showPhoneToDriver,
      phone: nextPassenger.phone,
      boardingArea: nextPassenger.boardingArea,
      virtualStop: nextPassenger.virtualStop,
      virtualStopLabel: nextPassenger.virtualStopLabel,
      notificationTime: nextPassenger.notificationTime,
      updatedAt: nowIso,
    });
  } else {
    const firestoreDb = requireFirestoreDb(storageDb);
    const passengerRef = routeRef.collection("passengers").doc(uid);
    await firestoreDb.runTransaction(async (transaction) => {
      const passengerSnapshot = await transaction.get(passengerRef);
      if (!passengerSnapshot.exists) {
        throw new HttpError(404, "not-found", "Passenger kaydi bulunamadi.");
      }

      const passengerData = asRecord(passengerSnapshot.data()) ?? {};
      transaction.set(
        passengerRef,
        {
          showPhoneToDriver: normalizedInput.showPhoneToDriver,
          phone: normalizedInput.phone ?? pickString(passengerData, "phone") ?? null,
          boardingArea: normalizedInput.boardingArea,
          virtualStop: normalizedInput.virtualStop ?? pickGeoPoint(passengerData, "virtualStop"),
          virtualStopLabel:
            normalizedInput.virtualStopLabel ?? pickString(passengerData, "virtualStopLabel"),
          notificationTime: normalizedInput.notificationTime,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });
  }

  await upsertAuthUserProfile(
    storageDb,
    { uid },
    {
      role: "passenger",
      ...(normalizedInput.phone ? { phone: normalizedInput.phone } : {}),
      updatedAt: nowIso,
      deletedAt: null,
    },
  ).catch(() => undefined);

  return {
    routeId: normalizedInput.routeId,
    updatedAt: nowIso,
  };
}

export async function submitPassengerSkipToday(db, uid, input) {
  const storageDb = ensurePassengerStorageReady(db);
  await requirePassengerRole(storageDb, uid);

  const normalizedInput = {
    routeId: normalizeRequiredString(input?.routeId, "routeId"),
    dateKey: normalizeRequiredString(input?.dateKey, "dateKey", 32),
    idempotencyKey: normalizeRequiredString(input?.idempotencyKey, "idempotencyKey", 120),
  };

  const now = new Date();
  const nowIso = now.toISOString();
  const todayKey = buildIstanbulDateKey(now);
  if (normalizedInput.dateKey !== todayKey) {
    throw new HttpError(
      412,
      "failed-precondition",
      `submitSkipToday sadece bugun icin kabul edilir. beklenenDateKey=${todayKey}`,
    );
  }

  const { routeRef, routeData } = await readRouteById(storageDb, normalizedInput.routeId);
  if (routeData.isArchived === true) {
    throw new HttpError(
      412,
      "failed-precondition",
      "Arsivlenmis route icin skip kaydi acilamaz.",
    );
  }

  if (shouldUsePostgresPassengerStore()) {
    const passengerData = await readRoutePassengerFromPostgres(normalizedInput.routeId, uid).catch(
      () => null,
    );
    if (!passengerData) {
      throw new HttpError(
        403,
        "permission-denied",
        "Bu route icin passenger kaydin bulunmuyor.",
      );
    }

    const existingSkipRequest = await readRouteSkipRequestFromPostgres(
      normalizedInput.routeId,
      uid,
      normalizedInput.dateKey,
    ).catch(() => null);
    const idempotencyKey = existingSkipRequest?.idempotencyKey ?? normalizedInput.idempotencyKey;
    await upsertRouteSkipRequestToPostgres({
      routeId: normalizedInput.routeId,
      companyId: pickString(routeData, "companyId"),
      passengerUid: uid,
      dateKey: normalizedInput.dateKey,
      status: "skip_today",
      idempotencyKey,
      createdAt: existingSkipRequest?.createdAt ?? nowIso,
      updatedAt: nowIso,
    });

    await bestEffortMirrorSkipRequestToFirestore(routeRef, `${uid}_${normalizedInput.dateKey}`, {
      passengerId: uid,
      dateKey: normalizedInput.dateKey,
      status: "skip_today",
      idempotencyKey,
      createdAt: existingSkipRequest?.createdAt ?? nowIso,
      updatedAt: nowIso,
    });
  } else {
    const firestoreDb = requireFirestoreDb(storageDb);
    const passengerRef = routeRef.collection("passengers").doc(uid);
    const skipRequestRef = routeRef
      .collection("skip_requests")
      .doc(`${uid}_${normalizedInput.dateKey}`);

    await firestoreDb.runTransaction(async (transaction) => {
      const passengerSnapshot = await transaction.get(passengerRef);
      if (!passengerSnapshot.exists) {
        throw new HttpError(
          403,
          "permission-denied",
          "Bu route icin passenger kaydin bulunmuyor.",
        );
      }

      const skipRequestSnapshot = await transaction.get(skipRequestRef);
      const existingSkipRequest = asRecord(skipRequestSnapshot.data()) ?? {};
      const existingPassengerId = pickString(existingSkipRequest, "passengerId");
      const existingDateKey = pickString(existingSkipRequest, "dateKey");
      if (
        skipRequestSnapshot.exists &&
        (existingPassengerId !== uid || existingDateKey !== normalizedInput.dateKey)
      ) {
        throw new HttpError(
          412,
          "failed-precondition",
          "skip_requests kaydi beklenmeyen kimlik iceriyor.",
        );
      }

      transaction.set(
        skipRequestRef,
        {
          passengerId: uid,
          dateKey: normalizedInput.dateKey,
          status: "skip_today",
          idempotencyKey:
            pickString(existingSkipRequest, "idempotencyKey") ?? normalizedInput.idempotencyKey,
          createdAt: pickString(existingSkipRequest, "createdAt") ?? nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });
  }

  return {
    routeId: normalizedInput.routeId,
    dateKey: normalizedInput.dateKey,
    status: "skip_today",
  };
}

export async function createGuestSession({
  db,
  uid,
  authUser,
  input,
  guestSessionTtlMinutesDefault,
}) {
  const storageDb = ensurePassengerStorageReady(db);
  const normalizedInput = {
    srvCode: normalizeRequiredString(input?.srvCode, "srvCode", 40),
    name: normalizeOptionalString(input?.name, "Ad", 120),
    ttlMinutes: normalizeOptionalPositiveInteger(input?.ttlMinutes, "ttlMinutes"),
  };

  const { routeId, routeData } = await findRouteBySrvCode(storageDb, normalizedInput.srvCode);
  if (routeData.allowGuestTracking !== true) {
    throw new HttpError(403, "permission-denied", "Bu route icin misafir takip kapali.");
  }

  const existingUserRecord = await readUserRoleRecord(storageDb, uid);
  const nowMs = Date.now();
  const ttlMinutes = clampGuestSessionTtlMinutes(
    normalizedInput.ttlMinutes ?? guestSessionTtlMinutesDefault,
  );
  const expiresAtMs = nowMs + ttlMinutes * 60_000;
  const nowIso = new Date(nowMs).toISOString();
  const expiresAtIso = new Date(expiresAtMs).toISOString();
  const routeName = pickString(routeData, "name") ?? "Misafir Takip";
  const sessionId =
    hasFirestoreDb(storageDb) && storageDb.collection("guest_sessions")?.doc
      ? storageDb.collection("guest_sessions").doc().id
      : randomUUID();
  const sessionRef =
    hasFirestoreDb(storageDb) && storageDb.collection("guest_sessions")?.doc
      ? storageDb.collection("guest_sessions").doc(sessionId)
      : null;

  const guestDisplayName = normalizedInput.name ?? existingUserRecord.displayName ?? "Misafir";
  const effectiveRole =
    existingUserRecord.role == null || existingUserRecord.role === "guest"
      ? "guest"
      : existingUserRecord.role;
  const userPhone = existingUserRecord.phone ?? null;
  const userEmail = existingUserRecord.email ?? null;
  const userCreatedAt = existingUserRecord.createdAt ?? nowIso;
  const sessionContext = {
    sessionId,
    sessionRef,
  };

  if (shouldUsePostgresPassengerStore()) {
    await upsertGuestTrackingSessionToPostgres({
      sessionId,
      routeId,
      companyId: pickString(routeData, "companyId"),
      routeName,
      guestUid: uid,
      guestDisplayName,
      expiresAt: expiresAtIso,
      status: "active",
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    if (effectiveRole === "guest") {
      await bestEffortMirrorGuestUserToFirestore(storageDb, uid, {
        role: "guest",
        displayName: guestDisplayName,
        phone: userPhone,
        email: userEmail,
        createdAt: userCreatedAt,
        updatedAt: nowIso,
        deletedAt: null,
      });
    }

    await bestEffortMirrorGuestSessionToFirestore(sessionRef, {
      routeId,
      routeName,
      guestUid: uid,
      guestDisplayName,
      expiresAt: expiresAtIso,
      status: "active",
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  } else {
    const firestoreDb = requireFirestoreDb(storageDb);
    const userRef = firestoreDb.collection("users").doc(uid);

    await firestoreDb.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const existingUser = asRecord(userSnapshot.data()) ?? {};
      const existingRole =
        normalizeRole(pickString(existingUser, "role")) ?? existingUserRecord.role;

      if (!userSnapshot.exists || existingRole == null || existingRole === "guest") {
        transaction.set(
          userRef,
          {
            role: "guest",
            displayName: guestDisplayName,
            phone: pickString(existingUser, "phone") ?? userPhone,
            email: pickString(existingUser, "email") ?? userEmail,
            createdAt: pickString(existingUser, "createdAt") ?? userCreatedAt,
            updatedAt: nowIso,
            deletedAt: null,
          },
          { merge: true },
        );
      }

      transaction.set(
        sessionRef,
        {
          routeId,
          routeName,
          guestUid: uid,
          guestDisplayName,
          expiresAt: expiresAtIso,
          status: "active",
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });
  }

  try {
    await upsertAuthUserProfile(
      storageDb,
      {
        ...(asRecord(authUser) ?? {}),
        uid,
        displayName: guestDisplayName,
        ...(userEmail ? { email: userEmail } : {}),
      },
      {
        role: effectiveRole,
        ...(userPhone ? { phone: userPhone } : {}),
        createdAt: userCreatedAt,
        updatedAt: nowIso,
        deletedAt: null,
      },
    );
  } catch {
    await revokeGuestSession(sessionContext, nowIso, "auth_profile_sync_failed");
    throw new HttpError(500, "internal", "Misafir oturumu hazirlanamadi.");
  }

  return {
    sessionId,
    routeId,
    routeName,
    guestDisplayName,
    expiresAt: expiresAtIso,
    trackingPath: `/api/guest-sessions/${sessionId}/tracking`,
    rtdbReadPath: null,
  };
}
