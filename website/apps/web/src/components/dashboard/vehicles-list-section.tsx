"use client";

import type { CompanyVehicleSummary } from "@/features/company/company-types";
import {
  vehicleStatusLabel,
  type VehicleSortOption,
  type VehicleStatusFilter,
} from "@/components/dashboard/vehicles-company-vehicles-helpers";

type VehiclesListSectionProps = {
  activeCompanyName: string | null;
  vehicleIdFromQuery: string | null;
  visibleVehicles: CompanyVehicleSummary[];
  filteredVehiclesCount: number;
  vehicleStatusSummary: {
    active: number;
    maintenance: number;
    inactive: number;
  };
  totalVehiclesCount: number;
  currentPage: number;
  totalPages: number;
  density: "comfortable" | "compact";
  searchText: string;
  statusFilter: VehicleStatusFilter;
  sortOption: VehicleSortOption;
  selectedVehicleId: string | null;
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: VehicleStatusFilter) => void;
  onSortOptionChange: (value: VehicleSortOption) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onSelectVehicle: (vehicleId: string) => void;
};

export function VehiclesListSection({
  activeCompanyName,
  vehicleIdFromQuery,
  visibleVehicles,
  filteredVehiclesCount,
  vehicleStatusSummary,
  totalVehiclesCount,
  currentPage,
  totalPages,
  density,
  searchText,
  statusFilter,
  sortOption,
  selectedVehicleId,
  onSearchTextChange,
  onStatusFilterChange,
  onSortOptionChange,
  onResetFilters,
  onPageChange,
  onSelectVehicle,
}: VehiclesListSectionProps) {
  const rowClass = density === "compact" ? "px-3 py-2" : "px-3 py-3";
  const filtersDirty =
    searchText.trim().length > 0 || statusFilter !== "all" || sortOption !== "plate_asc";

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Company Vehicles (Gercek Veri)</div>
          <div className="text-xs text-muted">
            Aktif company: {activeCompanyName ?? "-"}
            {vehicleIdFromQuery ? " - Deep-link secim aktif" : ""}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => onStatusFilterChange("active")}
              aria-pressed={statusFilter === "active"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                statusFilter === "active"
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Aktif {vehicleStatusSummary.active}
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("maintenance")}
              aria-pressed={statusFilter === "maintenance"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                statusFilter === "maintenance"
                  ? "border-amber-300 bg-amber-100 text-amber-900"
                  : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Bakim {vehicleStatusSummary.maintenance}
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("inactive")}
              aria-pressed={statusFilter === "inactive"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                statusFilter === "inactive"
                  ? "border-slate-400 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Pasif {vehicleStatusSummary.inactive}
            </button>
            {statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => onStatusFilterChange("all")}
                aria-pressed={false}
                className="rounded-full border border-line bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tum Durumlar
              </button>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-line bg-white px-3 py-2 text-xs text-muted">
          {filteredVehiclesCount} / {totalVehiclesCount} arac | Sayfa {currentPage}/{totalPages} |{" "}
          {density}
        </div>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-4">
        <input
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          aria-label="Arac arama"
          placeholder="Plaka, marka, model ara..."
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        />
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as VehicleStatusFilter)}
          aria-label="Durum filtresi"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="all">Tum durumlar</option>
          <option value="active">Aktif</option>
          <option value="maintenance">Bakim</option>
          <option value="inactive">Pasif</option>
        </select>
        <select
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as VehicleSortOption)}
          aria-label="Siralama"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="plate_asc">Plaka (A-Z)</option>
          <option value="plate_desc">Plaka (Z-A)</option>
          <option value="updated_desc">Son guncellenen</option>
          <option value="status">Duruma gore</option>
        </select>
        <button
          type="button"
          onClick={onResetFilters}
          disabled={!filtersDirty}
          title={!filtersDirty ? "Temizlenecek aktif filtre yok." : undefined}
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Filtreyi Temizle
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-12 gap-2 border-b border-line bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <div className="col-span-3 truncate">Plaka</div>
          <div className="col-span-3 truncate">Durum</div>
          <div className="col-span-4 truncate">Tip / Kapasite</div>
          <div className="col-span-2 truncate text-right">Aksiyon</div>
        </div>
        <div className="divide-y divide-line bg-white">
          {visibleVehicles.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted">Filtrelere uygun arac bulunamadi.</div>
          ) : (
            visibleVehicles.map((item) => {
              const isSelected = item.vehicleId === selectedVehicleId;
              return (
                <button
                  key={item.vehicleId}
                  type="button"
                  onClick={() => onSelectVehicle(item.vehicleId)}
                  aria-label={`${item.plate} araci sec`}
                  className={`grid w-full grid-cols-12 gap-2 text-left text-sm transition ${rowClass} ${
                    isSelected
                      ? "bg-blue-50/70 ring-1 ring-inset ring-blue-100"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="col-span-3 min-w-0">
                    <div className="truncate font-medium text-slate-900">{item.plate}</div>
                    <div className="truncate text-[11px] text-muted">{item.vehicleId}</div>
                  </div>
                  <div className="col-span-3 truncate text-slate-800">
                    {vehicleStatusLabel(item.status)}
                  </div>
                  <div className="col-span-4 truncate text-slate-800">
                    {[item.brand, item.model].filter(Boolean).join(" ") || "-"} /{" "}
                    {item.capacity ?? "-"}
                  </div>
                  <div className="col-span-2 text-right text-xs font-semibold text-slate-600">
                    {isSelected ? "Secili" : "Detay"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Onceki
          </button>
          <span className="text-xs text-muted">
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      ) : null}
    </section>
  );
}
