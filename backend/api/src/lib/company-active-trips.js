import {
  listCompanyActiveTripsFromPostgres,
  shouldUsePostgresCompanyActiveTripStore,
} from "./company-active-trip-store.js";

export async function listActiveTripsByCompany(_db, _rtdb, input) {
  const limit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit)) : 50;
  const routeFilterId = typeof input.routeId === "string" && input.routeId.trim() ? input.routeId.trim() : null;
  const driverFilterUid =
    typeof input.driverUid === "string" && input.driverUid.trim() ? input.driverUid.trim() : null;

  if (!shouldUsePostgresCompanyActiveTripStore()) {
    return { items: [] };
  }

  const items = await listCompanyActiveTripsFromPostgres(input.companyId, {
    limit,
    routeId: routeFilterId,
    driverUid: driverFilterUid,
  });
  return { items };
}
