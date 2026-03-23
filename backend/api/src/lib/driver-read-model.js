import { FieldPath } from "firebase-admin/firestore";

import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

function requireFirestoreDb(db) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("Driver read model storage is not available.");
  }
  return db;
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
    const result = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = serializeFirestoreValue(nestedValue);
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
    startPoint: serializeFirestoreValue(row?.start_point),
    endPoint: serializeFirestoreValue(row?.end_point),
    passengerCount: normalizeInteger(row?.passenger_count) ?? 0,
    srvCode: readTrimmedString(row?.srv_code),
    routePolyline: serializeFirestoreValue(row?.route_polyline),
    updatedAt: parseIsoDate(row?.updated_at),
  };
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

async function loadManagedRoutesFromFirestore(db, uid) {
  const firestoreDb = requireFirestoreDb(db);
  const normalizedUid = readTrimmedString(uid);
  if (!normalizedUid) {
    return {};
  }

  const routeSnapshots = [];
  const routesCollection = firestoreDb.collection("routes");
  try {
    routeSnapshots.push(await routesCollection.where("driverId", "==", normalizedUid).limit(80).get());
  } catch {
    // Best effort.
  }
  try {
    routeSnapshots.push(
      await routesCollection.where("authorizedDriverIds", "array-contains", normalizedUid).limit(80).get(),
    );
  } catch {
    // Best effort.
  }

  const managedRouteDocs = {};
  for (const snapshot of routeSnapshots) {
    for (const doc of snapshot.docs) {
      const data = serializeFirestoreValue(doc.data());
      if (data?.isArchived === true) {
        continue;
      }
      managedRouteDocs[doc.id] = data;
    }
  }
  return managedRouteDocs;
}

async function loadDriverTripRowsFromFirestore(db, uid) {
  const firestoreDb = requireFirestoreDb(db);
  const normalizedUid = readTrimmedString(uid);
  if (!normalizedUid) {
    return [];
  }

  let tripsSnapshot = null;
  try {
    tripsSnapshot = await firestoreDb
      .collection("trips")
      .where("driverId", "==", normalizedUid)
      .limit(220)
      .get();
  } catch {
    tripsSnapshot = null;
  }

  const tripRows = [];
  for (const doc of tripsSnapshot?.docs ?? []) {
    tripRows.push({
      tripId: doc.id,
      tripData: serializeFirestoreValue(doc.data()),
    });
  }
  return tripRows;
}

export async function loadDriverTripHistory(db, uid) {
  const firestoreDb = requireFirestoreDb(db);
  const normalizedUid = readTrimmedString(uid);
  if (!normalizedUid) {
    return {
      tripRows: [],
      routesById: {},
    };
  }

  const tripsSnapshot = await firestoreDb
    .collection("trips")
    .where("driverId", "==", normalizedUid)
    .limit(180)
    .get();
  if (tripsSnapshot.empty) {
    return {
      tripRows: [],
      routesById: {},
    };
  }

  const tripRows = [];
  const routeIds = new Set();
  for (const doc of tripsSnapshot.docs) {
    const tripData = serializeFirestoreValue(doc.data());
    tripRows.push({
      tripId: doc.id,
      tripData,
    });

    const routeId = readTrimmedString(tripData?.routeId);
    if (routeId) {
      routeIds.add(routeId);
    }
  }

  const routesById = await fetchCollectionDocumentsByIds(firestoreDb, {
    collectionPath: "routes",
    documentIds: Array.from(routeIds),
  }).catch(() => ({}));

  return {
    tripRows,
    routesById,
  };
}

export async function loadDriverMyTrips(db, uid) {
  const managedRouteDocs = isPostgresConfigured()
    ? await loadManagedRoutesFromPostgres(uid)
    : {
        ...(await loadManagedRoutesFromPostgres(uid)),
        ...(await loadManagedRoutesFromFirestore(db, uid).catch(() => ({}))),
      };
  const tripRows = await loadDriverTripRowsFromFirestore(db, uid);

  const missingRouteIds = tripRows
    .map((row) => readTrimmedString(row?.tripData?.routeId))
    .filter((routeId) => routeId && !managedRouteDocs[routeId]);
  if (missingRouteIds.length > 0) {
    const fetchedRoutes = await fetchCollectionDocumentsByIds(db, {
      collectionPath: "routes",
      documentIds: missingRouteIds,
    }).catch(() => ({}));
    Object.assign(managedRouteDocs, fetchedRoutes);
  }

  return {
    managedRouteDocs,
    tripRows,
  };
}

export async function listDriverRouteCandidates(db, uid) {
  const normalizedUid = readTrimmedString(uid);
  if (!normalizedUid) {
    return [];
  }

  const managedRouteDocs = isPostgresConfigured()
    ? await loadManagedRoutesFromPostgres(normalizedUid)
    : {
        ...(await loadManagedRoutesFromPostgres(normalizedUid)),
        ...(await loadManagedRoutesFromFirestore(db, normalizedUid).catch(() => ({}))),
      };

  return Object.entries(managedRouteDocs).map(([routeId, routeData]) => ({
    routeId,
    routeName: readTrimmedString(routeData?.name) ?? "Sofor Rotasi",
    updatedAtUtc: parseIsoDate(routeData?.updatedAt) ?? new Date(0).toISOString(),
    isOwnedByCurrentDriver: readTrimmedString(routeData?.driverId) === normalizedUid,
  }));
}

export async function listDriverRouteStops(db, uid, routeId) {
  const normalizedUid = readTrimmedString(uid);
  const normalizedRouteId = readTrimmedString(routeId);
  if (!normalizedUid || !normalizedRouteId) {
    return [];
  }

  const managedRouteDocs = isPostgresConfigured()
    ? await loadManagedRoutesFromPostgres(normalizedUid)
    : {
        ...(await loadManagedRoutesFromPostgres(normalizedUid)),
        ...(await loadManagedRoutesFromFirestore(db, normalizedUid).catch(() => ({}))),
      };
  if (!managedRouteDocs[normalizedRouteId]) {
    return [];
  }

  const pool = getPostgresPool();
  if (pool) {
    const result = await pool.query(
      `
        SELECT stop_id, name, stop_order
        FROM company_route_stops
        WHERE route_id = $1
        ORDER BY stop_order ASC, updated_at DESC, stop_id ASC
      `,
      [normalizedRouteId],
    );
    if (isPostgresConfigured()) {
      return result.rows.map((row) => ({
        stopId: readTrimmedString(row?.stop_id) ?? "",
        name: readTrimStringOrFallback(row?.name, "Durak"),
        order: normalizeInteger(row?.stop_order) ?? 9999,
        passengersWaiting: null,
      }));
    }
  }

  const firestoreDb = requireFirestoreDb(db);
  const snapshot = await firestoreDb
    .collection("routes")
    .doc(normalizedRouteId)
    .collection("stops")
    .orderBy("order")
    .limit(40)
    .get()
    .catch(() => null);
  if (!snapshot) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      stopId: doc.id,
      name: readTrimStringOrFallback(data?.name, "Durak"),
      order: normalizeInteger(data?.order) ?? 9999,
      passengersWaiting: normalizeInteger(data?.passengersWaiting),
    };
  });
}

function readTrimStringOrFallback(value, fallback) {
  return readTrimmedString(value) ?? fallback;
}
