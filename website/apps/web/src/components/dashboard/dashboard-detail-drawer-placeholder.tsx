"use client";

type DetailField = {
  label: string;
  value: string;
};

type DashboardDetailDrawerPlaceholderProps = {
  title: string;
  subtitle: string;
  statusLabel?: string;
  statusTone?: "neutral" | "success" | "warning";
  fields: readonly DetailField[];
  actions?: readonly string[];
};

function statusToneClass(tone: DashboardDetailDrawerPlaceholderProps["statusTone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-line bg-slate-50 text-slate-700";
  }
}

export function DashboardDetailDrawerPlaceholder({
  title,
  subtitle,
  statusLabel = "Durum",
  statusTone = "neutral",
  fields,
  actions = ["Duzenle", "Detay", "Kayitlar"],
}: DashboardDetailDrawerPlaceholderProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs leading-5 text-muted">{subtitle}</div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusToneClass(
            statusTone,
          )}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-xl border border-line bg-white px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {field.label}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">{field.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {actions.map((action, index) => (
          <button
            key={action}
            type="button"
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              index === 0
                ? "bg-brand text-white hover:bg-blue-700"
                : "border border-line bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
