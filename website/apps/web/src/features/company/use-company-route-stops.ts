"use client";

import { useEffect, useState } from "react";

import { listCompanyRouteStopsCallable } from "@/features/company/company-callables";
import type { CompanyRouteStopSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useCompanyRouteStops(
  companyId: string | null,
  routeId: string | null,
  enabled: boolean,
) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<CompanyRouteStopSummary[]>([]);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!enabled || !companyId || !routeId) {
      return;
    }

    let cancelled = false;

    void listCompanyRouteStopsCallable({ companyId, routeId })
      .then((nextItems) => {
        if (cancelled) return;
        setItems(nextItems);
        setStatus("success");
        setError(null);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setStatus("error");
        setError(nextError);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, routeId, enabled]);

  const reload = async () => {
    if (!enabled || !companyId || !routeId) return;
    setStatus("loading");
    setError(null);
    try {
      const nextItems = await listCompanyRouteStopsCallable({ companyId, routeId });
      setItems(nextItems);
      setStatus("success");
    } catch (nextError) {
      setStatus("error");
      setError(nextError);
    }
  };

  if (!enabled || !companyId || !routeId) {
    return {
      status: "idle" as const,
      items: [] as CompanyRouteStopSummary[],
      error: null as unknown | null,
      reload,
    };
  }

  return { status, items, error, reload };
}
