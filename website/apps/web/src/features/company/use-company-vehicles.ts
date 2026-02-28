"use client";

import { useEffect, useState } from "react";

import { listCompanyVehiclesCallable } from "@/features/company/company-callables";
import type { CompanyVehicleSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useCompanyVehicles(companyId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<CompanyVehicleSummary[]>([]);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }

    let cancelled = false;

    void listCompanyVehiclesCallable({ companyId, limit: 50 })
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
  }, [companyId, enabled]);

  const reload = async () => {
    if (!enabled || !companyId) return;
    setStatus("loading");
    setError(null);
    try {
      const nextItems = await listCompanyVehiclesCallable({ companyId, limit: 50 });
      setItems(nextItems);
      setStatus("success");
    } catch (nextError) {
      setStatus("error");
      setError(nextError);
    }
  };

  if (!enabled || !companyId) {
    return {
      status: "idle" as const,
      items: [] as CompanyVehicleSummary[],
      error: null as unknown | null,
      reload,
    };
  }

  return { status, items, error, reload };
}
