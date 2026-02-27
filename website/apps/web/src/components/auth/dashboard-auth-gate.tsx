"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardCompanyContextSync } from "@/components/dashboard/dashboard-company-context-sync";
import { useAuthSession } from "@/features/auth/auth-session-provider";

export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === "signed_out") {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [pathname, router, status]);

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
        Firebase public env eksik oldugu icin dashboard auth gate pasif.
      </div>
    );
  }

  return (
    <>
      <DashboardCompanyContextSync />
      {children}
    </>
  );
}
