"use client";

import type { PanelMode } from "@/features/mode/mode-preference";

type ActivePanelModeState = {
  queryMode: PanelMode;
  storedMode: PanelMode;
  resolvedMode: PanelMode;
};

/**
 * MVP'de web her zaman "company" modunda çalışır.
 * Hook imzası geriye uyumluluk için korunuyor.
 */
export function useActivePanelMode(): ActivePanelModeState {
  return { queryMode: "company", storedMode: "company", resolvedMode: "company" };
}
