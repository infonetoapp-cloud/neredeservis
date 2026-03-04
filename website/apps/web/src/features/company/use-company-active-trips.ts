"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listActiveTripsByCompanyCallable } from "@/features/company/company-callables";
import type { CompanyActiveTripSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";
type ReloadOptions = { background?: boolean };
type ActiveTripsFilters = {
  routeId?: string | null;
  driverUid?: string | null;
  limit?: number;
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
  const requestSeqRef = useRef(0);
  const inFlightRef = useRef(false);
  const routeId = filters?.routeId ?? null;
  const driverUid = filters?.driverUid ?? null;
  const limit = filters?.limit ?? 50;

  const runLoad = useCallback(
    async (options?: ReloadOptions) => {
      if (!enabled || !companyId) return;
      const background = options?.background === true;

      // Avoid stacking background refresh calls while one fetch is in flight.
      if (background && inFlightRef.current) {
        return;
      }

      const requestSeq = ++requestSeqRef.current;
      inFlightRef.current = true;

      if (background) {
        setIsRefreshing(true);
      } else {
        setStatus("loading");
        setError(null);
      }

      try {
        const nextItems = await listActiveTripsByCompanyCallable({
          companyId,
          routeId,
          driverUid,
          limit,
        });
        if (requestSeq !== requestSeqRef.current) {
          return;
        }
        setItems(nextItems);
        setStatus("success");
        setError(null);
        setLastLoadedAt(new Date().toISOString());
      } catch (nextError) {
        if (requestSeq !== requestSeqRef.current) {
          return;
        }
        setStatus("error");
        setError(nextError);
      } finally {
        if (requestSeq === requestSeqRef.current) {
          inFlightRef.current = false;
          setIsRefreshing(false);
        }
      }
    },
    [companyId, driverUid, enabled, limit, routeId],
  );

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }

    let cancelled = false;

    void runLoad().finally(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
      requestSeqRef.current += 1;
      inFlightRef.current = false;
    };
  }, [companyId, enabled, runLoad]);

  const reload = useCallback(
    async (options?: ReloadOptions) => {
      await runLoad(options);
    },
    [runLoad],
  );

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
