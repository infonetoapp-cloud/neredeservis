import { backfillCompanyRecordFromFirestore, buildCompanyRouteProjection } from "./company-route-postgres-sync.js";
import {
  isCompanyRoutesSyncedInPostgres,
  listCompanyRoutesFromPostgres,
  shouldUsePostgresCompanyRouteStore,
  syncCompanyRoutesSnapshotForCompany,
} from "./company-route-store.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function parseIsoToMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function readRouteTimeSlot(value) {
  if (value === "morning" || value === "evening" || value === "midday" || value === "custom") {
    return value;
  }
  return null;
}

function buildRouteItem(routeId, companyId, routeData) {
  return {
    routeId,
    companyId,
    name: pickString(routeData, "name") ?? `Route (${routeId.slice(0, 6)})`,
    srvCode: pickString(routeData, "srvCode"),
    driverId: pickString(routeData, "driverId"),
    authorizedDriverIds: pickStringArray(routeData, "authorizedDriverIds"),
    scheduledTime: pickString(routeData, "scheduledTime"),
    timeSlot: readRouteTimeSlot(routeData?.timeSlot),
    isArchived: routeData?.isArchived === true,
    allowGuestTracking: routeData?.allowGuestTracking === true,
    startAddress: pickString(routeData, "startAddress"),
    endAddress: pickString(routeData, "endAddress"),
    vehicleId: pickString(routeData, "vehicleId"),
    vehiclePlate: pickString(routeData, "vehiclePlate"),
    passengerCount: pickFiniteNumber(routeData, "passengerCount") ?? 0,
    updatedAt: pickString(routeData, "updatedAt"),
  };
}

export async function listCompanyRoutes(db, input) {
  const queryLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  const includeArchived = input.includeArchived === true;

  if (shouldUsePostgresCompanyRouteStore()) {
    const routesSynced = await isCompanyRoutesSyncedInPostgres(input.companyId).catch(() => false);
    if (routesSynced) {
      const items = await listCompanyRoutesFromPostgres(input.companyId, {
        limit: queryLimit,
        includeArchived,
      }).catch(() => null);
      if (items) {
        return { items };
      }
    }
  }

  const baseQuery = db.collection("routes").where("companyId", "==", input.companyId);
  const routesSnapshot = includeArchived
    ? await baseQuery.limit(queryLimit).get()
    : await baseQuery.where("isArchived", "==", false).limit(queryLimit).get();

  const routeItems = routesSnapshot.docs.map((documentSnapshot) => {
    const routeData = asRecord(documentSnapshot.data()) ?? {};
    return buildRouteItem(documentSnapshot.id, input.companyId, routeData);
  });

  const items = routeItems
    .slice()
    .sort((left, right) => (parseIsoToMs(right.updatedAt) ?? 0) - (parseIsoToMs(left.updatedAt) ?? 0));

  if (shouldUsePostgresCompanyRouteStore()) {
    await backfillCompanyRecordFromFirestore(db, input.companyId).catch(() => false);
    const allRoutesSnapshot = await baseQuery.get().catch(() => null);
    if (allRoutesSnapshot) {
      const routeProjections = allRoutesSnapshot.docs
        .map((documentSnapshot) =>
          buildCompanyRouteProjection(
            documentSnapshot.id,
            asRecord(documentSnapshot.data()) ?? {},
            input.companyId,
          ),
        )
        .filter((item) => item !== null);
      await syncCompanyRoutesSnapshotForCompany(
        input.companyId,
        routeProjections,
        new Date().toISOString(),
      ).catch(() => false);
    }
  }

  return { items };
}
