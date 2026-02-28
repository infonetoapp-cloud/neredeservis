"use client";

import { callFirebaseCallable } from "@/lib/firebase/callable";
import {
  ensureCreateVehicleResponse,
  ensureListCompanyVehiclesResponse,
  ensureUpdateVehicleResponse,
} from "@/features/company/company-callable-contract-guards";
import type {
  CompanyVehicleSummary,
  CreateVehicleResponse,
  UpdateVehicleResponse,
  VehicleStatus,
} from "@/features/company/company-types";

export async function listCompanyVehiclesCallable(input: {
  companyId: string;
  limit?: number;
}): Promise<CompanyVehicleSummary[]> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "listCompanyVehicles",
    input,
  );
  return ensureListCompanyVehiclesResponse(envelope.data, "listCompanyVehicles").items;
}

export async function createVehicleCallable(input: {
  ownerType?: "company";
  companyId: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number | null;
  status?: VehicleStatus;
}): Promise<CreateVehicleResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "createVehicle",
    input,
  );
  return ensureCreateVehicleResponse(envelope.data, "createVehicle");
}

export async function updateVehicleCallable(input: {
  companyId: string;
  vehicleId: string;
  patch: {
    plate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    capacity?: number | null;
    status?: VehicleStatus;
  };
}): Promise<UpdateVehicleResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "updateVehicle",
    input,
  );
  return ensureUpdateVehicleResponse(envelope.data, "updateVehicle");
}
