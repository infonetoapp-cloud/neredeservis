"use client";

import {
  streamRecoveryToneClasses,
  type LiveOpsStreamRecoverySummary,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";

type LiveOpsStreamRecoveryCalloutProps = {
  summary: LiveOpsStreamRecoverySummary;
  className?: string;
  onReload?: (() => void | Promise<void>) | null;
  onFocusCritical?: (() => void) | null;
  onHideStale?: (() => void) | null;
  showFocusCriticalAction?: boolean;
  showHideStaleAction?: boolean;
};

export function LiveOpsStreamRecoveryCallout({
  summary,
  className,
  onReload,
  onFocusCritical,
  onHideStale,
  showFocusCriticalAction = false,
  showHideStaleAction = false,
}: LiveOpsStreamRecoveryCalloutProps) {
  if (!summary.needsRecovery) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border px-2.5 py-2 text-xs ${streamRecoveryToneClasses(
        summary.tone,
      )} ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          {summary.line ?? "Stream toparlanma gerekiyor."}
        </span>
        {(onReload || (showFocusCriticalAction && onFocusCritical) || (showHideStaleAction && onHideStale)) ? (
          <div className="flex shrink-0 items-center gap-2">
            {onReload ? (
              <button
                type="button"
                onClick={() => void onReload()}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Canliyi Yenile
              </button>
            ) : null}
            {showFocusCriticalAction && onFocusCritical ? (
              <button
                type="button"
                onClick={onFocusCritical}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Kritik Odagi Ac
              </button>
            ) : null}
            {showHideStaleAction && onHideStale ? (
              <button
                type="button"
                onClick={onHideStale}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Stale Gizle
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

