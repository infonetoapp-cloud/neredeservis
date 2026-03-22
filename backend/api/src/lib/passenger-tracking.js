import { listCompanyRouteStopsFromPostgres } from "./company-route-store.js";
import { HttpError } from "./http.js";
import {
  readGuestTrackingSessionByIdFromPostgres,
  readRoutePassengerFromPostgres,
  shouldUsePostgresPassengerStore,
} from "./passenger-store.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { readLatestRouteAnnouncementFromPostgres } from "./route-announcement-store.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

function requireFirestoreDb(db) {
  if (!db || typeof db.collection !== "function") {
    throw new HttpError(412, "failed-precondition", "Passenger tracking depolamasi hazir degil.");
  }
  return db;
}

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeFiniteNumber(value) {
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

function normalizeInteger(value) {
  const parsed = normalizeFiniteNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeIsoString(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
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

function normalizeLatLng(value) {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const lat = pickFiniteNumber(record, "lat");
  const lng = pickFiniteNumber(record, "lng");
  if (lat == null || lng == null) {
    return null;
  }

  return { lat, lng };
}

function parseIsoToMs(value) {
  const normalized = normalizeIsoString(value);
  if (!normalized) {
    return null;
  }

  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFirestoreTimestampToIso(value) {
  if (value == null) {
    return null;
  }

  const iso = normalizeIsoString(value);
  if (iso) {
    return iso;
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      const parsed = value.toDate();
      return normalizeIsoString(parsed);
    } catch {
      return null;
    }
  }

  return null;
}

function serializeFirestoreValue(value) {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  const iso = parseFirestoreTimestampToIso(value);
  if (iso) {
    return iso;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const result = {};
  for (const [key, nestedValue] of Object.entries(record)) {
    result[key] = serializeFirestoreValue(nestedValue);
  }
  return result;
}

function buildDriverSnapshot({ driverName, driverPlate, driverPhone }) {
  if (!driverName && !driverPlate && !driverPhone) {
    return null;
  }

  return {
    name: driverName ?? "Sofor",
    plate: driverPlate ?? "-",
    ...(driverPhone ? { phone: driverPhone } : {}),
  };
}

function buildLiveLocationFromActiveTrip(activeTripData) {
  const live = asRecord(activeTripData?.live);
  if (!live) {
    return null;
  }

  const lat = normalizeFiniteNumber(live.lat);
  const lng = normalizeFiniteNumber(live.lng);
  if (lat == null || lng == null) {
    return null;
  }

  return {
    routeId: normalizeNullableText(activeTripData?.routeId),
    tripId: normalizeNullableText(activeTripData?.tripId),
    driverId:
      normalizeNullableText(activeTripData?.driverId) ??
      normalizeNullableText(activeTripData?.driverUid),
    lat,
    lng,
    speed: normalizeFiniteNumber(live.speed) ?? 0,
    heading: normalizeFiniteNumber(live.heading) ?? 0,
    accuracy: normalizeFiniteNumber(live.accuracy) ?? 0,
    timestampMs:
      normalizeInteger(activeTripData?.locationTimestampMs) ??
      parseIsoToMs(activeTripData?.lastLocationAt) ??
      parseIsoToMs(activeTripData?.updatedAt),
  };
}

async function readFirestoreDocumentData(documentReference) {
  const snapshot = await documentReference.get().catch(() => null);
  if (!snapshot?.exists) {
    return null;
  }
  return serializeFirestoreValue(snapshot.data());
}

async function readRouteFromPostgres(routeId) {
  if (!isPostgresConfigured()) {
    return null;
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  const pool = getPostgresPool();
  if (!normalizedRouteId || !pool) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        route_id,
        company_id,
        name,
        srv_code,
        driver_id,
        authorized_driver_ids,
        member_ids,
        scheduled_time,
        time_slot,
        is_archived,
        allow_guest_tracking,
        start_address,
        end_address,
        start_point,
        end_point,
        vehicle_id,
        vehicle_plate,
        passenger_count,
        visibility,
        creation_mode,
        route_polyline,
        vacation_until,
        last_trip_started_notification_at,
        created_by,
        updated_by,
        created_at,
        updated_at,
        stops_synced_at
      FROM company_routes
      WHERE route_id = $1
      LIMIT 1
    `,
    [normalizedRouteId],
  );

  const row = result.rows[0] ?? null;
  if (!row) {
    return null;
  }

  const companyId = normalizeNullableText(row.company_id);
  const name = normalizeNullableText(row.name);
  if (!companyId || !name) {
    return null;
  }

  return {
    routeId: normalizeNullableText(row.route_id),
    companyId,
    name,
    srvCode: normalizeNullableText(row.srv_code),
    driverId: normalizeNullableText(row.driver_id),
    authorizedDriverIds: normalizeStringArray(row.authorized_driver_ids),
    memberIds: normalizeStringArray(row.member_ids),
    scheduledTime: normalizeNullableText(row.scheduled_time),
    timeSlot: normalizeNullableText(row.time_slot),
    isArchived: normalizeBoolean(row.is_archived, false),
    allowGuestTracking: normalizeBoolean(row.allow_guest_tracking, false),
    startAddress: normalizeNullableText(row.start_address),
    endAddress: normalizeNullableText(row.end_address),
    startPoint: normalizeLatLng(row.start_point),
    endPoint: normalizeLatLng(row.end_point),
    vehicleId: normalizeNullableText(row.vehicle_id),
    vehiclePlate: normalizeNullableText(row.vehicle_plate),
    passengerCount: normalizeInteger(row.passenger_count) ?? 0,
    visibility: normalizeNullableText(row.visibility),
    creationMode: normalizeNullableText(row.creation_mode),
    routePolyline: row.route_polyline ?? null,
    vacationUntil: normalizeIsoString(row.vacation_until),
    lastTripStartedNotificationAt: normalizeIsoString(row.last_trip_started_notification_at),
    createdBy: normalizeNullableText(row.created_by),
    updatedBy: normalizeNullableText(row.updated_by),
    createdAt: normalizeIsoString(row.created_at),
    updatedAt: normalizeIsoString(row.updated_at),
    stopsSyncedAt: normalizeIsoString(row.stops_synced_at),
  };
}

async function readActiveTripFromPostgres(routeId) {
  if (!isPostgresConfigured()) {
    return null;
  }

  const normalizedRouteId = normalizeNullableText(routeId);
  const pool = getPostgresPool();
  if (!normalizedRouteId || !pool) {
    return null;
  }

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
        passenger_count
      FROM company_active_trips
      WHERE route_id = $1
      ORDER BY COALESCE(last_location_at, updated_at, started_at) DESC NULLS LAST
      LIMIT 1
    `,
    [normalizedRouteId],
  );

  const row = result.rows[0] ?? null;
  if (!row) {
    return null;
  }

  const tripId = normalizeNullableText(row.trip_id);
  const companyId = normalizeNullableText(row.company_id);
  const resolvedRouteId = normalizeNullableText(row.route_id);
  const driverUid = normalizeNullableText(row.driver_uid);
  const driverName = normalizeNullableText(row.driver_name);
  const routeName = normalizeNullableText(row.route_name);
  if (!tripId || !companyId || !resolvedRouteId || !driverUid || !routeName) {
    return null;
  }

  const driverPlate = normalizeNullableText(row.driver_plate);
  const activeTrip = {
    tripId,
    companyId,
    routeId: resolvedRouteId,
    routeName,
    routeUpdatedAt: normalizeIsoString(row.route_updated_at),
    driverUid,
    driverId: driverUid,
    driverName: driverName ?? "Sofor",
    driverPlate,
    status: normalizeNullableText(row.status) ?? "active",
    startedAt: normalizeIsoString(row.started_at),
    lastLocationAt: normalizeIsoString(row.last_location_at),
    updatedAt: normalizeIsoString(row.updated_at),
    liveState: normalizeNullableText(row.live_state) ?? "no_signal",
    vehicleId: normalizeNullableText(row.vehicle_id),
    scheduledTime: normalizeNullableText(row.scheduled_time),
    timeSlot: normalizeNullableText(row.time_slot),
    passengerCount: normalizeInteger(row.passenger_count) ?? 0,
    locationTimestampMs: normalizeInteger(row.location_timestamp_ms),
    live: {
      lat: normalizeFiniteNumber(row.lat),
      lng: normalizeFiniteNumber(row.lng),
      speed: normalizeFiniteNumber(row.speed),
      heading: normalizeFiniteNumber(row.heading),
      accuracy: normalizeFiniteNumber(row.accuracy),
      source: normalizeNullableText(row.live_source) ?? "trip_doc",
      stale: normalizeBoolean(row.live_stale, true),
    },
  };

  const driverSnapshot = buildDriverSnapshot({
    driverName: activeTrip.driverName,
    driverPlate,
    driverPhone: null,
  });
  return driverSnapshot ? { ...activeTrip, driverSnapshot } : activeTrip;
}

async function readDriverFromPostgres(companyId, driverId) {
  if (!isPostgresConfigured()) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedDriverId = normalizeNullableText(driverId);
  const pool = getPostgresPool();
  if (!normalizedCompanyId || !normalizedDriverId || !pool) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        driver_id,
        company_id,
        name,
        status,
        phone,
        plate,
        login_email,
        temporary_password,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM company_drivers
      WHERE company_id = $1 AND driver_id = $2
      LIMIT 1
    `,
    [normalizedCompanyId, normalizedDriverId],
  );

  const row = result.rows[0] ?? null;
  if (!row) {
    return null;
  }

  const name = normalizeNullableText(row.name);
  const resolvedDriverId = normalizeNullableText(row.driver_id);
  if (!name || !resolvedDriverId) {
    return null;
  }

  return {
    driverId: resolvedDriverId,
    companyId: normalizedCompanyId,
    name,
    status: normalizeNullableText(row.status) ?? "active",
    phone: normalizeNullableText(row.phone),
    plate: normalizeNullableText(row.plate),
    loginEmail: normalizeNullableText(row.login_email),
    temporaryPassword: normalizeNullableText(row.temporary_password),
    createdBy: normalizeNullableText(row.created_by),
    updatedBy: normalizeNullableText(row.updated_by),
    createdAt: normalizeIsoString(row.created_at),
    updatedAt: normalizeIsoString(row.updated_at),
  };
}

async function readActiveTripFromFirestore(db, routeId) {
  const firestoreDb = requireFirestoreDb(db);
  const snapshot = await firestoreDb
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .limit(1)
    .get()
    .catch(() => null);
  const documentSnapshot = snapshot?.docs?.[0] ?? null;
  if (!documentSnapshot) {
    return null;
  }

  const data = serializeFirestoreValue(documentSnapshot.data());
  const record = asRecord(data);
  if (!record) {
    return null;
  }

  const driverId = pickString(record, "driverId");
  return {
    tripId: documentSnapshot.id,
    ...record,
    ...(driverId ? { driverUid: driverId, driverId } : {}),
  };
}

async function readLatestAnnouncementFromFirestore(db, routeId) {
  const firestoreDb = requireFirestoreDb(db);
  const snapshot = await firestoreDb
    .collection("announcements")
    .where("routeId", "==", routeId)
    .limit(20)
    .get()
    .catch(() => null);
  if (!snapshot?.docs?.length) {
    return null;
  }

  let latest = null;
  let latestCreatedAt = null;
  for (const documentSnapshot of snapshot.docs) {
    const data = serializeFirestoreValue(documentSnapshot.data());
    const record = asRecord(data);
    const createdAt = pickString(record, "createdAt");
    if (!record || !createdAt) {
      continue;
    }
    if (latestCreatedAt == null || createdAt.localeCompare(latestCreatedAt) > 0) {
      latest = record;
      latestCreatedAt = createdAt;
    }
  }

  return latest;
}

async function readRouteStopsFromFirestore(db, routeId) {
  const firestoreDb = requireFirestoreDb(db);
  const snapshot = await firestoreDb
    .collection("routes")
    .doc(routeId)
    .collection("stops")
    .orderBy("order")
    .get()
    .catch(() => null);
  if (!snapshot?.docs?.length) {
    return [];
  }

  return snapshot.docs
    .map((documentSnapshot) => {
      const data = serializeFirestoreValue(documentSnapshot.data());
      const record = asRecord(data) ?? {};
      return {
        stopId: documentSnapshot.id,
        name: pickString(record, "name") ?? "Durak",
        order: normalizeInteger(record.order) ?? 0,
        isPassed: normalizeBoolean(record.isPassed, false),
        isNext: normalizeBoolean(record.isNext, false),
        passengersWaiting: normalizeInteger(record.passengersWaiting),
        location: normalizeLatLng(record.location),
        createdAt: normalizeIsoString(record.createdAt),
        updatedAt: normalizeIsoString(record.updatedAt),
      };
    })
    .sort((left, right) => left.order - right.order);
}

async function readRouteDocumentFromFirestore(db, routeId) {
  const firestoreDb = requireFirestoreDb(db);
  return readFirestoreDocumentData(firestoreDb.collection("routes").doc(routeId));
}

async function readDriverDocumentFromFirestore(db, driverId) {
  const firestoreDb = requireFirestoreDb(db);
  return readFirestoreDocumentData(firestoreDb.collection("drivers").doc(driverId));
}

async function readPassengerDocumentFromFirestore(db, routeId, uid) {
  const firestoreDb = requireFirestoreDb(db);
  return readFirestoreDocumentData(
    firestoreDb.collection("routes").doc(routeId).collection("passengers").doc(uid),
  );
}

async function readGuestSessionDocumentFromFirestore(db, sessionId) {
  const firestoreDb = requireFirestoreDb(db);
  const data = await readFirestoreDocumentData(firestoreDb.collection("guest_sessions").doc(sessionId));
  const record = asRecord(data);
  return record ? { sessionId, ...record } : null;
}

async function readRouteStopsFromPostgres(companyId, routeId) {
  if (!shouldUsePostgresPassengerStore()) {
    return [];
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedRouteId = normalizeNullableText(routeId);
  if (!normalizedCompanyId || !normalizedRouteId) {
    return [];
  }

  const result = await listCompanyRouteStopsFromPostgres(normalizedCompanyId, normalizedRouteId).catch(
    () => null,
  );
  const items = Array.isArray(result?.items) ? result.items : [];
  return items.map((item) => ({
    stopId: normalizeNullableText(item?.stopId) ?? "",
    name: pickString(item, "name") ?? "Durak",
    order: normalizeInteger(item?.order) ?? 0,
    isPassed: false,
    isNext: false,
    passengersWaiting: null,
    location: item?.location ?? null,
    createdAt: normalizeIsoString(item?.createdAt),
    updatedAt: normalizeIsoString(item?.updatedAt),
  }));
}

function mergeTrackingRecord(primaryRecord, secondaryRecord) {
  const primary = asRecord(primaryRecord) ?? {};
  const secondary = asRecord(secondaryRecord) ?? {};
  return { ...secondary, ...primary };
}

function ensurePassengerRouteAccess(routeData, passengerData, uid) {
  const memberIds = normalizeStringArray(routeData?.memberIds);
  if (memberIds.includes(uid)) {
    return;
  }

  if (asRecord(passengerData)) {
    return;
  }

  throw new HttpError(403, "permission-denied", "Bu route icin yolcu erisimin bulunmuyor.");
}

function ensureGuestSessionAccess(guestSessionData, uid) {
  if (!guestSessionData) {
    throw new HttpError(404, "not-found", "Misafir takip oturumu bulunamadi.");
  }

  const guestUid = normalizeNullableText(guestSessionData.guestUid);
  if (guestUid && guestUid !== uid) {
    throw new HttpError(403, "permission-denied", "Bu misafir takip oturumu sana ait degil.");
  }
}

function normalizeTrackingRoute(routeData, routeId) {
  const record = asRecord(routeData);
  if (!record) {
    return null;
  }
  return {
    ...record,
    routeId: normalizeNullableText(record.routeId) ?? routeId,
    companyId: normalizeNullableText(record.companyId),
    name: pickString(record, "name") ?? `Route (${routeId.slice(0, 6)})`,
    driverId: normalizeNullableText(record.driverId),
    memberIds: normalizeStringArray(record.memberIds),
    authorizedDriverIds: normalizeStringArray(record.authorizedDriverIds),
    scheduledTime: normalizeNullableText(record.scheduledTime),
    timeSlot: normalizeNullableText(record.timeSlot),
    startPoint: normalizeLatLng(record.startPoint),
    endPoint: normalizeLatLng(record.endPoint),
    passengerCount: normalizeInteger(record.passengerCount) ?? 0,
    isArchived: normalizeBoolean(record.isArchived, false),
    allowGuestTracking: normalizeBoolean(record.allowGuestTracking, false),
    updatedAt: normalizeIsoString(record.updatedAt),
  };
}

async function buildPassengerTrackingSnapshot({ db, uid, routeId, guestSessionId }) {
  const normalizedRouteId = normalizeNullableText(routeId);
  const normalizedGuestSessionId = normalizeNullableText(guestSessionId);
  if (!normalizedRouteId && !normalizedGuestSessionId) {
    throw new HttpError(400, "invalid-argument", "routeId veya sessionId gerekli.");
  }

  let guestSessionData = null;
  if (normalizedGuestSessionId) {
    if (shouldUsePostgresPassengerStore()) {
      guestSessionData = await readGuestTrackingSessionByIdFromPostgres(normalizedGuestSessionId).catch(
        () => null,
      );
    }
    if (!guestSessionData && db) {
      guestSessionData = await readGuestSessionDocumentFromFirestore(
        db,
        normalizedGuestSessionId,
      ).catch(() => null);
    }
  }
  if (normalizedGuestSessionId) {
    ensureGuestSessionAccess(guestSessionData, uid);
  }

  const effectiveRouteId =
    normalizedRouteId ?? normalizeNullableText(guestSessionData?.routeId);
  if (!effectiveRouteId) {
    return {
      routeId: null,
      routeName: normalizeNullableText(guestSessionData?.routeName),
      routeData: null,
      activeTripData: null,
      driverData: null,
      passengerData: null,
      latestAnnouncement: null,
      stops: [],
      liveLocation: null,
      guestSession: guestSessionData,
      generatedAt: new Date().toISOString(),
    };
  }

  let passengerData = null;
  if (!normalizedGuestSessionId && shouldUsePostgresPassengerStore()) {
    passengerData = await readRoutePassengerFromPostgres(effectiveRouteId, uid).catch(() => null);
  }
  if (!normalizedGuestSessionId && !passengerData && db) {
    passengerData = await readPassengerDocumentFromFirestore(db, effectiveRouteId, uid).catch(
      () => null,
    );
  }

  const [postgresRoute, firestoreRoute] = await Promise.all([
    readRouteFromPostgres(effectiveRouteId).catch(() => null),
    db ? readRouteDocumentFromFirestore(db, effectiveRouteId).catch(() => null) : Promise.resolve(null),
  ]);
  const routeData = normalizeTrackingRoute(
    mergeTrackingRecord(postgresRoute, firestoreRoute),
    effectiveRouteId,
  );
  if (!routeData) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  if (!normalizedGuestSessionId) {
    ensurePassengerRouteAccess(routeData, passengerData, uid);
  }

  const postgresStops = routeData.companyId
    ? await readRouteStopsFromPostgres(routeData.companyId, effectiveRouteId).catch(() => [])
    : [];
  const postgresAnnouncement = await readLatestRouteAnnouncementFromPostgres(effectiveRouteId).catch(
    () => null,
  );

  const [postgresActiveTrip, firestoreActiveTrip, firestoreDriverData, latestAnnouncement, stops] =
    await Promise.all([
      readActiveTripFromPostgres(effectiveRouteId).catch(() => null),
      db ? readActiveTripFromFirestore(db, effectiveRouteId).catch(() => null) : Promise.resolve(null),
      routeData.driverId
        ? (db
            ? readDriverDocumentFromFirestore(db, routeData.driverId).catch(() => null)
            : Promise.resolve(null))
        : Promise.resolve(null),
      postgresAnnouncement
        ? Promise.resolve(postgresAnnouncement)
        : db
          ? readLatestAnnouncementFromFirestore(db, effectiveRouteId).catch(() => null)
          : Promise.resolve(null),
      postgresStops.length > 0
        ? Promise.resolve(postgresStops)
        : db
          ? readRouteStopsFromFirestore(db, effectiveRouteId).catch(() => [])
          : Promise.resolve([]),
    ]);

  const activeTripDriverId =
    normalizeNullableText(postgresActiveTrip?.driverId) ??
    normalizeNullableText(firestoreActiveTrip?.driverId) ??
    normalizeNullableText(routeData.driverId);
  const driverData = mergeTrackingRecord(
    routeData.companyId && activeTripDriverId
      ? await readDriverFromPostgres(routeData.companyId, activeTripDriverId).catch(() => null)
      : null,
    firestoreDriverData,
  );

  const mergedActiveTrip = mergeTrackingRecord(postgresActiveTrip, firestoreActiveTrip);
  const activeTripData = asRecord(mergedActiveTrip)
    ? {
        ...mergedActiveTrip,
        routeId: normalizeNullableText(mergedActiveTrip.routeId) ?? effectiveRouteId,
        companyId: normalizeNullableText(mergedActiveTrip.companyId) ?? routeData.companyId,
        driverId: activeTripDriverId,
        driverUid: activeTripDriverId,
        driverSnapshot:
          asRecord(mergedActiveTrip.driverSnapshot) ??
          buildDriverSnapshot({
            driverName:
              normalizeNullableText(mergedActiveTrip.driverName) ??
              normalizeNullableText(driverData.name),
            driverPlate:
              normalizeNullableText(mergedActiveTrip.driverPlate) ??
              normalizeNullableText(driverData.plate),
            driverPhone: normalizeNullableText(driverData.phone),
          }),
      }
    : null;

  return {
    routeId: effectiveRouteId,
    routeName: normalizeNullableText(routeData.name) ?? normalizeNullableText(guestSessionData?.routeName),
    routeData,
    activeTripData,
    driverData: asRecord(driverData) ?? null,
    passengerData: asRecord(passengerData) ?? null,
    latestAnnouncement: asRecord(latestAnnouncement) ?? null,
    stops,
    liveLocation: buildLiveLocationFromActiveTrip(activeTripData),
    guestSession: guestSessionData,
    generatedAt: new Date().toISOString(),
  };
}

export async function readPassengerTrackingSnapshot(db, uid, routeId) {
  return buildPassengerTrackingSnapshot({
    db,
    uid,
    routeId,
    guestSessionId: null,
  });
}

export async function readGuestTrackingSnapshot(db, uid, sessionId) {
  return buildPassengerTrackingSnapshot({
    db,
    uid,
    routeId: null,
    guestSessionId: sessionId,
  });
}
