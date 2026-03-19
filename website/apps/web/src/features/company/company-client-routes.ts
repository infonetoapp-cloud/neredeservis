"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { httpsCallable } from "firebase/functions";

import { getFirebaseClientFunctions } from "@/lib/firebase/client";

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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const query = new URLSearchParams();
      if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
        query.set("limit", String(Math.trunc(input.limit)));
      }

      const response = await callBackendApi<{ items?: unknown }>({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/routes${
          query.size > 0 ? `?${query.toString()}` : ""
        }`,
      });
      return parseCompanyRouteItems(response.data?.items);
    } catch (error) {
      throw new Error(toFriendlyErrorMessage(error));
    }
  }

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ items?: unknown }>>(
    functions,
    "listCompanyRoutes",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyRouteItems(response.data?.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyLiveOpsForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyLiveOpsSnapshot> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
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
        baseUrl: backendApiBaseUrl,
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

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; limit?: number },
    ApiOk<{ companyId?: unknown; generatedAt?: unknown; items?: unknown }>
  >(functions, "listCompanyLiveOps");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    const payload = asRecord(response.data?.data);
    const companyId = readString(payload?.companyId) ?? input.companyId.trim();
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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const response = await callBackendApi<{ route?: unknown }>({
        baseUrl: backendApiBaseUrl,
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
          allowGuestTracking: input.allowGuestTracking ?? false,
          ...(Array.isArray(input.authorizedDriverIds)
            ? { authorizedDriverIds: input.authorizedDriverIds }
            : {}),
        },
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

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
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
    },
    ApiOk<{ route?: unknown; routeId?: unknown; srvCode?: unknown }>
  >(functions, "createCompanyRoute");

  try {
    const payload: {
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
    } = {
      companyId: input.companyId.trim(),
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

    const response = await callable(payload);
    const routes = parseCompanyRouteItems([response.data?.data?.route]);
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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const routeId = input.routeId.trim();
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
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}`,
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

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      routeId: string;
      patch: {
        name?: string;
        scheduledTime?: string;
        timeSlot?: Exclude<CompanyRouteTimeSlot, null>;
        vehicleId?: string | null;
        allowGuestTracking?: boolean;
        authorizedDriverIds?: string[];
        isArchived?: boolean;
      };
    },
    ApiOk<{ route?: unknown; routeId?: unknown; updatedAt?: unknown }>
  >(functions, "updateCompanyRoute");

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

    const payload: {
      companyId: string;
      routeId: string;
      patch: {
        name?: string;
        scheduledTime?: string;
        timeSlot?: Exclude<CompanyRouteTimeSlot, null>;
        vehicleId?: string | null;
        allowGuestTracking?: boolean;
        authorizedDriverIds?: string[];
        isArchived?: boolean;
      };
    } = {
      companyId: input.companyId.trim(),
      routeId: input.routeId.trim(),
      patch,
    };

    const response = await callable(payload);
    const routes = parseCompanyRouteItems([response.data?.data?.route]);
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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const routeId = input.routeId.trim();
      await callBackendApi({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}`,
        method: "DELETE",
      });
      return;
    } catch (error) {
      throw new Error(toFriendlyErrorMessage(error));
    }
  }

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; routeId: string },
    ApiOk<{ routeId?: unknown; deleted?: unknown; deletedAt?: unknown }>
  >(functions, "deleteCompanyRoute");

  try {
    await callable({
      companyId: input.companyId.trim(),
      routeId: input.routeId.trim(),
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyRouteStopsForRoute(input: {
  companyId: string;
  routeId: string;
}): Promise<CompanyRouteStopItem[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const routeId = input.routeId.trim();
      const response = await callBackendApi<{ items?: unknown }>({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops`,
      });
      return parseCompanyRouteStopItems(response.data?.items);
    } catch (error) {
      throw new Error(toFriendlyErrorMessage(error));
    }
  }

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; routeId: string }, ApiOk<{ items?: unknown }>>(
    functions,
    "listCompanyRouteStops",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      routeId: input.routeId.trim(),
    });
    return parseCompanyRouteStopItems(response.data?.data?.items);
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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const routeId = input.routeId.trim();
      const response = await callBackendApi<{ stop?: unknown }>({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops`,
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

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      routeId: string;
      stopId?: string;
      name: string;
      location: { lat: number; lng: number };
      order: number;
    },
    ApiOk<{ stop?: unknown }>
  >(functions, "upsertCompanyRouteStop");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      routeId: input.routeId.trim(),
      stopId: input.stopId?.trim(),
      name: input.name.trim(),
      location: input.location,
      order: input.order,
    });
    const stops = parseCompanyRouteStopItems([response.data?.data?.stop]);
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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const routeId = input.routeId.trim();
      const stopId = input.stopId.trim();
      await callBackendApi({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}`,
        method: "DELETE",
      });
      return;
    } catch (error) {
      throw new Error(toFriendlyErrorMessage(error));
    }
  }

  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; routeId: string; stopId: string },
    ApiOk<{ deleted?: boolean }>
  >(functions, "deleteCompanyRouteStop");

  try {
    await callable({
      companyId: input.companyId.trim(),
      routeId: input.routeId.trim(),
      stopId: input.stopId.trim(),
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}
