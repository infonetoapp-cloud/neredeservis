"use client";

import { useMemo, useState } from "react";

import { buildAdminCopyPayload } from "@/components/admin/admin-copy-payload-helpers";
import { resolveAdminPhase5BlockingPreview } from "@/components/admin/admin-phase5-blocking-link-helpers";
import {
  buildAdminPhase5ReadinessReportLines,
} from "@/components/admin/admin-phase5-readiness-helpers";
import { type AdminPhase5ReadinessState } from "@/components/admin/use-admin-phase5-readiness-state";
import { getPublicAppEnv } from "@/lib/env/public-env";

type AdminPhase5ReadinessCardProps = {
  readiness: AdminPhase5ReadinessState;
  freshnessLabel: string;
  freshnessTone: "ok" | "warn";
  freshnessUpdatedLabel: string;
};

export function AdminPhase5ReadinessCard({
  readiness,
  freshnessLabel,
  freshnessTone,
  freshnessUpdatedLabel,
}: AdminPhase5ReadinessCardProps) {
  const blockingItems = useMemo(
    () => resolveAdminPhase5BlockingPreview(readiness.blockingLabels, 4),
    [readiness.blockingLabels],
  );
  const firstBlocking = blockingItems.visibleItems[0] ?? null;
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [supportsClipboard] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
  );

  const handleCopy = async () => {
    if (!supportsClipboard || typeof navigator === "undefined" || !navigator.clipboard) return;
    const lines = buildAdminPhase5ReadinessReportLines(
      `Readiness: ${readiness.isReady ? "READY" : "BLOCKED"}`,
      readiness.metrics,
      freshnessLabel,
      readiness.blockingLabels,
    );
    const payload = buildAdminCopyPayload({
      title: "Faz 5 Readiness (Side Panel)",
      env: getPublicAppEnv(),
      updatedAt: readiness.updatedAt.latest,
      bodyLines: lines,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setCopyStatus("Readiness ozeti kopyalandi.");
      window.setTimeout(() => setCopied(false), 1500);
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Faz 5 Readiness</h3>
        <div className="flex items-center gap-2">
          <span
            className={[
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              readiness.isReady
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {readiness.isReady ? "READY" : "BLOCKED"}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!supportsClipboard}
            title={supportsClipboard ? "Readiness ozetini panoya kopyala" : "Tarayici panoya kopyalamayi desteklemiyor"}
            className={[
              "rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600",
              supportsClipboard ? "" : "cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            {copied ? "Kopyalandi" : "Kopyala"}
          </button>
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {copyStatus}
      </div>
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>Ilerleme</span>
          <span>
            {readiness.progress.completed}/{readiness.progress.total} (%{readiness.progress.percent})
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-indigo-500 transition-all"
            style={{ width: `${readiness.progress.percent}%` }}
          />
        </div>
      </div>
      <div className="mt-2">
        <span
          className={[
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            freshnessTone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {freshnessLabel}
        </span>
        <div className="mt-1 text-[11px] text-muted">{freshnessUpdatedLabel}</div>
      </div>
      {readiness.isReady ? (
        <p className="mt-2 text-xs text-emerald-700">
          Tüm Faz 5 quality gate adimlari tamamlandi.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted">Bloklayan basliklar:</p>
          <ul className="space-y-1">
            {blockingItems.visibleItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  title={item.title}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          {blockingItems.hiddenCount > 0 ? (
            <p className="text-[11px] text-muted">+{blockingItems.hiddenCount} ek blokaj var.</p>
          ) : null}
          {firstBlocking ? (
            <a
              href={firstBlocking.href}
              title={firstBlocking.title}
              className="inline-flex rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Ilk blokaja git
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}

