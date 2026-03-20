import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { HttpError } from "./http.js";
import { asRecord } from "./runtime-value.js";

const DEFAULT_PUBLIC_CACHE_TTL_MS = 60_000;
const DEFAULT_CONFIG_RELATIVE_PATH = "platform-config/landing-page.json";

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

function resolveStorageRoot() {
  return path.resolve(
    process.env.UPLOAD_STORAGE_ROOT?.trim() || path.join(process.cwd(), "data", "uploads"),
  );
}

function resolveLandingConfigPath() {
  return path.join(resolveStorageRoot(), DEFAULT_CONFIG_RELATIVE_PATH);
}

async function readStoredLandingConfigRecord() {
  try {
    const raw = await readFile(resolveLandingConfigPath(), "utf8");
    const parsed = JSON.parse(raw);
    return asRecord(parsed);
  } catch {
    return null;
  }
}

async function writeStoredLandingConfigRecord(record) {
  const targetPath = resolveLandingConfigPath();
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify(record, null, 2), "utf8");
}

export async function getPublicLandingConfig() {
  const cacheTtlMs = getPublicCacheTtlMs();
  const now = Date.now();
  if (publicLandingConfigCache && publicLandingConfigCacheExpiresAt > now) {
    return publicLandingConfigCache;
  }

  const storedRecord = await readStoredLandingConfigRecord();
  const result = storedRecord
    ? {
        exists: true,
        config: stripInternalFields(storedRecord),
      }
    : {
        exists: false,
        config: null,
      };

  publicLandingConfigCache = result;
  publicLandingConfigCacheExpiresAt = now + cacheTtlMs;
  return result;
}

export async function getPlatformLandingConfig() {
  const storedRecord = await readStoredLandingConfigRecord();
  if (!storedRecord) {
    return {
      exists: false,
      config: null,
      updatedAt: null,
      updatedBy: null,
    };
  }

  const config = stripInternalFields(storedRecord);
  return {
    exists: true,
    config,
    updatedAt: typeof storedRecord.updatedAt === "string" ? storedRecord.updatedAt : null,
    updatedBy: typeof storedRecord.updatedBy === "string" ? storedRecord.updatedBy : null,
  };
}

export async function updatePlatformLandingConfig(_db, authUid, input) {
  const config = asRecord(input?.config);
  if (!config) {
    throw new HttpError(400, "invalid-argument", "config alani zorunludur.");
  }

  const previousRecord = (await readStoredLandingConfigRecord()) ?? {};
  const nextRecord = {
    ...stripInternalFields(previousRecord),
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: authUid,
  };

  await writeStoredLandingConfigRecord(nextRecord);

  publicLandingConfigCache = null;
  publicLandingConfigCacheExpiresAt = 0;

  return { success: true };
}
