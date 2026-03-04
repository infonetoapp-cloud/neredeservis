"use client";

import { useMemo } from "react";

import { useCompanyLiveOpsSnapshot } from "@/components/live-ops/company-live-ops-snapshot-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { type CompanyLiveOpsItem } from "@/features/company/company-client";

type SummaryState = {
  routesTracked: number;
  activeTrips: number;
  liveRoutes: number;
  attentionRoutes: number;
};

const EMPTY_SUMMARY: SummaryState = {
  routesTracked: 0,
  activeTrips: 0,
  liveRoutes: 0,
  attentionRoutes: 0,
};

function toSummary(items: CompanyLiveOpsItem[]): SummaryState {
  let activeTrips = 0;
  let liveRoutes = 0;
  let attentionRoutes = 0;

  for (const item of items) {
    if (item.tripId) {
      activeTrips += 1;
    }
    if (item.status === "live") {
      liveRoutes += 1;
    }
    if (item.status === "stale" || item.status === "no_signal") {
      attentionRoutes += 1;
    }
  }

  return {
    routesTracked: items.length,
    activeTrips,
    liveRoutes,
    attentionRoutes,
  };
}

export function LiveOpsSummaryCards() {
  const { status, items } = useCompanyLiveOpsSnapshot();
  const summary = useMemo(() => toSummary(items), [items]);
  const safeSummary = status === "error" ? EMPTY_SUMMARY : summary;
  const loading = status === "loading";

  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Takipteki Hat"
        value={safeSummary.routesTracked}
        hint="Şirkete bağlı izlenen toplam rota"
        accent="indigo"
        loading={loading}
      />
      <KpiCard
        label="Seferdeki Araç"
        value={safeSummary.activeTrips}
        hint="Şu anda aktif operasyon yürütenler"
        accent="rose"
        loading={loading}
      />
      <KpiCard
        label="Canlı Konum"
        value={safeSummary.liveRoutes}
        hint="Anlık konumu düzenli akan hatlar"
        accent="emerald"
        loading={loading}
      />
      <KpiCard
        label="Takip Gereken"
        value={safeSummary.attentionRoutes}
        hint="Konumu geciken veya bağlantısı kopanlar"
        accent="amber"
        loading={loading}
      />
    </div>
  );
}
