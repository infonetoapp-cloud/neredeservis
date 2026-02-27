"use client";

import { useEffect, useState } from "react";

import { listCompanyMembersCallable } from "@/features/company/company-callables";
import type { CompanyMemberSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useCompanyMembers(companyId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<CompanyMemberSummary[]>([]);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }

    let cancelled = false;

    void listCompanyMembersCallable({ companyId })
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
      const nextItems = await listCompanyMembersCallable({ companyId });
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
      items: [] as CompanyMemberSummary[],
      error: null as unknown | null,
      reload,
    };
  }

  return { status, items, error, reload };
}
