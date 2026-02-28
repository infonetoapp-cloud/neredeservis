"use client";

type RiskSeverityFilter = "all" | "warning" | "attention" | "info";

type AdminRiskSummaryChipsProps = {
  warning: number;
  attention: number;
  info: number;
  selected: RiskSeverityFilter;
  onToggle: (severity: Exclude<RiskSeverityFilter, "all">) => void;
  onClear: () => void;
};

export function AdminRiskSummaryChips({
  warning,
  attention,
  info,
  selected,
  onToggle,
  onClear,
}: AdminRiskSummaryChipsProps) {
  const selectedLabel =
    selected === "all" ? "Tum seviyeler" : selected === "warning" ? "Kritik" : selected === "attention" ? "Uyari" : "Bilgi";
  const selectedCount =
    selected === "all" ? warning + attention + info : selected === "warning" ? warning : selected === "attention" ? attention : info;

  return (
    <div className="mt-2">
      <p className="mb-2 text-[11px] text-slate-500">
        Aktif filtre:{" "}
        <span className="font-semibold text-slate-900">
          {selectedLabel} ({selectedCount})
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onToggle("warning")}
          disabled={warning === 0}
          title={warning === 0 ? "Kritik risk kaydi bulunmuyor." : undefined}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            selected === "warning"
              ? "border-rose-300 bg-rose-100 text-rose-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Kritik {warning}
        </button>
        <button
          type="button"
          onClick={() => onToggle("attention")}
          disabled={attention === 0}
          title={attention === 0 ? "Uyari seviyesinde risk kaydi bulunmuyor." : undefined}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            selected === "attention"
              ? "border-amber-300 bg-amber-100 text-amber-800"
              : "border-amber-200 bg-amber-50 text-amber-700"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Uyari {attention}
        </button>
        <button
          type="button"
          onClick={() => onToggle("info")}
          disabled={info === 0}
          title={info === 0 ? "Bilgi seviyesinde risk kaydi bulunmuyor." : undefined}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            selected === "info"
              ? "border-slate-300 bg-slate-100 text-slate-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Bilgi {info}
        </button>
      </div>
      {selected !== "all" ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Severity Filtresini Temizle
        </button>
      ) : null}
    </div>
  );
}
