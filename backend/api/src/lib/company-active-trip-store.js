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

function normalizeFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function normalizeInteger(value) {
  const parsed = normalizeFiniteNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeLiveState(value) {
  if (value === "online" || value === "stale" || value === "no_signal") {
    return value;
  }
  return "stale";
}

function normalizeStatus(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "active";
}

function formatActiveTripRow(row) {
  const tripId = normalizeNullableText(row?.trip_id);
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const driverUid = normalizeNullableText(row?.driver_uid);
  const driverName = normalizeNullableText(row?.driver_name);
  const routeName = normalizeNullableText(row?.route_name);
  if (!tripId || !routeId || !companyId || !driverUid || !driverName || !routeName) {
    return null;
  }

  const lat = normalizeFiniteNumber(row?.lat);
  const lng = normalizeFiniteNumber(row?.lng);
  const liveState = normalizeLiveState(row?.live_state);
  const liveStale = normalizeBoolean(row?.live_stale, liveState !== "online");

  return {
    tripId,
    routeId,
    companyId,
    routeName,
    routeUpdatedAt: normalizeIsoString(row?.route_updated_at),
    driverUid,
    driverName,
    driverPlate: normalizeNullableText(row?.driver_plate),
    status: normalizeStatus(row?.status),
    startedAt: normalizeIsoString(row?.started_at),
    lastLocationAt: normalizeIsoString(row?.last_location_at),
    updatedAt: normalizeIsoString(row?.updated_at),
    liveState,
    vehicleId: normalizeNullableText(row?.vehicle_id),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeNullableText(row?.time_slot),
    passengerCount: normalizeInteger(row?.passenger_count) ?? 0,
    locationTimestampMs: normalizeInteger(row?.location_timestamp_ms),
    live: {
      lat,
      lng,
      speed: normalizeFiniteNumber(row?.speed),
      heading: normalizeFiniteNumber(row?.heading),
      accuracy: normalizeFiniteNumber(row?.accuracy),
      source: normalizeNullableText(row?.live_source) ?? "trip_doc",
      stale: liveStale,
    },
  };
}

async function readCompanyActiveTripSyncState(companyId) {
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
      SELECT active_trips_synced_at
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [normalizedCompanyId],
  );

  return result.rows[0] ?? null;
}

async function markCompanyActiveTripSyncState(queryable, companyId, syncedAt) {
  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE companies
      SET active_trips_synced_at = $2::timestamptz,
          updated_at = GREATEST(updated_at, $2::timestamptz)
      WHERE company_id = $1
    `,
    [normalizedCompanyId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function upsertCompanyActiveTripRow(queryable, input, syncedAt) {
  const tripId = normalizeNullableText(input?.tripId);
  const companyId = normalizeNullableText(input?.companyId);
  const routeId = normalizeNullableText(input?.routeId);
  const routeName = normalizeNullableText(input?.routeName);
  const driverUid = normalizeNullableText(input?.driverUid);
  const driverName = normalizeNullableText(input?.driverName);
  if (!tripId || !companyId || !routeId || !routeName || !driverUid || !driverName) {
    return false;
  }

  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  const live = input?.live ?? {};
  await queryable.query(
    `
      INSERT INTO company_active_trips (
        trip_id,
        company_id,
        route_id,
        route_name,
        route_updated_at,
        driver_uid,
        driver_name,
        driver_plate,
        status,
        started_at,
        last_location_at,
        updated_at,
        live_state,
        live_source,
        live_stale,
        lat,
        lng,
        speed,
        heading,
        accuracy,
        location_timestamp_ms,
        vehicle_id,
        scheduled_time,
        time_slot,
        passenger_count,
        synced_at
      )
      VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6, $7, $8, $9,
        $10::timestamptz, $11::timestamptz, $12::timestamptz,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26::timestamptz
      )
      ON CONFLICT (trip_id) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        route_id = EXCLUDED.route_id,
        route_name = EXCLUDED.route_name,
        route_updated_at = EXCLUDED.route_updated_at,
        driver_uid = EXCLUDED.driver_uid,
        driver_name = EXCLUDED.driver_name,
        driver_plate = EXCLUDED.driver_plate,
        status = EXCLUDED.status,
        started_at = EXCLUDED.started_at,
        last_location_at = EXCLUDED.last_location_at,
        updated_at = EXCLUDED.updated_at,
        live_state = EXCLUDED.live_state,
        live_source = EXCLUDED.live_source,
        live_stale = EXCLUDED.live_stale,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        speed = EXCLUDED.speed,
        heading = EXCLUDED.heading,
        accuracy = EXCLUDED.accuracy,
        location_timestamp_ms = EXCLUDED.location_timestamp_ms,
        vehicle_id = EXCLUDED.vehicle_id,
        scheduled_time = EXCLUDED.scheduled_time,
        time_slot = EXCLUDED.time_slot,
        passenger_count = EXCLUDED.passenger_count,
        synced_at = EXCLUDED.synced_at
    `,
    [
      tripId,
      companyId,
      routeId,
      routeName,
      normalizeIsoString(input?.routeUpdatedAt),
      driverUid,
      driverName,
      normalizeNullableText(input?.driverPlate),
      normalizeStatus(input?.status),
      normalizeIsoString(input?.startedAt),
      normalizeIsoString(input?.lastLocationAt),
      normalizeIsoString(input?.updatedAt),
      normalizeLiveState(input?.liveState),
      normalizeNullableText(live?.source),
      normalizeBoolean(live?.stale, true),
      normalizeFiniteNumber(live?.lat),
      normalizeFiniteNumber(live?.lng),
      normalizeFiniteNumber(live?.speed),
      normalizeFiniteNumber(live?.heading),
      normalizeFiniteNumber(live?.accuracy),
      normalizeInteger(input?.locationTimestampMs),
      normalizeNullableText(input?.vehicleId),
      normalizeNullableText(input?.scheduledTime),
      normalizeNullableText(input?.timeSlot),
      normalizeInteger(input?.passengerCount) ?? 0,
      normalizedSyncedAt,
    ],
  );

  return true;
}

export function shouldUsePostgresCompanyActiveTripStore() {
  return isPostgresConfigured();
}

export async function isCompanyActiveTripsFreshInPostgres(companyId, maxAgeMs) {
  const row = await readCompanyActiveTripSyncState(companyId);
  const syncedAt = normalizeIsoString(row?.active_trips_synced_at);
  if (!syncedAt) {
    return false;
  }

  const syncedMs = Date.parse(syncedAt);
  if (!Number.isFinite(syncedMs)) {
    return false;
  }

  const maxAge = Number.isFinite(maxAgeMs) ? Math.max(1_000, Math.trunc(maxAgeMs)) : 15_000;
  return Date.now() - syncedMs <= maxAge;
}

export async function listCompanyActiveTripsFromPostgres(companyId, options = {}) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return [];
  }

  const tripLimit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 50;
  const filters = [];
  const values = [normalizedCompanyId];
  let valueIndex = 2;

  const routeId = normalizeNullableText(options.routeId);
  if (routeId) {
    filters.push(`route_id = $${valueIndex}`);
    values.push(routeId);
    valueIndex += 1;
  }

  const driverUid = normalizeNullableText(options.driverUid);
  if (driverUid) {
    filters.push(`driver_uid = $${valueIndex}`);
    values.push(driverUid);
    valueIndex += 1;
  }

  values.push(tripLimit);
  const whereClause = filters.length > 0 ? `AND ${filters.join(" AND ")}` : "";
  const result = await pool.query(
    `
      SELECT
        trip_id,
        company_id,
        route_id,
        route_name,
        route_updated_at,
        driver_uid,
        driver_name,
        driver_plate,
        status,
        started_at,
        last_location_at,
        updated_at,
        live_state,
        live_source,
        live_stale,
        lat,
        lng,
        speed,
        heading,
        accuracy,
        location_timestamp_ms,
        vehicle_id,
        scheduled_time,
        time_slot,
        passenger_count
      FROM company_active_trips
      WHERE company_id = $1
        ${whereClause}
      ORDER BY COALESCE(last_location_at, updated_at, started_at) DESC NULLS LAST, trip_id ASC
      LIMIT $${valueIndex}
    `,
    values,
  );

  return result.rows.map(formatActiveTripRow).filter((item) => item !== null);
}

export async function replaceCompanyActiveTripsForCompany(companyId, items, syncedAt) {
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
    await client.query(`DELETE FROM company_active_trips WHERE company_id = $1`, [normalizedCompanyId]);
    for (const item of Array.isArray(items) ? items : []) {
      await upsertCompanyActiveTripRow(client, item, syncedAt);
    }
    await markCompanyActiveTripSyncState(client, normalizedCompanyId, syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}
