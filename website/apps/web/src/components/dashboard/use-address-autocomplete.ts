"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { searchMapPlaces } from "@/lib/backend-api/maps";

export type AddressSuggestion = {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
};

const GEBZE_LNG = 29.43;
const GEBZE_LAT = 40.79;
const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const SESSION_PROXIMITY_KEY = "nsv.routes.session_proximity.v1";

const QUERY_CACHE = new Map<string, { expiresAtMs: number; items: AddressSuggestion[] }>();

function readSessionProximity(): { lng: number; lat: number } {
  if (typeof window === "undefined") {
    return { lng: GEBZE_LNG, lat: GEBZE_LAT };
  }

  try {
    const rawValue = window.sessionStorage.getItem(SESSION_PROXIMITY_KEY);
    if (!rawValue) {
      return { lng: GEBZE_LNG, lat: GEBZE_LAT };
    }

    const parsed = JSON.parse(rawValue) as { lng?: number; lat?: number };
    if (typeof parsed.lng === "number" && typeof parsed.lat === "number") {
      return { lng: parsed.lng, lat: parsed.lat };
    }
  } catch {
    // Ignore malformed session data.
  }

  return { lng: GEBZE_LNG, lat: GEBZE_LAT };
}

export function saveSessionProximity(lat: number, lng: number): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(SESSION_PROXIMITY_KEY, JSON.stringify({ lat, lng }));
    QUERY_CACHE.clear();
  } catch {
    // Ignore storage failures.
  }
}

async function searchBackendAddresses(
  query: string,
  signal: AbortSignal,
): Promise<AddressSuggestion[]> {
  if (query.trim().length < MIN_QUERY_LENGTH) {
    return [];
  }

  const { lng, lat } = readSessionProximity();
  const proximityKey = `${lng.toFixed(5)},${lat.toFixed(5)}`;
  const cacheKey = `${query.trim().toLocaleLowerCase("tr")}|${proximityKey}`;
  const cached = QUERY_CACHE.get(cacheKey);
  if (cached && cached.expiresAtMs > Date.now()) {
    return cached.items;
  }

  const backendItems = await searchMapPlaces({
    query: query.trim(),
    limit: 6,
    proximity: { lat, lng },
  });

  if (signal.aborted) {
    return [];
  }

  const items = backendItems.map((item) => ({
    placeId: item.id,
    displayName: item.displayName || item.label,
    shortName: item.shortName || item.label,
    lat: item.lat,
    lng: item.lng,
  }));

  QUERY_CACHE.set(cacheKey, {
    expiresAtMs: Date.now() + CACHE_TTL_MS,
    items,
  });
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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
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
        const results = await searchBackendAddresses(query.trim(), controller.signal);
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
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, clearSuggestions]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
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
