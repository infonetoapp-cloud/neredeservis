"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";

import type { AuditSortMode } from "@/components/admin/admin-audit-panel-helpers";

export type AdminAuditStatusFilter = "all" | "success" | "denied" | "error";

type AuditFilterState = {
  auditFilter: AdminAuditStatusFilter;
  auditEventFilter: string;
  auditTargetFilter: string;
  auditSearchQuery: string;
  auditSort: AuditSortMode;
  auditActionableOnly: boolean;
  presetAuditId: string | null;
  hasLocalOverride: boolean;
  hasAuditFilter: boolean;
  hasQueryPreset: boolean;
  visibleCount: number;
  setVisibleCount: Dispatch<SetStateAction<number>>;
  applyAuditFilter: (nextFilter: AdminAuditStatusFilter) => void;
  setAuditEventFilter: (value: string) => void;
  setAuditTargetFilter: (value: string) => void;
  setAuditSearchQuery: (value: string) => void;
  setAuditSort: (value: AuditSortMode) => void;
  setAuditActionableOnly: (value: boolean | ((prev: boolean) => boolean)) => void;
  clearAuditFilters: () => void;
  resetToUrlPreset: () => void;
};

function resolvePresetAuditFilter(raw: string | null): AdminAuditStatusFilter {
  if (raw === "success" || raw === "denied" || raw === "error") {
    return raw;
  }
  return "all";
}

function resolvePresetAuditSort(raw: string | null): AuditSortMode {
  if (raw === "oldest" || raw === "status_priority") {
    return raw;
  }
  return "newest";
}

export function useAdminAuditFilterState(): AuditFilterState {
  const searchParams = useSearchParams();

  const presetAuditFilter = useMemo<AdminAuditStatusFilter>(
    () => resolvePresetAuditFilter(searchParams.get("auditStatus")),
    [searchParams],
  );
  const presetAuditEventFilter = useMemo(() => searchParams.get("auditEvent") ?? "all", [searchParams]);
  const presetAuditTargetFilter = useMemo(() => searchParams.get("auditTarget") ?? "all", [searchParams]);
  const presetAuditSearchQuery = useMemo(() => searchParams.get("auditQ") ?? "", [searchParams]);
  const presetAuditSort = useMemo<AuditSortMode>(() => resolvePresetAuditSort(searchParams.get("auditSort")), [searchParams]);
  const presetAuditActionableOnly = useMemo(() => searchParams.get("auditActionable") === "1", [searchParams]);
  const presetAuditId = useMemo(() => searchParams.get("auditId") ?? null, [searchParams]);

  const [hasLocalOverride, setHasLocalOverride] = useState(false);
  const [auditFilterState, setAuditFilterState] = useState<AdminAuditStatusFilter>("all");
  const [auditEventFilterState, setAuditEventFilterState] = useState<string>("all");
  const [auditTargetFilterState, setAuditTargetFilterState] = useState<string>("all");
  const [auditSearchQueryState, setAuditSearchQueryState] = useState<string>("");
  const [auditSortState, setAuditSortState] = useState<AuditSortMode>("newest");
  const [auditActionableOnlyState, setAuditActionableOnlyState] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const auditFilter = hasLocalOverride ? auditFilterState : presetAuditFilter;
  const auditEventFilter = hasLocalOverride ? auditEventFilterState : presetAuditEventFilter;
  const auditTargetFilter = hasLocalOverride ? auditTargetFilterState : presetAuditTargetFilter;
  const auditSearchQuery = hasLocalOverride ? auditSearchQueryState : presetAuditSearchQuery;
  const auditSort = hasLocalOverride ? auditSortState : presetAuditSort;
  const auditActionableOnly = hasLocalOverride ? auditActionableOnlyState : presetAuditActionableOnly;

  const markOverrideAndResetVisible = () => {
    setHasLocalOverride(true);
    setVisibleCount(8);
  };

  const applyAuditFilter = (nextFilter: AdminAuditStatusFilter) => {
    markOverrideAndResetVisible();
    setAuditFilterState(nextFilter);
  };

  const setAuditEventFilter = (value: string) => {
    markOverrideAndResetVisible();
    setAuditEventFilterState(value);
  };

  const setAuditTargetFilter = (value: string) => {
    markOverrideAndResetVisible();
    setAuditTargetFilterState(value);
  };

  const setAuditSearchQuery = (value: string) => {
    markOverrideAndResetVisible();
    setAuditSearchQueryState(value);
  };

  const setAuditSort = (value: AuditSortMode) => {
    markOverrideAndResetVisible();
    setAuditSortState(value);
  };

  const setAuditActionableOnly = (value: boolean | ((prev: boolean) => boolean)) => {
    markOverrideAndResetVisible();
    setAuditActionableOnlyState(value);
  };

  const clearAuditFilters = () => {
    markOverrideAndResetVisible();
    setAuditFilterState("all");
    setAuditEventFilterState("all");
    setAuditTargetFilterState("all");
    setAuditSearchQueryState("");
    setAuditSortState("newest");
    setAuditActionableOnlyState(false);
  };

  const hasAuditFilter = useMemo(
    () =>
      auditFilter !== "all" ||
      auditEventFilter !== "all" ||
      auditTargetFilter !== "all" ||
      auditSearchQuery.trim().length > 0 ||
      auditSort !== "newest" ||
      auditActionableOnly,
    [auditActionableOnly, auditEventFilter, auditFilter, auditSearchQuery, auditSort, auditTargetFilter],
  );

  const hasQueryPreset =
    presetAuditFilter !== "all" ||
    presetAuditEventFilter !== "all" ||
    presetAuditTargetFilter !== "all" ||
    presetAuditSearchQuery.trim().length > 0 ||
    presetAuditSort !== "newest" ||
    presetAuditActionableOnly ||
    presetAuditId !== null;

  const resetToUrlPreset = () => {
    setHasLocalOverride(false);
    setVisibleCount(8);
  };

  return {
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
  };
}
