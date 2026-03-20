import { createHash } from "node:crypto";

import {
  normalizeVehiclePlate,
  normalizeVehicleTextNullable,
} from "./company-access.js";
import {
  deleteCompanyVehicleFromPostgres,
  isCompanyVehiclesSyncedInPostgres,
  listCompanyVehiclesFromPostgres,
  replaceCompanyVehiclesForCompany,
  shouldUsePostgresCompanyFleetStore,
  syncCompanyVehicleToPostgres,
} from "./company-fleet-store.js";
import { backfillCompanyFromFirestoreRecord } from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

function parseIsoToMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeVehicleStatus(rawStatus, options = {}) {
  const allowMissing = options.allowMissing === true;
  if (rawStatus === undefined) {
    return allowMissing ? undefined : "active";
  }
  if (rawStatus === null) {
    return allowMissing ? undefined : "active";
  }
  if (rawStatus === "active" || rawStatus === "maintenance" || rawStatus === "inactive") {
    return rawStatus;
  }

  throw new HttpError(400, "invalid-argument", "Arac durumu gecerli degil.");
}

function normalizeVehicleYear(rawYear, options = {}) {
  const allowMissing = options.allowMissing === true;
  if (rawYear === undefined) {
    return allowMissing ? undefined : null;
  }
  if (rawYear === null || rawYear === "") {
    return null;
  }

  const year =
    typeof rawYear === "string" ? Number.parseInt(rawYear.trim(), 10) : Number(rawYear);
  if (!Number.isFinite(year) || !Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new HttpError(400, "invalid-argument", "year 1900-2100 araliginda olmalidir.");
  }

  return year;
}

function normalizeVehicleCapacity(rawCapacity, options = {}) {
  const allowMissing = options.allowMissing === true;
  if (rawCapacity === undefined) {
    return allowMissing ? undefined : null;
  }
  if (rawCapacity === null || rawCapacity === "") {
    return null;
  }

  const capacity =
    typeof rawCapacity === "string" ? Number.parseInt(rawCapacity.trim(), 10) : Number(rawCapacity);
  if (!Number.isFinite(capacity) || !Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
    throw new HttpError(400, "invalid-argument", "capacity 1-200 araliginda olmalidir.");
  }

  return capacity;
}

function buildVehicleItem(vehicleId, companyId, vehicleData) {
  return {
    vehicleId,
    companyId,
    plate: pickString(vehicleData, "plate") ?? "",
    status:
      pickString(vehicleData, "status") === "maintenance"
        ? "maintenance"
        : pickString(vehicleData, "status") === "inactive"
          ? "inactive"
          : "active",
    brand: pickString(vehicleData, "brand"),
    model: pickString(vehicleData, "model"),
    year: pickFiniteNumber(vehicleData, "year"),
    capacity: pickFiniteNumber(vehicleData, "capacity"),
    createdAt: pickString(vehicleData, "createdAt"),
    updatedAt: pickString(vehicleData, "updatedAt"),
  };
}

async function backfillCompanyRecordFromFirestore(db, companyId) {
  const companySnapshot = await db.collection("companies").doc(companyId).get();
  if (!companySnapshot.exists) {
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
    vehicleLimit: pickFiniteNumber(companyData, "vehicleLimit"),
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  });
}

export async function listCompanyVehicles(db, input) {
  const vehicleLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  if (shouldUsePostgresCompanyFleetStore()) {
    const vehiclesSynced = await isCompanyVehiclesSyncedInPostgres(input.companyId).catch(() => false);
    if (vehiclesSynced) {
      const items = await listCompanyVehiclesFromPostgres(input.companyId, vehicleLimit).catch(() => null);
      if (items) {
        return { items };
      }
    }
  }

  const vehiclesSnapshot = await db
    .collection("companies")
    .doc(input.companyId)
    .collection("vehicles")
    .limit(vehicleLimit)
    .get();

  const items = vehiclesSnapshot.docs
    .map((documentSnapshot) => {
      const vehicleData = asRecord(documentSnapshot.data()) ?? {};
      const plate = pickString(vehicleData, "plate");
      if (!plate) {
        return null;
      }

      const rawStatus = pickString(vehicleData, "status");
      const status =
        rawStatus === "active" || rawStatus === "maintenance" || rawStatus === "inactive"
          ? rawStatus
          : "active";

      return {
        ...buildVehicleItem(documentSnapshot.id, input.companyId, vehicleData),
      };
    })
    .filter((item) => item !== null)
    .sort((left, right) => (parseIsoToMs(right.updatedAt) ?? 0) - (parseIsoToMs(left.updatedAt) ?? 0));

  if (shouldUsePostgresCompanyFleetStore()) {
    await backfillCompanyRecordFromFirestore(db, input.companyId).catch(() => false);
    await replaceCompanyVehiclesForCompany(input.companyId, items, new Date().toISOString()).catch(
      () => false,
    );
  }

  return { items };
}

export async function createCompanyVehicle(db, actorUid, actorRole, input) {
  const ownerType = input?.ownerType ?? "company";
  if (ownerType !== "company") {
    throw new HttpError(
      412,
      "failed-precondition",
      "MVP createVehicle yalnizca ownerType=company icin desteklenir.",
    );
  }

  const { plate, plateNormalized } = normalizeVehiclePlate(input?.plate);
  const brand = normalizeVehicleTextNullable(input?.brand, "Marka");
  const model = normalizeVehicleTextNullable(input?.model, "Model");
  const year = normalizeVehicleYear(input?.year);
  const capacity = normalizeVehicleCapacity(input?.capacity);
  const status = normalizeVehicleStatus(input?.status);
  const nowIso = new Date().toISOString();
  const companyRef = db.collection("companies").doc(input.companyId);

  const result = await db.runTransaction(async (transaction) => {
    const companySnapshot = await transaction.get(companyRef);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }

    const duplicateSnapshot = await transaction.get(
      companyRef.collection("vehicles").where("plateNormalized", "==", plateNormalized).limit(1),
    );
    if (!duplicateSnapshot.empty) {
      throw new HttpError(409, "already-exists", "Bu firmada ayni plakali arac zaten var.");
    }

    const vehicleRef = companyRef.collection("vehicles").doc();
    const auditRef = db.collection("audit_logs").doc();
    const vehicleData = {
      companyId: input.companyId,
      ownerType: "company",
      plate,
      plateNormalized,
      status,
      brand,
      model,
      year,
      capacity,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actorUid,
      updatedBy: actorUid,
    };

    transaction.set(vehicleRef, vehicleData);
    transaction.set(auditRef, {
      companyId: input.companyId,
      actorUid,
      actorType: "company_member",
      eventType: "vehicle_created",
      targetType: "vehicle",
      targetId: vehicleRef.id,
      status: "success",
      reason: null,
      metadata: {
        role: actorRole,
        plate,
        vehicleStatus: status,
      },
      requestId: createHash("sha256")
        .update(`createVehicle:${actorUid}:${input.companyId}:${vehicleRef.id}:${nowIso}`)
        .digest("hex")
        .slice(0, 24),
      createdAt: nowIso,
    });

    return {
      vehicleId: vehicleRef.id,
      createdAt: nowIso,
      vehicle: buildVehicleItem(vehicleRef.id, input.companyId, vehicleData),
    };
  });

  if (shouldUsePostgresCompanyFleetStore()) {
    await backfillCompanyRecordFromFirestore(db, input.companyId).catch(() => false);
    await syncCompanyVehicleToPostgres({
      vehicleId: result.vehicleId,
      companyId: input.companyId,
      ownerType: "company",
      plate: result.vehicle.plate,
      status: result.vehicle.status,
      brand: result.vehicle.brand,
      model: result.vehicle.model,
      year: result.vehicle.year,
      capacity: result.vehicle.capacity,
      createdAt: result.vehicle.createdAt,
      updatedAt: result.vehicle.updatedAt,
      createdBy: actorUid,
      updatedBy: actorUid,
    }).catch(() => false);
  }

  return result;
}

export async function updateCompanyVehicle(db, actorUid, actorRole, input) {
  const rawPatch = asRecord(input?.patch ?? input);
  if (!rawPatch) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir patch govdesi bekleniyor.");
  }

  const patchPayload = {
    updatedAt: new Date().toISOString(),
    updatedBy: actorUid,
  };
  const changedFields = [];

  if (Object.prototype.hasOwnProperty.call(rawPatch, "plate")) {
    const { plate, plateNormalized } = normalizeVehiclePlate(rawPatch.plate);
    patchPayload.plate = plate;
    patchPayload.plateNormalized = plateNormalized;
    changedFields.push("plate");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "brand")) {
    patchPayload.brand = normalizeVehicleTextNullable(rawPatch.brand, "Marka");
    changedFields.push("brand");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "model")) {
    patchPayload.model = normalizeVehicleTextNullable(rawPatch.model, "Model");
    changedFields.push("model");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "year")) {
    patchPayload.year = normalizeVehicleYear(rawPatch.year, { allowMissing: true }) ?? null;
    changedFields.push("year");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "capacity")) {
    patchPayload.capacity =
      normalizeVehicleCapacity(rawPatch.capacity, { allowMissing: true }) ?? null;
    changedFields.push("capacity");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "status")) {
    const status = normalizeVehicleStatus(rawPatch.status, { allowMissing: true });
    if (status !== undefined) {
      patchPayload.status = status;
      changedFields.push("status");
    }
  }

  if (changedFields.length === 0) {
    throw new HttpError(400, "invalid-argument", "En az bir gecerli patch alani gonderilmelidir.");
  }

  const companyRef = db.collection("companies").doc(input.companyId);
  const vehicleRef = companyRef.collection("vehicles").doc(input.vehicleId);
  const nowIso = patchPayload.updatedAt;

  const result = await db.runTransaction(async (transaction) => {
    const [companySnapshot, vehicleSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(vehicleRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!vehicleSnapshot.exists) {
      throw new HttpError(404, "not-found", "Arac bulunamadi.");
    }

    const currentVehicleData = asRecord(vehicleSnapshot.data()) ?? {};
    const currentPlateNormalized = pickString(currentVehicleData, "plateNormalized");
    if (patchPayload.plateNormalized && patchPayload.plateNormalized !== currentPlateNormalized) {
      const duplicateSnapshot = await transaction.get(
        companyRef
          .collection("vehicles")
          .where("plateNormalized", "==", patchPayload.plateNormalized)
          .limit(1),
      );
      const duplicateOtherDocument = duplicateSnapshot.docs.find(
        (documentSnapshot) => documentSnapshot.id !== input.vehicleId,
      );
      if (duplicateOtherDocument) {
        throw new HttpError(409, "already-exists", "Bu firmada ayni plakali arac zaten var.");
      }
    }

    transaction.update(vehicleRef, patchPayload);

    const auditRef = db.collection("audit_logs").doc();
    transaction.set(auditRef, {
      companyId: input.companyId,
      actorUid,
      actorType: "company_member",
      eventType: "vehicle_updated",
      targetType: "vehicle",
      targetId: input.vehicleId,
      status: "success",
      reason: null,
      metadata: {
        role: actorRole,
        changedFields,
      },
      requestId: createHash("sha256")
        .update(`updateVehicle:${actorUid}:${input.companyId}:${input.vehicleId}:${nowIso}`)
        .digest("hex")
        .slice(0, 24),
      createdAt: nowIso,
    });

    return {
      vehicleId: input.vehicleId,
      updatedAt: nowIso,
      vehicle: buildVehicleItem(input.vehicleId, input.companyId, {
        ...currentVehicleData,
        ...patchPayload,
      }),
    };
  });

  if (shouldUsePostgresCompanyFleetStore()) {
    await syncCompanyVehicleToPostgres({
      vehicleId: result.vehicleId,
      companyId: input.companyId,
      ownerType: "company",
      plate: result.vehicle.plate,
      status: result.vehicle.status,
      brand: result.vehicle.brand,
      model: result.vehicle.model,
      year: result.vehicle.year,
      capacity: result.vehicle.capacity,
      createdAt: result.vehicle.createdAt,
      updatedAt: result.vehicle.updatedAt,
      updatedBy: actorUid,
    }).catch(() => false);
  }

  return result;
}

export async function deleteCompanyVehicle(db, actorUid, actorRole, input) {
  const companyRef = db.collection("companies").doc(input.companyId);
  const vehicleRef = companyRef.collection("vehicles").doc(input.vehicleId);
  const nowIso = new Date().toISOString();

  const result = await db.runTransaction(async (transaction) => {
    const [companySnapshot, vehicleSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(vehicleRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!vehicleSnapshot.exists) {
      throw new HttpError(404, "not-found", "Arac bulunamadi.");
    }

    const linkedRoutesSnapshot = await transaction.get(
      db
        .collection("routes")
        .where("companyId", "==", input.companyId)
        .where("vehicleId", "==", input.vehicleId)
        .limit(5),
    );
    const linkedActiveRoutes = linkedRoutesSnapshot.docs.filter((documentSnapshot) => {
      const routeData = asRecord(documentSnapshot.data()) ?? {};
      return routeData.isArchived !== true;
    });
    if (linkedActiveRoutes.length > 0) {
      throw new HttpError(
        412,
        "failed-precondition",
        "COMPANY_VEHICLE_ROUTE_LINKED_DELETE_FORBIDDEN",
      );
    }

    transaction.delete(vehicleRef);

    const auditRef = db.collection("audit_logs").doc();
    transaction.set(auditRef, {
      companyId: input.companyId,
      actorUid,
      actorType: "company_member",
      eventType: "vehicle_deleted",
      targetType: "vehicle",
      targetId: input.vehicleId,
      status: "success",
      reason: null,
      metadata: {
        role: actorRole,
      },
      requestId: createHash("sha256")
        .update(`deleteVehicle:${actorUid}:${input.companyId}:${input.vehicleId}:${nowIso}`)
        .digest("hex")
        .slice(0, 24),
      createdAt: nowIso,
    });

    return {
      vehicleId: input.vehicleId,
      deleted: true,
      deletedAt: nowIso,
    };
  });

  if (shouldUsePostgresCompanyFleetStore()) {
    await deleteCompanyVehicleFromPostgres(input.companyId, input.vehicleId).catch(() => false);
  }

  return result;
}
