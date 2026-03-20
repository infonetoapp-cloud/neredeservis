import { syncCompanyRouteAndStopsFromFirestore } from "./company-route-postgres-sync.js";
import {
  listCompanyRouteStopsFromPostgres,
  readCompanyRouteFromPostgres,
  shouldUsePostgresCompanyRouteStore,
} from "./company-route-store.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

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

export async function listCompanyRouteStops(db, input) {
  if (shouldUsePostgresCompanyRouteStore()) {
    const route = await readCompanyRouteFromPostgres(input.companyId, input.routeId).catch(() => null);
    if (route?.stopsSyncedAt) {
      const postgresResult = await listCompanyRouteStopsFromPostgres(input.companyId, input.routeId).catch(
        () => null,
      );
      if (postgresResult?.routeExists) {
        return {
          companyId: input.companyId,
          routeId: input.routeId,
          items: postgresResult.items,
        };
      }
    }
  }

  const routeReference = db.collection("routes").doc(input.routeId);
  const routeSnapshot = await routeReference.get();
  if (!routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  const routeCompanyId = pickString(routeData, "companyId");
  if (!routeCompanyId || routeCompanyId !== input.companyId) {
    throw new HttpError(412, "failed-precondition", "ROUTE_TENANT_MISMATCH");
  }

  const visibility = pickString(routeData, "visibility");
  if (visibility && visibility !== "company") {
    throw new HttpError(412, "failed-precondition", "ROUTE_NOT_COMPANY_SCOPED");
  }

  const stopsSnapshot = await routeReference.collection("stops").get();
  const items = stopsSnapshot.docs
    .map((documentSnapshot) => {
      const stopData = asRecord(documentSnapshot.data()) ?? {};
      const name = pickString(stopData, "name");
      const location = asRecord(stopData.location);
      const lat = pickFiniteNumber(location, "lat");
      const lng = pickFiniteNumber(location, "lng");
      const order = pickFiniteNumber(stopData, "order");
      if (!name || lat == null || lng == null || order == null) {
        return null;
      }

      return {
        stopId: documentSnapshot.id,
        routeId: input.routeId,
        companyId: input.companyId,
        name,
        location: { lat, lng },
        order,
        createdAt: pickString(stopData, "createdAt"),
        updatedAt: pickString(stopData, "updatedAt"),
      };
    })
    .filter((item) => item !== null)
    .sort((left, right) => {
      if (left.order !== right.order) {
        return left.order - right.order;
      }
      return (parseIsoToMs(right.updatedAt) ?? 0) - (parseIsoToMs(left.updatedAt) ?? 0);
    });

  if (shouldUsePostgresCompanyRouteStore()) {
    await syncCompanyRouteAndStopsFromFirestore(
      db,
      input.companyId,
      input.routeId,
      new Date().toISOString(),
    ).catch(() => false);
  }

  return {
    companyId: input.companyId,
    routeId: input.routeId,
    items,
  };
}
