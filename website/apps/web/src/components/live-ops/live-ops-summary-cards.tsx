"use client";

import { useMemo } from "react";

import { useCompanyLiveOpsSnapshot } from "@/components/live-ops/company-live-ops-snapshot-context";
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

  const cards = useMemo(
    () => [
      {
        label: "Takipteki Hat",
        value: String(safeSummary.routesTracked),
        hint: "Sirkete bagli izlenen toplam rota",
      },
      {
        label: "Seferdeki Arac",
        value: String(safeSummary.activeTrips),
        hint: "Su anda aktif operasyon yurutenler",
      },
      {
        label: "Canli Konum",
        value: String(safeSummary.liveRoutes),
        hint: "Anlik konumu duzenli akan hatlar",
      },
      {
        label: "Takip Gereken",
        value: String(safeSummary.attentionRoutes),
        hint: "Konumu geciken veya baglantisi kopanlar",
      },
    ],
    [safeSummary],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-line bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
        >
          <div className="text-xs font-semibold tracking-[0.12em] text-[#748091] uppercase">{card.label}</div>
          <div className="mt-2 text-3xl font-semibold leading-none text-slate-950">{card.value}</div>
          <div className="mt-2 text-xs text-[#697382]">{card.hint}</div>
        </div>
      ))}
    </div>
  );
}
