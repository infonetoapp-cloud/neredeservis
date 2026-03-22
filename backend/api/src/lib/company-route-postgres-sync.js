import { backfillCompanyFromFirestoreRecord } from "./company-membership-store.js";
import {
  deleteCompanyRouteFromPostgres,
  replaceCompanyRouteStopsForRoute,
  shouldUsePostgresCompanyRouteStore,
  syncCompanyRouteToPostgres,
} from "./company-route-store.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
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

export function buildCompanyRouteProjection(routeId, routeData, companyIdOverride) {
  const companyId = companyIdOverride ?? pickString(routeData, "companyId");
  if (!routeId || !companyId) {
    return null;
  }

  return {
    routeId,
    companyId,
    name: pickString(routeData, "name") ?? `Route (${routeId.slice(0, 6)})`,
    srvCode: pickString(routeData, "srvCode"),
    driverId: pickString(routeData, "driverId"),
    authorizedDriverIds: pickStringArray(routeData, "authorizedDriverIds"),
    memberIds: pickStringArray(routeData, "memberIds"),
    scheduledTime: pickString(routeData, "scheduledTime"),
    timeSlot: pickString(routeData, "timeSlot"),
    isArchived: routeData?.isArchived === true,
    allowGuestTracking: routeData?.allowGuestTracking === true,
    startAddress: pickString(routeData, "startAddress"),
    endAddress: pickString(routeData, "endAddress"),
    startPoint: normalizeLatLng(routeData?.startPoint),
    endPoint: normalizeLatLng(routeData?.endPoint),
    vehicleId: pickString(routeData, "vehicleId"),
    vehiclePlate: pickString(routeData, "vehiclePlate"),
    passengerCount: pickFiniteNumber(routeData, "passengerCount") ?? 0,
    visibility: pickString(routeData, "visibility") ?? "company",
    creationMode: pickString(routeData, "creationMode"),
    routePolyline: routeData?.routePolyline ?? null,
    vacationUntil: pickString(routeData, "vacationUntil"),
    lastTripStartedNotificationAt: pickString(routeData, "lastTripStartedNotificationAt"),
    createdBy: pickString(routeData, "createdBy"),
    updatedBy: pickString(routeData, "updatedBy"),
    createdAt: pickString(routeData, "createdAt"),
    updatedAt: pickString(routeData, "updatedAt"),
  };
}

export function buildCompanyRouteStopProjection(stopId, routeId, companyId, stopData) {
  const name = pickString(stopData, "name");
  const location = normalizeLatLng(stopData?.location);
  const order = pickFiniteNumber(stopData, "order");
  if (!stopId || !routeId || !companyId || !name || !location || order == null) {
    return null;
  }

  return {
    stopId,
    routeId,
    companyId,
    name,
    location,
    order,
    createdAt: pickString(stopData, "createdAt"),
    updatedAt: pickString(stopData, "updatedAt"),
    createdBy: pickString(stopData, "createdBy"),
    updatedBy: pickString(stopData, "updatedBy"),
  };
}

export async function backfillCompanyRecordFromFirestore(db, companyId) {
  if (!db?.collection) {
    return false;
  }

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
    timezone: pickString(companyData, "timezone"),
    countryCode: pickString(companyData, "countryCode"),
    contactPhone: pickString(companyData, "contactPhone"),
    contactEmail: pickString(companyData, "contactEmail"),
    logoUrl: pickString(companyData, "logoUrl"),
    address: pickString(companyData, "address"),
    vehicleLimit: pickFiniteNumber(companyData, "vehicleLimit"),
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  });
}

export async function syncCompanyRouteFromFirestore(db, companyId, routeId, syncedAt) {
  if (!shouldUsePostgresCompanyRouteStore() || !db?.collection) {
    return false;
  }

  const routeSnapshot = await db.collection("routes").doc(routeId).get();
  if (!routeSnapshot.exists) {
    await deleteCompanyRouteFromPostgres(companyId, routeId).catch(() => false);
    return false;
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  if (pickString(routeData, "companyId") !== companyId) {
    return false;
  }

  await backfillCompanyRecordFromFirestore(db, companyId).catch(() => false);
  const routeProjection = buildCompanyRouteProjection(routeId, routeData, companyId);
  if (!routeProjection) {
    return false;
  }

  routeProjection.updatedAt = routeProjection.updatedAt ?? syncedAt ?? new Date().toISOString();
  return syncCompanyRouteToPostgres(routeProjection);
}

export async function syncCompanyRouteAndStopsFromFirestore(db, companyId, routeId, syncedAt) {
  if (!shouldUsePostgresCompanyRouteStore() || !db?.collection) {
    return false;
  }

  const routeRef = db.collection("routes").doc(routeId);
  const [routeSnapshot, stopsSnapshot] = await Promise.all([
    routeRef.get(),
    routeRef.collection("stops").get(),
  ]);

  if (!routeSnapshot.exists) {
    await deleteCompanyRouteFromPostgres(companyId, routeId).catch(() => false);
    return false;
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  if (pickString(routeData, "companyId") !== companyId) {
    return false;
  }

  const normalizedSyncedAt = syncedAt ?? new Date().toISOString();
  await backfillCompanyRecordFromFirestore(db, companyId).catch(() => false);

  const routeProjection = buildCompanyRouteProjection(routeId, routeData, companyId);
  if (!routeProjection) {
    return false;
  }

  routeProjection.updatedAt = routeProjection.updatedAt ?? normalizedSyncedAt;
  await syncCompanyRouteToPostgres(routeProjection);

  const stopItems = stopsSnapshot.docs
    .map((documentSnapshot) =>
      buildCompanyRouteStopProjection(
        documentSnapshot.id,
        routeId,
        companyId,
        asRecord(documentSnapshot.data()) ?? {},
      ),
    )
    .filter((item) => item !== null);

  await replaceCompanyRouteStopsForRoute(companyId, routeId, stopItems, normalizedSyncedAt);
  return true;
}
