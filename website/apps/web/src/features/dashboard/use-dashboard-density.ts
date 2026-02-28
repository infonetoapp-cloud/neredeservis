"use client";

import { useSyncExternalStore } from "react";

import {
  readDashboardDensity,
  subscribeDashboardDensity,
  type DashboardDensity,
} from "@/features/dashboard/shell-preferences";

export function useDashboardDensity(): DashboardDensity {
  return useSyncExternalStore(
    subscribeDashboardDensity,
    readDashboardDensity,
    () => "comfortable",
  );
}
