import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import {
  listCurrentPassengerRoutesFromPostgres,
  listDriverSnapshotsByIdsFromPostgres,
  listPassengerTripHistoryRowsFromPostgres,
} from "./trip-history-store.js";

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeRouteName(value) {
  return normalizeNullableText(value);
}

function readTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

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

async function readPrimaryPassengerMembershipFromPostgres(uid) {
  if (!isPostgresConfigured()) {
    return null;
  }

  const normalizedUid = normalizeNullableText(uid);
  const pool = getPostgresPool();
  if (!normalizedUid || !pool) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT route_id, name
      FROM company_routes
      WHERE is_archived = FALSE
        AND member_ids ? $1
      ORDER BY updated_at DESC NULLS LAST, route_id ASC
      LIMIT 1
    `,
    [normalizedUid],
  );

  const row = result.rows[0] ?? null;
  const routeId = normalizeNullableText(row?.route_id);
  if (!routeId) {
    return null;
  }

  return {
    routeId,
    routeName: normalizeRouteName(row?.name),
  };
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
    const passengerCount =
      typeof tripData?.passengerCount === "number"
        ? Math.trunc(tripData.passengerCount)
        : typeof tripData?.passengerCount === "string" && tripData.passengerCount.trim().length > 0
          ? Math.trunc(Number(tripData.passengerCount))
          : null;
    const updatedAt = parseIsoDate(tripData?.routeUpdatedAt) ?? parseIsoDate(tripData?.updatedAt);
    snapshotMap[routeId] = {
      ...(existing && typeof existing === "object" ? existing : {}),
      ...(routeName ? { name: routeName } : {}),
      ...(driverId ? { driverId } : {}),
      ...(Number.isFinite(passengerCount) ? { passengerCount } : {}),
      ...(updatedAt ? { updatedAt } : {}),
    };
  }

  return snapshotMap;
}

export async function readPrimaryPassengerMembership(_db, uid) {
  return readPrimaryPassengerMembershipFromPostgres(uid);
}

export async function loadPassengerTripHistory(_db, uid) {
  const normalizedUid = normalizeNullableText(uid);
  if (!normalizedUid || !isPostgresConfigured()) {
    return {
      tripRows: [],
      candidateRoutesById: {},
      driversById: {},
    };
  }

  const candidateRoutesById = await listCurrentPassengerRoutesFromPostgres(normalizedUid, {
    limit: 80,
  }).catch(() => ({}));
  const tripRows = await listPassengerTripHistoryRowsFromPostgres(normalizedUid, {
    limit: 180,
  }).catch(() => []);
  const mergedRoutesById = mergeRouteSnapshotsIntoMap(candidateRoutesById, tripRows);
  const driverIds = Array.from(
    new Set(
      tripRows
        .map((row) => readTrimmedString(row?.tripData?.driverId) ?? readTrimmedString(row?.tripData?.driverUid))
        .filter((driverId) => driverId),
    ),
  );
  const driversById = await listDriverSnapshotsByIdsFromPostgres(driverIds).catch(() => ({}));

  return {
    tripRows,
    candidateRoutesById: mergedRoutesById,
    driversById,
  };
}
