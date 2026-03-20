"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";
import type {
  CreateCompanyInput,
  PlatformCompanyDetail,
  PlatformCompanySummary,
} from "@/features/platform/platform-types";

interface BackendCompanyListItem {
  companyId: string;
  name: string;
  status: "active" | "suspended";
  ownerEmail: string | null;
  ownerUid: string | null;
  vehicleLimit: number;
  vehicleCount: number;
  memberCount: number;
  routeCount: number;
  createdAt: string;
}

interface BackendCompanyDetail {
  companyId: string;
  name: string;
  status: "active" | "suspended";
  ownerEmail: string | null;
  ownerUid: string | null;
  vehicleLimit: number;
  createdAt: string;
  members: {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: string;
    status: string;
    joinedAt: string;
  }[];
  vehicles: {
    vehicleId: string;
    plate: string;
    brand: string | null;
    model: string | null;
    capacity: number | null;
    status: string;
  }[];
  routes: {
    routeId: string;
    name: string;
    stopCount: number;
    passengerCount?: number;
    isArchived: boolean;
  }[];
}

interface BackendCreateCompanyResult {
  companyId: string;
  ownerUid: string;
  ownerEmail: string;
  notificationSent?: boolean;
  loginUrl?: string;
  createdAt: string;
}

interface BackendSetVehicleLimitResult {
  companyId: string;
  vehicleLimit: number;
  updatedAt: string;
}

interface BackendSetCompanyStatusResult {
  companyId: string;
  status: "active" | "suspended";
  updatedAt: string;
}

export async function platformListCompanies(): Promise<PlatformCompanySummary[]> {
  const result = await callBackendApi<{ items: BackendCompanyListItem[] }>({
    baseUrl: requireBackendApiBaseUrl(),
    path: "api/platform/companies",
  });

  return (result.data?.items ?? []).map((item) => ({
    id: item.companyId,
    name: item.name,
    ownerEmail: item.ownerEmail ?? "",
    ownerUid: item.ownerUid,
    status: item.status,
    vehicleLimit: item.vehicleLimit,
    vehicleCount: item.vehicleCount,
    memberCount: item.memberCount,
    routeCount: item.routeCount,
    createdAt: item.createdAt,
  }));
}

export async function platformGetCompanyDetail(
  companyId: string,
): Promise<PlatformCompanyDetail | null> {
  try {
    const result = await callBackendApi<BackendCompanyDetail>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `api/platform/companies/${encodeURIComponent(companyId)}`,
    });

    const data = result.data;
    if (!data) {
      return null;
    }

    return {
      id: data.companyId,
      name: data.name,
      ownerEmail: data.ownerEmail ?? "",
      ownerUid: data.ownerUid,
      status: data.status,
      vehicleLimit: data.vehicleLimit,
      vehicleCount: data.vehicles.length,
      memberCount: data.members.length,
      routeCount: data.routes.length,
      createdAt: data.createdAt,
      members: data.members.map((member) => ({
        uid: member.uid,
        email: member.email ?? "",
        displayName: member.displayName,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
      })),
      vehicles: data.vehicles.map((vehicle) => ({
        id: vehicle.vehicleId,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        capacity: vehicle.capacity,
        status: (vehicle.status === "active" ? "active" : "inactive") as
          | "active"
          | "inactive",
      })),
      routes: data.routes.map((route) => ({
        id: route.routeId,
        name: route.name,
        stopCount: route.stopCount,
        passengerCount: route.passengerCount ?? 0,
        status: route.isArchived ? ("draft" as const) : ("active" as const),
      })),
    };
  } catch {
    return null;
  }
}

export async function platformCreateCompany(
  input: CreateCompanyInput,
): Promise<{ companyId: string; notificationSent: boolean; loginUrl: string | null }> {
  const result = await callBackendApi<BackendCreateCompanyResult>({
    baseUrl: requireBackendApiBaseUrl(),
    path: "api/platform/companies",
    method: "POST",
    body: {
      companyName: input.companyName,
      ownerEmail: input.ownerEmail,
      vehicleLimit: input.vehicleLimit,
    },
  });

  return {
    companyId: result.data?.companyId ?? "",
    notificationSent: result.data?.notificationSent === true,
    loginUrl: result.data?.loginUrl ?? null,
  };
}

export async function platformSetVehicleLimit(
  companyId: string,
  vehicleLimit: number,
): Promise<void> {
  await callBackendApi<BackendSetVehicleLimitResult>({
    baseUrl: requireBackendApiBaseUrl(),
    path: `api/platform/companies/${encodeURIComponent(companyId)}/vehicle-limit`,
    method: "PATCH",
    body: { vehicleLimit },
  });
}

export async function platformSetCompanyStatus(
  companyId: string,
  status: "active" | "suspended",
): Promise<void> {
  await callBackendApi<BackendSetCompanyStatusResult>({
    baseUrl: requireBackendApiBaseUrl(),
    path: `api/platform/companies/${encodeURIComponent(companyId)}/status`,
    method: "PATCH",
    body: { status },
  });
}

export async function platformResetOwnerPassword(
  companyId: string,
): Promise<{ notificationSent: boolean; loginUrl: string | null }> {
  const result = await callBackendApi<{ notificationSent?: boolean; loginUrl?: string }>({
    baseUrl: requireBackendApiBaseUrl(),
    path: `api/platform/companies/${encodeURIComponent(companyId)}/reset-owner-password`,
    method: "POST",
  });

  return {
    notificationSent: result.data?.notificationSent === true,
    loginUrl: result.data?.loginUrl ?? null,
  };
}

export async function platformDeleteCompany(companyId: string): Promise<void> {
  await callBackendApi<{ companyId: string; deletedAt: string }>({
    baseUrl: requireBackendApiBaseUrl(),
    path: `api/platform/companies/${encodeURIComponent(companyId)}`,
    method: "DELETE",
  });
}
