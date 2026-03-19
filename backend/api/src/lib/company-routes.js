import { asRecord, pickString } from "./runtime-value.js";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

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

function readRouteTimeSlot(value) {
  if (value === "morning" || value === "evening" || value === "midday" || value === "custom") {
    return value;
  }
  return null;
}

export async function listCompanyRoutes(db, input) {
  const queryLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  const includeArchived = input.includeArchived === true;

  const baseQuery = db.collection("routes").where("companyId", "==", input.companyId);
  const routesSnapshot = includeArchived
    ? await baseQuery.limit(queryLimit).get()
    : await baseQuery.where("isArchived", "==", false).limit(queryLimit).get();

  const items = routesSnapshot.docs
    .map((documentSnapshot) => {
      const routeData = asRecord(documentSnapshot.data()) ?? {};
      return {
        routeId: documentSnapshot.id,
        companyId: input.companyId,
        name: pickString(routeData, "name") ?? `Route (${documentSnapshot.id.slice(0, 6)})`,
        srvCode: pickString(routeData, "srvCode"),
        driverId: pickString(routeData, "driverId"),
        authorizedDriverIds: pickStringArray(routeData, "authorizedDriverIds"),
        scheduledTime: pickString(routeData, "scheduledTime"),
        timeSlot: readRouteTimeSlot(routeData.timeSlot),
        isArchived: routeData.isArchived === true,
        allowGuestTracking: routeData.allowGuestTracking === true,
        startAddress: pickString(routeData, "startAddress"),
        endAddress: pickString(routeData, "endAddress"),
        vehicleId: pickString(routeData, "vehicleId"),
        vehiclePlate: pickString(routeData, "vehiclePlate"),
        passengerCount: pickFiniteNumber(routeData, "passengerCount") ?? 0,
        updatedAt: pickString(routeData, "updatedAt"),
      };
    })
    .sort((left, right) => (parseIsoToMs(right.updatedAt) ?? 0) - (parseIsoToMs(left.updatedAt) ?? 0));

  return { items };
}
