"use client";

import { useEffect, useState } from "react";

type RtdbConnectionStatus = "idle" | "connecting" | "online" | "offline" | "error";

export function useRtdbConnectionState(enabled: boolean) {
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLastChangedAt(null);
      return;
    }
    setLastChangedAt(new Date().toISOString());
  }, [enabled]);

  if (!enabled) {
    return {
      status: "idle" as RtdbConnectionStatus,
      error: null as string | null,
      lastChangedAt: null as string | null,
    };
  }

  // Web panel artik RTDB istemcisine baglanmiyor; read-side snapshot akisi online kabul edilir.
  return {
    status: "online" as RtdbConnectionStatus,
    error: null as string | null,
    lastChangedAt,
  };
}
