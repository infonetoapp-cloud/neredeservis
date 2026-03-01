"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  readCurrentUserWebAccessPolicy,
  signOutCurrentUser,
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
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/auth-provider-icons";

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
    if (error.message === "DRIVER_MOBILE_ONLY_WEB_BLOCK") {
      return "Sofor hesaplari sadece mobil uygulamada kullanilabilir.";
    }
    return code ? `Giris hatasi (${code})` : error.message;
  }
  return "Beklenmeyen hata olustu.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"email" | "google" | "microsoft" | null>(null);
  const [isNavigating, startTransition] = useTransition();

  const nextPath = searchParams.get("next") || "/select-company";
  const switchAccountRequested = searchParams.get("switch") === "1";
  const blockedReason = searchParams.get("reason");
  const emailEnabled = isEmailLoginEnabled();
  const googleEnabled = isGoogleLoginEnabled();
  const microsoftEnabled = isMicrosoftLoginEnabled();
  const fastLoginCreds = useMemo(() => getDevFastLoginCredentials(), []);
  const [switchAccountError, setSwitchAccountError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "signed_in" && !switchAccountRequested) {
      router.replace(nextPath);
    }
  }, [nextPath, router, status, switchAccountRequested]);

  useEffect(() => {
    if (!switchAccountRequested || status !== "signed_in") {
      return;
    }
    let active = true;
    setSwitchAccountError(null);
    signOutCurrentUser()
      .then(() => {
        if (!active) {
          return;
        }
        const rawNext = searchParams.get("next");
        const target = rawNext ? `/login?next=${encodeURIComponent(rawNext)}` : "/login";
        router.replace(target);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setSwitchAccountError(toFriendlyErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [router, searchParams, status, switchAccountRequested]);

  if (status === "signed_in") {
    if (switchAccountRequested) {
      return (
        <div className="space-y-3">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Hesap degistirme icin cikis yapiliyor...
          </div>
          {switchAccountError ? (
            <div className="rounded-2xl border border-rose-200/85 bg-rose-50/85 p-3 text-sm text-rose-900 shadow-sm">
              {switchAccountError}
            </div>
          ) : null}
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        Oturum acik. Dashboard&apos;a yonlendiriliyor...
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
    setPendingAction("email");
    try {
      await signInWithEmailPassword({ email, password });
      const accessPolicy = await readCurrentUserWebAccessPolicy();
      if (!accessPolicy.allowWebPanel) {
        await signOutCurrentUser();
        throw new Error("DRIVER_MOBILE_ONLY_WEB_BLOCK");
      }
      navigateAfterLogin();
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
      const accessPolicy = await readCurrentUserWebAccessPolicy();
      if (!accessPolicy.allowWebPanel) {
        await signOutCurrentUser();
        throw new Error("DRIVER_MOBILE_ONLY_WEB_BLOCK");
      }
      navigateAfterLogin();
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
      const accessPolicy = await readCurrentUserWebAccessPolicy();
      if (!accessPolicy.allowWebPanel) {
        await signOutCurrentUser();
        throw new Error("DRIVER_MOBILE_ONLY_WEB_BLOCK");
      }
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

  return (
    <div className="space-y-4">
      {blockedReason === "driver_mobile_only" ? (
        <div className="rounded-2xl border border-amber-200/85 bg-amber-50/85 p-3 text-sm text-amber-900 shadow-sm">
          Sofor hesaplari web panelde kullanilamaz. Lutfen mobil surucu uygulamasindan giris yap.
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200/85 bg-rose-50/85 p-3 text-sm text-rose-900 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!googleEnabled || busy}
        onClick={submitGoogle}
        className="glass-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          {pendingAction === "google" ? "Google aciliyor..." : "Google ile Giris"}
        </span>
      </button>

      <button
        type="button"
        disabled={!microsoftEnabled || busy}
        onClick={submitMicrosoft}
        className="glass-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2">
          <MicrosoftIcon className="h-4 w-4" />
          {pendingAction === "microsoft" ? "Microsoft aciliyor..." : "Microsoft ile Giris"}
        </span>
      </button>

      <div className="relative py-1 text-center">
        <div className="absolute left-0 right-0 top-1/2 border-t border-line/80" />
        <span className="relative bg-white px-3 text-xs font-medium tracking-wide text-[#7e8691]">OR</span>
      </div>

      <div className="space-y-4">
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
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-[#2f3237]">Password</label>
            <Link
              href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
              className="text-sm font-semibold text-[#42505c] transition hover:opacity-75"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            className="glass-input w-full rounded-xl px-4 py-3 text-sm"
          />
        </div>
      </div>

      {isDevAppEnv() && fastLoginCreds ? (
        <button
          type="button"
          onClick={applyFastLogin}
          className="glass-button w-full rounded-xl border-dashed px-4 py-2 text-sm font-medium"
        >
          Fast Login Bilgilerini Doldur (dev)
        </button>
      ) : null}

      <button
        type="button"
        disabled={!emailEnabled || busy}
        onClick={submitEmailPassword}
        className="glass-button-primary mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === "email" ? "Signing in..." : "Sign In"}
      </button>

      <div className="pt-1 text-center text-sm text-[#66736c]">
        Hesabin yok mu?{" "}
        <Link href="/register" className="font-semibold text-[#173f37] hover:opacity-70">
          Kayit Ol
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 pt-1 text-xs text-[#6e7a74]">
        {!emailEnabled ? (
          <span className="glass-chip rounded-full px-2.5 py-1">Email login kapali</span>
        ) : null}
        {!googleEnabled ? (
          <span className="glass-chip rounded-full px-2.5 py-1">Google login kapali</span>
        ) : null}
        {!microsoftEnabled ? (
          <span className="glass-chip rounded-full px-2.5 py-1">Microsoft login kapali</span>
        ) : null}
      </div>
    </div>
  );
}

