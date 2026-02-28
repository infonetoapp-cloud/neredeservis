"use client";

type AdminRiskSearchControlProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

export function AdminRiskSearchControl({ value, onChange, onClear }: AdminRiskSearchControlProps) {
  return (
    <div className="mt-2">
      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Risk Arama
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder="risk basligi veya aciklama ara"
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 ring-blue-200 focus:border-blue-300 focus:ring-2"
        />
      </label>
      {value.trim().length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 inline-flex rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          Risk Aramasini Temizle
        </button>
      ) : null}
    </div>
  );
}
