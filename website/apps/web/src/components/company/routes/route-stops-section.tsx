"use client";

import { useMemo, useState } from "react";

import {
  calculateRouteDistances,
  formatDistanceKm,
} from "@/components/dashboard/route-distance-helpers";
import type { RouteWaypoint } from "@/components/dashboard/route-distance-helpers";
import type { CompanyRouteItem, CompanyRouteStopItem } from "@/features/company/company-client";

import { AddressAutocompleteInput, type AddressSuggestion } from "./place-autocomplete-input";

type Props = {
  selectedRoute: CompanyRouteItem | null;
  canMutate: boolean;
  stopName: string;
  stopAddressQuery: string;
  stopAddressSuggestion: AddressSuggestion | null;
  stopActionPending: boolean;
  canAddStop: boolean;
  loadingStops: boolean;
  sortedRouteStops: CompanyRouteStopItem[];
  movingStopId: string | null;
  deletingStopId: string | null;
  onSetStopName: (value: string) => void;
  onSetStopAddressQuery: (value: string) => void;
  onSelectStopAddressSuggestion: (suggestion: AddressSuggestion) => void;
  onAddStop: () => void;
  onMoveStop: (stopId: string, direction: "up" | "down") => void;
  onReorderStops: (draggedStopId: string, targetStopId: string) => void;
  onDeleteStop: (stopId: string) => void;
};

export function RouteStopsSection({
  selectedRoute,
  canMutate,
  stopName,
  stopAddressQuery,
  stopAddressSuggestion,
  stopActionPending,
  canAddStop,
  loadingStops,
  sortedRouteStops,
  movingStopId,
  deletingStopId,
  onSetStopName,
  onSetStopAddressQuery,
  onSelectStopAddressSuggestion,
  onAddStop,
  onReorderStops,
  onDeleteStop,
}: Props) {
  const [draggedStopId, setDraggedStopId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const existingWaypoints = useMemo<RouteWaypoint[]>(() => {
    return sortedRouteStops.map((stop) => ({
      id: stop.stopId,
      label: stop.name || `Ara durak ${stop.order + 1}`,
      lat: stop.location.lat,
      lng: stop.location.lng,
      type: "stop",
    }));
  }, [sortedRouteStops]);

  const { segmentDistances } = useMemo(
    () => calculateRouteDistances(existingWaypoints),
    [existingWaypoints],
  );

  if (!selectedRoute) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Ara duraklar
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              ({sortedRouteStops.length} durak)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Seçili rotanın ara duraklarını buradan ekle, sırala ve temizle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {selectedRoute.name}
          </span>
          {segmentDistances.length > 0 && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Yaklaşık {formatDistanceKm(segmentDistances.reduce((acc, segment) => acc + segment.km, 0))} toplam
            </span>
          )}
        </div>
      </div>

      {loadingStops ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          <span className="text-xs text-slate-500">Duraklar yükleniyor...</span>
        </div>
      ) : sortedRouteStops.length === 0 && !showAddForm ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-semibold text-slate-700">Bu rotaya henüz ara durak eklenmemiş.</p>
          <p className="mt-1 text-xs text-slate-500">Sürtünmeyi azaltmak için ilk durağı doğrudan buradan ekleyebilirsin.</p>
          {canMutate && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-3 inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <span className="text-lg leading-none">+</span> İlk ara durağı ekle
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-0">
          {sortedRouteStops.map((stop, index) => {
            const isLast = index === sortedRouteStops.length - 1;
            const isDragging = draggedStopId === stop.stopId;
            const isMoving = movingStopId === stop.stopId;
            const isDeleting = deletingStopId === stop.stopId;

            return (
              <div key={stop.stopId}>
                <div
                  draggable={canMutate && !movingStopId && !deletingStopId && !stopActionPending}
                  onDragStart={() => setDraggedStopId(stop.stopId)}
                  onDragOver={(event) => {
                    if (!canMutate || !draggedStopId || draggedStopId === stop.stopId) {
                      return;
                    }
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (!canMutate || !draggedStopId || draggedStopId === stop.stopId) {
                      return;
                    }
                    event.preventDefault();
                    onReorderStops(draggedStopId, stop.stopId);
                    setDraggedStopId(null);
                  }}
                  onDragEnd={() => setDraggedStopId(null)}
                  className={`group flex items-center gap-2.5 rounded-2xl border bg-white px-3 py-3 transition-all ${
                    isDragging
                      ? "scale-[1.02] border-blue-300 opacity-70 shadow-md"
                      : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  } ${isMoving || isDeleting ? "opacity-60" : ""}`}
                >
                  {canMutate && (
                    <span
                      className="cursor-grab text-slate-300 transition-colors group-hover:text-slate-500 active:cursor-grabbing"
                      title="Sürükle-bırak ile sırala"
                    >
                      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                        <circle cx="3" cy="2" r="1.5" />
                        <circle cx="9" cy="2" r="1.5" />
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="9" cy="8" r="1.5" />
                        <circle cx="3" cy="14" r="1.5" />
                        <circle cx="9" cy="14" r="1.5" />
                      </svg>
                    </span>
                  )}

                  <span className="h-3 w-3 shrink-0 rounded-full bg-blue-500 shadow-sm" />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {stop.name || `Ara durak ${index + 1}`}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">
                      {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    #{stop.order + 1}
                  </span>

                  {index < segmentDistances.length && (
                    <span className="hidden shrink-0 text-[10px] text-slate-400 sm:block">
                      {formatDistanceKm(segmentDistances[index].km)}
                    </span>
                  )}

                  {canMutate && (
                    <button
                      type="button"
                      onClick={() => onDeleteStop(stop.stopId)}
                      disabled={isDeleting || movingStopId !== null}
                      className="shrink-0 rounded-md p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-30"
                      title="Durağı sil"
                    >
                      {isDeleting ? (
                        <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {!isLast && (
                  <div className="ml-[38px] flex items-center gap-1.5 py-0.5">
                    <span className="h-4 w-0.5 bg-slate-200" />
                    {index < segmentDistances.length && (
                      <span className="text-[9px] text-slate-300 sm:hidden">
                        {formatDistanceKm(segmentDistances[index].km)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canMutate && selectedRoute && (
        <div className="mt-4 space-y-2">
          {!showAddForm && sortedRouteStops.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-3 py-3 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="text-base leading-none">+</span> Ara durak ekle
            </button>
          ) : showAddForm || sortedRouteStops.length === 0 ? (
            <div className="space-y-2 rounded-[24px] border border-blue-100 bg-blue-50/30 p-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_1.2fr]">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Durak adı (opsiyonel)
                  </span>
                  <input
                    type="text"
                    value={stopName}
                    onChange={(event) => onSetStopName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAddStop();
                      }
                    }}
                    maxLength={80}
                    placeholder="Levent Metro Çıkışı"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <AddressAutocompleteInput
                  label="Durak adresi"
                  value={stopAddressQuery}
                  placeholder="Adres aramaya başla..."
                  maxLength={256}
                  selectedSuggestion={stopAddressSuggestion}
                  required
                  onValueChange={onSetStopAddressQuery}
                  onSelectSuggestion={onSelectStopAddressSuggestion}
                  onEnterPressed={onAddStop}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onAddStop}
                  disabled={!canAddStop}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {stopActionPending ? (
                    <>
                      <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Ekleniyor...
                    </>
                  ) : (
                    "Ekle"
                  )}
                </button>
                {sortedRouteStops.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    İptal
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
