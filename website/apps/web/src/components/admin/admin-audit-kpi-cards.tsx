"use client";

type AuditStatusFilter = "all" | "success" | "denied" | "error";

type AdminAuditKpiCardsProps = {
  total: number;
  success: number;
  denied: number;
  error: number;
  actionableCount: number;
  onSelectFilter: (filter: AuditStatusFilter) => void;
  onSelectActionable: () => void;
};

export function AdminAuditKpiCards({
  total,
  success,
  denied,
  error,
  actionableCount,
  onSelectFilter,
  onSelectActionable,
}: AdminAuditKpiCardsProps) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-xl border border-line bg-white px-3 py-2">
        <div className="text-[11px] text-muted">Toplam Kayit</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-900">{total}</div>
        <button
          type="button"
          onClick={() => onSelectFilter("all")}
          className="mt-1 rounded-md border border-line bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          Tumunu Ac
        </button>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <div className="text-[11px] text-emerald-700">Basarili</div>
        <div className="mt-0.5 text-sm font-semibold text-emerald-900">{success}</div>
        <button
          type="button"
          disabled={success === 0}
          title={success === 0 ? "Bu durumda kayit bulunmuyor." : undefined}
          onClick={() => onSelectFilter("success")}
          className="mt-1 rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Filtrele
        </button>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
        <div className="text-[11px] text-amber-700">Denied</div>
        <div className="mt-0.5 text-sm font-semibold text-amber-900">{denied}</div>
        <button
          type="button"
          disabled={denied === 0}
          title={denied === 0 ? "Bu durumda kayit bulunmuyor." : undefined}
          onClick={() => onSelectFilter("denied")}
          className="mt-1 rounded-md border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Filtrele
        </button>
      </div>
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
        <div className="text-[11px] text-rose-700">Diger Hata</div>
        <div className="mt-0.5 text-sm font-semibold text-rose-900">{error}</div>
        <button
          type="button"
          disabled={error === 0}
          title={error === 0 ? "Bu durumda kayit bulunmuyor." : undefined}
          onClick={() => onSelectFilter("error")}
          className="mt-1 rounded-md border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Filtrele
        </button>
      </div>
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
        <div className="text-[11px] text-blue-700">Aksiyonlanabilir</div>
        <div className="mt-0.5 text-sm font-semibold text-blue-900">{actionableCount}</div>
        <button
          type="button"
          disabled={actionableCount === 0}
          title={actionableCount === 0 ? "Aksiyonlanabilir kayit bulunmuyor." : undefined}
          onClick={onSelectActionable}
          className="mt-1 rounded-md border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Filtrele
        </button>
      </div>
    </div>
  );
}
