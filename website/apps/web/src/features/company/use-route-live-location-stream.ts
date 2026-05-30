"use client";

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

type StreamStatus = "idle" | "connecting" | "live" | "mismatch" | "error";

export function useRouteLiveLocationStream(
  routeId: string | null,
  expectedTripId: string | null,
  enabled: boolean,
) {
  const streamEnabled = enabled && Boolean(routeId) && Boolean(expectedTripId);

  if (!streamEnabled) {
    return {
      status: "idle" as StreamStatus,
      error: null as string | null,
      snapshot: null as RouteLiveLocationStreamSnapshot | null,
      lastEventAt: null as number | null,
      retryAttempt: 0,
      nextRetryAt: null as number | null,
      authRefreshInFlight: false,
    };
  }

  // RTDB istemci zinciri kaldirildigi icin web panel canli konumda read-side snapshot'a duser.
  return {
    status: "idle" as StreamStatus,
    error: null as string | null,
    snapshot: null as RouteLiveLocationStreamSnapshot | null,
    lastEventAt: null as number | null,
    retryAttempt: 0,
    nextRetryAt: null as number | null,
    authRefreshInFlight: false,
  };
}
