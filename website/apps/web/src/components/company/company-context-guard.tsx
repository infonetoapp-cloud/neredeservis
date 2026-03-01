"use client";

import Link from "next/link";
import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { AppLockPanel, type AppLockReason } from "@/components/shared/app-lock-panel";

type Props = {
  companyId: string;
  children: ReactNode;
};

export function CompanyContextGuard({ companyId, children }: Props) {
  const router = useRouter();
  const { loading, hasActiveMembership, lockReason, errorMessage } = useCompanyMembership();

  const normalizedCompanyId = useMemo(() => companyId.trim(), [companyId]);

  useEffect(() => {
    if (!loading && !errorMessage && !hasActiveMembership && !lockReason) {
      router.replace("/select-company");
    }
  }, [errorMessage, hasActiveMembership, loading, lockReason, router]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 text-sm text-muted">
        Sirket baglami dogrulaniyor...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
        <div className="font-semibold">Sirket baglami dogrulanamadi</div>
        <div className="mt-1">{errorMessage ?? "Bilinmeyen dogrulama hatasi."}</div>
        <div className="mt-3">
          <Link
            href="/select-company"
            className="inline-flex items-center rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Sirket secimine don
          </Link>
        </div>
      </div>
    );
  }

  if (lockReason) {
    const reasonMap: Record<
      Exclude<typeof lockReason, null>,
      AppLockReason
    > = {
      billing_locked: "billing_lock",
      company_archived: "company_archived",
      company_suspended: "company_suspended",
      membership_suspended: "membership_suspended",
    };
    const mappedReason = reasonMap[lockReason];
    return <AppLockPanel reason={mappedReason} companyId={normalizedCompanyId} />;
  }

  if (!hasActiveMembership) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900 shadow-sm">
        <div className="font-semibold">Bu sirket baglamina erisim yok</div>
        <div className="mt-1">
          companyId={normalizedCompanyId} icin aktif uyelik bulunamadi. Sirket secim ekranina don.
        </div>
        <div className="mt-3">
          <Link
            href="/select-company"
            className="inline-flex items-center rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100"
          >
            Sirket secimine don
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
