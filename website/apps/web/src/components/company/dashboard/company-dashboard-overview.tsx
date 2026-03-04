"use client";

import { useEffect, useMemo, useState } from "react";

import { LayoutDashboard } from "lucide-react";
import { useCompanyMembership } from "@/components/company/company-membership-context";
import { CompanyDashboardAlerts } from "@/components/company/dashboard/company-dashboard-alerts";
import { CompanyDashboardFeed } from "@/components/company/dashboard/company-dashboard-feed";
import { CompanyDashboardKpis } from "@/components/company/dashboard/company-dashboard-kpis";
import { CompanyDashboardMiniMap } from "@/components/company/dashboard/company-dashboard-mini-map";
import { CompanyDashboardQuickActions } from "@/components/company/dashboard/company-dashboard-quick-actions";
import { useCompanyLiveOpsSnapshot } from "@/components/live-ops/company-live-ops-snapshot-context";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import {
  listCompanyDriversForCompany,
  type CompanyDriverItem,
  type CompanyVehicleItem,
  listCompanyVehiclesForCompany,
} from "@/features/company/company-client";

type Props = {
  companyId: string;
};

export function CompanyDashboardOverview({ companyId }: Props) {
  const { status, generatedAt, items, errorMessage } = useCompanyLiveOpsSnapshot();
  const { memberRole } = useCompanyMembership();
  const [companyVehicles, setCompanyVehicles] = useState<CompanyVehicleItem[]>([]);
  const [companyDrivers, setCompanyDrivers] = useState<CompanyDriverItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const fetchData = () => {
    setDataLoading(true);
    setDataError(null);
    Promise.allSettled([
      listCompanyVehiclesForCompany({ companyId, limit: 200 }),
      listCompanyDriversForCompany({ companyId, limit: 200 }),
    ])
      .then(([vehiclesResult, driversResult]) => {
        setCompanyVehicles(
          vehiclesResult.status === "fulfilled" ? vehiclesResult.value : [],
        );
        setCompanyDrivers(
          driversResult.status === "fulfilled" ? driversResult.value : [],
        );
        // Only surface an error if BOTH failed
        if (vehiclesResult.status === "rejected" && driversResult.status === "rejected") {
          const err = vehiclesResult.reason;
          setDataError(err instanceof Error ? err.message : "Veri yüklenirken bir hata oluştu.");
        }
        setDataLoading(false);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [companyId]);

  const vehicleFocusedItems = useMemo(() => {
    if (items.length === 0 || companyVehicles.length === 0) {
      return [];
    }

    const driversById = new Map(companyDrivers.map((driver) => [driver.driverId, driver]));
    const vehiclesById = new Map(companyVehicles.map((vehicle) => [vehicle.vehicleId, vehicle]));
    const vehiclesByPlate = new Map(
      companyVehicles.map((vehicle) => [vehicle.plate.replace(/\s+/g, "").toUpperCase(), vehicle]),
    );
    const vehiclesBySuffix = new Map<string, CompanyVehicleItem[]>();
    for (const vehicle of companyVehicles) {
      const normalized = vehicle.plate.replace(/\s+/g, "").toUpperCase();
      const suffix = normalized.slice(-2);
      if (!suffix) {
        continue;
      }
      const existing = vehiclesBySuffix.get(suffix) ?? [];
      existing.push(vehicle);
      vehiclesBySuffix.set(suffix, existing);
    }

    const focused = items
      .map((item) => {
        const driver = item.driverId ? driversById.get(item.driverId) : null;
        const directByVehicleId = item.vehicleId ? vehiclesById.get(item.vehicleId) ?? null : null;

        let matchedVehicle = directByVehicleId;
        if (!matchedVehicle && driver) {
          const mask = driver.plateMasked.replace(/\s+/g, "").toUpperCase();
          const suffix = mask.slice(-2);
          if (suffix) {
            const directByPlate = vehiclesByPlate.get(mask);
            const suffixCandidates = vehiclesBySuffix.get(suffix) ?? [];
            matchedVehicle = directByPlate ?? suffixCandidates[0] ?? null;
          }
        }

        if (!matchedVehicle) {
          return null;
        }

        return {
          ...item,
          vehicleId: matchedVehicle.vehicleId,
          vehiclePlate: matchedVehicle.plate,
          vehicleLabel: matchedVehicle.label,
          driverName: driver?.name ?? "Sofor bilgisi yok",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const uniqueByVehicleId = new Map<string, (typeof focused)[number]>();
    for (const item of focused) {
      const existing = uniqueByVehicleId.get(item.vehicleId);
      if (!existing) {
        uniqueByVehicleId.set(item.vehicleId, item);
        continue;
      }
      const existingTs = existing.locationTimestampMs ?? 0;
      const nextTs = item.locationTimestampMs ?? 0;
      if (nextTs > existingTs) {
        uniqueByVehicleId.set(item.vehicleId, item);
      }
    }

    return Array.from(uniqueByVehicleId.values());
  }, [companyDrivers, companyVehicles, items]);

  const summary = useMemo(() => {
    const routesTracked = items.length;
    let activeTrips = 0;
    let liveRoutes = 0;
    let attentionRoutes = 0;

    for (const item of items) {
      if (item.tripId) {
        activeTrips += 1;
      }
      if (item.status === "live") {
        liveRoutes += 1;
      }
      if (item.status === "stale" || item.status === "no_signal") {
        attentionRoutes += 1;
      }
    }

    return {
      routesTracked,
      activeTrips,
      liveRoutes,
      attentionRoutes,
    };
  }, [items]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="OPERASYON MERKEZİ"
        title="Dashboard"
        description="Tek bakışta rota, sefer, risk ve canlı konum özetini görüntüleyin."
        accent="indigo"
        icon={<LayoutDashboard className="h-4 w-4" />}
      />

      {dataError ? (
        <ErrorState
          message="Veri yüklenemedi"
          detail={dataError}
          onRetry={fetchData}
        />
      ) : null}

      <CompanyDashboardKpis
        routesTracked={summary.routesTracked}
        activeTrips={summary.activeTrips}
        liveRoutes={summary.liveRoutes}
        attentionRoutes={summary.attentionRoutes}
        loading={dataLoading && status === "loading"}
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <CompanyDashboardMiniMap
          companyId={companyId}
          items={vehicleFocusedItems}
          totalVehicleCount={companyVehicles.length}
        />
        <CompanyDashboardFeed companyId={companyId} items={items} generatedAt={generatedAt} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <CompanyDashboardAlerts snapshotStatus={status} errorMessage={errorMessage} items={items} />
        <CompanyDashboardQuickActions companyId={companyId} memberRole={memberRole} />
      </div>
    </div>
  );
}
