"use client";

import { useMemo, useState } from "react";

import { isAuditActionable } from "@/components/admin/admin-audit-panel-helpers";
import {
  buildAdminAuditStatusSummary,
  buildAdminRiskItems,
  type AdminKpiSnapshot,
  type AdminRiskItem,
} from "@/components/admin/admin-operations-helpers";
import type {
  CompanyAdminTenantState,
  CompanyAuditLogSummary,
} from "@/features/company/company-audit-callables";

type SearchParamsLike = {
  get: (name: string) => string | null;
};

type UseAdminRiskPriorityStateInput = {
  pathname: string | null;
  searchParams: SearchParamsLike;
  snapshot: AdminKpiSnapshot;
  tenantState: CompanyAdminTenantState | null;
  auditItems: CompanyAuditLogSummary[];
};

export function useAdminRiskPriorityState({
  pathname,
  searchParams,
  snapshot,
  tenantState,
  auditItems,
}: UseAdminRiskPriorityStateInput) {
  const presetRiskSeverityFilter = useMemo<"all" | "warning" | "attention" | "info">(() => {
    const raw = searchParams.get("riskSeverity");
    if (raw === "warning" || raw === "attention" || raw === "info") {
      return raw;
    }
    return "all";
  }, [searchParams]);
  const presetRiskSearchQuery = useMemo(() => searchParams.get("riskQ") ?? "", [searchParams]);

  const [hasRiskLocalOverride, setHasRiskLocalOverride] = useState(false);
  const [riskSeverityFilterState, setRiskSeverityFilterState] = useState<"all" | "warning" | "attention" | "info">(
    "all",
  );
  const [riskSearchQueryState, setRiskSearchQueryState] = useState("");

  const riskSeverityFilter = hasRiskLocalOverride ? riskSeverityFilterState : presetRiskSeverityFilter;
  const riskSearchQuery = hasRiskLocalOverride ? riskSearchQueryState : presetRiskSearchQuery;
  const hasRiskQueryPreset = presetRiskSeverityFilter !== "all" || presetRiskSearchQuery.trim().length > 0;

  const baseRiskItems = useMemo(() => buildAdminRiskItems(snapshot), [snapshot]);
  const auditStatusSummary = useMemo(() => buildAdminAuditStatusSummary(auditItems), [auditItems]);
  const actionableAuditCount = useMemo(
    () => auditItems.filter((item) => isAuditActionable(item.targetType, item.targetId)).length,
    [auditItems],
  );
  const tenantRiskItems = useMemo<AdminRiskItem[]>(() => {
    if (!tenantState) return [];

    const items: AdminRiskItem[] = [];
    if (tenantState.companyStatus === "suspended") {
      items.push({
        id: "tenant-suspended",
        severity: "warning",
        title: "Tenant status askida",
        description: "Firma tenant'i suspended durumda. Mutasyon akislarini dikkatle denetle.",
        href: "/drivers?status=suspended",
        ctaLabel: "Askidaki Uyeleri Incele",
      });
    }
    if (tenantState.billingStatus === "past_due") {
      items.push({
        id: "tenant-past-due",
        severity: "attention",
        title: "Billing status past_due",
        description: "Odeme durumu gecikmede. Suspension politikasina gore takip et.",
        href: "/admin",
        ctaLabel: "Admin Durumunu Takip Et",
      });
    }
    if (tenantState.billingStatus === "suspended_locked") {
      items.push({
        id: "tenant-suspended-locked",
        severity: "warning",
        title: "Billing status suspended_locked",
        description: "Tenant kilitli gorunuyor. Internal admin operasyonu gerekir.",
        href: "/admin",
        ctaLabel: "Kilit Durumunu Dogrula",
      });
    }
    return items;
  }, [tenantState]);
  const auditRiskItems = useMemo<AdminRiskItem[]>(() => {
    const items: AdminRiskItem[] = [];
    if (auditStatusSummary.error > 0) {
      items.push({
        id: "audit-error",
        severity: "warning",
        title: "Audit hata kayitlari var",
        description: `${auditStatusSummary.error} audit kaydi hata durumunda gorunuyor.`,
        href: "/admin?auditStatus=error",
        ctaLabel: "Hata Kayitlarini Ac",
      });
    }
    if (auditStatusSummary.denied > 0) {
      items.push({
        id: "audit-denied",
        severity: "attention",
        title: "Denied audit olaylari var",
        description: `${auditStatusSummary.denied} islem policy nedeniyle denied olmus.`,
        href: "/admin?auditStatus=denied",
        ctaLabel: "Denied Kayitlarini Incele",
      });
    }
    if (actionableAuditCount > 0) {
      items.push({
        id: "audit-actionable",
        severity: "info",
        title: "Aksiyonlanabilir audit kayitlari var",
        description: `${actionableAuditCount} kayit dogrudan hedef ekrana yonlendirilebilir.`,
        href: "/admin?auditActionable=1",
        ctaLabel: "Aksiyonlanabilir Kayitlari Ac",
      });
    }
    return items;
  }, [actionableAuditCount, auditStatusSummary.denied, auditStatusSummary.error]);
  const allRiskItems = useMemo<AdminRiskItem[]>(() => {
    const merged: AdminRiskItem[] = [...tenantRiskItems, ...auditRiskItems, ...baseRiskItems];
    const severityRank = { warning: 0, attention: 1, info: 2 } as const;
    return merged.sort((left, right) => {
      const leftRank = severityRank[left.severity];
      const rightRank = severityRank[right.severity];
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.title.localeCompare(right.title, "tr");
    });
  }, [auditRiskItems, baseRiskItems, tenantRiskItems]);

  const severityFilteredRiskCount = useMemo(
    () =>
      riskSeverityFilter === "all"
        ? allRiskItems.length
        : allRiskItems.filter((item) => item.severity === riskSeverityFilter).length,
    [allRiskItems, riskSeverityFilter],
  );
  const visibleRiskItems = useMemo(() => {
    const bySeverity =
      riskSeverityFilter === "all"
        ? allRiskItems
        : allRiskItems.filter((item) => item.severity === riskSeverityFilter);

    const query = riskSearchQuery.trim().toLocaleLowerCase("tr");
    if (!query) {
      return bySeverity;
    }

    return bySeverity.filter((item) => {
      const haystack = `${item.title} ${item.description} ${item.ctaLabel}`.toLocaleLowerCase("tr");
      return haystack.includes(query);
    });
  }, [allRiskItems, riskSearchQuery, riskSeverityFilter]);
  const riskSummary = useMemo(() => {
    let warning = 0;
    let attention = 0;
    let info = 0;
    for (const item of allRiskItems) {
      if (item.severity === "warning") {
        warning += 1;
        continue;
      }
      if (item.severity === "attention") {
        attention += 1;
        continue;
      }
      info += 1;
    }
    return { warning, attention, info };
  }, [allRiskItems]);
  const riskModeLabel =
    riskSeverityFilter === "all"
      ? "Tum seviyeler"
      : riskSeverityFilter === "warning"
        ? "Kritik"
        : riskSeverityFilter === "attention"
          ? "Uyari"
          : "Bilgi";
  const quickActionBadgeByHref = useMemo<Record<string, number>>(
    () => ({
      "/admin?auditStatus=denied": auditStatusSummary.denied,
      "/admin?auditStatus=error": auditStatusSummary.error,
      "/admin?auditActionable=1": actionableAuditCount,
      "/admin?riskSeverity=warning": riskSummary.warning,
    }),
    [actionableAuditCount, auditStatusSummary.denied, auditStatusSummary.error, riskSummary.warning],
  );

  return {
    riskSeverityFilter,
    riskSearchQuery,
    hasRiskLocalOverride,
    hasRiskQueryPreset,
    visibleRiskItems,
    severityFilteredRiskCount,
    riskModeLabel,
    riskSummary,
    quickActionBadgeByHref,
    setHasRiskLocalOverride,
    setRiskSeverityFilterState,
    setRiskSearchQueryState,
    clearRiskQueryPreset: () => {
      const params = new URLSearchParams(window.location.search);
      params.delete("riskSeverity");
      params.delete("riskQ");
      const queryString = params.toString();
      const nextUrl = queryString.length > 0 ? `${pathname || "/admin"}?${queryString}` : pathname || "/admin";
      window.location.assign(nextUrl);
    },
  };
}
