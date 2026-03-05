"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  reloadCurrentUserSession,
  updateCurrentUserProfile,
} from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { requiresProfileOnboarding } from "@/features/auth/auth-guard-utils";
import { ArrowRightIcon, RefreshIcon, UserIcon } from "@/components/shared/app-icons";

function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (error.message === "FIREBASE_CONFIG_MISSING") {
      return "Firebase public config eksik. Profil guncelleme tetiklenemiyor.";
    }
    return code ? `Profil guncelleme hatasi (${code})` : error.message;
  }
  return "Beklenmeyen hata olustu.";
}

export function ProfileOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthSession();
  const nextPath = searchParams.get("next") || "/select-company";
  const [displayName, setDisplayName] = useState<string>(user?.displayName ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(false);

  const needsOnboarding = requiresProfileOnboarding(user);

  useEffect(() => {
    if (status === "signed_out") {
      const next = `/onboarding/profile?next=${encodeURIComponent(nextPath)}`;
      router.replace(`/giris?next=${encodeURIComponent(next)}`);
      return;
    }
    if (status === "signed_in" && !needsOnboarding) {
      router.replace(nextPath);
    }
  }, [needsOnboarding, nextPath, router, status]);

  useEffect(() => {
    if (user?.displayName && user.displayName !== displayName) {
      return;
    }
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [displayName, user?.displayName]);

  if (status === "loading") {
    return <div className="text-sm text-[#71695f]">Profil bilgisi kontrol ediliyor...</div>;
  }

  if (status !== "signed_in") {
    return <div className="text-sm text-[#71695f]">Giris sayfasina yonlendiriliyor...</div>;
  }

  const submitProfile = async () => {
    setErrorMessage(null);
    const normalized = displayName.trim();
    if (normalized.length < 2) {
      setErrorMessage("Lutfen gecerli bir ad soyad gir.");
      return;
    }

    setPending(true);
    try {
      await updateCurrentUserProfile({ displayName: normalized });
      await reloadCurrentUserSession();
      router.replace(nextPath);
    } catch (error) {
      setErrorMessage(toFriendlyErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200/85 bg-rose-50/90 p-3 text-sm text-rose-900 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      <div>
        <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#2a352f]">
          <UserIcon className="h-4 w-4 text-[#406155]" />
          Ad Soyad
        </label>
        <div className="relative">
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ornek: Ahmet Yilmaz"
            className="glass-input w-full rounded-2xl py-3 pl-11 pr-4 text-sm"
          />
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7f76]" />
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={submitProfile}
        className="glass-button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <RefreshIcon className="h-4 w-4" />
            Kaydediliyor...
          </>
        ) : (
          <>
            <ArrowRightIcon className="h-4 w-4" />
            Profili Kaydet ve Devam Et
          </>
        )}
      </button>
    </div>
  );
}
