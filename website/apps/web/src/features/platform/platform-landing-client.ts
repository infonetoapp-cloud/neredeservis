"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl, requireBackendApiBaseUrl } from "@/lib/env/public-env";
import type { LandingPageConfig } from "@/components/marketing/landing-config-types";

type PublicLandingConfigEnvelope<T> = {
  data?: T;
  error?: {
    message?: string;
  };
};

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

async function callPublicLandingConfigApi<T>(input: {
  baseUrl: string;
  path: string;
}): Promise<T> {
  const requestUrl = new URL(input.path, ensureTrailingSlash(input.baseUrl));
  const response = await fetch(requestUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | PublicLandingConfigEnvelope<T>
    | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Beklenmeyen bir API hatasi olustu.");
  }

  return payload?.data as T;
}

export async function fetchLandingConfig(): Promise<LandingPageConfig | null> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    return null;
  }

  const response = await callPublicLandingConfigApi<{
    exists?: boolean;
    config?: LandingPageConfig | null;
  }>({
    baseUrl: backendApiBaseUrl,
    path: "api/public/landing-config",
  });
  return response?.exists ? response.config ?? null : null;
}

interface GetConfigResponse {
  exists: boolean;
  config: LandingPageConfig | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export async function platformGetLandingConfig(): Promise<GetConfigResponse> {
  const result = await callBackendApi<GetConfigResponse>({
    baseUrl: requireBackendApiBaseUrl(),
    path: "api/platform/landing-config",
  });
  return result.data ?? {
    exists: false,
    config: null,
    updatedAt: null,
    updatedBy: null,
  };
}

interface SaveConfigResponse {
  success: boolean;
}

export async function platformSaveLandingConfig(
  config: Partial<LandingPageConfig>,
): Promise<SaveConfigResponse> {
  const result = await callBackendApi<SaveConfigResponse>({
    baseUrl: requireBackendApiBaseUrl(),
    path: "api/platform/landing-config",
    method: "PATCH",
    body: { config },
  });
  return result.data ?? { success: false };
}
