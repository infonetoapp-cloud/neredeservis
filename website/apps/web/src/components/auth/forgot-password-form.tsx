"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { RefreshIcon } from "@/components/shared/app-icons";
import { sendPasswordResetEmailForAddress } from "@/features/auth/auth-client";

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (code === "BACKEND_API_MISSING") {
      return "Backend auth baglantisi eksik. Sifre sifirlama baslatilamiyor.";
    }
    if (code === "auth/missing-email" || code === "invalid-argument") {
      return "Lutfen e-posta alanini doldur.";
    }
    if (code === "auth/invalid-email") {
      return "E-posta formati gecersiz.";
    }
    if (code === "auth/user-not-found") {
      return "Bu e-posta ile kayitli hesap bulunamadi.";
    }
    if (code === "auth/too-many-requests") {
      return "Cok fazla deneme yapildi. Biraz sonra tekrar dene.";
    }
    return code ? `Sifre sifirlama hatasi (${code})` : error.message;
  }
  return "Beklenmeyen hata olustu.";
}

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState<string>(initialEmail);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [manualResetUrl, setManualResetUrl] = useState<string | null>(null);

  const submitReset = async () => {
    setErrorMessage(null);
    setManualResetUrl(null);
    setStatus("sending");
    try {
      const result = await sendPasswordResetEmailForAddress(email);
      setManualResetUrl(result.delivery === "manual" ? result.resetUrl ?? null : null);
      setStatus("sent");
    } catch (error) {
      setStatus("idle");
      setErrorMessage(toFriendlyErrorMessage(error));
    }
  };

  const busy = status === "sending";

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200/85 bg-rose-50/90 p-3 text-sm text-rose-900 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      {status === "sent" ? (
        <div className="rounded-2xl border border-emerald-200/85 bg-emerald-50/80 p-3 text-sm text-emerald-900">
          {manualResetUrl ? (
            <div className="space-y-2">
              <p>Reset baglantisi hazirlandi. Asagidan dogrudan devam edebilirsin.</p>
              <Link
                href={manualResetUrl}
                className="inline-flex items-center rounded-xl bg-emerald-700 px-3 py-2 font-semibold text-white transition hover:bg-emerald-800"
              >
                Sifre Belirleme Ekranini Ac
              </Link>
            </div>
          ) : (
            "Reset e-postasi gonderildi. Gelen kutunu kontrol et."
          )}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800">E-posta</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@firma.com"
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={submitReset}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <>
            <RefreshIcon className="h-4 w-4" />
            Gonderiliyor...
          </>
        ) : (
          "Reset Linki Gonder"
        )}
      </button>

      <div className="pt-1 text-center text-sm text-muted">
        Sifreyi hatirladin mi?{" "}
        <Link href="/giris" className="font-semibold text-brand hover:text-brand-strong">
          Giris Yap
        </Link>
      </div>
    </div>
  );
}
