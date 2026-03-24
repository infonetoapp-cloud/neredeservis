"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DashboardCompanyContextSync } from "@/components/dashboard/dashboard-company-context-sync";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { isPlatformOwner } from "@/lib/env/public-env";

export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthSession();

  useEffect(() => {
    if (status === "signed_out") {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/giris${next}`);
      return;
    }
    if (status === "signed_in" && isPlatformOwner(user?.uid)) {
      router.replace("/platform/companies");
    }
  }, [pathname, router, status, user?.uid]);

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
        Backend auth env eksik oldugu icin dashboard auth gate pasif.
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
