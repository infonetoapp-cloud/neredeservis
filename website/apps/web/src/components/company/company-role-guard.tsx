"use client";

import Link from "next/link";
import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { type CompanyMemberRole } from "@/features/company/company-client";

type Props = {
  companyId: string;
  requiredRoles: CompanyMemberRole[];
  children: ReactNode;
};

export function CompanyRoleGuard({ companyId, requiredRoles, children }: Props) {
  const router = useRouter();
  const { loading, hasActiveMembership, memberRole, errorMessage } = useCompanyMembership();

  const normalizedCompanyId = useMemo(() => companyId.trim(), [companyId]);
  const requiredRolesSet = useMemo(() => new Set(requiredRoles), [requiredRoles]);
  const hasRequiredRole = hasActiveMembership && !!memberRole && requiredRolesSet.has(memberRole);
  const dashboardHref = `/c/${encodeURIComponent(normalizedCompanyId)}/dashboard`;

  useEffect(() => {
    if (!loading && !errorMessage && !hasRequiredRole) {
      router.replace(dashboardHref);
    }
  }, [dashboardHref, errorMessage, hasRequiredRole, loading, router]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted shadow-sm">
        Rol dogrulamasi yapiliyor...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
        <div className="font-semibold">Rol dogrulanamadi</div>
        <div className="mt-1">{errorMessage ?? "Bilinmeyen doğrulama hatasi."}</div>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex items-center rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          Genel bakışa dön
        </Link>
      </div>
    );
  }

  if (!hasRequiredRole) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-sm">
        <div className="font-semibold">Bu islem için rol yetkin yok</div>
        <div className="mt-1">
          Members modulu owner/admin rolleri ile acilir. Dashboard&apos;a yonlendiriliyorsun.
        </div>
        <Link
          href={dashboardHref}
          className="mt-3 inline-flex items-center rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100"
        >
          Dashboard&apos;a don
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

