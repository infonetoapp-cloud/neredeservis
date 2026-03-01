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
      return "Firebase public config eksik. Sifre sifirlama tetiklenemiyor.";
    }
    if (code === "auth/missing-email") {
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
          Reset e-postasi gonderildi. Gelen kutunu kontrol et.
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#2f3237]">Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@firma.com"
          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
        />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={submitReset}
        className="glass-button-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="pt-1 text-center text-sm text-[#66736c]">
        Sifreyi hatirladin mi?{" "}
        <Link href="/login" className="font-semibold text-[#173f37] hover:opacity-70">
          Giris Yap
        </Link>
      </div>
    </div>
  );
}
