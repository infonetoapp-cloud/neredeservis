"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { AdminAuditPanel } from "@/components/admin/admin-audit-panel";
import { AdminCorsAllowlistCard } from "@/components/admin/admin-cors-allowlist-card";
import { AdminCostAlertsCard } from "@/components/admin/admin-cost-alerts-card";
import { AdminKpiGrid } from "@/components/admin/admin-kpi-grid";
import { AdminOperationsStatusCard } from "@/components/admin/admin-operations-status-card";
import { AdminPhase5ScopeCard } from "@/components/admin/admin-phase5-scope-card";
import { AdminPhase5SummaryCard } from "@/components/admin/admin-phase5-summary-card";
import { AdminReleaseGateCard } from "@/components/admin/admin-release-gate-card";
import { AdminRiskSection } from "@/components/admin/admin-risk-section";
import { AdminSecurityHardeningCard } from "@/components/admin/admin-security-hardening-card";
import { AdminSecretHygieneCard } from "@/components/admin/admin-secret-hygiene-card";
import { AdminSidePanel } from "@/components/admin/admin-side-panel";
import { AdminSmokeChecklistCard } from "@/components/admin/admin-smoke-checklist-card";
import { AdminStagingSmokeRunbookCard } from "@/components/admin/admin-staging-smoke-runbook-card";
import { AdminTenantStatePanel } from "@/components/admin/admin-tenant-state-panel";
import { AdminTenantStateMutationCard } from "@/components/admin/admin-tenant-state-mutation-card";
import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";
import {
  buildAdminPhase5BlockingSummary,
  resolveAdminPhase5FirstBlockingLink,
} from "@/components/admin/admin-phase5-blocking-link-helpers";
import {
  getAdminPhase5FreshnessLabel,
  getAdminPhase5FreshnessTone,
} from "@/components/admin/admin-phase5-readiness-helpers";
import { useAdminMinuteTick } from "@/components/admin/use-admin-minute-tick";
import { useAdminPhase5ReadinessState } from "@/components/admin/use-admin-phase5-readiness-state";
import { useAdminRiskPriorityState } from "@/components/admin/use-admin-risk-priority-state";
import {
  ADMIN_QUICK_ACTIONS,
  buildAdminKpiSnapshot,
  formatLoadTime,
} from "@/components/admin/admin-operations-helpers";
import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyAdminTenantState } from "@/features/company/use-company-admin-tenant-state";
import { useCompanyAuditLogs } from "@/features/company/use-company-audit-logs";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyRoutes } from "@/features/company/use-company-routes";
import { useCompanyVehicles } from "@/features/company/use-company-vehicles";

export function AdminOperationsFeature() {
  const [isReloading, setIsReloading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nowMs = useAdminMinuteTick();

  const activeCompany = useActiveCompanyPreference();
  const membershipState = useActiveCompanyMembership();
  const phase5Readiness = useAdminPhase5ReadinessState();
  const companyId = activeCompany?.companyId ?? membershipState.membership?.companyId ?? null;
  const dataEnabled = Boolean(companyId);

  const membersQuery = useCompanyMembers(companyId, dataEnabled);
  const vehiclesQuery = useCompanyVehicles(companyId, dataEnabled);
  const routesQuery = useCompanyRoutes(companyId, dataEnabled);
  const activeTripsQuery = useCompanyActiveTrips(companyId, dataEnabled, { pageSize: 30 });
  const auditQuery = useCompanyAuditLogs(companyId, dataEnabled);
  const tenantStateQuery = useCompanyAdminTenantState(companyId, dataEnabled);

  const snapshot = useMemo(
    () =>
      buildAdminKpiSnapshot({
        members: membersQuery.items,
        vehicles: vehiclesQuery.items,
        routes: routesQuery.items,
        activeTrips: activeTripsQuery.items,
      }),
    [activeTripsQuery.items, membersQuery.items, routesQuery.items, vehiclesQuery.items],
  );

  const riskState = useAdminRiskPriorityState({
    pathname,
    searchParams,
    snapshot,
    tenantState: tenantStateQuery.item,
    auditItems: auditQuery.items,
  });

  const firstError =
    membersQuery.error ??
    vehiclesQuery.error ??
    routesQuery.error ??
    activeTripsQuery.error ??
    auditQuery.error ??
    tenantStateQuery.error ??
    null;

  const isLoading =
    membersQuery.status === "loading" ||
    vehiclesQuery.status === "loading" ||
    routesQuery.status === "loading" ||
    activeTripsQuery.status === "loading" ||
    auditQuery.status === "loading" ||
    tenantStateQuery.status === "loading";

  const loadStateRows = [
    {
      key: "members",
      label: "Uye Verisi",
      status: membersQuery.status,
    },
    {
      key: "vehicles",
      label: "Arac Verisi",
      status: vehiclesQuery.status,
    },
    {
      key: "routes",
      label: "Rota Verisi",
      status: routesQuery.status,
    },
    {
      key: "active-trips",
      label: "Canli Sefer Verisi",
      status: activeTripsQuery.status,
    },
    {
      key: "audit",
      label: "Audit Verisi",
      status: auditQuery.status,
    },
    {
      key: "tenant-state",
      label: "Tenant Durumu",
      status: tenantStateQuery.status,
    },
  ] as const;

  const phase5BlockingSummary = buildAdminPhase5BlockingSummary(phase5Readiness.blockingLabels, 3);
  const phase5FirstBlocking = resolveAdminPhase5FirstBlockingLink(phase5Readiness.blockingLabels);
  const phase5FreshnessLabel = getAdminPhase5FreshnessLabel(phase5Readiness.updatedAt.latest, nowMs);
  const phase5FreshnessTone = getAdminPhase5FreshnessTone(phase5Readiness.updatedAt.latest, nowMs);
  const phase5FreshnessUpdatedLabel = `Readiness son guncelleme: ${formatAdminDateTime(phase5Readiness.updatedAt.latest)}`;
  const phase5ProgressLabel = `${phase5Readiness.progress.completed}/${phase5Readiness.progress.total} (%${phase5Readiness.progress.percent})`;

  const handleReloadAll = async () => {
    if (!dataEnabled || isReloading) return;
    setIsReloading(true);
    await Promise.allSettled([
      membersQuery.reload(),
      vehiclesQuery.reload(),
      routesQuery.reload(),
      activeTripsQuery.reload(),
      auditQuery.reload(),
      tenantStateQuery.reload(),
    ]);
    setIsReloading(false);
  };

  const workspace = !dataEnabled ? (
    <DashboardStatePlaceholder
      tone="info"
      title="Aktif company baglami bulunamadi"
      description="Admin ekrani company baglaminda calisir. Mode seciminden company secip tekrar dene."
    />
  ) : (
    <div className="space-y-4">
      <nav className="rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hizli Bolum Gecisi</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { href: "#admin-release-gate", label: "Release Gate" },
            { href: "#admin-smoke", label: "Smoke" },
            { href: "#admin-phase5", label: "Faz 5" },
            { href: "#admin-security", label: "Guvenlik" },
            { href: "#admin-risk", label: "Risk" },
            { href: "#admin-audit", label: "Audit" },
            { href: "#admin-tenant", label: "Tenant" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex rounded-full border border-line bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <AdminOperationsStatusCard
        companyName={activeCompany?.companyName ?? null}
        role={membershipState.role ?? null}
        memberStatus={membershipState.memberStatus ?? null}
        lastLoadedLabel={formatLoadTime(activeTripsQuery.lastLoadedAt)}
        isPhase5Ready={phase5Readiness.isReady}
        phase5BlockingSummary={phase5BlockingSummary}
        phase5ProgressLabel={phase5ProgressLabel}
        phase5FreshnessLabel={phase5FreshnessLabel}
        phase5FreshnessTone={phase5FreshnessTone}
        phase5FreshnessUpdatedLabel={phase5FreshnessUpdatedLabel}
        phase5FirstBlockingHref={phase5FirstBlocking?.href ?? null}
        phase5FirstBlockingTitle={phase5FirstBlocking?.title ?? null}
        isReloading={isReloading}
        isLoading={isLoading}
        onReload={() => {
          void handleReloadAll();
        }}
      />
      {phase5FreshnessTone === "warn" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 shadow-sm">
          <div className="font-semibold">Faz 5 checklist tazeligi dusuk</div>
          <div className="mt-1">
            {phase5FreshnessLabel}. {phase5FreshnessUpdatedLabel}. Operasyon acilisindan once checklist ve runbook adimlarini guncelle.
          </div>
          <a
            href="#phase5-summary"
            className="mt-2 inline-flex rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-800 hover:text-amber-900"
          >
            Faz 5 durum ozetine git
          </a>
        </section>
      ) : null}

      <section id="admin-release-gate" className="scroll-mt-24">
        <AdminReleaseGateCard />
      </section>
      <section id="admin-smoke" className="scroll-mt-24">
        <AdminSmokeChecklistCard />
      </section>
      <AdminStagingSmokeRunbookCard />
      <section id="admin-phase5" className="scroll-mt-24">
        <AdminPhase5SummaryCard
          readiness={phase5Readiness}
          freshnessLabel={phase5FreshnessLabel}
          freshnessTone={phase5FreshnessTone}
          freshnessUpdatedLabel={phase5FreshnessUpdatedLabel}
        />
      </section>
      <section id="admin-security" className="scroll-mt-24">
        <AdminSecurityHardeningCard />
      </section>
      <AdminSecretHygieneCard />
      <AdminCorsAllowlistCard />
      <AdminCostAlertsCard />
      <AdminPhase5ScopeCard />

      {firstError ? (
        <DashboardStatePlaceholder
          tone="error"
          title="Admin read-side yuklenemedi"
          description={mapCompanyCallableErrorToMessage(firstError)}
        />
      ) : null}

      <AdminKpiGrid snapshot={snapshot} />

      <section id="admin-tenant" className="scroll-mt-24">
        <AdminTenantStatePanel status={tenantStateQuery.status} item={tenantStateQuery.item} />
      </section>
      <AdminTenantStateMutationCard
        companyId={companyId}
        tenantState={tenantStateQuery.item}
        enabled={dataEnabled}
        onUpdated={async () => {
          await Promise.allSettled([tenantStateQuery.reload(), auditQuery.reload()]);
        }}
      />

      <section id="admin-risk" className="scroll-mt-24">
        <AdminRiskSection
          warningCount={riskState.riskSummary.warning}
          attentionCount={riskState.riskSummary.attention}
          infoCount={riskState.riskSummary.info}
          lastUpdatedLabel={formatLoadTime(activeTripsQuery.lastLoadedAt)}
          selectedSeverity={riskState.riskSeverityFilter}
          searchQuery={riskState.riskSearchQuery}
          hasLocalOverride={riskState.hasRiskLocalOverride}
          hasQueryPreset={riskState.hasRiskQueryPreset}
          visibleItems={riskState.visibleRiskItems}
          totalCount={riskState.severityFilteredRiskCount}
          riskModeLabel={riskState.riskModeLabel}
          readiness={phase5Readiness}
          phase5FreshnessLabel={phase5FreshnessLabel}
          phase5FreshnessTone={phase5FreshnessTone}
          phase5FreshnessUpdatedLabel={phase5FreshnessUpdatedLabel}
          onToggleSeverity={(severity) => {
            riskState.setHasRiskLocalOverride(true);
            riskState.setRiskSeverityFilterState((prev) => (prev === severity ? "all" : severity));
          }}
          onClearSeverity={() => {
            riskState.setHasRiskLocalOverride(true);
            riskState.setRiskSeverityFilterState("all");
          }}
          onResetToPreset={() => {
            riskState.setHasRiskLocalOverride(false);
          }}
          onClearQueryPreset={riskState.clearRiskQueryPreset}
          onSearchChange={(value) => {
            riskState.setHasRiskLocalOverride(true);
            riskState.setRiskSearchQueryState(value);
          }}
          onSearchClear={() => {
            riskState.setHasRiskLocalOverride(true);
            riskState.setRiskSearchQueryState("");
          }}
        />
      </section>

      <section id="admin-audit" className="scroll-mt-24">
        <AdminAuditPanel status={auditQuery.status} items={auditQuery.items} />
      </section>
    </div>
  );

  const sidePanel = (
    <AdminSidePanel
      quickActions={ADMIN_QUICK_ACTIONS}
      quickActionBadgeByHref={riskState.quickActionBadgeByHref}
      loadStateRows={loadStateRows}
      readiness={phase5Readiness}
      freshnessLabel={phase5FreshnessLabel}
      freshnessTone={phase5FreshnessTone}
      freshnessUpdatedLabel={phase5FreshnessUpdatedLabel}
    />
  );

  const headlineMetrics = [
    { label: "Aktif Sefer", value: snapshot.activeTripsTotal.toString() },
    { label: "Online Sefer", value: snapshot.activeTripsOnline.toString() },
    { label: "Uyeler", value: snapshot.membersTotal.toString() },
    { label: "Araclar", value: snapshot.vehiclesTotal.toString() },
    { label: "Rotalar", value: snapshot.routesTotal.toString() },
    {
      label: "Faz 5 Hazirlik",
      value: phase5Readiness.isReady ? "Hazir" : phase5ProgressLabel,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_56%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_48%)]" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            Admin Operations
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Operasyon denetimi, risk triage ve release gate merkezi
            </h1>
            <p className="max-w-4xl text-sm leading-6 text-muted">
              Owner/Admin ekipleri icin audit, tenant-state, checklist ve canlı operasyon metrikleri tek ekranda toplanir.
              Bu yuzey production release oncesi karar vermeyi hizlandirir ve kritik aksiyonlara dogrudan gecis saglar.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {headlineMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/80 bg-white/75 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/60"
              >
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{metric.label}</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0">{workspace}</div>
        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">{sidePanel}</aside>
      </div>
    </section>
  );
}
