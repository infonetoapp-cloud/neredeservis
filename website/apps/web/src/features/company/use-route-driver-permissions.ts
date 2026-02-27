"use client";

import { useEffect, useState } from "react";

import { listRouteDriverPermissionsCallable } from "@/features/company/company-callables";
import type { RouteDriverPermissionSummary } from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function useRouteDriverPermissions(
  companyId: string | null,
  routeId: string | null,
  enabled: boolean,
) {
  const [status, setStatus] = useState<LoadStatus>(enabled ? "loading" : "idle");
  const [items, setItems] = useState<RouteDriverPermissionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !companyId || !routeId) {
      return;
    }

    let cancelled = false;

    void listRouteDriverPermissionsCallable({ companyId, routeId })
      .then((nextItems) => {
        if (cancelled) return;
        setItems(nextItems);
        setStatus("success");
        setError(null);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Rota yetkileri yuklenemedi.");
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, enabled, routeId]);

  const reload = async () => {
    if (!enabled || !companyId || !routeId) return;
    setStatus("loading");
    setError(null);
    try {
      const nextItems = await listRouteDriverPermissionsCallable({ companyId, routeId });
      setItems(nextItems);
      setStatus("success");
    } catch (nextError) {
      setStatus("error");
      setError(nextError instanceof Error ? nextError.message : "Rota yetkileri yuklenemedi.");
    }
  };

  if (!enabled || !companyId || !routeId) {
    return {
      status: "idle" as const,
      items: [] as RouteDriverPermissionSummary[],
      error: null as string | null,
      reload,
    };
  }

  return { status, items, error, reload };
}
