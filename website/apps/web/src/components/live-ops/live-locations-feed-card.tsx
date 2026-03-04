"use client";

import { useEffect, useMemo, useState } from "react";

import { useCompanyLiveOpsSnapshot } from "@/components/live-ops/company-live-ops-snapshot-context";
import { LiveOpsMapPanel } from "@/components/live-ops/live-ops-map-panel";
import {
  listCompanyDriversForCompany,
  listCompanyVehiclesForCompany,
  type CompanyDriverItem,
  type CompanyLiveOpsItem,
  type CompanyLiveOpsStatus,
  type CompanyVehicleItem,
} from "@/features/company/company-client";

type StreamStatus = "loading" | "live" | "empty" | "error";
type FilterKey = "all" | "live" | "active" | "attention";

type EnrichedLiveItem = CompanyLiveOpsItem & {
  driverName: string | null;
  vehiclePlate: string | null;
  vehicleLabel: string | null;
};

type Props = {
  companyId: string;
  maxItems?: number;
};

function toLiveOpsTone(status: CompanyLiveOpsStatus): string {
  if (status === "live") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "stale") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (status === "no_signal") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function toLiveOpsLabel(status: CompanyLiveOpsStatus): string {
  if (status === "live") {
    return "Canli";
  }
  if (status === "stale") {
    return "Konum gecikmeli";
  }
  if (status === "no_signal") {
    return "Baglanti kesildi";
  }
  return "Sefer bekliyor";
}

function toStreamStatus(snapshotStatus: "loading" | "ready" | "error", itemCount: number): StreamStatus {
  if (snapshotStatus === "error") {
    return "error";
  }
  if (snapshotStatus === "loading") {
    return "loading";
  }
  if (itemCount > 0) {
    return "live";
  }
  return "empty";
}

function toStreamStatusTone(status: StreamStatus): string {
  if (status === "live") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "loading") {
    return "border-[#b7ccc2] bg-[#e8f1ec] text-[#285849]";
  }
  if (status === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function toStreamStatusLabel(status: StreamStatus): string {
  if (status === "live") {
    return "Canli akis";
  }
  if (status === "loading") {
    return "Yukleniyor";
  }
  if (status === "error") {
    return "Hata";
  }
  return "Veri yok";
}

function toLastSeenLabel(timestampMs: number | null): string {
  if (timestampMs == null) {
    return "Konum verisi yok";
  }

  const diffMs = Math.max(0, Date.now() - timestampMs);
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) {
    return `${diffSeconds} sn once`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} dk once`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} sa once`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gun once`;
}

function normalizePlate(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function LiveLocationsFeedCard({ companyId, maxItems = 12 }: Props) {
  const { status: snapshotStatus, items, generatedAt, errorMessage } = useCompanyLiveOpsSnapshot();
  const [companyVehicles, setCompanyVehicles] = useState<CompanyVehicleItem[]>([]);
  const [companyDrivers, setCompanyDrivers] = useState<CompanyDriverItem[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState<FilterKey>("all");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listCompanyVehiclesForCompany({ companyId, limit: 300 }),
      listCompanyDriversForCompany({ companyId, limit: 300 }),
    ])
      .then(([vehicles, drivers]) => {
        if (cancelled) {
          return;
        }
        setCompanyVehicles(vehicles);
        setCompanyDrivers(drivers);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setCompanyVehicles([]);
        setCompanyDrivers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const enrichedItems = useMemo((): EnrichedLiveItem[] => {
    if (items.length === 0) {
      return [];
    }

    const driversById = new Map(companyDrivers.map((driver) => [driver.driverId, driver]));
    const vehiclesById = new Map(companyVehicles.map((vehicle) => [vehicle.vehicleId, vehicle]));
    const vehiclesByPlate = new Map(companyVehicles.map((vehicle) => [normalizePlate(vehicle.plate), vehicle]));
    const vehiclesBySuffix = new Map<string, CompanyVehicleItem[]>();
    for (const vehicle of companyVehicles) {
      const normalizedPlate = normalizePlate(vehicle.plate);
      const suffix = normalizedPlate.slice(-2);
      if (!suffix) {
        continue;
      }
      const bucket = vehiclesBySuffix.get(suffix) ?? [];
      bucket.push(vehicle);
      vehiclesBySuffix.set(suffix, bucket);
    }

    return items.map((item) => {
      const driver = item.driverId ? driversById.get(item.driverId) ?? null : null;
      const directVehicle = item.vehicleId ? vehiclesById.get(item.vehicleId) ?? null : null;
      let matchedVehicle = directVehicle;
      if (!matchedVehicle && driver) {
        const maskedPlate = normalizePlate(driver.plateMasked);
        const directByMaskedPlate = vehiclesByPlate.get(maskedPlate);
        if (directByMaskedPlate) {
          matchedVehicle = directByMaskedPlate;
        } else {
          const suffix = maskedPlate.slice(-2);
          const fallbackBySuffix = suffix ? (vehiclesBySuffix.get(suffix) ?? [])[0] ?? null : null;
          matchedVehicle = fallbackBySuffix;
        }
      }

      return {
        ...item,
        driverName: driver?.name ?? null,
        vehiclePlate: matchedVehicle?.plate ?? null,
        vehicleLabel: matchedVehicle?.label ?? null,
      };
    });
  }, [companyDrivers, companyVehicles, items]);

  const streamStatus = toStreamStatus(snapshotStatus, enrichedItems.length);
  const generatedAtLabel = generatedAt ? new Date(generatedAt).toLocaleTimeString("tr-TR") : "-";

  const liveCount = useMemo(
    () => enrichedItems.filter((item) => item.status === "live").length,
    [enrichedItems],
  );
  const activeCount = useMemo(
    () => enrichedItems.filter((item) => item.tripId != null).length,
    [enrichedItems],
  );
  const attentionCount = useMemo(
    () => enrichedItems.filter((item) => item.status === "stale" || item.status === "no_signal").length,
    [enrichedItems],
  );

  const filteredItems = useMemo(() => {
    if (filterKey === "live") {
      return enrichedItems.filter((item) => item.status === "live");
    }
    if (filterKey === "active") {
      return enrichedItems.filter((item) => item.tripId != null);
    }
    if (filterKey === "attention") {
      return enrichedItems.filter((item) => item.status === "stale" || item.status === "no_signal");
    }
    return enrichedItems;
  }, [enrichedItems, filterKey]);

  const visibleItems = useMemo(() => filteredItems.slice(0, maxItems), [filteredItems, maxItems]);
  const mappableItems = useMemo(
    () =>
      visibleItems.filter(
        (item): item is EnrichedLiveItem & { lat: number; lng: number } =>
          item.lat != null && item.lng != null,
      ),
    [visibleItems],
  );

  const resolvedSelectedRouteId = useMemo(() => {
    if (selectedRouteId && visibleItems.some((item) => item.routeId === selectedRouteId)) {
      return selectedRouteId;
    }
    return visibleItems[0]?.routeId ?? null;
  }, [selectedRouteId, visibleItems]);

  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.routeId === resolvedSelectedRouteId) ?? null,
    [resolvedSelectedRouteId, visibleItems],
  );

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[#768292] uppercase">Canli Operasyon</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Arac konum ve operasyon akisi</h2>
          <p className="mt-1 text-sm text-[#697382]">Son yenileme: {generatedAtLabel}</p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toStreamStatusTone(streamStatus)}`}
        >
          {toStreamStatusLabel(streamStatus)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterKey("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            filterKey === "all"
              ? "border-[#9bd3cb] bg-[#e9f7f4] text-[#1e6d64]"
              : "border-line bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Tumu ({enrichedItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterKey("live")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            filterKey === "live"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-line bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Canli ({liveCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterKey("active")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            filterKey === "active"
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : "border-line bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Seferde ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterKey("attention")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            filterKey === "attention"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-line bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Takip gereken ({attentionCount})
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-[#f8fafc] px-4 py-5 text-sm text-[#667182]">
          Henuz canli operasyon verisi gorunmuyor. Ilk sefer basladiginda araclar burada listelenecek.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-line bg-[#fbfdff] p-3">
            <LiveOpsMapPanel
              items={mappableItems}
              selectedRouteId={resolvedSelectedRouteId}
              onSelectRoute={setSelectedRouteId}
            />

            {selectedItem ? (
              <div className="mt-3 rounded-2xl border border-line bg-white px-3 py-2 text-sm text-[#4d5765]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900">
                    {selectedItem.vehicleLabel ?? selectedItem.vehiclePlate ?? selectedItem.routeName}
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toLiveOpsTone(selectedItem.status)}`}
                  >
                    {toLiveOpsLabel(selectedItem.status)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#697382]">
                  <span>Hat: {selectedItem.routeName}</span>
                  {selectedItem.vehiclePlate ? <span>Plaka: {selectedItem.vehiclePlate}</span> : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#697382]">
                  <span>Sofor: {selectedItem.driverName ?? "Bilinmiyor"}</span>
                  <span>Son konum: {toLastSeenLabel(selectedItem.locationTimestampMs)}</span>
                </div>
                {selectedItem.speed != null && selectedItem.speed > 0 ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700">Hareket halinde · {selectedItem.speed.toFixed(0)} km/s</span>
                  </div>
                ) : selectedItem.status === "live" ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                    <span className="text-sky-700">Durakta veya beklemede</span>
                  </div>
                ) : null}
                {selectedItem.scheduledTime ? (
                  <div className="mt-1 text-[11px] text-muted">
                    Planlanan saat: {selectedItem.scheduledTime}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="space-y-2">
            {visibleItems.map((item) => {
              const cardTitle = item.vehicleLabel ?? item.vehiclePlate ?? item.routeName;
              return (
                <article
                  key={item.routeId}
                  className={`rounded-2xl border px-3 py-2.5 transition ${
                    resolvedSelectedRouteId === item.routeId
                      ? "border-[#9fd3cb] bg-[#f0fbf8]"
                      : "border-line bg-white hover:border-[#c8d4e2]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRouteId(item.routeId)}
                      className="text-left text-sm font-semibold text-slate-900 hover:text-[#16635b]"
                    >
                      {cardTitle}
                    </button>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toLiveOpsTone(item.status)}`}
                    >
                      {toLiveOpsLabel(item.status)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#697382]">Hat: {item.routeName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#697382]">
                    {item.vehiclePlate ? (
                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        {item.vehiclePlate}
                      </span>
                    ) : null}
                    <span>Sofor: {item.driverName ?? "Bilinmiyor"}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-[#697382]">
                    <span>Son: {toLastSeenLabel(item.locationTimestampMs)}</span>
                    <span>Sefer: {item.tripId ? "Aktif" : "Beklemede"}</span>
                    {item.speed != null && item.speed > 0 ? (
                      <span className="text-emerald-600">{item.speed.toFixed(0)} km/s</span>
                    ) : item.status === "live" ? (
                      <span className="text-sky-600">Durakta</span>
                    ) : null}
                    {item.scheduledTime ? <span>Saat: {item.scheduledTime}</span> : null}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}
    </section>
  );
}
