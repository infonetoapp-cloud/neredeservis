"use client";

import { AdminRiskFilterMeta } from "@/components/admin/admin-risk-filter-meta";
import { resolveAdminPhase5FirstBlockingLink } from "@/components/admin/admin-phase5-blocking-link-helpers";
import { AdminRiskPriorityList } from "@/components/admin/admin-risk-priority-list";
import { AdminRiskQualityChips } from "@/components/admin/admin-risk-quality-chips";
import { AdminRiskSearchControl } from "@/components/admin/admin-risk-search-control";
import { AdminRiskSummaryChips } from "@/components/admin/admin-risk-summary-chips";
import { type AdminPhase5ReadinessState } from "@/components/admin/use-admin-phase5-readiness-state";

type AdminRiskSectionProps = {
  warningCount: number;
  attentionCount: number;
  infoCount: number;
  lastUpdatedLabel: string;
  selectedSeverity: "all" | "warning" | "attention" | "info";
  searchQuery: string;
  hasLocalOverride: boolean;
  hasQueryPreset: boolean;
  visibleItems: Array<{
    id: string;
    severity: "warning" | "attention" | "info";
    title: string;
    description: string;
    href: string;
    ctaLabel: string;
  }>;
  totalCount: number;
  riskModeLabel: string;
  readiness: AdminPhase5ReadinessState;
  phase5FreshnessLabel: string;
  phase5FreshnessTone: "ok" | "warn";
  phase5FreshnessUpdatedLabel: string;
  onToggleSeverity: (severity: "warning" | "attention" | "info") => void;
  onClearSeverity: () => void;
  onResetToPreset: () => void;
  onClearQueryPreset: () => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
};

export function AdminRiskSection({
  warningCount,
  attentionCount,
  infoCount,
  lastUpdatedLabel,
  selectedSeverity,
  searchQuery,
  hasLocalOverride,
  hasQueryPreset,
  visibleItems,
  totalCount,
  riskModeLabel,
  readiness,
  phase5FreshnessLabel,
  phase5FreshnessTone,
  phase5FreshnessUpdatedLabel,
  onToggleSeverity,
  onClearSeverity,
  onResetToPreset,
  onClearQueryPreset,
  onSearchChange,
  onSearchClear,
}: AdminRiskSectionProps) {
  const firstBlocking = resolveAdminPhase5FirstBlockingLink(readiness.blockingLabels);
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Risk Oncelik Listesi</h3>
        <span className="text-[11px] text-muted">Son guncelleme: {lastUpdatedLabel}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Bu liste kritik operasyon risklerini one alir ve ilgili ekrana hizli gecis saglar.
      </p>
      <div className="mt-2">
        <a
          href="#faz5-scope"
          aria-label="Faz 5 kapsam ozetine git"
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Faz 5 kapsam ozetine git -&gt;
        </a>
      </div>
      <AdminRiskSummaryChips
        warning={warningCount}
        attention={attentionCount}
        info={infoCount}
        selected={selectedSeverity}
        onToggle={onToggleSeverity}
        onClear={onClearSeverity}
      />
      {phase5FreshnessTone === "warn" ? (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <div className="font-semibold">Faz 5 checklist tazeligi operasyon riski uretabilir</div>
          <div className="mt-1">
            {phase5FreshnessLabel}. {phase5FreshnessUpdatedLabel}.
            {firstBlocking ? (
              <>
                {" "}
                <a
                  href={firstBlocking.href}
                  title={firstBlocking.title}
                  className="font-semibold text-amber-800 underline-offset-2 hover:underline"
                >
                  Ilk blokaja git
                </a>
                .
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <AdminRiskQualityChips
        readiness={readiness}
        freshnessLabel={phase5FreshnessLabel}
        freshnessTone={phase5FreshnessTone}
        freshnessUpdatedLabel={phase5FreshnessUpdatedLabel}
      />
      <AdminRiskFilterMeta
        selected={selectedSeverity}
        searchQuery={searchQuery}
        canResetToPreset={hasLocalOverride && hasQueryPreset}
        onResetToPreset={onResetToPreset}
        canClearQueryPreset={hasQueryPreset && !hasLocalOverride}
        onClearQueryPreset={onClearQueryPreset}
      />
      <AdminRiskSearchControl value={searchQuery} onChange={onSearchChange} onClear={onSearchClear} />
      <AdminRiskPriorityList
        visibleItems={visibleItems}
        totalItems={totalCount}
        riskModeLabel={riskModeLabel}
      />
    </section>
  );
}
