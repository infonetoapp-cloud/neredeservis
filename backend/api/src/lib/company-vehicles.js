import { createHash, randomUUID } from "node:crypto";

import {
  normalizeVehiclePlate,
  normalizeVehicleTextNullable,
} from "./company-access.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import {
  deleteCompanyVehicleFromPostgres,
  listCompanyVehiclesFromPostgres,
  shouldUsePostgresCompanyFleetStore,
  syncCompanyVehicleToPostgres,
} from "./company-fleet-store.js";
import { HttpError } from "./http.js";
import { getPostgresPool } from "./postgres.js";

function requireVehicleStore() {
  if (!shouldUsePostgresCompanyFleetStore()) {
    throw new HttpError(412, "failed-precondition", "Arac depolamasi hazir degil.");
  }
}

function normalizeVehicleStatus(rawStatus, options = {}) {
  const allowMissing = options.allowMissing === true;
  if (rawStatus === undefined || rawStatus === null) {
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

  const year = typeof rawYear === "string" ? Number.parseInt(rawYear.trim(), 10) : Number(rawYear);
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

async function assertCompanyExists(companyId) {
  const pool = getPostgresPool();
  if (!pool) {
    throw new HttpError(412, "failed-precondition", "Arac depolamasi hazir degil.");
  }

  const result = await pool.query(
    `
      SELECT company_id
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [companyId],
  );
  if (result.rowCount === 0) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
}

async function findVehicleByPlate(companyId, plateNormalized, excludeVehicleId = null) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT vehicle_id
      FROM company_vehicles
      WHERE company_id = $1
        AND plate_normalized = $2
        AND ($3::text IS NULL OR vehicle_id <> $3)
      LIMIT 1
    `,
    [companyId, plateNormalized, excludeVehicleId],
  );
  return result.rows[0]?.vehicle_id ?? null;
}

async function readVehicle(companyId, vehicleId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        vehicle_id,
        company_id,
        plate,
        status,
        brand,
        model,
        year,
        capacity,
        created_at,
        updated_at
      FROM company_vehicles
      WHERE company_id = $1 AND vehicle_id = $2
      LIMIT 1
    `,
    [companyId, vehicleId],
  );
  const row = result.rows[0] ?? null;
  if (!row) {
    return null;
  }

  return {
    vehicleId: row.vehicle_id,
    companyId: row.company_id,
    plate: row.plate,
    status: row.status ?? "active",
    brand: row.brand ?? null,
    model: row.model ?? null,
    year: typeof row.year === "number" ? row.year : null,
    capacity: typeof row.capacity === "number" ? row.capacity : null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at ?? null,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at ?? null,
  };
}

export async function listCompanyVehicles(_db, input) {
  requireVehicleStore();
  const vehicleLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  await assertCompanyExists(input.companyId);
  const items = await listCompanyVehiclesFromPostgres(input.companyId, vehicleLimit).catch(() => []);
  return { items: Array.isArray(items) ? items : [] };
}

export async function createCompanyVehicle(db, actorUid, actorRole, input) {
  requireVehicleStore();

  const ownerType = input?.ownerType ?? "company";
  if (ownerType !== "company") {
    throw new HttpError(
      412,
      "failed-precondition",
      "MVP createVehicle yalnizca ownerType=company icin desteklenir.",
    );
  }

  await assertCompanyExists(input.companyId);

  const { plate, plateNormalized } = normalizeVehiclePlate(input?.plate);
  const duplicateVehicleId = await findVehicleByPlate(input.companyId, plateNormalized);
  if (duplicateVehicleId) {
    throw new HttpError(409, "already-exists", "Bu firmada ayni plakali arac zaten var.");
  }

  const brand = normalizeVehicleTextNullable(input?.brand, "Marka");
  const model = normalizeVehicleTextNullable(input?.model, "Model");
  const year = normalizeVehicleYear(input?.year);
  const capacity = normalizeVehicleCapacity(input?.capacity);
  const status = normalizeVehicleStatus(input?.status);
  const nowIso = new Date().toISOString();
  const vehicleId = randomUUID();

  await syncCompanyVehicleToPostgres({
    vehicleId,
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
  });

  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId: input.companyId,
    actorUid,
    actorType: "company_member",
    eventType: "vehicle_created",
    targetType: "vehicle",
    targetId: vehicleId,
    status: "success",
    reason: null,
    metadata: {
      role: actorRole,
      plate,
      vehicleStatus: status,
    },
    requestId: createHash("sha256")
      .update(`createVehicle:${actorUid}:${input.companyId}:${vehicleId}:${nowIso}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: nowIso,
  });
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    vehicleId,
    createdAt: nowIso,
    auditLog,
    vehicle: {
      vehicleId,
      companyId: input.companyId,
      plate,
      status,
      brand,
      model,
      year,
      capacity,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  };
}

export async function updateCompanyVehicle(db, actorUid, actorRole, input) {
  requireVehicleStore();

  const rawPatch = input?.patch && typeof input.patch === "object" ? input.patch : input;
  if (!rawPatch || typeof rawPatch !== "object") {
    throw new HttpError(400, "invalid-argument", "Gecerli bir patch govdesi bekleniyor.");
  }

  const currentVehicle = await readVehicle(input.companyId, input.vehicleId);
  if (!currentVehicle) {
    throw new HttpError(404, "not-found", "Arac bulunamadi.");
  }

  const nextVehicle = { ...currentVehicle };
  const changedFields = [];

  if (Object.prototype.hasOwnProperty.call(rawPatch, "plate")) {
    const { plate, plateNormalized } = normalizeVehiclePlate(rawPatch.plate);
    const duplicateVehicleId = await findVehicleByPlate(input.companyId, plateNormalized, input.vehicleId);
    if (duplicateVehicleId) {
      throw new HttpError(409, "already-exists", "Bu firmada ayni plakali arac zaten var.");
    }
    nextVehicle.plate = plate;
    nextVehicle.plateNormalized = plateNormalized;
    changedFields.push("plate");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "brand")) {
    nextVehicle.brand = normalizeVehicleTextNullable(rawPatch.brand, "Marka");
    changedFields.push("brand");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "model")) {
    nextVehicle.model = normalizeVehicleTextNullable(rawPatch.model, "Model");
    changedFields.push("model");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "year")) {
    nextVehicle.year = normalizeVehicleYear(rawPatch.year, { allowMissing: true }) ?? null;
    changedFields.push("year");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "capacity")) {
    nextVehicle.capacity = normalizeVehicleCapacity(rawPatch.capacity, { allowMissing: true }) ?? null;
    changedFields.push("capacity");
  }

  if (Object.prototype.hasOwnProperty.call(rawPatch, "status")) {
    const status = normalizeVehicleStatus(rawPatch.status, { allowMissing: true });
    if (status !== undefined) {
      nextVehicle.status = status;
      changedFields.push("status");
    }
  }

  if (changedFields.length === 0) {
    throw new HttpError(400, "invalid-argument", "En az bir gecerli patch alani gonderilmelidir.");
  }

  const updatedAt = new Date().toISOString();
  await syncCompanyVehicleToPostgres({
    vehicleId: input.vehicleId,
    companyId: input.companyId,
    ownerType: "company",
    plate: nextVehicle.plate,
    plateNormalized: nextVehicle.plateNormalized,
    status: nextVehicle.status,
    brand: nextVehicle.brand,
    model: nextVehicle.model,
    year: nextVehicle.year,
    capacity: nextVehicle.capacity,
    createdAt: currentVehicle.createdAt,
    updatedAt,
    updatedBy: actorUid,
  });

  const auditLog = stageCompanyAuditLogWrite(db, null, {
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
      .update(`updateVehicle:${actorUid}:${input.companyId}:${input.vehicleId}:${updatedAt}`)
      .digest("hex")
      .slice(0, 24),
    createdAt: updatedAt,
  });
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    vehicleId: input.vehicleId,
    updatedAt,
    auditLog,
    vehicle: {
      ...nextVehicle,
      updatedAt,
    },
  };
}

export async function deleteCompanyVehicle(db, actorUid, actorRole, input) {
  requireVehicleStore();

  const currentVehicle = await readVehicle(input.companyId, input.vehicleId);
  if (!currentVehicle) {
    throw new HttpError(404, "not-found", "Arac bulunamadi.");
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new HttpError(412, "failed-precondition", "Arac depolamasi hazir degil.");
  }

  const linkedRoutes = await pool.query(
    `
      SELECT route_id
      FROM company_routes
      WHERE company_id = $1
        AND vehicle_id = $2
        AND is_archived = FALSE
      LIMIT 5
    `,
    [input.companyId, input.vehicleId],
  );
  if (linkedRoutes.rowCount > 0) {
    throw new HttpError(
      412,
      "failed-precondition",
      "COMPANY_VEHICLE_ROUTE_LINKED_DELETE_FORBIDDEN",
    );
  }

  const nowIso = new Date().toISOString();
  await deleteCompanyVehicleFromPostgres(input.companyId, input.vehicleId).catch(() => false);

  const auditLog = stageCompanyAuditLogWrite(db, null, {
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
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    vehicleId: input.vehicleId,
    deleted: true,
    deletedAt: nowIso,
    auditLog,
  };
}
