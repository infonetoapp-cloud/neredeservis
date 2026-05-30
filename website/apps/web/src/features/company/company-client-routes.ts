"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

import {
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
      companyId: readString(payload?.companyId) ?? companyId,
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
    const response = await callBackendApi<{ route?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes`,
      method: "POST",
      body: {
        name: input.name.trim(),
        ...(input.driverId !== undefined ? { driverId: input.driverId } : {}),
        startPoint: input.startPoint,
        startAddress: input.startAddress.trim(),
        endPoint: input.endPoint,
        endAddress: input.endAddress.trim(),
        scheduledTime: input.scheduledTime.trim(),
        timeSlot: input.timeSlot,
        ...(input.vehicleId !== undefined ? { vehicleId: input.vehicleId } : {}),
        allowGuestTracking: input.allowGuestTracking ?? false,
        ...(Array.isArray(input.authorizedDriverIds)
          ? { authorizedDriverIds: input.authorizedDriverIds }
          : {}),
      },
    });
    const route = parseCompanyRouteItems([response.data?.route])[0];
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
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const patch: Record<string, unknown> = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.startPoint !== undefined ? { startPoint: input.startPoint } : {}),
      ...(input.startAddress !== undefined ? { startAddress: input.startAddress.trim() } : {}),
      ...(input.endPoint !== undefined ? { endPoint: input.endPoint } : {}),
      ...(input.endAddress !== undefined ? { endAddress: input.endAddress.trim() } : {}),
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
      ...(input.vacationUntil !== undefined ? { vacationUntil: input.vacationUntil } : {}),
    };

    const response = await callBackendApi<{ route?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}`,
      method: "PATCH",
      body: { patch },
    });
    const route = parseCompanyRouteItems([response.data?.route])[0];
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
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}`,
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
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const response = await callBackendApi<{ items?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops`,
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
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const response = await callBackendApi<{ stop?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops`,
      method: "POST",
      body: {
        stopId: input.stopId?.trim(),
        name: input.name.trim(),
        location: input.location,
        order: input.order,
      },
    });
    const stop = parseCompanyRouteStopItems([response.data?.stop])[0];
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
    const companyId = input.companyId.trim();
    const routeId = input.routeId.trim();
    const stopId = input.stopId.trim();
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}`,
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}
