"use client";

import type { CompanyRouteSummary } from "@/features/company/company-types";
import {
  routeStatusLabel,
  timeSlotLabel,
  type RouteSortOption,
  type RouteStatusFilter,
  type RouteTimeSlotFilter,
} from "@/components/dashboard/routes-company-routes-helpers";

type RoutesListSectionProps = {
  activeCompanyName: string | null;
  routeIdFromQuery: string | null;
  memberUidFromQuery: string | null;
  visibleRoutes: CompanyRouteSummary[];
  filteredRoutesCount: number;
  routeStatusSummary: {
    active: number;
    archived: number;
  };
  totalRoutesCount: number;
  currentPage: number;
  totalPages: number;
  density: "comfortable" | "compact";
  searchText: string;
  statusFilter: RouteStatusFilter;
  timeSlotFilter: RouteTimeSlotFilter;
  sortOption: RouteSortOption;
  selectedRouteId: string | null;
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: RouteStatusFilter) => void;
  onTimeSlotFilterChange: (value: RouteTimeSlotFilter) => void;
  onSortOptionChange: (value: RouteSortOption) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onClearMemberFocus: () => void;
  onSelectRoute: (routeId: string) => void;
};

export function RoutesListSection({
  activeCompanyName,
  routeIdFromQuery,
  memberUidFromQuery,
  visibleRoutes,
  filteredRoutesCount,
  routeStatusSummary,
  totalRoutesCount,
  currentPage,
  totalPages,
  density,
  searchText,
  statusFilter,
  timeSlotFilter,
  sortOption,
  selectedRouteId,
  onSearchTextChange,
  onStatusFilterChange,
  onTimeSlotFilterChange,
  onSortOptionChange,
  onResetFilters,
  onPageChange,
  onClearMemberFocus,
  onSelectRoute,
}: RoutesListSectionProps) {
  const rowClass = density === "compact" ? "px-3 py-2" : "px-3 py-3";
  const filtersDirty =
    searchText.trim().length > 0 ||
    statusFilter !== "all" ||
    timeSlotFilter !== "all" ||
    sortOption !== "updated_desc";

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Company Routes (Gercek Veri)</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>
              Aktif company: {activeCompanyName ?? "-"}
              {routeIdFromQuery ? " - Deep-link secim aktif" : ""}
              {memberUidFromQuery ? " - Uye odakli deep-link aktif" : ""}
            </span>
            {memberUidFromQuery ? (
              <button
                type="button"
                onClick={onClearMemberFocus}
                aria-label="Uye odagini temizle"
                className="rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Uye Odagini Temizle
              </button>
            ) : null}
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
              Aktif {routeStatusSummary.active}
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("archived")}
              aria-pressed={statusFilter === "archived"}
              className={`rounded-full border px-2 py-0.5 font-semibold ${
                statusFilter === "archived"
                  ? "border-slate-400 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Arsiv {routeStatusSummary.archived}
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
          {filteredRoutesCount} / {totalRoutesCount} rota | Sayfa {currentPage}/{totalPages} |{" "}
          {density}
        </div>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-5">
        <input
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          aria-label="Rota arama"
          placeholder="Rota, SRV, sofor ara..."
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        />
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as RouteStatusFilter)}
          aria-label="Durum filtresi"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="all">Tum durumlar</option>
          <option value="active">Aktif</option>
          <option value="archived">Arsiv</option>
        </select>
        <select
          value={timeSlotFilter}
          onChange={(event) =>
            onTimeSlotFilterChange(event.target.value as RouteTimeSlotFilter)
          }
          aria-label="Zaman dilimi filtresi"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="all">Tum slotlar</option>
          <option value="morning">Sabah</option>
          <option value="midday">Ogle</option>
          <option value="evening">Aksam</option>
          <option value="custom">Custom</option>
          <option value="unspecified">Slot yok</option>
        </select>
        <select
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as RouteSortOption)}
          aria-label="Siralama"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-300"
        >
          <option value="updated_desc">Son guncellenen</option>
          <option value="name_asc">Rota (A-Z)</option>
          <option value="name_desc">Rota (Z-A)</option>
          <option value="time_asc">Saat (artan)</option>
          <option value="time_desc">Saat (azalan)</option>
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
          <div className="col-span-4 truncate">Rota</div>
          <div className="col-span-3 truncate">Saat / Slot</div>
          <div className="col-span-3 truncate">Durum</div>
          <div className="col-span-2 truncate text-right">Aksiyon</div>
        </div>
        <div className="divide-y divide-line bg-white">
          {visibleRoutes.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted">Filtrelere uygun rota bulunamadi.</div>
          ) : (
            visibleRoutes.map((item) => {
              const isSelected = item.routeId === selectedRouteId;
              return (
                <button
                  key={item.routeId}
                  type="button"
                  onClick={() => onSelectRoute(item.routeId)}
                  aria-label={`${item.name} rotasini sec`}
                  className={`grid w-full grid-cols-12 gap-2 text-left text-sm transition ${rowClass} ${
                    isSelected
                      ? "bg-blue-50/70 ring-1 ring-inset ring-blue-100"
                      : item.isArchived
                        ? "hover:bg-slate-50 text-slate-500"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <div className="col-span-4 min-w-0">
                    <div
                      className={`truncate font-medium ${
                        item.isArchived ? "text-slate-500" : "text-slate-900"
                      }`}
                    >
                      {item.name}
                    </div>
                    <div
                      className={`truncate text-[11px] ${
                        item.isArchived ? "text-slate-400" : "text-muted"
                      }`}
                    >
                      {item.srvCode ?? "SRV yok"}
                    </div>
                  </div>
                  <div
                    className={`col-span-3 truncate ${
                      item.isArchived ? "text-slate-500" : "text-slate-800"
                    }`}
                  >
                    {item.scheduledTime ?? "--:--"} / {timeSlotLabel(item.timeSlot)}
                  </div>
                  <div
                    className={`col-span-3 truncate ${
                      item.isArchived ? "text-slate-500" : "text-slate-800"
                    }`}
                  >
                    {routeStatusLabel(item.isArchived)} / {item.passengerCount} yolcu
                  </div>
                  <div
                    className={`col-span-2 text-right text-xs font-semibold ${
                      item.isArchived ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
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
