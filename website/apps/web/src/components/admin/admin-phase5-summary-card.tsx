"use client";

import { useMemo, useState } from "react";

import { buildAdminCopyPayload } from "@/components/admin/admin-copy-payload-helpers";
import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";
import { resolveAdminPhase5BlockingPreview } from "@/components/admin/admin-phase5-blocking-link-helpers";
import {
  buildAdminPhase5ReadinessReportLines,
} from "@/components/admin/admin-phase5-readiness-helpers";
import { type AdminPhase5ReadinessState } from "@/components/admin/use-admin-phase5-readiness-state";
import { getPublicAppEnv } from "@/lib/env/public-env";

type SummaryItem = {
  id: string;
  label: string;
  detail: string;
};

type AdminPhase5SummaryCardProps = {
  readiness: AdminPhase5ReadinessState;
  freshnessLabel: string;
  freshnessTone: "ok" | "warn";
  freshnessUpdatedLabel: string;
};

export function AdminPhase5SummaryCard({
  readiness,
  freshnessLabel,
  freshnessTone,
  freshnessUpdatedLabel,
}: AdminPhase5SummaryCardProps) {
  const [refreshStatus, setRefreshStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [supportsClipboard] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
  );
  const blockingItems = useMemo(
    () => resolveAdminPhase5BlockingPreview(readiness.blockingLabels, 5),
    [readiness.blockingLabels],
  );

  const secretUpdatedLabel = useMemo(() => {
    return `Son secret guncelleme: ${formatAdminDateTime(readiness.updatedAt.secrets)}`;
  }, [readiness.updatedAt.secrets]);
  const corsUpdatedLabel = useMemo(() => {
    return `Son CORS guncelleme: ${formatAdminDateTime(readiness.updatedAt.cors)}`;
  }, [readiness.updatedAt.cors]);
  const smokeUpdatedLabel = useMemo(() => {
    return `Son smoke guncelleme: ${formatAdminDateTime(readiness.updatedAt.smokeChecklist)}`;
  }, [readiness.updatedAt.smokeChecklist]);
  const runbookUpdatedLabel = useMemo(() => {
    return `Son runbook guncelleme: ${formatAdminDateTime(readiness.updatedAt.smokeRunbook)}`;
  }, [readiness.updatedAt.smokeRunbook]);
  const releaseGateUpdatedLabel = useMemo(() => {
    return `Son release gate guncelleme: ${formatAdminDateTime(readiness.updatedAt.releaseGate)}`;
  }, [readiness.updatedAt.releaseGate]);
  const securityUpdatedLabel = useMemo(() => {
    return `Son security guncelleme: ${formatAdminDateTime(readiness.updatedAt.security)}`;
  }, [readiness.updatedAt.security]);
  const items = useMemo<SummaryItem[]>(
    () => [
      {
        id: "release",
        label: "Release Gate",
        detail: `${readiness.counts.releaseGate}/${readiness.totals.releaseGate}`,
      },
      {
        id: "smoke",
        label: "Smoke Checklist",
        detail: `${readiness.counts.smokeChecklist}/${readiness.totals.smokeChecklist}`,
      },
      {
        id: "runbook",
        label: "Smoke Runbook",
        detail: `${readiness.counts.smokeRunbook}/${readiness.totals.smokeRunbook}`,
      },
      {
        id: "security",
        label: "Security",
        detail: `${readiness.counts.security}/${readiness.totals.security}`,
      },
      {
        id: "secrets",
        label: "Secrets",
        detail: `${readiness.counts.secrets}/${readiness.totals.secrets}`,
      },
      {
        id: "cors",
        label: "CORS",
        detail: `${readiness.counts.cors}/${readiness.totals.cors}`,
      },
    ],
    [
      readiness.counts.cors,
      readiness.counts.releaseGate,
      readiness.counts.secrets,
      readiness.counts.security,
      readiness.counts.smokeChecklist,
      readiness.counts.smokeRunbook,
      readiness.totals.cors,
      readiness.totals.releaseGate,
      readiness.totals.secrets,
      readiness.totals.security,
      readiness.totals.smokeChecklist,
      readiness.totals.smokeRunbook,
    ],
  );

  const handleRefresh = () => {
    readiness.refreshFromStorage();
    setRefreshStatus("Faz 5 ozeti yenilendi.");
    window.setTimeout(() => setRefreshStatus(""), 1500);
  };

  const handleCopyReadiness = async () => {
    if (!supportsClipboard || typeof navigator === "undefined" || !navigator.clipboard) return;
    const lines = buildAdminPhase5ReadinessReportLines(
      `Readiness: ${readiness.isReady ? "READY" : "BLOCKED"}`,
      readiness.metrics,
      freshnessLabel,
      readiness.blockingLabels,
    );
    const payload = buildAdminCopyPayload({
      title: "Faz 5 Readiness Raporu",
      env: getPublicAppEnv(),
      updatedAt: readiness.updatedAt.latest,
      bodyLines: lines,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setCopyStatus("Readiness raporu kopyalandi.");
      window.setTimeout(() => setCopied(false), 1500);
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section id="phase5-summary" className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-900">Faz 5 Durum Ozeti</div>
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
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          >
            Yenile
          </button>
          <button
            type="button"
            onClick={handleCopyReadiness}
            disabled={!supportsClipboard}
            title={supportsClipboard ? "Readiness raporunu panoya kopyala" : "Tarayici panoya kopyalamayi desteklemiyor"}
            className={[
              "rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600",
              supportsClipboard ? "" : "cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            {copied ? "Kopyalandi" : "Raporu kopyala"}
          </button>
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {refreshStatus || copyStatus}
      </div>
      <p className="text-xs text-muted">Checklist ve gate durumlarinin kisa ozetidir.</p>
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
      </div>
      <div className="mt-2 rounded-xl border border-line bg-white px-3 py-2 text-[11px] text-slate-700">
        {readiness.blockingLabels.length > 0 ? (
          <>
            <div className="font-semibold text-amber-700">Bloklayan basliklar</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {blockingItems.visibleItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  title={item.title}
                  className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {item.label}
                </a>
              ))}
              {blockingItems.hiddenCount > 0 ? (
                <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  +{blockingItems.hiddenCount} daha
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="font-semibold text-emerald-700">Tüm Faz 5 gate adimlari tamamlandi.</div>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-line bg-white px-3 py-2 text-xs text-slate-800">
            <div className="text-[11px] text-muted">{item.label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{item.detail}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1 text-[11px] text-muted">
        <div>Not: Bu kart localStorage uzerindeki lokal durumdan okunur.</div>
        <div>{freshnessUpdatedLabel}</div>
        <div>{releaseGateUpdatedLabel}</div>
        <div>{smokeUpdatedLabel}</div>
        <div>{runbookUpdatedLabel}</div>
        <div>{securityUpdatedLabel}</div>
        <div>{secretUpdatedLabel}</div>
        <div>{corsUpdatedLabel}</div>
      </div>
    </section>
  );
}

