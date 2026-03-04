"use client";

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
      label?: string;
      brand?: string | null;
      model?: string | null;
      year?: number | null;
      capacity?: number;
      status?: "active" | "maintenance" | "inactive";
    },
    ApiOk<{ vehicle?: unknown }>
  >(functions, "createCompanyVehicle");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      plate: input.plate.trim(),
      label: input.label?.trim(),
      brand: input.brand?.trim() || undefined,
      model: input.model?.trim() || undefined,
      year: input.year ?? undefined,
      capacity: input.capacity,
      status: input.status,
    });
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
  >(functions, "updateCompanyVehicle");

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
