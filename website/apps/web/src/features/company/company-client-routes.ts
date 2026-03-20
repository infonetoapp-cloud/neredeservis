"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

import {
  type ApiOk,
  asRecord,
  type CompanyLiveOpsSnapshot,
  type CompanyRouteItem,
  type CompanyRouteStopItem,
  type CompanyRouteTimeSlot,
  parseCompanyLiveOpsItems,
  parseCompanyRouteItems,
  parseCompanyRouteStopItems,
  readString,
  toFriendlyErrorMessage,
} from "./company-client-shared";
export async function listCompanyRoutesForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyRouteItem[]> {
  try {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }

    const response = await callBackendApi<{ items?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    return parseCompanyRouteItems(response.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyLiveOpsForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyLiveOpsSnapshot> {
  try {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }

    const response = await callBackendApi<{
      companyId?: unknown;
      generatedAt?: unknown;
      items?: unknown;
    }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/live-ops${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    const payload = asRecord(response.data);
    return {
      companyId,
      generatedAt: readString(payload?.generatedAt),
      items: parseCompanyLiveOpsItems(payload?.items),
    };
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function createCompanyRouteForCompany(input: {
  companyId: string;
  name: string;
  driverId?: string | null;
  startPoint: { lat: number; lng: number };
  startAddress: string;
  endPoint: { lat: number; lng: number };
  endAddress: string;
  scheduledTime: string;
  timeSlot: Exclude<CompanyRouteTimeSlot, null>;
  vehicleId?: string | null;
  allowGuestTracking?: boolean;
  authorizedDriverIds?: string[];
}): Promise<CompanyRouteItem> {
  try {
    const companyId = input.companyId.trim();
    const payload = {
      name: input.name.trim(),
      ...(input.driverId !== undefined ? { driverId: input.driverId } : {}),
      startPoint: input.startPoint,
      startAddress: input.startAddress.trim(),
      endPoint: input.endPoint,
      endAddress: input.endAddress.trim(),
      scheduledTime: input.scheduledTime.trim(),
      timeSlot: input.timeSlot,
      ...(input.vehicleId !== undefined ? { vehicleId: input.vehicleId } : {}),
      allowGuestTracking: input.allowGuestTracking,
      ...(Array.isArray(input.authorizedDriverIds)
        ? { authorizedDriverIds: input.authorizedDriverIds }
        : {}),
    };

    const response = await callBackendApi<{ route?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes`,
      method: "POST",
      body: payload,
    });
    const routes = parseCompanyRouteItems([response.data?.route]);
    const route = routes[0];
    if (!route) {
      throw new Error("CREATE_COMPANY_ROUTE_RESPONSE_INVALID");
    }
    return route;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function updateCompanyRouteForCompany(input: {
  companyId: string;
  routeId: string;
  name?: string;
  startPoint?: { lat: number; lng: number };
  startAddress?: string;
  endPoint?: { lat: number; lng: number };
  endAddress?: string;
  scheduledTime?: string;
  timeSlot?: Exclude<CompanyRouteTimeSlot, null>;
  vehicleId?: string | null;
  allowGuestTracking?: boolean;
  authorizedDriverIds?: string[];
  isArchived?: boolean;
  vacationUntil?: string | null;
}): Promise<CompanyRouteItem> {
  try {
    const patch: {
      name?: string;
      scheduledTime?: string;
      timeSlot?: Exclude<CompanyRouteTimeSlot, null>;
      vehicleId?: string | null;
      allowGuestTracking?: boolean;
      authorizedDriverIds?: string[];
      isArchived?: boolean;
    } = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.scheduledTime !== undefined ? { scheduledTime: input.scheduledTime.trim() } : {}),
      ...(input.timeSlot !== undefined ? { timeSlot: input.timeSlot } : {}),
      ...(input.vehicleId !== undefined ? { vehicleId: input.vehicleId } : {}),
      ...(input.allowGuestTracking !== undefined
        ? { allowGuestTracking: input.allowGuestTracking }
        : {}),
      ...(Array.isArray(input.authorizedDriverIds)
        ? { authorizedDriverIds: input.authorizedDriverIds }
        : {}),
      ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
    };
    const response = await callBackendApi<{ route?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(input.companyId.trim())}/routes/${encodeURIComponent(input.routeId.trim())}`,
      method: "PATCH",
      body: {
        patch,
      },
    });
    const routes = parseCompanyRouteItems([response.data?.route]);
    const route = routes[0];
    if (!route) {
      throw new Error("UPDATE_COMPANY_ROUTE_RESPONSE_INVALID");
    }
    return route;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function deleteCompanyRouteForCompany(input: {
  companyId: string;
  routeId: string;
}): Promise<void> {
  try {
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(input.companyId.trim())}/routes/${encodeURIComponent(input.routeId.trim())}`,
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyRouteStopsForRoute(input: {
  companyId: string;
  routeId: string;
}): Promise<CompanyRouteStopItem[]> {
  try {
    const response = await callBackendApi<{ items?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(input.companyId.trim())}/routes/${encodeURIComponent(input.routeId.trim())}/stops`,
    });
    return parseCompanyRouteStopItems(response.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function upsertCompanyRouteStopForRoute(input: {
  companyId: string;
  routeId: string;
  stopId?: string;
  name: string;
  location: { lat: number; lng: number };
  order: number;
}): Promise<CompanyRouteStopItem> {
  try {
    const response = await callBackendApi<{ stop?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(input.companyId.trim())}/routes/${encodeURIComponent(input.routeId.trim())}/stops`,
      method: "POST",
      body: {
        stopId: input.stopId?.trim(),
        name: input.name.trim(),
        location: input.location,
        order: input.order,
      },
    });
    const stops = parseCompanyRouteStopItems([response.data?.stop]);
    const stop = stops[0];
    if (!stop) {
      throw new Error("UPSERT_COMPANY_ROUTE_STOP_RESPONSE_INVALID");
    }
    return stop;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function deleteCompanyRouteStopForRoute(input: {
  companyId: string;
  routeId: string;
  stopId: string;
}): Promise<void> {
  try {
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(input.companyId.trim())}/routes/${encodeURIComponent(input.routeId.trim())}/stops/${encodeURIComponent(input.stopId.trim())}`,
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}
