"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  listCompanyLiveOpsForCompany,
  type CompanyLiveOpsItem,
} from "@/features/company/company-client";

type SnapshotStatus = "loading" | "ready" | "error";

type SnapshotState = {
  status: SnapshotStatus;
  generatedAt: string | null;
  items: CompanyLiveOpsItem[];
  errorMessage: string | null;
};

type CompanyLiveOpsSnapshotContextValue = {
  companyId: string;
  status: SnapshotStatus;
  generatedAt: string | null;
  items: CompanyLiveOpsItem[];
  errorMessage: string | null;
};

type Props = {
  companyId: string;
  children: ReactNode;
  pollIntervalMs?: number;
  limit?: number;
};

const CompanyLiveOpsSnapshotContext = createContext<CompanyLiveOpsSnapshotContextValue | null>(null);

export function CompanyLiveOpsSnapshotProvider({
  companyId,
  children,
  pollIntervalMs = 10_000,
  limit = 200,
}: Props) {
  const { status: authStatus } = useAuthSession();
  const [snapshot, setSnapshot] = useState<SnapshotState>({
    status: "loading",
    generatedAt: null,
    items: [],
    errorMessage: null,
  });

  useEffect(() => {
    if (authStatus !== "signed_in") {
      return;
    }

    let cancelled = false;
    const loadSnapshot = async () => {
      try {
        const nextSnapshot = await listCompanyLiveOpsForCompany({ companyId, limit });
        if (cancelled) {
          return;
        }
        setSnapshot({
          status: "ready",
          generatedAt: nextSnapshot.generatedAt,
          items: nextSnapshot.items,
          errorMessage: null,
        });
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        setSnapshot({
          status: "error",
          generatedAt: null,
          items: [],
          errorMessage: "Canlı operasyon verisi su an alinamiyor. Lutfen birazdan tekrar deneyin.",
        });
      }
    };

    void loadSnapshot();
    const intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [authStatus, companyId, limit, pollIntervalMs]);

  const value = useMemo<CompanyLiveOpsSnapshotContextValue>(
    () => ({
      companyId,
      status: snapshot.status,
      generatedAt: snapshot.generatedAt,
      items: snapshot.items,
      errorMessage: snapshot.errorMessage,
    }),
    [companyId, snapshot],
  );

  return <CompanyLiveOpsSnapshotContext.Provider value={value}>{children}</CompanyLiveOpsSnapshotContext.Provider>;
}

export function useCompanyLiveOpsSnapshot(): CompanyLiveOpsSnapshotContextValue {
  const context = useContext(CompanyLiveOpsSnapshotContext);
  if (!context) {
    throw new Error("CompanyLiveOpsSnapshotProvider eksik.");
  }
  return context;
}

