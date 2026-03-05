"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import { isPlatformOwner } from "@/lib/env/public-env";

/**
 * Platform Owner Guard — yalnızca NEXT_PUBLIC_PLATFORM_OWNER_UID ile
 * eşleşen giriş yapmış kullanıcıya erişim izni verir.
 * Diğer tüm durumlarda /giris veya /dashboard'a yönlendirir.
 */
export function PlatformOwnerGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuthSession();

 useEffect(() => {
    if (status === "signed_out") {
      router.replace("/giris?next=/platform/companies");
    }

    if (status === "signed_in" && !isPlatformOwner(user?.uid)) {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (status === "signed_out") {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted shadow-sm">
        Giris sayfasina yonlendiriliyor...
      </div>
    );
  }

  if (status === "disabled") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Firebase public env eksik oldugu icin platform guard pasif.
      </div>
    );
  }

  if (!isPlatformOwner(user?.uid)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        Bu sayfaya erisim yetkiniz yok. Dashboard&apos;a yonlendiriliyorsunuz...
      </div>
    );
  }

  return <>{children}</>;
}
