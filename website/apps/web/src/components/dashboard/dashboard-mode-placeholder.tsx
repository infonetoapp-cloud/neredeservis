"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthSessionStatusCard } from "@/components/auth/auth-session-status-card";
import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid";
import {
  buildCompanyQuickActionItems,
  buildCompanySummary,
  formatLastSignal,
  type CompanyQuickActionItem,
  type CompanySummary,
} from "@/components/dashboard/dashboard-mode-placeholder-helpers";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyRoutes } from "@/features/company/use-company-routes";
import { useCompanyVehicles } from "@/features/company/use-company-vehicles";
import {
  getModeLabel,
  parsePanelMode,
  readStoredPanelMode,
  writeStoredPanelMode,
  type PanelMode,
} from "@/features/mode/mode-preference";

function quickActionToneClass(item: CompanyQuickActionItem): string {
  if (item.tone === "warning") {
    return "border-rose-200 bg-rose-50 hover:bg-rose-100";
  }
  if (item.tone === "attention") {
    return "border-amber-200 bg-amber-50 hover:bg-amber-100";
  }
  return "border-line bg-white hover:bg-slate-50";
}

export function DashboardModePlaceholder() {
  const searchParams = useSearchParams();
  const queryMode = parsePanelMode(searchParams.get("mode"));
  const [storedMode] = useState<PanelMode | null>(() => readStoredPanelMode());
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();

  useEffect(() => {
    if (!queryMode) {
      return;
    }
    writeStoredPanelMode(queryMode);
  }, [queryMode]);

  const resolvedMode = useMemo<PanelMode | null>(
    () => queryMode ?? storedMode,
    [queryMode, storedMode],
  );

  const companyId = activeCompany?.companyId ?? null;
  const dashboardDataEnabled = authStatus === "signed_in" && Boolean(companyId);
  const membersQuery = useCompanyMembers(companyId, dashboardDataEnabled);
  const vehiclesQuery = useCompanyVehicles(companyId, dashboardDataEnabled);
  const routesQuery = useCompanyRoutes(companyId, dashboardDataEnabled);
  const activeTripsQuery = useCompanyActiveTrips(companyId, dashboardDataEnabled, { pageSize: 20 });

  const companyLoading =
    dashboardDataEnabled &&
    (membersQuery.status === "loading" ||
      vehiclesQuery.status === "loading" ||
      routesQuery.status === "loading" ||
      activeTripsQuery.status === "loading");
  const companyError =
    membersQuery.error ??
    vehiclesQuery.error ??
    routesQuery.error ??
    activeTripsQuery.error ??
    null;

  const companySummary: CompanySummary | null = useMemo(() => {
    return buildCompanySummary({
      companyEnabled: dashboardDataEnabled,
      membersStatus: membersQuery.status,
      membersItems: membersQuery.items,
      vehiclesStatus: vehiclesQuery.status,
      vehiclesItems: vehiclesQuery.items,
      routesStatus: routesQuery.status,
      routesItems: routesQuery.items,
      activeTripsStatus: activeTripsQuery.status,
      activeTripsItems: activeTripsQuery.items,
    });
  }, [
    dashboardDataEnabled,
    activeTripsQuery.items,
    activeTripsQuery.status,
    membersQuery.items,
    membersQuery.status,
    routesQuery.items,
    routesQuery.status,
    vehiclesQuery.items,
    vehiclesQuery.status,
  ]);
  const individualSummaryItems = useMemo(
    () => [
      {
        label: "Aktif Seferler",
        value: companyLoading ? "Yukleniyor..." : `${companySummary?.activeTrips ?? 0} sefer`,
      },
      {
        label: "Planli Rotalar",
        value: companyLoading ? "Yukleniyor..." : `${companySummary?.routes ?? 0} rota`,
      },
      {
        label: "Aktif Araclar",
        value: companyLoading ? "Yukleniyor..." : `${companySummary?.activeVehicles ?? 0} arac`,
      },
    ],
    [companyLoading, companySummary],
  );

  if (!resolvedMode) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Mod secimi bulunamadi. Once mod secim ekranina gidip bir mod sec.
        </div>
        <Link
          href="/mode-select"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Mod Secim Ekranina Git
        </Link>
      </section>
    );
  }

  const modeLabel = getModeLabel(resolvedMode);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-muted">Aktif Mod</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{modeLabel}</div>
            {resolvedMode === "company" ? (
              <div className="mt-2 text-xs text-muted">
                Aktif Company:{" "}
                <span className="font-semibold text-slate-900">
                  {activeCompany?.companyName ?? "Secim bekleniyor"}
                </span>
              </div>
            ) : null}
          </div>
          <Link
            href="/mode-select"
            className="inline-flex items-center rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Modu Degistir
          </Link>
        </div>
      </div>

      {resolvedMode === "company" && companyError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Dashboard verileri yuklenemedi: {mapCompanyCallableErrorToMessage(companyError)}
        </div>
      ) : null}

      <DashboardKpiGrid mode={resolvedMode} companySummary={companySummary} loading={companyLoading} />

      <AuthSessionStatusCard />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-900">
            {resolvedMode === "individual" ? "Sefer Haritasi Alani" : "Live Ops Onizleme"}
          </div>
          {resolvedMode === "individual" ? (
            <div className="h-80 rounded-xl border border-line bg-gradient-to-br from-slate-100 to-white" />
          ) : companyLoading ? (
            <div className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
              Live ops ozeti yukleniyor...
            </div>
          ) : activeTripsQuery.items.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
              Aktif sefer yok. Sofor sefer baslattiginda burada gorunecek.
            </div>
          ) : (
            <div className="space-y-2">
              {activeTripsQuery.items.slice(0, 5).map((trip) => (
                <Link
                  key={trip.tripId}
                  href={`/live-ops?tripId=${encodeURIComponent(trip.tripId)}&routeId=${encodeURIComponent(
                    trip.routeId,
                  )}&driverUid=${encodeURIComponent(trip.driverUid)}&sort=signal_desc`}
                  className="block rounded-xl border border-line bg-white p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {trip.driverPlate ?? "Plaka yok"} - {trip.routeName}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        trip.liveState === "online"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {trip.liveState === "online" ? "Canli" : "Stale"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {trip.driverName} - Son sinyal {formatLastSignal(trip.lastLocationAt)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-900">
            {resolvedMode === "individual" ? "Bugun Ozeti" : "Hizli Aksiyonlar"}
          </div>
          {resolvedMode === "individual" ? (
            <div className="space-y-3">
              {individualSummaryItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-line p-3">
                  <div className="text-sm font-medium text-slate-900">{item.label}</div>
                  <div className="mt-1 text-xs text-muted">{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {buildCompanyQuickActionItems(companySummary).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl border p-3 ${quickActionToneClass(item)}`}
                >
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <div className="mt-1 text-xs text-muted">{companyLoading ? "Yukleniyor..." : item.meta}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
