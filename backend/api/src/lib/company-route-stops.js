import {
  listCompanyRouteStopsFromPostgres,
  shouldUsePostgresCompanyRouteStore,
} from "./company-route-store.js";
import { HttpError } from "./http.js";

export async function listCompanyRouteStops(_db, input) {
  if (!shouldUsePostgresCompanyRouteStore()) {
    throw new HttpError(412, "failed-precondition", "Rota depolamasi hazir degil.");
  }

  const postgresResult = await listCompanyRouteStopsFromPostgres(input.companyId, input.routeId).catch(
    () => null,
  );
  if (!postgresResult?.routeExists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  return {
    companyId: input.companyId,
    routeId: input.routeId,
    items: postgresResult.items,
  };
}
