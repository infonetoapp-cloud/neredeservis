"use client";

import type { CompanySummary } from "@/components/dashboard/dashboard-mode-placeholder-helpers";

type DashboardKpiGridProps = {
  companySummary: CompanySummary | null;
  loading: boolean;
};

type KpiItem = {
  label: string;
  value: string;
  hint?: string;
  accent: string;  /* tailwind bg color for top bar */
};

export function DashboardKpiGrid({ companySummary, loading }: DashboardKpiGridProps) {
  const companyActiveMembers = Math.max(
    0,
    (companySummary?.members ?? 0) -
      (companySummary?.invitedMembers ?? 0) -
      (companySummary?.suspendedMembers ?? 0),
  );

  const kpis: KpiItem[] = [
    {
      label: "Aktif Sefer",
      value: loading ? "—" : String(companySummary?.activeTrips ?? 0),
      accent: "bg-emerald-500",
    },
    {
      label: "Aktif Araç",
      value: loading ? "—" : String(companySummary?.activeVehicles ?? 0),
      accent: "bg-blue-500",
    },
    {
      label: "Üye",
      value: loading ? "—" : String(companySummary?.members ?? 0),
      hint: loading
        ? undefined
        : `${companyActiveMembers} aktif · ${companySummary?.invitedMembers ?? 0} davet`,
      accent: "bg-violet-500",
    },
    {
      label: "Rota",
      value: loading ? "—" : String(companySummary?.routes ?? 0),
      accent: "bg-orange-400",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
      {kpis.map((item) => (
        <div
          key={item.label}
          className="relative overflow-hidden rounded-2xl bg-white px-5 pt-5 pb-4 shadow-sm ring-1 ring-slate-900/5"
        >
          {/* colored top accent line */}
          <div className={`absolute inset-x-0 top-0 h-[3px] ${item.accent}`} />
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {item.label}
          </div>
          <div
            className={`mt-2 text-[2.6rem] font-extrabold leading-none tracking-tight ${
              loading ? "text-slate-300" : "text-slate-900"
            }`}
          >
            {item.value}
          </div>
          {item.hint ? (
            <div className="mt-2 text-[11px] text-slate-400">{item.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
