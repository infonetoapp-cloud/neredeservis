"use client";

import {
  writeDashboardDensity,
  type DashboardDensity,
} from "@/features/dashboard/shell-preferences";
import { useDashboardDensity } from "@/features/dashboard/use-dashboard-density";

const OPTIONS: readonly { value: DashboardDensity; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

export function DashboardDensityToggle() {
  const density = useDashboardDensity();

  const handleChange = (next: DashboardDensity) => {
    writeDashboardDensity(next);
  };

  return (
    <div className="hidden items-center gap-1 rounded-xl border border-line bg-white p-1 md:inline-flex">
      {OPTIONS.map((option) => {
        const active = option.value === density;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChange(option.value)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
            }`}
            aria-pressed={active}
            title="Operasyon listelerinde satir yogunlugunu degistirir."
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
