"use client";

import type { CompanyDriverItem } from "@/features/company/company-client-shared";

import { driverStatusBadgeClass, driverStatusLabel, formatDriverId } from "./driver-ui-helpers";

type Props = {
  drivers: CompanyDriverItem[] | null;
  filteredDrivers: CompanyDriverItem[];
  selectedDriverId: string | null;
  onSelectDriver: (id: string) => void;
};

function getDriverAttentionChips(driver: CompanyDriverItem): string[] {
  const chips: string[] = [];

  if (!driver.phoneMasked) {
    chips.push("Telefon eksik");
  }
  if (!driver.plateMasked) {
    chips.push("Plaka eksik");
  }
  if (driver.assignedRoutes.length === 0) {
    chips.push("Atama bekliyor");
  }

  return chips;
}

export function DriverListSection({ drivers, filteredDrivers, selectedDriverId, onSelectDriver }: Props) {
  if (!drivers) {
    return (
      <div className="flex items-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
        <span className="text-sm text-slate-500">Şoförler yükleniyor...</span>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-base font-semibold text-slate-700">Henüz şoför kaydı yok</p>
        <p className="mt-1 text-sm text-slate-500">Yukarıdan ilk şoförü ekleyebilirsin.</p>
      </div>
    );
  }

  if (filteredDrivers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        Arama ve filtreye uygun şoför bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredDrivers.map((driver) => {
        const isSelected = selectedDriverId === driver.driverId;
        const chips = getDriverAttentionChips(driver);

        return (
          <button
            key={driver.driverId}
            type="button"
            onClick={() => onSelectDriver(driver.driverId)}
            className={`group relative w-full overflow-hidden rounded-3xl border p-4 text-left transition ${
              isSelected
                ? "border-blue-200 bg-blue-50/80 shadow-md ring-1 ring-blue-100"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <span
              className={`absolute inset-y-4 left-0 w-1 rounded-r-full transition ${
                isSelected ? "bg-blue-500" : "bg-transparent group-hover:bg-slate-200"
              }`}
            />

            <div className="pl-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950">{driver.name}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${driverStatusBadgeClass(driver.status)}`}
                    >
                      {driverStatusLabel(driver.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500" title={driver.driverId}>
                    {formatDriverId(driver.driverId)}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  {driver.assignedRoutes.length > 0 ? `${driver.assignedRoutes.length} rota` : "Atama bekliyor"}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {driver.phoneMasked ? `Tel: ${driver.phoneMasked}` : "Telefon yok"}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {driver.plateMasked ? `Plaka: ${driver.plateMasked}` : "Plaka yok"}
                </span>
                {chips.map((chip) => (
                  <span
                    key={`${driver.driverId}:${chip}`}
                    className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
