"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";

/**
 * Platform shell erişimi için istemci tarafında yalnızca auth kapısı uygulanır.
 * Yetki kontrolü backend callable katmanında server-side olarak zorunlu kalır.
 */
export function PlatformOwnerGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === "signed_out") {
      router.replace("/giris?next=/platform/companies");
    }
  }, [status, router]);

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
        Giriş sayfasına yönlendiriliyor...
      </div>
    );
  }

  if (status === "disabled") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Firebase public env eksik oldugu için platform guard pasif.
      </div>
    );
  }

  return <>{children}</>;
}

