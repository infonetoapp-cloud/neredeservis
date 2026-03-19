"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CompanyActiveTripSummary, CompanyRouteStopSummary } from "@/features/company/company-types";
import {
  evaluateLiveOpsTripRisk,
  readBooleanPreference,
  writeBooleanPreference,
  type LiveOpsRiskTone,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import { getPublicMapboxToken } from "@/lib/env/public-env";

type EffectiveLiveCoords = {
  lat: number | null;
  lng: number | null;
  source: "rtdb_stream" | "rtdb" | "trip_doc";
  stale: boolean;
} | null;

type MarkerItem = {
  tripId: string;
  driverName: string;
  routeName: string;
  liveState: "online" | "stale";
  riskTone: LiveOpsRiskTone | null;
  riskReason: string | null;
  lat: number;
  lng: number;
  selected: boolean;
  hovered: boolean;
};

type LiveOpsMapboxCanvasProps = {
  trips: CompanyActiveTripSummary[];
  selectedTripId: string | null;
  hoveredTripId: string | null;
  effectiveLiveCoords: EffectiveLiveCoords;
  selectedTripStops: CompanyRouteStopSummary[];
  maxMarkerCount?: number;
  onSelectTripId: (tripId: string) => void;
};

const DEFAULT_CENTER: [number, number] = [35.2433, 38.9637];
const DEFAULT_ZOOM = 5.2;
const DEFAULT_MAX_MAP_MARKERS = 200;
const SELECTED_STOP_PATH_SOURCE_ID = "selected-stop-path-source";
const SELECTED_STOP_PATH_LAYER_ID = "selected-stop-path-layer";
const SELECTED_LIVE_LINK_SOURCE_ID = "selected-live-link-source";
const SELECTED_LIVE_LINK_LAYER_ID = "selected-live-link-layer";
const FOLLOW_SELECTED_PREFERENCE_KEY = "nsv:web:liveops:map-follow-selected";
const SHOW_STOPS_OVERLAY_PREFERENCE_KEY = "nsv:web:liveops:map-show-stops-overlay";
const MAP_STYLE_PREFERENCE_KEY = "nsv:web:liveops:map-style";
const MAP_LEGEND_VISIBLE_PREFERENCE_KEY = "nsv:web:liveops:map-legend-visible";

type MapStylePreset = "light" | "streets" | "navigation";

const MAP_STYLE_OPTIONS: Array<{
  id: MapStylePreset;
  label: string;
  styleUri: string;
}> = [
  { id: "light", label: "Light", styleUri: "mapbox://styles/mapbox/light-v11" },
  { id: "streets", label: "Streets", styleUri: "mapbox://styles/mapbox/streets-v12" },
  { id: "navigation", label: "Navigation", styleUri: "mapbox://styles/mapbox/navigation-day-v1" },
];

function toMarkerItems(params: {
  trips: CompanyActiveTripSummary[];
  selectedTripId: string | null;
  hoveredTripId: string | null;
  effectiveLiveCoords: EffectiveLiveCoords;
  maxMarkerCount: number;
}): MarkerItem[] {
  const { trips, selectedTripId, hoveredTripId, effectiveLiveCoords, maxMarkerCount } = params;
  const items: MarkerItem[] = [];

  for (const trip of trips) {
    const risk = evaluateLiveOpsTripRisk(trip);
    const isSelected = selectedTripId != null && trip.tripId === selectedTripId;
    const lat = isSelected ? effectiveLiveCoords?.lat ?? trip.live.lat : trip.live.lat;
    const lng = isSelected ? effectiveLiveCoords?.lng ?? trip.live.lng : trip.live.lng;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    items.push({
      tripId: trip.tripId,
      driverName: trip.driverName,
      routeName: trip.routeName,
      liveState: trip.liveState,
      riskTone: risk?.tone ?? null,
      riskReason: risk?.reason ?? null,
      lat,
      lng,
      selected: isSelected,
      hovered: hoveredTripId != null && hoveredTripId === trip.tripId,
    });
  }

  const selectedIndex = selectedTripId ? items.findIndex((item) => item.tripId === selectedTripId) : -1;
  if (selectedIndex > 0) {
    const [selectedItem] = items.splice(selectedIndex, 1);
    items.unshift(selectedItem);
  }

  return items.slice(0, maxMarkerCount);
}

function applyMarkerStyle(element: HTMLButtonElement, marker: MarkerItem) {
  const riskRing =
    marker.riskTone === "critical"
      ? "0 0 0 4px rgba(225,29,72,0.2)"
      : marker.riskTone === "warning"
        ? "0 0 0 4px rgba(245,158,11,0.22)"
        : marker.liveState === "online"
          ? "0 0 0 3px rgba(37,99,235,0.14)"
          : "0 0 0 3px rgba(148,163,184,0.18)";
  element.style.width = marker.selected ? "16px" : marker.hovered ? "14px" : "12px";
  element.style.height = marker.selected ? "16px" : marker.hovered ? "14px" : "12px";
  element.style.borderRadius = "9999px";
  element.style.border = marker.liveState === "online" ? "2px solid #ffffff" : "2px solid #94a3b8";
  element.style.background = marker.selected
    ? "#2563eb"
    : marker.liveState === "online"
      ? "#1d4ed8"
      : "#ffffff";
  element.style.boxShadow = marker.selected
    ? "0 0 0 6px rgba(37,99,235,0.18)"
    : marker.hovered
      ? "0 0 0 4px rgba(37,99,235,0.14)"
      : riskRing;
  element.style.opacity = marker.hovered || marker.selected ? "1" : "0.92";
}

function markerTooltip(marker: MarkerItem) {
  const riskText =
    marker.riskTone == null
      ? "Risk: normal"
      : `Risk: ${marker.riskTone === "critical" ? "Kritik" : "Uyarı"}${marker.riskReason ? ` (${marker.riskReason})` : ""}`;
  return `${marker.driverName} - ${marker.routeName}\n${riskText}`;
}

type MapboxDefault = (typeof import("mapbox-gl"))["default"];
type MapboxMap = import("mapbox-gl").Map;
type MapboxMarker = import("mapbox-gl").Marker;
type MapboxGeoJSONSource = import("mapbox-gl").GeoJSONSource;
type StopPoint = { stopId: string; order: number; name: string; lat: number; lng: number };

function coordinatesAreClose(a: [number, number], b: [number, number]) {
  return Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
}

function buildSmoothedCoordinates(
  coordinates: Array<[number, number]>,
  pointsPerSegment = 8,
): Array<[number, number]> {
  if (coordinates.length <= 1) {
    return coordinates;
  }

  const result: Array<[number, number]> = [];
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index];
    const end = coordinates[index + 1];
    if (!start || !end || coordinatesAreClose(start, end)) {
      continue;
    }

    result.push(start);
    for (let step = 1; step < pointsPerSegment; step += 1) {
      const t = step / pointsPerSegment;
      result.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }

  const last = coordinates[coordinates.length - 1];
  if (last && (result.length === 0 || !coordinatesAreClose(result[result.length - 1]!, last))) {
    result.push(last);
  }
  return result;
}

function readMapStylePreference(): MapStylePreset {
  if (typeof window === "undefined") {
    return "light";
  }
  const raw = window.localStorage.getItem(MAP_STYLE_PREFERENCE_KEY);
  if (raw === "light" || raw === "streets" || raw === "navigation") {
    return raw;
  }
  return "light";
}

function writeMapStylePreference(value: MapStylePreset) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MAP_STYLE_PREFERENCE_KEY, value);
}

function fitToCoordinates(
  map: MapboxMap,
  mapbox: MapboxDefault,
  coordinates: Array<[number, number]>,
  options?: { maxZoom?: number; duration?: number },
) {
  if (coordinates.length === 0) {
    return;
  }
  if (coordinates.length === 1) {
    map.easeTo({
      center: coordinates[0],
      zoom: Math.max(map.getZoom(), options?.maxZoom ?? 11.5),
      duration: options?.duration ?? 450,
      essential: true,
    });
    return;
  }

  const bounds = new mapbox.LngLatBounds();
  for (const coordinate of coordinates) {
    bounds.extend(coordinate);
  }
  map.fitBounds(bounds, {
    padding: 56,
    maxZoom: options?.maxZoom ?? 10.5,
    duration: options?.duration ?? 450,
  });
}

export function LiveOpsMapboxCanvas({
  trips,
  selectedTripId,
  hoveredTripId,
  effectiveLiveCoords,
  selectedTripStops,
  maxMarkerCount,
  onSelectTripId,
}: LiveOpsMapboxCanvasProps) {
  const effectiveMaxMarkerCount =
    typeof maxMarkerCount === "number" && Number.isFinite(maxMarkerCount)
      ? Math.max(20, Math.floor(maxMarkerCount))
      : DEFAULT_MAX_MAP_MARKERS;
  const mapboxToken = getPublicMapboxToken();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<MapboxDefault | null>(null);
  const markersRef = useRef<Map<string, MapboxMarker>>(new Map());
  const stopMarkersRef = useRef<Map<string, MapboxMarker>>(new Map());
  const previousSelectedTripIdRef = useRef<string | null>(null);
  const hasAutoFramedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [followSelected, setFollowSelected] = useState<boolean>(() =>
    readBooleanPreference(FOLLOW_SELECTED_PREFERENCE_KEY, true),
  );
  const [showStopsOverlay, setShowStopsOverlay] = useState<boolean>(() =>
    readBooleanPreference(SHOW_STOPS_OVERLAY_PREFERENCE_KEY, true),
  );
  const [showLegend, setShowLegend] = useState<boolean>(() =>
    readBooleanPreference(MAP_LEGEND_VISIBLE_PREFERENCE_KEY, true),
  );
  const [mapStylePreset, setMapStylePreset] = useState<MapStylePreset>(() => readMapStylePreference());
  const mapStyle = useMemo(
    () => MAP_STYLE_OPTIONS.find((option) => option.id === mapStylePreset) ?? MAP_STYLE_OPTIONS[0],
    [mapStylePreset],
  );
  const markerItems = useMemo(
    () =>
      toMarkerItems({
        trips,
        selectedTripId,
        hoveredTripId,
        effectiveLiveCoords,
        maxMarkerCount: effectiveMaxMarkerCount,
      }),
    [effectiveLiveCoords, effectiveMaxMarkerCount, hoveredTripId, selectedTripId, trips],
  );
  const hiddenMarkersCount = Math.max(0, trips.length - markerItems.length);
  const selectedStopPoints = useMemo<StopPoint[]>(() => {
    return [...selectedTripStops]
      .filter(
        (stop) =>
          Number.isFinite(stop.location.lat) &&
          Number.isFinite(stop.location.lng),
      )
      .sort((a, b) => a.order - b.order)
      .map((stop) => ({
        stopId: stop.stopId,
        order: stop.order,
        name: stop.name,
        lat: stop.location.lat,
        lng: stop.location.lng,
      }));
  }, [selectedTripStops]);
  const selectedStopPathCoordinates = useMemo<Array<[number, number]>>(() => {
    if (selectedStopPoints.length < 2) {
      return [];
    }
    const rawCoordinates = selectedStopPoints.map((stop) => [stop.lng, stop.lat] as [number, number]);
    return buildSmoothedCoordinates(rawCoordinates, 6);
  }, [selectedStopPoints]);
  const selectedLiveLinkCoordinates = useMemo<Array<[number, number]>>(() => {
    if (selectedTripId == null || selectedStopPoints.length === 0) {
      return [];
    }
    if (
      effectiveLiveCoords?.lat == null ||
      effectiveLiveCoords?.lng == null ||
      !Number.isFinite(effectiveLiveCoords.lat) ||
      !Number.isFinite(effectiveLiveCoords.lng)
    ) {
      return [];
    }

    const livePoint: [number, number] = [effectiveLiveCoords.lng, effectiveLiveCoords.lat];
    const nextStopPoint: [number, number] = [selectedStopPoints[0]!.lng, selectedStopPoints[0]!.lat];
    if (coordinatesAreClose(livePoint, nextStopPoint)) {
      return [];
    }

    return buildSmoothedCoordinates([livePoint, nextStopPoint], 10);
  }, [effectiveLiveCoords, selectedStopPoints, selectedTripId]);
  const fitCoordinates = useMemo<Array<[number, number]>>(
    () => [
      ...markerItems.map((item) => [item.lng, item.lat] as [number, number]),
      ...selectedStopPoints.map((stop) => [stop.lng, stop.lat] as [number, number]),
    ],
    [markerItems, selectedStopPoints],
  );

  useEffect(() => {
    if (!mapboxToken || !containerRef.current || mapRef.current) {
      return;
    }

    hasAutoFramedRef.current = false;
    previousSelectedTripIdRef.current = null;

    let cancelled = false;
    const markerStore = markersRef.current;
    const stopMarkerStore = stopMarkersRef.current;

    void (async () => {
      try {
        const mapboxModule = await import("mapbox-gl");
        if (cancelled || !containerRef.current) {
          return;
        }

        const mapbox = mapboxModule.default;
        mapbox.accessToken = mapboxToken;
        mapboxRef.current = mapbox;

        const map = new mapbox.Map({
          container: containerRef.current,
          style: mapStyle.styleUri,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: true,
        });
        map.addControl(new mapbox.NavigationControl({ showCompass: false }), "top-right");
        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) return;
          setMapReady(true);
          setMapError(null);
        });

        map.on("error", (event) => {
          if (cancelled) return;
          const message =
            (event as { error?: { message?: string } }).error?.message ??
            "Mapbox haritasi yuklenemedi.";
          setMapError(message);
        });
      } catch (error) {
        if (cancelled) return;
        setMapError(error instanceof Error ? error.message : "Mapbox yuklenemedi.");
      }
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      for (const marker of markerStore.values()) {
        marker.remove();
      }
      markerStore.clear();
      for (const marker of stopMarkerStore.values()) {
        marker.remove();
      }
      stopMarkerStore.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, [mapStyle.styleUri, mapboxToken]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) {
      return;
    }

    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    const seen = new Set<string>();

    for (const markerItem of markerItems) {
      seen.add(markerItem.tripId);
      const existing = markersRef.current.get(markerItem.tripId);
      if (existing) {
        const element = existing.getElement() as HTMLButtonElement;
        element.title = markerTooltip(markerItem);
        element.setAttribute("aria-label", `${markerItem.driverName} seferini sec`);
        element.onclick = () => onSelectTripId(markerItem.tripId);
        applyMarkerStyle(element, markerItem);
        existing.setLngLat([markerItem.lng, markerItem.lat]);
        continue;
      }

      const element = document.createElement("button");
      element.type = "button";
      element.title = markerTooltip(markerItem);
      element.setAttribute("aria-label", `${markerItem.driverName} seferini sec`);
      element.style.cursor = "pointer";
      element.style.transition = "all 140ms ease";
      element.onclick = () => onSelectTripId(markerItem.tripId);
      applyMarkerStyle(element, markerItem);

      const marker = new mapbox.Marker({ element, anchor: "center" })
        .setLngLat([markerItem.lng, markerItem.lat])
        .addTo(map);
      markersRef.current.set(markerItem.tripId, marker);
    }

    for (const [tripId, marker] of markersRef.current.entries()) {
      if (seen.has(tripId)) continue;
      marker.remove();
      markersRef.current.delete(tripId);
    }
  }, [mapReady, markerItems, onSelectTripId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) {
      return;
    }

    const map = mapRef.current;
    const mapbox = mapboxRef.current;

    if (!map.getSource(SELECTED_STOP_PATH_SOURCE_ID)) {
      map.addSource(SELECTED_STOP_PATH_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
          properties: {},
        },
      });
    }

    if (!map.getLayer(SELECTED_STOP_PATH_LAYER_ID)) {
      map.addLayer({
        id: SELECTED_STOP_PATH_LAYER_ID,
        type: "line",
        source: SELECTED_STOP_PATH_SOURCE_ID,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#2563eb",
          "line-width": 3.5,
          "line-opacity": 0.72,
        },
      });
    }

    if (!map.getSource(SELECTED_LIVE_LINK_SOURCE_ID)) {
      map.addSource(SELECTED_LIVE_LINK_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
          properties: {},
        },
      });
    }

    if (!map.getLayer(SELECTED_LIVE_LINK_LAYER_ID)) {
      map.addLayer({
        id: SELECTED_LIVE_LINK_LAYER_ID,
        type: "line",
        source: SELECTED_LIVE_LINK_SOURCE_ID,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#f97316",
          "line-width": 2.5,
          "line-opacity": 0.82,
          "line-dasharray": [0.9, 1.2],
        },
      });
    }

    const source = map.getSource(SELECTED_STOP_PATH_SOURCE_ID) as MapboxGeoJSONSource | undefined;
    if (source) {
      const coordinates =
        showStopsOverlay && selectedStopPathCoordinates.length >= 2
          ? selectedStopPathCoordinates
          : [];
      source.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
        properties: {},
      });
    }
    const liveLinkSource = map.getSource(SELECTED_LIVE_LINK_SOURCE_ID) as MapboxGeoJSONSource | undefined;
    if (liveLinkSource) {
      const coordinates =
        showStopsOverlay && selectedLiveLinkCoordinates.length >= 2 ? selectedLiveLinkCoordinates : [];
      liveLinkSource.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
        properties: {},
      });
    }

    if (!showStopsOverlay) {
      for (const marker of stopMarkersRef.current.values()) {
        marker.remove();
      }
      stopMarkersRef.current.clear();
      return;
    }

    const seenStops = new Set<string>();
    for (const stop of selectedStopPoints) {
      seenStops.add(stop.stopId);
      const existing = stopMarkersRef.current.get(stop.stopId);
      if (existing) {
        existing.setLngLat([stop.lng, stop.lat]);
        continue;
      }

      const element = document.createElement("div");
      element.style.width = "18px";
      element.style.height = "18px";
      element.style.borderRadius = "9999px";
      element.style.background = "#ffffff";
      element.style.border = "2px solid #1d4ed8";
      element.style.boxShadow = "0 2px 8px rgba(15,23,42,0.2)";
      element.style.color = "#1d4ed8";
      element.style.fontSize = "10px";
      element.style.fontWeight = "700";
      element.style.display = "flex";
      element.style.alignItems = "center";
      element.style.justifyContent = "center";
      element.style.lineHeight = "1";
      element.textContent = String(stop.order + 1);
      element.title = `${stop.order + 1}. ${stop.name}`;

      const marker = new mapbox.Marker({ element, anchor: "center" })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);
      stopMarkersRef.current.set(stop.stopId, marker);
    }

    for (const [stopId, marker] of stopMarkersRef.current.entries()) {
      if (seenStops.has(stopId)) continue;
      marker.remove();
      stopMarkersRef.current.delete(stopId);
    }
  }, [mapReady, selectedLiveLinkCoordinates, selectedStopPathCoordinates, selectedStopPoints, showStopsOverlay]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current || markerItems.length === 0) {
      return;
    }

    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    const selected = selectedTripId ? markerItems.find((item) => item.tripId === selectedTripId) : null;
    const previousSelectedTripId = previousSelectedTripIdRef.current;

    if (selected) {
      const selectionChanged = selected.tripId !== previousSelectedTripId;
      if (followSelected || selectionChanged) {
        fitToCoordinates(map, mapbox, [[selected.lng, selected.lat]], { maxZoom: 11.5, duration: 550 });
      }
      hasAutoFramedRef.current = true;
      previousSelectedTripIdRef.current = selected.tripId;
      return;
    }

    previousSelectedTripIdRef.current = null;

    if (!hasAutoFramedRef.current) {
      fitToCoordinates(
        map,
        mapbox,
        markerItems.map((item) => [item.lng, item.lat]),
        { maxZoom: 10.5, duration: 0 },
      );
      hasAutoFramedRef.current = true;
    }
  }, [followSelected, mapReady, markerItems, selectedTripId]);

  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-center text-xs text-amber-800">
        Mapbox token bulunamadi. `NEXT_PUBLIC_MAPBOX_TOKEN` tanimlandiginda canlı harita aktif olur.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {mapReady && fitCoordinates.length > 0 ? (
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              const activeIndex = MAP_STYLE_OPTIONS.findIndex((option) => option.id === mapStyle.id);
              const nextOption = MAP_STYLE_OPTIONS[(activeIndex + 1) % MAP_STYLE_OPTIONS.length]!;
              setMapStylePreset(nextOption.id);
              writeMapStylePreference(nextOption.id);
            }}
            className="rounded-lg border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
          >
            Harita Stili: {mapStyle.label}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!mapRef.current || !mapboxRef.current) {
                return;
              }
              fitToCoordinates(mapRef.current, mapboxRef.current, fitCoordinates, {
                maxZoom: 10.5,
                duration: 450,
              });
            }}
            className="rounded-lg border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
          >
            Haritaya Sigdir
          </button>
          {selectedTripId ? (
            <button
              type="button"
              onClick={() => {
                const nextValue = !followSelected;
                setFollowSelected(nextValue);
                writeBooleanPreference(FOLLOW_SELECTED_PREFERENCE_KEY, nextValue);
              }}
              className="rounded-lg border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
            >
              Secili Takip: {followSelected ? "Acik" : "Kapali"}
            </button>
          ) : null}
          {selectedTripStops.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                const nextValue = !showStopsOverlay;
                setShowStopsOverlay(nextValue);
                writeBooleanPreference(SHOW_STOPS_OVERLAY_PREFERENCE_KEY, nextValue);
              }}
              className="rounded-lg border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
            >
              Durak Overlay: {showStopsOverlay ? "Acik" : "Kapali"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              const nextValue = !showLegend;
              setShowLegend(nextValue);
              writeBooleanPreference(MAP_LEGEND_VISIBLE_PREFERENCE_KEY, nextValue);
            }}
            className="rounded-lg border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
          >
            Legend: {showLegend ? "Acik" : "Kapali"}
          </button>
        </div>
      ) : null}
      {mapReady && showLegend ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-line bg-white/90 px-3 py-2 text-[11px] text-slate-700 shadow-sm">
          <div className="font-semibold text-slate-900">Harita Legend ({mapStyle.label})</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-700" />
            <span>Canlı</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-400 bg-white" />
            <span>Stale</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-white ring-2 ring-blue-300" />
            <span>Secili</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-rose-300 bg-white" />
            <span>Kritik risk</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-amber-300 bg-white" />
            <span>Uyarı riski</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-blue-700 bg-white px-1 text-[10px] font-bold text-blue-700">
              1
            </span>
            <span>Durak</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-[2px] w-4 rounded bg-blue-600" />
            <span>Rota Geometrisi</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-[2px] w-4 rounded bg-orange-500" />
            <span>Canlı baglanti cizgisi</span>
          </div>
        </div>
      ) : null}
      {markerItems.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg border border-line bg-white/90 px-3 py-2 text-center text-xs text-muted">
          Haritada gosterilecek gecerli konum bulunamadi.
        </div>
      ) : null}
      {hiddenMarkersCount > 0 ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-center text-xs text-amber-800">
          Performans için haritada en fazla {effectiveMaxMarkerCount} sefer gosteriliyor. {hiddenMarkersCount} sefer listede
          gorunmeye devam eder.
        </div>
      ) : null}
      {mapError ? (
        <div className="absolute inset-x-3 top-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {mapError}
        </div>
      ) : null}
    </div>
  );
}

