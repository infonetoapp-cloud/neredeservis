"use client";

import { KpiCard } from "@/components/shared/kpi-card";

type Props = {
  routesTracked: number;
  activeTrips: number;
  liveRoutes: number;
  attentionRoutes: number;
  loading?: boolean;
};

export function CompanyDashboardKpis({
  routesTracked,
  activeTrips,
  liveRoutes,
  attentionRoutes,
  loading = false,
}: Props) {
  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="İzlenen Rota"
        value={routesTracked}
        hint="Canlı izlenen toplam rota"
        accent="indigo"
        loading={loading}
      />
      <KpiCard
        label="Aktif Sefer"
        value={activeTrips}
        hint="Şu anda seferde olan araçlar"
        accent="rose"
        loading={loading}
      />
      <KpiCard
        label="Canlı Hat"
        value={liveRoutes}
        hint="Son sinyali taze gelenler"
        accent="emerald"
        loading={loading}
      />
      <KpiCard
        label="Dikkat Gereken"
        value={attentionRoutes}
        hint="Konumu geciken veya bağlantısı kopanlar"
        accent="amber"
        loading={loading}
      />
    </div>
  );
}

