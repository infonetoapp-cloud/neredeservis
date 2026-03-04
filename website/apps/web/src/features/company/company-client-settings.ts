"use client";

import { httpsCallable } from "firebase/functions";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  getFirebaseClientFunctions,
  getFirebaseClientStorage,
} from "@/lib/firebase/client";

import {
  type ApiOk,
  asRecord,
  readString,
  toFriendlyErrorMessage,
} from "./company-client-shared";

/* ─── Types ─── */

export type CompanyProfile = {
  companyId: string;
  name: string;
  logoUrl: string | null;
  status: string;
  vehicleLimit: number;
  createdAt: string | null;
};

/* ─── Parsers ─── */

function parseCompanyProfile(value: unknown): CompanyProfile {
  const raw = asRecord(value);
  if (!raw) {
    return {
      companyId: "",
      name: "",
      logoUrl: null,
      status: "active",
      vehicleLimit: 10,
      createdAt: null,
    };
  }
  return {
    companyId: readString(raw.companyId) ?? "",
    name: readString(raw.name) ?? "",
    logoUrl: readString(raw.logoUrl) ?? null,
    status: readString(raw.status) ?? "active",
    vehicleLimit:
      typeof raw.vehicleLimit === "number" && Number.isFinite(raw.vehicleLimit)
        ? raw.vehicleLimit
        : 10,
    createdAt: readString(raw.createdAt),
  };
}

/* ─── API ─── */

export async function getCompanyProfileForCompany(input: {
  companyId: string;
}): Promise<CompanyProfile> {
  try {
    const functions = getFirebaseClientFunctions();
    if (!functions) throw new Error("Firebase başlatılamadı.");
    const fn = httpsCallable(functions, "getCompanyProfile");
    const response = await fn({ companyId: input.companyId });
    const payload = asRecord(response.data);
    const data = asRecord(payload?.data);
    return parseCompanyProfile(data);
  } catch (error: unknown) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function updateCompanyProfileForCompany(input: {
  companyId: string;
  name?: string;
  logoUrl?: string;
}): Promise<{ changedFields: string[]; updatedAt: string }> {
  try {
    const functions = getFirebaseClientFunctions();
    if (!functions) throw new Error("Firebase başlatılamadı.");
    const fn = httpsCallable(functions, "updateCompanyProfile");
    const response = await fn(input);
    const payload = asRecord(response.data);
    const data = asRecord(payload?.data);
    return {
      changedFields: Array.isArray(data?.changedFields)
        ? (data.changedFields as string[])
        : [],
      updatedAt: readString(data?.updatedAt) ?? new Date().toISOString(),
    };
  } catch (error: unknown) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

/* ─── Logo Upload ─── */

export async function uploadCompanyLogo(
  companyId: string,
  file: File,
): Promise<string> {
  const storage = getFirebaseClientStorage();
  if (!storage) throw new Error("Firebase Storage başlatılamadı.");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const storagePath = `company_logos/${companyId}/logo.${ext}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  return getDownloadURL(storageRef);
}
