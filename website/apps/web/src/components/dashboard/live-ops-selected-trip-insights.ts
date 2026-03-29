"use client";

import type {
  CompanyActiveTripSummary,
  CompanyRouteStopSummary,
} from "@/features/company/company-types";

type StreamStatus = "idle" | "connecting" | "live" | "mismatch" | "error";
type RtdbConnectionStatus = "idle" | "connecting" | "online" | "offline" | "error";

type EffectiveLiveCoords =
  | {
      lat: number | null;
      lng: number | null;
      source: "rtdb_stream" | "rtdb" | "trip_doc";
      stale: boolean;
    }
  | null;

export type LiveOpsTripInsight = {
  riskTone: "ok" | "warning" | "critical";
  riskReason: string;
  nextStopLabel: string;
  nextStopDistanceLabel: string;
  tripElapsedLabel: string;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatDistanceLabel(km: number | null) {
  if (km == null || !Number.isFinite(km)) {
    return "Hesaplanamadi";
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

function formatElapsedLabel(startedAt: string | null) {
  if (!startedAt) {
    return "Bilinmiyor";
  }
  const startedMs = Date.parse(startedAt);
  if (!Number.isFinite(startedMs)) {
    return "Bilinmiyor";
  }
  const diffMinutes = Math.max(0, Math.floor((Date.now() - startedMs) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} dk`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours} sa ${minutes} dk`;
}

function resolveRisk(params: {
  trip: CompanyActiveTripSummary;
  streamStatus: StreamStatus;
  rtdbConnectionStatus: RtdbConnectionStatus;
  effectiveLiveCoords: EffectiveLiveCoords;
}): Pick<LiveOpsTripInsight, "riskTone" | "riskReason"> {
  const { trip, streamStatus, rtdbConnectionStatus, effectiveLiveCoords } = params;

  if (rtdbConnectionStatus === "offline" || rtdbConnectionStatus === "error") {
    return {
      riskTone: "critical",
      riskReason: "Canli akis baglantisi kesik, konum akisi guvenilir degil.",
    };
  }
  if (streamStatus === "error") {
    return {
      riskTone: "critical",
      riskReason: "Canli akis hatasi var, fallback modunda izleniyor.",
    };
  }
  if (streamStatus === "mismatch") {
    return {
      riskTone: "warning",
      riskReason: "Stream payload baska sefere ait gorunuyor.",
    };
  }
  if (trip.liveState === "stale" || effectiveLiveCoords?.stale === true) {
    return {
      riskTone: "warning",
      riskReason: "Konum stale gorunuyor, son sinyal gecikmeli.",
    };
  }
  return {
    riskTone: "ok",
    riskReason: "CanlÄ± konum akisi stabil.",
  };
}

function resolveNextStop(params: {
  stops: CompanyRouteStopSummary[];
  effectiveLiveCoords: EffectiveLiveCoords;
}): Pick<LiveOpsTripInsight, "nextStopLabel" | "nextStopDistanceLabel"> {
  const { stops, effectiveLiveCoords } = params;
  if (stops.length === 0) {
    return {
      nextStopLabel: "Durak yok",
      nextStopDistanceLabel: "-",
    };
  }

  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  const hasCoords =
    effectiveLiveCoords?.lat != null &&
    effectiveLiveCoords?.lng != null &&
    Number.isFinite(effectiveLiveCoords.lat) &&
    Number.isFinite(effectiveLiveCoords.lng);

  if (!hasCoords) {
    return {
      nextStopLabel: `${sortedStops[0]!.order + 1}. ${sortedStops[0]!.name}`,
      nextStopDistanceLabel: "Konum yok",
    };
  }

  let nearestStop = sortedStops[0]!;
  let nearestDistanceKm = Number.POSITIVE_INFINITY;
  for (const stop of sortedStops) {
    const distanceKm = haversineKm(
      effectiveLiveCoords.lat!,
      effectiveLiveCoords.lng!,
      stop.location.lat,
      stop.location.lng,
    );
    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      nearestStop = stop;
    }
  }

  return {
    nextStopLabel: `${nearestStop.order + 1}. ${nearestStop.name}`,
    nextStopDistanceLabel: formatDistanceLabel(nearestDistanceKm),
  };
}

export function buildLiveOpsTripInsight(params: {
  trip: CompanyActiveTripSummary;
  streamStatus: StreamStatus;
  rtdbConnectionStatus: RtdbConnectionStatus;
  effectiveLiveCoords: EffectiveLiveCoords;
  stops: CompanyRouteStopSummary[];
}): LiveOpsTripInsight {
  const risk = resolveRisk({
    trip: params.trip,
    streamStatus: params.streamStatus,
    rtdbConnectionStatus: params.rtdbConnectionStatus,
    effectiveLiveCoords: params.effectiveLiveCoords,
  });
  const nextStop = resolveNextStop({
    stops: params.stops,
    effectiveLiveCoords: params.effectiveLiveCoords,
  });
  return {
    riskTone: risk.riskTone,
    riskReason: risk.riskReason,
    nextStopLabel: nextStop.nextStopLabel,
    nextStopDistanceLabel: nextStop.nextStopDistanceLabel,
    tripElapsedLabel: formatElapsedLabel(params.trip.startedAt),
  };
}


