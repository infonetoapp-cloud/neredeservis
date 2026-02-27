"use client";

import { useCallback, useState } from "react";

import {
  buildAuditFilterUrl,
  buildAuditSummaryText,
  downloadAuditCsv,
  type AuditSortMode,
} from "@/components/admin/admin-audit-panel-helpers";
import type { CompanyAuditLogSummary } from "@/features/company/company-audit-callables";

type UseAdminAuditToolbarStateInput = {
  pathname: string | null;
  filterSummaryLabel: string;
  filteredRangeLabel: string;
  sortedItems: CompanyAuditLogSummary[];
  statusSummary: {
    success: number;
    denied: number;
    error: number;
  };
  filter: "all" | "success" | "denied" | "error";
  eventFilter: string;
  targetFilter: string;
  searchQuery: string;
  sort: AuditSortMode;
  actionableOnly: boolean;
};

export function useAdminAuditToolbarState({
  pathname,
  filterSummaryLabel,
  filteredRangeLabel,
  sortedItems,
  statusSummary,
  filter,
  eventFilter,
  targetFilter,
  searchQuery,
  sort,
  actionableOnly,
}: UseAdminAuditToolbarStateInput) {
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [filterLinkCopied, setFilterLinkCopied] = useState(false);
  const [csvExported, setCsvExported] = useState(false);

  const copyAuditSummary = useCallback(async () => {
    const text = buildAuditSummaryText({
      filterSummaryLabel,
      filteredRangeLabel,
      total: sortedItems.length,
      success: statusSummary.success,
      denied: statusSummary.denied,
      error: statusSummary.error,
      topItem: sortedItems[0] ?? null,
    });
    try {
      await navigator.clipboard.writeText(text);
      setSummaryCopied(true);
      window.setTimeout(() => {
        setSummaryCopied(false);
      }, 1400);
    } catch {
      setSummaryCopied(false);
    }
  }, [filterSummaryLabel, filteredRangeLabel, sortedItems, statusSummary.denied, statusSummary.error, statusSummary.success]);

  const copyAuditFilterLink = useCallback(async () => {
    const fullUrl = buildAuditFilterUrl({
      pathname: pathname || "/admin",
      origin: window.location.origin,
      filter,
      eventFilter,
      targetFilter,
      searchQuery,
      sort,
      actionableOnly,
    });

    try {
      await navigator.clipboard.writeText(fullUrl);
      setFilterLinkCopied(true);
      window.setTimeout(() => {
        setFilterLinkCopied(false);
      }, 1400);
    } catch {
      setFilterLinkCopied(false);
    }
  }, [actionableOnly, eventFilter, filter, pathname, searchQuery, sort, targetFilter]);

  const exportAuditCsv = useCallback(() => {
    const exported = downloadAuditCsv(sortedItems);
    if (!exported) {
      setCsvExported(false);
      return;
    }

    setCsvExported(true);
    window.setTimeout(() => {
      setCsvExported(false);
    }, 1400);
  }, [sortedItems]);

  const clearAuditQueryPreset = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("auditStatus");
    params.delete("auditEvent");
    params.delete("auditTarget");
    params.delete("auditQ");
    params.delete("auditSort");
    params.delete("auditActionable");
    params.delete("auditId");
    const queryString = params.toString();
    const nextUrl = queryString.length > 0 ? `${pathname || "/admin"}?${queryString}` : pathname || "/admin";
    window.location.assign(nextUrl);
  }, [pathname]);

  const clearPinnedAuditId = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("auditId");
    const queryString = params.toString();
    const nextUrl = queryString.length > 0 ? `${pathname || "/admin"}?${queryString}` : pathname || "/admin";
    window.location.assign(nextUrl);
  }, [pathname]);

  return {
    summaryCopied,
    filterLinkCopied,
    csvExported,
    copyAuditSummary,
    copyAuditFilterLink,
    exportAuditCsv,
    clearAuditQueryPreset,
    clearPinnedAuditId,
  };
}
