import { mkdir, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { HttpError, readBufferBody } from "./http.js";

const MAX_PLATFORM_MEDIA_BYTES = 5 * 1024 * 1024;
const CONTENT_TYPE_TO_EXTENSION = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
]);
const EXTENSION_TO_CONTENT_TYPE = new Map(
  Array.from(CONTENT_TYPE_TO_EXTENSION.entries()).map(([contentType, extension]) => [
    extension,
    contentType,
  ]),
);
const STORAGE_SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function normalizeStoragePath(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "storagePath gecersiz.");
  }

  const normalized = rawValue.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0 || segments[0] !== "site_media") {
    throw new HttpError(400, "invalid-argument", "storagePath gecersiz.");
  }
  if (!segments.every((segment) => STORAGE_SEGMENT_RE.test(segment))) {
    throw new HttpError(400, "invalid-argument", "storagePath gecersiz.");
  }

  return segments.join("/");
}

function readUploadContentType(request) {
  const rawHeader = request.headers["content-type"];
  const contentType =
    typeof rawHeader === "string" ? rawHeader.split(";")[0]?.trim().toLowerCase() : "";
  const extension = CONTENT_TYPE_TO_EXTENSION.get(contentType ?? "");
  if (!extension) {
    throw new HttpError(
      400,
      "invalid-argument",
      "Yalnizca PNG, JPEG, WebP veya SVG dosyalari kabul edilir.",
    );
  }

  return { contentType, extension };
}

function resolveUploadStorageRoot() {
  return path.resolve(
    process.env.UPLOAD_STORAGE_ROOT?.trim() || path.join(process.cwd(), "data", "uploads"),
  );
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

function resolveMediaFilePath(relativePath) {
  return path.join(resolveUploadStorageRoot(), ...relativePath.split("/"));
}

function buildPlatformAssetRelativePath(storagePath, extension) {
  return `platform-assets/${storagePath}.${extension}`;
}

async function cleanupPlatformAssetVariants(storagePath, keepFileNameRaw = null) {
  const parsedPath = path.posix.parse(storagePath);
  const relativeDirectory = parsedPath.dir
    ? `platform-assets/${parsedPath.dir}`
    : "platform-assets";
  const absoluteDirectory = resolveMediaFilePath(relativeDirectory);
  const targetBaseName = parsedPath.base;
  const keepFileName =
    typeof keepFileNameRaw === "string" && keepFileNameRaw.trim().length > 0
      ? keepFileNameRaw.trim()
      : null;

  let fileNames = [];
  try {
    fileNames = await readdir(absoluteDirectory);
  } catch {
    return;
  }

  await Promise.all(
    fileNames
      .filter(
        (fileName) =>
          (fileName === targetBaseName || fileName.startsWith(`${targetBaseName}.`)) &&
          fileName !== keepFileName,
      )
      .map((fileName) => unlink(path.join(absoluteDirectory, fileName)).catch(() => {})),
  );
}

function parsePublicAssetPath(assetPathRaw) {
  if (typeof assetPathRaw !== "string") {
    throw new HttpError(400, "invalid-argument", "Medya yolu gecersiz.");
  }

  const normalized = assetPathRaw.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const parsedPath = path.posix.parse(normalized);
  const segments = parsedPath.dir ? parsedPath.dir.split("/").filter(Boolean) : [];
  if (!segments.every((segment) => STORAGE_SEGMENT_RE.test(segment))) {
    throw new HttpError(400, "invalid-argument", "Medya yolu gecersiz.");
  }
  if (!STORAGE_SEGMENT_RE.test(parsedPath.name)) {
    throw new HttpError(400, "invalid-argument", "Medya yolu gecersiz.");
  }

  const extension = parsedPath.ext.replace(/^\./, "").toLowerCase();
  if (!EXTENSION_TO_CONTENT_TYPE.has(extension)) {
    throw new HttpError(404, "not-found", "Medya dosyasi bulunamadi.");
  }

  return {
    relativePath: `platform-assets/${segments.length > 0 ? `${segments.join("/")}/` : ""}${parsedPath.name}.${extension}`,
    contentType: EXTENSION_TO_CONTENT_TYPE.get(extension),
  };
}

export async function storePlatformMediaFromRequest(request, storagePathRaw) {
  const storagePath = normalizeStoragePath(storagePathRaw);
  const { extension } = readUploadContentType(request);
  const fileBuffer = await readBufferBody(request, { maxBytes: MAX_PLATFORM_MEDIA_BYTES });
  if (fileBuffer.length === 0) {
    throw new HttpError(400, "invalid-argument", "Medya dosyasi bos olamaz.");
  }

  const relativePath = buildPlatformAssetRelativePath(storagePath, extension);
  const absolutePath = resolveMediaFilePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, fileBuffer);
  await cleanupPlatformAssetVariants(storagePath, path.posix.basename(relativePath));

  return {
    url: `${buildPublicBaseUrl(request)}/media/${relativePath}`,
  };
}

export async function removePlatformMedia(storagePathRaw) {
  const storagePath = normalizeStoragePath(storagePathRaw);
  await cleanupPlatformAssetVariants(storagePath);
}

export async function readPlatformMediaAsset(assetPathRaw) {
  const { relativePath, contentType } = parsePublicAssetPath(assetPathRaw);
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

export async function clearAllPlatformMedia() {
  await rm(resolveMediaFilePath("platform-assets"), { recursive: true, force: true });
}
