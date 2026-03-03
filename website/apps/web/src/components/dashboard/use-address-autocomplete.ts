"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Nominatim (OpenStreetMap) based address autocomplete.
 * Completely free — no API key required.
 * Rate-limited to 1 req/s by Nominatim policy; we debounce at 400ms.
 */

export type AddressSuggestion = {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

function buildShortName(result: NominatimResult): string {
  const addr = result.address;
  if (!addr) {
    const parts = result.display_name.split(",").map((s) => s.trim());
    return parts.slice(0, 3).join(", ");
  }
  const road = addr.road ?? addr.neighbourhood ?? "";
  const district = addr.suburb ?? addr.neighbourhood ?? "";
  const city = addr.city ?? addr.town ?? addr.village ?? "";
  const parts = [road, district, city].filter(Boolean);
  if (parts.length === 0) {
    return result.display_name.split(",").slice(0, 3).join(", ");
  }
  return parts.slice(0, 3).join(", ");
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

async function searchNominatim(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "6",
    countrycodes: "tr",
    "accept-language": "tr",
  });

  const response = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
    signal,
    headers: { "User-Agent": "NeredeServis/1.0" },
  });

  if (!response.ok) return [];

  const results = (await response.json()) as NominatimResult[];
  return results.map((result) => ({
    placeId: String(result.place_id),
    displayName: result.display_name,
    shortName: buildShortName(result),
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  }));
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
        const results = await searchNominatim(query.trim(), controller.signal);
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
