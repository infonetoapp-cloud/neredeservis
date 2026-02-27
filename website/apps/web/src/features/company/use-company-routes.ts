"use client";

import { useEffect, useState } from "react";

import { listCompanyRoutesCallable } from "@/features/company/company-callables";
import type { CompanyRouteSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useCompanyRoutes(
  companyId: string | null,
  enabled: boolean,
  includeArchived: boolean = false,
) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<CompanyRouteSummary[]>([]);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }

    let cancelled = false;

    void listCompanyRoutesCallable({ companyId, includeArchived, limit: 50 })
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
  }, [companyId, enabled, includeArchived]);

  const reload = async () => {
    if (!enabled || !companyId) return;
    setStatus("loading");
    setError(null);
    try {
      const nextItems = await listCompanyRoutesCallable({
        companyId,
        includeArchived,
        limit: 50,
      });
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
      items: [] as CompanyRouteSummary[],
      error: null as unknown | null,
      reload,
    };
  }

  return { status, items, error, reload };
}
