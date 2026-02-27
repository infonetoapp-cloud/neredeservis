"use client";

import { useEffect, useState } from "react";

import {
  listCompanyAuditLogsCallable,
  type CompanyAuditLogSummary,
} from "@/features/company/company-audit-callables";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useCompanyAuditLogs(companyId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<CompanyAuditLogSummary[]>([]);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }

    let cancelled = false;

    void listCompanyAuditLogsCallable({ companyId })
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
      const nextItems = await listCompanyAuditLogsCallable({ companyId });
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
      items: [] as CompanyAuditLogSummary[],
      error: null as unknown | null,
      reload,
    };
  }

  return { status, items, error, reload };
}
