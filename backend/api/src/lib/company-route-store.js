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

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeTimeSlot(value) {
  return value === "morning" || value === "evening" || value === "midday" || value === "custom"
    ? value
    : null;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim()),
    ),
  );
}

function normalizeLatLng(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const lat = value.lat;
  const lng = value.lng;
  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    typeof lng !== "number" ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return { lat, lng };
}

function toJson(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function formatRouteRow(row) {
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const name = normalizeNullableText(row?.name);
  if (!routeId || !companyId || !name) {
    return null;
  }

  return {
    routeId,
    companyId,
    name,
    srvCode: normalizeNullableText(row?.srv_code),
    driverId: normalizeNullableText(row?.driver_id),
    authorizedDriverIds: normalizeStringArray(row?.authorized_driver_ids),
    memberIds: normalizeStringArray(row?.member_ids),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeTimeSlot(row?.time_slot),
    isArchived: normalizeBoolean(row?.is_archived, false),
    allowGuestTracking: normalizeBoolean(row?.allow_guest_tracking, false),
    startAddress: normalizeNullableText(row?.start_address),
    endAddress: normalizeNullableText(row?.end_address),
    startPoint: normalizeLatLng(row?.start_point),
    endPoint: normalizeLatLng(row?.end_point),
    vehicleId: normalizeNullableText(row?.vehicle_id),
    vehiclePlate: normalizeNullableText(row?.vehicle_plate),
    passengerCount: normalizeInteger(row?.passenger_count) ?? 0,
    visibility: normalizeNullableText(row?.visibility),
    creationMode: normalizeNullableText(row?.creation_mode),
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
    stopsSyncedAt: normalizeIsoString(row?.stops_synced_at),
  };
}

function formatRouteStopRow(row) {
  const stopId = normalizeNullableText(row?.stop_id);
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const name = normalizeNullableText(row?.name);
  const lat = typeof row?.lat === "number" ? row.lat : Number(row?.lat);
  const lng = typeof row?.lng === "number" ? row.lng : Number(row?.lng);
  const order = normalizeInteger(row?.stop_order);
  if (!stopId || !routeId || !companyId || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    stopId,
    routeId,
    companyId,
    name,
    location: { lat, lng },
    order: order ?? 0,
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
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
      SELECT routes_synced_at
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [normalizedCompanyId],
  );

  return result.rows[0] ?? null;
}

async function markCompanyRouteSyncState(queryable, companyId, syncedAt) {
  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE companies
      SET routes_synced_at = $2::timestamptz,
          updated_at = GREATEST(updated_at, $2::timestamptz)
      WHERE company_id = $1
    `,
    [normalizedCompanyId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function markRouteStopsSyncState(queryable, companyId, routeId, syncedAt) {
  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId || !normalizedRouteId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE company_routes
      SET stops_synced_at = $3::timestamptz,
          updated_at = GREATEST(updated_at, $3::timestamptz)
      WHERE company_id = $1 AND route_id = $2
    `,
    [normalizedCompanyId, normalizedRouteId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function upsertCompanyRouteRow(queryable, input) {
  const routeId = normalizeNullableText(input?.routeId);
  const companyId = normalizeNullableText(input?.companyId);
  const name = normalizeNullableText(input?.name);
  if (!routeId || !companyId || !name) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;
  const stopsSyncedAt = normalizeIsoString(input?.stopsSyncedAt);

  await queryable.query(
    `
      INSERT INTO company_routes (
        route_id,
        company_id,
        name,
        srv_code,
        driver_id,
        authorized_driver_ids,
        member_ids,
        scheduled_time,
        time_slot,
        is_archived,
        allow_guest_tracking,
        start_address,
        end_address,
        start_point,
        end_point,
        vehicle_id,
        vehicle_plate,
        passenger_count,
        visibility,
        creation_mode,
        route_polyline,
        vacation_until,
        last_trip_started_notification_at,
        created_by,
        updated_by,
        created_at,
        updated_at,
        stops_synced_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6::jsonb, $7::jsonb, $8, $9, $10, $11,
        $12, $13, $14::jsonb, $15::jsonb, $16, $17, $18,
        $19, $20, $21::jsonb, $22::timestamptz, $23::timestamptz,
        $24, $25, $26::timestamptz, $27::timestamptz, $28::timestamptz
      )
      ON CONFLICT (route_id) DO UPDATE
      SET
        company_id = EXCLUDED.company_id,
        name = EXCLUDED.name,
        srv_code = EXCLUDED.srv_code,
        driver_id = EXCLUDED.driver_id,
        authorized_driver_ids = EXCLUDED.authorized_driver_ids,
        member_ids = EXCLUDED.member_ids,
        scheduled_time = EXCLUDED.scheduled_time,
        time_slot = EXCLUDED.time_slot,
        is_archived = EXCLUDED.is_archived,
        allow_guest_tracking = EXCLUDED.allow_guest_tracking,
        start_address = EXCLUDED.start_address,
        end_address = EXCLUDED.end_address,
        start_point = EXCLUDED.start_point,
        end_point = EXCLUDED.end_point,
        vehicle_id = EXCLUDED.vehicle_id,
        vehicle_plate = EXCLUDED.vehicle_plate,
        passenger_count = EXCLUDED.passenger_count,
        visibility = EXCLUDED.visibility,
        creation_mode = EXCLUDED.creation_mode,
        route_polyline = EXCLUDED.route_polyline,
        vacation_until = EXCLUDED.vacation_until,
        last_trip_started_notification_at = EXCLUDED.last_trip_started_notification_at,
        created_by = COALESCE(company_routes.created_by, EXCLUDED.created_by),
        updated_by = EXCLUDED.updated_by,
        created_at = COALESCE(company_routes.created_at, EXCLUDED.created_at),
        updated_at = EXCLUDED.updated_at,
        stops_synced_at = COALESCE(EXCLUDED.stops_synced_at, company_routes.stops_synced_at)
    `,
    [
      routeId,
      companyId,
      name,
      normalizeNullableText(input?.srvCode),
      normalizeNullableText(input?.driverId),
      toJson(normalizeStringArray(input?.authorizedDriverIds), []),
      toJson(normalizeStringArray(input?.memberIds), []),
      normalizeNullableText(input?.scheduledTime),
      normalizeTimeSlot(input?.timeSlot),
      normalizeBoolean(input?.isArchived, false),
      normalizeBoolean(input?.allowGuestTracking, false),
      normalizeNullableText(input?.startAddress),
      normalizeNullableText(input?.endAddress),
      toJson(normalizeLatLng(input?.startPoint), null),
      toJson(normalizeLatLng(input?.endPoint), null),
      normalizeNullableText(input?.vehicleId),
      normalizeNullableText(input?.vehiclePlate),
      normalizeInteger(input?.passengerCount) ?? 0,
      normalizeNullableText(input?.visibility) ?? "company",
      normalizeNullableText(input?.creationMode),
      toJson(input?.routePolyline ?? null, null),
      normalizeIsoString(input?.vacationUntil),
      normalizeIsoString(input?.lastTripStartedNotificationAt),
      normalizeNullableText(input?.createdBy),
      normalizeNullableText(input?.updatedBy),
      createdAt,
      updatedAt,
      stopsSyncedAt,
    ],
  );

  return true;
}

async function upsertCompanyRouteStopRow(queryable, input) {
  const stopId = normalizeNullableText(input?.stopId);
  const routeId = normalizeNullableText(input?.routeId);
  const companyId = normalizeNullableText(input?.companyId);
  const name = normalizeNullableText(input?.name);
  const location = normalizeLatLng(input?.location);
  if (!stopId || !routeId || !companyId || !name || !location) {
    return false;
  }

  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;

  await queryable.query(
    `
      INSERT INTO company_route_stops (
        stop_id,
        route_id,
        company_id,
        name,
        lat,
        lng,
        stop_order,
        created_by,
        updated_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11::timestamptz
      )
      ON CONFLICT (stop_id) DO UPDATE
      SET
        route_id = EXCLUDED.route_id,
        company_id = EXCLUDED.company_id,
        name = EXCLUDED.name,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        stop_order = EXCLUDED.stop_order,
        created_by = COALESCE(company_route_stops.created_by, EXCLUDED.created_by),
        updated_by = EXCLUDED.updated_by,
        created_at = COALESCE(company_route_stops.created_at, EXCLUDED.created_at),
        updated_at = EXCLUDED.updated_at
    `,
    [
      stopId,
      routeId,
      companyId,
      name,
      location.lat,
      location.lng,
      normalizeInteger(input?.order) ?? 0,
      normalizeNullableText(input?.createdBy),
      normalizeNullableText(input?.updatedBy),
      createdAt,
      updatedAt,
    ],
  );

  return true;
}

export function shouldUsePostgresCompanyRouteStore() {
  return isPostgresConfigured();
}

export async function isCompanyRoutesSyncedInPostgres(companyId) {
  const row = await readCompanySyncState(companyId);
  return Boolean(normalizeIsoString(row?.routes_synced_at));
}

export async function readCompanyRouteFromPostgres(companyId, routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedCompanyId || !normalizedRouteId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        name,
        srv_code,
        driver_id,
        authorized_driver_ids,
        member_ids,
        scheduled_time,
        time_slot,
        is_archived,
        allow_guest_tracking,
        start_address,
        end_address,
        start_point,
        end_point,
        vehicle_id,
        vehicle_plate,
        passenger_count,
        visibility,
        creation_mode,
        created_at,
        updated_at,
        stops_synced_at
      FROM company_routes
      WHERE company_id = $1 AND route_id = $2
      LIMIT 1
    `,
    [normalizedCompanyId, normalizedRouteId],
  );

  return formatRouteRow(result.rows[0] ?? null);
}

export async function listCompanyRoutesFromPostgres(companyId, options = {}) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return [];
  }

  const routeLimit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 50;
  const includeArchived = options.includeArchived === true;
  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        name,
        srv_code,
        driver_id,
        authorized_driver_ids,
        member_ids,
        scheduled_time,
        time_slot,
        is_archived,
        allow_guest_tracking,
        start_address,
        end_address,
        start_point,
        end_point,
        vehicle_id,
        vehicle_plate,
        passenger_count,
        visibility,
        creation_mode,
        created_at,
        updated_at,
        stops_synced_at
      FROM company_routes
      WHERE company_id = $1
        AND ($2::boolean = TRUE OR is_archived = FALSE)
      ORDER BY updated_at DESC, route_id ASC
      LIMIT $3
    `,
    [normalizedCompanyId, includeArchived, routeLimit],
  );

  return result.rows.map(formatRouteRow).filter((item) => item !== null);
}

export async function listCompanyRouteStopsFromPostgres(companyId, routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return { routeExists: false, items: [] };
  }

  const route = await readCompanyRouteFromPostgres(companyId, routeId);
  if (!route) {
    return { routeExists: false, items: [] };
  }

  const result = await pool.query(
    `
      SELECT
        stop_id,
        route_id,
        company_id,
        name,
        lat,
        lng,
        stop_order,
        created_at,
        updated_at
      FROM company_route_stops
      WHERE company_id = $1 AND route_id = $2
      ORDER BY stop_order ASC, updated_at DESC, stop_id ASC
    `,
    [route.companyId, route.routeId],
  );

  return {
    routeExists: true,
    route,
    items: result.rows.map(formatRouteStopRow).filter((item) => item !== null),
  };
}

export async function syncCompanyRoutesSnapshotForCompany(companyId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return false;
  }

  const normalizedItems = Array.isArray(items) ? items : [];
  const routeIds = normalizedItems
    .map((item) => normalizeNullableText(item?.routeId))
    .filter((item) => item !== null);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (routeIds.length === 0) {
      await client.query(`DELETE FROM company_routes WHERE company_id = $1`, [normalizedCompanyId]);
    } else {
      await client.query(
        `
          DELETE FROM company_routes
          WHERE company_id = $1
            AND NOT (route_id = ANY($2::text[]))
        `,
        [normalizedCompanyId, routeIds],
      );
    }

    for (const item of normalizedItems) {
      await upsertCompanyRouteRow(client, item);
    }

    await markCompanyRouteSyncState(client, normalizedCompanyId, syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function syncCompanyRouteToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertCompanyRouteRow(pool, input);
}

export async function replaceCompanyRouteStopsForRoute(companyId, routeId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedCompanyId || !normalizedRouteId) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        DELETE FROM company_route_stops
        WHERE company_id = $1 AND route_id = $2
      `,
      [normalizedCompanyId, normalizedRouteId],
    );

    for (const item of Array.isArray(items) ? items : []) {
      await upsertCompanyRouteStopRow(client, item);
    }

    await markRouteStopsSyncState(client, normalizedCompanyId, normalizedRouteId, syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCompanyRouteFromPostgres(companyId, routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedCompanyId || !normalizedRouteId) {
    return false;
  }

  await pool.query(
    `
      DELETE FROM company_routes
      WHERE company_id = $1 AND route_id = $2
    `,
    [normalizedCompanyId, normalizedRouteId],
  );

  return true;
}
