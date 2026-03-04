"use client";

import type { CompanyDriverItem } from "@/features/company/company-client-shared";

import type { DriverFilter } from "./driver-ui-helpers";
import { driverStatusBadgeClass, driverStatusLabel, formatDriverId } from "./driver-ui-helpers";

type Props = {
  drivers: CompanyDriverItem[] | null;
  filteredDrivers: CompanyDriverItem[];
  selectedDriverId: string | null;
  onSelectDriver: (id: string) => void;
};

export function DriverListSection({
  drivers,
  filteredDrivers,
  selectedDriverId,
  onSelectDriver,
}: Props) {
  if (!drivers) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
        <span className="text-xs text-slate-500">Şoförler yükleniyor...</span>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-slate-500">Henüz şoför eklenmemiş</p>
        <p className="mt-1 text-xs text-slate-400">Mobil uygulama için şoför hesabı oluşturun.</p>
      </div>
    );
  }

  if (filteredDrivers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
        Arama ve filtreye uygun şoför bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {filteredDrivers.map((driver) => {
        const isSelected = selectedDriverId === driver.driverId;
        return (
          <button
            key={driver.driverId}
            type="button"
            onClick={() => onSelectDriver(driver.driverId)}
            className={`group w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
              isSelected
                ? "border-blue-300 bg-blue-50/60 shadow-sm"
                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900">{driver.name}</span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${driverStatusBadgeClass(driver.status)}`}>
                {driverStatusLabel(driver.status)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
              {driver.phoneMasked && <span>Tel: {driver.phoneMasked}</span>}
              <span>Plaka: {driver.plateMasked}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
              <span title={driver.driverId}>{formatDriverId(driver.driverId)}</span>
              <span className="ml-auto">
                {driver.assignedRoutes.length > 0
                  ? `${driver.assignedRoutes.length} rota`
                  : "Atama bekliyor"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
