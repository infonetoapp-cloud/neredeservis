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

function normalizeInteger(value, fallback = null) {
  const parsed = normalizeFiniteNumber(value);
  return parsed == null ? fallback : Math.trunc(parsed);
}

function normalizeJsonObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function toJson(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function buildDriverSnapshot(input) {
  const snapshot = normalizeJsonObject(input?.driverSnapshot);
  return {
    ...snapshot,
    ...(normalizeNullableText(input?.driverName) ? { name: normalizeNullableText(input?.driverName) } : {}),
    ...(normalizeNullableText(input?.driverPlate) ? { plate: normalizeNullableText(input?.driverPlate) } : {}),
    ...(normalizeNullableText(input?.driverPhotoUrl)
      ? { photoUrl: normalizeNullableText(input?.driverPhotoUrl) }
      : {}),
  };
}

function normalizeTripStatus(value) {
  const normalized = normalizeNullableText(value)?.toLowerCase();
  if (normalized === "active" || normalized === "completed" || normalized === "abandoned") {
    return normalized;
  }
  if (normalized === "cancelled" || normalized === "canceled") {
    return "cancelled";
  }
  return "completed";
}

function buildTripHistoryProjection(input) {
  const tripId = normalizeNullableText(input?.tripId);
  const companyId = normalizeNullableText(input?.companyId);
  const routeId = normalizeNullableText(input?.routeId);
  const routeName = normalizeNullableText(input?.routeName);
  const driverUid =
    normalizeNullableText(input?.driverUid) ?? normalizeNullableText(input?.driverId);
  const driverName = normalizeNullableText(input?.driverName);
  if (!tripId || !companyId || !routeId || !routeName || !driverUid || !driverName) {
    return null;
  }

  return {
    tripId,
    companyId,
    routeId,
    routeName,
    routeUpdatedAt: normalizeIsoString(input?.routeUpdatedAt),
    driverUid,
    driverName,
    driverPlate: normalizeNullableText(input?.driverPlate),
    driverPhotoUrl: normalizeNullableText(input?.driverPhotoUrl),
    status: normalizeTripStatus(input?.status),
    startedAt: normalizeIsoString(input?.startedAt),
    endedAt: normalizeIsoString(input?.endedAt),
    updatedAt: normalizeIsoString(input?.updatedAt) ?? new Date().toISOString(),
    vehicleId: normalizeNullableText(input?.vehicleId),
    scheduledTime: normalizeNullableText(input?.scheduledTime),
    timeSlot: normalizeNullableText(input?.timeSlot),
    passengerCount: normalizeInteger(input?.passengerCount, 0) ?? 0,
    driverSnapshot: buildDriverSnapshot(input),
    tripMetadata: normalizeJsonObject(input?.tripMetadata),
  };
}

function formatHistoryTripRow(row) {
  const tripId = normalizeNullableText(row?.trip_id);
  const routeId = normalizeNullableText(row?.route_id);
  const driverUid = normalizeNullableText(row?.driver_uid);
  const status = normalizeTripStatus(row?.status);
  if (!tripId || !routeId || !driverUid) {
    return null;
  }

  const driverSnapshot = normalizeJsonObject(row?.driver_snapshot);
  return {
    tripId,
    routeId,
    companyId: normalizeNullableText(row?.company_id),
    routeName: normalizeNullableText(row?.route_name),
    routeUpdatedAt: normalizeIsoString(row?.route_updated_at),
    driverUid,
    driverId: driverUid,
    driverName: normalizeNullableText(row?.driver_name),
    driverPlate: normalizeNullableText(row?.driver_plate),
    driverPhotoUrl: normalizeNullableText(row?.driver_photo_url),
    status,
    startedAt: normalizeIsoString(row?.started_at),
    endedAt: normalizeIsoString(row?.ended_at),
    updatedAt: normalizeIsoString(row?.updated_at),
    vehicleId: normalizeNullableText(row?.vehicle_id),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeNullableText(row?.time_slot),
    passengerCount: normalizeInteger(row?.passenger_count, 0) ?? 0,
    driverSnapshot: {
      ...driverSnapshot,
      ...(normalizeNullableText(row?.driver_name) ? { name: normalizeNullableText(row?.driver_name) } : {}),
      ...(normalizeNullableText(row?.driver_plate) ? { plate: normalizeNullableText(row?.driver_plate) } : {}),
      ...(normalizeNullableText(row?.driver_photo_url)
        ? { photoUrl: normalizeNullableText(row?.driver_photo_url) }
        : {}),
    },
  };
}

function formatActiveTripRow(row) {
  const tripId = normalizeNullableText(row?.trip_id);
  const routeId = normalizeNullableText(row?.route_id);
  const driverUid = normalizeNullableText(row?.driver_uid);
  if (!tripId || !routeId || !driverUid) {
    return null;
  }

  return {
    tripId,
    routeId,
    companyId: normalizeNullableText(row?.company_id),
    routeName: normalizeNullableText(row?.route_name),
    routeUpdatedAt: normalizeIsoString(row?.route_updated_at),
    driverUid,
    driverId: driverUid,
    driverName: normalizeNullableText(row?.driver_name),
    driverPlate: normalizeNullableText(row?.driver_plate),
    driverPhotoUrl: null,
    status: "active",
    startedAt: normalizeIsoString(row?.started_at),
    endedAt: null,
    updatedAt: normalizeIsoString(row?.updated_at) ?? normalizeIsoString(row?.last_location_at),
    vehicleId: normalizeNullableText(row?.vehicle_id),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeNullableText(row?.time_slot),
    passengerCount: normalizeInteger(row?.passenger_count, 0) ?? 0,
    driverSnapshot: {
      ...(normalizeNullableText(row?.driver_name) ? { name: normalizeNullableText(row?.driver_name) } : {}),
      ...(normalizeNullableText(row?.driver_plate) ? { plate: normalizeNullableText(row?.driver_plate) } : {}),
    },
  };
}

function buildTripRowPayload(row) {
  if (!row?.tripId) {
    return null;
  }

  return {
    tripId: row.tripId,
    tripData: {
      companyId: row.companyId,
      routeId: row.routeId,
      routeName: row.routeName,
      routeUpdatedAt: row.routeUpdatedAt,
      driverUid: row.driverUid,
      driverId: row.driverId,
      driverName: row.driverName,
      driverPlate: row.driverPlate,
      driverPhotoUrl: row.driverPhotoUrl,
      driverSnapshot: row.driverSnapshot,
      status: row.status,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      updatedAt: row.updatedAt,
      vehicleId: row.vehicleId,
      scheduledTime: row.scheduledTime,
      timeSlot: row.timeSlot,
      passengerCount: row.passengerCount,
    },
  };
}

function buildRouteSnapshot(row) {
  const routeId = normalizeNullableText(row?.route_id);
  const name = normalizeNullableText(row?.name);
  if (!routeId || !name) {
    return null;
  }

  return {
    routeId,
    name,
    companyId: normalizeNullableText(row?.company_id),
    driverId: normalizeNullableText(row?.driver_id),
    passengerCount: normalizeInteger(row?.passenger_count, 0) ?? 0,
    updatedAt: normalizeIsoString(row?.updated_at),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeNullableText(row?.time_slot),
    vehicleId: normalizeNullableText(row?.vehicle_id),
  };
}

function buildDriverProjection(row) {
  const driverId = normalizeNullableText(row?.driver_id);
  const name = normalizeNullableText(row?.name);
  if (!driverId || !name) {
    return null;
  }

  return {
    driverId,
    name,
    phone: normalizeNullableText(row?.phone),
    plate: normalizeNullableText(row?.plate),
  };
}

export function shouldUsePostgresTripHistoryStore() {
  return isPostgresConfigured();
}

export async function upsertTripHistoryRecord(queryable, input) {
  const projection = buildTripHistoryProjection(input);
  if (!projection) {
    return false;
  }

  await queryable.query(
    `
      INSERT INTO company_trip_history (
        trip_id,
        company_id,
        route_id,
        route_name,
        route_updated_at,
        driver_uid,
        driver_name,
        driver_plate,
        driver_photo_url,
        status,
        started_at,
        ended_at,
        updated_at,
        vehicle_id,
        scheduled_time,
        time_slot,
        passenger_count,
        driver_snapshot,
        trip_metadata
      )
      VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6, $7, $8, $9, $10,
        $11::timestamptz, $12::timestamptz, $13::timestamptz,
        $14, $15, $16, $17, $18::jsonb, $19::jsonb
      )
      ON CONFLICT (trip_id) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        route_id = EXCLUDED.route_id,
        route_name = EXCLUDED.route_name,
        route_updated_at = COALESCE(EXCLUDED.route_updated_at, company_trip_history.route_updated_at),
        driver_uid = EXCLUDED.driver_uid,
        driver_name = EXCLUDED.driver_name,
        driver_plate = COALESCE(EXCLUDED.driver_plate, company_trip_history.driver_plate),
        driver_photo_url = COALESCE(EXCLUDED.driver_photo_url, company_trip_history.driver_photo_url),
        status = EXCLUDED.status,
        started_at = COALESCE(EXCLUDED.started_at, company_trip_history.started_at),
        ended_at = COALESCE(EXCLUDED.ended_at, company_trip_history.ended_at),
        updated_at = EXCLUDED.updated_at,
        vehicle_id = COALESCE(EXCLUDED.vehicle_id, company_trip_history.vehicle_id),
        scheduled_time = COALESCE(EXCLUDED.scheduled_time, company_trip_history.scheduled_time),
        time_slot = COALESCE(EXCLUDED.time_slot, company_trip_history.time_slot),
        passenger_count = EXCLUDED.passenger_count,
        driver_snapshot = EXCLUDED.driver_snapshot,
        trip_metadata = EXCLUDED.trip_metadata
    `,
    [
      projection.tripId,
      projection.companyId,
      projection.routeId,
      projection.routeName,
      projection.routeUpdatedAt,
      projection.driverUid,
      projection.driverName,
      projection.driverPlate,
      projection.driverPhotoUrl,
      projection.status,
      projection.startedAt,
      projection.endedAt,
      projection.updatedAt,
      projection.vehicleId,
      projection.scheduledTime,
      projection.timeSlot,
      projection.passengerCount,
      toJson(projection.driverSnapshot, {}),
      toJson(projection.tripMetadata, {}),
    ],
  );

  return true;
}

export async function upsertTripHistoryToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertTripHistoryRecord(pool, input);
}

export async function upsertTripHistoryBatchToPostgres(items) {
  const pool = getPostgresPool();
  if (!pool || !Array.isArray(items) || items.length === 0) {
    return false;
  }

  const client = await pool.connect();
  let wroteAny = false;
  try {
    await client.query("BEGIN");
    for (const item of items) {
      wroteAny = (await upsertTripHistoryRecord(client, item)) || wroteAny;
    }
    await client.query("COMMIT");
    return wroteAny;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function listDriverTripHistoryRowsFromPostgres(driverUid, options = {}) {
  const pool = getPostgresPool();
  const normalizedDriverUid = normalizeNullableText(driverUid);
  if (!pool || !normalizedDriverUid) {
    return [];
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 180;
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
        driver_photo_url,
        status,
        started_at,
        ended_at,
        updated_at,
        vehicle_id,
        scheduled_time,
        time_slot,
        passenger_count,
        driver_snapshot
      FROM company_trip_history
      WHERE driver_uid = $1
      ORDER BY COALESCE(ended_at, updated_at, started_at) DESC NULLS LAST, trip_id DESC
      LIMIT $2
    `,
    [normalizedDriverUid, limit],
  );

  return result.rows.map(formatHistoryTripRow).filter((item) => item !== null).map(buildTripRowPayload);
}

export async function listPassengerTripHistoryRowsFromPostgres(uid, options = {}) {
  const pool = getPostgresPool();
  const normalizedUid = normalizeNullableText(uid);
  if (!pool || !normalizedUid) {
    return [];
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 180;
  const result = await pool.query(
    `
      SELECT
        history.trip_id,
        history.company_id,
        history.route_id,
        history.route_name,
        history.route_updated_at,
        history.driver_uid,
        history.driver_name,
        history.driver_plate,
        history.driver_photo_url,
        history.status,
        history.started_at,
        history.ended_at,
        history.updated_at,
        history.vehicle_id,
        history.scheduled_time,
        history.time_slot,
        history.passenger_count,
        history.driver_snapshot
      FROM company_trip_history history
      INNER JOIN company_routes route ON route.route_id = history.route_id
      WHERE route.member_ids ? $1
      ORDER BY COALESCE(history.ended_at, history.updated_at, history.started_at) DESC NULLS LAST, history.trip_id DESC
      LIMIT $2
    `,
    [normalizedUid, limit],
  );

  return result.rows.map(formatHistoryTripRow).filter((item) => item !== null).map(buildTripRowPayload);
}

export async function listDriverActiveTripRowsFromPostgres(driverUid, options = {}) {
  const pool = getPostgresPool();
  const normalizedDriverUid = normalizeNullableText(driverUid);
  if (!pool || !normalizedDriverUid) {
    return [];
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 80;
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
        vehicle_id,
        scheduled_time,
        time_slot,
        passenger_count
      FROM company_active_trips
      WHERE driver_uid = $1
      ORDER BY COALESCE(last_location_at, updated_at, started_at) DESC NULLS LAST, trip_id DESC
      LIMIT $2
    `,
    [normalizedDriverUid, limit],
  );

  return result.rows.map(formatActiveTripRow).filter((item) => item !== null).map(buildTripRowPayload);
}

export async function listRouteSnapshotsByIdsFromPostgres(routeIds) {
  const pool = getPostgresPool();
  if (!pool) {
    return {};
  }

  const normalizedRouteIds = Array.from(
    new Set(
      (Array.isArray(routeIds) ? routeIds : [])
        .map((item) => normalizeNullableText(item))
        .filter((item) => item),
    ),
  );
  if (normalizedRouteIds.length === 0) {
    return {};
  }

  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        name,
        driver_id,
        passenger_count,
        updated_at,
        scheduled_time,
        time_slot,
        vehicle_id
      FROM company_routes
      WHERE route_id = ANY($1::text[])
    `,
    [normalizedRouteIds],
  );

  const routesById = {};
  for (const row of result.rows) {
    const route = buildRouteSnapshot(row);
    if (!route?.routeId) {
      continue;
    }
    routesById[route.routeId] = {
      name: route.name,
      companyId: route.companyId,
      driverId: route.driverId,
      passengerCount: route.passengerCount,
      updatedAt: route.updatedAt,
      scheduledTime: route.scheduledTime,
      timeSlot: route.timeSlot,
      vehicleId: route.vehicleId,
    };
  }
  return routesById;
}

export async function listCurrentPassengerRoutesFromPostgres(uid, options = {}) {
  const pool = getPostgresPool();
  const normalizedUid = normalizeNullableText(uid);
  if (!pool || !normalizedUid) {
    return {};
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 80;
  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        name,
        driver_id,
        passenger_count,
        updated_at,
        scheduled_time,
        time_slot,
        vehicle_id
      FROM company_routes
      WHERE is_archived = FALSE
        AND member_ids ? $1
      ORDER BY updated_at DESC NULLS LAST, route_id ASC
      LIMIT $2
    `,
    [normalizedUid, limit],
  );

  const routesById = {};
  for (const row of result.rows) {
    const route = buildRouteSnapshot(row);
    if (!route?.routeId) {
      continue;
    }
    routesById[route.routeId] = {
      name: route.name,
      companyId: route.companyId,
      driverId: route.driverId,
      passengerCount: route.passengerCount,
      updatedAt: route.updatedAt,
      scheduledTime: route.scheduledTime,
      timeSlot: route.timeSlot,
      vehicleId: route.vehicleId,
    };
  }
  return routesById;
}

export async function listDriverSnapshotsByIdsFromPostgres(driverIds) {
  const pool = getPostgresPool();
  if (!pool) {
    return {};
  }

  const normalizedDriverIds = Array.from(
    new Set(
      (Array.isArray(driverIds) ? driverIds : [])
        .map((item) => normalizeNullableText(item))
        .filter((item) => item),
    ),
  );
  if (normalizedDriverIds.length === 0) {
    return {};
  }

  const result = await pool.query(
    `
      SELECT DISTINCT ON (driver_id)
        driver_id,
        name,
        phone,
        plate
      FROM company_drivers
      WHERE driver_id = ANY($1::text[])
      ORDER BY driver_id ASC, updated_at DESC NULLS LAST
    `,
    [normalizedDriverIds],
  );

  const driversById = {};
  for (const row of result.rows) {
    const driver = buildDriverProjection(row);
    if (!driver?.driverId) {
      continue;
    }
    driversById[driver.driverId] = {
      name: driver.name,
      phone: driver.phone,
      plate: driver.plate,
    };
  }
  return driversById;
}
