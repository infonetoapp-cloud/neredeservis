"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  registerWithEmailPassword,
  signInWithGooglePopup,
  signInWithMicrosoftPopup,
} from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  getBackendApiBaseUrl,
  isEmailLoginEnabled,
  isGoogleLoginEnabled,
  isMicrosoftLoginEnabled,
} from "@/lib/env/public-env";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/auth-provider-icons";

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FIREBASE_CONFIG_MISSING") {
      return "Firebase public config eksik. Kayıt tetiklenemiyor.";
    }
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-in-use") {
      return "Bu e-posta ile zaten bir hesap var.";
    }
    if (code === "auth/invalid-email") {
      return "E-posta formatı geçersiz.";
    }
    if (code === "auth/weak-password") {
      return "Şifre en az 6 karakter olmalı.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sosyal giriş penceresi kapatıldı.";
    }
    if (code === "auth/popup-blocked") {
      return "Popup engellendi. Tarayıcı popup iznini açıp tekrar dene.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Bu kayıt yöntemi şu anda aktif değil.";
    }
    return code ? `Kayıt hatası (${code})` : error.message;
  }
  return "Beklenmeyen hata oluştu.";
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuthSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"email" | "google" | "microsoft" | null>(null);
  const [isNavigating, startTransition] = useTransition();

  const nextPath = searchParams.get("next") || "/dashboard";
  const backendSessionEnabled = Boolean(getBackendApiBaseUrl());
  const emailEnabled = isEmailLoginEnabled();
  const googleEnabled = !backendSessionEnabled && isGoogleLoginEnabled();
  const microsoftEnabled = !backendSessionEnabled && isMicrosoftLoginEnabled();

  useEffect(() => {
    if (status === "signed_in") {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  if (status === "signed_in") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        Oturum açık. Genel bakışa yönlendiriliyor...
      </div>
    );
  }

  const busy = pendingAction !== null || isNavigating;

  const navigateAfterAuth = () => {
    startTransition(() => {
      router.replace(nextPath);
    });
  };

  const submitEmailRegistration = async () => {
    setErrorMessage(null);
    if (password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Şifreler aynı olmalı.");
      return;
    }

    setPendingAction("email");
    try {
      const result = await registerWithEmailPassword({
        email,
        password,
        displayName: fullName,
      });
      const verificationState = result.verificationEmailSent ? "sent" : "pending";
      router.replace(
        `/verify-email?next=${encodeURIComponent(nextPath)}&verification=${verificationState}`,
      );
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const submitGoogle = async () => {
    setErrorMessage(null);
    setPendingAction("google");
    try {
      await signInWithGooglePopup();
      navigateAfterAuth();
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const submitMicrosoft = async () => {
    setErrorMessage(null);
    setPendingAction("microsoft");
    try {
      await signInWithMicrosoftPopup();
      navigateAfterAuth();
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200/85 bg-rose-50/90 p-3 text-sm text-rose-900 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!googleEnabled || busy}
        onClick={submitGoogle}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          {pendingAction === "google" ? "Google açılıyor..." : "Google ile Kayıt Ol"}
        </span>
      </button>

      <button
        type="button"
        disabled={!microsoftEnabled || busy}
        onClick={submitMicrosoft}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2">
          <MicrosoftIcon className="h-4 w-4" />
          {pendingAction === "microsoft" ? "Microsoft açılıyor..." : "Microsoft ile Kayıt Ol"}
        </span>
      </button>

      <div className="relative py-1 text-center">
        <div className="absolute left-0 right-0 top-1/2 border-t border-line/80" />
        <span className="relative bg-white px-3 text-xs font-medium tracking-wide text-slate-500">VEYA</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Ad Soyad (opsiyonel)</label>
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ad Soyad"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
          />
        </div>
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
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Şifre</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="En az 6 karakter"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Şifre (Tekrar)</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Şifreyi tekrar gir"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!emailEnabled || busy}
        onClick={submitEmailRegistration}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === "email" ? "Kayıt yapılıyor..." : "Kayıt Ol"}
      </button>

      <div className="pt-1 text-center text-sm text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-semibold text-brand hover:text-brand-strong">
          Giriş Yap
        </Link>
      </div>
    </div>
  );
}
