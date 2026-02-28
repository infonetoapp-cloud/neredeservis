"use client";

import type { CompanySummary } from "@/components/dashboard/dashboard-mode-placeholder-helpers";
import type { PanelMode } from "@/features/mode/mode-preference";

type DashboardKpiGridProps = {
  mode: PanelMode;
  companySummary: CompanySummary | null;
  loading: boolean;
};

type DashboardKpiItem = {
  label: string;
  value: string;
  hint?: string;
};

export function DashboardKpiGrid({ mode, companySummary, loading }: DashboardKpiGridProps) {
  const companyActiveMembers = Math.max(
    0,
    (companySummary?.members ?? 0) -
      (companySummary?.invitedMembers ?? 0) -
      (companySummary?.suspendedMembers ?? 0),
  );

  const kpis =
    mode === "individual"
      ? ([
          {
            label: "Bugunku Sefer",
            value: loading ? "..." : String(companySummary?.activeTrips ?? 0),
          },
          {
            label: "Planli Rota",
            value: loading ? "..." : String(companySummary?.routes ?? 0),
          },
          {
            label: "Aktif Arac",
            value: loading ? "..." : String(companySummary?.activeVehicles ?? 0),
          },
          {
            label: "Durum",
            value: loading
              ? "Yukleniyor"
              : (companySummary?.activeTrips ?? 0) > 0
                ? "Operasyon"
                : "Hazir",
          },
        ] satisfies DashboardKpiItem[])
      : ([
          {
            label: "Aktif Sefer",
            value: loading ? "..." : String(companySummary?.activeTrips ?? 0),
          },
          {
            label: "Aktif Arac",
            value: loading ? "..." : String(companySummary?.activeVehicles ?? 0),
          },
          {
            label: "Uye Sayisi",
            value: loading ? "..." : String(companySummary?.members ?? 0),
            hint: loading
              ? "Uyeler yukleniyor..."
              : `Aktif ${companyActiveMembers} | Davet ${companySummary?.invitedMembers ?? 0} | Askida ${
                  companySummary?.suspendedMembers ?? 0
                }`,
          },
          {
            label: "Rota Sayisi",
            value: loading ? "..." : String(companySummary?.routes ?? 0),
          },
        ] satisfies DashboardKpiItem[]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((item) => (
        <div key={item.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs font-medium text-muted">{item.label}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</div>
          {item.hint ? <div className="mt-2 text-[11px] text-slate-500">{item.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
