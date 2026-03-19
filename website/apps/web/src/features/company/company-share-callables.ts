"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
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

type BackendErrorPayload = {
  error?: {
    message?: string;
  };
};

async function callPublicBackendRoutePreview<T>(input: {
  baseUrl: string;
  srvCode: string;
  token: string;
}): Promise<T> {
  const requestUrl = new URL(
    `api/public/route-preview/${encodeURIComponent(input.srvCode)}`,
    ensureTrailingSlash(input.baseUrl),
  );
  requestUrl.searchParams.set("token", input.token);

  const response = await fetch(requestUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T }
    | BackendErrorPayload
    | null;

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "Beklenmeyen bir API hatasi olustu.";
    throw new Error(errorMessage);
  }

  const data =
    payload &&
    typeof payload === "object" &&
    "data" in payload
      ? (payload.data as T | undefined)
      : undefined;
  return data as T;
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export async function generateRouteShareLinkCallable(input: {
  routeId: string;
  customText?: string;
}): Promise<GenerateRouteShareLinkResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const routeId = input.routeId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/routes/${encodeURIComponent(routeId)}/share-link`,
      method: "POST",
      body: {
        ...(input.customText !== undefined ? { customText: input.customText } : {}),
      },
    });
    return ensureGenerateRouteShareLinkResponse(envelope.data, "generateRouteShareLink");
  }

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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const data = await callPublicBackendRoutePreview<unknown>({
      baseUrl: backendApiBaseUrl,
      srvCode: input.srvCode.trim().toUpperCase(),
      token: input.token,
    });
    return ensureDynamicRoutePreviewResponse(data, "getDynamicRoutePreview");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "getDynamicRoutePreview",
    input,
  );
  return ensureDynamicRoutePreviewResponse(envelope.data, "getDynamicRoutePreview");
}
