"use client";

import { useEffect, useState } from "react";

import {
  getCompanyAdminTenantStateCallable,
  type CompanyAdminTenantState,
} from "@/features/company/company-audit-callables";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useCompanyAdminTenantState(companyId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [item, setItem] = useState<CompanyAdminTenantState | null>(null);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }

    let cancelled = false;

    void getCompanyAdminTenantStateCallable({ companyId })
      .then((nextItem) => {
        if (cancelled) return;
        setItem(nextItem);
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
      const nextItem = await getCompanyAdminTenantStateCallable({ companyId });
      setItem(nextItem);
      setStatus("success");
    } catch (nextError) {
      setStatus("error");
      setError(nextError);
    }
  };

  if (!enabled || !companyId) {
    return {
      status: "idle" as const,
      item: null as CompanyAdminTenantState | null,
      error: null as unknown | null,
      reload,
    };
  }

  return { status, item, error, reload };
}
