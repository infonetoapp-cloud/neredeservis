"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  readAdminChecklistStorageCount,
  readAdminChecklistStorageState,
} from "@/components/admin/admin-checklist-storage-helpers";
import { ADMIN_STORAGE_KEYS, subscribeAdminStorageSync } from "@/components/admin/admin-local-storage-sync";
import {
  ADMIN_PHASE5_TOTALS,
  getAdminPhase5BlockingLabels,
  getAdminPhase5LatestUpdatedAt,
  isAdminPhase5Ready,
  resolveAdminCorsAllowlistTotal,
  type AdminPhase5Metric,
} from "@/components/admin/admin-phase5-readiness-helpers";

export type AdminPhase5ReadinessState = {
  counts: {
    releaseGate: number;
    smokeChecklist: number;
    smokeRunbook: number;
    security: number;
    secrets: number;
    cors: number;
  };
  totals: {
    releaseGate: number;
    smokeChecklist: number;
    smokeRunbook: number;
    security: number;
    secrets: number;
    cors: number;
  };
  updatedAt: {
    releaseGate: string | null;
    smokeChecklist: string | null;
    smokeRunbook: string | null;
    security: string | null;
    secrets: string | null;
    cors: string | null;
    latest: string | null;
  };
  metrics: AdminPhase5Metric[];
  isReady: boolean;
  blockingLabels: string[];
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  refreshFromStorage: () => void;
};

export function useAdminPhase5ReadinessState(): AdminPhase5ReadinessState {
  const [releaseGateCount, setReleaseGateCount] = useState(() => readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.releaseGate));
  const [smokeChecklistCount, setSmokeChecklistCount] = useState(() => readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.smokeChecklist));
  const [smokeRunbookCount, setSmokeRunbookCount] = useState(() => readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.smokeRunbook));
  const [securityCount, setSecurityCount] = useState(() => readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.security));
  const [secretCount, setSecretCount] = useState(() => readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.secrets));
  const [corsCount, setCorsCount] = useState(() => readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.cors));

  const [releaseGateUpdatedAt, setReleaseGateUpdatedAt] = useState<string | null>(
    () => readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.releaseGate).updatedAt,
  );
  const [smokeUpdatedAt, setSmokeUpdatedAt] = useState<string | null>(
    () => readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.smokeChecklist).updatedAt,
  );
  const [runbookUpdatedAt, setRunbookUpdatedAt] = useState<string | null>(
    () => readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.smokeRunbook).updatedAt,
  );
  const [securityUpdatedAt, setSecurityUpdatedAt] = useState<string | null>(
    () => readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.security).updatedAt,
  );
  const [secretUpdatedAt, setSecretUpdatedAt] = useState<string | null>(
    () => readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.secrets).updatedAt,
  );
  const [corsUpdatedAt, setCorsUpdatedAt] = useState<string | null>(
    () => readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.cors).updatedAt,
  );

  const corsTotal = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : null;
    return resolveAdminCorsAllowlistTotal(origin);
  }, []);

  const refreshFromStorage = useCallback(() => {
    setReleaseGateCount(readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.releaseGate));
    setSmokeChecklistCount(readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.smokeChecklist));
    setSmokeRunbookCount(readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.smokeRunbook));
    setSecurityCount(readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.security));
    setSecretCount(readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.secrets));
    setCorsCount(readAdminChecklistStorageCount(ADMIN_STORAGE_KEYS.cors));

    setReleaseGateUpdatedAt(readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.releaseGate).updatedAt);
    setSmokeUpdatedAt(readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.smokeChecklist).updatedAt);
    setRunbookUpdatedAt(readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.smokeRunbook).updatedAt);
    setSecurityUpdatedAt(readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.security).updatedAt);
    setSecretUpdatedAt(readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.secrets).updatedAt);
    setCorsUpdatedAt(readAdminChecklistStorageState(ADMIN_STORAGE_KEYS.cors).updatedAt);
  }, []);

  useEffect(() => {
    return subscribeAdminStorageSync(() => {
      refreshFromStorage();
    });
  }, [refreshFromStorage]);

  const metrics = useMemo<AdminPhase5Metric[]>(
    () => [
      {
        id: "release",
        label: "Release Gate",
        count: releaseGateCount,
        total: ADMIN_PHASE5_TOTALS.releaseGate,
        updatedAt: releaseGateUpdatedAt,
      },
      {
        id: "smoke",
        label: "Smoke Checklist",
        count: smokeChecklistCount,
        total: ADMIN_PHASE5_TOTALS.smokeChecklist,
        updatedAt: smokeUpdatedAt,
      },
      {
        id: "runbook",
        label: "Smoke Runbook",
        count: smokeRunbookCount,
        total: ADMIN_PHASE5_TOTALS.smokeRunbook,
        updatedAt: runbookUpdatedAt,
      },
      {
        id: "security",
        label: "Security",
        count: securityCount,
        total: ADMIN_PHASE5_TOTALS.security,
        updatedAt: securityUpdatedAt,
      },
      {
        id: "secrets",
        label: "Secrets",
        count: secretCount,
        total: ADMIN_PHASE5_TOTALS.secrets,
        updatedAt: secretUpdatedAt,
      },
      {
        id: "cors",
        label: "CORS",
        count: corsCount,
        total: corsTotal,
        updatedAt: corsUpdatedAt,
      },
    ],
    [
      corsCount,
      corsTotal,
      corsUpdatedAt,
      releaseGateCount,
      releaseGateUpdatedAt,
      secretCount,
      secretUpdatedAt,
      securityCount,
      securityUpdatedAt,
      smokeChecklistCount,
      smokeRunbookCount,
      smokeUpdatedAt,
      runbookUpdatedAt,
    ],
  );

  const isReady = useMemo(() => isAdminPhase5Ready(metrics), [metrics]);
  const blockingLabels = useMemo(() => getAdminPhase5BlockingLabels(metrics), [metrics]);
  const latestUpdatedAt = useMemo(() => getAdminPhase5LatestUpdatedAt(metrics), [metrics]);
  const progress = useMemo(() => {
    const total = metrics.reduce((sum, metric) => sum + metric.total, 0);
    const completed = metrics.reduce((sum, metric) => {
      return sum + Math.min(metric.count, metric.total);
    }, 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [metrics]);

  return {
    counts: {
      releaseGate: releaseGateCount,
      smokeChecklist: smokeChecklistCount,
      smokeRunbook: smokeRunbookCount,
      security: securityCount,
      secrets: secretCount,
      cors: corsCount,
    },
    totals: {
      releaseGate: ADMIN_PHASE5_TOTALS.releaseGate,
      smokeChecklist: ADMIN_PHASE5_TOTALS.smokeChecklist,
      smokeRunbook: ADMIN_PHASE5_TOTALS.smokeRunbook,
      security: ADMIN_PHASE5_TOTALS.security,
      secrets: ADMIN_PHASE5_TOTALS.secrets,
      cors: corsTotal,
    },
    updatedAt: {
      releaseGate: releaseGateUpdatedAt,
      smokeChecklist: smokeUpdatedAt,
      smokeRunbook: runbookUpdatedAt,
      security: securityUpdatedAt,
      secrets: secretUpdatedAt,
      cors: corsUpdatedAt,
      latest: latestUpdatedAt,
    },
    metrics,
    isReady,
    blockingLabels,
    progress,
    refreshFromStorage,
  };
}
