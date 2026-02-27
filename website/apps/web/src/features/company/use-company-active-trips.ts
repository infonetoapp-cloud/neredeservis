"use client";

import { useCallback, useEffect, useState } from "react";

import { listActiveTripsByCompanyCallable } from "@/features/company/company-callables";
import type { CompanyActiveTripSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";
type ReloadOptions = { background?: boolean };
type ActiveTripsFilters = {
  routeId?: string | null;
  driverUid?: string | null;
  pageSize?: number;
};

export function useCompanyActiveTrips(
  companyId: string | null,
  enabled: boolean,
  filters?: ActiveTripsFilters,
) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<CompanyActiveTripSummary[]>([]);
  const [error, setError] = useState<unknown | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const routeId = filters?.routeId ?? null;
  const driverUid = filters?.driverUid ?? null;
  const pageSize = filters?.pageSize ?? 50;

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }

    let cancelled = false;

    void listActiveTripsByCompanyCallable({ companyId, routeId, driverUid, pageSize })
      .then((nextItems) => {
        if (cancelled) return;
        setItems(nextItems);
        setStatus("success");
        setError(null);
        setLastLoadedAt(new Date().toISOString());
      })
      .catch((nextError) => {
        if (cancelled) return;
        setStatus("error");
        setError(nextError);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, driverUid, enabled, pageSize, routeId]);

  const reload = useCallback(async (options?: ReloadOptions) => {
    if (!enabled || !companyId) return;
    const background = options?.background === true;
    if (background) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
      setError(null);
    }
    try {
      const nextItems = await listActiveTripsByCompanyCallable({ companyId, routeId, driverUid, pageSize });
      setItems(nextItems);
      setStatus("success");
      setError(null);
      setLastLoadedAt(new Date().toISOString());
    } catch (nextError) {
      setStatus("error");
      setError(nextError);
    } finally {
      if (background) {
        setIsRefreshing(false);
      }
    }
  }, [companyId, driverUid, enabled, pageSize, routeId]);

  if (!enabled || !companyId) {
    return {
      status: "idle" as const,
      items: [] as CompanyActiveTripSummary[],
      error: null as unknown | null,
      isRefreshing: false,
      lastLoadedAt: null as string | null,
      reload,
    };
  }

  return { status, items, error, isRefreshing, lastLoadedAt, reload };
}
