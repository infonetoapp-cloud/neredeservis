"use client";

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
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "revokeDriverRoutePermissions",
    input,
  );
  return ensureRevokeDriverRoutePermissionsResponse(
    envelope.data,
    "revokeDriverRoutePermissions",
  );
}
