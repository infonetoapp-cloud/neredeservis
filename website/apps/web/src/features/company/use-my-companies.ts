"use client";

import { useEffect, useState } from "react";

import { listMyCompaniesCallable } from "@/features/company/company-callables";
import type { CompanyMembershipSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useMyCompanies(enabled: boolean) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<CompanyMembershipSummary[]>([]);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    void listMyCompaniesCallable()
      .then((nextItems) => {
        if (cancelled) return;
        setItems(nextItems);
        setStatus("success");
      })
      .catch((nextError) => {
        if (cancelled) return;
        setStatus("error");
        setError(nextError);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const reload = async () => {
    if (!enabled) return;
    setStatus("loading");
    setError(null);
    try {
      const nextItems = await listMyCompaniesCallable();
      setItems(nextItems);
      setStatus("success");
    } catch (nextError) {
      setStatus("error");
      setError(nextError);
    }
  };

  if (!enabled) {
    return {
      status: "idle" as const,
      items: [] as CompanyMembershipSummary[],
      error: null as unknown | null,
      reload,
    };
  }

  const derivedStatus: LoadStatus = status === "idle" ? "loading" : status;
  return { status: derivedStatus, items, error, reload };
}
