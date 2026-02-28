"use client";

export type DashboardDensity = "comfortable" | "compact";

const DASHBOARD_DENSITY_KEY = "nsv.dashboardDensity";
const DASHBOARD_DENSITY_EVENT = "nsv:dashboard-density-changed";

function isDensity(value: string | null | undefined): value is DashboardDensity {
  return value === "comfortable" || value === "compact";
}

export function readDashboardDensity(): DashboardDensity {
  if (typeof window === "undefined") {
    return "comfortable";
  }

  try {
    const stored = window.localStorage.getItem(DASHBOARD_DENSITY_KEY);
    return isDensity(stored) ? stored : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function writeDashboardDensity(value: DashboardDensity): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DASHBOARD_DENSITY_KEY, value);
    window.dispatchEvent(new Event(DASHBOARD_DENSITY_EVENT));
  } catch {
    // Ignore local storage failures in phase-1 shell.
  }
}

export function subscribeDashboardDensity(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === DASHBOARD_DENSITY_KEY) {
      listener();
    }
  };
  const onCustom = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(DASHBOARD_DENSITY_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DASHBOARD_DENSITY_EVENT, onCustom);
  };
}
