"use client";

import { callFirebaseCallable } from "@/lib/firebase/callable";
import type {
  DynamicRoutePreviewResponse,
  GenerateRouteShareLinkResponse,
} from "@/features/company/company-types";

type UnknownRecord = Record<string, unknown>;

function contractError(callableName: string, detail: string): never {
  throw new Error(`CONTRACT_MISMATCH:${callableName}:${detail}`);
}

function asRecord(value: unknown, callableName: string, field: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    contractError(callableName, `${field} must be object`);
  }
  return value as UnknownRecord;
}

function asString(
  record: UnknownRecord,
  key: string,
  callableName: string,
  opts: { allowNull?: boolean } = {},
): string | null {
  const value = record[key];
  if (value === null && opts.allowNull) return null;
  if (typeof value !== "string" || value.trim().length === 0) {
    contractError(callableName, `${key} must be non-empty string`);
  }
  return value;
}

function asBoolean(record: UnknownRecord, key: string, callableName: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    contractError(callableName, `${key} must be boolean`);
  }
  return value;
}

function ensureGenerateRouteShareLinkResponse(
  value: unknown,
  callableName: string,
): GenerateRouteShareLinkResponse {
  const record = asRecord(value, callableName, "response");
  return {
    routeId: asString(record, "routeId", callableName) as string,
    srvCode: asString(record, "srvCode", callableName) as string,
    landingUrl: asString(record, "landingUrl", callableName) as string,
    signedLandingUrl: asString(record, "signedLandingUrl", callableName) as string,
    previewToken: asString(record, "previewToken", callableName) as string,
    previewTokenExpiresAt: asString(record, "previewTokenExpiresAt", callableName) as string,
    whatsappUrl: asString(record, "whatsappUrl", callableName) as string,
    systemShareText: asString(record, "systemShareText", callableName) as string,
  };
}

function ensureDynamicRoutePreviewResponse(
  value: unknown,
  callableName: string,
): DynamicRoutePreviewResponse {
  const record = asRecord(value, callableName, "response");
  const timeSlot = asString(record, "timeSlot", callableName, { allowNull: true });
  if (
    timeSlot !== null &&
    timeSlot !== "morning" &&
    timeSlot !== "evening" &&
    timeSlot !== "midday" &&
    timeSlot !== "custom"
  ) {
    contractError(callableName, "timeSlot has invalid enum value");
  }
  return {
    routeId: asString(record, "routeId", callableName) as string,
    srvCode: asString(record, "srvCode", callableName) as string,
    routeName: asString(record, "routeName", callableName) as string,
    driverDisplayName: asString(record, "driverDisplayName", callableName) as string,
    scheduledTime: asString(record, "scheduledTime", callableName, { allowNull: true }),
    timeSlot: timeSlot as DynamicRoutePreviewResponse["timeSlot"],
    allowGuestTracking: asBoolean(record, "allowGuestTracking", callableName),
    deepLinkUrl: asString(record, "deepLinkUrl", callableName) as string,
  };
}

export async function generateRouteShareLinkCallable(input: {
  routeId: string;
  customText?: string;
}): Promise<GenerateRouteShareLinkResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "generateRouteShareLink",
    input,
  );
  return ensureGenerateRouteShareLinkResponse(envelope.data, "generateRouteShareLink");
}

export async function getDynamicRoutePreviewCallable(input: {
  srvCode: string;
  token: string;
}): Promise<DynamicRoutePreviewResponse> {
  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "getDynamicRoutePreview",
    input,
  );
  return ensureDynamicRoutePreviewResponse(envelope.data, "getDynamicRoutePreview");
}
