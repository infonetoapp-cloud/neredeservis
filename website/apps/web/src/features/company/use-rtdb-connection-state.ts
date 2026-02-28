"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";

import { getFirebaseClientDatabase } from "@/lib/firebase/client";

type RtdbConnectionStatus = "idle" | "connecting" | "online" | "offline" | "error";

export function useRtdbConnectionState(enabled: boolean) {
  const streamEnabled = enabled;
  const databaseClient = streamEnabled ? getFirebaseClientDatabase() : null;
  const [status, setStatus] = useState<RtdbConnectionStatus>(enabled ? "connecting" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!streamEnabled) {
      return;
    }

    if (!databaseClient) {
      return;
    }

    const connectionRef = ref(databaseClient, ".info/connected");
    const unsubscribe = onValue(
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

    return () => unsubscribe();
  }, [databaseClient, streamEnabled]);

  if (!streamEnabled) {
    return { status: "idle" as const, error: null as string | null, lastChangedAt: null as string | null };
  }

  if (!databaseClient) {
    return {
      status: "error" as const,
      error: "Firebase RTDB config hazir degil.",
      lastChangedAt: null as string | null,
    };
  }

  return { status, error, lastChangedAt };
}

