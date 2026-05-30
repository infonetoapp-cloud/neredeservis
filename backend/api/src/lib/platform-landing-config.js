import { FieldValue } from "firebase-admin/firestore";

import { HttpError } from "./http.js";
import { asRecord } from "./runtime-value.js";

const DOC_PATH = "site_config/landing_page";
const DEFAULT_PUBLIC_CACHE_TTL_MS = 60_000;

let publicLandingConfigCache = null;
let publicLandingConfigCacheExpiresAt = 0;

function getPublicCacheTtlMs() {
  const rawValue = Number.parseInt(process.env.PUBLIC_LANDING_CONFIG_CACHE_TTL_MS ?? "", 10);
  if (!Number.isFinite(rawValue)) {
    return DEFAULT_PUBLIC_CACHE_TTL_MS;
  }
  return Math.max(0, rawValue);
}

function stripInternalFields(data) {
  const record = asRecord(data) ?? {};
  const { updatedAt, updatedBy, version, ...config } = record;
  return config;
}

async function readLandingConfigDoc(db) {
  return db.doc(DOC_PATH).get();
}

export async function getPublicLandingConfig(db) {
  const cacheTtlMs = getPublicCacheTtlMs();
  const now = Date.now();
  if (publicLandingConfigCache && publicLandingConfigCacheExpiresAt > now) {
    return publicLandingConfigCache;
  }

  const snapshot = await readLandingConfigDoc(db);
  const result = snapshot.exists
    ? {
        exists: true,
        config: stripInternalFields(snapshot.data()),
      }
    : {
        exists: false,
        config: null,
      };

  publicLandingConfigCache = result;
  publicLandingConfigCacheExpiresAt = now + cacheTtlMs;
  return result;
}

export async function getPlatformLandingConfig(db) {
  const snapshot = await readLandingConfigDoc(db);
  if (!snapshot.exists) {
    return {
      exists: false,
      config: null,
      updatedAt: null,
      updatedBy: null,
    };
  }

  const record = asRecord(snapshot.data()) ?? {};
  const config = stripInternalFields(record);
  return {
    exists: true,
    config,
    updatedAt:
      typeof record.updatedAt?.toDate === "function" ? record.updatedAt.toDate().toISOString() : null,
    updatedBy: typeof record.updatedBy === "string" ? record.updatedBy : null,
  };
}

export async function updatePlatformLandingConfig(db, authUid, input) {
  const config = asRecord(input?.config);
  if (!config) {
    throw new HttpError(400, "invalid-argument", "config alani zorunludur.");
  }

  await db.doc(DOC_PATH).set(
    {
      ...config,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: authUid,
    },
    { merge: true },
  );

  publicLandingConfigCache = null;
  publicLandingConfigCacheExpiresAt = 0;

  return { success: true };
}
