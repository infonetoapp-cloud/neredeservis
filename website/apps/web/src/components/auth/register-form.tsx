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
  isEmailLoginEnabled,
  isGoogleLoginEnabled,
  isMicrosoftLoginEnabled,
} from "@/lib/env/public-env";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/auth-provider-icons";

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FIREBASE_CONFIG_MISSING") {
      return "Firebase public config eksik. Kayit tetiklenemiyor.";
    }
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-in-use") {
      return "Bu e-posta ile zaten bir hesap var.";
    }
    if (code === "auth/invalid-email") {
      return "E-posta formati gecersiz.";
    }
    if (code === "auth/weak-password") {
      return "Sifre en az 6 karakter olmali.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sosyal giris penceresi kapatildi.";
    }
    if (code === "auth/popup-blocked") {
      return "Popup engellendi. Tarayici popup iznini acip tekrar dene.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Bu kayit yontemi su anda aktif degil.";
    }
    return code ? `Kayit hatasi (${code})` : error.message;
  }
  return "Beklenmeyen hata olustu.";
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

  const nextPath = searchParams.get("next") || "/select-company";
  const emailEnabled = isEmailLoginEnabled();
  const googleEnabled = isGoogleLoginEnabled();
  const microsoftEnabled = isMicrosoftLoginEnabled();

  useEffect(() => {
    if (status === "signed_in") {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  if (status === "signed_in") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        Oturum acik. Sirket secimine yonlendiriliyor...
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
      setErrorMessage("Sifre en az 6 karakter olmali.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Sifreler ayni olmali.");
      return;
    }

    setPendingAction("email");
    try {
      await registerWithEmailPassword({ email, password });
      router.replace(`/verify-email?next=${encodeURIComponent(nextPath)}`);
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
        className="glass-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          {pendingAction === "google" ? "Google aciliyor..." : "Google ile Kayit Ol"}
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
          {pendingAction === "microsoft" ? "Microsoft aciliyor..." : "Microsoft ile Kayit Ol"}
        </span>
      </button>

      <div className="relative py-1 text-center">
        <div className="absolute left-0 right-0 top-1/2 border-t border-line/80" />
        <span className="relative bg-white px-3 text-xs font-medium tracking-wide text-[#7e8691]">OR</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#2f3237]">Ad Soyad (opsiyonel)</label>
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ad Soyad"
            className="glass-input w-full rounded-xl px-4 py-3 text-sm"
          />
        </div>
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
          <label className="mb-2 block text-sm font-semibold text-[#2f3237]">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="En az 6 karakter"
            className="glass-input w-full rounded-xl px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#2f3237]">Confirm Password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Sifreyi tekrar gir"
            className="glass-input w-full rounded-xl px-4 py-3 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!emailEnabled || busy}
        onClick={submitEmailRegistration}
        className="glass-button-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === "email" ? "Signing up..." : "Sign Up"}
      </button>

      <div className="pt-1 text-center text-sm text-[#66736c]">
        Zaten hesabin var mi?{" "}
        <Link href="/login" className="font-semibold text-[#173f37] hover:opacity-70">
          Giris Yap
        </Link>
      </div>
    </div>
  );
}
