import { upsertAuthUserProfile } from "./auth-user-store.js";
import {
  readCompanyDriverFromPostgres,
  shouldUsePostgresCompanyFleetStore,
  syncCompanyDriverToPostgres,
} from "./company-fleet-store.js";
import { readCompanyFromPostgres } from "./company-membership-store.js";
import { createManagedUserLocally } from "./auth-local.js";
import { HttpError } from "./http.js";
import { isPostgresConfigured } from "./postgres.js";
import { pickString } from "./runtime-value.js";
import { readCompanyRouteFromPostgres, syncCompanyRouteToPostgres } from "./company-route-store.js";

const VALID_DRIVER_STATUSES = new Set(["active", "passive"]);

function requireDriverStore() {
  if (!isPostgresConfigured() || !shouldUsePostgresCompanyFleetStore()) {
    throw new HttpError(412, "failed-precondition", "Sofor depolamasi hazir degil.");
  }
}

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

function appendUniqueString(items, value) {
  const nextItems = Array.isArray(items) ? items.filter((item) => typeof item === "string") : [];
  if (!nextItems.includes(value)) {
    nextItems.push(value);
  }
  return nextItems;
}

function removeString(items, value) {
  return (Array.isArray(items) ? items : []).filter((item) => item !== value);
}

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

export async function createCompanyDriverAccount(db, actorUid, input) {
  requireDriverStore();

  const companyId = normalizeCompanyId(input?.companyId);
  const name = normalizeName(input?.name);
  const phone = normalizePhone(input?.phone);
  const plate = normalizePlate(input?.plate);
  const loginEmail = generateLoginEmail(name);
  const temporaryPassword = generateSimplePassword(name);

  const company = await readCompanyFromPostgres(companyId).catch(() => null);
  if (!company) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }

  let uid = "";
  try {
    const userRecord = await createManagedUserLocally(db, {
      email: loginEmail,
      password: temporaryPassword,
      displayName: name,
    });
    uid = userRecord.uid;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sofor hesabi olusturulamadi.";
    throw new HttpError(409, "already-exists", `Sofor hesabi olusturulamadi: ${message}`);
  }

  const nowIso = new Date().toISOString();
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

export async function assignCompanyDriverToRoute(_db, actorUid, input) {
  requireDriverStore();

  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const routeId = normalizeRouteId(input?.routeId);

  const [driver, route] = await Promise.all([
    readCompanyDriverFromPostgres(companyId, driverId).catch(() => null),
    readCompanyRouteFromPostgres(companyId, routeId).catch(() => null),
  ]);

  if (!driver) {
    throw new HttpError(404, "not-found", "Sofor bulunamadi.");
  }
  if (!route) {
    throw new HttpError(404, "not-found", "Rota bulunamadi.");
  }
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

  return { route: { routeId } };
}

export async function unassignCompanyDriverFromRoute(_db, actorUid, input) {
  requireDriverStore();

  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const routeId = normalizeRouteId(input?.routeId);

  const route = await readCompanyRouteFromPostgres(companyId, routeId).catch(() => null);
  if (!route) {
    throw new HttpError(404, "not-found", "Rota bulunamadi.");
  }

  const currentPrimaryDriverId = pickString(route, "driverId");
  const existingAuthorized = Array.isArray(route.authorizedDriverIds) ? route.authorizedDriverIds : [];
  const updatePatch = {
    authorizedDriverIds: removeString(existingAuthorized, driverId),
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

  return { route: { routeId } };
}

export async function updateCompanyDriverStatus(_db, actorUid, input) {
  requireDriverStore();

  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const status = normalizeStatus(input?.status);

  const driver = await readCompanyDriverFromPostgres(companyId, driverId).catch(() => null);
  if (!driver) {
    throw new HttpError(404, "not-found", "Sofor bulunamadi.");
  }

  const updatedAt = new Date().toISOString();
  await syncCompanyDriverToPostgres({
    driverId,
    companyId,
    name: pickString(driver, "name"),
    status,
    phone: pickString(driver, "phoneMasked"),
    plate: pickString(driver, "plateMasked"),
    loginEmail: pickString(driver, "loginEmail"),
    temporaryPassword: pickString(driver, "temporaryPassword"),
    mobileOnly: true,
    createdBy: pickString(driver, "createdBy"),
    updatedBy: actorUid,
    createdAt: pickString(driver, "createdAt"),
    updatedAt,
  });

  return { driverId, status };
}
