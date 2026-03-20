"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { callFirebaseCallable } from "@/lib/firebase/callable";

import {
  type ApiOk,
  asRecord,
  readString,
  toFriendlyErrorMessage,
} from "./company-client-shared";

/* ─── Types ─── */

export type DriverDocType = "ehliyet" | "src" | "psikoteknik" | "saglik";
export type DriverDocStatus = "valid" | "expiring_soon" | "expired" | "not_uploaded";
export type DriverDocOverallStatus = "ok" | "warning" | "blocked" | "missing";

export type DriverDocumentItem = {
  driverId: string;
  docType: DriverDocType;
  issueDate: string | null;
  expiryDate: string | null;
  licenseClass: string | null;
  note: string | null;
  status: DriverDocStatus;
  daysRemaining: number | null;
  uploadedAt: string | null;
  uploadedBy: string | null;
  updatedAt: string | null;
};

export type DriverDocumentSummary = {
  driverId: string;
  driverName: string;
  overallStatus: DriverDocOverallStatus;
  documents: DriverDocumentItem[];
};

/* ─── Parsers ─── */

const DOC_TYPES: DriverDocType[] = ["ehliyet", "src", "psikoteknik", "saglik"];
const DOC_STATUSES: DriverDocStatus[] = ["valid", "expiring_soon", "expired", "not_uploaded"];
const OVERALL_STATUSES: DriverDocOverallStatus[] = ["ok", "warning", "blocked", "missing"];

function readDocType(value: unknown): DriverDocType | null {
  if (typeof value === "string" && DOC_TYPES.includes(value as DriverDocType)) {
    return value as DriverDocType;
  }
  return null;
}

function readDocStatus(value: unknown): DriverDocStatus {
  if (typeof value === "string" && DOC_STATUSES.includes(value as DriverDocStatus)) {
    return value as DriverDocStatus;
  }
  return "not_uploaded";
}

function readOverallStatus(value: unknown): DriverDocOverallStatus {
  if (typeof value === "string" && OVERALL_STATUSES.includes(value as DriverDocOverallStatus)) {
    return value as DriverDocOverallStatus;
  }
  return "missing";
}

function parseDriverDocumentItem(raw: unknown): DriverDocumentItem | null {
  const record = asRecord(raw);
  if (!record) return null;
  const driverId = readString(record.driverId);
  const docType = readDocType(record.docType);
  if (!driverId || !docType) return null;

  const daysRaw = record.daysRemaining;
  const daysRemaining =
    typeof daysRaw === "number" && Number.isFinite(daysRaw) ? Math.trunc(daysRaw) : null;

  return {
    driverId,
    docType,
    issueDate: readString(record.issueDate),
    expiryDate: readString(record.expiryDate),
    licenseClass: readString(record.licenseClass),
    note: readString(record.note),
    status: readDocStatus(record.status),
    daysRemaining,
    uploadedAt: readString(record.uploadedAt),
    uploadedBy: readString(record.uploadedBy),
    updatedAt: readString(record.updatedAt),
  };
}

export function parseDriverDocumentSummaries(value: unknown): DriverDocumentSummary[] {
  if (!Array.isArray(value)) return [];
  const items: DriverDocumentSummary[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) continue;
    const driverId = readString(record.driverId);
    const driverName = readString(record.driverName);
    if (!driverId || !driverName) continue;
    const overallStatus = readOverallStatus(record.overallStatus);
    const rawDocs = Array.isArray(record.documents) ? record.documents : [];
    const documents: DriverDocumentItem[] = [];
    for (const rawDoc of rawDocs) {
      const parsed = parseDriverDocumentItem(rawDoc);
      if (parsed) documents.push(parsed);
    }
    items.push({ driverId, driverName, overallStatus, documents });
  }
  return items;
}

/* ─── API functions ─── */

export async function listDriverDocumentsForCompany(input: {
  companyId: string;
  driverId?: string;
}): Promise<DriverDocumentSummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const query = new URLSearchParams();
      const driverId = input.driverId?.trim();
      if (driverId) {
        query.set("driverId", driverId);
      }
      const response = await callBackendApi<{ items?: unknown[] }>({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/driver-documents${
          query.size > 0 ? `?${query.toString()}` : ""
        }`,
      });
      return parseDriverDocumentSummaries(response.data?.items ?? []);
    } catch (error) {
      throw new Error(toFriendlyErrorMessage(error));
    }
  }

  try {
    const response = await callFirebaseCallable<
      { companyId: string; driverId?: string },
      { items?: unknown[] }
    >("listDriverDocuments", input);
    return parseDriverDocumentSummaries(response.data?.items ?? []);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function upsertDriverDocumentForCompany(input: {
  companyId: string;
  driverId: string;
  docType: DriverDocType;
  issueDate?: string;
  expiryDate?: string;
  licenseClass?: string;
  note?: string;
}): Promise<{ driverId: string; docType: DriverDocType; status: DriverDocStatus; updatedAt: string }> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const driverId = input.driverId.trim();
      const response = await callBackendApi<{
        driverId?: string;
        docType?: string;
        status?: string;
        updatedAt?: string;
      }>({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/drivers/${encodeURIComponent(driverId)}/documents/${encodeURIComponent(input.docType)}`,
        method: "PUT",
        body: {
          ...(input.issueDate !== undefined ? { issueDate: input.issueDate } : {}),
          ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate } : {}),
          ...(input.licenseClass !== undefined ? { licenseClass: input.licenseClass } : {}),
          ...(input.note !== undefined ? { note: input.note } : {}),
        },
      });
      const data = response.data ?? {};
      return {
        driverId: (data.driverId as string) ?? input.driverId,
        docType: (data.docType as DriverDocType) ?? input.docType,
        status: readDocStatus(data.status),
        updatedAt: (data.updatedAt as string) ?? new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(toFriendlyErrorMessage(error));
    }
  }

  try {
    const response = await callFirebaseCallable<
      typeof input,
      {
        driverId?: string;
        docType?: string;
        status?: string;
        updatedAt?: string;
      }
    >("upsertDriverDocument", input);
    const data = response.data ?? {};
    return {
      driverId: (data.driverId as string) ?? input.driverId,
      docType: (data.docType as DriverDocType) ?? input.docType,
      status: readDocStatus(data.status),
      updatedAt: (data.updatedAt as string) ?? new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}

export async function deleteDriverDocumentForCompany(input: {
  companyId: string;
  driverId: string;
  docType: DriverDocType;
}): Promise<void> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    try {
      const companyId = input.companyId.trim();
      const driverId = input.driverId.trim();
      await callBackendApi({
        baseUrl: backendApiBaseUrl,
        path: `/api/companies/${encodeURIComponent(companyId)}/drivers/${encodeURIComponent(driverId)}/documents/${encodeURIComponent(input.docType)}`,
        method: "DELETE",
      });
      return;
    } catch (error) {
      throw new Error(toFriendlyErrorMessage(error));
    }
  }

  try {
    await callFirebaseCallable<typeof input, unknown>("deleteDriverDocument", input);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}
