import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { HttpError, readBufferBody } from "./http.js";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const CONTENT_TYPE_TO_EXTENSION = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);
const EXTENSION_TO_CONTENT_TYPE = new Map(
  Array.from(CONTENT_TYPE_TO_EXTENSION.entries()).map(([contentType, extension]) => [
    extension,
    contentType,
  ]),
);

function normalizeCompanyId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  const companyId = rawValue.trim();
  if (!companyId || companyId.length > 128) {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  return companyId;
}

function readUploadContentType(request) {
  const rawHeader = request.headers["content-type"];
  const contentType = typeof rawHeader === "string" ? rawHeader.split(";")[0]?.trim().toLowerCase() : "";
  const extension = CONTENT_TYPE_TO_EXTENSION.get(contentType ?? "");
  if (!extension) {
    throw new HttpError(
      400,
      "invalid-argument",
      "Yalnizca PNG, JPEG veya WebP logo dosyalari kabul edilir.",
    );
  }

  return { contentType, extension };
}

function resolveUploadStorageRoot() {
  return path.resolve(
    process.env.UPLOAD_STORAGE_ROOT?.trim() || path.join(process.cwd(), "data", "uploads"),
  );
}

function buildCompanyLogoRelativePath(companyId, fileName) {
  return `company-logos/${companyId}/${fileName}`;
}

function resolveMediaFilePath(relativePath) {
  return path.join(resolveUploadStorageRoot(), ...relativePath.split("/"));
}

function buildPublicBaseUrl(request) {
  const fromEnv = process.env.UPLOAD_PUBLIC_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }

  const forwardedProtoHeader = request.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProtoHeader === "string" && forwardedProtoHeader.trim().length > 0
      ? forwardedProtoHeader.split(",")[0].trim()
      : "http";
  const host = request.headers.host?.trim();
  if (!host) {
    throw new HttpError(412, "failed-precondition", "Public upload URL olusturulamadi.");
  }

  return `${protocol}://${host}`;
}

async function clearCompanyLogoDirectory(companyId) {
  const directoryPath = resolveMediaFilePath(`company-logos/${companyId}`);
  await rm(directoryPath, { recursive: true, force: true });
}

export async function storeCompanyLogoFromRequest(request, companyIdRaw) {
  const companyId = normalizeCompanyId(companyIdRaw);
  const { extension } = readUploadContentType(request);
  const fileBuffer = await readBufferBody(request, { maxBytes: MAX_LOGO_BYTES });
  if (fileBuffer.length === 0) {
    throw new HttpError(400, "invalid-argument", "Logo dosyasi bos olamaz.");
  }

  const fileName = `logo-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const relativePath = buildCompanyLogoRelativePath(companyId, fileName);
  const absolutePath = resolveMediaFilePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, fileBuffer);

  return {
    fileName,
    relativePath,
    publicUrl: `${buildPublicBaseUrl(request)}/media/${relativePath}`,
  };
}

export async function removeStoredCompanyLogo(companyIdRaw) {
  const companyId = normalizeCompanyId(companyIdRaw);
  await clearCompanyLogoDirectory(companyId);
}

export async function readCompanyLogoMedia(companyIdRaw, fileNameRaw) {
  const companyId = normalizeCompanyId(companyIdRaw);
  if (typeof fileNameRaw !== "string") {
    throw new HttpError(400, "invalid-argument", "Dosya adi gecersiz.");
  }

  const fileName = path.basename(fileNameRaw.trim());
  if (!fileName || fileName !== fileNameRaw.trim()) {
    throw new HttpError(400, "invalid-argument", "Dosya adi gecersiz.");
  }

  const extension = path.extname(fileName).slice(1).toLowerCase();
  const contentType = EXTENSION_TO_CONTENT_TYPE.get(extension);
  if (!contentType) {
    throw new HttpError(404, "not-found", "Medya dosyasi bulunamadi.");
  }

  const relativePath = buildCompanyLogoRelativePath(companyId, fileName);
  const absolutePath = resolveMediaFilePath(relativePath);

  try {
    const fileBuffer = await readFile(absolutePath);
    return {
      fileBuffer,
      contentType,
      cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
    };
  } catch {
    throw new HttpError(404, "not-found", "Medya dosyasi bulunamadi.");
  }
}

export async function listStoredCompanyLogoFiles(companyIdRaw) {
  const companyId = normalizeCompanyId(companyIdRaw);
  const directoryPath = resolveMediaFilePath(`company-logos/${companyId}`);

  try {
    return await readdir(directoryPath);
  } catch {
    return [];
  }
}

export async function cleanupStoredCompanyLogos(companyIdRaw, keepFileNameRaw) {
  const companyId = normalizeCompanyId(companyIdRaw);
  const keepFileName = typeof keepFileNameRaw === "string" ? path.basename(keepFileNameRaw.trim()) : null;
  const directoryPath = resolveMediaFilePath(`company-logos/${companyId}`);

  let fileNames = [];
  try {
    fileNames = await readdir(directoryPath);
  } catch {
    return;
  }

  await Promise.all(
    fileNames
      .filter((fileName) => fileName !== keepFileName)
      .map((fileName) => unlink(path.join(directoryPath, fileName)).catch(() => {})),
  );
}

export async function removeStoredCompanyLogoFile(relativePathRaw) {
  if (typeof relativePathRaw !== "string" || relativePathRaw.trim().length === 0) {
    return;
  }

  const relativePath = relativePathRaw.trim().replace(/\\/g, "/");
  if (!relativePath.startsWith("company-logos/")) {
    return;
  }

  const absolutePath = resolveMediaFilePath(relativePath);
  await unlink(absolutePath).catch(() => {});
}
