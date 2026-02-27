"use client";

import { useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";

import { getFirebaseClientAuth, getFirebaseClientDatabase } from "@/lib/firebase/client";

type StreamStatus = "idle" | "connecting" | "live" | "mismatch" | "error";

export type RouteLiveLocationStreamSnapshot = {
  tripId: string | null;
  lat: number | null;
  lng: number | null;
  timestampMs: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  receivedAt: string;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function pickString(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function pickFiniteNumber(record: Record<string, unknown> | null, key: string): number | null {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function useRouteLiveLocationStream(
  routeId: string | null,
  expectedTripId: string | null,
  enabled: boolean,
) {
  const streamEnabled = enabled && Boolean(routeId) && Boolean(expectedTripId);
  const databaseClient = streamEnabled ? getFirebaseClientDatabase() : null;
  const [status, setStatus] = useState<StreamStatus>(enabled ? "connecting" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RouteLiveLocationStreamSnapshot | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const retryTimerRef = useRef<number | null>(null);
  const lastAuthRefreshAtRef = useRef<number | null>(null);
  const retryAttemptRef = useRef(0);

  useEffect(() => {
    if (!streamEnabled || !routeId || !expectedTripId) {
      return;
    }

    if (!databaseClient) {
      return;
    }

    retryAttemptRef.current = 0;
    const pathRef = ref(databaseClient, `locations/${routeId}`);
    const unsubscribe = onValue(
      pathRef,
      (eventSnapshot) => {
        const payload = toRecord(eventSnapshot.val());
        if (!payload) {
          setSnapshot(null);
          setStatus("connecting");
          setError(null);
          return;
        }

        const payloadTripId = pickString(payload, "tripId");
        const lat = pickFiniteNumber(payload, "lat");
        const lng = pickFiniteNumber(payload, "lng");
        const timestampMs = pickFiniteNumber(payload, "timestamp");
        const accuracy = pickFiniteNumber(payload, "accuracy");
        const speed = pickFiniteNumber(payload, "speed");
        const heading = pickFiniteNumber(payload, "heading");

        setSnapshot({
          tripId: payloadTripId,
          lat,
          lng,
          timestampMs,
          accuracy,
          speed,
          heading,
          receivedAt: new Date().toISOString(),
        });
        setError(null);
        setLastEventAt(Date.now());
        retryAttemptRef.current = 0;
        setRetryAttempt(0);
        setNextRetryAt(null);
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }

        const sameTrip = payloadTripId === expectedTripId;
        const hasCoords = lat != null && lng != null;
        setStatus(sameTrip && hasCoords ? "live" : "mismatch");
      },
      (nextError) => {
        const message = nextError?.message ?? "RTDB stream baglanamadi.";
        setStatus("error");
        setError(message);

        const normalized = message.toLowerCase();
        if (normalized.includes("permission_denied") || normalized.includes("permission denied")) {
          const authClient = getFirebaseClientAuth();
          const now = Date.now();
          const lastRefreshAt = lastAuthRefreshAtRef.current ?? 0;
          if (authClient?.currentUser && now - lastRefreshAt > 60_000) {
            lastAuthRefreshAtRef.current = now;
            authClient.currentUser.getIdToken(true).catch(() => null);
          }
        }

        const nextAttempt = Math.min(6, retryAttemptRef.current + 1);
        retryAttemptRef.current = nextAttempt;
        const delay = Math.min(30_000, 1000 * Math.pow(2, nextAttempt));
        setRetryAttempt(nextAttempt);
        setNextRetryAt(Date.now() + delay);
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
        retryTimerRef.current = window.setTimeout(() => {
          setStatus("connecting");
          setRetryToken((value) => value + 1);
          retryTimerRef.current = null;
        }, delay);
      },
    );

    return () => {
      unsubscribe();
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [databaseClient, expectedTripId, retryToken, routeId, streamEnabled]);
  if (!streamEnabled) {
    return {
      status: "idle" as const,
      error: null as string | null,
      snapshot: null as RouteLiveLocationStreamSnapshot | null,
      lastEventAt: null as number | null,
      retryAttempt: 0,
      nextRetryAt: null as number | null,
    };
  }
  if (!databaseClient) {
    return {
      status: "error" as const,
      error: "Firebase RTDB config hazir degil.",
      snapshot: null as RouteLiveLocationStreamSnapshot | null,
      lastEventAt: null as number | null,
      retryAttempt,
      nextRetryAt,
    };
  }

  return { status, error, snapshot, lastEventAt, retryAttempt, nextRetryAt };
}
