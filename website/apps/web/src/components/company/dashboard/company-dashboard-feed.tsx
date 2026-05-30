"use client";

import Link from "next/link";
import { useMemo } from "react";

import { type CompanyLiveOpsItem, type CompanyLiveOpsStatus } from "@/features/company/company-client";

type Props = {
  companyId: string;
  items: CompanyLiveOpsItem[];
  generatedAt: string | null;
};

function toStatusPriority(status: CompanyLiveOpsStatus): number {
  if (status === "no_signal") {
    return 0;
  }
  if (status === "stale") {
    return 1;
  }
  if (status === "live") {
    return 2;
  }
  return 3;
}

function toStatusTone(status: CompanyLiveOpsStatus): string {
  if (status === "live") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "stale") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "no_signal") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function toStatusLabel(status: CompanyLiveOpsStatus): string {
  if (status === "no_signal") {
    return "Bağlantı yok";
  }
  if (status === "stale") {
    return "Konum gecikmeli";
  }
  if (status === "live") {
    return "Canlı";
  }
  return "Sefer bekliyor";
}

export function CompanyDashboardFeed({ companyId, items, generatedAt }: Props) {
  const visibleItems = useMemo(() => {
    return [...items]
      .sort((left, right) => {
        const statusDiff = toStatusPriority(left.status) - toStatusPriority(right.status);
        if (statusDiff !== 0) {
          return statusDiff;
        }
        return (right.locationTimestampMs ?? 0) - (left.locationTimestampMs ?? 0);
      })
      .slice(0, 8);
  }, [items]);

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8693]">Canlı Durum</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Canlı operasyon akışı</h2>
          <p className="mt-1 text-xs text-[#6f7783]">
            Son yenileme: {generatedAt ? new Date(generatedAt).toLocaleTimeString("tr-TR") : "-"}
          </p>
        </div>
        <Link
          href={`/c/${encodeURIComponent(companyId)}/live-ops`}
          className="inline-flex items-center rounded-xl border border-line bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
        >
          Detaya git
        </Link>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-[#fafbfd] p-4 text-sm text-[#6f7783]">
          <p>Henüz canlı hareket yok. İlk aktif sefer başladığında burada görünecek.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/routes"
              className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Rotalara git
            </Link>
            <Link
              href="/vehicles"
              className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Araçları yönet
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const lastSeen = item.locationTimestampMs
              ? new Date(item.locationTimestampMs).toLocaleTimeString("tr-TR")
              : "-";
            const tripStateLabel = item.tripId ? "Aktif sefer" : "Sefer bekliyor";
            return (
              <article
                key={item.routeId}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-[#fbfcfd] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{item.routeName}</div>
                  <div className="mt-0.5 text-xs text-[#6f7783]">{tripStateLabel}</div>
                </div>
                <div className="text-xs text-[#6f7783]">Son sinyal: {lastSeen}</div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toStatusTone(item.status)}`}>
                  {toStatusLabel(item.status)}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
