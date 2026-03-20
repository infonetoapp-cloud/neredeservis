"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { callFirebaseCallable } from "@/lib/firebase/callable";
import type {
  PlatformCompanySummary,
  PlatformCompanyDetail,
  CreateCompanyInput,
} from "@/features/platform/platform-types";

// ─── Response types (Firestore backend'den dönen yapıya hizalı) ──────────────

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

// ─── Callable wrappers ──────────────────────────────────────────────────────

export async function platformListCompanies(): Promise<PlatformCompanySummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const result = await callBackendApi<{ items: BackendCompanyListItem[] }>({
      baseUrl: backendApiBaseUrl,
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

  const result = await callFirebaseCallable<
    Record<string, never>,
    { items: BackendCompanyListItem[] }
  >("platformListCompanies", {});

  return result.data.items.map((item) => ({
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
    const backendApiBaseUrl = getBackendApiBaseUrl();
    if (backendApiBaseUrl) {
      const result = await callBackendApi<BackendCompanyDetail>({
        baseUrl: backendApiBaseUrl,
        path: `api/platform/companies/${encodeURIComponent(companyId)}`,
      });

      const d = result.data;
      if (!d) {
        return null;
      }

      return {
        id: d.companyId,
        name: d.name,
        ownerEmail: d.ownerEmail ?? "",
        ownerUid: d.ownerUid,
        status: d.status,
        vehicleLimit: d.vehicleLimit,
        vehicleCount: d.vehicles.length,
        memberCount: d.members.length,
        routeCount: d.routes.length,
        createdAt: d.createdAt,
        members: d.members.map((m) => ({
          uid: m.uid,
          email: m.email ?? "",
          displayName: m.displayName,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt,
        })),
        vehicles: d.vehicles.map((v) => ({
          id: v.vehicleId,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          capacity: v.capacity,
          status: (v.status === "active" ? "active" : "inactive") as "active" | "inactive",
        })),
        routes: d.routes.map((r) => ({
          id: r.routeId,
          name: r.name,
          stopCount: r.stopCount,
          passengerCount: r.passengerCount ?? 0,
          status: r.isArchived ? ("draft" as const) : ("active" as const),
        })),
      };
    }

    const result = await callFirebaseCallable<
      { companyId: string },
      BackendCompanyDetail
    >("platformGetCompanyDetail", { companyId });

    const d = result.data;

    return {
      id: d.companyId,
      name: d.name,
      ownerEmail: d.ownerEmail ?? "",
      ownerUid: d.ownerUid,
      status: d.status,
      vehicleLimit: d.vehicleLimit,
      vehicleCount: d.vehicles.length,
      memberCount: d.members.length,
      routeCount: d.routes.length,
      createdAt: d.createdAt,
      members: d.members.map((m) => ({
        uid: m.uid,
        email: m.email ?? "",
        displayName: m.displayName,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
      vehicles: d.vehicles.map((v) => ({
        id: v.vehicleId,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        capacity: v.capacity,
        status: (v.status === "active" ? "active" : "inactive") as "active" | "inactive",
      })),
      routes: d.routes.map((r) => ({
        id: r.routeId,
        name: r.name,
        stopCount: r.stopCount,
        passengerCount: 0, // Backend henüz döndürmüyor
        status: r.isArchived ? ("draft" as const) : ("active" as const),
      })),
    };
  } catch {
    return null;
  }
}

export async function platformCreateCompany(
  input: CreateCompanyInput,
): Promise<{ companyId: string; notificationSent: boolean; loginUrl: string | null }> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const result = await callBackendApi<BackendCreateCompanyResult>({
      baseUrl: backendApiBaseUrl,
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

  const result = await callFirebaseCallable<
    { companyName: string; ownerEmail: string; vehicleLimit: number },
    BackendCreateCompanyResult
  >("platformCreateCompany", {
    companyName: input.companyName,
    ownerEmail: input.ownerEmail,
    vehicleLimit: input.vehicleLimit,
  });

  return {
    companyId: result.data.companyId,
    notificationSent: true,
    loginUrl: null,
  };
}

export async function platformSetVehicleLimit(
  companyId: string,
  vehicleLimit: number,
): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    await callBackendApi<BackendSetVehicleLimitResult>({
      baseUrl: backendApiBaseUrl,
      path: `api/platform/companies/${encodeURIComponent(companyId)}/vehicle-limit`,
      method: "PATCH",
      body: { vehicleLimit },
    });
    return;
  }

  await callFirebaseCallable<
    { companyId: string; vehicleLimit: number },
    BackendSetVehicleLimitResult
  >("platformSetVehicleLimit", { companyId, vehicleLimit });
}

export async function platformSetCompanyStatus(
  companyId: string,
  status: "active" | "suspended",
): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    await callBackendApi<BackendSetCompanyStatusResult>({
      baseUrl: backendApiBaseUrl,
      path: `api/platform/companies/${encodeURIComponent(companyId)}/status`,
      method: "PATCH",
      body: { status },
    });
    return;
  }

  await callFirebaseCallable<
    { companyId: string; status: string },
    BackendSetCompanyStatusResult
  >("platformSetCompanyStatus", { companyId, status });
}

export async function platformResetOwnerPassword(
  companyId: string,
): Promise<{ notificationSent: boolean; loginUrl: string | null }> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const result = await callBackendApi<{ notificationSent?: boolean; loginUrl?: string }>({
      baseUrl: backendApiBaseUrl,
      path: `api/platform/companies/${encodeURIComponent(companyId)}/reset-owner-password`,
      method: "POST",
    });
    return {
      notificationSent: result.data?.notificationSent === true,
      loginUrl: result.data?.loginUrl ?? null,
    };
  }

  const result = await callFirebaseCallable<
    { companyId: string },
    { loginLink: string }
  >("platformResetOwnerPassword", { companyId });
  return {
    notificationSent: Boolean(result.data.loginLink),
    loginUrl: result.data.loginLink || null,
  };
}

export async function platformDeleteCompany(companyId: string): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    await callBackendApi<
      { companyId: string; deletedAt: string }
    >({
      baseUrl: backendApiBaseUrl,
      path: `api/platform/companies/${encodeURIComponent(companyId)}`,
      method: "DELETE",
    });
    return;
  }

  await callFirebaseCallable<
    { companyId: string },
    { companyId: string; deletedAt: string }
  >("platformDeleteCompany", { companyId });
}
