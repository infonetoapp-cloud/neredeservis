"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LiveOpsMapPanel } from "@/components/live-ops/live-ops-map-panel";
import { type CompanyLiveOpsItem } from "@/features/company/company-client";

type Props = {
  companyId: string;
  items: Array<
    CompanyLiveOpsItem & {
      vehicleId: string;
      vehiclePlate: string;
      vehicleLabel: string | null;
      driverName: string;
    }
  >;
  totalVehicleCount: number;
};

export function CompanyDashboardMiniMap({ companyId, items, totalVehicleCount }: Props) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  type VehicleFocusedItem = Props["items"][number];

  const mappableItems = useMemo(
    () =>
      items.filter(
        (item): item is VehicleFocusedItem & { lat: number; lng: number } =>
          item.lat != null && item.lng != null,
      ),
    [items],
  );

  const selected = useMemo(
    () => mappableItems.find((item) => item.routeId === selectedRouteId) ?? mappableItems[0] ?? null,
    [mappableItems, selectedRouteId],
  );

  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[#7d8693] uppercase">Harita Ozeti</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Sirket araclari konum gorunumu</h2>
          <p className="mt-1 text-xs text-[#6f7783]">
            {mappableItems.length}/{totalVehicleCount} kayitli arac canli konumda gorunuyor.
          </p>
        </div>
        <Link
          href={`/c/${encodeURIComponent(companyId)}/live-ops`}
          className="inline-flex items-center rounded-xl border border-line bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
        >
          Canli Operasyona git
        </Link>
      </div>

      <LiveOpsMapPanel
        items={mappableItems}
        selectedRouteId={selected?.routeId ?? null}
        onSelectRoute={setSelectedRouteId}
      />

      <div className="mt-3 rounded-2xl border border-line bg-[#fafbfd] p-3">
        {selected ? (
          <div className="space-y-1 text-xs text-[#5f6874]">
            <div className="text-sm font-semibold text-slate-900">{selected.routeName}</div>
            <div>
              arac: {selected.vehiclePlate}
              {selected.vehicleLabel ? ` (${selected.vehicleLabel})` : ""}
            </div>
            <div>sofor: {selected.driverName}</div>
            <div>son konum: harita uzerinde secili olarak gosteriliyor</div>
            <div>
              hiz: {selected.speed != null ? selected.speed.toFixed(1) : "-"} | yolcu: {selected.passengerCount}
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#6f7783]">
            Sirkete kayitli araclar icin anlik konum bulunamadi.
          </div>
        )}
      </div>
    </section>
  );
}
