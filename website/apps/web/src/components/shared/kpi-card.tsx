import type { ReactNode } from "react";

type KpiCardProps = {
  /** Metric label */
  label: string;
  /** Main value (number or formatted string) */
  value: string | number;
  /** Optional secondary hint (e.g., "5 aktif · 2 davet") */
  hint?: string;
  /** Accent color for the gradient dot */
  accent?: "indigo" | "emerald" | "violet" | "rose" | "orange" | "teal" | "amber" | "sky" | "slate";
  /** Optional icon shown to the left of the value */
  icon?: ReactNode;
  /** Whether the card is in loading/skeleton state */
  loading?: boolean;
};

const dotColors: Record<string, string> = {
  indigo:  "from-indigo-400 to-indigo-600",
  emerald: "from-emerald-400 to-emerald-600",
  violet:  "from-violet-400 to-violet-600",
  rose:    "from-rose-400 to-rose-600",
  orange:  "from-orange-400 to-orange-600",
  teal:    "from-teal-400 to-teal-600",
  amber:   "from-amber-400 to-amber-600",
  sky:     "from-sky-400 to-sky-600",
  slate:   "from-slate-400 to-slate-600",
};

export function KpiCard({
  label,
  value,
  hint,
  accent = "indigo",
  icon,
  loading = false,
}: KpiCardProps) {
  const dot = dotColors[accent] ?? dotColors.indigo;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white px-5 pt-5 pb-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Accent dot */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${dot}`} />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-10 w-20 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <div className="flex items-baseline gap-2">
          {icon ? (
            <span className="text-slate-400">{icon}</span>
          ) : null}
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </span>
        </div>
      )}

      {/* Hint */}
      {hint && !loading ? (
        <p className="mt-2 text-[11px] text-slate-400">{hint}</p>
      ) : null}

      {loading ? (
        <div className="mt-2 h-3 w-24 animate-pulse rounded-lg bg-slate-100" />
      ) : null}
    </div>
  );
}
