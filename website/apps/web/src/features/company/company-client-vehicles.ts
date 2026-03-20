"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

import {
  type ApiOk,
  type CompanyVehicleItem,
  parseCompanyVehicleItems,
  toFriendlyErrorMessage,
} from "./company-client-shared";
export async function listCompanyVehiclesForCompany(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyVehicleItem[]> {
  try {
    const companyId = input.companyId.trim();
    const query = new URLSearchParams();
    if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
      query.set("limit", String(Math.trunc(input.limit)));
    }

    const response = await callBackendApi<{ items?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/vehicles${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
    });
    return parseCompanyVehicleItems(response.data?.items);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function createCompanyVehicleForCompany(input: {
  companyId: string;
  plate: string;
  ownerType?: "company";
  label?: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number;
  status?: "active" | "maintenance" | "inactive";
}): Promise<CompanyVehicleItem> {
  try {
    const companyId = input.companyId.trim();
    const payload: Record<string, unknown> = {
      plate: input.plate.trim(),
      ownerType: input.ownerType ?? "company",
    };
    const label = input.label?.trim();
    if (label) payload.label = label;
    const brand = input.brand?.trim();
    if (brand) payload.brand = brand;
    const model = input.model?.trim();
    if (model) payload.model = model;
    if (input.year != null) payload.year = input.year;
    if (input.capacity != null) payload.capacity = input.capacity;
    if (input.status != null) payload.status = input.status;

    const response = await callBackendApi<{ vehicle?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(companyId)}/vehicles`,
      method: "POST",
      body: payload,
    });
    const vehicles = parseCompanyVehicleItems([response.data?.vehicle]);
    const vehicle = vehicles[0];
    if (!vehicle) {
      throw new Error("CREATE_COMPANY_VEHICLE_RESPONSE_INVALID");
    }
    return vehicle;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function updateCompanyVehicleForCompany(input: {
  companyId: string;
  vehicleId: string;
  plate?: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number | null;
  status?: "active" | "maintenance" | "inactive";
}): Promise<CompanyVehicleItem> {
  try {
    const patch: Record<string, unknown> = {};
    if (input.plate !== undefined) patch.plate = input.plate.trim();
    if (input.brand !== undefined) patch.brand = input.brand;
    if (input.model !== undefined) patch.model = input.model;
    if (input.year !== undefined) patch.year = input.year;
    if (input.capacity !== undefined) patch.capacity = input.capacity;
    if (input.status !== undefined) patch.status = input.status;

    const response = await callBackendApi<{ vehicle?: unknown }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(input.companyId.trim())}/vehicles/${encodeURIComponent(input.vehicleId.trim())}`,
      method: "PATCH",
      body: patch,
    });
    const vehicles = parseCompanyVehicleItems([response.data?.vehicle]);
    const vehicle = vehicles[0];
    if (!vehicle) {
      throw new Error("UPDATE_COMPANY_VEHICLE_RESPONSE_INVALID");
    }
    return vehicle;
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function deleteCompanyVehicleForCompany(input: {
  companyId: string;
  vehicleId: string;
}): Promise<void> {
  try {
    await callBackendApi({
      baseUrl: requireBackendApiBaseUrl(),
      path: `/api/companies/${encodeURIComponent(input.companyId.trim())}/vehicles/${encodeURIComponent(input.vehicleId.trim())}`,
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}
