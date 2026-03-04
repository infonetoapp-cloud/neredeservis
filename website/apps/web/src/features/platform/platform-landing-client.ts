"use client";

import { doc, getDoc } from "firebase/firestore";

import { getFirebaseClientFirestore } from "@/lib/firebase/client";
import { callFirebaseCallable } from "@/lib/firebase/callable";
import type { LandingPageConfig } from "@/components/marketing/landing-config-types";

// ─── Public: Firestore'dan landing config oku (auth gereksiz) ─────────────────

const DOC_PATH = "site_config/landing_page";

/**
 * Landing page config'ini Firestore'dan dogrudan okur.
 * Auth gerekmez (rules: allow read: if true).
 * Dönen veride internal alanlar (updatedAt, updatedBy, version) temizlenir.
 */
export async function fetchLandingConfig(): Promise<LandingPageConfig | null> {
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
  const result = await callFirebaseCallable<
    { config: Partial<LandingPageConfig> },
    SaveConfigResponse
  >("platformUpdateLandingConfig", { config });
  return result.data;
}
