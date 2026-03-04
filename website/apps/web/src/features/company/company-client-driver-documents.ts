"use client";

import { httpsCallable } from "firebase/functions";

import { getFirebaseClientFunctions } from "@/lib/firebase/client";

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
  const functions = getFirebaseClientFunctions();
  if (!functions) throw new Error("FIREBASE_CONFIG_MISSING");
  const callable = httpsCallable<
    { companyId: string; driverId?: string },
    ApiOk<{ items?: unknown[] }>
  >(functions, "listDriverDocuments");
  try {
    const response = await callable(input);
    return parseDriverDocumentSummaries(response.data?.data?.items ?? []);
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
  const functions = getFirebaseClientFunctions();
  if (!functions) throw new Error("FIREBASE_CONFIG_MISSING");
  const callable = httpsCallable<typeof input, ApiOk<{
    driverId?: string;
    docType?: string;
    status?: string;
    updatedAt?: string;
  }>>(functions, "upsertDriverDocument");
  try {
    const response = await callable(input);
    const data = response.data?.data ?? {};
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
  const functions = getFirebaseClientFunctions();
  if (!functions) throw new Error("FIREBASE_CONFIG_MISSING");
  const callable = httpsCallable<typeof input, ApiOk<unknown>>(functions, "deleteDriverDocument");
  try {
    await callable(input);
  } catch (error) {
    throw new Error(toFriendlyErrorMessage(error));
  }
}
