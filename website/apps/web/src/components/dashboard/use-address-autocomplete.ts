"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getMapboxToken } from "@/lib/env/public-env";

/**
 * Mapbox Geocoding API based address autocomplete.
 * Uses proximity bias toward Gebze/Istanbul for relevant Turkish results.
 * Debounced at 350ms to avoid rate-limit issues.
 */

export type AddressSuggestion = {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
};

// Gebze center as default proximity bias
const GEBZE_LNG = 29.43;
const GEBZE_LAT = 40.79;
const MAPBOX_BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;

const QUERY_CACHE = new Map<string, { expiresAtMs: number; items: AddressSuggestion[] }>();
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const SESSION_PROXIMITY_KEY = "nsv.routes.session_proximity.v1";

function readSessionProximity(): { lng: number; lat: number } {
  if (typeof window === "undefined") return { lng: GEBZE_LNG, lat: GEBZE_LAT };
  try {
    const raw = window.sessionStorage.getItem(SESSION_PROXIMITY_KEY);
    if (!raw) return { lng: GEBZE_LNG, lat: GEBZE_LAT };
    const { lng, lat } = JSON.parse(raw) as { lng: number; lat: number };
    if (typeof lng === "number" && typeof lat === "number") return { lng, lat };
  } catch {
    // ignore
  }
  return { lng: GEBZE_LNG, lat: GEBZE_LAT };
}

export function saveSessionProximity(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_PROXIMITY_KEY, JSON.stringify({ lat, lng }));
    QUERY_CACHE.clear();
  } catch {
    // ignore
  }
}

type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
};

function buildShortName(feature: MapboxFeature): string {
  const text = feature.text ?? "";
  // Extract city/district from context (place / locality / district)
  const context = feature.context ?? [];
  const cityCtx = context.find(
    (c) =>
      c.id.startsWith("place.") ||
      c.id.startsWith("locality.") ||
      c.id.startsWith("district."),
  );
  const city = cityCtx?.text ?? "";
  const parts = [text, city].filter(Boolean);
  if (parts.length === 0) {
    return feature.place_name.split(",").slice(0, 2).join(", ");
  }
  return parts.join(", ");
}

async function searchMapbox(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  const token = getMapboxToken();
  if (!token || query.trim().length < MIN_QUERY_LENGTH) return [];

  const { lng, lat } = readSessionProximity();
  const proximityStr = `${lng.toFixed(5)},${lat.toFixed(5)}`;
  const cacheKey = `${query.trim().toLocaleLowerCase("tr")}|${proximityStr}`;
  const cached = QUERY_CACHE.get(cacheKey);
  if (cached && cached.expiresAtMs > Date.now()) return cached.items;

  const params = new URLSearchParams({
    access_token: token,
    autocomplete: "true",
    country: "tr",
    language: "tr",
    limit: "6",
    types: "address,poi,place,locality,neighborhood",
    proximity: proximityStr,
  });

  const url = `${MAPBOX_BASE}/${encodeURIComponent(query.trim())}.json?${params.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) return [];

  const json = (await response.json()) as { features?: MapboxFeature[] };
  const features = json.features ?? [];

  const items: AddressSuggestion[] = features
    .filter((f) => f.center && f.center.length >= 2)
    .map((f) => ({
      placeId: f.id,
      displayName: f.place_name,
      shortName: buildShortName(f),
      lat: f.center[1],
      lng: f.center[0],
    }))
    .slice(0, 6);

  QUERY_CACHE.set(cacheKey, { expiresAtMs: Date.now() + CACHE_TTL_MS, items });
  return items;
}

export function useAddressAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;

    if (query.trim().length < MIN_QUERY_LENGTH) {
      const timer = setTimeout(() => {
        clearSuggestions();
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const results = await searchMapbox(query.trim(), controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setIsLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, clearSuggestions]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    clearSuggestions,
  };
}
