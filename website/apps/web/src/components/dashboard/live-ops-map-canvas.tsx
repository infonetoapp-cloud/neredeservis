"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CompanyActiveTripSummary, CompanyRouteStopSummary } from "@/features/company/company-types";
import {
  evaluateLiveOpsTripRisk,
  readBooleanPreference,
  writeBooleanPreference,
  type LiveOpsRiskTone,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import {
  getPublicMapTileAttribution,
  getPublicMapTileMaxZoom,
  getPublicMapTileUrl,
} from "@/lib/env/public-env";

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

type LiveOpsMapCanvasProps = {
  trips: CompanyActiveTripSummary[];
  selectedTripId: string | null;
  hoveredTripId: string | null;
  effectiveLiveCoords: EffectiveLiveCoords;
  selectedTripStops: CompanyRouteStopSummary[];
  maxMarkerCount?: number;
  onSelectTripId: (tripId: string) => void;
};

type LeafletModule = typeof import("leaflet");
type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;
type LeafletPolyline = import("leaflet").Polyline;

const DEFAULT_CENTER: [number, number] = [38.9637, 35.2433];
const DEFAULT_ZOOM = 5.2;
const DEFAULT_MAX_MAP_MARKERS = 200;
const FOLLOW_SELECTED_PREFERENCE_KEY = "nsv:web:liveops:map-follow-selected";
const SHOW_STOPS_OVERLAY_PREFERENCE_KEY = "nsv:web:liveops:map-show-stops-overlay";
const MAP_LEGEND_VISIBLE_PREFERENCE_KEY = "nsv:web:liveops:map-legend-visible";

type StopPoint = { stopId: string; order: number; name: string; lat: number; lng: number };

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
      : `Risk: ${marker.riskTone === "critical" ? "Kritik" : "Uyari"}${marker.riskReason ? ` (${marker.riskReason})` : ""}`;
  return `${marker.driverName} - ${marker.routeName}\n${riskText}`;
}

function createTripMarker(
  leaflet: LeafletModule,
  marker: MarkerItem,
  onSelectTripId: (tripId: string) => void,
) {
  const icon = leaflet.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: '<button type="button" style="cursor:pointer;transition:all 140ms ease;"></button>',
  });

  const leafletMarker = leaflet
    .marker([marker.lat, marker.lng], { icon, keyboard: false })
    .bindTooltip(markerTooltip(marker), { direction: "top", offset: [0, -10] });

  const syncElement = () => {
    const button = leafletMarker.getElement()?.querySelector("button");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    button.type = "button";
    button.title = markerTooltip(marker);
    button.setAttribute("aria-label", `${marker.driverName} seferini sec`);
    button.onclick = () => onSelectTripId(marker.tripId);
    applyMarkerStyle(button, marker);
  };

  return { leafletMarker, syncElement };
}

function createStopMarkerIcon(leaflet: LeafletModule, stop: StopPoint) {
  return leaflet.divIcon({
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `
      <div
        style="
          width:18px;
          height:18px;
          border-radius:9999px;
          background:#ffffff;
          border:2px solid #1d4ed8;
          box-shadow:0 2px 8px rgba(15,23,42,0.2);
          color:#1d4ed8;
          font-size:10px;
          font-weight:700;
          display:flex;
          align-items:center;
          justify-content:center;
          line-height:1;
        "
        title="${`${stop.order + 1}. ${stop.name}`.replace(/"/g, "&quot;")}"
      >${stop.order + 1}</div>
    `,
  });
}

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

function fitToCoordinates(
  map: LeafletMap,
  leaflet: LeafletModule,
  coordinates: Array<[number, number]>,
  options?: { maxZoom?: number },
) {
  if (coordinates.length === 0) {
    return;
  }

  if (coordinates.length === 1) {
    map.flyTo(coordinates[0], Math.max(map.getZoom(), options?.maxZoom ?? 11.5), {
      animate: true,
      duration: 0.45,
    });
    return;
  }

  map.flyToBounds(leaflet.latLngBounds(coordinates), {
    padding: [56, 56],
    maxZoom: options?.maxZoom ?? 10.5,
    duration: 0.45,
  });
}

export function LiveOpsMapCanvas({
  trips,
  selectedTripId,
  hoveredTripId,
  effectiveLiveCoords,
  selectedTripStops,
  maxMarkerCount,
  onSelectTripId,
}: LiveOpsMapCanvasProps) {
  const effectiveMaxMarkerCount =
    typeof maxMarkerCount === "number" && Number.isFinite(maxMarkerCount)
      ? Math.max(20, Math.floor(maxMarkerCount))
      : DEFAULT_MAX_MAP_MARKERS;

  const tileUrl = getPublicMapTileUrl();
  const tileAttribution = getPublicMapTileAttribution();
  const tileMaxZoom = getPublicMapTileMaxZoom();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const stopMarkersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const stopPathRef = useRef<LeafletPolyline | null>(null);
  const liveLinkRef = useRef<LeafletPolyline | null>(null);
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
  const selectedStopPoints = useMemo<StopPoint[]>(
    () =>
      [...selectedTripStops]
        .filter(
          (stop) => Number.isFinite(stop.location.lat) && Number.isFinite(stop.location.lng),
        )
        .sort((a, b) => a.order - b.order)
        .map((stop) => ({
          stopId: stop.stopId,
          order: stop.order,
          name: stop.name,
          lat: stop.location.lat,
          lng: stop.location.lng,
        })),
    [selectedTripStops],
  );
  const selectedStopPathCoordinates = useMemo<Array<[number, number]>>(() => {
    if (selectedStopPoints.length < 2) {
      return [];
    }
    return buildSmoothedCoordinates(
      selectedStopPoints.map((stop) => [stop.lat, stop.lng] as [number, number]),
      6,
    );
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

    const livePoint: [number, number] = [effectiveLiveCoords.lat, effectiveLiveCoords.lng];
    const nextStopPoint: [number, number] = [selectedStopPoints[0]!.lat, selectedStopPoints[0]!.lng];
    if (coordinatesAreClose(livePoint, nextStopPoint)) {
      return [];
    }

    return buildSmoothedCoordinates([livePoint, nextStopPoint], 10);
  }, [effectiveLiveCoords, selectedStopPoints, selectedTripId]);
  const fitCoordinates = useMemo<Array<[number, number]>>(
    () => [
      ...markerItems.map((item) => [item.lat, item.lng] as [number, number]),
      ...selectedStopPoints.map((stop) => [stop.lat, stop.lng] as [number, number]),
    ],
    [markerItems, selectedStopPoints],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    hasAutoFramedRef.current = false;
    previousSelectedTripIdRef.current = null;

    let cancelled = false;
    const markerStore = markersRef.current;
    const stopMarkerStore = stopMarkersRef.current;

    void (async () => {
      try {
        const leaflet = await import("leaflet");
        if (cancelled || !containerRef.current) {
          return;
        }

        leafletRef.current = leaflet;
        const map = leaflet.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
        });

        leaflet.control.zoom({ position: "topright" }).addTo(map);
        leaflet
          .tileLayer(tileUrl, {
            attribution: tileAttribution,
            maxZoom: tileMaxZoom,
          })
          .addTo(map);

        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        map.whenReady(() => {
          if (cancelled) {
            return;
          }
          setMapReady(true);
          setMapError(null);
        });

        mapRef.current = map;
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : "Harita yuklenemedi.");
        }
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
      stopPathRef.current?.remove();
      stopPathRef.current = null;
      liveLinkRef.current?.remove();
      liveLinkRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, [tileAttribution, tileMaxZoom, tileUrl]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) {
      return;
    }

    const map = mapRef.current;
    const leaflet = leafletRef.current;
    const seen = new Set<string>();

    for (const markerItem of markerItems) {
      seen.add(markerItem.tripId);
      const existing = markersRef.current.get(markerItem.tripId);
      if (existing) {
        existing.setLatLng([markerItem.lat, markerItem.lng]);
        const button = existing.getElement()?.querySelector("button");
        if (button instanceof HTMLButtonElement) {
          button.title = markerTooltip(markerItem);
          button.setAttribute("aria-label", `${markerItem.driverName} seferini sec`);
          button.onclick = () => onSelectTripId(markerItem.tripId);
          applyMarkerStyle(button, markerItem);
        }
        existing.bindTooltip(markerTooltip(markerItem), { direction: "top", offset: [0, -10] });
        continue;
      }

      const { leafletMarker, syncElement } = createTripMarker(leaflet, markerItem, onSelectTripId);
      leafletMarker.addTo(map);
      syncElement();
      markersRef.current.set(markerItem.tripId, leafletMarker);
    }

    for (const [tripId, marker] of markersRef.current.entries()) {
      if (seen.has(tripId)) {
        continue;
      }
      marker.remove();
      markersRef.current.delete(tripId);
    }
  }, [mapReady, markerItems, onSelectTripId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) {
      return;
    }

    const map = mapRef.current;
    const leaflet = leafletRef.current;

    if (!stopPathRef.current) {
      stopPathRef.current = leaflet
        .polyline([], {
          color: "#2563eb",
          weight: 3.5,
          opacity: 0.72,
        })
        .addTo(map);
    }

    if (!liveLinkRef.current) {
      liveLinkRef.current = leaflet
        .polyline([], {
          color: "#f97316",
          weight: 2.5,
          opacity: 0.82,
          dashArray: "8 10",
        })
        .addTo(map);
    }

    stopPathRef.current.setLatLngs(
      showStopsOverlay && selectedStopPathCoordinates.length >= 2 ? selectedStopPathCoordinates : [],
    );
    liveLinkRef.current.setLatLngs(
      showStopsOverlay && selectedLiveLinkCoordinates.length >= 2 ? selectedLiveLinkCoordinates : [],
    );

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
        existing.setLatLng([stop.lat, stop.lng]);
        continue;
      }

      const marker = leaflet.marker([stop.lat, stop.lng], {
        icon: createStopMarkerIcon(leaflet, stop),
        keyboard: false,
      });
      marker.addTo(map);
      stopMarkersRef.current.set(stop.stopId, marker);
    }

    for (const [stopId, marker] of stopMarkersRef.current.entries()) {
      if (seenStops.has(stopId)) {
        continue;
      }
      marker.remove();
      stopMarkersRef.current.delete(stopId);
    }
  }, [mapReady, selectedLiveLinkCoordinates, selectedStopPathCoordinates, selectedStopPoints, showStopsOverlay]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) {
      return;
    }

    const map = mapRef.current;
    const leaflet = leafletRef.current;
    const selected = selectedTripId ? markerItems.find((item) => item.tripId === selectedTripId) : null;
    const previousSelectedTripId = previousSelectedTripIdRef.current;

    if (selected) {
      const selectionChanged = selected.tripId !== previousSelectedTripId;
      if (followSelected || selectionChanged) {
        fitToCoordinates(map, leaflet, [[selected.lat, selected.lng]], { maxZoom: 11.5 });
      }
      hasAutoFramedRef.current = true;
      previousSelectedTripIdRef.current = selected.tripId;
      return;
    }

    previousSelectedTripIdRef.current = null;

    if (!hasAutoFramedRef.current && markerItems.length > 0) {
      fitToCoordinates(
        map,
        leaflet,
        markerItems.map((item) => [item.lat, item.lng] as [number, number]),
        { maxZoom: 10.5 },
      );
      hasAutoFramedRef.current = true;
    }
  }, [followSelected, mapReady, markerItems, selectedTripId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {mapReady && fitCoordinates.length > 0 ? (
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (!mapRef.current || !leafletRef.current) {
                return;
              }
              fitToCoordinates(mapRef.current, leafletRef.current, fitCoordinates, {
                maxZoom: 10.5,
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
          <div className="font-semibold text-slate-900">Harita Legend</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-700" />
            <span>Canli</span>
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
            <span>Uyari riski</span>
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
            <span>Canli baglanti cizgisi</span>
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
          Performans icin haritada en fazla {effectiveMaxMarkerCount} sefer gosteriliyor. {hiddenMarkersCount} sefer
          listede gorunmeye devam eder.
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
