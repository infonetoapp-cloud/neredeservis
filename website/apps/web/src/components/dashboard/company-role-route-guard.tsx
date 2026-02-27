"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { CompanyModeRouteGuard } from "@/components/dashboard/company-mode-route-guard";
import { roleLabel } from "@/components/dashboard/drivers-company-members-helpers";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";
import type { CompanyMemberRole } from "@/features/company/company-types";

type CompanyRoleRouteGuardProps = {
  routeLabel: string;
  allowedRoles: readonly CompanyMemberRole[];
  children: ReactNode;
};

export function CompanyRoleRouteGuard({
  routeLabel,
  allowedRoles,
  children,
}: CompanyRoleRouteGuardProps) {
  const { status, role, memberStatus } = useActiveCompanyMembership();

  return (
    <CompanyModeRouteGuard routeLabel={routeLabel}>
      {status === "loading" ? (
        <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
          Company uyeligi dogrulaniyor...
        </div>
      ) : status === "error" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {routeLabel} icin role dogrulamasi yapilamadi. Uyelik listesi yuklenemedi.
          </div>
          <Link
            href="/dashboard?mode=company"
            className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Dashboard&apos;a Don
          </Link>
        </div>
      ) : !role || !memberStatus ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Secili company icinde aktif bir uyelik bulunamadi. {routeLabel} erisimi acilamadi.
          </div>
          <Link
            href="/mode-select"
            className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Company Secimine Git
          </Link>
        </div>
      ) : memberStatus !== "active" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Uyeliginin durumu <strong>{memberStatus}</strong>. {routeLabel} yalnizca aktif uye
            durumunda acilabilir.
          </div>
          <Link
            href="/dashboard?mode=company"
            className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Dashboard&apos;a Don
          </Link>
        </div>
      ) : !allowedRoles.includes(role) ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Bu ekran icin rol yetkin yok. Mevcut rol: <strong>{roleLabel(role)}</strong>.
          </div>
          <Link
            href="/dashboard?mode=company"
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

