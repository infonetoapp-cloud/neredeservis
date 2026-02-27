"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type LiveOpsStreamStaleReason,
  resolveStreamIssueState,
  streamErrorSemantic,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import { useCompanyRouteStops } from "@/features/company/use-company-route-stops";
import { useRouteLiveLocationStream } from "@/features/company/use-route-live-location-stream";
import { useRtdbConnectionState } from "@/features/company/use-rtdb-connection-state";
import type { CompanyActiveTripSummary } from "@/features/company/company-types";

type AuthStatus = "loading" | "signed_out" | "signed_in" | "disabled";

type EffectiveLiveCoords = {
  lat: number | null;
  lng: number | null;
  source: "rtdb_stream" | "rtdb" | "trip_doc";
  stale: boolean;
} | null;

type UseLiveOpsSelectedTripStreamStateArgs = {
  authStatus: AuthStatus;
  companyId: string | null;
  selectedTrip: CompanyActiveTripSummary | null;
  tripsStatus: "idle" | "loading" | "success" | "error";
};

const STREAM_STALE_TIMEOUT_MS = 45_000;
const STREAM_LAG_TICK_MS = 15_000;

export function useLiveOpsSelectedTripStreamState({
  authStatus,
  companyId,
  selectedTrip,
  tripsStatus,
}: UseLiveOpsSelectedTripStreamStateArgs) {
  const liveStreamEnabled =
    authStatus === "signed_in" && Boolean(companyId) && tripsStatus !== "error";
  const rtdbConnection = useRtdbConnectionState(liveStreamEnabled);
  const selectedTripLiveStream = useRouteLiveLocationStream(
    selectedTrip?.routeId ?? null,
    selectedTrip?.tripId ?? null,
    liveStreamEnabled && Boolean(selectedTrip),
  );

  const selectedTripStopsQuery = useCompanyRouteStops(
    companyId,
    selectedTrip?.routeId ?? null,
    authStatus === "signed_in" && Boolean(companyId) && Boolean(selectedTrip),
  );
  const [streamNowMs, setStreamNowMs] = useState(() => Date.now());

  const streamHasSelectedTripCoords =
    selectedTripLiveStream.status === "live" &&
    selectedTripLiveStream.snapshot?.lat != null &&
    selectedTripLiveStream.snapshot?.lng != null;
  useEffect(() => {
    if (!liveStreamEnabled || !selectedTrip) {
      return;
    }
    const timer = window.setInterval(() => {
      setStreamNowMs(Date.now());
    }, STREAM_LAG_TICK_MS);
    return () => window.clearInterval(timer);
  }, [liveStreamEnabled, selectedTrip]);

  const streamLagMs = useMemo(() => {
    if (!selectedTripLiveStream.lastEventAt) {
      return null;
    }
    return Math.max(0, streamNowMs - selectedTripLiveStream.lastEventAt);
  }, [selectedTripLiveStream.lastEventAt, streamNowMs]);
  const streamLagTimeoutStale =
    selectedTripLiveStream.status === "live" &&
    streamLagMs != null &&
    streamLagMs > STREAM_STALE_TIMEOUT_MS;
  const streamStale =
    rtdbConnection.status === "offline" ||
    selectedTripLiveStream.status === "mismatch" ||
    selectedTripLiveStream.status === "error" ||
    streamLagTimeoutStale;
  const streamStaleReason: LiveOpsStreamStaleReason =
    rtdbConnection.status === "offline"
      ? "connection_offline"
      : selectedTripLiveStream.status === "error"
        ? "stream_error"
        : selectedTripLiveStream.status === "mismatch"
          ? "stream_mismatch"
          : streamLagTimeoutStale
            ? "stream_lag_timeout"
            : "none";
  const streamLagSeconds = streamLagMs == null ? null : Math.floor(streamLagMs / 1000);

  const effectiveLiveCoords = useMemo<EffectiveLiveCoords>(() => {
    if (streamHasSelectedTripCoords && selectedTripLiveStream.snapshot) {
      return {
        lat: selectedTripLiveStream.snapshot.lat,
        lng: selectedTripLiveStream.snapshot.lng,
        source: "rtdb_stream",
        stale: streamStale,
      };
    }
    if (!selectedTrip) {
      return null;
    }
    return {
      ...selectedTrip.live,
      stale: selectedTrip.live.stale || selectedTrip.liveState === "stale",
    };
  }, [selectedTrip, selectedTripLiveStream.snapshot, streamHasSelectedTripCoords, streamStale]);

  const selectedTripStreamErrorSemantic = streamErrorSemantic(selectedTripLiveStream.error);
  const streamIssueState = resolveStreamIssueState({
    streamStatus: selectedTripLiveStream.status,
    rtdbConnectionStatus: rtdbConnection.status,
    streamErrorSemantic: selectedTripStreamErrorSemantic,
  });

  return {
    liveStreamEnabled,
    rtdbConnection,
    selectedTripLiveStream,
    streamAuthRefreshInFlight: selectedTripLiveStream.authRefreshInFlight,
    selectedTripStopsQuery,
    selectedTripStreamErrorSemantic,
    streamIssueState,
    effectiveLiveCoords,
    streamStale,
    streamLagSeconds,
    streamStaleReason,
  };
}
