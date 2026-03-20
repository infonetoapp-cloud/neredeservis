"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Loader2, Upload, X } from "lucide-react";

import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

interface CmsImageUploaderProps {
  storagePath: string;
  value: string;
  onChange: (url: string) => void;
  maxSize?: number;
  accept?: string;
}

type PlatformMediaEnvelope<T> = {
  data?: T;
  error?: {
    message?: string;
  };
};

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

async function callPlatformMediaApi<T>(input: {
  storagePath: string;
  method: "PUT" | "DELETE";
  body?: BodyInit;
  contentType?: string;
}): Promise<T> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    throw new Error("Backend API baglantisi bulunamadi.");
  }

  const currentUser = getFirebaseClientAuth()?.currentUser;
  if (!currentUser) {
    throw new Error("Oturum bulunamadi. Tekrar giris yap.");
  }

  const idToken = await currentUser.getIdToken();
  const requestUrl = new URL("api/platform/media", ensureTrailingSlash(backendApiBaseUrl));
  requestUrl.searchParams.set("storagePath", input.storagePath);

  const response = await fetch(requestUrl.toString(), {
    method: input.method,
    headers: {
      authorization: `Bearer ${idToken}`,
      ...(input.contentType ? { "content-type": input.contentType } : {}),
    },
    ...(input.body !== undefined ? { body: input.body } : {}),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as PlatformMediaEnvelope<T> | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Beklenmeyen bir API hatasi olustu.");
  }

  return payload?.data as T;
}

export function CmsImageUploader({
  storagePath,
  value,
  onChange,
  maxSize = 5 * 1024 * 1024,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
}: CmsImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Yalnizca gorsel dosyalar yuklenebilir.");
      return;
    }
    if (file.size > maxSize) {
      setError(`Dosya boyutu ${(maxSize / 1024 / 1024).toFixed(0)} MB'i asamaz.`);
      return;
    }

    setUploading(true);
    try {
      const backendApiBaseUrl = getBackendApiBaseUrl();
      if (!backendApiBaseUrl) {
        setError("Backend API baglantisi kurulamadi.");
        return;
      }

      const result = await callPlatformMediaApi<{ url?: string }>({
        storagePath,
        method: "PUT",
        body: file,
        contentType: file.type,
      });
      if (!result?.url) {
        throw new Error("PLATFORM_MEDIA_UPLOAD_RESPONSE_INVALID");
      }
      onChange(result.url);
    } catch {
      setError("Yukleme basarisiz oldu.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  async function handleRemove() {
    if (!value) {
      return;
    }

    const backendApiBaseUrl = getBackendApiBaseUrl();
    if (!backendApiBaseUrl) {
      onChange("");
      return;
    }

    try {
      await callPlatformMediaApi<{ success?: boolean }>({
        storagePath,
        method: "DELETE",
      });
    } catch {
      // Best-effort cleanup; still clear the form value.
    }
    onChange("");
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">Gorsel</label>

      {value ? (
        <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Onizleme" className="h-32 w-auto object-contain" />
          <button
            type="button"
            onClick={() => {
              void handleRemove();
            }}
            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-500 shadow hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
            dragOver
              ? "border-teal-400 bg-teal-50"
              : "border-slate-200 bg-slate-50 hover:border-teal-300"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="mt-2 text-xs text-slate-500">Surukle ve birak veya tikla</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {error ? <p className="mt-1.5 text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
