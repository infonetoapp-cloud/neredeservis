"use client";

type AuditStatusFilter = "all" | "success" | "denied" | "error";

type AdminAuditStatusFiltersProps = {
  selectedFilter: AuditStatusFilter;
  onSelectFilter: (filter: AuditStatusFilter) => void;
  total: number;
  success: number;
  denied: number;
  error: number;
  actionableOnly: boolean;
  onToggleActionable: () => void;
  actionableCount: number;
};

export function AdminAuditStatusFilters({
  selectedFilter,
  onSelectFilter,
  total,
  success,
  denied,
  error,
  actionableOnly,
  onToggleActionable,
  actionableCount,
}: AdminAuditStatusFiltersProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {[
        { value: "all", label: `Tüm Kayitlar (${total})`, count: total },
        { value: "success", label: `Basarili (${success})`, count: success },
        { value: "denied", label: `Denied (${denied})`, count: denied },
        { value: "error", label: `Diger Hatalar (${error})`, count: error },
      ].map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => {
            if (filter.value !== "all" && filter.count === 0) {
              return;
            }
            onSelectFilter(filter.value as AuditStatusFilter);
          }}
          disabled={filter.value !== "all" && filter.count === 0}
          title={filter.value !== "all" && filter.count === 0 ? "Bu durumda kayıt bulunmuyor." : undefined}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
            selectedFilter === filter.value
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-line bg-white text-slate-600 hover:bg-slate-50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {filter.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onToggleActionable}
        disabled={!actionableOnly && actionableCount === 0}
        title={
          !actionableOnly && actionableCount === 0
            ? "Aksiyonlanabilir kayıt bulunmuyor."
            : undefined
        }
        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
          actionableOnly
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-line bg-white text-slate-600 hover:bg-slate-50"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Aksiyonlanabilir ({actionableCount})
      </button>
    </div>
  );
}

