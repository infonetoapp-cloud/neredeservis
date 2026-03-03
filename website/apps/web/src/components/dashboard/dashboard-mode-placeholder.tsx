"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, RadioTower, Truck, Users, MapPin, Activity, ChevronRight } from "lucide-react";

import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid";
import {
  buildCompanySummary,
  formatLastSignal,
  type CompanySummary,
} from "@/components/dashboard/dashboard-mode-placeholder-helpers";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyRoutes } from "@/features/company/use-company-routes";
import { useCompanyVehicles } from "@/features/company/use-company-vehicles";

export function DashboardModePlaceholder() {
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();

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

  if (!activeCompany) {
    return (
      <section className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <RadioTower className="h-7 w-7 text-slate-400" />
        </div>
        <div className="mb-1.5 text-[17px] font-semibold text-slate-900">Şirket seçilmedi</div>
        <div className="mb-7 text-sm text-slate-500">
          Paneli kullanmak için önce üye olduğunuz bir şirket seçin.
        </div>
        <Link
          href="/select-company"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Şirket Seç
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  /* initials for company avatar */
  const companyInitials = (activeCompany.companyName ?? "?")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section className="space-y-5">
      {/* ── Company header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* avatar */}
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-md shadow-blue-500/25">
            {companyInitials}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Aktif Şirket
            </div>
            <div className="text-[17px] font-bold leading-tight text-slate-900">
              {activeCompany.companyName ?? "Yükleniyor..."}
            </div>
          </div>
        </div>
        <Link
          href="/select-company"
          className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          Değiştir
        </Link>
      </div>

      {companyError ? (
        <div className="rounded-2xl bg-rose-50 px-5 py-3.5 text-sm text-rose-700 ring-1 ring-rose-200">
          Veriler yüklenemedi: {mapCompanyCallableErrorToMessage(companyError)}
        </div>
      ) : null}

      {/* ── KPI grid ── */}
      <DashboardKpiGrid companySummary={companySummary} loading={companyLoading} />

      {/* ── Bottom grid ── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">

        {/* Live Ops */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[13px] font-semibold text-slate-900">Canlı Seferler</span>
              {activeTripsQuery.items.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {activeTripsQuery.items.length}
                </span>
              )}
            </div>
            {activeTripsQuery.items.length > 0 && (
              <Link
                href="/live-ops"
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700"
              >
                Tümünü gör →
              </Link>
            )}
          </div>

          <div className="border-t border-slate-100">
            {companyLoading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">Yükleniyor...</div>
            ) : activeTripsQuery.items.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <Activity className="mb-3 h-6 w-6 text-slate-300" />
                <div className="text-[13px] font-medium text-slate-500">Aktif sefer yok</div>
                <div className="mt-1 text-[12px] text-slate-400">
                  Şoför sefer başlattığında burada görünür
                </div>
              </div>
            ) : (
              <div>
                {activeTripsQuery.items.slice(0, 5).map((trip, i) => (
                  <Link
                    key={trip.tripId}
                    href={`/live-ops?tripId=${encodeURIComponent(trip.tripId)}&routeId=${encodeURIComponent(
                      trip.routeId,
                    )}&driverUid=${encodeURIComponent(trip.driverUid)}&sort=signal_desc`}
                    className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50 ${
                      i !== 0 ? "border-t border-slate-100" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-slate-900">
                        {trip.driverPlate ?? "Plaka yok"} &mdash; {trip.routeName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {trip.driverName} · Son sinyal {formatLastSignal(trip.lastLocationAt)}
                      </div>
                    </div>
                    <span
                      className={`ml-4 flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        trip.liveState === "online"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {trip.liveState === "online" ? "Canlı" : "Gecişmeli"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick nav — iOS settings style */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
          <div className="px-5 py-4">
            <span className="text-[13px] font-semibold text-slate-900">Hızlı Erişim</span>
          </div>
          <div className="border-t border-slate-100">
            {([
              {
                href: "/drivers",
                icon: Users,
                iconBg: "bg-violet-500",
                label: "Şoförler",
                sub: companyLoading ? "…" : `${companySummary?.members ?? 0} üye`,
              },
              {
                href: "/vehicles",
                icon: Truck,
                iconBg: "bg-blue-500",
                label: "Araçlar",
                sub: companyLoading ? "…" : `${companySummary?.activeVehicles ?? 0} aktif`,
              },
              {
                href: "/routes",
                icon: MapPin,
                iconBg: "bg-emerald-500",
                label: "Rotalar",
                sub: companyLoading ? "…" : `${companySummary?.routes ?? 0} rota`,
              },
            ] as const).map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 ${
                    i !== 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] ${item.iconBg}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.sub}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
