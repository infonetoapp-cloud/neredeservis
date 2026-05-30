"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { AdminAuditFilterControls } from "@/components/admin/admin-audit-filter-controls";
import { AdminAuditKpiCards } from "@/components/admin/admin-audit-kpi-cards";
import { AdminAuditListSection } from "@/components/admin/admin-audit-list-section";
import { AdminAuditPinnedWarning } from "@/components/admin/admin-audit-pinned-warning";
import { AdminAuditStatusFilters } from "@/components/admin/admin-audit-status-filters";
import { AdminAuditToolbar } from "@/components/admin/admin-audit-toolbar";
import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";
import {
  isAuditActionable,
  sortAuditItems,
  toAuditEventLabel,
  toAuditSortLabel,
  toAuditStatusLabel,
  toAuditTargetLabel,
} from "@/components/admin/admin-audit-panel-helpers";
import { useAdminAuditFilterState } from "@/components/admin/use-admin-audit-filter-state";
import { useAdminAuditDensity } from "@/components/admin/use-admin-audit-density";
import { useAdminAuditToolbarState } from "@/components/admin/use-admin-audit-toolbar-state";
import { buildAdminAuditStatusSummary, formatLoadTime } from "@/components/admin/admin-operations-helpers";
import type { CompanyAuditLogSummary } from "@/features/company/company-audit-callables";

type AuditLoadStatus = "idle" | "loading" | "success" | "error";

type AdminAuditPanelProps = {
  status: AuditLoadStatus;
  items: CompanyAuditLogSummary[];
};

export function AdminAuditPanel({ status, items }: AdminAuditPanelProps) {
  const [runbookCopied, setRunbookCopied] = useState(false);
  const [runbookCopiedAt, setRunbookCopiedAt] = useState<string | null>(null);
  const { density: auditDensity, setDensity: setAuditDensity } = useAdminAuditDensity();
  const pathname = usePathname();
  const {
    auditFilter,
    auditEventFilter,
    auditTargetFilter,
    auditSearchQuery,
    auditSort,
    auditActionableOnly,
    presetAuditId,
    hasLocalOverride,
    hasAuditFilter,
    hasQueryPreset,
    visibleCount,
    setVisibleCount,
    applyAuditFilter,
    setAuditEventFilter,
    setAuditTargetFilter,
    setAuditSearchQuery,
    setAuditSort,
    setAuditActionableOnly,
    clearAuditFilters,
    resetToUrlPreset,
  } = useAdminAuditFilterState();

  const auditStatusSummary = useMemo(() => buildAdminAuditStatusSummary(items), [items]);
  const auditEventOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of items) {
      values.add(item.eventType);
    }
    return Array.from(values).sort((left, right) =>
      toAuditEventLabel(left).localeCompare(toAuditEventLabel(right), "tr"),
    );
  }, [items]);
  const auditTargetOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of items) {
      if (item.targetType) {
        values.add(item.targetType);
      }
    }
    return Array.from(values).sort((left, right) =>
      toAuditTargetLabel(left).localeCompare(toAuditTargetLabel(right), "tr"),
    );
  }, [items]);
  const actionableAuditCount = useMemo(
    () => items.filter((item) => isAuditActionable(item.targetType, item.targetId)).length,
    [items],
  );
  const filteredAuditItems = useMemo(() => {
    const query = auditSearchQuery.trim().toLocaleLowerCase("tr");
    return items.filter((item) => {
      if (auditFilter === "success" && item.status !== "success") {
        return false;
      }
      if (auditFilter === "denied" && item.status !== "denied") {
        return false;
      }
      if (auditFilter === "error" && (item.status === "success" || item.status === "denied")) {
        return false;
      }
      if (auditEventFilter !== "all" && item.eventType !== auditEventFilter) {
        return false;
      }
      if (auditTargetFilter !== "all" && item.targetType !== auditTargetFilter) {
        return false;
      }
      if (auditActionableOnly && !isAuditActionable(item.targetType, item.targetId)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        item.eventType,
        item.targetType ?? "",
        item.targetId ?? "",
        item.actorUid ?? "",
        item.reason ?? "",
        item.status,
      ]
        .join(" ")
        .toLocaleLowerCase("tr");
      return haystack.includes(query);
    });
  }, [auditActionableOnly, auditEventFilter, auditFilter, auditSearchQuery, auditTargetFilter, items]);
  const sortedAuditItems = useMemo(() => sortAuditItems(filteredAuditItems, auditSort), [auditSort, filteredAuditItems]);
  const forcedVisibleCount = useMemo(() => {
    if (!presetAuditId) return 0;
    const index = sortedAuditItems.findIndex((item) => item.auditId === presetAuditId);
    if (index === -1) return 0;
    return index + 1;
  }, [presetAuditId, sortedAuditItems]);
  const effectiveVisibleCount = Math.max(visibleCount, forcedVisibleCount);
  const pagedAuditItems = useMemo(
    () => sortedAuditItems.slice(0, effectiveVisibleCount),
    [effectiveVisibleCount, sortedAuditItems],
  );
  const canLoadMore = sortedAuditItems.length > effectiveVisibleCount;
  const pinnedAuditVisible = presetAuditId !== null && sortedAuditItems.some((item) => item.auditId === presetAuditId);

  const firstFilteredAuditItem = sortedAuditItems[0] ?? null;
  const lastFilteredAuditItem = sortedAuditItems[sortedAuditItems.length - 1] ?? null;
  const filteredAuditRangeLabel = useMemo(() => {
    if (!firstFilteredAuditItem || !lastFilteredAuditItem) {
      return "Kayıt bulunmadi";
    }
    const first = formatLoadTime(firstFilteredAuditItem.createdAt);
    const last = formatLoadTime(lastFilteredAuditItem.createdAt);
    return `${first} -> ${last}`;
  }, [firstFilteredAuditItem, lastFilteredAuditItem]);
  const auditFilterSummaryLabel = useMemo(() => {
    if (!hasAuditFilter) {
      return "Tüm filtreler acik";
    }
    const parts: string[] = [];
    if (auditFilter !== "all") {
      parts.push(`durum:${toAuditStatusLabel(auditFilter)}`);
    }
    if (auditEventFilter !== "all") {
      parts.push(`event:${toAuditEventLabel(auditEventFilter)}`);
    }
    if (auditTargetFilter !== "all") {
      parts.push(`hedef:${toAuditTargetLabel(auditTargetFilter)}`);
    }
    if (auditSearchQuery.trim().length > 0) {
      parts.push(`ara:${auditSearchQuery.trim()}`);
    }
    if (auditSort !== "newest") {
      parts.push(`siralama:${toAuditSortLabel(auditSort)}`);
    }
    if (auditActionableOnly) {
      parts.push("actionable:1");
    }
    return parts.join(" | ");
  }, [auditActionableOnly, auditEventFilter, auditFilter, auditSearchQuery, auditSort, auditTargetFilter, hasAuditFilter]);

  const {
    summaryCopied,
    filterLinkCopied,
    csvExported,
    copyAuditSummary,
    copyAuditFilterLink,
    exportAuditCsv,
    clearAuditQueryPreset,
    clearPinnedAuditId,
  } = useAdminAuditToolbarState({
    pathname,
    filterSummaryLabel: auditFilterSummaryLabel,
    filteredRangeLabel: filteredAuditRangeLabel,
    sortedItems: sortedAuditItems,
    statusSummary: {
      success: auditStatusSummary.success,
      denied: auditStatusSummary.denied,
      error: auditStatusSummary.error,
    },
    filter: auditFilter,
    eventFilter: auditEventFilter,
    targetFilter: auditTargetFilter,
    searchQuery: auditSearchQuery,
    sort: auditSort,
    actionableOnly: auditActionableOnly,
  });

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Son Audit Olaylari</h3>
      <p className="mt-1 text-xs text-muted">Son mutasyon olaylari read-only olarak listelenir.</p>

      <AdminAuditKpiCards
        total={auditStatusSummary.total}
        success={auditStatusSummary.success}
        denied={auditStatusSummary.denied}
        error={auditStatusSummary.error}
        actionableCount={actionableAuditCount}
        onSelectFilter={applyAuditFilter}
        onSelectActionable={() => {
          setAuditActionableOnly(true);
        }}
      />

      <AdminAuditStatusFilters
        selectedFilter={auditFilter}
        onSelectFilter={applyAuditFilter}
        total={auditStatusSummary.total}
        success={auditStatusSummary.success}
        denied={auditStatusSummary.denied}
        error={auditStatusSummary.error}
        actionableOnly={auditActionableOnly}
        onToggleActionable={() => {
          setAuditActionableOnly((prev) => !prev);
        }}
        actionableCount={actionableAuditCount}
      />

      {(auditStatusSummary.denied > 0 || auditStatusSummary.error > 0) ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">Denied/Error için hizli aksiyon</div>
            <button
              type="button"
              onClick={() => {
                const text = [
                  "Denied/Error Runbook",
                  "- Policy/RBAC kontrol et (role, memberStatus, tenant lock).",
                  "- Function loglarini kontrol et (son 15 dk). Gerekirse retry et.",
                  "- AuditId ile kaydi sabitle ve destek notu ekle.",
                ].join("\n");
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  void navigator.clipboard.writeText(text).then(() => {
                    setRunbookCopied(true);
                    setRunbookCopiedAt(new Date().toISOString());
                    window.setTimeout(() => setRunbookCopied(false), 1500);
                  });
                }
              }}
              className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-800"
            >
              {runbookCopied ? "Kopyalandi" : "Runbook kopyala"}
            </button>
          </div>
          {runbookCopiedAt ? (
            <div className="mt-1 text-[10px] text-amber-800">
              <span aria-label={`Runbook son kopya zamani ${formatAdminDateTime(runbookCopiedAt)}`}>
                Son kopya: {formatAdminDateTime(runbookCopiedAt)}
              </span>
            </div>
          ) : null}
          <div className="sr-only" role="status" aria-live="polite">
            {runbookCopied ? "Runbook kopyalandi." : ""}
          </div>
          <ul className="mt-1 list-disc pl-4">
            <li>Policy/RBAC kontrol et (role, memberStatus, tenant lock).</li>
            <li>Function loglarini kontrol et (son 15 dk). Gerekirse retry et.</li>
            <li>AuditId ile kaydi sabitle ve destek notu ekle.</li>
          </ul>
        </div>
      ) : null}

      <AdminAuditFilterControls
        eventFilter={auditEventFilter}
        eventOptions={auditEventOptions}
        targetFilter={auditTargetFilter}
        targetOptions={auditTargetOptions}
        searchQuery={auditSearchQuery}
        sort={auditSort}
        hasFilter={hasAuditFilter}
        onEventFilterChange={setAuditEventFilter}
        onTargetFilterChange={setAuditTargetFilter}
        onSearchQueryChange={setAuditSearchQuery}
        onSearchQueryClear={() => {
          setAuditSearchQuery("");
        }}
        onSortChange={setAuditSort}
        onResetFilters={clearAuditFilters}
      />

      <AdminAuditToolbar
        filterSummaryLabel={auditFilterSummaryLabel}
        filteredRangeLabel={filteredAuditRangeLabel}
        density={auditDensity}
        hasLocalOverride={hasLocalOverride}
        hasQueryPreset={hasQueryPreset}
        hasPinnedAuditId={presetAuditId !== null}
        summaryCopied={summaryCopied}
        filterLinkCopied={filterLinkCopied}
        csvExported={csvExported}
        canExportCsv={sortedAuditItems.length > 0}
        onResetToUrlPreset={resetToUrlPreset}
        onClearUrlPreset={clearAuditQueryPreset}
        onClearPinnedAuditId={clearPinnedAuditId}
        onDensityChange={setAuditDensity}
        onCopySummary={() => {
          void copyAuditSummary();
        }}
        onCopyFilterLink={() => {
          void copyAuditFilterLink();
        }}
        onExportCsv={exportAuditCsv}
      />

      <AdminAuditPinnedWarning
        visible={presetAuditId !== null && !pinnedAuditVisible}
        onClearPinned={clearPinnedAuditId}
      />

      {status === "error" ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          Audit kayitlari guncellenemedi. Son bilinen veri gosteriliyor olabilir.
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted">
          Audit kayitlari yukleniyor. Mevcut liste korunuyor.
        </div>
      ) : null}

      <AdminAuditListSection
        status={status}
        filteredCount={filteredAuditItems.length}
        pagedItems={pagedAuditItems}
        totalSortedCount={sortedAuditItems.length}
        auditActionableOnly={auditActionableOnly}
        density={auditDensity}
        canLoadMore={canLoadMore}
        pinnedAuditId={presetAuditId}
        onLoadMore={() => {
          setVisibleCount((prev) => prev + 8);
        }}
      />
    </section>
  );
}

