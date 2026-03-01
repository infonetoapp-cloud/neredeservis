"use client";

import { useMemo } from "react";

import { type CompanyLiveOpsItem } from "@/features/company/company-client";

type Props = {
  snapshotStatus: "loading" | "ready" | "error";
  errorMessage: string | null;
  items: CompanyLiveOpsItem[];
};

type AlertRow = {
  key: string;
  level: "P0" | "P1" | "P2";
  title: string;
  detail: string;
  tone: string;
};

export function CompanyDashboardAlerts({ snapshotStatus, errorMessage, items }: Props) {
  const rows = useMemo<AlertRow[]>(() => {
    const alerts: AlertRow[] = [];
    const noSignal = items.filter((item) => item.status === "no_signal");
    const stale = items.filter((item) => item.status === "stale");
    const idle = items.filter((item) => item.status === "idle");

    if (snapshotStatus === "error") {
      alerts.push({
        key: "snapshot-error",
        level: "P0",
        title: "Canli veri alinmadi",
        detail: errorMessage ?? "Canli operasyon verisi alinirken baglanti sorunu olustu.",
        tone: "border-rose-200 bg-rose-50 text-rose-800",
      });
    }

    if (noSignal.length > 0) {
      alerts.push({
        key: "no-signal",
        level: "P1",
        title: "Baglantisi kopan hatlar",
        detail: `${noSignal.length} hatta canli konum verisi alinmiyor.`,
        tone: "border-orange-200 bg-orange-50 text-orange-800",
      });
    }

    if (stale.length > 0) {
      alerts.push({
        key: "stale",
        level: "P2",
        title: "Konumu geciken hatlar",
        detail: `${stale.length} hattin konum bilgisi gec guncelleniyor.`,
        tone: "border-amber-200 bg-amber-50 text-amber-800",
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        key: "healthy",
        level: "P2",
        title: "Sistem stabil",
        detail:
          idle.length > 0
            ? `${idle.length} rota su an beklemede. Kritik uyari yok.`
            : "Kritik veya orta seviye uyari bulunmuyor.",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      });
    }

    return alerts.slice(0, 4);
  }, [errorMessage, items, snapshotStatus]);

  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold tracking-[0.14em] text-[#7d8693] uppercase">Risk Merkezi</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-950">Kritik aciklar ve uyarilar</h2>
      <div className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <article key={row.key} className={`rounded-2xl border px-3 py-2.5 ${row.tone}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">{row.title}</div>
              <span className="rounded-full border border-current/20 bg-white/70 px-2 py-0.5 text-[11px] font-semibold">
                {row.level}
              </span>
            </div>
            <div className="mt-1 text-xs">{row.detail}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
