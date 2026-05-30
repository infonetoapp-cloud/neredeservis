"use client";

import { formatLoadTime, toBillingStatusLabel, toCompanyStatusLabel } from "@/components/admin/admin-operations-helpers";
import type { CompanyAdminTenantState } from "@/features/company/company-audit-callables";

type TenantLoadStatus = "idle" | "loading" | "success" | "error";

type AdminTenantStatePanelProps = {
  status: TenantLoadStatus;
  item: CompanyAdminTenantState | null;
};

export function AdminTenantStatePanel({ status, item }: AdminTenantStatePanelProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Tenant Erisim Durumu (Read-Only)</h3>
      <p className="mt-1 text-xs text-muted">
        Bu bolum suspension/lock politikasi için mevcut tenant durumunu gosterir.
      </p>
      {status === "loading" ? (
        <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted">
          Tenant durumu yukleniyor...
        </div>
      ) : !item ? (
        <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted">
          Tenant durumu bulunamadi.
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs text-muted">Company Status</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{toCompanyStatusLabel(item.companyStatus)}</div>
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs text-muted">Billing Status</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{toBillingStatusLabel(item.billingStatus)}</div>
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs text-muted">Billing Valid Until</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {item.billingValidUntil ? formatLoadTime(item.billingValidUntil) : "-"}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="text-xs text-muted">Tenant Updated At</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {item.updatedAt ? formatLoadTime(item.updatedAt) : "-"}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

