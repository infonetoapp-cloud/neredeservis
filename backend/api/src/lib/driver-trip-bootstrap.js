import { listCompanyRouteStops } from "./company-route-stops.js";
import { readDriverLiveLocation } from "./driver-trip-runtime.js";
import { HttpError } from "./http.js";
import {
  listActiveGuestSessionsByRouteFromPostgres,
  listRoutePassengersFromPostgres,
  listRouteSkipPassengerIdsFromPostgres,
  shouldUsePostgresPassengerStore,
} from "./passenger-store.js";
import { loadDriverMyTrips } from "./driver-read-model.js";

function readTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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
  if (!shouldUsePostgresPassengerStore()) {
    return [];
  }

  const rows = await listRoutePassengersFromPostgres(routeId, { limit: 300 }).catch(() => []);
  return rows.map((row) => ({
    passengerId: readTrimmedString(row?.passengerUid) ?? "",
    passengerData: {
      name: readTrimmedString(row?.name),
      phone: readTrimmedString(row?.phone),
      showPhoneToDriver: row?.showPhoneToDriver === true,
      boardingArea: readTrimmedString(row?.boardingArea) ?? "",
      virtualStop: row?.virtualStop ?? null,
      virtualStopLabel: readTrimmedString(row?.virtualStopLabel),
      notificationTime: readTrimmedString(row?.notificationTime) ?? "",
      joinedAt: readTrimmedString(row?.joinedAt),
      updatedAt: readTrimmedString(row?.updatedAt),
    },
  }));
}

async function readRouteSkipTodayPassengerIds(routeId, dateKey) {
  const normalizedRouteId = readTrimmedString(routeId);
  const normalizedDateKey = readTrimmedString(dateKey);
  if (!shouldUsePostgresPassengerStore() || !normalizedRouteId || !normalizedDateKey) {
    return [];
  }

  return listRouteSkipPassengerIdsFromPostgres(normalizedRouteId, normalizedDateKey).catch(() => []);
}

async function readActiveGuestSessions(routeId) {
  const normalizedRouteId = readTrimmedString(routeId);
  if (!shouldUsePostgresPassengerStore() || !normalizedRouteId) {
    return [];
  }

  const rows = await listActiveGuestSessionsByRouteFromPostgres(normalizedRouteId, {
    limit: 300,
  }).catch(() => []);
  return rows.map((row) => ({
    sessionId: row.sessionId,
    routeId: row.routeId,
    routeName: row.routeName,
    guestUid: row.guestUid,
    guestDisplayName: row.guestDisplayName,
    expiresAt: row.expiresAt,
    status: row.status,
    revokeReason: row.revokeReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
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

  const result = await listCompanyRouteStops(null, {
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

export async function readDriverFinishTripSnapshot(db, uid, { routeId, tripId, dateKey }) {
  const normalizedUid = readTrimmedString(uid);
  const normalizedRouteId = readTrimmedString(routeId);
  if (!normalizedUid || !normalizedRouteId) {
    throw new HttpError(400, "invalid-argument", "Rota bilgisi gecersiz.");
  }

  const bootstrap = await readDriverTripDetailBootstrap(db, normalizedUid, {
    routeId: normalizedRouteId,
    tripId,
  });

  const [liveLocation, skipTodayPassengerIds, guestSessions] = await Promise.all([
    readDriverLiveLocation({
      uid: normalizedUid,
      routeId: normalizedRouteId,
    }).catch(() => null),
    readRouteSkipTodayPassengerIds(normalizedRouteId, dateKey),
    readActiveGuestSessions(normalizedRouteId),
  ]);

  return {
    ...bootstrap,
    skipTodayPassengerIds,
    guestSessions,
    liveLocation,
    generatedAt: new Date().toISOString(),
  };
}
