import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import {
  listDriverActiveTripRowsFromPostgres,
  listDriverTripHistoryRowsFromPostgres,
  listRouteSnapshotsByIdsFromPostgres,
} from "./trip-history-store.js";

function parseIsoDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value.trim();
  }

  return null;
}

function serializeValue(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  const isoDate = parseIsoDate(value);
  if (isoDate) {
    return isoDate;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (value && typeof value === "object") {
    const result = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = serializeValue(nestedValue);
    }
    return result;
  }

  return null;
}

function readTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
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

function formatManagedRouteRow(row) {
  const routeId = readTrimmedString(row?.route_id);
  if (!routeId) {
    return null;
  }

  return {
    companyId: readTrimmedString(row?.company_id),
    name: readTrimmedString(row?.name),
    driverId: readTrimmedString(row?.driver_id),
    authorizedDriverIds: Array.isArray(row?.authorized_driver_ids) ? row.authorized_driver_ids : [],
    scheduledTime: readTrimmedString(row?.scheduled_time),
    timeSlot: readTrimmedString(row?.time_slot),
    isArchived: normalizeBoolean(row?.is_archived, false),
    allowGuestTracking: normalizeBoolean(row?.allow_guest_tracking, false),
    startAddress: readTrimmedString(row?.start_address),
    endAddress: readTrimmedString(row?.end_address),
    startPoint: serializeValue(row?.start_point),
    endPoint: serializeValue(row?.end_point),
    passengerCount: normalizeInteger(row?.passenger_count) ?? 0,
    srvCode: readTrimmedString(row?.srv_code),
    routePolyline: serializeValue(row?.route_polyline),
    updatedAt: parseIsoDate(row?.updated_at),
  };
}

async function loadManagedRoutesFromPostgres(uid) {
  if (!isPostgresConfigured()) {
    return {};
  }

  const normalizedUid = readTrimmedString(uid);
  const pool = getPostgresPool();
  if (!normalizedUid || !pool) {
    return {};
  }

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
        allow_guest_tracking,
        start_address,
        end_address,
        start_point,
        end_point,
        passenger_count,
        srv_code,
        route_polyline,
        updated_at
      FROM company_routes
      WHERE is_archived = FALSE
        AND (
          driver_id = $1
          OR authorized_driver_ids ? $1
        )
      ORDER BY updated_at DESC NULLS LAST, route_id ASC
      LIMIT 160
    `,
    [normalizedUid],
  );

  const routesById = {};
  for (const row of result.rows) {
    const routeId = readTrimmedString(row?.route_id);
    const route = formatManagedRouteRow(row);
    if (!routeId || !route) {
      continue;
    }
    routesById[routeId] = route;
  }
  return routesById;
}

function mergeRouteSnapshotsIntoMap(routesById, tripRows) {
  const snapshotMap = routesById && typeof routesById === "object" ? { ...routesById } : {};
  for (const row of Array.isArray(tripRows) ? tripRows : []) {
    const tripData = row?.tripData && typeof row.tripData === "object" ? row.tripData : null;
    const routeId = readTrimmedString(tripData?.routeId);
    if (!routeId) {
      continue;
    }

    const existing = snapshotMap[routeId];
    const routeName = readTrimmedString(tripData?.routeName);
    const driverId = readTrimmedString(tripData?.driverId) ?? readTrimmedString(tripData?.driverUid);
    const passengerCount = normalizeInteger(tripData?.passengerCount);
    const updatedAt = parseIsoDate(tripData?.routeUpdatedAt) ?? parseIsoDate(tripData?.updatedAt);
    snapshotMap[routeId] = {
      ...(existing && typeof existing === "object" ? existing : {}),
      ...(routeName ? { name: routeName } : {}),
      ...(driverId ? { driverId } : {}),
      ...(passengerCount != null ? { passengerCount } : {}),
      ...(updatedAt ? { updatedAt } : {}),
    };
  }

  return snapshotMap;
}

export async function loadDriverTripHistory(_db, uid) {
  const normalizedUid = readTrimmedString(uid);
  if (!normalizedUid || !isPostgresConfigured()) {
    return {
      tripRows: [],
      routesById: {},
    };
  }

  const tripRows = await listDriverTripHistoryRowsFromPostgres(normalizedUid, { limit: 180 }).catch(() => []);
  const routeIds = Array.from(
    new Set(
      tripRows
        .map((row) => readTrimmedString(row?.tripData?.routeId))
        .filter((routeId) => routeId),
    ),
  );
  const routesById = mergeRouteSnapshotsIntoMap(
    await listRouteSnapshotsByIdsFromPostgres(routeIds).catch(() => ({})),
    tripRows,
  );

  return {
    tripRows,
    routesById,
  };
}

export async function loadDriverMyTrips(_db, uid) {
  const managedRouteDocs = await loadManagedRoutesFromPostgres(uid);
  const tripRows = await (async () => {
    const normalizedUid = readTrimmedString(uid);
    if (!normalizedUid || !isPostgresConfigured()) {
      return [];
    }
    const [activeTripRows, historyTripRows] = await Promise.all([
      listDriverActiveTripRowsFromPostgres(normalizedUid, { limit: 80 }).catch(() => []),
      listDriverTripHistoryRowsFromPostgres(normalizedUid, { limit: 180 }).catch(() => []),
    ]);
    return [...activeTripRows, ...historyTripRows];
  })();

  const missingRouteIds = tripRows
    .map((row) => readTrimmedString(row?.tripData?.routeId))
    .filter((routeId) => routeId && !managedRouteDocs[routeId]);
  if (missingRouteIds.length > 0) {
    const fetchedRoutes = await listRouteSnapshotsByIdsFromPostgres(missingRouteIds).catch(() => ({}));
    Object.assign(managedRouteDocs, fetchedRoutes);
  }

  return {
    managedRouteDocs,
    tripRows,
  };
}

export async function listDriverRouteCandidates(_db, uid) {
  const normalizedUid = readTrimmedString(uid);
  if (!normalizedUid) {
    return [];
  }

  const managedRouteDocs = await loadManagedRoutesFromPostgres(normalizedUid);

  return Object.entries(managedRouteDocs).map(([routeId, routeData]) => ({
    routeId,
    routeName: readTrimmedString(routeData?.name) ?? "Sofor Rotasi",
    updatedAtUtc: parseIsoDate(routeData?.updatedAt) ?? new Date(0).toISOString(),
    isOwnedByCurrentDriver: readTrimmedString(routeData?.driverId) === normalizedUid,
  }));
}

export async function listDriverRouteStops(_db, uid, routeId) {
  const normalizedUid = readTrimmedString(uid);
  const normalizedRouteId = readTrimmedString(routeId);
  if (!normalizedUid || !normalizedRouteId || !isPostgresConfigured()) {
    return [];
  }

  const managedRouteDocs = await loadManagedRoutesFromPostgres(normalizedUid);
  if (!managedRouteDocs[normalizedRouteId]) {
    return [];
  }

  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT
        stop_id,
        name,
        stop_order,
        location,
        address,
        note,
        created_at,
        updated_at
      FROM company_route_stops
      WHERE route_id = $1
      ORDER BY stop_order ASC, stop_id ASC
    `,
    [normalizedRouteId],
  );

  return result.rows.map((row) => ({
    stopId: readTrimmedString(row?.stop_id) ?? "",
    name: readTrimmedString(row?.name) ?? "Durak",
    order: normalizeInteger(row?.stop_order) ?? 0,
    location: serializeValue(row?.location),
    address: readTrimmedString(row?.address),
    note: readTrimmedString(row?.note),
    createdAt: parseIsoDate(row?.created_at),
    updatedAt: parseIsoDate(row?.updated_at),
  }));
}
