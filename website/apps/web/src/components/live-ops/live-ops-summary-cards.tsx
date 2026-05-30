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
  const hasAnyOperation =
    safeSummary.routesTracked > 0 ||
    safeSummary.activeTrips > 0 ||
    safeSummary.liveRoutes > 0 ||
    safeSummary.attentionRoutes > 0;

  if (!loading && !hasAnyOperation) {
    return (
      <section className="rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8693]">Canlı Özet</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">Şu anda aktif canlı operasyon yok</h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Durum: Beklemede
          </span>
        </div>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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