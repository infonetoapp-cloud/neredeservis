"use client";

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
    isArchived: boolean;
  }[];
}

interface BackendCreateCompanyResult {
  companyId: string;
  ownerUid: string;
  ownerEmail: string;
  passwordResetLink: string;
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
): Promise<{ companyId: string; passwordResetLink: string }> {
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
    passwordResetLink: result.data.passwordResetLink,
  };
}

export async function platformSetVehicleLimit(
  companyId: string,
  vehicleLimit: number,
): Promise<void> {
  await callFirebaseCallable<
    { companyId: string; vehicleLimit: number },
    BackendSetVehicleLimitResult
  >("platformSetVehicleLimit", { companyId, vehicleLimit });
}

export async function platformSetCompanyStatus(
  companyId: string,
  status: "active" | "suspended",
): Promise<void> {
  await callFirebaseCallable<
    { companyId: string; status: string },
    BackendSetCompanyStatusResult
  >("platformSetCompanyStatus", { companyId, status });
}

export async function platformResetOwnerPassword(
  companyId: string,
): Promise<{ loginLink: string }> {
  const result = await callFirebaseCallable<
    { companyId: string },
    { loginLink: string }
  >("platformResetOwnerPassword", { companyId });
  return { loginLink: result.data.loginLink };
}
