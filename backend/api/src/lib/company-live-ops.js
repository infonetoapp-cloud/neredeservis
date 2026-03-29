import { listActiveTripsByCompany } from "./company-active-trips.js";
import { listCompanyRoutes } from "./company-routes.js";

function parseIsoToMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function toQueryLimit(value) {
  if (!Number.isFinite(value)) {
    return 200;
  }
  return Math.min(500, Math.max(1, Math.trunc(value)));
}

function toTripSortMs(trip) {
  return (
    parseIsoToMs(trip.lastLocationAt) ??
    parseIsoToMs(trip.updatedAt) ??
    parseIsoToMs(trip.startedAt) ??
    0
  );
}

function toItemSortMs(item) {
  return item.locationTimestampMs ?? parseIsoToMs(item.routeUpdatedAt) ?? 0;
}

function toStatusWeight(status) {
  if (status === "no_signal") {
    return 0;
  }
  if (status === "stale") {
    return 1;
  }
  if (status === "live") {
    return 2;
  }
  return 3;
}

export async function listCompanyLiveOpsSnapshot(_db, _unusedRealtimeStore, input) {
  const limit = toQueryLimit(input.limit);
  const liveOpsOnlineThresholdMs = Number.isFinite(input.liveOpsOnlineThresholdMs)
    ? Math.max(1_000, Math.trunc(input.liveOpsOnlineThresholdMs))
    : 60_000;

  const routesResult = await listCompanyRoutes(db, {
    companyId: input.companyId,
    limit,
    includeArchived: false,
  });
  const routes = Array.isArray(routesResult.items) ? routesResult.items : [];
  const generatedAt = new Date().toISOString();

  if (routes.length === 0) {
    return {
      companyId: input.companyId,
      generatedAt,
      items: [],
    };
  }

  const activeTripLimit = Math.min(500, Math.max(routes.length * 2, limit, 50));
  const activeTripsResult = await listActiveTripsByCompany(null, null, {
    companyId: input.companyId,
    limit: activeTripLimit,
    liveOpsOnlineThresholdMs,
  });
  const activeTrips = Array.isArray(activeTripsResult.items) ? activeTripsResult.items : [];
  const activeTripByRouteId = new Map();
  for (const trip of activeTrips) {
    const previous = activeTripByRouteId.get(trip.routeId);
    if (!previous || toTripSortMs(trip) > toTripSortMs(previous)) {
      activeTripByRouteId.set(trip.routeId, trip);
    }
  }

  const nowMs = Date.now();
  const items = routes
    .map((route) => {
      const activeTrip = activeTripByRouteId.get(route.routeId) ?? null;
      const live = activeTrip?.live ?? null;
      const lat = live?.lat ?? null;
      const lng = live?.lng ?? null;
      const speed = live?.speed ?? null;
      const heading = live?.heading ?? null;
      const accuracy = live?.accuracy ?? null;
      const locationTimestampMs =
        activeTrip?.locationTimestampMs ??
        parseIsoToMs(activeTrip?.lastLocationAt) ??
        parseIsoToMs(activeTrip?.updatedAt);

      let status = "idle";
      if (activeTrip) {
        if (activeTrip.liveState === "no_signal" || lat == null || lng == null) {
          status = "no_signal";
        } else if (
          activeTrip.liveState === "stale" ||
          locationTimestampMs == null ||
          nowMs - locationTimestampMs > liveOpsOnlineThresholdMs
        ) {
          status = "stale";
        } else {
          status = "live";
        }
      }

      return {
        routeId: route.routeId,
        routeName: route.name,
        routeUpdatedAt: route.updatedAt,
        scheduledTime: route.scheduledTime,
        timeSlot: route.timeSlot,
        passengerCount: route.passengerCount,
        tripId: activeTrip?.tripId ?? null,
        driverId: activeTrip?.driverUid ?? route.driverId ?? null,
        vehicleId: route.vehicleId,
        lat,
        lng,
        speed,
        heading,
        accuracy,
        locationTimestampMs,
        status,
      };
    })
    .sort((left, right) => {
      const weightDelta = toStatusWeight(left.status) - toStatusWeight(right.status);
      if (weightDelta !== 0) {
        return weightDelta;
      }

      const sortDelta = toItemSortMs(right) - toItemSortMs(left);
      if (sortDelta !== 0) {
        return sortDelta;
      }

      return left.routeName.localeCompare(right.routeName, "tr");
    });

  return {
    companyId: input.companyId,
    generatedAt,
    items,
  };
}
