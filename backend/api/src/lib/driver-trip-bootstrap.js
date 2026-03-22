import { listCompanyRouteStops } from "./company-route-stops.js";
import { getOptionalFirebaseAdminDb } from "./firebase-admin.js";
import { HttpError } from "./http.js";
import { loadDriverMyTrips } from "./driver-read-model.js";

function readTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
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

async function readDriverManagedRoute(db, uid, routeId) {
  const routesResult = await loadDriverMyTrips(db, uid);
  const managedRouteDocs =
    routesResult?.managedRouteDocs && typeof routesResult.managedRouteDocs === "object"
      ? routesResult.managedRouteDocs
      : {};
  const routeData = managedRouteDocs[routeId];
  if (!routeData || typeof routeData !== "object") {
    throw new HttpError(404, "not-found", "Rota bulunamadi.");
  }

  return {
    routeData,
    tripRows: Array.isArray(routesResult?.tripRows) ? routesResult.tripRows : [],
  };
}

async function readRoutePassengers(routeId) {
  const db = getOptionalFirebaseAdminDb();
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection("routes").doc(routeId).collection("passengers").limit(300).get();
    return snapshot.docs.map((documentSnapshot) => ({
      passengerId: documentSnapshot.id,
      passengerData: serializeFirestoreValue(documentSnapshot.data()) ?? {},
    }));
  } catch {
    return [];
  }
}

function selectTripData(tripRows, routeId, tripId) {
  const normalizedTripId = readTrimmedString(tripId);
  if (normalizedTripId) {
    const matchedTrip = tripRows.find((row) => readTrimmedString(row?.tripId) === normalizedTripId);
    if (matchedTrip?.tripData && typeof matchedTrip.tripData === "object") {
      return matchedTrip.tripData;
    }
  }

  const activeTrip = tripRows.find((row) => {
    const tripData = row?.tripData;
    return (
      tripData &&
      typeof tripData === "object" &&
      readTrimmedString(tripData.routeId) === routeId &&
      readTrimmedString(tripData.status) === "active"
    );
  });
  if (activeTrip?.tripData && typeof activeTrip.tripData === "object") {
    return activeTrip.tripData;
  }

  return null;
}

async function readRouteStops(companyId, routeId) {
  const normalizedCompanyId = readTrimmedString(companyId);
  if (!normalizedCompanyId) {
    return [];
  }

  const result = await listCompanyRouteStops(getOptionalFirebaseAdminDb(), {
    companyId: normalizedCompanyId,
    routeId,
  }).catch(() => null);
  const items = Array.isArray(result?.items) ? result.items : [];
  return items.map((item) => ({
    stopId: readTrimmedString(item?.stopId) ?? "",
    stopData: {
      name: readTrimmedString(item?.name),
      order: typeof item?.order === "number" ? item.order : 0,
      location: item?.location ?? null,
      createdAt: readTrimmedString(item?.createdAt),
      updatedAt: readTrimmedString(item?.updatedAt),
    },
  }));
}

export async function readDriverTripDetailBootstrap(db, uid, { routeId, tripId }) {
  const normalizedUid = readTrimmedString(uid);
  const normalizedRouteId = readTrimmedString(routeId);
  if (!normalizedUid || !normalizedRouteId) {
    throw new HttpError(400, "invalid-argument", "Rota bilgisi gecersiz.");
  }

  const { routeData, tripRows } = await readDriverManagedRoute(db, normalizedUid, normalizedRouteId);
  const companyId = readTrimmedString(routeData.companyId);
  const [stopRows, passengerRows] = await Promise.all([
    readRouteStops(companyId, normalizedRouteId),
    readRoutePassengers(normalizedRouteId),
  ]);

  return {
    routeData,
    stopRows,
    passengerRows,
    tripData: selectTripData(tripRows, normalizedRouteId, tripId),
  };
}

export async function readDriverTripCompletedBootstrap(db, uid, { routeId, tripId }) {
  const normalizedUid = readTrimmedString(uid);
  const normalizedRouteId = readTrimmedString(routeId);
  const normalizedTripId = readTrimmedString(tripId);
  if (!normalizedUid || !normalizedRouteId || !normalizedTripId) {
    throw new HttpError(400, "invalid-argument", "Trip bilgisi gecersiz.");
  }

  const { routeData, tripRows } = await readDriverManagedRoute(db, normalizedUid, normalizedRouteId);
  const companyId = readTrimmedString(routeData.companyId);
  const [stopRows, passengerRows] = await Promise.all([
    readRouteStops(companyId, normalizedRouteId),
    readRoutePassengers(normalizedRouteId),
  ]);

  return {
    routeData,
    stops: stopRows.map((item) => item.stopData),
    passengerCountFromRoutePassengersCollection: passengerRows.length,
    tripData: selectTripData(tripRows, normalizedRouteId, normalizedTripId),
  };
}
