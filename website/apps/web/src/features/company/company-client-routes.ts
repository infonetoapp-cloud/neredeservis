"use client";

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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ routes?: unknown }>>(
    functions,
    "listCompanyRoutes",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyRouteItems(response.data?.data?.routes);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function listCompanyLiveOpsForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyLiveOpsSnapshot> {
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      name: string;
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
    ApiOk<{ route?: unknown }>
  >(functions, "createCompanyRoute");

  try {
    const payload: {
      companyId: string;
      name: string;
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
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
    },
    ApiOk<{ route?: unknown }>
  >(functions, "updateCompanyRoute");

  try {
    const payload: {
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
    } = {
      companyId: input.companyId.trim(),
      routeId: input.routeId.trim(),
      name: input.name?.trim(),
      startPoint: input.startPoint,
      startAddress: input.startAddress?.trim(),
      endPoint: input.endPoint,
      endAddress: input.endAddress?.trim(),
      scheduledTime: input.scheduledTime?.trim(),
      timeSlot: input.timeSlot,
      ...(input.vehicleId !== undefined ? { vehicleId: input.vehicleId } : {}),
      allowGuestTracking: input.allowGuestTracking,
      isArchived: input.isArchived,
      vacationUntil: input.vacationUntil,
      ...(Array.isArray(input.authorizedDriverIds)
        ? { authorizedDriverIds: input.authorizedDriverIds }
        : {}),
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

export async function listCompanyRouteStopsForRoute(input: {
  companyId: string;
  routeId: string;
}): Promise<CompanyRouteStopItem[]> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<{ companyId: string; routeId: string }, ApiOk<{ stops?: unknown }>>(
    functions,
    "listCompanyRouteStops",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      routeId: input.routeId.trim(),
    });
    return parseCompanyRouteStopItems(response.data?.data?.stops);
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
