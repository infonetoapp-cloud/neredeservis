"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
import { resolvePostLoginPath } from "@/features/mode/mode-preference";
import { useAuthSession } from "@/features/auth/auth-session-provider";
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

function shouldReportFailedLogin(error: unknown): boolean {
  const code = readErrorCode(error);
  if (!code) {
    return false;
  }
  return AUTH_FAILURE_CODES.has(code);
}

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FIREBASE_CONFIG_MISSING") {
      return "Firebase public config eksik. Giris tetiklenemiyor.";
    }
    const code = readErrorCode(error);
    if (code === "auth/invalid-credential") {
      return "E-posta veya sifre hatali.";
    }
    if (code === "auth/too-many-requests") {
      return "Cok fazla deneme yapildi. Biraz sonra tekrar dene.";
    }
    if (code === "auth/network-request-failed") {
      return "Ag hatasi. Baglantiyi kontrol edip tekrar dene.";
    }
    if (code === "auth/missing-email") {
      return "Sifre sifirlama icin once e-posta gir.";
    }
    if (code === "functions/failed-precondition") {
      return "Guvenlik dogrulamasi gerekli. Captcha adimini tamamlayin.";
    }
    if (code === "functions/permission-denied") {
      return "Captcha dogrulamasi basarisiz. Tekrar deneyin.";
    }
    if (code === "functions/resource-exhausted") {
      return error.message || "Cok fazla basarisiz deneme. Biraz sonra tekrar deneyin.";
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
  const [pendingAction, setPendingAction] = useState<"email" | null>(null);
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [isResolvingDestination, setIsResolvingDestination] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

  const nextPath = useMemo(
    () => resolvePostLoginPath(searchParams.get("next")),
    [searchParams],
  );
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        Oturum acik. Yonlendiriliyor...
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
      if (errorCode === "functions/failed-precondition" || errorCode === "functions/permission-denied") {
        setCaptchaRequired(true);
      }
      if (shouldReportFailedLogin(error)) {
        try {
          const report = await reportCorporateLoginResult({ email: normalizedEmail, success: false });
          setLockSecondsRemaining(report.lockSecondsRemaining);
          if (report.failedCount >= 3) {
            setCaptchaRequired(true);
          }
        } catch {
          // no-op: auth error'u bastirmamak icin raporlama hatasi yutulur.
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      {lockSecondsRemaining > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Guvenlik bekleme suresi aktif. {lockSecondsRemaining} sn sonra tekrar deneyin.
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800">Kurumsal E-posta</label>
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
        <label className="mb-2 block text-sm font-medium text-slate-800">Sifre</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
        />
      </div>

      {showCaptcha ? (
        turnstileSiteKey ? (
          <div className="rounded-2xl border border-line bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-700">
              Coklu basarisiz giris algilandi. Lutfen captcha dogrulamasini tamamlayin.
            </p>
            <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={handleCaptchaTokenChange} />
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            Captcha site key tanimli degil. NEXT_PUBLIC_TURNSTILE_SITE_KEY degeri gerekli.
          </div>
        )
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={triggerPasswordReset}
          disabled={isBusy || resetStatus === "sending"}
          className="text-sm font-medium text-muted hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resetStatus === "sending" ? "Reset e-postasi gonderiliyor..." : "Sifremi Unuttum"}
        </button>

        {resetStatus === "sent" ? (
          <span className="text-xs font-medium text-emerald-700">Reset e-postasi gonderildi</span>
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
        disabled={!canSubmitEmail}
        onClick={submitEmailPassword}
        className="mt-2 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === "email" ? "Giris Yapiliyor..." : "Kurumsal Giris"}
      </button>

      {!emailEnabled ? (
        <div className="text-xs text-muted">
          <span className="rounded-full bg-slate-100 px-2 py-1">Kurumsal email login kapali</span>
        </div>
      ) : null}
    </div>
  );
}
