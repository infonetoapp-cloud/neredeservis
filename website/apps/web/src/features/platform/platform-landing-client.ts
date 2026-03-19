"use client";

import { doc, getDoc } from "firebase/firestore";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { getFirebaseClientFirestore } from "@/lib/firebase/client";
import { callFirebaseCallable } from "@/lib/firebase/callable";
import type { LandingPageConfig } from "@/components/marketing/landing-config-types";

// ─── Public: Firestore'dan landing config oku (auth gereksiz) ─────────────────

const DOC_PATH = "site_config/landing_page";

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
 * Landing page config'ini Firestore'dan dogrudan okur.
 * Auth gerekmez (rules: allow read: if true).
 * Dönen veride internal alanlar (updatedAt, updatedBy, version) temizlenir.
 */
export async function fetchLandingConfig(): Promise<LandingPageConfig | null> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const response = await callPublicLandingConfigApi<{
      exists?: boolean;
      config?: LandingPageConfig | null;
    }>({
      baseUrl: backendApiBaseUrl,
      path: "api/public/landing-config",
    });
    return response?.exists ? response.config ?? null : null;
  }

  const db = getFirebaseClientFirestore();
  if (!db) return null;

  const snap = await getDoc(doc(db, DOC_PATH));
  if (!snap.exists()) return null;

  const raw = snap.data();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedAt, updatedBy, version, ...config } = raw;
  return config as LandingPageConfig;
}

// ─── Platform: CMS callable wrapper'ları ──────────────────────────────────────

interface GetConfigResponse {
  exists: boolean;
  config: LandingPageConfig | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export async function platformGetLandingConfig(): Promise<GetConfigResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
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

  const result = await callFirebaseCallable<
    Record<string, never>,
    GetConfigResponse
  >("platformGetLandingConfig", {});
  return result.data;
}

interface SaveConfigResponse {
  success: boolean;
}

export async function platformSaveLandingConfig(
  config: Partial<LandingPageConfig>,
): Promise<SaveConfigResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const result = await callBackendApi<SaveConfigResponse>({
      baseUrl: backendApiBaseUrl,
      path: "api/platform/landing-config",
      method: "PATCH",
      body: { config },
    });
    return result.data ?? { success: false };
  }

  const result = await callFirebaseCallable<
    { config: Partial<LandingPageConfig> },
    SaveConfigResponse
  >("platformUpdateLandingConfig", { config });
  return result.data;
}
