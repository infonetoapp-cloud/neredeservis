import { randomUUID } from "node:crypto";

import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { upsertTripHistoryRecord } from "./trip-history-store.js";

const TRIP_REQUEST_TTL_DAYS = Number.parseInt(process.env.TRIP_REQUEST_TTL_DAYS ?? "7", 10) || 7;

function normalizeId(rawValue, fieldLabel) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value || value.length > 128) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return value;
}

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeFiniteNumber(value, fieldLabel) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
}

function normalizeNullableFiniteNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
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

function normalizeInteger(value, fieldLabel) {
  const parsed = normalizeFiniteNumber(value, fieldLabel);
  return Math.trunc(parsed);
}

function normalizeOptionalInteger(value, fallback = null) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return fallback;
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

function normalizePermissionFlags(value) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const readFlag = (key, fallback) => (typeof record[key] === "boolean" ? record[key] : fallback);
  return {
    canStartFinishTrip: readFlag("canStartFinishTrip", true),
    canSendAnnouncements: readFlag("canSendAnnouncements", true),
    canViewPassengerList: readFlag("canViewPassengerList", true),
    canEditAssignedRouteMeta: readFlag("canEditAssignedRouteMeta", false),
    canEditStops: readFlag("canEditStops", false),
    canManageRouteSchedule: readFlag("canManageRouteSchedule", false),
  };
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

function isoFromTimestampMs(timestampMs) {
  return new Date(timestampMs).toISOString();
}

function buildTripRequestId(uid, requestType, idempotencyKey) {
  return `${requestType}:${uid}:${idempotencyKey}`;
}

function readReplayOutput(row) {
  const responseData =
    row?.response_data && typeof row.response_data === "object" && !Array.isArray(row.response_data)
      ? row.response_data
      : null;
  if (!responseData) {
    return null;
  }

  const tripId = normalizeNullableText(responseData.tripId);
  const status = normalizeNullableText(responseData.status);
  const transitionVersion = normalizeOptionalInteger(responseData.transitionVersion, null);
  if (!tripId || !status || transitionVersion == null) {
    return null;
  }

  return {
    tripId,
    status,
    transitionVersion,
    endedAt: normalizeNullableText(responseData.endedAt),
  };
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
    driverId: normalizeNullableText(row?.driver_id),
    authorizedDriverIds: normalizeStringArray(row?.authorized_driver_ids),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeNullableText(row?.time_slot),
    isArchived: row?.is_archived === true,
    visibility: normalizeNullableText(row?.visibility) ?? "company",
    vehicleId: normalizeNullableText(row?.vehicle_id),
    vehiclePlate: normalizeNullableText(row?.vehicle_plate),
    passengerCount: normalizeOptionalInteger(row?.passenger_count, 0) ?? 0,
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
    status: normalizeNullableText(row?.status) ?? "active",
    plate: normalizeNullableText(row?.plate),
    phone: normalizeNullableText(row?.phone),
  };
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

  return {
    tripId,
    routeId,
    companyId,
    routeName,
    routeUpdatedAt: normalizeIsoString(row?.route_updated_at),
    driverUid,
    driverName,
    driverPlate: normalizeNullableText(row?.driver_plate),
    status: normalizeNullableText(row?.status) ?? "active",
    startedAt: normalizeIsoString(row?.started_at),
    lastLocationAt: normalizeIsoString(row?.last_location_at),
    updatedAt: normalizeIsoString(row?.updated_at),
    liveState: normalizeNullableText(row?.live_state) ?? "no_signal",
    vehicleId: normalizeNullableText(row?.vehicle_id),
    scheduledTime: normalizeNullableText(row?.scheduled_time),
    timeSlot: normalizeNullableText(row?.time_slot),
    passengerCount: normalizeOptionalInteger(row?.passenger_count, 0) ?? 0,
    locationTimestampMs: normalizeOptionalInteger(row?.location_timestamp_ms, null),
    startedByDeviceId: normalizeNullableText(row?.started_by_device_id),
    transitionVersion: normalizeOptionalInteger(row?.transition_version, 0) ?? 0,
    live: {
      lat: normalizeNullableFiniteNumber(row?.lat),
      lng: normalizeNullableFiniteNumber(row?.lng),
      speed: normalizeNullableFiniteNumber(row?.speed),
      heading: normalizeNullableFiniteNumber(row?.heading),
      accuracy: normalizeNullableFiniteNumber(row?.accuracy),
      source: normalizeNullableText(row?.live_source) ?? "trip_doc",
      stale: row?.live_stale !== false,
    },
  };
}

function ensurePostgresRuntime() {
  if (!isPostgresConfigured()) {
    throw new HttpError(503, "unavailable", "PostgreSQL baglantisi hazir degil.");
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new HttpError(503, "unavailable", "PostgreSQL baglantisi hazir degil.");
  }
  return pool;
}

async function readTripRequest(pool, uid, requestType, idempotencyKey) {
  const requestId = buildTripRequestId(uid, requestType, idempotencyKey);
  const result = await pool.query(
    `
      SELECT response_data
      FROM driver_trip_requests
      WHERE request_id = $1 AND uid = $2 AND request_type = $3
      LIMIT 1
    `,
    [requestId, uid, requestType],
  );

  return readReplayOutput(result.rows[0] ?? null);
}

async function writeTripRequest(queryable, { uid, requestType, idempotencyKey, tripId, responseData, expiresAt }) {
  const requestId = buildTripRequestId(uid, requestType, idempotencyKey);
  await queryable.query(
    `
      INSERT INTO driver_trip_requests (
        request_id,
        uid,
        request_type,
        trip_id,
        response_data,
        expires_at,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5::jsonb, $6::timestamptz, NOW(), NOW()
      )
      ON CONFLICT (request_id) DO UPDATE
      SET
        trip_id = EXCLUDED.trip_id,
        response_data = EXCLUDED.response_data,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    `,
    [requestId, uid, requestType, tripId, JSON.stringify(responseData), expiresAt],
  );
}

async function readRouteById(pool, routeId) {
  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        name,
        driver_id,
        authorized_driver_ids,
        scheduled_time,
        time_slot,
        is_archived,
        visibility,
        vehicle_id,
        vehicle_plate,
        passenger_count,
        updated_at
      FROM company_routes
      WHERE route_id = $1
      LIMIT 1
    `,
    [routeId],
  );

  return formatRouteRow(result.rows[0] ?? null);
}

async function readDriverById(pool, companyId, driverUid) {
  const result = await pool.query(
    `
      SELECT
        driver_id,
        company_id,
        name,
        status,
        plate,
        phone
      FROM company_drivers
      WHERE company_id = $1 AND driver_id = $2
      LIMIT 1
    `,
    [companyId, driverUid],
  );

  return formatDriverRow(result.rows[0] ?? null);
}

async function readDriverRoutePermission(pool, routeId, driverUid) {
  const result = await pool.query(
    `
      SELECT permissions
      FROM company_route_driver_permissions
      WHERE route_id = $1 AND driver_uid = $2
      LIMIT 1
    `,
    [routeId, driverUid],
  );

  return normalizePermissionFlags(result.rows[0]?.permissions);
}

async function readActiveTripByRoute(pool, routeId) {
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
        passenger_count,
        started_by_device_id,
        transition_version
      FROM company_active_trips
      WHERE route_id = $1
      LIMIT 1
    `,
    [routeId],
  );

  return formatActiveTripRow(result.rows[0] ?? null);
}

async function readActiveTripByTripId(pool, tripId) {
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
        passenger_count,
        started_by_device_id,
        transition_version
      FROM company_active_trips
      WHERE trip_id = $1
      LIMIT 1
    `,
    [tripId],
  );

  return formatActiveTripRow(result.rows[0] ?? null);
}

async function upsertCompanyActiveTrip(queryable, input) {
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
        synced_at,
        started_by_device_id,
        transition_version
      )
      VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6, $7, $8, $9,
        $10::timestamptz, $11::timestamptz, $12::timestamptz,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26::timestamptz, $27, $28
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
        synced_at = EXCLUDED.synced_at,
        started_by_device_id = EXCLUDED.started_by_device_id,
        transition_version = EXCLUDED.transition_version
    `,
    [
      input.tripId,
      input.companyId,
      input.routeId,
      input.routeName,
      input.routeUpdatedAt,
      input.driverUid,
      input.driverName,
      input.driverPlate,
      input.status,
      input.startedAt,
      input.lastLocationAt,
      input.updatedAt,
      input.liveState,
      input.live.source,
      input.live.stale,
      input.live.lat,
      input.live.lng,
      input.live.speed,
      input.live.heading,
      input.live.accuracy,
      input.locationTimestampMs,
      input.vehicleId,
      input.scheduledTime,
      input.timeSlot,
      input.passengerCount,
      input.syncedAt,
      input.startedByDeviceId,
      input.transitionVersion,
    ],
  );
}

async function deleteCompanyActiveTrip(queryable, tripId) {
  await queryable.query(`DELETE FROM company_active_trips WHERE trip_id = $1`, [tripId]);
}

async function touchCompanyActiveTripSync(queryable, companyId, syncedAt) {
  await queryable.query(
    `
      UPDATE companies
      SET active_trips_synced_at = $2::timestamptz,
          updated_at = GREATEST(updated_at, $2::timestamptz)
      WHERE company_id = $1
    `,
    [companyId, syncedAt],
  );
}

function assertDriverCanOperateRoute(route, driverUid, permission) {
  if (!route) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }
  if (route.visibility && route.visibility !== "company") {
    throw new HttpError(412, "failed-precondition", "ROUTE_NOT_COMPANY_SCOPED");
  }
  if (route.isArchived) {
    throw new HttpError(412, "failed-precondition", "Arsivlenmis route icin islem yapilamaz.");
  }

  const canAccessRoute =
    route.driverId === driverUid || route.authorizedDriverIds.includes(driverUid);
  if (!canAccessRoute) {
    throw new HttpError(403, "permission-denied", "Bu route icin yetkin yok.");
  }
  if (!permission.canStartFinishTrip) {
    throw new HttpError(403, "permission-denied", "Bu route icin trip yetkin kapali.");
  }
}

function buildStartTripResponse(activeTrip) {
  return {
    tripId: activeTrip.tripId,
    status: "active",
    transitionVersion: activeTrip.transitionVersion,
  };
}

export async function resolveDriverActiveTripContext(input) {
  const pool = ensurePostgresRuntime();
  const uid = normalizeId(input?.uid, "uid");
  const routeId = normalizeNullableText(input?.routeId);
  const tripId = normalizeNullableText(input?.tripId);

  let activeTrip = null;
  if (tripId) {
    activeTrip = await readActiveTripByTripId(pool, tripId);
  }
  if (!activeTrip && routeId) {
    activeTrip = await readActiveTripByRoute(pool, routeId);
  }

  if (!activeTrip || activeTrip.driverUid !== uid) {
    return null;
  }

  return {
    routeId: activeTrip.routeId,
    tripId: activeTrip.tripId,
    transitionVersion: activeTrip.transitionVersion,
  };
}

export async function readDriverRouteTransitionVersion(input) {
  const routeId = normalizeId(input?.routeId, "routeId");
  const context = await resolveDriverActiveTripContext({
    uid: input?.uid,
    routeId,
  });
  return {
    routeId,
    transitionVersion: context?.transitionVersion ?? 0,
    tripId: context?.tripId ?? null,
  };
}

export async function startDriverTrip(input) {
  const pool = ensurePostgresRuntime();
  const uid = normalizeId(input?.uid, "uid");
  const routeId = normalizeId(input?.routeId, "routeId");
  const deviceId = normalizeId(input?.deviceId, "deviceId");
  const idempotencyKey = normalizeId(input?.idempotencyKey, "idempotencyKey");
  const expectedTransitionVersion = normalizeInteger(
    input?.expectedTransitionVersion,
    "expectedTransitionVersion",
  );

  const replay = await readTripRequest(pool, uid, "start_trip", idempotencyKey);
  if (replay) {
    return replay;
  }

  const route = await readRouteById(pool, routeId);
  const permission = await readDriverRoutePermission(pool, routeId, uid);
  assertDriverCanOperateRoute(route, uid, permission);

  const activeTrip = await readActiveTripByRoute(pool, routeId);
  const currentTransitionVersion = activeTrip?.transitionVersion ?? 0;
  if (expectedTransitionVersion !== currentTransitionVersion) {
    throw new HttpError(
      412,
      "failed-precondition",
      `TRANSITION_VERSION_MISMATCH: expected=${expectedTransitionVersion}, actual=${currentTransitionVersion}`,
    );
  }

  if (activeTrip) {
    if (activeTrip.driverUid !== uid || activeTrip.startedByDeviceId !== deviceId) {
      throw new HttpError(412, "failed-precondition", "Route icin zaten aktif bir trip var.");
    }

    const responseData = buildStartTripResponse(activeTrip);
    await writeTripRequest(pool, {
      uid,
      requestType: "start_trip",
      idempotencyKey,
      tripId: activeTrip.tripId,
      responseData,
      expiresAt: new Date(Date.now() + TRIP_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });
    return responseData;
  }

  const driver = await readDriverById(pool, route.companyId, uid);
  if (!driver || driver.status !== "active") {
    throw new HttpError(404, "not-found", "Driver profili bulunamadi.");
  }

  const nowIso = new Date().toISOString();
  const tripId = randomUUID();
  const transitionVersion = currentTransitionVersion + 1;
  const responseData = {
    tripId,
    status: "active",
    transitionVersion,
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await upsertCompanyActiveTrip(client, {
      tripId,
      companyId: route.companyId,
      routeId: route.routeId,
      routeName: route.name,
      routeUpdatedAt: route.updatedAt ?? nowIso,
      driverUid: uid,
      driverName: driver.name,
      driverPlate: driver.plate,
      status: "active",
      startedAt: nowIso,
      lastLocationAt: nowIso,
      updatedAt: nowIso,
      liveState: "no_signal",
      live: {
        lat: null,
        lng: null,
        speed: null,
        heading: null,
        accuracy: null,
        source: "trip_doc",
        stale: true,
      },
      locationTimestampMs: Date.now(),
      vehicleId: route.vehicleId,
      scheduledTime: route.scheduledTime,
      timeSlot: route.timeSlot,
      passengerCount: route.passengerCount,
      syncedAt: nowIso,
      startedByDeviceId: deviceId,
      transitionVersion,
    });
    await client.query(
      `
        UPDATE company_routes
        SET last_trip_started_notification_at = $2::timestamptz,
            updated_at = GREATEST(updated_at, $2::timestamptz)
        WHERE route_id = $1
      `,
      [route.routeId, nowIso],
    );
    await touchCompanyActiveTripSync(client, route.companyId, nowIso);
    await writeTripRequest(client, {
      uid,
      requestType: "start_trip",
      idempotencyKey,
      tripId,
      responseData,
      expiresAt: new Date(Date.now() + TRIP_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });
    await client.query("COMMIT");
    return responseData;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function finishDriverTrip(input) {
  const pool = ensurePostgresRuntime();
  const uid = normalizeId(input?.uid, "uid");
  const tripId = normalizeId(input?.tripId, "tripId");
  const deviceId = normalizeId(input?.deviceId, "deviceId");
  const idempotencyKey = normalizeId(input?.idempotencyKey, "idempotencyKey");
  const expectedTransitionVersion = normalizeInteger(
    input?.expectedTransitionVersion,
    "expectedTransitionVersion",
  );

  const replay = await readTripRequest(pool, uid, "finish_trip", idempotencyKey);
  if (replay) {
    return replay;
  }

  const activeTrip = await readActiveTripByTripId(pool, tripId);
  if (!activeTrip) {
    throw new HttpError(404, "not-found", "Trip bulunamadi.");
  }
  if (activeTrip.driverUid !== uid) {
    throw new HttpError(403, "permission-denied", "Bu trip icin yetkin yok.");
  }
  if (expectedTransitionVersion !== activeTrip.transitionVersion) {
    throw new HttpError(
      412,
      "failed-precondition",
      `TRANSITION_VERSION_MISMATCH: expected=${expectedTransitionVersion}, actual=${activeTrip.transitionVersion}`,
    );
  }
  if (activeTrip.startedByDeviceId !== deviceId) {
    throw new HttpError(
      403,
      "permission-denied",
      "finishTrip sadece startedByDeviceId ile yapilabilir.",
    );
  }

  const nowIso = new Date().toISOString();
  const responseData = {
    tripId: activeTrip.tripId,
    status: "completed",
    endedAt: nowIso,
    transitionVersion: activeTrip.transitionVersion + 1,
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await upsertTripHistoryRecord(client, {
      tripId: activeTrip.tripId,
      companyId: activeTrip.companyId,
      routeId: activeTrip.routeId,
      routeName: activeTrip.routeName,
      routeUpdatedAt: activeTrip.routeUpdatedAt,
      driverUid: activeTrip.driverUid,
      driverName: activeTrip.driverName,
      driverPlate: activeTrip.driverPlate,
      status: "completed",
      startedAt: activeTrip.startedAt,
      endedAt: nowIso,
      updatedAt: nowIso,
      vehicleId: activeTrip.vehicleId,
      scheduledTime: activeTrip.scheduledTime,
      timeSlot: activeTrip.timeSlot,
      passengerCount: activeTrip.passengerCount,
      driverSnapshot: {
        name: activeTrip.driverName,
        plate: activeTrip.driverPlate,
      },
      tripMetadata: {
        transitionVersion: responseData.transitionVersion,
        startedByDeviceId: activeTrip.startedByDeviceId,
        locationTimestampMs: activeTrip.locationTimestampMs,
        liveState: activeTrip.liveState,
      },
    });
    await deleteCompanyActiveTrip(client, activeTrip.tripId);
    await touchCompanyActiveTripSync(client, activeTrip.companyId, nowIso);
    await writeTripRequest(client, {
      uid,
      requestType: "finish_trip",
      idempotencyKey,
      tripId: activeTrip.tripId,
      responseData,
      expiresAt: new Date(Date.now() + TRIP_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });
    await client.query("COMMIT");
    return responseData;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function readDriverLiveLocation(input) {
  const pool = ensurePostgresRuntime();
  const uid = normalizeId(input?.uid, "uid");
  const routeId = normalizeId(input?.routeId, "routeId");
  const activeTrip = await readActiveTripByRoute(pool, routeId);
  if (!activeTrip || activeTrip.driverUid !== uid) {
    return null;
  }
  if (activeTrip.live.lat == null || activeTrip.live.lng == null) {
    return null;
  }

  return {
    routeId: activeTrip.routeId,
    tripId: activeTrip.tripId,
    driverId: activeTrip.driverUid,
    lat: activeTrip.live.lat,
    lng: activeTrip.live.lng,
    speed: activeTrip.live.speed ?? 0,
    heading: activeTrip.live.heading ?? 0,
    accuracy: activeTrip.live.accuracy ?? 0,
    timestampMs: activeTrip.locationTimestampMs ?? Date.now(),
  };
}

export async function upsertDriverLiveLocation(input, options = {}) {
  const pool = ensurePostgresRuntime();
  const uid = normalizeId(input?.uid, "uid");
  const routeId = normalizeId(input?.routeId, "routeId");
  const tripId = normalizeNullableText(input?.tripId);
  const lat = normalizeFiniteNumber(input?.lat, "lat");
  const lng = normalizeFiniteNumber(input?.lng, "lng");
  const accuracy = normalizeFiniteNumber(input?.accuracy, "accuracy");
  const speed = normalizeNullableFiniteNumber(input?.speed) ?? 0;
  const heading = normalizeNullableFiniteNumber(input?.heading) ?? 0;
  const timestampMs = normalizeOptionalInteger(input?.timestampMs, Date.now()) ?? Date.now();
  const nowIso = new Date().toISOString();
  const sampleIso = isoFromTimestampMs(timestampMs);
  const onlineThresholdMs = Number.isFinite(options.liveOpsOnlineThresholdMs)
    ? Math.max(1_000, Math.trunc(options.liveOpsOnlineThresholdMs))
    : 60_000;

  const activeTrip = await readActiveTripByRoute(pool, routeId);
  if (!activeTrip) {
    throw new HttpError(412, "failed-precondition", "Route icin aktif trip bulunamadi.");
  }
  if (activeTrip.driverUid !== uid) {
    throw new HttpError(403, "permission-denied", "Bu route icin canli konum yetkin yok.");
  }
  if (tripId && activeTrip.tripId !== tripId) {
    throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_MISMATCH");
  }

  const stale = Date.now() - timestampMs > onlineThresholdMs;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await upsertCompanyActiveTrip(client, {
      ...activeTrip,
      lastLocationAt: sampleIso,
      updatedAt: nowIso,
      liveState: stale ? "stale" : "online",
      live: {
        lat,
        lng,
        speed,
        heading,
        accuracy,
        source: "live_store",
        stale,
      },
      locationTimestampMs: timestampMs,
      syncedAt: nowIso,
      transitionVersion: activeTrip.transitionVersion,
      startedByDeviceId: activeTrip.startedByDeviceId,
    });
    await touchCompanyActiveTripSync(client, activeTrip.companyId, nowIso);
    await client.query("COMMIT");
    return {
      routeId: activeTrip.routeId,
      tripId: activeTrip.tripId,
      updatedAt: nowIso,
      lastLocationAt: sampleIso,
      liveState: stale ? "stale" : "online",
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function appendDriverLocationHistory(input) {
  const pool = ensurePostgresRuntime();
  const uid = normalizeId(input?.uid, "uid");
  const routeId = normalizeId(input?.routeId, "routeId");
  const route = await readRouteById(pool, routeId);
  const permission = await readDriverRoutePermission(pool, routeId, uid);
  assertDriverCanOperateRoute(route, uid, permission);

  const sampledAtMs = normalizeInteger(input?.sampledAtMs, "sampledAtMs");
  const recordedAtMs = normalizeOptionalInteger(input?.recordedAtMs, Date.now()) ?? Date.now();
  const sample = {
    routeId: route.routeId,
    companyId: route.companyId,
    driverUid: uid,
    tripId: normalizeNullableText(input?.tripId),
    lat: normalizeFiniteNumber(input?.lat, "lat"),
    lng: normalizeFiniteNumber(input?.lng, "lng"),
    accuracy: normalizeFiniteNumber(input?.accuracy, "accuracy"),
    speed: normalizeNullableFiniteNumber(input?.speed),
    heading: normalizeNullableFiniteNumber(input?.heading),
    sampledAtMs,
    recordedAtMs,
    source: normalizeNullableText(input?.source) ?? "offline_replay",
  };

  await pool.query(
    `
      INSERT INTO driver_location_history (
        route_id,
        company_id,
        driver_uid,
        trip_id,
        lat,
        lng,
        accuracy,
        speed,
        heading,
        sampled_at_ms,
        sampled_at,
        recorded_at_ms,
        recorded_at,
        source
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz, $12, $13::timestamptz, $14
      )
    `,
    [
      sample.routeId,
      sample.companyId,
      sample.driverUid,
      sample.tripId,
      sample.lat,
      sample.lng,
      sample.accuracy,
      sample.speed,
      sample.heading,
      sample.sampledAtMs,
      isoFromTimestampMs(sample.sampledAtMs),
      sample.recordedAtMs,
      isoFromTimestampMs(sample.recordedAtMs),
      sample.source,
    ],
  );

  return {
    routeId: sample.routeId,
    tripId: sample.tripId,
    sampledAtMs: sample.sampledAtMs,
    recordedAtMs: sample.recordedAtMs,
    source: sample.source,
  };
}
