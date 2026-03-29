import {
  listCompanyDriversFromPostgres,
  shouldUsePostgresCompanyFleetStore,
} from "./company-fleet-store.js";
import { getPostgresPool } from "./postgres.js";
import { asRecord, pickString } from "./runtime-value.js";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

async function buildAssignedRoutesByDriverId(db, companyId) {
  const routesSnapshot = await db
    .collection("routes")
    .where("companyId", "==", companyId)
    .where("isArchived", "==", false)
    .limit(200)
    .get();

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

  return assignedRoutesByDriverId;
}

async function buildAssignedRoutesByDriverIdFromPostgres(companyId) {
  const pool = getPostgresPool();
  if (!pool) {
    return new Map();
  }

  const routesResult = await pool.query(
    `
      SELECT route_id, name, scheduled_time, driver_id, authorized_driver_ids
      FROM company_routes
      WHERE company_id = $1
        AND is_archived = FALSE
      ORDER BY updated_at DESC NULLS LAST, route_id ASC
    `,
    [companyId],
  );

  const assignedRoutesByDriverId = new Map();
  for (const row of routesResult.rows) {
    const routeId = typeof row?.route_id === "string" ? row.route_id.trim() : "";
    if (!routeId) {
      continue;
    }

    const routeName =
      (typeof row?.name === "string" && row.name.trim().length > 0 ? row.name.trim() : null) ??
      `Route (${routeId.slice(0, 6)})`;
    const scheduledTime =
      typeof row?.scheduled_time === "string" && row.scheduled_time.trim().length > 0
        ? row.scheduled_time.trim()
        : null;
    const relatedDriverIds = new Set(
      Array.isArray(row?.authorized_driver_ids)
        ? row.authorized_driver_ids.filter(
            (item) => typeof item === "string" && item.trim().length > 0,
          )
        : [],
    );
    if (typeof row?.driver_id === "string" && row.driver_id.trim().length > 0) {
      relatedDriverIds.add(row.driver_id.trim());
    }

    for (const driverId of relatedDriverIds) {
      const existing = assignedRoutesByDriverId.get(driverId) ?? [];
      existing.push({ routeId, routeName, scheduledTime });
      assignedRoutesByDriverId.set(driverId, existing);
    }
  }

  return assignedRoutesByDriverId;
}

export async function listCompanyDrivers(db, input) {
  const driverLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 100;
  if (shouldUsePostgresCompanyFleetStore()) {
    const [drivers, assignedRoutesByDriverId] = await Promise.all([
      listCompanyDriversFromPostgres(input.companyId, driverLimit),
      buildAssignedRoutesByDriverIdFromPostgres(input.companyId),
    ]);
    const items = drivers.map((driver) => {
      const assignedRoutes = assignedRoutesByDriverId.get(driver.driverId) ?? [];
      return {
        ...driver,
        assignmentStatus: assignedRoutes.length > 0 ? "assigned" : "unassigned",
        assignedRoutes,
      };
    });

    items.sort((left, right) => left.name.localeCompare(right.name, "tr"));
    return { items };
  }

  const [driversSnapshot, assignedRoutesByDriverId] = await Promise.all([
    db.collection("drivers").where("companyId", "==", input.companyId).limit(driverLimit).get(),
    buildAssignedRoutesByDriverId(db, input.companyId),
  ]);

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
