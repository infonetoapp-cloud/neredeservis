"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getMapboxToken } from "@/lib/env/public-env";

export type AddressSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  source: "history" | "mapbox";
};

type Props = {
  label: string;
  value: string;
  placeholder: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  selectedSuggestion: AddressSuggestion | null;
  onValueChange: (value: string) => void;
  onSelectSuggestion: (suggestion: AddressSuggestion) => void;
  onEnterPressed?: () => void;
};

const MAPBOX_PUBLIC_TOKEN = getMapboxToken();
const QUERY_CACHE = new Map<string, { expiresAtMs: number; items: AddressSuggestion[] }>();
const QUERY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const HISTORY_STORAGE_KEY = "nsv.routes.address_history.v1";
const HISTORY_LIMIT = 50;
const SESSION_PROXIMITY_KEY = "nsv.routes.session_proximity.v1";
// Default: Gebze center (lng, lat)
const DEFAULT_PROXIMITY = "29.43,40.79";

function readSessionProximity(): string {
  if (typeof window === "undefined") return DEFAULT_PROXIMITY;
  try {
    const raw = window.sessionStorage.getItem(SESSION_PROXIMITY_KEY);
    if (!raw) return DEFAULT_PROXIMITY;
    const { lng, lat } = JSON.parse(raw) as { lng: number; lat: number };
    if (typeof lng === "number" && typeof lat === "number") return `${lng.toFixed(5)},${lat.toFixed(5)}`;
  } catch {
    // ignore
  }
  return DEFAULT_PROXIMITY;
}

function saveSessionProximity(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_PROXIMITY_KEY, JSON.stringify({ lat, lng }));
    // Also bust cache so next query uses new proximity
    QUERY_CACHE.clear();
  } catch {
    // ignore
  }
}

function normalizeQuery(value: string): string {
  return value.trim().toLocaleLowerCase("tr");
}

function tryParseHistory(rawValue: string | null): AddressSuggestion[] {
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const items: AddressSuggestion[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        continue;
      }
      const record = entry as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      const label = typeof record.label === "string" ? record.label : null;
      const lat = typeof record.lat === "number" && Number.isFinite(record.lat) ? record.lat : null;
      const lng = typeof record.lng === "number" && Number.isFinite(record.lng) ? record.lng : null;
      if (!id || !label || lat == null || lng == null) {
        continue;
      }
      items.push({
        id,
        label,
        lat,
        lng,
        source: "history",
      });
    }
    return items.slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function readAddressHistory(): AddressSuggestion[] {
  if (typeof window === "undefined") {
    return [];
  }
  return tryParseHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
}

function writeAddressHistory(items: AddressSuggestion[]): void {
  if (typeof window === "undefined") {
    return;
  }
  const sanitized = items.slice(0, HISTORY_LIMIT).map((item) => ({
    id: item.id,
    label: item.label,
    lat: item.lat,
    lng: item.lng,
  }));
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sanitized));
}

function addSuggestionToHistory(item: AddressSuggestion): void {
  const current = readAddressHistory();
  const dedupeKey = `${item.label}|${item.lat.toFixed(6)}|${item.lng.toFixed(6)}`.toLocaleLowerCase("tr");
  const next = [item, ...current].filter((candidate, index, all) => {
    const candidateKey =
      `${candidate.label}|${candidate.lat.toFixed(6)}|${candidate.lng.toFixed(6)}`.toLocaleLowerCase("tr");
    return all.findIndex((other) => {
      const otherKey =
        `${other.label}|${other.lat.toFixed(6)}|${other.lng.toFixed(6)}`.toLocaleLowerCase("tr");
      return otherKey === candidateKey;
    }) === index;
  });
  const withoutDuplicateHead = next.filter((candidate, index) => {
    if (index === 0) {
      const candidateKey =
        `${candidate.label}|${candidate.lat.toFixed(6)}|${candidate.lng.toFixed(6)}`.toLocaleLowerCase("tr");
      return candidateKey === dedupeKey;
    }
    return true;
  });
  writeAddressHistory(withoutDuplicateHead);
}

function filterHistoryByQuery(historyItems: AddressSuggestion[], query: string): AddressSuggestion[] {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return historyItems.slice(0, 5);
  }
  return historyItems
    .filter((item) => item.label.toLocaleLowerCase("tr").includes(normalized))
    .slice(0, 6)
    .map((item) => ({ ...item, source: "history" as const }));
}

function normalizeMapboxFeatures(payload: unknown): AddressSuggestion[] {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return [];
  }
  const features = (payload as Record<string, unknown>).features;
  if (!Array.isArray(features)) {
    return [];
  }

  const items: AddressSuggestion[] = [];
  for (const rawFeature of features) {
    if (typeof rawFeature !== "object" || rawFeature === null || Array.isArray(rawFeature)) {
      continue;
    }
    const record = rawFeature as Record<string, unknown>;
    const placeName = typeof record.place_name === "string" ? record.place_name.trim() : "";
    const id = typeof record.id === "string" ? record.id : `mapbox_${placeName}`;
    const center = Array.isArray(record.center) ? record.center : null;
    if (!placeName || !center || center.length < 2) {
      continue;
    }
    const lngRaw = center[0];
    const latRaw = center[1];
    if (
      typeof latRaw !== "number" ||
      !Number.isFinite(latRaw) ||
      typeof lngRaw !== "number" ||
      !Number.isFinite(lngRaw)
    ) {
      continue;
    }
    // Shorten label: drop "Türkiye" at the end, keep 3 segments max
    const labelParts = placeName.split(",").map((s) => s.trim()).filter(Boolean);
    const filtered = labelParts.filter((p) => p.toLocaleLowerCase("tr") !== "türkiye");
    const label = filtered.slice(0, 3).join(", ");
    items.push({
      id,
      label,
      lat: latRaw,
      lng: lngRaw,
      source: "mapbox",
    });
  }
  return items.slice(0, 6);
}

async function fetchMapboxSuggestions(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  if (!MAPBOX_PUBLIC_TOKEN) {
    return [];
  }

  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 3) {
    return [];
  }

  const proximity = readSessionProximity();
  const cacheKey = `${normalizedQuery}|${proximity}`;
  const cached = QUERY_CACHE.get(cacheKey);
  const nowMs = Date.now();
  if (cached && cached.expiresAtMs > nowMs) {
    return cached.items;
  }

  const params = new URLSearchParams({
    access_token: MAPBOX_PUBLIC_TOKEN,
    autocomplete: "true",
    country: "tr",
    language: "tr",
    limit: "6",
    types: "address,poi,place,district,locality,neighborhood",
    proximity,
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("MAPBOX_AUTH_ERROR");
    }
    if (response.status === 429) {
      throw new Error("MAPBOX_RATE_LIMIT");
    }
    throw new Error("MAPBOX_REQUEST_FAILED");
  }

  const json = (await response.json()) as unknown;
  const suggestions = normalizeMapboxFeatures(json);
  QUERY_CACHE.set(cacheKey, {
    expiresAtMs: nowMs + QUERY_CACHE_TTL_MS,
    items: suggestions,
  });
  return suggestions;
}

function mergeSuggestions(
  historyMatches: AddressSuggestion[],
  mapboxMatches: AddressSuggestion[],
): AddressSuggestion[] {
  const unique = new Map<string, AddressSuggestion>();
  for (const item of [...historyMatches, ...mapboxMatches]) {
    const key = `${item.label.toLocaleLowerCase("tr")}|${item.lat.toFixed(5)}|${item.lng.toFixed(5)}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }
  return Array.from(unique.values()).slice(0, 8);
}

export function AddressAutocompleteInput({
  label,
  value,
  placeholder,
  maxLength,
  disabled = false,
  required = false,
  selectedSuggestion,
  onValueChange,
  onSelectSuggestion,
  onEnterPressed,
}: Props) {
  const [historyItems, setHistoryItems] = useState<AddressSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHistoryItems(readAddressHistory());
  }, []);

  useEffect(() => {
    const query = value.trim();
    const historyMatches = filterHistoryByQuery(historyItems, query);

    if (!query) {
      setSuggestions(historyMatches);
      setLoading(false);
      setErrorText(null);
      return;
    }

    if (query.length >= 3 && !MAPBOX_PUBLIC_TOKEN) {
      setSuggestions(historyMatches);
      setLoading(false);
      setErrorText("Harita onerileri su an kapali. Kayitli adreslerden secim yapabilirsiniz.");
      return;
    }

    if (query.length < 3) {
      setSuggestions(historyMatches);
      setLoading(false);
      setErrorText(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const mapboxMatches = await fetchMapboxSuggestions(query, controller.signal);
          setSuggestions(mergeSuggestions(historyMatches, mapboxMatches));
          setErrorText(null);
        } catch (error) {
          if (!controller.signal.aborted) {
            setSuggestions(historyMatches);
            const message = error instanceof Error ? error.message : "UNKNOWN";
            if (message === "MAPBOX_AUTH_ERROR") {
              setErrorText("Harita servisi yetkisi gecerli degil. Yoneticiye haber verin.");
            } else if (message === "MAPBOX_RATE_LIMIT") {
              setErrorText("Harita sorgu limiti dolu. Kisa sure sonra tekrar deneyin.");
            } else {
              setErrorText("Adres onerisi su an alinamiyor. Kayitli adreslerden devam edebilirsiniz.");
            }
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      })();
    }, 420);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [historyItems, value]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [open]);

  const showSuggestionPanel = open && !disabled && (suggestions.length > 0 || loading || !!errorText);
  const helperText = useMemo(() => {
    if (selectedSuggestion) {
      return `Secilen adres hazir: ${selectedSuggestion.label}`;
    }
    if (value.trim().length >= 3) {
      return "Listeden bir adres secerek devam edin.";
    }
    return "En az 3 harf yazin, oneriler acilsin.";
  }, [selectedSuggestion, value]);

  return (
    <div ref={containerRef} className="relative space-y-1 text-xs font-semibold text-slate-700">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }
          if (!onEnterPressed) {
            return;
          }
          event.preventDefault();
          onEnterPressed();
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="glass-input w-full rounded-xl px-3 py-2 text-sm font-normal text-slate-900"
      />
      {showSuggestionPanel ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-white shadow-[0_14px_34px_rgba(15,23,42,0.12)]">
          {loading ? (
            <div className="px-3 py-2 text-xs text-[#667182]">Adres onerileri aranıyor...</div>
          ) : null}
          {!loading && suggestions.length === 0 && !errorText ? (
            <div className="px-3 py-2 text-xs text-[#667182]">Oneri bulunamadi.</div>
          ) : null}
          {!loading && errorText ? (
            <div className="px-3 py-2 text-xs text-amber-700">{errorText}</div>
          ) : null}
          {!loading
            ? suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.id}_${suggestion.lat}_${suggestion.lng}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSelectSuggestion(suggestion);
                    addSuggestionToHistory(suggestion);
                    saveSessionProximity(suggestion.lat, suggestion.lng);
                    setHistoryItems(readAddressHistory());
                    setOpen(false);
                  }}
                  className="flex w-full items-start justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="text-xs leading-5 text-slate-800">{suggestion.label}</span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      suggestion.source === "history"
                        ? "border-[#c7d6e8] bg-[#eef4ff] text-[#35578a]"
                        : "border-[#cde6df] bg-[#edf9f6] text-[#186355]"
                    }`}
                  >
                    {suggestion.source === "history" ? "Kayitli" : "Harita"}
                  </span>
                </button>
              ))
            : null}
        </div>
      ) : null}
      <div className={`text-[11px] ${required && !selectedSuggestion ? "text-amber-700" : "text-[#667182]"}`}>
        {helperText}
      </div>
    </div>
  );
}
