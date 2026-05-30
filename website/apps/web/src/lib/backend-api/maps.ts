"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { requireBackendApiBaseUrl } from "@/lib/env/public-env";

export type BackendMapSuggestion = {
  id: string;
  label: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  source: string;
};

type MapSearchEnvelope = {
  provider?: string;
  items?: BackendMapSuggestion[];
};

type MapReverseEnvelope = {
  provider?: string;
  item?: BackendMapSuggestion | null;
};

export type BackendRoutePreview = {
  provider: string;
  profile: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  legs: Array<{
    distanceMeters: number | null;
    durationSeconds: number | null;
    summary: string;
  }>;
};

export async function searchMapPlaces(input: {
  query: string;
  limit?: number;
  proximity?: { lat: number; lng: number } | null;
}): Promise<BackendMapSuggestion[]> {
  const baseUrl = requireBackendApiBaseUrl();
  const params = new URLSearchParams({
    q: input.query.trim(),
    ...(input.limit ? { limit: String(input.limit) } : {}),
    ...(input.proximity
      ? {
          lat: String(input.proximity.lat),
          lng: String(input.proximity.lng),
        }
      : {}),
  });

  const response = await callBackendApi<MapSearchEnvelope>({
    baseUrl,
    path: `/api/maps/search?${params.toString()}`,
  });

  return Array.isArray(response.data?.items) ? response.data.items : [];
}

export async function reverseMapPlace(input: {
  lat: number;
  lng: number;
}): Promise<BackendMapSuggestion | null> {
  const baseUrl = requireBackendApiBaseUrl();
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
  });

  const response = await callBackendApi<MapReverseEnvelope>({
    baseUrl,
    path: `/api/maps/reverse?${params.toString()}`,
  });

  return response.data?.item ?? null;
}

export async function previewMapRoute(input: {
  waypoints: Array<{ lat: number; lng: number }>;
}): Promise<BackendRoutePreview> {
  const baseUrl = requireBackendApiBaseUrl();
  const response = await callBackendApi<BackendRoutePreview>({
    baseUrl,
    path: "/api/maps/route",
    method: "POST",
    body: {
      waypoints: input.waypoints,
    },
  });

  if (!response.data?.geometry || !Array.isArray(response.data.geometry.coordinates)) {
    throw new Error("MAP_ROUTE_GEOMETRY_MISSING");
  }

  return response.data;
}
