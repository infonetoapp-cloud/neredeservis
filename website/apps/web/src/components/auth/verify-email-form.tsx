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

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (error.message === "FIREBASE_CONFIG_MISSING") {
      return "Firebase public config eksik. E-posta dogrulama tetiklenemiyor.";
    }
    if (code === "auth/too-many-requests") {
      return "Cok fazla deneme yapildi. Biraz sonra tekrar dene.";
    }
    if (code === "auth/network-request-failed") {
      return "Ag hatasi. Baglantini kontrol et.";
    }
    if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
      return "Dogrulama linki olusturulamadi. Firebase Auth authorized domains ayarini kontrol et.";
    }
    return code ? `Dogrulama hatasi (${code})` : error.message;
  }
  return "Beklenmeyen hata olustu.";
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthSession();
  const nextPath = searchParams.get("next") || "/select-company";
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"send" | "refresh" | "switch" | null>(null);
  const [autoSendAttempted, setAutoSendAttempted] = useState(false);

  const needsVerification = requiresEmailVerification(user);

  useEffect(() => {
    if (status === "signed_out") {
      const next = `/verify-email?next=${encodeURIComponent(nextPath)}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
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
        setFeedbackMessage("Dogrulama e-postasi otomatik gonderildi. Gelen kutusu ve spam klasorunu kontrol et.");
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
  }, [autoSendAttempted, needsVerification, status]);

  if (status === "loading") {
    return <div className="text-sm text-[#71695f]">Oturum bilgisi kontrol ediliyor...</div>;
  }

  if (status !== "signed_in") {
    return <div className="text-sm text-[#71695f]">Giris sayfasina yonlendiriliyor...</div>;
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
      setFeedbackMessage("Dogrulama henuz tamamlanmamis gorunuyor. Mail linkine tiklayip tekrar dene.");
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
      router.replace(`/login${query}`);
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line/90 bg-white/70 p-3 text-sm text-[#5f6963]">
        <div className="font-semibold text-[#1a2720]">Dogrulanacak e-posta</div>
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

      <button
        type="button"
        disabled={pendingAction !== null}
        onClick={handleSendVerification}
        className="glass-button-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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

      <button
        type="button"
        disabled={pendingAction !== null}
        onClick={handleRefreshVerification}
        className="glass-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="pt-1 text-center text-sm text-[#66736c]">
        Yanlis hesapla mi girdin?{" "}
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={handleSwitchAccount}
          className="font-semibold text-[#173f37] hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === "switch" ? "Cikis yapiliyor..." : "Cikis yap ve giris sayfasina don"}
        </button>
      </div>
    </div>
  );
}
