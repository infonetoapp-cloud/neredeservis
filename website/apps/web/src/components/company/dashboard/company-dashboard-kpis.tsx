"use client";

import { KpiCard, type KpiCardTrend } from "@/components/shared/kpi-card";

export type CompanyDashboardKpiInsights = {
  routesTracked: {
    trend: KpiCardTrend;
    sparkline: number[];
  };
  activeTrips: {
    trend: KpiCardTrend;
    sparkline: number[];
  };
  liveRoutes: {
    trend: KpiCardTrend;
    sparkline: number[];
  };
  attentionRoutes: {
    trend: KpiCardTrend;
    sparkline: number[];
  };
};

type Props = {
  routesTracked: number;
  activeTrips: number;
  liveRoutes: number;
  attentionRoutes: number;
  insights?: CompanyDashboardKpiInsights | null;
  loading?: boolean;
};

export function CompanyDashboardKpis({
  routesTracked,
  activeTrips,
  liveRoutes,
  attentionRoutes,
  insights,
  loading = false,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <KpiCard
        label="İzlenen Rota"
        value={routesTracked}
        hint="Canlı izlenen toplam rota"
        accent="indigo"
        trend={insights?.routesTracked.trend}
        sparkline={insights?.routesTracked.sparkline}
        loading={loading}
      />
      <KpiCard
        label="Aktif Sefer"
        value={activeTrips}
        hint="Şu anda seferde olan araçlar"
        accent="rose"
        trend={insights?.activeTrips.trend}
        sparkline={insights?.activeTrips.sparkline}
        loading={loading}
      />
      <KpiCard
        label="Canlı Hat"
        value={liveRoutes}
        hint="Son sinyali taze gelenler"
        accent="emerald"
        trend={insights?.liveRoutes.trend}
        sparkline={insights?.liveRoutes.sparkline}
        loading={loading}
      />
      <KpiCard
        label="Dikkat Gereken"
        value={attentionRoutes}
        hint="Konumu geciken veya bağlantısı kopanlar"
        accent="amber"
        trend={insights?.attentionRoutes.trend}
        sparkline={insights?.attentionRoutes.sparkline}
        loading={loading}
      />
    </div>
  );
}
