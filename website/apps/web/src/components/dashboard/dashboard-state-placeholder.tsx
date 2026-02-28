"use client";

import type { ReactNode } from "react";

type DashboardStateTone = "loading" | "empty" | "error" | "info";

type DashboardStatePlaceholderProps = {
  tone: DashboardStateTone;
  title: string;
  description: string;
  actionLabel?: string;
  actionAdornment?: ReactNode;
};

function toneClasses(tone: DashboardStateTone): string {
  switch (tone) {
    case "loading":
      return "border-blue-100 bg-blue-50/70 text-blue-900";
    case "empty":
      return "border-slate-200 bg-slate-50 text-slate-800";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "info":
    default:
      return "border-line bg-white text-slate-900";
  }
}

function iconForTone(tone: DashboardStateTone): ReactNode {
  switch (tone) {
    case "loading":
      return <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />;
    case "empty":
      return <span className="h-2 w-2 rounded-full bg-slate-400" />;
    case "error":
      return <span className="h-2 w-2 rounded-full bg-rose-500" />;
    case "info":
    default:
      return <span className="h-2 w-2 rounded-full bg-slate-600" />;
  }
}

export function DashboardStatePlaceholder({
  tone,
  title,
  description,
  actionLabel,
  actionAdornment,
}: DashboardStatePlaceholderProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses(tone)}`}>
      <div className="mb-2 flex items-center gap-2">
        {iconForTone(tone)}
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="text-xs leading-5 opacity-90">{description}</div>

      {actionLabel ? (
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-current/15 bg-white/80 px-3 py-2 text-xs font-semibold hover:bg-white"
        >
          {actionAdornment}
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
