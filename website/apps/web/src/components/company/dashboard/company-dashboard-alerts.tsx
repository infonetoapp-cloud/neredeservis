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
  badge: string;
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
    const hasItems = items.length > 0;

    if (snapshotStatus === "loading" && !hasItems) {
      alerts.push({
        key: "snapshot-loading",
        badge: "Bilgi",
        title: "Canlı operasyon hazırlanıyor",
        detail: "İlk veri senkronizasyonu sürüyor. Birkaç saniye içinde bu alanda güncel durum görünecek.",
        tone: "border-sky-200 bg-sky-50 text-sky-900",
      });
    }

    if (snapshotStatus === "error") {
      alerts.push({
        key: "snapshot-error",
        badge: hasItems ? "Uyarı" : "Bilgi",
        title: hasItems ? "Canlı akışta geçici kesinti" : "Canlı bağlantı henüz kurulamıyor",
        detail:
          errorMessage ??
          "Canlı operasyon verisi şu an alınamıyor. Sistem hazır olduğunda akış otomatik olarak güncellenecek.",
        tone: hasItems
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-slate-50 text-slate-800",
      });
    }

    if (noSignal.length > 0) {
      alerts.push({
        key: "no-signal",
        badge: "Uyarı",
        title: "Bağlantısı kopan hatlar",
        detail: `${noSignal.length} hatta canlı konum verisi alınamıyor.`,
        tone: "border-orange-200 bg-orange-50 text-orange-900",
      });
    }

    if (stale.length > 0) {
      alerts.push({
        key: "stale",
        badge: "Takip",
        title: "Konumu geciken hatlar",
        detail: `${stale.length} hattın konum bilgisi geç güncelleniyor.`,
        tone: "border-amber-200 bg-amber-50 text-amber-900",
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        key: "healthy",
        badge: "İyi",
        title: "Operasyon dengede",
        detail:
          idle.length > 0
            ? `${idle.length} rota şu an beklemede. Anlık risk görünmüyor.`
            : "Kritik veya orta seviye uyarı bulunmuyor.",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
      });
    }

    return alerts.slice(0, 4);
  }, [errorMessage, items, snapshotStatus]);

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold tracking-[0.14em] text-[#7d8693] uppercase">Operasyon Durumu</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-950">Anlık risk özeti</h2>
      <div className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <article key={row.key} className={`rounded-2xl border px-3 py-2.5 ${row.tone}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">{row.title}</div>
              <span className="rounded-full border border-current/20 bg-white/70 px-2 py-0.5 text-[11px] font-semibold">
                {row.badge}
              </span>
            </div>
            <div className="mt-1 text-xs">{row.detail}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
