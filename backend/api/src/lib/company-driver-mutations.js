import { FieldValue } from "firebase-admin/firestore";

import { upsertAuthUserProfile } from "./auth-user-store.js";
import {
  syncCompanyRouteFromFirestore,
} from "./company-route-postgres-sync.js";
import {
  readCompanyDriverFromPostgres,
  shouldUsePostgresCompanyFleetStore,
  syncCompanyDriverToPostgres,
} from "./company-fleet-store.js";
import {
  backfillCompanyFromFirestoreRecord,
  readCompanyFromPostgres,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { createManagedUserViaIdentityToolkit } from "./identity-toolkit.js";
import { asRecord, pickString } from "./runtime-value.js";
import {
  readCompanyRouteFromPostgres,
  syncCompanyRouteToPostgres,
} from "./company-route-store.js";

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

async function backfillCompanyRecordFromSnapshot(companyId, companySnapshot) {
  if (!companySnapshot?.exists) {
    return false;
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  return backfillCompanyFromFirestoreRecord({
    companyId,
    name: pickString(companyData, "name"),
    legalName: pickString(companyData, "legalName"),
    status: pickString(companyData, "status"),
    billingStatus: pickString(companyData, "billingStatus"),
    timezone: pickString(companyData, "timezone"),
    countryCode: pickString(companyData, "countryCode"),
    contactPhone: pickString(companyData, "contactPhone"),
    contactEmail: pickString(companyData, "contactEmail"),
    logoUrl: pickString(companyData, "logoUrl"),
    address: pickString(companyData, "address"),
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  });
}

async function mirrorDriverToFirestore(db, driverId, driverData) {
  try {
    await db.collection("drivers").doc(driverId).set(driverData, { merge: true });
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_driver_mirror_failed",
        driverId,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorRoutePatchToFirestore(db, routeId, patch) {
  try {
    await db.collection("routes").doc(routeId).set(patch, { merge: true });
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_route_driver_patch_mirror_failed",
        routeId,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

export async function createCompanyDriverAccount(db, actorUid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const name = normalizeName(input?.name);
  const phone = normalizePhone(input?.phone);
  const plate = normalizePlate(input?.plate);
  const loginEmail = generateLoginEmail(name);
  const temporaryPassword = generateSimplePassword(name);

  const postgresCompany = shouldUsePostgresCompanyFleetStore()
    ? await readCompanyFromPostgres(companyId).catch(() => null)
    : null;
  const companySnapshot = postgresCompany ? null : await db.collection("companies").doc(companyId).get();
  if (!postgresCompany && !companySnapshot?.exists) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }

  let uid = "";
  try {
    const userRecord = await createManagedUserViaIdentityToolkit({
      email: loginEmail,
      password: temporaryPassword,
      displayName: name,
      sendVerificationEmail: false,
    });
    uid = userRecord.localId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sofor hesabi olusturulamadi.";
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

  if (shouldUsePostgresCompanyFleetStore()) {
    if (companySnapshot?.exists) {
      await backfillCompanyRecordFromSnapshot(companyId, companySnapshot).catch(() => false);
    } else if (postgresCompany) {
      await backfillCompanyFromFirestoreRecord({
        companyId,
        name: postgresCompany.name,
        legalName: postgresCompany.legalName,
        status: postgresCompany.status,
        billingStatus: postgresCompany.billingStatus,
        billingValidUntil: postgresCompany.billingValidUntil,
        timezone: postgresCompany.timezone,
        countryCode: postgresCompany.countryCode,
        contactPhone: postgresCompany.contactPhone,
        contactEmail: postgresCompany.contactEmail,
        logoUrl: postgresCompany.logoUrl,
        address: postgresCompany.address,
        vehicleLimit: postgresCompany.vehicleLimit,
        createdBy: postgresCompany.createdBy,
        createdAt: postgresCompany.createdAt,
        updatedAt: postgresCompany.updatedAt ?? nowIso,
      }).catch(() => false);
    }

    await Promise.all([
      syncCompanyDriverToPostgres({
        driverId: uid,
        companyId,
        name,
        status: "active",
        phone,
        plate,
        loginEmail,
        temporaryPassword,
        mobileOnly: true,
        createdBy: actorUid,
        updatedBy: actorUid,
        createdAt: nowIso,
        updatedAt: nowIso,
      }),
      mirrorDriverToFirestore(db, uid, driverData),
      upsertAuthUserProfile(
        db,
        {
          uid,
          email: loginEmail,
          displayName: name,
          emailVerified: false,
          providerData: [{ providerId: "password" }],
          signInProvider: "password",
        },
        {
          role: "driver",
          preferredRole: "driver",
          phone,
          companyId,
          mobileOnlyAuth: true,
          webPanelAccess: false,
          createdAt: nowIso,
          updatedAt: nowIso,
          deletedAt: null,
        },
      ),
    ]);
  } else {
    await Promise.all([
      db.collection("drivers").doc(uid).set(driverData),
      upsertAuthUserProfile(
        db,
        {
          uid,
          email: loginEmail,
          displayName: name,
          emailVerified: false,
          providerData: [{ providerId: "password" }],
          signInProvider: "password",
        },
        {
          role: "driver",
          preferredRole: "driver",
          phone,
          companyId,
          mobileOnlyAuth: true,
          webPanelAccess: false,
          createdAt: nowIso,
          updatedAt: nowIso,
          deletedAt: null,
        },
      ),
    ]);
  }

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

  if (shouldUsePostgresCompanyFleetStore()) {
    const [driver, route] = await Promise.all([
      readCompanyDriverFromPostgres(companyId, driverId).catch(() => null),
      readCompanyRouteFromPostgres(companyId, routeId).catch(() => null),
    ]);

    if (driver && route) {
      if (route.isArchived === true) {
        throw new HttpError(412, "failed-precondition", "Arsivlenmis rotaya sofor atanamaz.");
      }

      const nextAuthorizedDriverIds = Array.from(
        new Set([...(Array.isArray(route.authorizedDriverIds) ? route.authorizedDriverIds : []), driverId]),
      );
      const updatePatch = {
        authorizedDriverIds: nextAuthorizedDriverIds,
        updatedAt: new Date().toISOString(),
        updatedBy: actorUid,
        driverId: route.driverId ?? driverId,
      };

      await syncCompanyRouteToPostgres({
        ...route,
        ...updatePatch,
        routeId,
        companyId,
        createdAt: route.createdAt ?? updatePatch.updatedAt,
        updatedAt: updatePatch.updatedAt,
      });
      await mirrorRoutePatchToFirestore(db, routeId, updatePatch);
      return { route: { routeId } };
    }
  }

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
  await syncCompanyRouteFromFirestore(db, companyId, routeId, updatePatch.updatedAt).catch(() => false);
  return { route: { routeId } };
}

export async function unassignCompanyDriverFromRoute(db, actorUid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const routeId = normalizeRouteId(input?.routeId);

  if (shouldUsePostgresCompanyFleetStore()) {
    const route = await readCompanyRouteFromPostgres(companyId, routeId).catch(() => null);
    if (route) {
      const currentPrimaryDriverId = pickString(route, "driverId");
      const existingAuthorized = Array.isArray(route.authorizedDriverIds) ? route.authorizedDriverIds : [];
      const updatePatch = {
        authorizedDriverIds: existingAuthorized.filter((uid) => uid !== driverId),
        updatedAt: new Date().toISOString(),
        updatedBy: actorUid,
        ...(currentPrimaryDriverId === driverId ? { driverId: null } : {}),
      };

      await syncCompanyRouteToPostgres({
        ...route,
        ...updatePatch,
        routeId,
        companyId,
        createdAt: route.createdAt ?? updatePatch.updatedAt,
        updatedAt: updatePatch.updatedAt,
      });
      await mirrorRoutePatchToFirestore(db, routeId, updatePatch);
      return { route: { routeId } };
    }
  }

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
  await syncCompanyRouteFromFirestore(db, companyId, routeId, updatePatch.updatedAt).catch(() => false);
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

  const updatedAt = new Date().toISOString();
  await driverRef.update({
    status,
    updatedAt,
    updatedBy: actorUid,
  });

  if (shouldUsePostgresCompanyFleetStore()) {
    await syncCompanyDriverToPostgres({
      driverId,
      companyId,
      name: pickString(driverData, "name"),
      status,
      phone: pickString(driverData, "phone"),
      plate: pickString(driverData, "plate"),
      loginEmail: pickString(driverData, "loginEmail"),
      temporaryPassword: pickString(driverData, "temporaryPassword"),
      mobileOnly: driverData.mobileOnly === true,
      createdBy: pickString(driverData, "createdBy"),
      updatedBy: actorUid,
      createdAt: pickString(driverData, "createdAt"),
      updatedAt,
    }).catch(() => false);
  }

  return { driverId, status };
}
