"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { RouteWaypoint } from "@/components/dashboard/route-distance-helpers";
import { calculateRouteDistances, formatDistanceKm } from "@/components/dashboard/route-distance-helpers";
import { previewMapRoute } from "@/lib/backend-api/maps";
import {
  getPublicMapTileAttribution,
  getPublicMapTileMaxZoom,
  getPublicMapTileUrl,
} from "@/lib/env/public-env";

type LeafletModule = typeof import("leaflet");
type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;
type LeafletPolyline = import("leaflet").Polyline;

type RouteCreationMapPreviewProps = {
  waypoints: RouteWaypoint[];
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
  autoDrawRoute?: boolean;
};

const DEFAULT_CENTER: [number, number] = [40.8028, 29.4307];
const DEFAULT_ZOOM = 11;
const MAX_ROUTE_WAYPOINTS = 64;

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

function createMarkerIcon(module: LeafletModule, waypoint: RouteWaypoint, index: number) {
  const label = waypoint.type === "stop" ? String(index) : MARKER_LABELS[waypoint.type];
  const size = waypoint.type === "stop" ? 28 : 34;

  return module.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -Math.floor(size / 2)],
    html: `
      <div
        style="
          width:${size}px;
          height:${size}px;
          border-radius:9999px;
          background:${MARKER_COLORS[waypoint.type]};
          border:3px solid #ffffff;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          display:flex;
          align-items:center;
          justify-content:center;
          color:#ffffff;
          font-size:${waypoint.type === "stop" ? "11px" : "13px"};
          font-weight:700;
        "
        title="${waypoint.label.replace(/"/g, "&quot;")}"
      >${label}</div>
    `,
  });
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
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const routeLineRef = useRef<LeafletPolyline | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const directionsAbortRef = useRef<AbortController | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [directionsCoordinates, setDirectionsCoordinates] = useState<[number, number][] | null>(null);
  const [directionsPending, setDirectionsPending] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  onMapClickRef.current = onMapClick;

  const { totalKm, segmentDistances } = calculateRouteDistances(waypoints);
  const tileUrl = getPublicMapTileUrl();
  const tileAttribution = getPublicMapTileAttribution();
  const tileMaxZoom = getPublicMapTileMaxZoom();

  const handleDrawRoute = useCallback(async () => {
    if (waypoints.length < 2) {
      setDirectionsError("Rota cizmek icin en az iki nokta gerekli.");
      return;
    }
    if (waypoints.length > MAX_ROUTE_WAYPOINTS) {
      setDirectionsError(`Rota servisi en fazla ${MAX_ROUTE_WAYPOINTS} noktayi destekler.`);
      return;
    }

    directionsAbortRef.current?.abort();
    const abortController = new AbortController();
    directionsAbortRef.current = abortController;

    setDirectionsPending(true);
    setDirectionsError(null);

    try {
      const preview = await previewMapRoute({
        waypoints: waypoints.map((waypoint) => ({
          lat: waypoint.lat,
          lng: waypoint.lng,
        })),
      });
      if (abortController.signal.aborted) {
        return;
      }

      const sanitized = sanitizeDirectionsCoordinates(preview.geometry.coordinates);
      if (sanitized.length < 2) {
        throw new Error("ROUTE_GEOMETRY_INVALID");
      }

      setDirectionsCoordinates(sanitized);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setDirectionsCoordinates(null);
      setDirectionsError("Rota servisi cizimi alinamadi. Tekrar deneyin.");
    } finally {
      if (!abortController.signal.aborted) {
        setDirectionsPending(false);
      }
    }
  }, [waypoints]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;

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
        map.on("click", (event) => {
          onMapClickRef.current?.(event.latlng.lat, event.latlng.lng);
        });
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
          setMapError(error instanceof Error ? error.message : "Harita baslatilamadi.");
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];
      routeLineRef.current?.remove();
      routeLineRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
    };
  }, [tileAttribution, tileMaxZoom, tileUrl]);

  useEffect(() => {
    setDirectionsCoordinates(null);
    setDirectionsError(null);
    setDirectionsPending(false);
    directionsAbortRef.current?.abort();
    directionsAbortRef.current = null;
  }, [waypoints]);

  useEffect(() => {
    if (!autoDrawRoute || !mapReady || waypoints.length < 2) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void handleDrawRoute();
    }, 360);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoDrawRoute, handleDrawRoute, mapReady, waypoints]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) {
      return;
    }

    const map = mapRef.current;
    const leaflet = leafletRef.current;

    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];

    let stopIndex = 1;
    for (let index = 0; index < waypoints.length; index += 1) {
      const waypoint = waypoints[index];
      const displayIndex = waypoint.type === "stop" ? stopIndex++ : index;
      const marker = leaflet
        .marker([waypoint.lat, waypoint.lng], {
          icon: createMarkerIcon(leaflet, waypoint, displayIndex),
          keyboard: false,
        })
        .bindPopup(`<div style="padding:4px 8px;font-size:13px;font-weight:600;">${waypoint.label}</div>`)
        .addTo(map);

      markersRef.current.push(marker);
    }

    const renderCoordinates =
      directionsCoordinates && directionsCoordinates.length >= 2
        ? directionsCoordinates
        : waypoints.length >= 2
          ? waypoints.map((waypoint) => [waypoint.lng, waypoint.lat] as [number, number])
          : null;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (renderCoordinates && renderCoordinates.length >= 2) {
      const latLngs = renderCoordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      routeLineRef.current = leaflet
        .polyline(latLngs, {
          color: directionsCoordinates ? "#1d4ed8" : "#3b82f6",
          weight: directionsCoordinates ? 4 : 3,
          opacity: 0.85,
        })
        .addTo(map);

      map.fitBounds(leaflet.latLngBounds(latLngs).pad(0.15), {
        padding: [40, 40],
        maxZoom: 14,
        animate: true,
      });
    } else if (waypoints.length === 1) {
      map.flyTo([waypoints[0].lat, waypoints[0].lng], 13, {
        animate: true,
        duration: 0.6,
      });
    } else if (waypoints.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  }, [directionsCoordinates, mapReady, waypoints]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }
    mapRef.current.getContainer().style.cursor = onMapClick ? "crosshair" : "";
  }, [mapReady, onMapClick]);

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
          <div className="text-sm font-semibold text-amber-900">Harita yuklenemedi</div>
          <p className="text-xs leading-5 text-amber-900">{mapError}</p>
          <p className="text-[11px] text-amber-700">
            {waypoints.length > 0
              ? `${waypoints.length} nokta hazir. Harita erisimi duzeldiginde onizleme burada gorunecek.`
              : "Noktalar secildiginde rota onizlemesi burada gosterilecek."}
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
            <div className="mt-1 text-[10px] text-slate-400">{waypoints.length - 1} etap · kus ucusu</div>
          ) : null}
          {directionsCoordinates ? (
            <div className="mt-1 text-[10px] font-semibold text-blue-700">Self-host rota servisi aktif</div>
          ) : null}
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 shadow-sm">
          <span className="text-xs text-slate-500">Baslangic ve bitis noktalarini girin</span>
        </div>
      )}

      {mapReady && waypoints.length >= 2 ? (
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {autoDrawRoute ? (
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
              {directionsPending ? "Rota guncelleniyor..." : "Canli rota onizleme acik"}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDrawRoute}
              disabled={directionsPending}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {directionsPending ? "Rota ciziliyor..." : directionsCoordinates ? "Rotayi guncelle" : "Rota ciz"}
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
          <span className="text-[10px] font-medium text-slate-600">Baslangic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="text-[10px] font-medium text-slate-600">Durak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-[10px] font-medium text-slate-600">Bitis</span>
        </div>
      </div>

      {!mapReady && !mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100" style={{ height }}>
          <div className="flex items-center gap-2">
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
            <span className="text-sm text-slate-500">Harita yukleniyor...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
