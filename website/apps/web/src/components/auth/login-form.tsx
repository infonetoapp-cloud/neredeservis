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
    <div className="space-y-5">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      {lockSecondsRemaining > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          Guvenlik bekleme suresi aktif. {lockSecondsRemaining} sn sonra tekrar deneyin.
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-800">Kurumsal E-posta</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ornek@firma.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-brand/55 focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-800">Sifre</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-brand/55 focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>
      </div>

      {showCaptcha ? (
        turnstileSiteKey ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Coklu basarisiz giris algilandi. Lutfen captcha dogrulamasini tamamlayin.
            </p>
            <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={handleCaptchaTokenChange} />
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
            Captcha site key tanimli degil. NEXT_PUBLIC_TURNSTILE_SITE_KEY degeri gerekli.
          </div>
        )
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={triggerPasswordReset}
          disabled={isBusy || resetStatus === "sending"}
          className="text-sm font-medium text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resetStatus === "sending" ? "Reset e-postasi gonderiliyor..." : "Sifremi unuttum"}
        </button>

        {resetStatus === "sent" ? (
          <span className="text-xs font-semibold text-emerald-700">Reset e-postasi gonderildi</span>
        ) : null}
      </div>

      {isDevAppEnv() && fastLoginCreds ? (
        <button
          type="button"
          onClick={applyFastLogin}
          className="w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
        >
          Fast Login Bilgilerini Doldur (dev)
        </button>
      ) : null}

      <button
        type="button"
        disabled={!canSubmitEmail}
        onClick={submitEmailPassword}
        className="mt-1 w-full rounded-2xl bg-gradient-to-r from-brand to-[#0a3f9f] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(10,79,191,0.85)] transition hover:from-[#0b56d4] hover:to-[#083a8f] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pendingAction === "email" ? "Giris yapiliyor..." : "Kurumsal giris"}
      </button>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
        <div className="flex items-start gap-2.5 text-xs leading-5 text-slate-600">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/12 text-brand">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 1.667 3.334 4.63v4.447c0 4.39 2.847 8.49 6.666 9.257 3.82-.767 6.667-4.866 6.667-9.257V4.63L10 1.667Zm-1.12 11.226 4.293-4.294 1.178 1.179-5.47 5.47-3.014-3.015 1.178-1.178 1.835 1.838Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <p>
            Giris katmani brute-force korumasi, rate-limit ve captcha kurallariyla korunur. Tum kritik giris
            olaylari guvenlik gunlugune yazilir.
          </p>
        </div>
      </div>

      {!emailEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Kurumsal email login kapali.
        </div>
      ) : null}
    </div>
  );
}
