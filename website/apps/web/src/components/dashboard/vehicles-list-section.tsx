"use client";

import { Truck } from "lucide-react";
import type { CompanyVehicleSummary } from "@/features/company/company-types";
import {
  vehicleStatusLabel,
  type VehicleSortOption,
  type VehicleStatusFilter,
} from "@/components/dashboard/vehicles-company-vehicles-helpers";

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  maintenance: "bg-amber-500",
  inactive: "bg-slate-400",
};

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-900">Araclar</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
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
                className="rounded-full border border-line bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tumunu Göster
              </button>
            ) : null}
          </div>
        </div>
        <span className="text-xs text-muted">
          {filteredVehiclesCount} / {totalVehiclesCount}
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          aria-label="Araç arama"
          placeholder="Plaka, marka, model ara..."
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        />
        <select
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as VehicleSortOption)}
          aria-label="Siralama"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="plate_asc">Plaka (A-Z)</option>
          <option value="plate_desc">Plaka (Z-A)</option>
          <option value="updated_desc">Son guncellenen</option>
          <option value="status">Duruma göre</option>
        </select>
        {filtersDirty ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Temizle
          </button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {visibleVehicles.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-muted">
            Filtrelere uygun araç bulunamadi.
          </div>
        ) : (
          visibleVehicles.map((item) => {
            const isSelected = item.vehicleId === selectedVehicleId;
            return (
              <button
                key={item.vehicleId}
                type="button"
                onClick={() => onSelectVehicle(item.vehicleId)}
                aria-label={`${item.plate} araci sec`}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-blue-200 bg-blue-50/70 ring-1 ring-blue-100"
                    : "border-line bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Truck className="h-5 w-5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{item.plate}</span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.status] ?? "bg-slate-300"}`} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted">
                    {[item.brand, item.model].filter(Boolean).join(" ") || vehicleStatusLabel(item.status)}
                    {item.capacity ? ` · ${item.capacity} kişi` : ""}
                  </div>
                </div>
              </button>
            );
          })
        )}
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

