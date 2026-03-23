import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { HttpError, readBufferBody } from "./http.js";

const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
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
const UID_SEGMENT_RE = /^[A-Za-z0-9_-]{1,128}$/;

function normalizeUid(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }

  const normalized = rawValue.trim();
  if (!UID_SEGMENT_RE.test(normalized)) {
    throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
  }

  return normalized;
}

function readUploadContentType(request) {
  const rawHeader = request.headers["content-type"];
  const contentType = typeof rawHeader === "string" ? rawHeader.split(";")[0]?.trim().toLowerCase() : "";
  const extension = CONTENT_TYPE_TO_EXTENSION.get(contentType ?? "");
  if (!extension) {
    throw new HttpError(
      400,
      "invalid-argument",
      "Yalnizca PNG, JPEG veya WebP profil fotografi dosyalari kabul edilir.",
    );
  }

  return { extension };
}

function resolveUploadStorageRoot() {
  return path.resolve(
    process.env.UPLOAD_STORAGE_ROOT?.trim() || path.join(process.cwd(), "data", "uploads"),
  );
}

function buildProfilePhotoRelativePath(uid, fileName) {
  return `profile-photos/${uid}/${fileName}`;
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

async function clearProfilePhotoDirectory(uid) {
  const directoryPath = resolveMediaFilePath(`profile-photos/${uid}`);
  await rm(directoryPath, { recursive: true, force: true });
}

export async function storeProfilePhotoFromRequest(request, uidRaw) {
  const uid = normalizeUid(uidRaw);
  const { extension } = readUploadContentType(request);
  const fileBuffer = await readBufferBody(request, { maxBytes: MAX_PROFILE_PHOTO_BYTES });
  if (fileBuffer.length === 0) {
    throw new HttpError(400, "invalid-argument", "Profil fotografi dosyasi bos olamaz.");
  }

  const fileName = `photo-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const relativePath = buildProfilePhotoRelativePath(uid, fileName);
  const absolutePath = resolveMediaFilePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, fileBuffer);

  return {
    fileName,
    relativePath,
    publicUrl: `${buildPublicBaseUrl(request)}/media/${relativePath}`,
    bytesUploaded: fileBuffer.length,
  };
}

export async function cleanupStoredProfilePhotos(uidRaw, keepFileNameRaw) {
  const uid = normalizeUid(uidRaw);
  const keepFileName = typeof keepFileNameRaw === "string" ? path.basename(keepFileNameRaw.trim()) : null;
  const directoryPath = resolveMediaFilePath(`profile-photos/${uid}`);

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

export async function removeStoredProfilePhotoFile(relativePathRaw) {
  if (typeof relativePathRaw !== "string" || relativePathRaw.trim().length === 0) {
    return;
  }

  const relativePath = relativePathRaw.trim().replace(/\\/g, "/");
  if (!relativePath.startsWith("profile-photos/")) {
    return;
  }

  const absolutePath = resolveMediaFilePath(relativePath);
  await unlink(absolutePath).catch(() => {});
}

export async function readProfilePhotoMedia(uidRaw, fileNameRaw) {
  const uid = normalizeUid(uidRaw);
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

  const relativePath = buildProfilePhotoRelativePath(uid, fileName);
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

export async function removeAllStoredProfilePhotos(uidRaw) {
  const uid = normalizeUid(uidRaw);
  await clearProfilePhotoDirectory(uid);
}
