import { asRecord, pickString } from "./runtime-value.js";

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

export async function listActiveTripsByCompany(db, rtdb, input) {
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
        driverName:
          pickString(driverSnapshot, "name") ?? `Sofor (${driverUid.slice(0, 6)})`,
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
      return { ...trip, routeName: routeMeta.routeName };
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
    const stale =
      lastLocationAtMs == null || nowMs - lastLocationAtMs > (input.liveOpsOnlineThresholdMs ?? 60000);
    const rtdbPayload = rtdbPayloadByRouteId.get(trip.routeId) ?? null;
    const payloadTripId = pickString(rtdbPayload, "tripId");
    const payloadLat = pickFiniteNumber(rtdbPayload, "lat");
    const payloadLng = pickFiniteNumber(rtdbPayload, "lng");
    const hasRtdbCoordinates =
      payloadTripId === trip.tripId && payloadLat != null && payloadLng != null;

    return {
      tripId: trip.tripId,
      routeId: trip.routeId,
      routeName: trip.routeName,
      driverUid: trip.driverUid,
      driverName: trip.driverName,
      driverPlate: trip.driverPlate,
      status: "active",
      startedAt: trip.startedAt,
      lastLocationAt: trip.lastLocationAt,
      updatedAt: trip.updatedAt,
      liveState: stale ? "stale" : "online",
      live: {
        lat: hasRtdbCoordinates ? payloadLat : null,
        lng: hasRtdbCoordinates ? payloadLng : null,
        source: hasRtdbCoordinates ? "rtdb" : "trip_doc",
        stale,
      },
    };
  });

  return { items };
}
