import { createServer } from "node:http";

import { listActiveTripsByCompany } from "./lib/company-active-trips.js";
import { requireAuthenticatedUser } from "./lib/auth.js";
import {
  requireActiveCompanyMemberRole,
  requireCompanyVehicleWriteRole,
  requireCompanyOwnerOrAdmin,
} from "./lib/company-access.js";
import { getCompanyAdminTenantState, listCompanyAuditLogs } from "./lib/company-audit.js";
import { listCompanyInvites } from "./lib/company-invites.js";
import { listCompanyDrivers } from "./lib/company-drivers.js";
import { listCompanyMembers } from "./lib/company-members.js";
import { getCompanyProfile, updateCompanyProfile } from "./lib/company-profile.js";
import { listCompanyRoutes } from "./lib/company-routes.js";
import { listCompanyRouteStops } from "./lib/company-route-stops.js";
import {
  createCompanyVehicle,
  deleteCompanyVehicle,
  listCompanyVehicles,
  updateCompanyVehicle,
} from "./lib/company-vehicles.js";
import { getFirebaseAdminDb, getOptionalFirebaseAdminRtdb } from "./lib/firebase-admin.js";
import { asRecord } from "./lib/runtime-value.js";
import { createCompany, listMyCompanies } from "./lib/my-companies.js";
import { HttpError, readJsonBody, sendApiError, sendApiOk, sendJson } from "./lib/http.js";

const serviceName = process.env.SERVICE_NAME?.trim() || "neredeservis-backend-api";
const host = process.env.HOST?.trim() || "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const startedAt = new Date();
const db = getFirebaseAdminDb();
const liveOpsOnlineThresholdMs = Number.parseInt(
  process.env.LIVE_OPS_ONLINE_THRESHOLD_MS ?? "60000",
  10,
);

function buildMeta() {
  return {
    service: serviceName,
    env: process.env.NODE_ENV?.trim() || "development",
    version: process.env.APP_VERSION?.trim() || "dev",
    backendMode: process.env.BACKEND_MODE?.trim() || "bootstrap",
    commitSha: process.env.COMMIT_SHA?.trim() || null,
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

function extractCompanyIdFromPath(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/profile$/);
  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function extractCompanyMembersPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/members$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyInvitesPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/invites$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyAuditLogsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/audit-logs$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyAdminTenantStatePathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/admin-tenant-state$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyRoutesPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyVehiclesPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/vehicles$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyVehicleItemPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/vehicles\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      vehicleId: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      vehicleId: match[2],
    };
  }
}

function extractCompanyActiveTripsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/active-trips$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyRouteStopsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes\/([^/]+)\/stops$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      routeId: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      routeId: match[2],
    };
  }
}

function extractCompanyDriversPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/drivers$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function isMyCompaniesPath(pathname) {
  return pathname === "/api/my/companies";
}

function buildProfileUpdateInput(companyId, body) {
  const rawBody = asRecord(body);
  if (!rawBody) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const input = { companyId };
  if (Object.prototype.hasOwnProperty.call(rawBody, "name")) {
    input.name = rawBody.name;
  }
  if (Object.prototype.hasOwnProperty.call(rawBody, "logoUrl")) {
    input.logoUrl = rawBody.logoUrl;
  }
  return input;
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  try {
    if (requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") {
      sendJson(response, 200, {
        ok: true,
        now: new Date().toISOString(),
        ...buildMeta(),
      });
      return;
    }

    if (requestUrl.pathname === "/version") {
      sendJson(response, 200, buildMeta());
      return;
    }

    if (request.method === "GET" && isMyCompaniesPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberships = await listMyCompanies(db, decodedToken.uid);
      sendApiOk(response, 200, memberships);
      return;
    }

    if (request.method === "POST" && isMyCompaniesPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const body = await readJsonBody(request);
      const company = await createCompany(db, decodedToken.uid, asRecord(body) ?? {});
      sendApiOk(response, 201, company);
      return;
    }

    const companyMembersParams = extractCompanyMembersPathParams(requestUrl.pathname);
    if (companyMembersParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyMembersParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const members = await listCompanyMembers(db, {
        companyId: companyMembersParams.companyId,
        limit,
      });
      sendApiOk(response, 200, members);
      return;
    }

    const companyInvitesParams = extractCompanyInvitesPathParams(requestUrl.pathname);
    if (companyInvitesParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyInvitesParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const invites = await listCompanyInvites(db, {
        companyId: companyInvitesParams.companyId,
        limit,
      });
      sendApiOk(response, 200, invites);
      return;
    }

    const companyAuditLogsParams = extractCompanyAuditLogsPathParams(requestUrl.pathname);
    if (companyAuditLogsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyAuditLogsParams.companyId,
        decodedToken.uid,
      );
      requireCompanyOwnerOrAdmin(memberRole);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const auditLogs = await listCompanyAuditLogs(db, {
        companyId: companyAuditLogsParams.companyId,
        limit,
      });
      sendApiOk(response, 200, auditLogs);
      return;
    }

    const companyAdminTenantStateParams = extractCompanyAdminTenantStatePathParams(
      requestUrl.pathname,
    );
    if (companyAdminTenantStateParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyAdminTenantStateParams.companyId,
        decodedToken.uid,
      );
      requireCompanyOwnerOrAdmin(memberRole);

      const tenantState = await getCompanyAdminTenantState(
        db,
        companyAdminTenantStateParams.companyId,
      );
      sendApiOk(response, 200, tenantState);
      return;
    }

    const companyRoutesParams = extractCompanyRoutesPathParams(requestUrl.pathname);
    if (companyRoutesParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyRoutesParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const includeArchived = requestUrl.searchParams.get("includeArchived") === "true";
      const routes = await listCompanyRoutes(db, {
        companyId: companyRoutesParams.companyId,
        limit,
        includeArchived,
      });
      sendApiOk(response, 200, routes);
      return;
    }

    const companyVehiclesParams = extractCompanyVehiclesPathParams(requestUrl.pathname);
    if (companyVehiclesParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyVehiclesParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const vehicles = await listCompanyVehicles(db, {
        companyId: companyVehiclesParams.companyId,
        limit,
      });
      sendApiOk(response, 200, vehicles);
      return;
    }

    if (companyVehiclesParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyVehiclesParams.companyId,
        decodedToken.uid,
      );
      requireCompanyVehicleWriteRole(memberRole);

      const body = await readJsonBody(request);
      const result = await createCompanyVehicle(db, decodedToken.uid, memberRole, {
        ...(asRecord(body) ?? {}),
        companyId: companyVehiclesParams.companyId,
      });
      sendApiOk(response, 201, result);
      return;
    }

    const companyVehicleItemParams = extractCompanyVehicleItemPathParams(requestUrl.pathname);
    if (companyVehicleItemParams && request.method === "PATCH") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyVehicleItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyVehicleWriteRole(memberRole);

      const body = await readJsonBody(request);
      const result = await updateCompanyVehicle(db, decodedToken.uid, memberRole, {
        companyId: companyVehicleItemParams.companyId,
        vehicleId: companyVehicleItemParams.vehicleId,
        patch: body,
      });
      sendApiOk(response, 200, result);
      return;
    }

    if (companyVehicleItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyVehicleItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyVehicleWriteRole(memberRole);

      const result = await deleteCompanyVehicle(db, decodedToken.uid, memberRole, {
        companyId: companyVehicleItemParams.companyId,
        vehicleId: companyVehicleItemParams.vehicleId,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyActiveTripsParams = extractCompanyActiveTripsPathParams(requestUrl.pathname);
    if (companyActiveTripsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyActiveTripsParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const routeId = requestUrl.searchParams.get("routeId")?.trim() || null;
      const driverUid = requestUrl.searchParams.get("driverUid")?.trim() || null;
      const rtdb = getOptionalFirebaseAdminRtdb();
      const activeTrips = await listActiveTripsByCompany(db, rtdb, {
        companyId: companyActiveTripsParams.companyId,
        routeId,
        driverUid,
        limit,
        liveOpsOnlineThresholdMs,
      });
      sendApiOk(response, 200, activeTrips);
      return;
    }

    const companyRouteStopsParams = extractCompanyRouteStopsPathParams(requestUrl.pathname);
    if (companyRouteStopsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyRouteStopsParams.companyId, decodedToken.uid);

      const routeStops = await listCompanyRouteStops(db, {
        companyId: companyRouteStopsParams.companyId,
        routeId: companyRouteStopsParams.routeId,
      });
      sendApiOk(response, 200, routeStops);
      return;
    }

    const companyDriversParams = extractCompanyDriversPathParams(requestUrl.pathname);
    if (companyDriversParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyDriversParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const drivers = await listCompanyDrivers(db, {
        companyId: companyDriversParams.companyId,
        limit,
      });
      sendApiOk(response, 200, drivers);
      return;
    }

    const companyId = extractCompanyIdFromPath(requestUrl.pathname);
    if (companyId) {
      if (request.method === "GET") {
        const decodedToken = await requireAuthenticatedUser(request);
        await requireActiveCompanyMemberRole(db, companyId, decodedToken.uid);
        const profile = await getCompanyProfile(db, companyId);
        sendApiOk(response, 200, profile);
        return;
      }

      if (request.method === "PATCH") {
        const decodedToken = await requireAuthenticatedUser(request);
        const memberRole = await requireActiveCompanyMemberRole(db, companyId, decodedToken.uid);
        requireCompanyOwnerOrAdmin(memberRole);

        const body = await readJsonBody(request);
        const input = buildProfileUpdateInput(companyId, body);
        const result = await updateCompanyProfile(db, input);
        sendApiOk(response, 200, result);
        return;
      }
    }

    sendJson(response, 200, {
      ok: true,
      message: "Self-hosted backend bootstrap is running.",
      nextStep: "Add HTTP endpoints here before replacing Firebase callables.",
      ...buildMeta(),
    });
  } catch (error) {
    sendApiError(response, error);
  }
});

server.listen(port, host, () => {
  // Keep this log single-line for container log scanning.
  console.log(
    JSON.stringify({
      level: "info",
      event: "server_started",
      service: serviceName,
      host,
      port,
      startedAt: startedAt.toISOString(),
    }),
  );
});
