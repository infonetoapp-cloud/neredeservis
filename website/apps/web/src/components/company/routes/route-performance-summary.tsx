"use client";

import type { CompanyRouteItem, CompanyRouteStopItem } from "@/features/company/company-client";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";

type Props = {
  companyId: string;
  selectedRoute: CompanyRouteItem | null;
  sortedRouteStops: CompanyRouteStopItem[] | null;
  driverName?: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Bilgi yok";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return "Bilgi yok";
  return new Date(ts).toLocaleString("tr-TR");
}

function formatTimeSlot(value: string | null): string {
  switch (value) {
    case "morning":
      return "Sabah";
    case "midday":
      return "Öğlen";
    case "evening":
      return "Akşam";
    case "custom":
      return "Özel";
    default:
      return "Belirtilmemiş";
  }
}

export function RoutePerformanceSummary({ companyId, selectedRoute, sortedRouteStops, driverName = null }: Props) {
  const { items: activeTrips, status: tripStatus } = useCompanyActiveTrips(
    companyId,
    !!selectedRoute,
    selectedRoute ? { routeId: selectedRoute.routeId, limit: 5 } : undefined,
  );

  if (!selectedRoute) return null;

  const stopCount = sortedRouteStops?.length ?? 0;
  const activeTrip = activeTrips.find((trip) => trip.routeId === selectedRoute.routeId);
  const hasVehicle = !!selectedRoute.vehicleId;

  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Seçili rota</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{selectedRoute.name}</div>
          <p className="mt-1 text-xs text-muted">
            Rota sağlığı, zamanlama ve atama durumunu tek bakışta gör.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              selectedRoute.isArchived
                ? "border-slate-300 bg-slate-100 text-slate-600"
                : "border-[#cde6df] bg-[#edf9f6] text-[#186355]"
            }`}
          >
            {selectedRoute.isArchived ? "Arşiv" : "Aktif rota"}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              selectedRoute.allowGuestTracking
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            Misafir takip {selectedRoute.allowGuestTracking ? "açık" : "kapalı"}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              driverName
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {driverName ? `Şoför ${driverName}` : "Şoför seçilmedi"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-line bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Yolcu sayısı</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{selectedRoute.passengerCount}</div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Ara durak sayısı</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{stopCount}</div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Zaman dilimi</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{formatTimeSlot(selectedRoute.timeSlot)}</div>
          <div className="mt-0.5 text-[11px] text-muted">{selectedRoute.scheduledTime ?? "Saat belirtilmemiş"}</div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Araç durumu</div>
          <div className="mt-1 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${hasVehicle ? "bg-emerald-500" : "bg-amber-400"}`} />
            <span className="text-sm font-semibold text-slate-900">{hasVehicle ? selectedRoute.vehiclePlate : "Atanmamış"}</span>
          </div>
        </article>
      </div>

      {activeTrip ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-emerald-900">Aktif sefer devam ediyor</span>
          </div>
          <div className="mt-2 grid gap-2 text-xs text-emerald-900 sm:grid-cols-3">
            <div>
              <span className="text-[11px] text-emerald-700">Şoför: </span>
              {activeTrip.driverName}
            </div>
            <div>
              <span className="text-[11px] text-emerald-700">Başlangıç: </span>
              {formatDateTime(activeTrip.startedAt)}
            </div>
            <div>
              <span className="text-[11px] text-emerald-700">Durum: </span>
              {activeTrip.liveState === "online" ? "Canlı" : "Gecikme / bağlantı yok"}
            </div>
          </div>
        </div>
      ) : tripStatus === "loading" ? (
        <div className="mt-3 rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Aktif sefer bilgisi kontrol ediliyor...
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Bu rotada şu an aktif sefer bulunmuyor.
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-xs text-slate-600">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Başlangıç</div>
          <div className="mt-1 leading-5 text-slate-700">{selectedRoute.startAddress ?? "Belirtilmemiş"}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-xs text-slate-600">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Bitiş</div>
          <div className="mt-1 leading-5 text-slate-700">{selectedRoute.endAddress ?? "Belirtilmemiş"}</div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-muted">
        Son güncelleme: {formatDateTime(selectedRoute.updatedAt)} | {selectedRoute.isArchived ? "Arşivlenmiş rota" : "Aktif kayıt"}
      </div>
    </section>
  );
}
