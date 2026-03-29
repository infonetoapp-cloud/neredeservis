"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  reloadCurrentUserSession,
  sendEmailVerificationForCurrentUser,
  signOutCurrentUser,
} from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { requiresEmailVerification } from "@/features/auth/auth-guard-utils";
import { CheckCircleIcon, RefreshIcon } from "@/components/shared/app-icons";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (code === "BACKEND_API_MISSING") {
      return "Backend kimlik dogrulama baglantisi eksik. E-posta dogrulama baslatilamadi.";
    }
    if (code === "auth/too-many-requests") {
      return "Cok fazla deneme yapildi. Biraz sonra tekrar dene.";
    }
    if (code === "auth/network-request-failed") {
      return "Ag hatasi. Baglantini kontrol et.";
    }
    if (code === "auth/operation-not-supported-in-this-environment") {
      return "Bu asamada tekrar gonderim desteklenmiyor. Gelen kutunu ve spam klasorunu kontrol et.";
    }
    if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
      return "Dogrulama linki olusturulamadi. Yetkili domain ayarini kontrol et.";
    }
    return code ? `Dogrulama hatasi (${code})` : error.message;
  }
  return "Beklenmeyen hata olustu.";
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthSession();
  const nextPath = searchParams.get("next") || "/dashboard";
  const verificationState = searchParams.get("verification");
  const backendSessionEnabled = Boolean(getBackendApiBaseUrl());
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"send" | "refresh" | "switch" | null>(null);
  const [autoSendAttempted, setAutoSendAttempted] = useState(false);

  const needsVerification = requiresEmailVerification(user);

  useEffect(() => {
    if (status === "signed_out") {
      const next = `/verify-email?next=${encodeURIComponent(nextPath)}`;
      router.replace(`/giris?next=${encodeURIComponent(next)}`);
      return;
    }
    if (status === "signed_in" && !needsVerification) {
      router.replace(nextPath);
    }
  }, [needsVerification, nextPath, router, status]);

  useEffect(() => {
    if (status !== "signed_in" || !needsVerification || autoSendAttempted) {
      return;
    }

    if (backendSessionEnabled) {
      setAutoSendAttempted(true);
      if (verificationState === "sent") {
        setFeedbackMessage(
          "Dogrulama e-postasi kayit sirasinda gonderildi. Gelen kutusu ve spam klasorunu kontrol et.",
        );
      } else if (verificationState === "pending") {
        setFeedbackMessage(
          "Hesap acildi ancak dogrulama e-postasi tekrar gonderilemedi. Gelmediyse daha sonra yeniden kayit akisini deneyin.",
        );
      }
      return;
    }

    let active = true;
    setAutoSendAttempted(true);
    setPendingAction("send");
    setErrorMessage(null);
    setFeedbackMessage(null);

    sendEmailVerificationForCurrentUser()
      .then(() => {
        if (!active) {
          return;
        }
        setFeedbackMessage(
          "Dogrulama e-postasi otomatik gonderildi. Gelen kutusu ve spam klasorunu kontrol et.",
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setErrorMessage(toFriendlyErrorMessage(error));
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setPendingAction(null);
      });

    return () => {
      active = false;
    };
  }, [autoSendAttempted, backendSessionEnabled, needsVerification, status, verificationState]);

  if (status === "loading") {
    return <div className="text-sm text-muted">Oturum bilgisi kontrol ediliyor...</div>;
  }

  if (status !== "signed_in") {
    return <div className="text-sm text-muted">Giris sayfasina yonlendiriliyor...</div>;
  }

  const handleSendVerification = async () => {
    setErrorMessage(null);
    setFeedbackMessage(null);
    setPendingAction("send");
    try {
      await sendEmailVerificationForCurrentUser();
      setFeedbackMessage("Dogrulama e-postasi gonderildi. Gelen kutunu kontrol et.");
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleRefreshVerification = async () => {
    setErrorMessage(null);
    setFeedbackMessage(null);
    setPendingAction("refresh");
    try {
      const refreshedUser = await reloadCurrentUserSession();
      if (refreshedUser && !requiresEmailVerification(refreshedUser)) {
        router.replace(nextPath);
        return;
      }
      setFeedbackMessage(
        "Dogrulama henuz tamamlanmamis gorunuyor. Mail linkine tiklayip tekrar dene.",
      );
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSwitchAccount = async () => {
    setErrorMessage(null);
    setFeedbackMessage(null);
    setPendingAction("switch");
    try {
      await signOutCurrentUser();
      const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
      router.replace(`/giris${query}`);
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-slate-50 p-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">Dogrulanacak e-posta</div>
        <div className="mt-1">{user?.email ?? "E-posta bulunamadi"}</div>
      </div>

      {feedbackMessage ? (
        <div className="rounded-2xl border border-emerald-200/85 bg-emerald-50/80 p-3 text-sm text-emerald-900">
          {feedbackMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200/85 bg-rose-50/90 p-3 text-sm text-rose-900 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      {!backendSessionEnabled ? (
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={handleSendVerification}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === "send" ? (
            <>
              <RefreshIcon className="h-4 w-4" />
              Gonderiliyor...
            </>
          ) : (
            "Dogrulama E-postasi Gonder"
          )}
        </button>
      ) : null}

      <button
        type="button"
        disabled={pendingAction !== null}
        onClick={handleRefreshVerification}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingAction === "refresh" ? (
          <>
            <RefreshIcon className="h-4 w-4" />
            Kontrol ediliyor...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-4 w-4" />
            Dogrulamayi Kontrol Et
          </>
        )}
      </button>

      <div className="pt-1 text-center text-sm text-muted">
        Yanlis hesapla mi girdin?{" "}
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={handleSwitchAccount}
          className="font-semibold text-brand hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === "switch" ? "Cikis yapiliyor..." : "Cikis yap ve giris sayfasina don"}
        </button>
      </div>
    </div>
  );
}
