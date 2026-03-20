import {
  assertCompanyMembersActiveFromPostgres,
  readCompanyMemberRoleFromPostgres,
  shouldUsePostgresCompanyStore,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const VALID_MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const VEHICLE_WRITE_ROLES = new Set(["owner", "admin", "dispatcher"]);
const ROUTE_WRITE_ROLES = new Set(["owner", "admin", "dispatcher"]);
const DRIVER_WRITE_ROLES = new Set(["owner", "admin", "dispatcher"]);

export async function requireActiveCompanyMemberRole(db, companyId, uid) {
  if (shouldUsePostgresCompanyStore()) {
    const postgresRole = await readCompanyMemberRoleFromPostgres(companyId, uid);
    if (postgresRole) {
      return postgresRole;
    }
  }

  const memberSnapshot = await db
    .collection("companies")
    .doc(companyId)
    .collection("members")
    .doc(uid)
    .get();

  if (!memberSnapshot.exists) {
    throw new HttpError(403, "permission-denied", "Bu sirket icin uye kaydi bulunamadi.");
  }

  const memberData = asRecord(memberSnapshot.data()) ?? {};
  if (pickString(memberData, "status") !== "active") {
    throw new HttpError(403, "permission-denied", "Sirket uyeligi aktif degil.");
  }

  const role = pickString(memberData, "role");
  if (!VALID_MEMBER_ROLES.has(role ?? "")) {
    throw new HttpError(412, "failed-precondition", "Sirket uye rolu gecersiz.");
  }

  return role;
}

export function requireCompanyVehicleWriteRole(role) {
  if (VEHICLE_WRITE_ROLES.has(role ?? "")) {
    return;
  }

  throw new HttpError(
    403,
    "permission-denied",
    "Bu islem icin owner, admin veya dispatcher rolu gereklidir.",
  );
}

export function requireCompanyRouteWriteRole(role) {
  if (ROUTE_WRITE_ROLES.has(role ?? "")) {
    return;
  }

  throw new HttpError(
    403,
    "permission-denied",
    "Bu islem icin owner, admin veya dispatcher rolu gereklidir.",
  );
}

export function requireCompanyDriverWriteRole(role) {
  if (DRIVER_WRITE_ROLES.has(role ?? "")) {
    return;
  }

  throw new HttpError(
    403,
    "permission-denied",
    "Bu islem icin owner, admin veya dispatcher rolu gereklidir.",
  );
}

export function requireCompanyOwnerOrAdmin(role) {
  if (role !== "owner" && role !== "admin") {
    throw new HttpError(
      403,
      "permission-denied",
      "Bu islem icin owner veya admin rolu gereklidir.",
    );
  }
}

export function normalizeVehiclePlate(rawPlate) {
  if (typeof rawPlate !== "string") {
    throw new HttpError(400, "invalid-argument", "Plaka bilgisi gecersiz.");
  }

  const plate = rawPlate.trim().toUpperCase().replace(/\s+/g, " ");
  const plateNormalized = plate.replace(/\s+/g, "");
  if (plateNormalized.length < 4) {
    throw new HttpError(400, "invalid-argument", "plate minimum 4 karakter olmalidir.");
  }

  return { plate, plateNormalized };
}

export function normalizeVehicleTextNullable(rawValue, fieldLabel = "Alan") {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} bilgisi gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  if (value.length > 80) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} maksimum 80 karakter olabilir.`);
  }

  return value;
}

export async function assertCompanyMembersExistAndActive(db, companyId, uids) {
  if (!Array.isArray(uids) || uids.length === 0) {
    return;
  }

  const uniqueUids = Array.from(
    new Set(
      uids.filter((uid) => typeof uid === "string" && uid.trim().length > 0).map((uid) => uid.trim()),
    ),
  );
  if (uniqueUids.length === 0) {
    return;
  }

  if (shouldUsePostgresCompanyStore()) {
    const postgresOk = await assertCompanyMembersActiveFromPostgres(companyId, uniqueUids);
    if (postgresOk) {
      return;
    }
  }

  const snapshots = await Promise.all(
    uniqueUids.map((uid) =>
      db.collection("companies").doc(companyId).collection("members").doc(uid).get(),
    ),
  );

  const missingOrInactive = snapshots.find((snapshot, index) => {
    if (!snapshot.exists) {
      return uniqueUids[index];
    }

    const memberData = asRecord(snapshot.data()) ?? {};
    return pickString(memberData, "status") !== "active" ? uniqueUids[index] : null;
  });

  if (missingOrInactive != null) {
    throw new HttpError(
      412,
      "failed-precondition",
      "authorizedDriverIds icinde company member olmayan veya aktif olmayan uid var.",
    );
  }
}
