"use client";

import {
  toAuditEventLabel,
  toAuditTargetLabel,
  type AuditSortMode,
} from "@/components/admin/admin-audit-panel-helpers";

type AdminAuditFilterControlsProps = {
  eventFilter: string;
  eventOptions: string[];
  targetFilter: string;
  targetOptions: string[];
  searchQuery: string;
  sort: AuditSortMode;
  hasFilter: boolean;
  onEventFilterChange: (value: string) => void;
  onTargetFilterChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onSearchQueryClear: () => void;
  onSortChange: (value: AuditSortMode) => void;
  onResetFilters: () => void;
};

export function AdminAuditFilterControls({
  eventFilter,
  eventOptions,
  targetFilter,
  targetOptions,
  searchQuery,
  sort,
  hasFilter,
  onEventFilterChange,
  onTargetFilterChange,
  onSearchQueryChange,
  onSearchQueryClear,
  onSortChange,
  onResetFilters,
}: AdminAuditFilterControlsProps) {
  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Event Type
        <select
          value={eventFilter}
          onChange={(event) => {
            onEventFilterChange(event.target.value);
          }}
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-900 outline-none ring-blue-200 focus:border-blue-300 focus:ring-2"
        >
          <option value="all">Tum Eventler</option>
          {eventOptions.map((eventType) => (
            <option key={eventType} value={eventType}>
              {toAuditEventLabel(eventType)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Target Type
        <select
          value={targetFilter}
          onChange={(event) => {
            onTargetFilterChange(event.target.value);
          }}
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-900 outline-none ring-blue-200 focus:border-blue-300 focus:ring-2"
        >
          <option value="all">Tum Targetlar</option>
          {targetOptions.map((targetType) => (
            <option key={targetType} value={targetType}>
              {toAuditTargetLabel(targetType)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Arama
        <input
          value={searchQuery}
          onChange={(event) => {
            onSearchQueryChange(event.target.value);
          }}
          placeholder="event, actor, target, reason"
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 ring-blue-200 focus:border-blue-300 focus:ring-2"
        />
        {searchQuery.trim().length > 0 ? (
          <button
            type="button"
            onClick={onSearchQueryClear}
            className="mt-1 inline-flex w-fit rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            Aramayi Temizle
          </button>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Siralama
        <select
          value={sort}
          onChange={(event) => {
            onSortChange(event.target.value as AuditSortMode);
          }}
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-900 outline-none ring-blue-200 focus:border-blue-300 focus:ring-2"
        >
          <option value="newest">Yeniden Eskiye</option>
          <option value="oldest">Eskiden Yeniye</option>
          <option value="status_priority">Hata Once</option>
        </select>
      </label>

      <div className="flex items-end">
        <button
          type="button"
          onClick={onResetFilters}
          disabled={!hasFilter}
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Filtreleri Sifirla
        </button>
      </div>
    </div>
  );
}
