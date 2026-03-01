"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
};

const ISTANBUL_CENTER: [number, number] = [41.015, 28.979];
const DEFAULT_ZOOM = 10;
const mapboxToken = getMapboxToken();

function toMarkerColor(status: CompanyLiveOpsStatus): string {
  if (status === "live") {
    return "#10b981";
  }
  if (status === "stale") {
    return "#f59e0b";
  }
  if (status === "no_signal") {
    return "#ef4444";
  }
  return "#64748b";
}

function toStatusLabel(status: CompanyLiveOpsStatus): string {
  if (status === "live") {
    return "Canli";
  }
  if (status === "stale") {
    return "Konum gecikmeli";
  }
  if (status === "no_signal") {
    return "Baglanti kesildi";
  }
  return "Sefer bekliyor";
}

function readClusterCellSizeByZoom(zoom: number): number {
  if (zoom >= 15) {
    return 0.0025;
  }
  if (zoom >= 13) {
    return 0.005;
  }
  if (zoom >= 11) {
    return 0.01;
  }
  if (zoom >= 9) {
    return 0.02;
  }
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
  if (items.some((item) => item.status === "live")) {
    return "live";
  }
  if (items.some((item) => item.status === "stale")) {
    return "stale";
  }
  if (items.some((item) => item.status === "no_signal")) {
    return "no_signal";
  }
  return "idle";
}

function pickClusterRoute(items: MappableLiveOpsItem[], selectedRouteId: string | null): MappableLiveOpsItem {
  if (selectedRouteId) {
    const selected = items.find((item) => item.routeId === selectedRouteId);
    if (selected) {
      return selected;
    }
  }
  const live = items.find((item) => item.status === "live");
  if (live) {
    return live;
  }
  return items[0];
}

export function LiveOpsMapPanel({ items, selectedRouteId, onSelectRoute }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [autoFrame, setAutoFrame] = useState<boolean>(true);
  const [followSelected, setFollowSelected] = useState<boolean>(true);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);

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

  const handleFitAll = () => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) {
      return;
    }
    if (items.length === 0) {
      map.setView(ISTANBUL_CENTER, DEFAULT_ZOOM, { animate: false });
      return;
    }
    const bounds = L.latLngBounds([]);
    for (const item of items) {
      bounds.extend([item.lat, item.lng]);
    }
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: 15,
        animate: false,
      });
    }
  };

  const handleResetIstanbul = () => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.setView(ISTANBUL_CENTER, DEFAULT_ZOOM, { animate: false });
    setAutoFrame(false);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current) {
        return;
      }

      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });
      if (mapboxToken) {
        L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
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
      map.setView(ISTANBUL_CENTER, DEFAULT_ZOOM);

      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      const handleZoomEnd = () => {
        setMapZoom(map.getZoom());
      };
      map.on("zoomend", handleZoomEnd);
      setMapZoom(map.getZoom());

      window.setTimeout(() => {
        map.invalidateSize();
      }, 0);

      return () => {
        map.off("zoomend", handleZoomEnd);
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
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!L || !map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();
    map.invalidateSize();

    if (items.length === 0) {
      map.setView(ISTANBUL_CENTER, DEFAULT_ZOOM, { animate: false });
      return;
    }

    const bounds = L.latLngBounds([]);
    for (const cluster of clusters) {
      const selectedInCluster = cluster.items.some((item) => item.routeId === selectedRouteId);
      const isGrouped = cluster.items.length > 1;
      const clusterStatus = readClusterStatus(cluster.items);
      const marker = L.circleMarker([cluster.lat, cluster.lng], {
        radius: isGrouped ? Math.min(16, 8 + Math.floor(cluster.items.length / 2)) : selectedInCluster ? 8 : 6,
        color: "#ffffff",
        weight: selectedInCluster ? 3 : 2,
        fillColor: toMarkerColor(clusterStatus),
        fillOpacity: 0.95,
      });

      marker.on("click", () => {
        const focusRoute = pickClusterRoute(cluster.items, selectedRouteId);
        onSelectRoute(focusRoute.routeId);
        if (isGrouped) {
          map.setView([cluster.lat, cluster.lng], Math.min(16, Math.max(map.getZoom() + 1, 13)), {
            animate: false,
          });
        }
      });

      if (isGrouped) {
        marker.bindTooltip(`${cluster.items.length} hat birlikte gorunuyor`, {
          direction: "top",
        });
      } else {
        const item = cluster.items[0];
        marker.bindTooltip(`${item.routeName} (${toStatusLabel(item.status)})`, {
          direction: "top",
        });
      }

      marker.addTo(markerLayer);
      bounds.extend([cluster.lat, cluster.lng]);
    }

    const selectedItem = selectedRouteId ? items.find((item) => item.routeId === selectedRouteId) ?? null : null;
    if (selectedItem) {
      L.circle([selectedItem.lat, selectedItem.lng], {
        radius: 180,
        color: "#1e4f45",
        weight: 1.5,
        opacity: 0.7,
        fillColor: "#67b59a",
        fillOpacity: 0.08,
      }).addTo(markerLayer);
    }

    if (!autoFrame) {
      return;
    }

    if (selectedItem && followSelected) {
      map.setView([selectedItem.lat, selectedItem.lng], Math.max(map.getZoom(), 13), {
        animate: false,
      });
      return;
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: 15,
        animate: false,
      });
    }
  }, [autoFrame, clusters, followSelected, items, onSelectRoute, selectedRouteId]);

  return (
    <div className="relative h-72 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={handleFitAll}
          className="rounded-lg border border-line bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur hover:bg-slate-50"
        >
          Tumunu sigdir
        </button>
        <button
          type="button"
          onClick={handleResetIstanbul}
          className="rounded-lg border border-line bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur hover:bg-slate-50"
        >
          Istanbul
        </button>
        <button
          type="button"
          onClick={() => setAutoFrame((prev) => !prev)}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${
            autoFrame
              ? "border-[#b7ccc2] bg-[#e8f1ec]/95 text-[#285849]"
              : "border-line bg-white/95 text-slate-700"
          }`}
        >
          Otomatik kadraj: {autoFrame ? "acik" : "kapali"}
        </button>
        <button
          type="button"
          onClick={() => setFollowSelected((prev) => !prev)}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${
            followSelected
              ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
              : "border-line bg-white/95 text-slate-700"
          }`}
        >
          Secileni takip et: {followSelected ? "acik" : "kapali"}
        </button>
      </div>

      <div className="absolute bottom-2 left-2 rounded-lg border border-line bg-white/95 px-2.5 py-2 text-[11px] text-slate-700 backdrop-blur">
        <div className="mb-1 font-semibold text-slate-900">Durum Ozeti</div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Canli: {liveCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Konum gecikmeli: {staleCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Baglanti kesildi: {noSignalCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          <span>Sefer bekliyor: {idleCount}</span>
        </div>
        <div className="mt-1 border-t border-slate-200 pt-1 text-[10px] text-slate-600">
          toplu gosterilen bolge: {groupedClusterCount} | yakinlik seviyesi: {mapZoom}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-muted">
          Konum verisi olan aktif rota yok.
        </div>
      ) : null}
    </div>
  );
}
