"use client";

import { useDashboardDensity } from "@/features/dashboard/use-dashboard-density";

type DashboardListPlaceholderProps = {
  title: string;
  subtitle?: string;
  columns: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
  toolbarHint?: string;
};

export function DashboardListPlaceholder({
  title,
  subtitle,
  columns,
  rows,
  toolbarHint = "Ara / Filtre / Toplu aksiyonlar (ornek)",
}: DashboardListPlaceholderProps) {
  const density = useDashboardDensity();
  const rowClass = density === "compact" ? "py-2" : "py-3.5";

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="text-xs text-muted">{subtitle}</div> : null}
        </div>
        <div className="rounded-xl border border-dashed border-line bg-white px-3 py-2 text-xs text-muted">
          {toolbarHint}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-12 gap-2 border-b border-line bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          {columns.map((column) => (
            <div key={column} className="col-span-3 truncate first:col-span-4 last:col-span-2">
              {column}
            </div>
          ))}
        </div>

        <div className="divide-y divide-line bg-white">
          {rows.map((row, rowIndex) => (
            <div
              key={`${title}-row-${rowIndex}`}
              className={`grid grid-cols-12 gap-2 px-3 ${rowClass} text-sm text-slate-800`}
            >
              {row.map((cell, cellIndex) => (
                <div
                  key={`${title}-row-${rowIndex}-cell-${cellIndex}`}
                  className={`truncate ${
                    cellIndex === 0
                      ? "col-span-4 font-medium text-slate-900"
                      : cellIndex === row.length - 1
                        ? "col-span-2 text-right text-xs text-muted"
                        : "col-span-3"
                  }`}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>Density: {density}</span>
        <span>Ornek satirlar ({rows.length})</span>
      </div>
    </div>
  );
}
