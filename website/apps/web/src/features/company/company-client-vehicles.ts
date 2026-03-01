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

  const callable = httpsCallable<{ companyId: string; limit?: number }, ApiOk<{ vehicles?: unknown }>>(
    functions,
    "listCompanyVehicles",
  );

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      limit: input.limit,
    });
    return parseCompanyVehicleItems(response.data?.data?.vehicles);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function createCompanyVehicleForCompany(input: {
  companyId: string;
  plate: string;
  label?: string;
  capacity?: number;
}): Promise<CompanyVehicleItem> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    { companyId: string; plate: string; label?: string; capacity?: number },
    ApiOk<{ vehicle?: unknown }>
  >(functions, "createCompanyVehicle");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      plate: input.plate.trim(),
      label: input.label?.trim(),
      capacity: input.capacity,
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
  label?: string | null;
  capacity?: number | null;
  isActive?: boolean;
}): Promise<CompanyVehicleItem> {
  const functions = getFirebaseClientFunctions();
  if (!functions) {
    throw new Error("FIREBASE_CONFIG_MISSING");
  }

  const callable = httpsCallable<
    {
      companyId: string;
      vehicleId: string;
      plate?: string;
      label?: string | null;
      capacity?: number | null;
      isActive?: boolean;
    },
    ApiOk<{ vehicle?: unknown }>
  >(functions, "updateCompanyVehicle");

  try {
    const response = await callable({
      companyId: input.companyId.trim(),
      vehicleId: input.vehicleId.trim(),
      plate: input.plate?.trim(),
      label: input.label,
      capacity: input.capacity,
      isActive: input.isActive,
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
