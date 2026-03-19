import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const VALID_DRIVER_STATUSES = new Set(["active", "passive"]);

function normalizeCompanyId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  const companyId = rawValue.trim();
  if (!companyId || companyId.length > 128) {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  return companyId;
}

function normalizeDriverId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "driverId gecersiz.");
  }

  const driverId = rawValue.trim();
  if (!driverId || driverId.length > 128) {
    throw new HttpError(400, "invalid-argument", "driverId gecersiz.");
  }

  return driverId;
}

function normalizeRouteId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "routeId gecersiz.");
  }

  const routeId = rawValue.trim();
  if (!routeId || routeId.length > 128) {
    throw new HttpError(400, "invalid-argument", "routeId gecersiz.");
  }

  return routeId;
}

function normalizeName(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "Sofor adi gecersiz.");
  }

  const name = rawValue.trim();
  if (name.length < 2 || name.length > 120) {
    throw new HttpError(400, "invalid-argument", "Sofor adi 2-120 karakter araliginda olmali.");
  }

  return name;
}

function normalizePhone(rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "Telefon bilgisi gecersiz.");
  }

  const phone = rawValue.trim();
  if (!phone) {
    return null;
  }
  if (phone.length < 3 || phone.length > 32) {
    throw new HttpError(400, "invalid-argument", "Telefon bilgisi 3-32 karakter olmali.");
  }

  return phone;
}

function normalizePlate(rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "Plaka bilgisi gecersiz.");
  }

  const plate = rawValue.trim().toUpperCase().replace(/\s+/g, "");
  if (!plate) {
    return null;
  }
  if (plate.length < 4 || plate.length > 16) {
    throw new HttpError(400, "invalid-argument", "Plaka bilgisi 4-16 karakter olmali.");
  }

  return plate;
}

function normalizeStatus(rawValue) {
  if (VALID_DRIVER_STATUSES.has(rawValue ?? "")) {
    return rawValue;
  }
  throw new HttpError(400, "invalid-argument", "Sofor durumu gecersiz.");
}

function normalizeNameForCredential(name) {
  return name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

function generateSimplePassword(name) {
  const base = normalizeNameForCredential(name).replace(/[^a-z0-9]/g, "").slice(0, 6) || "sofor";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

function generateLoginEmail(name) {
  const slug =
    normalizeNameForCredential(name)
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .replace(/\.+/g, ".")
      .slice(0, 24) || "sofor";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}.${suffix}@neredeservis.app`;
}

export async function createCompanyDriverAccount(db, actorUid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const name = normalizeName(input?.name);
  const phone = normalizePhone(input?.phone);
  const plate = normalizePlate(input?.plate);
  const loginEmail = generateLoginEmail(name);
  const temporaryPassword = generateSimplePassword(name);

  const companySnapshot = await db.collection("companies").doc(companyId).get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }

  let uid = "";
  try {
    const userRecord = await getFirebaseAdminAuth().createUser({
      email: loginEmail,
      password: temporaryPassword,
      displayName: name,
      disabled: false,
    });
    uid = userRecord.uid;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Firebase Auth kullanicisi olusturulamadi.";
    throw new HttpError(409, "already-exists", `Sofor hesabi olusturulamadi: ${message}`);
  }

  const nowIso = new Date().toISOString();
  const driverData = {
    name,
    companyId,
    status: "active",
    loginEmail,
    temporaryPassword,
    mobileOnly: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: actorUid,
    ...(phone ? { phone } : {}),
    ...(plate ? { plate } : {}),
  };

  await Promise.all([
    db.collection("drivers").doc(uid).set(driverData),
    db
      .collection("users")
      .doc(uid)
      .set(
        {
          role: "driver",
          preferredRole: "driver",
          displayName: name,
          email: loginEmail,
          phone,
          companyId,
          mobileOnlyAuth: true,
          webPanelAccess: false,
          createdAt: nowIso,
          updatedAt: nowIso,
          deletedAt: null,
        },
        { merge: true },
      ),
  ]);

  try {
    await getFirebaseAdminAuth().setCustomUserClaims(uid, { role: "driver", mobileDriver: true });
  } catch {}

  return {
    credentials: {
      driverId: uid,
      name,
      loginEmail,
      temporaryPassword,
      mobileOnly: true,
      createdAt: nowIso,
    },
  };
}

export async function assignCompanyDriverToRoute(db, actorUid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const routeId = normalizeRouteId(input?.routeId);

  const [driverSnapshot, routeSnapshot] = await Promise.all([
    db.collection("drivers").doc(driverId).get(),
    db.collection("routes").doc(routeId).get(),
  ]);

  if (!driverSnapshot.exists) {
    throw new HttpError(404, "not-found", "Sofor bulunamadi.");
  }
  if (!routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Rota bulunamadi.");
  }

  const driverData = asRecord(driverSnapshot.data()) ?? {};
  if (pickString(driverData, "companyId") !== companyId) {
    throw new HttpError(403, "permission-denied", "Sofor bu sirkete ait degil.");
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  if (pickString(routeData, "companyId") !== companyId) {
    throw new HttpError(403, "permission-denied", "Rota bu sirkete ait degil.");
  }
  if (routeData.isArchived === true) {
    throw new HttpError(412, "failed-precondition", "Arsivlenmis rotaya sofor atanamaz.");
  }

  const updatePatch = {
    authorizedDriverIds: FieldValue.arrayUnion(driverId),
    updatedAt: new Date().toISOString(),
    updatedBy: actorUid,
    ...(pickString(routeData, "driverId") ? {} : { driverId }),
  };

  await db.collection("routes").doc(routeId).update(updatePatch);
  return { route: { routeId } };
}

export async function unassignCompanyDriverFromRoute(db, actorUid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const routeId = normalizeRouteId(input?.routeId);

  const routeSnapshot = await db.collection("routes").doc(routeId).get();
  if (!routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Rota bulunamadi.");
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  if (pickString(routeData, "companyId") !== companyId) {
    throw new HttpError(403, "permission-denied", "Rota bu sirkete ait degil.");
  }

  const currentPrimaryDriverId = pickString(routeData, "driverId");
  const updatePatch = {
    authorizedDriverIds: FieldValue.arrayRemove(driverId),
    updatedAt: new Date().toISOString(),
    updatedBy: actorUid,
    ...(currentPrimaryDriverId === driverId ? { driverId: null } : {}),
  };

  await db.collection("routes").doc(routeId).update(updatePatch);
  return { route: { routeId } };
}

export async function updateCompanyDriverStatus(db, actorUid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const status = normalizeStatus(input?.status);

  const driverRef = db.collection("drivers").doc(driverId);
  const driverSnapshot = await driverRef.get();
  if (!driverSnapshot.exists) {
    throw new HttpError(404, "not-found", "Sofor bulunamadi.");
  }

  const driverData = asRecord(driverSnapshot.data()) ?? {};
  if (pickString(driverData, "companyId") !== companyId) {
    throw new HttpError(403, "permission-denied", "Sofor bu sirkete ait degil.");
  }

  await driverRef.update({
    status,
    updatedAt: new Date().toISOString(),
    updatedBy: actorUid,
  });

  return { driverId, status };
}
