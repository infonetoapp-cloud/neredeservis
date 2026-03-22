import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeIsoString(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

function normalizeInteger(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

function normalizeVehicleStatus(value) {
  return value === "maintenance" || value === "inactive" ? value : "active";
}

function normalizeDriverStatus(value) {
  return value === "passive" ? "passive" : "active";
}

function normalizePlate(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().toUpperCase().replace(/\s+/g, "")
    : null;
}

function formatVehicleRow(row) {
  const vehicleId = normalizeNullableText(row?.vehicle_id);
  const companyId = normalizeNullableText(row?.company_id);
  const plate = normalizeNullableText(row?.plate);
  if (!vehicleId || !companyId || !plate) {
    return null;
  }

  return {
    vehicleId,
    companyId,
    plate,
    status: normalizeVehicleStatus(row?.status),
    brand: normalizeNullableText(row?.brand),
    model: normalizeNullableText(row?.model),
    year: normalizeInteger(row?.year),
    capacity: normalizeInteger(row?.capacity),
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

function formatDriverRow(row) {
  const driverId = normalizeNullableText(row?.driver_id);
  const companyId = normalizeNullableText(row?.company_id);
  const name = normalizeNullableText(row?.name);
  if (!driverId || !companyId || !name) {
    return null;
  }

  return {
    driverId,
    companyId,
    name,
    plateMasked: normalizeNullableText(row?.plate) ?? "",
    phoneMasked: normalizeNullableText(row?.phone),
    loginEmail: normalizeNullableText(row?.login_email),
    temporaryPassword: normalizeNullableText(row?.temporary_password),
    status: normalizeDriverStatus(row?.status),
    createdBy: normalizeNullableText(row?.created_by),
    updatedBy: normalizeNullableText(row?.updated_by),
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
    lastSeenAt: normalizeIsoString(row?.updated_at),
  };
}

async function readCompanySyncState(companyId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT vehicles_synced_at, drivers_synced_at
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [normalizedCompanyId],
  );
  return result.rows[0] ?? null;
}

async function markCompanyFleetSyncState(queryable, companyId, fieldName, syncedAt) {
  if (!queryable) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE companies
      SET ${fieldName} = $2::timestamptz, updated_at = GREATEST(updated_at, $2::timestamptz)
      WHERE company_id = $1
    `,
    [normalizedCompanyId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function upsertCompanyVehicleRow(pool, input) {
  const vehicleId = normalizeNullableText(input?.vehicleId);
  const companyId = normalizeNullableText(input?.companyId);
  const plate = normalizeNullableText(input?.plate);
  if (!vehicleId || !companyId || !plate) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;
  await pool.query(
    `
      INSERT INTO company_vehicles (
        vehicle_id,
        company_id,
        owner_type,
        plate,
        plate_normalized,
        status,
        brand,
        model,
        year,
        capacity,
        created_by,
        updated_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::timestamptz, $14::timestamptz
      )
      ON CONFLICT (vehicle_id) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        owner_type = EXCLUDED.owner_type,
        plate = EXCLUDED.plate,
        plate_normalized = EXCLUDED.plate_normalized,
        status = EXCLUDED.status,
        brand = EXCLUDED.brand,
        model = EXCLUDED.model,
        year = EXCLUDED.year,
        capacity = EXCLUDED.capacity,
        created_by = COALESCE(company_vehicles.created_by, EXCLUDED.created_by),
        updated_by = EXCLUDED.updated_by,
        created_at = COALESCE(company_vehicles.created_at, EXCLUDED.created_at),
        updated_at = EXCLUDED.updated_at
    `,
    [
      vehicleId,
      companyId,
      normalizeNullableText(input?.ownerType) ?? "company",
      plate,
      normalizePlate(input?.plateNormalized ?? plate),
      normalizeVehicleStatus(input?.status),
      normalizeNullableText(input?.brand),
      normalizeNullableText(input?.model),
      normalizeInteger(input?.year),
      normalizeInteger(input?.capacity),
      normalizeNullableText(input?.createdBy),
      normalizeNullableText(input?.updatedBy),
      createdAt,
      updatedAt,
    ],
  );

  return true;
}

async function upsertCompanyDriverRow(pool, input) {
  const driverId = normalizeNullableText(input?.driverId);
  const companyId = normalizeNullableText(input?.companyId);
  const name = normalizeNullableText(input?.name);
  if (!driverId || !companyId || !name) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt ?? input?.lastSeenAt) ?? createdAt;
  await pool.query(
    `
      INSERT INTO company_drivers (
        driver_id,
        company_id,
        name,
        status,
        phone,
        plate,
        login_email,
        temporary_password,
        mobile_only,
        created_by,
        updated_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz, $13::timestamptz
      )
      ON CONFLICT (driver_id) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        phone = EXCLUDED.phone,
        plate = EXCLUDED.plate,
        login_email = EXCLUDED.login_email,
        temporary_password = EXCLUDED.temporary_password,
        mobile_only = EXCLUDED.mobile_only,
        created_by = COALESCE(company_drivers.created_by, EXCLUDED.created_by),
        updated_by = EXCLUDED.updated_by,
        created_at = COALESCE(company_drivers.created_at, EXCLUDED.created_at),
        updated_at = EXCLUDED.updated_at
    `,
    [
      driverId,
      companyId,
      name,
      normalizeDriverStatus(input?.status),
      normalizeNullableText(input?.phone ?? input?.phoneMasked),
      normalizePlate(input?.plate ?? input?.plateMasked),
      normalizeNullableText(input?.loginEmail),
      normalizeNullableText(input?.temporaryPassword),
      input?.mobileOnly === true,
      normalizeNullableText(input?.createdBy),
      normalizeNullableText(input?.updatedBy),
      createdAt,
      updatedAt,
    ],
  );

  return true;
}

export function shouldUsePostgresCompanyFleetStore() {
  return isPostgresConfigured();
}

export async function isCompanyVehiclesSyncedInPostgres(companyId) {
  const row = await readCompanySyncState(companyId);
  return Boolean(normalizeIsoString(row?.vehicles_synced_at));
}

export async function isCompanyDriversSyncedInPostgres(companyId) {
  const row = await readCompanySyncState(companyId);
  return Boolean(normalizeIsoString(row?.drivers_synced_at));
}

export async function listCompanyVehiclesFromPostgres(companyId, limit) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const vehicleLimit = Number.isFinite(limit) ? Math.max(1, Math.trunc(limit)) : 50;
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
      WHERE company_id = $1
      ORDER BY updated_at DESC, vehicle_id ASC
      LIMIT $2
    `,
    [companyId, vehicleLimit],
  );

  return result.rows.map(formatVehicleRow).filter((item) => item !== null);
}

export async function readCompanyVehicleFromPostgres(companyId, vehicleId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedVehicleId = normalizeNullableText(vehicleId);
  if (!normalizedCompanyId || !normalizedVehicleId) {
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
    [normalizedCompanyId, normalizedVehicleId],
  );

  return result.rows.map(formatVehicleRow).find((item) => item !== null) ?? null;
}

export async function replaceCompanyVehiclesForCompany(companyId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM company_vehicles WHERE company_id = $1`, [normalizedCompanyId]);
    for (const item of items) {
      await upsertCompanyVehicleRow(client, item);
    }
    await markCompanyFleetSyncState(client, normalizedCompanyId, "vehicles_synced_at", syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function syncCompanyVehicleToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertCompanyVehicleRow(pool, input);
}

export async function deleteCompanyVehicleFromPostgres(companyId, vehicleId) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedVehicleId = normalizeNullableText(vehicleId);
  if (!normalizedCompanyId || !normalizedVehicleId) {
    return false;
  }

  await pool.query(
    `
      DELETE FROM company_vehicles
      WHERE company_id = $1 AND vehicle_id = $2
    `,
    [normalizedCompanyId, normalizedVehicleId],
  );
  return true;
}

export async function listCompanyDriversFromPostgres(companyId, limit) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const driverLimit = Number.isFinite(limit) ? Math.max(1, Math.trunc(limit)) : 100;
  const result = await pool.query(
    `
      SELECT
        driver_id,
        company_id,
        name,
        status,
        phone,
        plate,
        login_email,
        temporary_password,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM company_drivers
      WHERE company_id = $1
      ORDER BY name ASC, driver_id ASC
      LIMIT $2
    `,
    [companyId, driverLimit],
  );

  return result.rows.map(formatDriverRow).filter((item) => item !== null);
}

export async function readCompanyDriverFromPostgres(companyId, driverId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedDriverId = normalizeNullableText(driverId);
  if (!normalizedCompanyId || !normalizedDriverId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        driver_id,
        company_id,
        name,
        status,
        phone,
        plate,
        login_email,
        temporary_password,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM company_drivers
      WHERE company_id = $1 AND driver_id = $2
      LIMIT 1
    `,
    [normalizedCompanyId, normalizedDriverId],
  );

  return result.rows.map(formatDriverRow).find((item) => item !== null) ?? null;
}

export async function replaceCompanyDriversForCompany(companyId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM company_drivers WHERE company_id = $1`, [normalizedCompanyId]);
    for (const item of items) {
      await upsertCompanyDriverRow(client, item);
    }
    await markCompanyFleetSyncState(client, normalizedCompanyId, "drivers_synced_at", syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function syncCompanyDriverToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertCompanyDriverRow(pool, input);
}

export async function deleteCompanyDriverFromPostgres(companyId, driverId) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedDriverId = normalizeNullableText(driverId);
  if (!normalizedCompanyId || !normalizedDriverId) {
    return false;
  }

  await pool.query(
    `
      DELETE FROM company_drivers
      WHERE company_id = $1 AND driver_id = $2
    `,
    [normalizedCompanyId, normalizedDriverId],
  );
  return true;
}
