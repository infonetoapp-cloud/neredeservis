"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  sendPasswordResetEmailForAddress,
  signInWithEmailPassword,
  signInWithGooglePopup,
  signInWithMicrosoftPopup,
} from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  getDevFastLoginCredentials,
  isDevAppEnv,
  isEmailLoginEnabled,
  isGoogleLoginEnabled,
  isMicrosoftLoginEnabled,
} from "@/lib/env/public-env";
import { resolvePostLoginPath } from "@/features/mode/mode-preference";
import { isPlatformOwner } from "@/lib/env/public-env";

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FIREBASE_CONFIG_MISSING") {
      return "Firebase public config eksik. Login tetiklenemiyor.";
    }
    const code = (error as { code?: string }).code;
    if (code === "auth/invalid-credential") {
      return "E-posta veya sifre hatali.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Google giris penceresi kapatildi.";
    }
    if (code === "auth/popup-blocked") {
      return "Popup engellendi. Tarayici popup iznini acip tekrar dene.";
    }
    if (code === "auth/unauthorized-domain") {
      return "Bu domain Firebase Auth icin yetkili degil (authorized domains).";
    }
    if (code === "auth/operation-not-allowed") {
      return "Bu giris yontemi su anda aktif degil.";
    }
    if (code === "auth/missing-email") {
      return "Sifre sifirlama icin once e-posta gir.";
    }
    if (code === "auth/too-many-requests") {
      return "Cok fazla deneme yapildi. Biraz sonra tekrar dene.";
    }
    if (code === "auth/network-request-failed") {
      return "Ag hatasi. Baglantiyi kontrol edip tekrar dene.";
    }
    return code ? `Giris hatasi (${code})` : error.message;
  }
  return "Beklenmeyen hata olustu.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "email" | "google" | "microsoft" | null
  >(null);
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [isNavigating, startTransition] = useTransition();

  const nextPath = useMemo(() => {
    const raw = resolvePostLoginPath(searchParams.get("next"));
    // Platform owner default hedefi: şirket listesi
    if (raw === "/dashboard" && isPlatformOwner(user?.uid)) {
      return "/platform/companies";
    }
    return raw;
  }, [searchParams, user?.uid]);
  const emailEnabled = isEmailLoginEnabled();
  const googleEnabled = isGoogleLoginEnabled();
  const microsoftEnabled = isMicrosoftLoginEnabled();
  const fastLoginCreds = useMemo(() => getDevFastLoginCredentials(), []);

  useEffect(() => {
    if (status === "signed_in") {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  if (status === "signed_in") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        Oturum acik. Yonlendiriliyor...
      </div>
    );
  }

  const navigateAfterLogin = () => {
    startTransition(() => {
      router.replace(nextPath);
    });
  };

  const submitEmailPassword = async () => {
    setErrorMessage(null);
    setResetStatus("idle");
    setPendingAction("email");
    try {
      await signInWithEmailPassword({ email, password });
      navigateAfterLogin();
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const submitGoogle = async () => {
    setErrorMessage(null);
    setResetStatus("idle");
    setPendingAction("google");
    try {
      await signInWithGooglePopup();
      navigateAfterLogin();
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const submitMicrosoft = async () => {
    setErrorMessage(null);
    setResetStatus("idle");
    setPendingAction("microsoft");
    try {
      await signInWithMicrosoftPopup();
      navigateAfterLogin();
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const applyFastLogin = () => {
    if (!fastLoginCreds) {
      return;
    }
    setEmail(fastLoginCreds.email);
    setPassword(fastLoginCreds.password);
  };

  const busy = pendingAction !== null || isNavigating;

  const triggerPasswordReset = async () => {
    setErrorMessage(null);
    setResetStatus("sending");
    try {
      await sendPasswordResetEmailForAddress(email);
      setResetStatus("sent");
    } catch (error) {
      setResetStatus("idle");
      setErrorMessage(toFriendlyErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800">E-posta</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@firma.com"
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800">Sifre</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={triggerPasswordReset}
          disabled={busy || resetStatus === "sending"}
          className="text-sm font-medium text-muted hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resetStatus === "sending"
            ? "Reset e-postasi gonderiliyor..."
            : "Sifremi Unuttum"}
        </button>

        {resetStatus === "sent" ? (
          <span className="text-xs font-medium text-emerald-700">
            Reset e-postasi gonderildi
          </span>
        ) : null}
      </div>

      {isDevAppEnv() && fastLoginCreds ? (
        <button
          type="button"
          onClick={applyFastLogin}
          className="w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Fast Login Bilgilerini Doldur (dev)
        </button>
      ) : null}

      <button
        type="button"
        disabled={!emailEnabled || busy}
        onClick={submitEmailPassword}
        className="mt-2 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === "email" ? "Giris Yapiliyor..." : "Giris Yap"}
      </button>

      {googleEnabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={submitGoogle}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === "google" ? "Google aciliyor..." : "Google ile Giris"}
        </button>
      ) : null}

      {microsoftEnabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={submitMicrosoft}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === "microsoft"
            ? "Microsoft aciliyor..."
            : "Microsoft ile Giris"}
        </button>
      ) : null}

      {!emailEnabled ? (
        <div className="text-xs text-muted">
          <span className="rounded-full bg-slate-100 px-2 py-1">Email login kapali</span>
        </div>
      ) : null}
    </div>
  );
}

