"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { sendPasswordResetEmailForAddress } from "@/features/auth/auth-client";
import { RefreshIcon } from "@/components/shared/app-icons";

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (error.message === "FIREBASE_CONFIG_MISSING") {
      return "Firebase public config eksik. Şifre sıfırlama tetiklenemiyor.";
    }
    if (code === "auth/missing-email") {
      return "Lütfen e-posta alanını doldur.";
    }
    if (code === "auth/invalid-email") {
      return "E-posta formatı geçersiz.";
    }
    if (code === "auth/user-not-found") {
      return "Bu e-posta ile kayıtlı hesap bulunamadı.";
    }
    if (code === "auth/too-many-requests") {
      return "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.";
    }
    return code ? `Şifre sıfırlama hatası (${code})` : error.message;
  }
  return "Beklenmeyen hata oluştu.";
}

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState<string>(initialEmail);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const submitReset = async () => {
    setErrorMessage(null);
    setStatus("sending");
    try {
      await sendPasswordResetEmailForAddress(email);
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
          Reset e-postası gönderildi. Gelen kutunu kontrol et.
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
            Gönderiliyor...
          </>
        ) : (
          "Reset Linki Gönder"
        )}
      </button>

      <div className="pt-1 text-center text-sm text-muted">
        Şifreyi hatırladın mı?{" "}
        <Link href="/giris" className="font-semibold text-brand hover:text-brand-strong">
          Giriş Yap
        </Link>
      </div>
    </div>
  );
}
