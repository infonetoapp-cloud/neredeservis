"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type CompanyLiveOpsItem, type CompanyLiveOpsStatus } from "@/features/company/company-client";
import { getMapboxToken } from "@/lib/env/public-env";

type MappableLiveOpsItem = CompanyLiveOpsItem & { lat: number; lng: number };
type MarkerCluster = {
  lat: number;
  lng: number;
  items: MappableLiveOpsItem[];
};

type Props = {
  items: MappableLiveOpsItem[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  /** Additional CSS class for the outer container (override height etc.) */
  className?: string;
  /** When true the component fills the viewport as a modal overlay */
  allowFullscreen?: boolean;
};

const GEBZE_CENTER: [number, number] = [40.8026, 29.4305];
const DEFAULT_ZOOM = 13;
const mapboxToken = getMapboxToken();

/* ---------- Leaflet CSS injector (runs once) ---------- */
let leafletCssLoaded = false;
function ensureLeafletCss() {
  if (leafletCssLoaded || typeof document === "undefined") return;
  leafletCssLoaded = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.crossOrigin = "";
  document.head.appendChild(link);
}

/* ---------- helpers ---------- */

function toMarkerColor(status: CompanyLiveOpsStatus): string {
  if (status === "live") return "#10b981";
  if (status === "stale") return "#f59e0b";
  if (status === "no_signal") return "#ef4444";
  return "#64748b";
}

function toStatusLabel(status: CompanyLiveOpsStatus): string {
  if (status === "live") return "Canlı";
  if (status === "stale") return "Konum gecikmeli";
  if (status === "no_signal") return "Baglanti kesildi";
  return "Sefer bekliyor";
}

function readClusterCellSizeByZoom(zoom: number): number {
  if (zoom >= 15) return 0.0025;
  if (zoom >= 13) return 0.005;
  if (zoom >= 11) return 0.01;
  if (zoom >= 9) return 0.02;
  return 0.04;
}

function clusterItems(items: MappableLiveOpsItem[], zoom: number): MarkerCluster[] {
  const cellSize = readClusterCellSizeByZoom(zoom);
  const bucket = new Map<string, MarkerCluster>();

  for (const item of items) {
    const latCell = Math.floor(item.lat / cellSize);
    const lngCell = Math.floor(item.lng / cellSize);
    const key = `${latCell}_${lngCell}`;
    const existing = bucket.get(key);
    if (!existing) {
      bucket.set(key, { lat: item.lat, lng: item.lng, items: [item] });
      continue;
    }
    existing.items.push(item);
    const count = existing.items.length;
    existing.lat = (existing.lat * (count - 1) + item.lat) / count;
    existing.lng = (existing.lng * (count - 1) + item.lng) / count;
  }
  return Array.from(bucket.values());
}

function readClusterStatus(items: MappableLiveOpsItem[]): CompanyLiveOpsStatus {
  if (items.some((item) => item.status === "live")) return "live";
  if (items.some((item) => item.status === "stale")) return "stale";
  if (items.some((item) => item.status === "no_signal")) return "no_signal";
  return "idle";
}

function pickClusterRoute(items: MappableLiveOpsItem[], selectedRouteId: string | null): MappableLiveOpsItem {
  if (selectedRouteId) {
    const selected = items.find((item) => item.routeId === selectedRouteId);
    if (selected) return selected;
  }
  const live = items.find((item) => item.status === "live");
  if (live) return live;
  return items[0];
}

/* ---------- component ---------- */

export function LiveOpsMapPanel({
  items,
  selectedRouteId,
  onSelectRoute,
  className,
  allowFullscreen = false,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const itemsRef = useRef<MappableLiveOpsItem[]>(items);
  // Always keep ref in sync so effects can read latest items without re-subscribing
  itemsRef.current = items;
  const [autoFrame, setAutoFrame] = useState<boolean>(true);
  const [followSelected, setFollowSelected] = useState<boolean>(true);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** Tracks whether initial fit-to-bounds has run */
  const initialFrameDone = useRef(false);
  /** Tracks programmatic view changes so we don't treat them as user actions */
  const isProgrammaticMove = useRef(false);

  const liveCount = useMemo(() => items.filter((item) => item.status === "live").length, [items]);
  const staleCount = useMemo(() => items.filter((item) => item.status === "stale").length, [items]);
  const noSignalCount = useMemo(
    () => items.filter((item) => item.status === "no_signal").length,
    [items],
  );
  const idleCount = useMemo(() => items.filter((item) => item.status === "idle").length, [items]);
  const clusters = useMemo(() => clusterItems(items, mapZoom), [items, mapZoom]);
  const groupedClusterCount = useMemo(
    () => clusters.filter((cluster) => cluster.items.length > 1).length,
    [clusters],
  );

  const handleFitAll = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (items.length === 0) {
      isProgrammaticMove.current = true;
      map.setView(GEBZE_CENTER, DEFAULT_ZOOM, { animate: true });
      return;
    }
    const bounds = L.latLngBounds([]);
    for (const item of items) bounds.extend([item.lat, item.lng]);
    if (bounds.isValid()) {
      isProgrammaticMove.current = true;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    }
  }, [items]);

  const handleResetGebze = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    isProgrammaticMove.current = true;
    map.setView(GEBZE_CENTER, DEFAULT_ZOOM, { animate: true });
    setAutoFrame(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  /* ---- Escape key closes fullscreen ---- */
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  /* ---- Invalidate map size when fullscreen changes ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Fire invalidateSize multiple times to cover slow DOM reflows
    const timers = [50, 150, 300, 500].map((ms) =>
      window.setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, ms),
    );
    // After last invalidate, re-center only if entering fullscreen
    const fitTimer = window.setTimeout(() => {
      const L = leafletRef.current;
      if (!L || !isFullscreen) return;
      const currentItems = itemsRef.current;
      if (currentItems.length > 0) {
        const bounds = L.latLngBounds([]);
        for (const item of currentItems) bounds.extend([item.lat, item.lng]);
        if (bounds.isValid()) {
          isProgrammaticMove.current = true;
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
        }
      } else {
        isProgrammaticMove.current = true;
        map.setView(GEBZE_CENTER, DEFAULT_ZOOM, { animate: true });
      }
    }, 520);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(fitTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  /* ---- Initialize Leaflet map ---- */
  useEffect(() => {
    ensureLeafletCss();
    let cancelled = false;

    const init = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      });

      // Add zoom control to bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Use colorful streets style instead of grayscale light-v11
      if (mapboxToken) {
        L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
          {
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 18,
            attribution: "&copy; Mapbox &copy; OpenStreetMap contributors",
          },
        ).addTo(map);
      } else {
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
      }
      map.setView(GEBZE_CENTER, DEFAULT_ZOOM);

      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      const handleZoomEnd = () => setMapZoom(map.getZoom());
      map.on("zoomend", handleZoomEnd);

      // Disable autoFrame when user drags or zooms manually
      const handleUserInteraction = () => {
        if (isProgrammaticMove.current) {
          isProgrammaticMove.current = false;
          return;
        }
        setAutoFrame(false);
      };
      map.on("dragstart", handleUserInteraction);
      map.on("zoomstart", handleUserInteraction);

      setMapZoom(map.getZoom());
      window.setTimeout(() => map.invalidateSize(), 0);

      return () => {
        map.off("zoomend", handleZoomEnd);
        map.off("dragstart", handleUserInteraction);
        map.off("zoomstart", handleUserInteraction);
      };
    };

    let dispose: (() => void) | undefined;
    void init().then((cleanup) => {
      dispose = cleanup;
    });

    return () => {
      cancelled = true;
      dispose?.();
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
      initialFrameDone.current = false;
    };
  }, []);

  /* ---- Sync markers ---- */
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!L || !map || !markerLayer) return;

    markerLayer.clearLayers();
    map.invalidateSize();

    if (items.length === 0) {
      if (!initialFrameDone.current) {
        isProgrammaticMove.current = true;
        map.setView(GEBZE_CENTER, DEFAULT_ZOOM, { animate: false });
        initialFrameDone.current = true;
      }
      return;
    }

    const bounds = L.latLngBounds([]);
    for (const cluster of clusters) {
      const selectedInCluster = cluster.items.some((item) => item.routeId === selectedRouteId);
      const isGrouped = cluster.items.length > 1;
      const clusterStatus = readClusterStatus(cluster.items);
      const radius = isGrouped
        ? Math.min(16, 8 + Math.floor(cluster.items.length / 2))
        : selectedInCluster
          ? 8
          : 6;

      const marker = L.circleMarker([cluster.lat, cluster.lng], {
        radius,
        color: selectedInCluster ? "#0ea5e9" : "#ffffff",
        weight: selectedInCluster ? 3 : 2,
        fillColor: toMarkerColor(clusterStatus),
        fillOpacity: 0.95,
      });

      marker.on("click", () => {
        const focusRoute = pickClusterRoute(cluster.items, selectedRouteId);
        onSelectRoute(focusRoute.routeId);
        if (isGrouped) {
          isProgrammaticMove.current = true;
          map.setView([cluster.lat, cluster.lng], Math.min(16, Math.max(map.getZoom() + 1, 13)), {
            animate: true,
          });
        }
      });

      if (isGrouped) {
        marker.bindTooltip(`${cluster.items.length} hat birlikte gorunuyor`, { direction: "top" });
      } else {
        const item = cluster.items[0];
        marker.bindTooltip(`${item.routeName} (${toStatusLabel(item.status)})`, { direction: "top" });
      }

      marker.addTo(markerLayer);
      bounds.extend([cluster.lat, cluster.lng]);
    }

    // Selection ring
    const selectedItem = selectedRouteId
      ? items.find((item) => item.routeId === selectedRouteId) ?? null
      : null;
    if (selectedItem) {
      L.circle([selectedItem.lat, selectedItem.lng], {
        radius: 180,
        color: "#0ea5e9",
        weight: 1.5,
        opacity: 0.7,
        fillColor: "#67b59a",
        fillOpacity: 0.08,
      }).addTo(markerLayer);
    }

    // Initial fit-to-bounds (runs only once)
    if (!initialFrameDone.current && bounds.isValid()) {
      isProgrammaticMove.current = true;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
      initialFrameDone.current = true;
      return;
    }

    // Auto-frame follow-selected (only when autoFrame is ON)
    if (!autoFrame) return;

    if (selectedItem && followSelected) {
      isProgrammaticMove.current = true;
      map.setView([selectedItem.lat, selectedItem.lng], Math.max(map.getZoom(), 13), {
        animate: true,
      });
    }
  }, [autoFrame, clusters, followSelected, items, onSelectRoute, selectedRouteId]);

  /* ---- Fullscreen overlay shell ---- */
  const containerClass = isFullscreen
    ? "fixed inset-0 z-[9999] flex flex-col bg-white"
    : `relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className ?? "h-[420px]"}`;

  return (
    <div className={containerClass}>
      {/* Fullscreen top bar — shrinks to its own height */}
      {isFullscreen && (
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <h3 className="text-sm font-semibold text-slate-800">Canlı Harita — Tam Ekran</h3>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg border border-line bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ✕ Kapat (Esc)
          </button>
        </div>
      )}

      {/* Map wrapper — fills all remaining space; map div absolutely covers it */}
      <div className={`relative min-h-0 ${isFullscreen ? "flex-1" : "h-full"}`}>
        {/* Leaflet binds to this div — always absolute inset-0 so it gets a real pixel size */}
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Top-left controls */}
        <div className="absolute left-2 top-2 z-[1000] flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => { setAutoFrame(true); handleFitAll(); }}
            className="rounded-lg border border-line bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-slate-50"
          >
            Tumunu sigdir
          </button>
          <button
            type="button"
            onClick={handleResetGebze}
            className="rounded-lg border border-line bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-slate-50"
          >
            Gebze
          </button>
          <button
            type="button"
            onClick={() => setAutoFrame((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ${
              autoFrame
                ? "border-sky-200 bg-sky-50/95 text-sky-700"
                : "border-line bg-white/95 text-slate-700"
            }`}
          >
            Otomatik kadraj: {autoFrame ? "acik" : "kapali"}
          </button>
          <button
            type="button"
            onClick={() => setFollowSelected((prev) => !prev)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ${
              followSelected
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                : "border-line bg-white/95 text-slate-700"
            }`}
          >
            Secileni takip et: {followSelected ? "acik" : "kapali"}
          </button>
        </div>

        {/* Top-right fullscreen toggle */}
        {allowFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute right-2 top-2 z-[1000] rounded-lg border border-line bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-slate-50"
          >
            {isFullscreen ? "↙ Kucult" : "⛶ Tam Ekran"}
          </button>
        )}

        {/* Bottom-left legend */}
        <div className="absolute bottom-2 left-2 z-[1000] rounded-lg border border-line bg-white/95 px-2.5 py-2 text-[11px] text-slate-700 shadow-sm backdrop-blur">
          <div className="mb-1 font-semibold text-slate-900">Durum Ozeti</div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Canlı: {liveCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Konum gecikmeli: {staleCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Baglanti kesildi: {noSignalCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            <span>Sefer bekliyor: {idleCount}</span>
          </div>
          <div className="mt-1 border-t border-slate-200 pt-1 text-[10px] text-slate-600">
            toplu gosterilen bolge: {groupedClusterCount} | yakinlik: {mapZoom}
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[999] flex items-center justify-center px-6 text-center text-sm text-slate-500">
            Konum verisi olan aktif rota yok.
          </div>
        )}
      </div>
    </div>
  );
}

