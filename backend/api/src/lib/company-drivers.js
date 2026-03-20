import {
  isCompanyDriversSyncedInPostgres,
  listCompanyDriversFromPostgres,
  replaceCompanyDriversForCompany,
  shouldUsePostgresCompanyFleetStore,
} from "./company-fleet-store.js";
import { backfillCompanyFromFirestoreRecord } from "./company-membership-store.js";
import { asRecord, pickString } from "./runtime-value.js";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
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
    timezone: pickString(companyData, "timezone"),
    countryCode: pickString(companyData, "countryCode"),
    contactPhone: pickString(companyData, "contactPhone"),
    contactEmail: pickString(companyData, "contactEmail"),
    logoUrl: pickString(companyData, "logoUrl"),
    address: pickString(companyData, "address"),
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  });
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

export async function listCompanyDrivers(db, input) {
  const driverLimit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 100;
  if (shouldUsePostgresCompanyFleetStore()) {
    const driversSynced = await isCompanyDriversSyncedInPostgres(input.companyId).catch(() => false);
    if (driversSynced) {
      const [drivers, assignedRoutesByDriverId] = await Promise.all([
        listCompanyDriversFromPostgres(input.companyId, driverLimit).catch(() => null),
        buildAssignedRoutesByDriverId(db, input.companyId),
      ]);
      if (drivers) {
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
    }
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
  if (shouldUsePostgresCompanyFleetStore()) {
    await backfillCompanyRecordFromFirestore(db, input.companyId).catch(() => false);
    await replaceCompanyDriversForCompany(input.companyId, items, new Date().toISOString()).catch(
      () => false,
    );
  }
  return { items };
}
