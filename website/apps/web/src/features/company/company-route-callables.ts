"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { callFirebaseCallable } from "@/lib/firebase/callable";
import {
  ensureCreateCompanyRouteResponse,
  ensureDeleteCompanyRouteStopResponse,
  ensureGrantDriverRoutePermissionsResponse,
  ensureListActiveTripsByCompanyResponse,
  ensureListCompanyRouteStopsResponse,
  ensureListCompanyRoutesResponse,
  ensureListRouteDriverPermissionsResponse,
  ensureReorderCompanyRouteStopsResponse,
  ensureRevokeDriverRoutePermissionsResponse,
  ensureUpdateCompanyRouteResponse,
  ensureUpsertCompanyRouteStopResponse,
} from "@/features/company/company-callable-contract-guards";
import type {
  CompanyActiveTripSummary,
  CompanyRouteStopSummary,
  CompanyRouteSummary,
  CreateCompanyRouteResponse,
  DeleteCompanyRouteStopResponse,
  GrantDriverRoutePermissionsResponse,
  ReorderCompanyRouteStopsResponse,
  RevokeDriverRoutePermissionsResponse,
  RouteDriverPermissionFlags,
  RouteDriverPermissionSummary,
  UpdateCompanyRouteResponse,
  UpsertCompanyRouteStopResponse,
} from "@/features/company/company-types";

export async function listCompanyRoutesCallable(input: {
  companyId: string;
  includeArchived?: boolean;
  limit?: number;
}): Promise<CompanyRouteSummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }
    if (input.includeArchived === true) {
      query.set("includeArchived", "true");
    }

    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    return ensureListCompanyRoutesResponse(envelope.data, "listCompanyRoutes").items;
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "listCompanyRoutes",
    input,
  );
  return ensureListCompanyRoutesResponse(envelope.data, "listCompanyRoutes").items;
}

export async function createCompanyRouteCallable(input: {
  companyId: string;
  name: string;
  startPoint: { lat: number; lng: number };
  startAddress: string;
  endPoint: { lat: number; lng: number };
  endAddress: string;
  scheduledTime: string;
  timeSlot: "morning" | "evening" | "midday" | "custom";
  allowGuestTracking: boolean;
  authorizedDriverIds?: string[];
  idempotencyKey?: string;
}): Promise<CreateCompanyRouteResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes`,
      method: "POST",
      body: input,
    });
    return ensureCreateCompanyRouteResponse(envelope.data, "createCompanyRoute");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "createCompanyRoute",
    input,
  );
  return ensureCreateCompanyRouteResponse(envelope.data, "createCompanyRoute");
}

export async function listCompanyRouteStopsCallable(input: {
  companyId: string;
  routeId: string;
}): Promise<CompanyRouteStopSummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops`,
    });
    return ensureListCompanyRouteStopsResponse(envelope.data, "listCompanyRouteStops").items;
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "listCompanyRouteStops",
    input,
  );
  return ensureListCompanyRouteStopsResponse(envelope.data, "listCompanyRouteStops").items;
}

export async function listActiveTripsByCompanyCallable(input: {
  companyId: string;
  routeId?: string | null;
  driverUid?: string | null;
  limit?: number;
}): Promise<CompanyActiveTripSummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }
    if (input.routeId) {
      query.set("routeId", input.routeId);
    }
    if (input.driverUid) {
      query.set("driverUid", input.driverUid);
    }

    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/active-trips${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    return ensureListActiveTripsByCompanyResponse(envelope.data, "listActiveTripsByCompany").items;
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "listActiveTripsByCompany",
    input,
  );
  return ensureListActiveTripsByCompanyResponse(envelope.data, "listActiveTripsByCompany").items;
}

export async function updateCompanyRouteCallable(input: {
  companyId: string;
  routeId: string;
  lastKnownUpdateToken?: string;
  patch: {
    name?: string;
    scheduledTime?: string;
    timeSlot?: "morning" | "evening" | "midday" | "custom";
    allowGuestTracking?: boolean;
    isArchived?: boolean;
    authorizedDriverIds?: string[];
  };
}): Promise<UpdateCompanyRouteResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}`,
      method: "PATCH",
      body: {
        lastKnownUpdateToken: input.lastKnownUpdateToken,
        patch: input.patch,
      },
    });
    return ensureUpdateCompanyRouteResponse(envelope.data, "updateCompanyRoute");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "updateCompanyRoute",
    input,
  );
  return ensureUpdateCompanyRouteResponse(envelope.data, "updateCompanyRoute");
}

export async function upsertCompanyRouteStopCallable(input: {
  companyId: string;
  routeId: string;
  lastKnownUpdateToken?: string;
  stopId?: string;
  name: string;
  order: number;
  location: { lat: number; lng: number };
}): Promise<UpsertCompanyRouteStopResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops`,
      method: "POST",
      body: input,
    });
    return ensureUpsertCompanyRouteStopResponse(envelope.data, "upsertCompanyRouteStop");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "upsertCompanyRouteStop",
    input,
  );
  return ensureUpsertCompanyRouteStopResponse(envelope.data, "upsertCompanyRouteStop");
}

export async function deleteCompanyRouteStopCallable(input: {
  companyId: string;
  routeId: string;
  stopId: string;
  lastKnownUpdateToken?: string;
}): Promise<DeleteCompanyRouteStopResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const stopId = input.stopId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}`,
      method: "DELETE",
      body: {
        lastKnownUpdateToken: input.lastKnownUpdateToken,
      },
    });
    return ensureDeleteCompanyRouteStopResponse(envelope.data, "deleteCompanyRouteStop");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "deleteCompanyRouteStop",
    input,
  );
  return ensureDeleteCompanyRouteStopResponse(envelope.data, "deleteCompanyRouteStop");
}

export async function reorderCompanyRouteStopsCallable(input: {
  companyId: string;
  routeId: string;
  stopId: string;
  direction: "up" | "down";
  lastKnownUpdateToken?: string;
}): Promise<ReorderCompanyRouteStopsResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const stopId = input.stopId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}/reorder`,
      method: "POST",
      body: {
        direction: input.direction,
        lastKnownUpdateToken: input.lastKnownUpdateToken,
      },
    });
    return ensureReorderCompanyRouteStopsResponse(envelope.data, "reorderCompanyRouteStops");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "reorderCompanyRouteStops",
    input,
  );
  return ensureReorderCompanyRouteStopsResponse(envelope.data, "reorderCompanyRouteStops");
}

export async function grantDriverRoutePermissionsCallable(input: {
  companyId: string;
  routeId: string;
  driverUid: string;
  idempotencyKey?: string;
  permissions: RouteDriverPermissionFlags;
}): Promise<GrantDriverRoutePermissionsResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const driverUid = input.driverUid.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/driver-permissions/${encodeURIComponent(driverUid)}`,
      method: "PUT",
      body: {
        permissions: input.permissions,
      },
    });
    return ensureGrantDriverRoutePermissionsResponse(envelope.data, "grantDriverRoutePermissions");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "grantDriverRoutePermissions",
    input,
  );
  return ensureGrantDriverRoutePermissionsResponse(envelope.data, "grantDriverRoutePermissions");
}

export async function listRouteDriverPermissionsCallable(input: {
  companyId: string;
  routeId: string;
}): Promise<RouteDriverPermissionSummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/driver-permissions`,
    });
    return ensureListRouteDriverPermissionsResponse(envelope.data, "listRouteDriverPermissions").items;
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "listRouteDriverPermissions",
    input,
  );
  return ensureListRouteDriverPermissionsResponse(envelope.data, "listRouteDriverPermissions").items;
}

export async function revokeDriverRoutePermissionsCallable(input: {
  companyId: string;
  routeId: string;
  driverUid: string;
  idempotencyKey?: string;
  permissionKeys?: Array<keyof RouteDriverPermissionFlags>;
  resetToDefault?: boolean;
}): Promise<RevokeDriverRoutePermissionsResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const driverUid = input.driverUid.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/driver-permissions/${encodeURIComponent(driverUid)}`,
      method: "DELETE",
      body: {
        permissionKeys: input.permissionKeys,
        resetToDefault: input.resetToDefault,
      },
    });
    return ensureRevokeDriverRoutePermissionsResponse(
      envelope.data,
      "revokeDriverRoutePermissions",
    );
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "revokeDriverRoutePermissions",
    input,
  );
  return ensureRevokeDriverRoutePermissionsResponse(
    envelope.data,
    "revokeDriverRoutePermissions",
  );
}
