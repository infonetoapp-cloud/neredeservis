"use client";

import { useDashboardDensity } from "@/features/dashboard/use-dashboard-density";

const TRIPS = [
  { plate: "34 ABC 12", route: "Fabrika A - Merkez", status: "Canli", eta: "12 dk" },
  { plate: "06 NS 34", route: "Kuzey Hatti", status: "Stale", eta: "18 dk" },
  { plate: "35 SRV 1", route: "Guney Hatti", status: "Canli", eta: "7 dk" },
  { plate: "16 OPS 77", route: "Personel Ring", status: "Offline", eta: "-" },
] as const;

function statusClasses(status: string) {
  if (status === "Canli") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "Stale") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function LiveOpsSplitViewPlaceholder() {
  const density = useDashboardDensity();
  const rowClass = density === "compact" ? "px-3 py-2" : "px-3 py-3";

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.25fr_0.8fr]">
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Aktif Seferler</div>
            <div className="text-xs text-muted">Live ops ornek liste gorunumu</div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Offline Gizle
          </button>
        </div>

        <div className="space-y-2">
          {TRIPS.map((trip, index) => (
            <button
              key={trip.plate}
              type="button"
              className={`w-full rounded-xl border text-left transition ${
                index === 0
                  ? "border-blue-200 bg-blue-50/70 ring-1 ring-blue-100"
                  : "border-line bg-white hover:bg-slate-50"
              } ${rowClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{trip.plate}</div>
                  <div className="mt-1 text-xs text-muted">{trip.route}</div>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(
                    trip.status,
                  )}`}
                >
                  {trip.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted">ETA: {trip.eta}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Harita / Split View</div>
            <div className="text-xs text-muted">Harita + overlay ornek gorunumu</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              Density: {density}
            </span>
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              Filtre ornekleri
            </span>
          </div>
        </div>

        <div className="relative h-[360px] overflow-hidden rounded-xl border border-line bg-gradient-to-br from-slate-100 via-white to-blue-50">
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <div className="rounded-xl border border-line bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm">
              34 ABC 12 secili | Son sinyal 12 sn once
            </div>
            <div className="rounded-xl border border-line bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm">
              Route progress: %62
            </div>
          </div>

          <div className="absolute left-[16%] top-[32%] h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_6px_rgba(37,99,235,0.16)]" />
          <div className="absolute left-[48%] top-[50%] h-3 w-3 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)]" />
          <div className="absolute left-[64%] top-[24%] h-3 w-3 rounded-full border-2 border-slate-400 bg-white" />

          <div className="absolute inset-x-6 bottom-6">
            <div className="h-1.5 rounded-full bg-slate-200">
              <div className="h-1.5 w-[62%] rounded-full bg-blue-600" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-900">Secili Kayit Detayi</div>
        <div className="space-y-2">
          {[
            ["Sofor", "Ahmet K."],
            ["Arac", "34 ABC 12"],
            ["Rota", "Fabrika A - Merkez"],
            ["Durum", "Canli (12 sn)"],
            ["Son Durak", "Durak 8 / 14"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-white px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {label}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Detay Ac (Ornek)
          </button>
          <button
            type="button"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Sofore Ulas (Ornek)
          </button>
          <button
            type="button"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            WhatsApp ile Gonder (Ornek)
          </button>
        </div>
      </section>
    </div>
  );
}
