"use client";

import type { CompanySummary } from "@/components/dashboard/dashboard-mode-placeholder-helpers";
import { KpiCard } from "@/components/shared/kpi-card";

type DashboardKpiGridProps = {
  companySummary: CompanySummary | null;
  loading: boolean;
};

export function DashboardKpiGrid({ companySummary, loading }: DashboardKpiGridProps) {
  const companyActiveMembers = Math.max(
    0,
    (companySummary?.members ?? 0) -
      (companySummary?.invitedMembers ?? 0) -
      (companySummary?.suspendedMembers ?? 0),
  );

  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Aktif Sefer"
        value={loading ? "—" : String(companySummary?.activeTrips ?? 0)}
        accent="emerald"
        loading={loading}
      />
      <KpiCard
        label="Aktif Araç"
        value={loading ? "—" : String(companySummary?.activeVehicles ?? 0)}
        accent="indigo"
        loading={loading}
      />
      <KpiCard
        label="Üye"
        value={loading ? "—" : String(companySummary?.members ?? 0)}
        hint={loading ? undefined : `${companyActiveMembers} aktif · ${companySummary?.invitedMembers ?? 0} davet`}
        accent="violet"
        loading={loading}
      />
      <KpiCard
        label="Rota"
        value={loading ? "—" : String(companySummary?.routes ?? 0)}
        accent="orange"
        loading={loading}
      />
    </div>
  );
}
