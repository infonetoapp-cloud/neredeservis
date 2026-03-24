"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import {
  sendPasswordResetEmailForAddress,
  signInWithEmailPassword,
} from "@/features/auth/auth-client";
import {
  prepareCorporateLoginAttempt,
  reportCorporateLoginResult,
  resolveCorporateLoginDestination,
} from "@/features/auth/login-security-callables";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { resolvePostLoginPath } from "@/features/mode/mode-preference";
import {
  getDevFastLoginCredentials,
  getTurnstileSiteKey,
  isDevAppEnv,
  isEmailLoginEnabled,
} from "@/lib/env/public-env";

const AUTH_FAILURE_CODES = new Set<string>([
  "auth/invalid-credential",
  "auth/wrong-password",
  "auth/user-not-found",
  "auth/invalid-email",
  "auth/user-disabled",
]);

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  if ("code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return null;
}

function matchesErrorCode(code: string | null, ...expectedCodes: string[]): boolean {
  return Boolean(code && expectedCodes.includes(code));
}

function shouldReportFailedLogin(error: unknown): boolean {
  const code = readErrorCode(error);
  if (!code) {
    return false;
  }
  return AUTH_FAILURE_CODES.has(code);
}

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = readErrorCode(error);
    if (code === "BACKEND_API_MISSING") {
      return "Backend auth baglantisi eksik. Giris su an baslatilamiyor.";
    }
    if (code === "auth/invalid-credential") {
      return "E-posta veya sifre hatali.";
    }
    if (code === "auth/password-reset-required") {
      return error.message;
    }
    if (code === "auth/too-many-requests") {
      return "Cok fazla deneme yapildi. Lutfen biraz sonra tekrar deneyin.";
    }
    if (code === "auth/network-request-failed") {
      return "Ag hatasi. Baglantinizi kontrol edip tekrar deneyin.";
    }
    if (code === "auth/missing-email") {
      return "Sifre sifirlama icin once e-posta girin.";
    }
    if (matchesErrorCode(code, "functions/failed-precondition", "failed-precondition")) {
      return "Guvenlik dogrulamasi gerekli. Captcha adimini tamamlayin.";
    }
    if (matchesErrorCode(code, "functions/permission-denied", "permission-denied")) {
      return "Captcha dogrulamasi basarisiz. Tekrar deneyin.";
    }
    if (matchesErrorCode(code, "functions/resource-exhausted", "resource-exhausted")) {
      return error.message || "Cok fazla basarisiz deneme. Lutfen biraz sonra tekrar deneyin.";
    }
    return code ? `Giris hatasi (${code})` : error.message;
  }
  return "Beklenmeyen bir hata olustu.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuthSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"email" | null>(null);
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [isResolvingDestination, setIsResolvingDestination] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

  const nextPath = useMemo(() => resolvePostLoginPath(searchParams.get("next")), [searchParams]);
  const emailEnabled = isEmailLoginEnabled();
  const fastLoginCreds = useMemo(() => getDevFastLoginCredentials(), []);
  const turnstileSiteKey = getTurnstileSiteKey();
  const showCaptcha = captchaRequired;

  const isBusy = pendingAction !== null || isResolvingDestination;
  const canSubmitEmail =
    emailEnabled &&
    !isBusy &&
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    (!showCaptcha || (Boolean(turnstileSiteKey) && Boolean(captchaToken)));

  useEffect(() => {
    if (lockSecondsRemaining <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setLockSecondsRemaining((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockSecondsRemaining]);

  useEffect(() => {
    if (status !== "signed_in") {
      return;
    }
    let cancelled = false;
    setIsResolvingDestination(true);

    void resolveCorporateLoginDestination(nextPath)
      .then((destination) => {
        if (!cancelled) {
          router.replace(destination);
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace("/dashboard");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingDestination(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nextPath, router, status]);

  const handleCaptchaTokenChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  if (status === "signed_in") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        Oturum acik. Yonlendiriliyorsunuz...
      </div>
    );
  }

  const submitEmailPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setErrorMessage("E-posta ve sifre alanlari zorunludur.");
      return;
    }

    setErrorMessage(null);
    setResetStatus("idle");
    setPendingAction("email");

    try {
      const guard = await prepareCorporateLoginAttempt({
        email: normalizedEmail,
        captchaToken,
      });
      setCaptchaRequired(guard.captchaRequired);
      setLockSecondsRemaining(guard.lockSecondsRemaining);

      if (guard.captchaRequired && !captchaToken) {
        setErrorMessage("Guvenlik dogrulamasi gerekli. Captcha adimini tamamlayin.");
        return;
      }

      await signInWithEmailPassword({ email: normalizedEmail, password });
      await reportCorporateLoginResult({ email: normalizedEmail, success: true });
      setCaptchaRequired(false);
      setCaptchaToken(null);
      setLockSecondsRemaining(0);
    } catch (error) {
      const errorCode = readErrorCode(error);
      if (
        matchesErrorCode(
          errorCode,
          "functions/failed-precondition",
          "functions/permission-denied",
          "failed-precondition",
          "permission-denied",
        )
      ) {
        setCaptchaRequired(true);
      }
      if (shouldReportFailedLogin(error)) {
        try {
          const report = await reportCorporateLoginResult({
            email: normalizedEmail,
            success: false,
          });
          setLockSecondsRemaining(report.lockSecondsRemaining);
          if (report.failedCount >= 3) {
            setCaptchaRequired(true);
          }
        } catch {
          // no-op
        }
      }
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
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      {lockSecondsRemaining > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Guvenlik bekleme suresi aktif. {lockSecondsRemaining} sn sonra tekrar deneyin.
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-[15px] font-semibold text-slate-800">E-posta</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ornek@sirket.com"
            className="w-full rounded-xl border border-[#cfd4df] bg-white py-2.5 pl-10 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[15px] font-semibold text-slate-800">Sifre</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            className="w-full rounded-xl border border-[#cfd4df] bg-white py-2.5 pl-10 pr-10 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Sifreyi gizle" : "Sifreyi goster"}
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {showCaptcha ? (
        turnstileSiteKey ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="mb-2 text-xs font-medium text-slate-700">
              Coklu basarisiz giris algilandi. Lutfen captcha dogrulamasini tamamlayin.
            </p>
            <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={handleCaptchaTokenChange} />
          </div>
        ) : (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
            Captcha site key tanimli degil. NEXT_PUBLIC_TURNSTILE_SITE_KEY gerekli.
          </div>
        )
      ) : null}

      <button
        type="button"
        disabled={!canSubmitEmail}
        onClick={submitEmailPassword}
        className="w-full rounded-xl bg-[#1f5ef0] px-4 py-2.5 text-base font-semibold text-white transition hover:bg-[#1a4ed2] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === "email" ? "Giris yapiliyor..." : "Giris yap"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={triggerPasswordReset}
          disabled={isBusy || resetStatus === "sending"}
          className="text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resetStatus === "sending" ? "Gonderiliyor..." : "Sifremi unuttum"}
        </button>
        <Link href="/" className="text-slate-500 hover:underline">
          Ana sayfa
        </Link>
      </div>

      {resetStatus === "sent" ? (
        <p className="text-xs text-emerald-700">Sifirlama baglantisi hazirlandi.</p>
      ) : null}

      {isDevAppEnv() && fastLoginCreds ? (
        <button
          type="button"
          onClick={applyFastLogin}
          className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
        >
          Hizli doldur
        </button>
      ) : null}

      {!emailEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Kurumsal e-posta ile giris su an kapali.
        </div>
      ) : null}
    </div>
  );
}
