"use client";

import { useEffect, useState } from "react";

import { loadFirebaseRtdbRuntime } from "@/lib/firebase/rtdb";

type RtdbConnectionStatus = "idle" | "connecting" | "online" | "offline" | "error";

export function useRtdbConnectionState(enabled: boolean) {
  const streamEnabled = enabled;
  const [status, setStatus] = useState<RtdbConnectionStatus>(enabled ? "connecting" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!streamEnabled) {
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    void loadFirebaseRtdbRuntime()
      .then(({ databaseModule, clientModule }) => {
        if (cancelled) return;

        const databaseClient = clientModule.getFirebaseClientDatabase();
        if (!databaseClient) {
          setStatus("error");
          setError("Firebase RTDB config hazir degil.");
          return;
        }

        const connectionRef = databaseModule.ref(databaseClient, ".info/connected");
        unsubscribe = databaseModule.onValue(
          connectionRef,
          (snapshot) => {
            const connected = snapshot.val() === true;
            setStatus(connected ? "online" : "offline");
            setError(null);
            setLastChangedAt(new Date().toISOString());
          },
          (nextError) => {
            setStatus("error");
            setError(nextError?.message ?? "RTDB baglanti durumu okunamadi.");
          },
        );
      })
      .catch((nextError) => {
        if (cancelled) return;
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "RTDB runtime yuklenemedi.");
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [streamEnabled]);

  if (!streamEnabled) {
    return { status: "idle" as const, error: null as string | null, lastChangedAt: null as string | null };
  }

  return { status, error, lastChangedAt };
}
