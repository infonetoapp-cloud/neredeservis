import type { ReactNode } from "react";

export type KpiCardTrend = {
  value: string;
  direction?: "up" | "down" | "flat";
};

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
  /** Optional trend chip shown on the top right */
  trend?: KpiCardTrend;
  /** Optional tiny line chart values */
  sparkline?: number[];
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

const lineColors: Record<string, string> = {
  indigo: "text-indigo-500",
  emerald: "text-emerald-500",
  violet: "text-violet-500",
  rose: "text-rose-500",
  orange: "text-orange-500",
  teal: "text-teal-500",
  amber: "text-amber-500",
  sky: "text-sky-500",
  slate: "text-slate-500",
};

function toSparklinePoints(values: number[]): string {
  const width = 112;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) {
    return values
      .map((_, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * width;
        return `${x.toFixed(2)},${(height / 2).toFixed(2)}`;
      })
      .join(" ");
  }

  const span = max - min;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function trendTone(direction: KpiCardTrend["direction"]): string {
  if (direction === "up") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (direction === "down") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function KpiCard({
  label,
  value,
  hint,
  accent = "indigo",
  icon,
  trend,
  sparkline,
  loading = false,
}: KpiCardProps) {
  const dot = dotColors[accent] ?? dotColors.indigo;
  const line = lineColors[accent] ?? lineColors.indigo;
  const hasSparkline = Array.isArray(sparkline) && sparkline.length >= 2;
  const sparklinePoints = hasSparkline ? toSparklinePoints(sparkline) : "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white px-5 pt-5 pb-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Accent dot */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${dot}`} />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </span>
        </div>
        {trend && !loading ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${trendTone(trend.direction)}`}>
            {trend.value}
          </span>
        ) : null}
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

      {hasSparkline && !loading ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 px-2 py-1.5">
          <svg
            width="100%"
            height="28"
            viewBox="0 0 112 28"
            preserveAspectRatio="none"
            className={`block h-7 w-full ${line}`}
            aria-hidden
          >
            <polyline
              points={sparklinePoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-2 h-3 w-24 animate-pulse rounded-lg bg-slate-100" />
      ) : null}
    </div>
  );
}
