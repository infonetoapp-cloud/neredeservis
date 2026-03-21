import {
  replaceCompanyActiveTripsForCompany,
  isCompanyActiveTripsFreshInPostgres,
  listCompanyActiveTripsFromPostgres,
  shouldUsePostgresCompanyActiveTripStore,
} from "./company-active-trip-store.js";
import { backfillCompanyFromFirestoreRecord } from "./company-membership-store.js";
import { asRecord, pickString } from "./runtime-value.js";

const COMPANY_ACTIVE_TRIPS_CACHE_MAX_AGE_MS = 15_000;

function pickFiniteNumber(record, key) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseIsoToMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

async function backfillCompanyRecordFromFirestore(db, companyId) {
  const companySnapshot = await db.collection("companies").doc(companyId).get();
  if (!companySnapshot.exists) {
    return false;
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  return backfillCompanyFromFirestoreRecord({
    companyId,
    name: pickString(companyData, "name"),
    legalName: pickString(companyData, "legalName"),
    status: pickString(companyData, "status"),
    billingStatus: pickString(companyData, "billingStatus"),
    billingValidUntil: pickString(companyData, "billingValidUntil"),
    timezone: pickString(companyData, "timezone"),
    countryCode: pickString(companyData, "countryCode"),
    contactPhone: pickString(companyData, "contactPhone"),
    contactEmail: pickString(companyData, "contactEmail"),
    logoUrl: pickString(companyData, "logoUrl"),
    address: pickString(companyData, "address"),
    vehicleLimit: companyData?.vehicleLimit,
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  });
}

async function readActiveTripsFromFirestore(db, rtdb, input) {
  const routeFilterId = input.routeId ?? null;
  const driverFilterUid = input.driverUid ?? null;
  const limit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  const overfetchLimit = Math.min(Math.max(limit * 4, limit), 200);

  const tripsSnapshot = await db
    .collection("trips")
    .where("status", "==", "active")
    .limit(overfetchLimit)
    .get();

  const rawTrips = tripsSnapshot.docs
    .map((documentSnapshot) => {
      const tripData = asRecord(documentSnapshot.data()) ?? {};
      const routeId = pickString(tripData, "routeId");
      const driverUid = pickString(tripData, "driverId");
      if (!routeId || !driverUid || pickString(tripData, "status") !== "active") {
        return null;
      }
      if (routeFilterId && routeId !== routeFilterId) {
        return null;
      }
      if (driverFilterUid && driverUid !== driverFilterUid) {
        return null;
      }

      const driverSnapshot = asRecord(tripData.driverSnapshot);
      return {
        tripId: documentSnapshot.id,
        routeId,
        driverUid,
        startedAt: pickString(tripData, "startedAt"),
        lastLocationAt: pickString(tripData, "lastLocationAt"),
        updatedAt: pickString(tripData, "updatedAt"),
        driverName: pickString(driverSnapshot, "name") ?? `Sofor (${driverUid.slice(0, 6)})`,
        driverPlate: pickString(driverSnapshot, "plate"),
      };
    })
    .filter((item) => item !== null);

  if (rawTrips.length === 0) {
    return { items: [] };
  }

  const uniqueRouteIds = Array.from(new Set(rawTrips.map((trip) => trip.routeId)));
  const routeSnapshots = await Promise.all(
    uniqueRouteIds.map((routeId) => db.collection("routes").doc(routeId).get()),
  );
  const routeMetaById = new Map();
  for (const routeSnapshot of routeSnapshots) {
    if (!routeSnapshot.exists) {
      continue;
    }

    const routeData = asRecord(routeSnapshot.data()) ?? {};
    routeMetaById.set(routeSnapshot.id, {
      companyId: pickString(routeData, "companyId"),
      visibility: pickString(routeData, "visibility"),
      routeName: pickString(routeData, "name") ?? `Route (${routeSnapshot.id.slice(0, 6)})`,
      routeUpdatedAt: pickString(routeData, "updatedAt"),
      vehicleId: pickString(routeData, "vehicleId"),
      scheduledTime: pickString(routeData, "scheduledTime"),
      timeSlot: pickString(routeData, "timeSlot"),
      passengerCount: pickFiniteNumber(routeData, "passengerCount") ?? 0,
    });
  }

  const nowMs = Date.now();
  const candidateTrips = rawTrips
    .map((trip) => {
      const routeMeta = routeMetaById.get(trip.routeId);
      if (!routeMeta) {
        return null;
      }
      if (!routeMeta.companyId || routeMeta.companyId !== input.companyId) {
        return null;
      }
      if (routeMeta.visibility && routeMeta.visibility !== "company") {
        return null;
      }
      return { ...trip, ...routeMeta };
    })
    .filter((item) => item !== null)
    .sort(
      (left, right) =>
        (parseIsoToMs(right.lastLocationAt) ?? parseIsoToMs(right.updatedAt) ?? 0) -
        (parseIsoToMs(left.lastLocationAt) ?? parseIsoToMs(left.updatedAt) ?? 0),
    )
    .slice(0, limit);

  if (candidateTrips.length === 0) {
    return { items: [] };
  }

  const uniqueCandidateRouteIds = Array.from(new Set(candidateTrips.map((trip) => trip.routeId)));
  const rtdbPayloadByRouteId = new Map();
  if (rtdb) {
    await Promise.all(
      uniqueCandidateRouteIds.map(async (routeId) => {
        try {
          const locationSnapshot = await rtdb.ref(`locations/${routeId}`).get();
          rtdbPayloadByRouteId.set(routeId, asRecord(locationSnapshot.val()));
        } catch {
          rtdbPayloadByRouteId.set(routeId, null);
        }
      }),
    );
  } else {
    for (const routeId of uniqueCandidateRouteIds) {
      rtdbPayloadByRouteId.set(routeId, null);
    }
  }

  const items = candidateTrips.map((trip) => {
    const lastLocationAtMs = parseIsoToMs(trip.lastLocationAt);
    const rtdbPayload = rtdbPayloadByRouteId.get(trip.routeId) ?? null;
    const payloadTripId = pickString(rtdbPayload, "tripId");
    const payloadLat = pickFiniteNumber(rtdbPayload, "lat");
    const payloadLng = pickFiniteNumber(rtdbPayload, "lng");
    const payloadSpeed = pickFiniteNumber(rtdbPayload, "speed");
    const payloadHeading = pickFiniteNumber(rtdbPayload, "heading");
    const payloadAccuracy = pickFiniteNumber(rtdbPayload, "accuracy");
    const payloadTimestampMs = pickFiniteNumber(rtdbPayload, "timestamp");
    const hasRtdbCoordinates =
      payloadTripId === trip.tripId && payloadLat != null && payloadLng != null;
    const locationTimestampMs =
      hasRtdbCoordinates
        ? payloadTimestampMs ?? lastLocationAtMs ?? parseIsoToMs(trip.updatedAt)
        : lastLocationAtMs ?? parseIsoToMs(trip.updatedAt);
    const stale =
      locationTimestampMs == null ||
      nowMs - locationTimestampMs > (input.liveOpsOnlineThresholdMs ?? 60_000);
    const liveState = hasRtdbCoordinates ? (stale ? "stale" : "online") : "no_signal";

    return {
      tripId: trip.tripId,
      routeId: trip.routeId,
      companyId: input.companyId,
      routeName: trip.routeName,
      routeUpdatedAt: trip.routeUpdatedAt,
      driverUid: trip.driverUid,
      driverName: trip.driverName,
      driverPlate: trip.driverPlate,
      status: "active",
      startedAt: trip.startedAt,
      lastLocationAt: trip.lastLocationAt,
      updatedAt: trip.updatedAt,
      liveState,
      vehicleId: trip.vehicleId,
      scheduledTime: trip.scheduledTime,
      timeSlot: trip.timeSlot,
      passengerCount: trip.passengerCount ?? 0,
      locationTimestampMs,
      live: {
        lat: hasRtdbCoordinates ? payloadLat : null,
        lng: hasRtdbCoordinates ? payloadLng : null,
        speed: hasRtdbCoordinates ? payloadSpeed : null,
        heading: hasRtdbCoordinates ? payloadHeading : null,
        accuracy: hasRtdbCoordinates ? payloadAccuracy : null,
        source: hasRtdbCoordinates ? "rtdb" : "trip_doc",
        stale,
      },
    };
  });

  return { items };
}

export async function listActiveTripsByCompany(db, rtdb, input) {
  const limit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  const routeFilterId = input.routeId ?? null;
  const driverFilterUid = input.driverUid ?? null;

  if (shouldUsePostgresCompanyActiveTripStore()) {
    const tripsFresh = await isCompanyActiveTripsFreshInPostgres(
      input.companyId,
      COMPANY_ACTIVE_TRIPS_CACHE_MAX_AGE_MS,
    ).catch(() => false);
    if (tripsFresh) {
      const items = await listCompanyActiveTripsFromPostgres(input.companyId, {
        limit,
        routeId: routeFilterId,
        driverUid: driverFilterUid,
      }).catch(() => null);
      if (items) {
        return { items };
      }
    }
  }

  const result = await readActiveTripsFromFirestore(db, rtdb, input);

  if (
    shouldUsePostgresCompanyActiveTripStore() &&
    routeFilterId == null &&
    driverFilterUid == null
  ) {
    await backfillCompanyRecordFromFirestore(db, input.companyId).catch(() => false);
    await replaceCompanyActiveTripsForCompany(
      input.companyId,
      result.items,
      new Date().toISOString(),
    ).catch(() => false);
  }

  return result;
}
