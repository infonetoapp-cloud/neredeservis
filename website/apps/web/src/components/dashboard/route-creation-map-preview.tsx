"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { RouteWaypoint } from "@/components/dashboard/route-distance-helpers";
import { calculateRouteDistances, formatDistanceKm } from "@/components/dashboard/route-distance-helpers";
import { getPublicMapboxToken } from "@/lib/env/public-env";

type MapboxGL = typeof import("mapbox-gl");
type MapboxMap = import("mapbox-gl").Map;
type MapboxMarker = import("mapbox-gl").Marker;

type RouteCreationMapPreviewProps = {
  waypoints: RouteWaypoint[];
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
  autoDrawRoute?: boolean;
};

type DirectionsApiResponse = {
  routes?: Array<{
    geometry?: {
      type?: "LineString";
      coordinates?: number[][];
    };
  }>;
};

const DEFAULT_CENTER: [number, number] = [29.4307, 40.8028];
const DEFAULT_ZOOM = 11;
const ROUTE_LINE_SOURCE = "route-creation-line-source";
const ROUTE_LINE_LAYER = "route-creation-line-layer";
const MAP_LOAD_TIMEOUT_MS = 18_000;
const MAX_DIRECTIONS_WAYPOINTS = 25;

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

function createMarkerElement(waypoint: RouteWaypoint, index: number): HTMLDivElement {
  const el = document.createElement("div");
  const color = MARKER_COLORS[waypoint.type];
  const label = waypoint.type === "stop" ? String(index) : MARKER_LABELS[waypoint.type];
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
  el.textContent = label;
  el.title = waypoint.label;

  return el;
}

function sanitizeDirectionsCoordinates(value: unknown): [number, number][] {
  if (!Array.isArray(value)) {
    return [];
  }

  const coordinates: [number, number][] = [];
  for (const point of value) {
    if (!Array.isArray(point) || point.length < 2) {
      continue;
    }

    const lng = point[0];
    const lat = point[1];
    if (
      typeof lng === "number" &&
      Number.isFinite(lng) &&
      typeof lat === "number" &&
      Number.isFinite(lat)
    ) {
      coordinates.push([lng, lat]);
    }
  }

  return coordinates;
}

export function RouteCreationMapPreview({
  waypoints,
  height = "400px",
  onMapClick,
  autoDrawRoute = false,
}: RouteCreationMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const loadTimerRef = useRef<number | null>(null);
  const mapReadyRef = useRef(false);
  const lastLoadErrorRef = useRef<string | null>(null);
  const directionsAbortRef = useRef<AbortController | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [directionsCoordinates, setDirectionsCoordinates] = useState<[number, number][] | null>(null);
  const [directionsPending, setDirectionsPending] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  onMapClickRef.current = onMapClick;

  const { totalKm, segmentDistances } = calculateRouteDistances(waypoints);
  const mapboxToken = getPublicMapboxToken();

  const handleDrawRoute = useCallback(async () => {
    if (!mapboxToken) {
      setDirectionsError("Mapbox anahtarı bulunamadı.");
      return;
    }
    if (waypoints.length < 2) {
      setDirectionsError("Rota çizmek için en az iki nokta gerekli.");
      return;
    }
    if (waypoints.length > MAX_DIRECTIONS_WAYPOINTS) {
      setDirectionsError(`Mapbox Directions en fazla ${MAX_DIRECTIONS_WAYPOINTS} noktayı destekler.`);
      return;
    }

    directionsAbortRef.current?.abort();
    const abortController = new AbortController();
    directionsAbortRef.current = abortController;

    setDirectionsPending(true);
    setDirectionsError(null);

    try {
      const coordinatesPath = waypoints.map((waypoint) => `${waypoint.lng},${waypoint.lat}`).join(";");
      const params = new URLSearchParams({
        alternatives: "false",
        geometries: "geojson",
        overview: "full",
        steps: "false",
        language: "tr",
        access_token: mapboxToken,
      });

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesPath}?${params.toString()}`,
        { signal: abortController.signal },
      );

      if (!response.ok) {
        throw new Error("ROUTE_REQUEST_FAILED");
      }

      const payload = (await response.json()) as DirectionsApiResponse;
      const firstRoute = payload.routes?.[0];
      const sanitized = sanitizeDirectionsCoordinates(firstRoute?.geometry?.coordinates);

      if (firstRoute?.geometry?.type !== "LineString" || sanitized.length < 2) {
        throw new Error("ROUTE_GEOMETRY_INVALID");
      }

      setDirectionsCoordinates(sanitized);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setDirectionsCoordinates(null);
      setDirectionsError("Mapbox rota çizimi alınamadı. Tekrar deneyin.");
    } finally {
      if (!abortController.signal.aborted) {
        setDirectionsPending(false);
      }
    }
  }, [mapboxToken, waypoints]);

  useEffect(() => {
    if (!mapboxToken) {
      setMapError("Harita anahtarı bulunamadı. Lütfen yönetici ayarlarını kontrol edin.");
      return;
    }
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;
    lastLoadErrorRef.current = null;

    async function initMap() {
      try {
        const mapboxgl = await import("mapbox-gl");
        if (cancelled) {
          return;
        }

        mapboxgl.default.accessToken = mapboxToken;
        mapboxRef.current = mapboxgl;

        const map = new mapboxgl.default.Map({
          container: containerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.default.NavigationControl({ showCompass: false }), "top-right");

        loadTimerRef.current = window.setTimeout(() => {
          if (!cancelled && !mapReadyRef.current) {
            setMapError(
              lastLoadErrorRef.current ??
                "Mapbox haritasına ulaşılamadı. İnternet, CSP veya token erişimini kontrol edin.",
            );
          }
        }, MAP_LOAD_TIMEOUT_MS);

        map.on("error", (event) => {
          if (cancelled || mapReadyRef.current) {
            return;
          }
          const message = (event as { error?: { message?: string } }).error?.message?.trim();
          if (message) {
            lastLoadErrorRef.current = message;
          }
        });

        map.on("load", () => {
          if (cancelled) {
            return;
          }

          mapReadyRef.current = true;
          lastLoadErrorRef.current = null;
          setMapReady(true);
          setMapError(null);

          if (loadTimerRef.current != null) {
            window.clearTimeout(loadTimerRef.current);
            loadTimerRef.current = null;
          }

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
              "line-opacity": 0.85,
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
          });

          map.on("click", (event) => {
            if (onMapClickRef.current) {
              onMapClickRef.current(event.lngLat.lat, event.lngLat.lng);
            }
          });

          map.getCanvas().style.cursor = onMapClickRef.current ? "crosshair" : "";
          mapRef.current = map;
        });
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : "Mapbox haritası başlatılamadı.");
        }
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      mapReadyRef.current = false;
      lastLoadErrorRef.current = null;
      if (loadTimerRef.current != null) {
        window.clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [mapboxToken]);

  useEffect(() => {
    setDirectionsCoordinates(null);
    setDirectionsError(null);
    setDirectionsPending(false);
    directionsAbortRef.current?.abort();
    directionsAbortRef.current = null;
  }, [waypoints]);

  useEffect(() => {
    if (!autoDrawRoute || !mapReady || !mapboxToken || waypoints.length < 2) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void handleDrawRoute();
    }, 360);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoDrawRoute, handleDrawRoute, mapReady, mapboxToken, waypoints]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) {
      return;
    }

    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;

    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];

    let stopIndex = 1;
    for (let i = 0; i < waypoints.length; i += 1) {
      const waypoint = waypoints[i];
      const displayIndex = waypoint.type === "stop" ? stopIndex++ : i;
      const element = createMarkerElement(waypoint, displayIndex);

      const marker = new mapboxgl.default.Marker({ element })
        .setLngLat([waypoint.lng, waypoint.lat])
        .setPopup(
          new mapboxgl.default.Popup({ offset: 20, closeButton: false }).setHTML(
            `<div style="padding:4px 8px;font-size:13px;font-weight:600;">${waypoint.label}</div>`,
          ),
        )
        .addTo(map);

      markersRef.current.push(marker);
    }

    const renderCoordinates =
      directionsCoordinates && directionsCoordinates.length >= 2
        ? directionsCoordinates
        : waypoints.length >= 2
          ? waypoints.map((waypoint) => [waypoint.lng, waypoint.lat] as [number, number])
          : null;

    const source = map.getSource(ROUTE_LINE_SOURCE) as import("mapbox-gl").GeoJSONSource | undefined;
    if (source) {
      if (renderCoordinates && renderCoordinates.length >= 2) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: renderCoordinates,
          },
        });
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    }

    if (map.getLayer(ROUTE_LINE_LAYER)) {
      map.setPaintProperty(ROUTE_LINE_LAYER, "line-color", directionsCoordinates ? "#1d4ed8" : "#3b82f6");
      map.setPaintProperty(ROUTE_LINE_LAYER, "line-width", directionsCoordinates ? 4 : 3);
    }

    if (renderCoordinates && renderCoordinates.length >= 2) {
      const lngs = renderCoordinates.map((coordinate) => coordinate[0]);
      const lats = renderCoordinates.map((coordinate) => coordinate[1]);
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
  }, [waypoints, mapReady, directionsCoordinates]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }
    mapRef.current.getCanvas().style.cursor = onMapClick ? "crosshair" : "";
  }, [onMapClick, mapReady]);

  useEffect(
    () => () => {
      directionsAbortRef.current?.abort();
      directionsAbortRef.current = null;
    },
    [],
  );

  if (mapError) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-center"
        style={{ height }}
      >
        <div className="max-w-md space-y-2">
          <div className="text-sm font-semibold text-amber-900">Harita yüklenemedi</div>
          <p className="text-xs leading-5 text-amber-900">{mapError}</p>
          <p className="text-[11px] text-amber-700">
            {waypoints.length > 0
              ? `${waypoints.length} nokta hazır. Harita erişimi düzeldiğinde önizleme burada görünecek.`
              : "Noktalar seçildiğinde rota önizlemesi burada gösterilecek."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-line" style={{ height }}>
      <div ref={containerRef} className="h-full w-full" />

      {waypoints.length >= 2 ? (
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <div>
              <span className="text-sm font-bold text-slate-900">{formatDistanceKm(totalKm)}</span>
              <span className="ml-1.5 text-xs text-slate-500">toplam mesafe</span>
            </div>
          </div>
          {segmentDistances.length > 1 ? (
            <div className="mt-1 text-[10px] text-slate-400">{waypoints.length - 1} etap · kuş uçuşu</div>
          ) : null}
          {directionsCoordinates ? (
            <div className="mt-1 text-[10px] font-semibold text-blue-700">Mapbox rota çizimi aktif</div>
          ) : null}
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 shadow-sm">
          <span className="text-xs text-slate-500">Başlangıç ve bitiş noktalarını girin</span>
        </div>
      )}

      {mapReady && mapboxToken && waypoints.length >= 2 ? (
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {autoDrawRoute ? (
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
              {directionsPending ? "Rota güncelleniyor..." : "Canlı rota önizleme açık"}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDrawRoute}
              disabled={directionsPending}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {directionsPending ? "Rota çiziliyor..." : directionsCoordinates ? "Rotayı güncelle" : "Rota çiz (Mapbox)"}
            </button>
          )}
          {directionsError ? (
            <div className="max-w-[260px] rounded-md border border-amber-200 bg-amber-50/95 px-2.5 py-1.5 text-[11px] text-amber-800">
              {directionsError}
            </div>
          ) : null}
        </div>
      ) : null}

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

      {!mapReady && !mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100" style={{ height }}>
          <div className="flex items-center gap-2">
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
            <span className="text-sm text-slate-500">Harita yükleniyor...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
