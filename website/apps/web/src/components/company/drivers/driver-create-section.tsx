"use client";

import { useEffect, useRef, useState } from "react";

import { DRIVER_NAME_MAX_LENGTH, normalizePlateInput } from "./driver-ui-helpers";

type Props = {
  canCreate: boolean;
  actionKey: string | null;
  onCreateDriver: (input: {
    name: string;
    phone?: string;
    plate?: string;
  }) => Promise<void>;
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50";

export function DriverCreateSection({ canCreate, actionKey, onCreateDriver }: Props) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const normalizedName = name.trim();
  const normalizedPhone = phone.trim();
  const normalizedPlate = plate.trim() ? normalizePlateInput(plate) : "";

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const validationIssues: string[] = [];
  if (normalizedName.length < 2) {
    validationIssues.push("Ad soyad en az 2 karakter olmalı.");
  }
  if (normalizedName.length > DRIVER_NAME_MAX_LENGTH) {
    validationIssues.push("Ad soyad en fazla 80 karakter olabilir.");
  }
  if (normalizedPhone.length > 0 && normalizedPhone.length < 7) {
    validationIssues.push("Telefon numarası en az 7 karakter olmalı.");
  }

  const isCreating = actionKey === "create_driver_account";
  const canSubmit = canCreate && !isCreating;

  const resetForm = () => {
    setName("");
    setPhone("");
    setPlate("");
    setShowValidation(false);
  };

  const handleSubmit = async () => {
    if (!canCreate) {
      return;
    }

    if (validationIssues.length > 0) {
      setShowValidation(true);
      return;
    }

    await onCreateDriver({
      name: normalizedName,
      phone: normalizedPhone || undefined,
      plate: normalizedPlate || undefined,
    });

    resetForm();
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
  };

  if (!canCreate) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">Şoför ekleme</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Şoför ekle</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Ad soyad girmen yeterli. Telefon ve plaka istersen aynı anda eklenir. Mobil giriş bilgileri otomatik oluşur,
          rota ataması ise daha sonra yapılır.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]">
        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ad Soyad *</span>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setShowValidation(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="Örnek: Ahmet Yılmaz"
            className={inputClassName}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Telefon</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setShowValidation(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="+90 5xx xxx xx xx"
            className={inputClassName}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Plaka</span>
          <input
            type="text"
            value={plate}
            onChange={(event) => {
              setPlate(normalizePlateInput(event.target.value));
              setShowValidation(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="34ABC123"
            className={inputClassName}
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Ekleniyor...
              </>
            ) : (
              "Şoförü ekle"
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">Enter ile kaydet</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">Telefon isteğe bağlı</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">Mobil giriş otomatik oluşur</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">Rota ataması sonra yapılır</span>
      </div>

      {showValidation && validationIssues.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {validationIssues.map((issue) => (
            <div key={issue}>{issue}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
