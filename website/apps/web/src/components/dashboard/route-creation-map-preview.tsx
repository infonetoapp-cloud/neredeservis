"use client";

import { useEffect, useRef, useState } from "react";

import { getPublicMapboxToken } from "@/lib/env/public-env";
import type { RouteWaypoint } from "@/components/dashboard/route-distance-helpers";
import {
  calculateRouteDistances,
  formatDistanceKm,
} from "@/components/dashboard/route-distance-helpers";

type MapboxGL = typeof import("mapbox-gl");
type MapboxMap = import("mapbox-gl").Map;
type MapboxMarker = import("mapbox-gl").Marker;

type RouteCreationMapPreviewProps = {
  waypoints: RouteWaypoint[];
  height?: string;
  /** When provided, map clicks trigger this callback with the clicked coordinate */
  onMapClick?: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER: [number, number] = [29.0, 41.01];
const DEFAULT_ZOOM = 10;
const ROUTE_LINE_SOURCE = "route-creation-line-source";
const ROUTE_LINE_LAYER = "route-creation-line-layer";

const MARKER_COLORS: Record<RouteWaypoint["type"], string> = {
  start: "#16a34a",
  stop: "#2563eb",
  end: "#dc2626",
};

const MARKER_LABELS: Record<RouteWaypoint["type"], string> = {
  start: "B",
  stop: "",
  end: "S",
};

function createMarkerElement(
  waypoint: RouteWaypoint,
  index: number,
  total: number,
): HTMLDivElement {
  const el = document.createElement("div");
  const color = MARKER_COLORS[waypoint.type];
  const label =
    waypoint.type === "stop" ? String(index) : MARKER_LABELS[waypoint.type];
  const size = waypoint.type === "stop" ? 28 : 34;

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "9999px";
  el.style.background = color;
  el.style.border = "3px solid white";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "white";
  el.style.fontSize = waypoint.type === "stop" ? "11px" : "13px";
  el.style.fontWeight = "700";
  el.style.cursor = "pointer";
  el.style.transition = "transform 0.2s";
  el.textContent = label;
  el.title = waypoint.label;

  return el;
}

export function RouteCreationMapPreview({
  waypoints,
  height = "400px",
  onMapClick,
}: RouteCreationMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const { totalKm, segmentDistances } = calculateRouteDistances(waypoints);

  // Initialize map
  useEffect(() => {
    const token = getPublicMapboxToken();
    if (!token) {
      setMapError("Mapbox token bulunamadi.");
      return;
    }

    if (!containerRef.current) return;

    let cancelled = false;

    async function initMap() {
      try {
        const mapboxgl = await import("mapbox-gl");
        if (cancelled) return;

        mapboxgl.default.accessToken = token!;
        mapboxRef.current = mapboxgl;

        const map = new mapboxgl.default.Map({
          container: containerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: false,
        });

        map.addControl(
          new mapboxgl.default.NavigationControl({ showCompass: false }),
          "top-right",
        );

        map.on("load", () => {
          if (cancelled) return;

          // Add empty route line source + layer
          map.addSource(ROUTE_LINE_SOURCE, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: ROUTE_LINE_LAYER,
            type: "line",
            source: ROUTE_LINE_SOURCE,
            paint: {
              "line-color": "#3b82f6",
              "line-width": 3,
              "line-dasharray": [2, 2],
              "line-opacity": 0.8,
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
          });

          mapRef.current = map;
          setMapReady(true);

          // Click-on-map → add stop
          map.on("click", (e) => {
            if (onMapClickRef.current) {
              onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
            }
          });

          // Change cursor when onMapClick is provided
          map.getCanvas().style.cursor = onMapClickRef.current ? "crosshair" : "";
        });
      } catch (err) {
        if (!cancelled) {
          setMapError("Harita yuklenemedi.");
        }
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Update markers and line when waypoints change
  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) return;

    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;

    // Clear old markers
    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];

    // Add new markers
    let stopIndex = 1;
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const displayIndex = wp.type === "stop" ? stopIndex++ : i;
      const el = createMarkerElement(wp, displayIndex, waypoints.length);

      const marker = new mapboxgl.default.Marker({ element: el })
        .setLngLat([wp.lng, wp.lat])
        .setPopup(
          new mapboxgl.default.Popup({ offset: 20, closeButton: false }).setHTML(
            `<div style="padding:4px 8px;font-size:13px;font-weight:600;">${wp.label}</div>`,
          ),
        )
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Update route line
    const source = map.getSource(ROUTE_LINE_SOURCE) as import("mapbox-gl").GeoJSONSource | undefined;
    if (source) {
      if (waypoints.length >= 2) {
        const coordinates = waypoints.map((wp) => [wp.lng, wp.lat]);
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        });
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    }

    // Fit bounds
    if (waypoints.length >= 2) {
      const lngs = waypoints.map((wp) => wp.lng);
      const lats = waypoints.map((wp) => wp.lat);
      const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
      const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];

      const lngPad = Math.max(0.01, (ne[0] - sw[0]) * 0.15);
      const latPad = Math.max(0.01, (ne[1] - sw[1]) * 0.15);

      map.fitBounds(
        [
          [sw[0] - lngPad, sw[1] - latPad],
          [ne[0] + lngPad, ne[1] + latPad],
        ],
        { padding: 40, maxZoom: 14, duration: 600 },
      );
    } else if (waypoints.length === 1) {
      map.flyTo({ center: [waypoints[0].lng, waypoints[0].lat], zoom: 13, duration: 600 });
    }
  }, [waypoints, mapReady]);

  // Update cursor when onMapClick changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = onMapClick ? "crosshair" : "";
  }, [onMapClick, mapReady]);

  if (mapError) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-line bg-slate-50"
        style={{ height }}
      >
        <p className="text-sm text-slate-500">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-line">
      <div ref={containerRef} style={{ height, width: "100%" }} />

      {/* Distance overlay */}
      {waypoints.length >= 2 ? (
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div>
              <span className="text-sm font-bold text-slate-900">
                {formatDistanceKm(totalKm)}
              </span>
              <span className="ml-1.5 text-xs text-slate-500">
                toplam mesafe
              </span>
            </div>
          </div>
          {segmentDistances.length > 1 ? (
            <div className="mt-1 text-[10px] text-slate-400">
              {waypoints.length - 1} etap · kuş uçuşu
            </div>
          ) : null}
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 shadow-sm">
          <span className="text-xs text-slate-500">
            Başlangıç ve bitiş noktalarını girin
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute right-3 top-12 flex flex-col gap-1.5 rounded-lg bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-600" />
          <span className="text-[10px] font-medium text-slate-600">Başlangıç</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="text-[10px] font-medium text-slate-600">Durak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-[10px] font-medium text-slate-600">Bitiş</span>
        </div>
      </div>

      {/* Loading overlay */}
      {!mapReady && !mapError ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-100"
          style={{ height }}
        >
          <div className="flex items-center gap-2">
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
            <span className="text-sm text-slate-500">Harita yükleniyor...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
