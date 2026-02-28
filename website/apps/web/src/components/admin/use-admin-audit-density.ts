"use client";

import { useEffect, useState } from "react";

import {
  ADMIN_STORAGE_KEYS,
  emitAdminStorageSync,
  subscribeAdminStorageSync,
} from "@/components/admin/admin-local-storage-sync";

export type AdminAuditDensity = "comfortable" | "compact";

const DEFAULT_DENSITY: AdminAuditDensity = "comfortable";

function toAdminAuditDensity(value: string | null): AdminAuditDensity {
  return value === "compact" ? "compact" : DEFAULT_DENSITY;
}

export function useAdminAuditDensity() {
  const [density, setDensityState] = useState<AdminAuditDensity>(() => {
    if (typeof window === "undefined") return DEFAULT_DENSITY;
    return toAdminAuditDensity(window.localStorage.getItem(ADMIN_STORAGE_KEYS.auditDensity));
  });

  useEffect(() => {
    const unsubscribe = subscribeAdminStorageSync((key) => {
      if (key !== ADMIN_STORAGE_KEYS.auditDensity || typeof window === "undefined") return;
      setDensityState(toAdminAuditDensity(window.localStorage.getItem(key)));
    });
    return unsubscribe;
  }, []);

  const setDensity = (next: AdminAuditDensity) => {
    setDensityState(next);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.auditDensity, next);
    emitAdminStorageSync(ADMIN_STORAGE_KEYS.auditDensity);
  };

  return { density, setDensity };
}
