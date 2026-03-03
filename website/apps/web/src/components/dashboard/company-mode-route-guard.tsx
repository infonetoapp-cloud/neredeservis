"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";

/**
 * Aktif company seçimi zorunlu kılan route guard.
 * MVP'de PanelMode kaldırıldı — web her zaman company modunda çalışır.
 * Yalnızca aktif company varlığını kontrol eder.
 */
export function CompanyModeRouteGuard({
  routeLabel,
  children,
}: {
  routeLabel: string;
  children: ReactNode;
}) {
  const activeCompany = useActiveCompanyPreference();

  if (!activeCompany) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {routeLabel} ekranini acmak icin aktif bir firma secimi gerekli.
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/select-company"
            className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Firma Secimine Git
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Dashboard&apos;a Don
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
