"use client";

import { useMemo } from "react";

import { resolveAdminPhase5BlockingPreview } from "@/components/admin/admin-phase5-blocking-link-helpers";
import { type AdminPhase5ReadinessState } from "@/components/admin/use-admin-phase5-readiness-state";

type ChipItem = {
  id: string;
  label: string;
  tone: "ok" | "warn";
  detail: string;
};

type AdminRiskQualityChipsProps = {
  readiness: AdminPhase5ReadinessState;
  freshnessLabel: string;
  freshnessTone: "ok" | "warn";
  freshnessUpdatedLabel: string;
};

export function AdminRiskQualityChips({
  readiness,
  freshnessLabel,
  freshnessTone,
  freshnessUpdatedLabel,
}: AdminRiskQualityChipsProps) {

  const chips = useMemo<ChipItem[]>(() => {
    const items: ChipItem[] = [];
    items.push({
      id: "cors",
      label: "CORS allow-list",
      tone: readiness.counts.cors >= readiness.totals.cors ? "ok" : "warn",
      detail: `${readiness.counts.cors}/${readiness.totals.cors}`,
    });
    items.push({
      id: "security",
      label: "Security hardening",
      tone: readiness.counts.security >= readiness.totals.security ? "ok" : "warn",
      detail: `${readiness.counts.security}/${readiness.totals.security}`,
    });
    items.push({
      id: "secrets",
      label: "Secret hygiene",
      tone: readiness.counts.secrets >= readiness.totals.secrets ? "ok" : "warn",
      detail: `${readiness.counts.secrets}/${readiness.totals.secrets}`,
    });
    return items;
  }, [
    readiness.counts.cors,
    readiness.counts.secrets,
    readiness.counts.security,
    readiness.totals.cors,
    readiness.totals.secrets,
    readiness.totals.security,
  ]);

  const okCount = useMemo(() => chips.filter((chip) => chip.tone === "ok").length, [chips]);
  const warnCount = useMemo(() => chips.filter((chip) => chip.tone === "warn").length, [chips]);
  const blockingPreview = useMemo(
    () => resolveAdminPhase5BlockingPreview(readiness.blockingLabels, 3),
    [readiness.blockingLabels],
  );

  return (
    <div className="mt-3">
      <div className="mb-2 text-[11px] text-muted">
        Faz 5 readiness: {readiness.isReady ? "READY" : "BLOCKED"} ({readiness.progress.completed}/{readiness.progress.total})
      </div>
      <div className="mb-2 h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${readiness.progress.percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip.id}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              chip.tone === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            <span>{chip.label}</span>
            <span className="rounded-full border border-white/60 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold">
              {chip.detail}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-muted">
        Kalite durumu: {okCount} OK / {warnCount} Uyari
      </div>
      {!readiness.isReady ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-amber-700">
          <span className="font-semibold">Bloklayan alanlar:</span>
          {blockingPreview.visibleItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              title={item.title}
              className="rounded-full border border-amber-200 bg-white px-2 py-0.5 font-semibold text-amber-700 hover:text-amber-800"
            >
              {item.label}
            </a>
          ))}
          {blockingPreview.hiddenCount > 0 ? (
            <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5 font-semibold">
              +{blockingPreview.hiddenCount} daha
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-1 text-[11px] text-muted">
        Faz 5 tazelik:{" "}
        <span className={freshnessTone === "ok" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
          {freshnessLabel}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-muted">{freshnessUpdatedLabel}</div>
    </div>
  );
}
