import { FieldPath } from "firebase-admin/firestore";

import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import {
  listCurrentPassengerRoutesFromPostgres,
  listDriverSnapshotsByIdsFromPostgres,
  listPassengerTripHistoryRowsFromPostgres,
  upsertTripHistoryBatchToPostgres,
} from "./trip-history-store.js";

function requireFirestoreDb(db) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("Passenger read model storage is not available.");
  }
  return db;
}

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeRouteName(value) {
  return normalizeNullableText(value);
}

function parseIsoDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value.trim();
  }

  if (value && typeof value === "object" && typeof value.toDate === "function") {
    try {
      const parsed = value.toDate();
      if (parsed instanceof Date && Number.isFinite(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      return null;
    }
  }

  return null;
}

function serializeFirestoreValue(value) {
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
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    const result = {};
    for (const [key, nestedValue] of entries) {
      result[key] = serializeFirestoreValue(nestedValue);
    }
    return result;
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

async function readPrimaryPassengerMembershipFromFirestore(db, uid) {
  const firestoreDb = requireFirestoreDb(db);
  const normalizedUid = normalizeNullableText(uid);
  if (!normalizedUid) {
    return null;
  }

  try {
    const routeQuery = await firestoreDb
      .collection("routes")
      .where("memberIds", "array-contains", normalizedUid)
      .limit(1)
      .get();
    if (!routeQuery.empty) {
      const snapshot = routeQuery.docs[0];
      if (snapshot) {
        return {
          routeId: snapshot.id,
          routeName: normalizeRouteName(snapshot.data()?.name),
        };
      }
    }
  } catch {
    // Fall through to collection-group fallback.
  }

  try {
    const passengerQuery = await firestoreDb
      .collectionGroup("passengers")
      .where(FieldPath.documentId(), "==", normalizedUid)
      .limit(1)
      .get();
    if (passengerQuery.empty) {
      return null;
    }

    const passengerDoc = passengerQuery.docs[0];
    const routeRef = passengerDoc?.ref?.parent?.parent ?? null;
    if (!routeRef?.id) {
      return null;
    }

    let routeName = null;
    try {
      const routeSnapshot = await routeRef.get();
      routeName = normalizeRouteName(routeSnapshot.data()?.name);
    } catch {
      routeName = null;
    }

    return {
      routeId: routeRef.id,
      routeName,
    };
  } catch {
    return null;
  }
}

function readTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toSortableDate(value) {
  const isoDate = parseIsoDate(value);
  if (!isoDate) {
    return null;
  }

  const timestamp = Date.parse(isoDate);
  return Number.isFinite(timestamp) ? timestamp : null;
}

async function fetchCollectionDocumentsByIds(db, { collectionPath, documentIds }) {
  const firestoreDb = requireFirestoreDb(db);
  const uniqueIds = Array.from(
    new Set(documentIds.filter((item) => typeof item === "string" && item.trim().length > 0)),
  );
  if (uniqueIds.length === 0) {
    return {};
  }

  const result = {};
  for (let index = 0; index < uniqueIds.length; index += 10) {
    const batch = uniqueIds.slice(index, index + 10);
    const snapshot = await firestoreDb
      .collection(collectionPath)
      .where(FieldPath.documentId(), "in", batch)
      .get();
    for (const documentSnapshot of snapshot.docs) {
      result[documentSnapshot.id] = serializeFirestoreValue(documentSnapshot.data());
    }
  }

  return result;
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

function buildTripHistoryProjection(row, routesById, driversById) {
  const tripData = row?.tripData && typeof row.tripData === "object" ? row.tripData : null;
  const tripId = readTrimmedString(row?.tripId);
  const routeId = readTrimmedString(tripData?.routeId);
  const status = readTrimmedString(tripData?.status)?.toLowerCase();
  if (!tripId || !routeId || !status || status === "active") {
    return null;
  }

  const routeData =
    routesById && typeof routesById === "object" && routesById[routeId] && typeof routesById[routeId] === "object"
      ? routesById[routeId]
      : null;
  const driverId =
    readTrimmedString(tripData?.driverId) ??
    readTrimmedString(tripData?.driverUid) ??
    readTrimmedString(routeData?.driverId);
  const driverData =
    driverId &&
    driversById &&
    typeof driversById === "object" &&
    driversById[driverId] &&
    typeof driversById[driverId] === "object"
      ? driversById[driverId]
      : null;
  const driverSnapshot =
    tripData?.driverSnapshot && typeof tripData.driverSnapshot === "object" && !Array.isArray(tripData.driverSnapshot)
      ? tripData.driverSnapshot
      : {};
  const companyId = readTrimmedString(routeData?.companyId) ?? readTrimmedString(tripData?.companyId);
  const routeName = readTrimmedString(routeData?.name) ?? readTrimmedString(tripData?.routeName);
  const driverName = readTrimmedString(driverSnapshot?.name) ?? readTrimmedString(driverData?.name);
  if (!companyId || !routeName || !driverId || !driverName) {
    return null;
  }

  return {
    tripId,
    companyId,
    routeId,
    routeName,
    routeUpdatedAt: parseIsoDate(routeData?.updatedAt) ?? parseIsoDate(tripData?.routeUpdatedAt),
    driverUid: driverId,
    driverName,
    driverPlate: readTrimmedString(driverSnapshot?.plate) ?? readTrimmedString(driverData?.plate),
    driverPhotoUrl: readTrimmedString(driverSnapshot?.photoUrl) ?? readTrimmedString(driverData?.photoUrl),
    status,
    startedAt: parseIsoDate(tripData?.startedAt),
    endedAt: parseIsoDate(tripData?.endedAt),
    updatedAt: parseIsoDate(tripData?.updatedAt) ?? parseIsoDate(tripData?.endedAt) ?? parseIsoDate(tripData?.startedAt),
    vehicleId: readTrimmedString(routeData?.vehicleId) ?? readTrimmedString(tripData?.vehicleId),
    scheduledTime: readTrimmedString(routeData?.scheduledTime) ?? readTrimmedString(tripData?.scheduledTime),
    timeSlot: readTrimmedString(routeData?.timeSlot) ?? readTrimmedString(tripData?.timeSlot),
    passengerCount:
      (typeof tripData?.passengerCount === "number" ? Math.trunc(tripData.passengerCount) : null) ??
      (typeof routeData?.passengerCount === "number" ? Math.trunc(routeData.passengerCount) : 0),
    driverSnapshot: {
      ...driverSnapshot,
      ...(driverName ? { name: driverName } : {}),
      ...(readTrimmedString(driverSnapshot?.plate) ?? readTrimmedString(driverData?.plate)
        ? { plate: readTrimmedString(driverSnapshot?.plate) ?? readTrimmedString(driverData?.plate) }
        : {}),
      ...(readTrimmedString(driverSnapshot?.photoUrl) ?? readTrimmedString(driverData?.photoUrl)
        ? { photoUrl: readTrimmedString(driverSnapshot?.photoUrl) ?? readTrimmedString(driverData?.photoUrl) }
        : {}),
    },
  };
}

async function backfillPassengerTripHistoryRows(tripRows, routesById, driversById) {
  const projections = (Array.isArray(tripRows) ? tripRows : [])
    .map((row) => buildTripHistoryProjection(row, routesById, driversById))
    .filter((item) => item !== null);
  if (projections.length === 0) {
    return false;
  }

  return upsertTripHistoryBatchToPostgres(projections);
}

export async function readPrimaryPassengerMembership(db, uid) {
  if (isPostgresConfigured()) {
    return readPrimaryPassengerMembershipFromPostgres(uid);
  }
  return readPrimaryPassengerMembershipFromFirestore(db, uid);
}

export async function loadPassengerTripHistory(db, uid) {
  const normalizedUid = normalizeNullableText(uid);
  if (!normalizedUid) {
    return {
      tripRows: [],
      candidateRoutesById: {},
      driversById: {},
    };
  }

  if (isPostgresConfigured()) {
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

  const firestoreDb = requireFirestoreDb(db);
  const routeSnapshot = await firestoreDb
    .collection("routes")
    .where("memberIds", "array-contains", normalizedUid)
    .limit(80)
    .get();
  if (routeSnapshot.empty) {
    return {
      tripRows: [],
      candidateRoutesById: {},
      driversById: {},
    };
  }

  const candidateRoutesById = {};
  for (const doc of routeSnapshot.docs) {
    const routeData = doc.data();
    const ownerDriverId = readTrimmedString(routeData?.driverId);
    if (ownerDriverId === normalizedUid) {
      continue;
    }
    candidateRoutesById[doc.id] = serializeFirestoreValue(routeData);
  }

  const sortedRouteIds = Object.entries(candidateRoutesById)
    .sort((left, right) => {
      const leftTime = toSortableDate(left[1]?.updatedAt) ?? 0;
      const rightTime = toSortableDate(right[1]?.updatedAt) ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, 20)
    .map(([routeId]) => routeId);

  if (sortedRouteIds.length === 0) {
    return {
      tripRows: [],
      candidateRoutesById,
      driversById: {},
    };
  }

  const tripSnapshots = await Promise.all(
    sortedRouteIds.map((routeId) =>
      firestoreDb.collection("trips").where("routeId", "==", routeId).limit(80).get(),
    ),
  );

  const tripRows = [];
  const driverIds = new Set();
  for (const snapshot of tripSnapshots) {
    for (const doc of snapshot.docs) {
      const tripData = serializeFirestoreValue(doc.data());
      tripRows.push({
        tripId: doc.id,
        tripData,
      });

      const routeId = readTrimmedString(tripData?.routeId);
      const routeData = routeId ? candidateRoutesById[routeId] : null;
      const driverId = readTrimmedString(tripData?.driverId) ?? readTrimmedString(routeData?.driverId);
      if (driverId) {
        driverIds.add(driverId);
      }
    }
  }

  const driversById = await fetchCollectionDocumentsByIds(firestoreDb, {
    collectionPath: "drivers",
    documentIds: Array.from(driverIds),
  }).catch(() => ({}));

  if (isPostgresConfigured()) {
    await backfillPassengerTripHistoryRows(tripRows, candidateRoutesById, driversById).catch(() => false);
  }

  return {
    tripRows,
    candidateRoutesById,
    driversById,
  };
}
