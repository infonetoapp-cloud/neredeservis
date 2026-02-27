"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useActivePanelMode } from "@/features/mode/use-active-panel-mode";

export function CompanyModeRouteGuard({
  routeLabel,
  children,
}: {
  routeLabel: string;
  children: ReactNode;
}) {
  const { resolvedMode } = useActivePanelMode();
  const activeCompany = useActiveCompanyPreference();

  if (!resolvedMode) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {routeLabel} ekranini acmak icin once bir panel modu secilmelidir.
        </div>
        <Link
          href="/mode-select"
          className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Mod Secim Ekranina Git
        </Link>
      </section>
    );
  }

  if (resolvedMode !== "company") {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          {routeLabel} ekrani yalnizca <strong>Company Mode</strong> icin kullanilabilir.
          Bireysel mod secili oldugu icin bu ekrana erisim kisitli.
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/mode-select"
            className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Company Mode&apos;a Gec
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

  if (!activeCompany) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {routeLabel} ekranini acmak icin <strong>Company Mode</strong> secili ama aktif company
          secimi bulunamadi.
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/mode-select"
            className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Company Secimine Git
          </Link>
          <Link
            href="/dashboard?mode=company"
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
