"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { getFirebaseClientStorage } from "@/lib/firebase/client";

interface CmsImageUploaderProps {
  /** Firebase Storage içindeki hedef yol (ör. "site_media/hero") */
  storagePath: string;
  /** Mevcut URL */
  value: string;
  /** URL değiştiğinde */
  onChange: (url: string) => void;
  /** Maks dosya boyutu (byte) — varsayılan 5 MB */
  maxSize?: number;
  /** Kabul edilen MIME türleri */
  accept?: string;
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
      setError("Yalnızca görsel dosyalar yüklenebilir.");
      return;
    }
    if (file.size > maxSize) {
      setError(`Dosya boyutu ${(maxSize / 1024 / 1024).toFixed(0)} MB'ı aşamaz.`);
      return;
    }

    const storage = getFirebaseClientStorage();
    if (!storage) {
      setError("Storage bağlantısı kurulamadı.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const fileRef = storageRef(storage, `${storagePath}.${ext}`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);
      onChange(url);
    } catch {
      setError("Yükleme başarısız oldu.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleRemove() {
    if (!value) return;
    const storage = getFirebaseClientStorage();
    if (storage) {
      try {
        // URL'den ref çıkarmaya çalış — hata olursa yoksay
        const path = decodeURIComponent(value.split("/o/")[1]?.split("?")[0] ?? "");
        if (path) await deleteObject(storageRef(storage, path));
      } catch {
        // Silme hatası önemli değil, referansı temizle
      }
    }
    onChange("");
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">Görsel</label>

      {value ? (
        /* Preview */
        <div className="relative inline-block rounded-xl border border-slate-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Önizleme" className="h-32 w-auto object-contain" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-500 hover:text-rose-600 shadow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
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
              <span className="mt-2 text-xs text-slate-500">
                Sürükle & bırak veya tıkla
              </span>
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

      {error && (
        <p className="mt-1.5 text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
}
