"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import {
  parsePanelMode,
  readStoredPanelMode,
  subscribePanelMode,
  type PanelMode,
} from "@/features/mode/mode-preference";

type ActivePanelModeState = {
  queryMode: PanelMode | null;
  storedMode: PanelMode | null;
  resolvedMode: PanelMode | null;
};

export function useActivePanelMode(): ActivePanelModeState {
  const searchParams = useSearchParams();
  const queryMode = parsePanelMode(searchParams.get("mode"));

  const storedMode = useSyncExternalStore(
    subscribePanelMode,
    readStoredPanelMode,
    () => null,
  );

  const resolvedMode = useMemo<PanelMode | null>(
    () => queryMode ?? storedMode,
    [queryMode, storedMode],
  );

  return { queryMode, storedMode, resolvedMode };
}
