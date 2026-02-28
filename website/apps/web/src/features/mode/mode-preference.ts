"use client";

export type PanelMode = "company" | "individual";

const STORAGE_KEY = "nsv.activePanelMode";
const PANEL_MODE_EVENT = "nsv:panel-mode-changed";

function isPanelMode(value: string | null | undefined): value is PanelMode {
  return value === "company" || value === "individual";
}

export function parsePanelMode(value: string | null | undefined): PanelMode | null {
  return isPanelMode(value) ? value : null;
}

export function readStoredPanelMode(): PanelMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parsePanelMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredPanelMode(mode: PanelMode): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new Event(PANEL_MODE_EVENT));
  } catch {
    // Ignore storage failures during early bootstrap flow.
  }
}

export function subscribePanelMode(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      listener();
    }
  };
  const onCustom = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(PANEL_MODE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PANEL_MODE_EVENT, onCustom);
  };
}

export function resolvePostLoginPath(nextPathRaw: string | null | undefined): string {
  const fallbackMode = readStoredPanelMode();
  const fallbackPath = fallbackMode ? `/dashboard?mode=${fallbackMode}` : "/mode-select";
  const nextPath = (nextPathRaw ?? "").trim();

  if (!nextPath) {
    return fallbackPath;
  }

  if (!nextPath.startsWith("/")) {
    return fallbackPath;
  }

  if (nextPath.startsWith("/dashboard") && !nextPath.includes("mode=") && fallbackMode) {
    return nextPath.includes("?")
      ? `${nextPath}&mode=${fallbackMode}`
      : `${nextPath}?mode=${fallbackMode}`;
  }

  return nextPath;
}

export function getModeLabel(mode: PanelMode): string {
  return mode === "individual" ? "individual" : "company";
}
