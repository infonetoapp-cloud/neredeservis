"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { httpsCallable } from "firebase/functions";

import { getFirebaseClientFunctions } from "@/lib/firebase/client";

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
        path: `/api/companies/${encodeURIComponent(companyId)}/vehicles${
          query.size > 0 ? `?${query.toString()}` : ""
        }`,
      });
      return parseCompanyVehicleItems(response.data?.items);
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
    "listCompanyVehicles",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyVehicleItems(response.data?.data?.items);
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      plate: string;
      ownerType?: "company";
      label?: string;
      brand?: string | null;
      model?: string | null;
      year?: number | null;
      capacity?: number;
      status?: "active" | "maintenance" | "inactive";
    },
    ApiOk<{ vehicle?: unknown }>
  >(functions, "createVehicle");

  try {
    const payload: {
      companyId: string;
      plate: string;
      ownerType?: "company";
      label?: string;
      brand?: string;
      model?: string;
      year?: number | null;
      capacity?: number;
      status?: "active" | "maintenance" | "inactive";
    } = {
      companyId: input.companyId.trim(),
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

    const response = await callable(payload);
    const vehicles = parseCompanyVehicleItems([response.data?.data?.vehicle]);
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      vehicleId: string;
      patch: {
        plate?: string;
        brand?: string | null;
        model?: string | null;
        year?: number | null;
        capacity?: number | null;
        status?: "active" | "maintenance" | "inactive";
      };
    },
    ApiOk<{ vehicle?: unknown }>
  >(functions, "updateVehicle");

  try {
    const patch: Record<string, unknown> = {};
    if (input.plate !== undefined) patch.plate = input.plate.trim();
    if (input.brand !== undefined) patch.brand = input.brand;
    if (input.model !== undefined) patch.model = input.model;
    if (input.year !== undefined) patch.year = input.year;
    if (input.capacity !== undefined) patch.capacity = input.capacity;
    if (input.status !== undefined) patch.status = input.status;

    const response = await callable({
      companyId: input.companyId.trim(),
      vehicleId: input.vehicleId.trim(),
      patch,
    });
    const vehicles = parseCompanyVehicleItems([response.data?.data?.vehicle]);
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
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      vehicleId: string;
    },
    ApiOk<{ deleted?: boolean }>
  >(functions, "deleteVehicle");

  try {
    await callable({
      companyId: input.companyId.trim(),
      vehicleId: input.vehicleId.trim(),
    });
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}
