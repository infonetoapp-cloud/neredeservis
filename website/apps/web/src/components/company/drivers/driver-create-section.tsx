"use client";

import { useState } from "react";

import type { CompanyDriverCredentialBundle } from "@/features/company/company-client-shared";

import {
  DRIVER_NAME_MAX_LENGTH,
  formatCredentialCopyText,
  isSimpleEmailValid,
  normalizePlateInput,
} from "./driver-ui-helpers";

type Props = {
  canCreate: boolean;
  actionKey: string | null;
  latestCredentials: CompanyDriverCredentialBundle | null;
  onCreateDriver: (input: {
    name: string;
    phone?: string;
    plate?: string;
    loginEmail?: string;
    temporaryPassword?: string;
  }) => Promise<void>;
};

export function DriverCreateSection({
  canCreate,
  actionKey,
  latestCredentials,
  onCreateDriver,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const normalizedName = name.trim();
  const normalizedEmail = loginEmail.trim();
  const normalizedPassword = temporaryPassword.trim();

  const validationIssues: string[] = [];
  if (normalizedName.length < 2) {
    validationIssues.push("Şoför adı en az 2 karakter olmalı.");
  }
  if (normalizedName.length > DRIVER_NAME_MAX_LENGTH) {
    validationIssues.push("Şoför adı en fazla 80 karakter olabilir.");
  }
  if (phone.trim().length > 0 && phone.trim().length < 7) {
    validationIssues.push("Telefon numarası en az 7 karakter olmalı.");
  }
  if (normalizedEmail.length > 0 && !isSimpleEmailValid(normalizedEmail)) {
    validationIssues.push("Giriş e-postası geçerli formatta olmalı.");
  }
  if (normalizedPassword.length > 0 && normalizedPassword.length < 8) {
    validationIssues.push("Geçici şifre en az 8 karakter olmalı.");
  }

  const canSubmit = canCreate && validationIssues.length === 0 && actionKey !== "create_driver_account";

  const handleSubmit = async () => {
    if (validationIssues.length > 0) {
      setShowValidation(true);
      return;
    }
    await onCreateDriver({
      name: normalizedName,
      phone: phone.trim() || undefined,
      plate: plate.trim() ? normalizePlateInput(plate) : undefined,
      loginEmail: normalizedEmail || undefined,
      temporaryPassword: normalizedPassword || undefined,
    });
    setName("");
    setPhone("");
    setPlate("");
    setLoginEmail("");
    setTemporaryPassword("");
    setShowValidation(false);
  };

  const copyToClipboard = async (value: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(msg);
      setTimeout(() => setCopyMessage(null), 3000);
    } catch {
      setCopyMessage("Kopyalama başarısız.");
    }
  };

  if (!canCreate) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Create button or form */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2.5 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
        >
          <span className="text-base leading-none">+</span> Yeni Şoför Hesabı Oluştur
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-700">Şoför giriş hesabı oluştur</div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Oluşan bilgiler sadece mobil sürücü uygulaması içindir.
              </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Sadece mobil giriş
            </span>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
            Sadece şoför adını gir, sistem e-posta ve şifre otomatik oluşturur. Detay eklemek için &quot;Detaylı&quot; seçeneğini aç.
          </div>

          {/* Name + advanced toggle */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Şoför adı *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setShowValidation(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleSubmit(); } }}
                placeholder="Örnek: Ahmet Yılmaz"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowAdvanced((p) => !p)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  showAdvanced
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {showAdvanced ? "Basit mod" : "Detaylı"}
              </button>
            </div>
          </div>

          {/* Advanced fields */}
          {showAdvanced && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Telefon (opsiyonel)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setShowValidation(false); }}
                  placeholder="+90 5xx xxx xx xx"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Plaka (opsiyonel)</span>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => { setPlate(normalizePlateInput(e.target.value)); setShowValidation(false); }}
                  placeholder="34ABC123"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Giriş e-postası (opsiyonel)</span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value.trim()); setShowValidation(false); }}
                  placeholder="Boş bırakırsan sistem oluşturur"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Geçici şifre (opsiyonel)</span>
                <input
                  type="text"
                  value={temporaryPassword}
                  onChange={(e) => { setTemporaryPassword(e.target.value.trim()); setShowValidation(false); }}
                  placeholder="Boş bırakırsan güçlü şifre oluşturulur"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          {/* Validation */}
          {showValidation && validationIssues.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {validationIssues.map((issue) => (
                <div key={issue}>• {issue}</div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionKey === "create_driver_account" ? (
                <>
                  <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Oluşturuluyor...
                </>
              ) : (
                "Hızlı Oluştur"
              )}
            </button>
            <button
              type="button"
              onClick={() => { setName(""); setPhone(""); setPlate(""); setLoginEmail(""); setTemporaryPassword(""); setShowValidation(false); setShowForm(false); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Latest credentials card */}
      {latestCredentials && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
          <div className="mb-2 text-xs font-semibold text-emerald-900">Son oluşturulan şoför giriş bilgileri</div>
          <div className="space-y-0.5 text-xs text-emerald-800">
            <div>Şoför: {latestCredentials.name}</div>
            <div>Şoför kodu: {latestCredentials.driverId}</div>
            <div>Giriş e-postası: {latestCredentials.loginEmail}</div>
            <div>Geçici şifre: {latestCredentials.temporaryPassword}</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(latestCredentials.loginEmail, "E-posta kopyalandı.")}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              E-postayı kopyala
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(latestCredentials.temporaryPassword, "Şifre kopyalandı.")}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Şifreyi kopyala
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(formatCredentialCopyText(latestCredentials), "Tüm bilgiler kopyalandı.")}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Tümünü kopyala
            </button>
          </div>
          {copyMessage && <div className="mt-2 text-[11px] text-emerald-700">{copyMessage}</div>}
          <div className="mt-2 text-[10px] text-emerald-700/60">
            Not: Bu bilgiler sadece yetkili kişilerle paylaşılmalıdır.
          </div>
        </div>
      )}
    </div>
  );
}
