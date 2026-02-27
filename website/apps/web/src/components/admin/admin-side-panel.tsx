"use client";

import { AdminQuickActionList } from "@/components/admin/admin-quick-action-list";
import { AdminPhase5ReadinessCard } from "@/components/admin/admin-phase5-readiness-card";
import { AdminReleaseGateCard } from "@/components/admin/admin-release-gate-card";
import type { AdminQuickAction } from "@/components/admin/admin-operations-helpers";
import { type AdminPhase5ReadinessState } from "@/components/admin/use-admin-phase5-readiness-state";

type DataLoadStatus = "idle" | "loading" | "success" | "error";

type AdminLoadStateRow = {
  key: string;
  label: string;
  status: DataLoadStatus;
};

type AdminSidePanelProps = {
  quickActions: AdminQuickAction[];
  quickActionBadgeByHref: Record<string, number>;
  loadStateRows: readonly AdminLoadStateRow[];
  readiness: AdminPhase5ReadinessState;
  freshnessLabel: string;
  freshnessTone: "ok" | "warn";
  freshnessUpdatedLabel: string;
};

function toLoadStatusLabel(status: DataLoadStatus): string {
  if (status === "success") return "Hazir";
  if (status === "loading") return "Yukleniyor";
  if (status === "error") return "Hata";
  return "Beklemede";
}

export function AdminSidePanel({
  quickActions,
  quickActionBadgeByHref,
  loadStateRows,
  readiness,
  freshnessLabel,
  freshnessTone,
  freshnessUpdatedLabel,
}: AdminSidePanelProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Hizli Operasyon Gecisleri</h3>
        <AdminQuickActionList
          items={quickActions}
          badgeCountByHref={quickActionBadgeByHref}
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Veri Durumu</h3>
        <div className="mt-3 space-y-2">
          {loadStateRows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2"
            >
              <span className="text-xs font-medium text-slate-700">{row.label}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  row.status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : row.status === "loading"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : row.status === "error"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-line bg-slate-50 text-slate-600"
                }`}
              >
                {toLoadStatusLabel(row.status)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <AdminPhase5ReadinessCard
        readiness={readiness}
        freshnessLabel={freshnessLabel}
        freshnessTone={freshnessTone}
        freshnessUpdatedLabel={freshnessUpdatedLabel}
      />

      <AdminReleaseGateCard />

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">Faz 3 Notu</h3>
        <p className="mt-1 text-xs leading-5 text-amber-800">
          Bu ekran read-side operasyon ozetini ve risk triage panelini acti. Billing ve full internal
          admin aksiyon katmani Faz 7 kapsaminda acilacak.
        </p>
      </section>
    </div>
  );
}
