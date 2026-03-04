"use client";

import type { CompanyRouteItem, CompanyRouteStopItem } from "@/features/company/company-client";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";

type Props = {
  companyId: string;
  selectedRoute: CompanyRouteItem | null;
  sortedRouteStops: CompanyRouteStopItem[] | null;
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Bilgi yok";
  }
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) {
    return "Bilgi yok";
  }
  return new Date(ts).toLocaleString("tr-TR");
}

function formatTimeSlot(value: string | null): string {
  switch (value) {
    case "morning":
      return "Sabah";
    case "midday":
      return "Ogle";
    case "evening":
      return "Aksam";
    case "custom":
      return "Ozel";
    default:
      return "Belirtilmemis";
  }
}

export function RoutePerformanceSummary({ companyId, selectedRoute, sortedRouteStops }: Props) {
  const { items: activeTrips, status: tripStatus } = useCompanyActiveTrips(
    companyId,
    !!selectedRoute,
    selectedRoute ? { routeId: selectedRoute.routeId, limit: 5 } : undefined,
  );

  if (!selectedRoute) {
    return null;
  }

  const stopCount = sortedRouteStops?.length ?? 0;
  const activeTrip = activeTrips.find((trip) => trip.routeId === selectedRoute.routeId);
  const hasVehicle = !!selectedRoute.vehicleId;

  return (
    <section className="glass-panel rounded-2xl p-5">
      <div className="mb-3 text-sm font-semibold text-slate-900">
        Rota ozeti — {selectedRoute.name}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-line bg-white p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Yolcu sayisi
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {selectedRoute.passengerCount}
          </div>
        </article>

        <article className="rounded-xl border border-line bg-white p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Durak sayisi
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {stopCount}
          </div>
        </article>

        <article className="rounded-xl border border-line bg-white p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Zaman dilimi
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {formatTimeSlot(selectedRoute.timeSlot)}
          </div>
          <div className="mt-0.5 text-[11px] text-muted">
            {selectedRoute.scheduledTime ?? "Saat belirtilmemis"}
          </div>
        </article>

        <article className="rounded-xl border border-line bg-white p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Arac durumu
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${hasVehicle ? "bg-emerald-500" : "bg-amber-400"}`}
            />
            <span className="text-sm font-semibold text-slate-900">
              {hasVehicle ? selectedRoute.vehiclePlate : "Atanmamis"}
            </span>
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
              <span className="text-[11px] text-emerald-700">Sofor: </span>
              {activeTrip.driverName}
            </div>
            <div>
              <span className="text-[11px] text-emerald-700">Baslangic: </span>
              {formatDateTime(activeTrip.startedAt)}
            </div>
            <div>
              <span className="text-[11px] text-emerald-700">Durum: </span>
              {activeTrip.liveState === "online" ? "Canli" : "Gecikme / Baglanti yok"}
            </div>
          </div>
        </div>
      ) : tripStatus === "loading" ? (
        <div className="mt-3 rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Aktif sefer bilgisi kontrol ediliyor...
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Bu rotada su an aktif sefer bulunmuyor.
        </div>
      )}

      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div>
          <span className="font-semibold text-slate-700">Baslangic: </span>
          {selectedRoute.startAddress ?? "Belirtilmemis"}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Bitis: </span>
          {selectedRoute.endAddress ?? "Belirtilmemis"}
        </div>
      </div>

      <div className="mt-2 text-[11px] text-muted">
        Son guncelleme: {formatDateTime(selectedRoute.updatedAt)} |{" "}
        {selectedRoute.allowGuestTracking ? "Misafir takip: Acik" : "Misafir takip: Kapali"} |{" "}
        {selectedRoute.isArchived ? "Arsivlenmis" : "Aktif rota"}
      </div>
    </section>
  );
}
