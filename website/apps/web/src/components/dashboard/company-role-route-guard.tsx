"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { CompanyModeRouteGuard } from "@/components/dashboard/company-mode-route-guard";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";
import type { CompanyMemberRole } from "@/features/company/company-types";

type CompanyRoleRouteGuardProps = {
  routeLabel: string;
  /** @deprecated MVP tek-rol — allowedRoles artık kontrol edilmiyor. */
  allowedRoles: readonly CompanyMemberRole[];
  children: ReactNode;
};

/**
 * Aktif üyelik durumunu kontrol eden route guard.
 * MVP tek-rol modeli: rol ayrımı yapılmaz, yalnızca aktif üyelik aranır.
 */
export function CompanyRoleRouteGuard({
  routeLabel,
  children,
}: CompanyRoleRouteGuardProps) {
  const { status, memberStatus } = useActiveCompanyMembership();

  return (
    <CompanyModeRouteGuard routeLabel={routeLabel}>
      {status === "loading" ? (
        <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
          Company uyeligi dogrulaniyor...
        </div>
      ) : status === "error" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {routeLabel} için üyelik doğrulaması yapılamadı. Üyelik listesi yüklenemedi.
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Dashboard&apos;a Don
          </Link>
        </div>
      ) : !memberStatus ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Secili firma icinde aktif bir uyelik bulunamadi. {routeLabel} erisimi acilamadi.
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Genel Bakışa Git
          </Link>
        </div>
      ) : memberStatus !== "active" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Uyeliginin durumu <strong>{memberStatus}</strong>. {routeLabel} yalnizca aktif uye
            durumunda acilabilir.
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Dashboard&apos;a Don
          </Link>
        </div>
      ) : (
        children
      )}
    </CompanyModeRouteGuard>
  );
}


