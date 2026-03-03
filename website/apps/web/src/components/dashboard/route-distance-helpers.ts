"use client";

/**
 * Haversine-based distance calculation for route waypoints.
 * Zero API cost — runs entirely on the client.
 */

export type RouteWaypoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type: "start" | "stop" | "end";
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine distance between two points in kilometers. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Calculate total distance across ordered waypoints, and cumulative distances. */
export function calculateRouteDistances(waypoints: RouteWaypoint[]): {
  totalKm: number;
  segmentDistances: { from: string; to: string; km: number }[];
  cumulativeKm: number[];
} {
  if (waypoints.length < 2) {
    return {
      totalKm: 0,
      segmentDistances: [],
      cumulativeKm: waypoints.length === 1 ? [0] : [],
    };
  }

  const segmentDistances: { from: string; to: string; km: number }[] = [];
  const cumulativeKm: number[] = [0];
  let totalKm = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const km = haversineDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
    segmentDistances.push({ from: prev.id, to: curr.id, km });
    totalKm += km;
    cumulativeKm.push(totalKm);
  }

  return { totalKm, segmentDistances, cumulativeKm };
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
