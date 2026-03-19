"use client";

import { useEffect, useMemo, useState } from "react";

import { LayoutDashboard } from "lucide-react";
import { CompanyDashboardAlerts } from "@/components/company/dashboard/company-dashboard-alerts";
import { CompanyDashboardFeed } from "@/components/company/dashboard/company-dashboard-feed";
import {
  CompanyDashboardKpis,
  type CompanyDashboardKpiInsights,
} from "@/components/company/dashboard/company-dashboard-kpis";
import { CompanyDashboardMiniMap } from "@/components/company/dashboard/company-dashboard-mini-map";
import { useCompanyLiveOpsSnapshot } from "@/components/live-ops/company-live-ops-snapshot-context";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  listCompanyDriversForCompany,
  listCompanyVehiclesForCompany,
  type CompanyDriverItem,
  type CompanyLiveOpsItem,
  type CompanyVehicleItem,
} from "@/features/company/company-client";

type Props = {
  companyId: string;
};

const KPI_BUCKET_COUNT = 8;
const KPI_BUCKET_MS = 5 * 60 * 1000;

type KpiSeries = {
  routesTracked: number[];
  activeTrips: number[];
  liveRoutes: number[];
  attentionRoutes: number[];
};

function createSeries(): KpiSeries {
  return {
    routesTracked: Array.from({ length: KPI_BUCKET_COUNT }, () => 0),
    activeTrips: Array.from({ length: KPI_BUCKET_COUNT }, () => 0),
    liveRoutes: Array.from({ length: KPI_BUCKET_COUNT }, () => 0),
    attentionRoutes: Array.from({ length: KPI_BUCKET_COUNT }, () => 0),
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function toTrend(values: number[], invert = false): { value: string; direction: "up" | "down" | "flat" } {
  const split = Math.floor(values.length / 2);
  const firstHalf = sum(values.slice(0, split));
  const secondHalf = sum(values.slice(split));

  if (firstHalf === 0 && secondHalf === 0) {
    return { value: "Stabil", direction: "flat" };
  }

  const pct = Math.round(((secondHalf - firstHalf) / Math.max(firstHalf, 1)) * 100);
  if (Math.abs(pct) < 8) {
    return { value: "Stabil", direction: "flat" };
  }

  const rawDirection: "up" | "down" = pct > 0 ? "up" : "down";
  const direction = invert ? (rawDirection === "up" ? "down" : "up") : rawDirection;
  const sign = pct > 0 ? "+" : "";
  return { value: `${sign}${pct}%`, direction };
}

function buildKpiInsights(items: CompanyLiveOpsItem[]): CompanyDashboardKpiInsights {
  const series = createSeries();
  const windowStart = Date.now() - KPI_BUCKET_COUNT * KPI_BUCKET_MS;

  for (const item of items) {
    const bucketIndex =
      item.locationTimestampMs == null || item.locationTimestampMs < windowStart
        ? KPI_BUCKET_COUNT - 1
        : Math.min(
            KPI_BUCKET_COUNT - 1,
            Math.max(0, Math.floor((item.locationTimestampMs - windowStart) / KPI_BUCKET_MS)),
          );

    series.routesTracked[bucketIndex] += 1;
    if (item.tripId) {
      series.activeTrips[bucketIndex] += 1;
    }
    if (item.status === "live") {
      series.liveRoutes[bucketIndex] += 1;
    }
    if (item.status === "stale" || item.status === "no_signal") {
      series.attentionRoutes[bucketIndex] += 1;
    }
  }

  return {
    routesTracked: {
      trend: toTrend(series.routesTracked),
      sparkline: series.routesTracked,
    },
    activeTrips: {
      trend: toTrend(series.activeTrips),
      sparkline: series.activeTrips,
    },
    liveRoutes: {
      trend: toTrend(series.liveRoutes),
      sparkline: series.liveRoutes,
    },
    attentionRoutes: {
      trend: toTrend(series.attentionRoutes, true),
      sparkline: series.attentionRoutes,
    },
  };
}

export function CompanyDashboardOverview({ companyId }: Props) {
  const { status, generatedAt, items, errorMessage } = useCompanyLiveOpsSnapshot();
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
    ]).then(([vehiclesResult, driversResult]) => {
      setCompanyVehicles(vehiclesResult.status === "fulfilled" ? vehiclesResult.value : []);
      setCompanyDrivers(driversResult.status === "fulfilled" ? driversResult.value : []);

      if (vehiclesResult.status === "rejected" && driversResult.status === "rejected") {
        const err = vehiclesResult.reason;
        setDataError(err instanceof Error ? err.message : "Veri yüklenirken bir hata oluştu.");
      }

      setDataLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, [companyId]);

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
          driverName: driver?.name ?? "Şoför bilgisi yok",
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

  const kpiInsights = useMemo(() => buildKpiInsights(items), [items]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="OPERASYON MERKEZİ"
        title="Dashboard"
        description="Tek bakışta rota, sefer, risk ve canlı konum özetini görüntüleyin."
        accent="indigo"
        icon={<LayoutDashboard className="h-4 w-4" />}
      />

      {dataError ? <ErrorState message="Veri yüklenemedi" detail={dataError} onRetry={fetchData} /> : null}

      <CompanyDashboardKpis
        routesTracked={summary.routesTracked}
        activeTrips={summary.activeTrips}
        liveRoutes={summary.liveRoutes}
        attentionRoutes={summary.attentionRoutes}
        insights={kpiInsights}
        loading={dataLoading && status === "loading"}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
        <CompanyDashboardMiniMap
          companyId={companyId}
          items={vehicleFocusedItems}
          totalVehicleCount={companyVehicles.length}
        />
        <CompanyDashboardFeed companyId={companyId} items={items} generatedAt={generatedAt} />
      </div>

      <CompanyDashboardAlerts snapshotStatus={status} errorMessage={errorMessage} items={items} />
    </div>
  );
}
