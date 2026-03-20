"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import type { LandingPageConfig } from "@/components/marketing/landing-config-types";

// ─── Public: self-hosted backend'den landing config oku ───────────────────────

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

/**
 * Landing page config'ini self-hosted backend API'den okur.
 */
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

// ─── Platform: CMS backend wrapper'ları ───────────────────────────────────────

interface GetConfigResponse {
  exists: boolean;
  config: LandingPageConfig | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export async function platformGetLandingConfig(): Promise<GetConfigResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    throw new Error("Backend API baglantisi bulunamadi.");
  }

  const result = await callBackendApi<GetConfigResponse>({
    baseUrl: backendApiBaseUrl,
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
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    throw new Error("Backend API baglantisi bulunamadi.");
  }

  const result = await callBackendApi<SaveConfigResponse>({
    baseUrl: backendApiBaseUrl,
    path: "api/platform/landing-config",
    method: "PATCH",
    body: { config },
  });
  return result.data ?? { success: false };
}
