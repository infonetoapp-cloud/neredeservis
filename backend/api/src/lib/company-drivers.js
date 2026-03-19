import { asRecord, pickString } from "./runtime-value.js";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

export async function listCompanyDrivers(db, input) {
  const driverLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 100;

  const [driversSnapshot, routesSnapshot] = await Promise.all([
    db.collection("drivers").where("companyId", "==", input.companyId).limit(driverLimit).get(),
    db
      .collection("routes")
      .where("companyId", "==", input.companyId)
      .where("isArchived", "==", false)
      .limit(200)
      .get(),
  ]);

  const assignedRoutesByDriverId = new Map();
  for (const routeSnapshot of routesSnapshot.docs) {
    const routeData = asRecord(routeSnapshot.data()) ?? {};
    const routeId = routeSnapshot.id;
    const routeName = pickString(routeData, "name") ?? `Route (${routeId.slice(0, 6)})`;
    const scheduledTime = pickString(routeData, "scheduledTime");
    const authorizedDriverIds = pickStringArray(routeData, "authorizedDriverIds");
    const primaryDriverId = pickString(routeData, "driverId");
    const relatedDriverIds = new Set(authorizedDriverIds);
    if (primaryDriverId) {
      relatedDriverIds.add(primaryDriverId);
    }

    for (const driverId of relatedDriverIds) {
      const existing = assignedRoutesByDriverId.get(driverId) ?? [];
      existing.push({ routeId, routeName, scheduledTime });
      assignedRoutesByDriverId.set(driverId, existing);
    }
  }

  const items = [];
  for (const driverSnapshot of driversSnapshot.docs) {
    const driverData = asRecord(driverSnapshot.data()) ?? {};
    const name = pickString(driverData, "name");
    if (!name) {
      continue;
    }

    const driverId = driverSnapshot.id;
    const status = pickString(driverData, "status") === "passive" ? "passive" : "active";
    const assignedRoutes = assignedRoutesByDriverId.get(driverId) ?? [];

    items.push({
      driverId,
      name,
      plateMasked: pickString(driverData, "plate") ?? "",
      phoneMasked: pickString(driverData, "phone"),
      loginEmail: pickString(driverData, "loginEmail"),
      temporaryPassword: pickString(driverData, "temporaryPassword"),
      status,
      assignmentStatus: assignedRoutes.length > 0 ? "assigned" : "unassigned",
      lastSeenAt: pickString(driverData, "updatedAt"),
      assignedRoutes,
    });
  }

  items.sort((left, right) => left.name.localeCompare(right.name, "tr"));
  return { items };
}
