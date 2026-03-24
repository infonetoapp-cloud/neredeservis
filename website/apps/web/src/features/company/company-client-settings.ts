"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

import {
  asRecord,
  readString,
  toFriendlyErrorMessage,
} from "./company-client-shared";

export type CompanyProfile = {
  companyId: string;
  name: string;
  logoUrl: string | null;
  status: string;
  vehicleLimit: number;
  createdAt: string | null;
};

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

type BackendUploadEnvelope<T> = {
  data?: T;
  error?: {
    message?: string;
  };
};

export type CompanyLogoUploadResult = {
  logoUrl: string;
  profileUpdated: boolean;
  updatedAt: string | null;
};

async function callBackendUploadApi<T>(input: {
  path: string;
  method: "PUT" | "DELETE";
  body?: BodyInit;
  contentType?: string;
}): Promise<T> {
  const requestUrl = new URL(
    input.path,
    requireBackendApiBaseUrl().endsWith("/") ? requireBackendApiBaseUrl() : `${requireBackendApiBaseUrl()}/`,
  );
  const response = await fetch(requestUrl.toString(), {
    method: input.method,
    credentials: "include",
    headers: {
      ...(input.contentType ? { "content-type": input.contentType } : {}),
    },
    ...(input.body !== undefined ? { body: input.body } : {}),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as BackendUploadEnvelope<T> | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Beklenmeyen bir API hatasi olustu.");
  }

  return (payload?.data as T | undefined) as T;
}

export async function getCompanyProfileForCompany(input: {
  companyId: string;
}): Promise<CompanyProfile> {
  try {
    const response = await callBackendApi<CompanyProfile>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `api/companies/${encodeURIComponent(input.companyId)}/profile`,
    });
    return parseCompanyProfile(response.data);
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
    const response = await callBackendApi<{
      changedFields?: string[];
      updatedAt?: string;
    }>({
      baseUrl: requireBackendApiBaseUrl(),
      path: `api/companies/${encodeURIComponent(input.companyId)}/profile`,
      method: "PATCH",
      body: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      },
    });

    return {
      changedFields: Array.isArray(response.data?.changedFields)
        ? response.data.changedFields
        : [],
      updatedAt: readString(asRecord(response.data)?.updatedAt) ?? new Date().toISOString(),
    };
  } catch (error: unknown) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function uploadCompanyLogo(
  companyId: string,
  file: File,
): Promise<CompanyLogoUploadResult> {
  const data = await callBackendUploadApi<{
    logoUrl?: string;
    updatedAt?: string;
  }>({
    path: `api/companies/${encodeURIComponent(companyId)}/logo`,
    method: "PUT",
    body: file,
    contentType: file.type,
  });
  const logoUrl = readString(asRecord(data)?.logoUrl);
  if (!logoUrl) {
    throw new Error("COMPANY_LOGO_UPLOAD_RESPONSE_INVALID");
  }
  return {
    logoUrl,
    profileUpdated: true,
    updatedAt: readString(asRecord(data)?.updatedAt),
  };
}

export async function removeCompanyLogo(companyId: string): Promise<{ profileUpdated: boolean; updatedAt: string | null }> {
  const data = await callBackendUploadApi<{
    updatedAt?: string;
  }>({
    path: `api/companies/${encodeURIComponent(companyId)}/logo`,
    method: "DELETE",
  });
  return {
    profileUpdated: true,
    updatedAt: readString(asRecord(data)?.updatedAt),
  };
}
