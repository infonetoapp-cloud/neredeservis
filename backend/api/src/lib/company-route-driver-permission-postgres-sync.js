import { backfillCompanyRecordFromFirestore, syncCompanyRouteFromFirestore } from "./company-route-postgres-sync.js";
import {
  replaceRouteDriverPermissionsForRoute,
  shouldUsePostgresRouteDriverPermissionStore,
} from "./company-route-driver-permission-store.js";
import { asRecord, pickString } from "./runtime-value.js";

function buildRouteDriverPermissionProjection(companyId, routeId, driverUid, permissionData) {
  if (!companyId || !routeId || !driverUid) {
    return null;
  }

  return {
    companyId,
    routeId,
    driverUid,
    permissions: permissionData?.permissions ?? null,
    createdAt: pickString(permissionData, "createdAt"),
    createdBy: pickString(permissionData, "createdBy"),
    updatedAt: pickString(permissionData, "updatedAt"),
    updatedBy: pickString(permissionData, "updatedBy"),
  };
}

export async function syncRouteDriverPermissionsFromFirestore(db, companyId, routeId, syncedAt) {
  if (!shouldUsePostgresRouteDriverPermissionStore()) {
    return false;
  }

  await backfillCompanyRecordFromFirestore(db, companyId).catch(() => false);
  await syncCompanyRouteFromFirestore(db, companyId, routeId, syncedAt).catch(() => false);

  const permissionsSnapshot = await db
    .collection("routes")
    .doc(routeId)
    .collection("driver_permissions")
    .get();

  const items = permissionsSnapshot.docs
    .map((documentSnapshot) =>
      buildRouteDriverPermissionProjection(
        companyId,
        routeId,
        documentSnapshot.id,
        asRecord(documentSnapshot.data()) ?? {},
      ),
    )
    .filter((item) => item !== null);

  return replaceRouteDriverPermissionsForRoute(
    companyId,
    routeId,
    items,
    syncedAt ?? new Date().toISOString(),
  );
}
