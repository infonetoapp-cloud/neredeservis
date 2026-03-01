"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { AppLockPanel } from "@/components/shared/app-lock-panel";
import {
  requiresEmailVerification,
  requiresProfileOnboarding,
} from "@/features/auth/auth-guard-utils";
import { readCurrentUserWebAccessPolicy, signOutCurrentUser } from "@/features/auth/auth-client";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  isEmailVerificationRequired,
  isForceUpdateLockEnabled,
  isProfileOnboardingRequired,
} from "@/lib/env/public-env";

export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthSession();
  const [webAccessDenied, setWebAccessDenied] = useState<boolean>(false);
  const forceUpdateLockEnabled = isForceUpdateLockEnabled();
  const requireEmailVerification = isEmailVerificationRequired();
  const requireProfileOnboarding = isProfileOnboardingRequired();
  const needsEmailVerification =
    status === "signed_in" &&
    requireEmailVerification &&
    requiresEmailVerification(user);
  const needsProfileOnboarding =
    status === "signed_in" &&
    requireProfileOnboarding &&
    !needsEmailVerification &&
    requiresProfileOnboarding(user);

  useEffect(() => {
    if (status !== "signed_in" || !user) {
      return;
    }

    let cancelled = false;
    readCurrentUserWebAccessPolicy()
      .then(async (policy) => {
        if (cancelled) {
          return;
        }
        if (!policy.allowWebPanel) {
          setWebAccessDenied(true);
          await signOutCurrentUser();
          router.replace("/login?reason=driver_mobile_only");
          return;
        }
        setWebAccessDenied(false);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router, status, user]);

  useEffect(() => {
    if (status === "signed_out") {
      if (webAccessDenied) {
        router.replace("/login?reason=driver_mobile_only");
        return;
      }
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return;
    }

    if (status === "signed_in" && needsEmailVerification) {
      const target = pathname ?? "/select-company";
      router.replace(`/verify-email?next=${encodeURIComponent(target)}`);
      return;
    }

    if (status === "signed_in" && needsProfileOnboarding) {
      const target = pathname ?? "/select-company";
      router.replace(`/onboarding/profile?next=${encodeURIComponent(target)}`);
    }
  }, [needsEmailVerification, needsProfileOnboarding, pathname, router, status, webAccessDenied]);

  if (status === "loading") {
    return (
      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (webAccessDenied) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Sofor rolu web panelde acik degil. Mobil uygulamadan giris yap.
      </div>
    );
  }

  if (forceUpdateLockEnabled) {
    return <AppLockPanel reason="force_update" />;
  }

  if (status === "signed_out") {
    return (
      <div className="glass-panel rounded-2xl p-4 text-sm text-muted">
        Giris sayfasina yonlendiriliyor...
      </div>
    );
  }

  if (needsEmailVerification) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        E-posta dogrulama bekleniyor. Dogrulama ekranina yonlendiriliyorsun...
      </div>
    );
  }

  if (needsProfileOnboarding) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Profil bilgisi tamamlanmadi. Onboarding ekranina yonlendiriliyorsun...
      </div>
    );
  }

  if (status === "disabled") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Firebase public env eksik oldugu icin oturum kontrolu pasif.
      </div>
    );
  }

  return <>{children}</>;
}
