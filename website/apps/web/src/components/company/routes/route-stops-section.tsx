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
  onMoveStop,
  onReorderStops,
  onDeleteStop,
}: Props) {
  const [draggedStopId, setDraggedStopId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Build waypoints for distance calculation (existing stops only)
  const existingWaypoints = useMemo<RouteWaypoint[]>(() => {
    return sortedRouteStops.map((s, i) => {
      const total = sortedRouteStops.length;
      const type: RouteWaypoint["type"] =
        total === 1 ? "start" : i === 0 ? "start" : i === total - 1 ? "end" : "stop";
      return {
        id: s.stopId,
        label: s.name || `Durak ${s.order}`,
        lat: s.location.lat,
        lng: s.location.lng,
        type,
      };
    });
  }, [sortedRouteStops]);

  const { segmentDistances } = useMemo(
    () => calculateRouteDistances(existingWaypoints),
    [existingWaypoints],
  );

  if (!selectedRoute) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Duraklar
          <span className="ml-1.5 text-xs font-normal text-slate-400">
            ({sortedRouteStops.length} durak)
          </span>
        </h3>
        {segmentDistances.length > 0 && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            ≈ {formatDistanceKm(segmentDistances.reduce((acc, s) => acc + s.km, 0))} toplam
          </span>
        )}
      </div>

      {/* Stop list */}
      {loadingStops ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          <span className="text-xs text-slate-500">Duraklar yükleniyor...</span>
        </div>
      ) : sortedRouteStops.length === 0 && !showAddForm ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-xs text-slate-500">Bu rotaya henüz durak eklenmemiş.</p>
          {canMutate && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span className="text-lg leading-none">+</span> İlk durağı ekle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {sortedRouteStops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === sortedRouteStops.length - 1;
            const pinColor = isFirst
              ? "bg-green-500"
              : isLast && sortedRouteStops.length > 1
                ? "bg-red-500"
                : "bg-blue-500";
            const isDragging = draggedStopId === stop.stopId;
            const isMoving = movingStopId === stop.stopId;
            const isDeleting = deletingStopId === stop.stopId;

            return (
              <div key={stop.stopId}>
                {/* Stop card */}
                <div
                  draggable={canMutate && !movingStopId && !deletingStopId && !stopActionPending}
                  onDragStart={() => setDraggedStopId(stop.stopId)}
                  onDragOver={(e) => {
                    if (!canMutate || !draggedStopId || draggedStopId === stop.stopId) return;
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (!canMutate || !draggedStopId || draggedStopId === stop.stopId) return;
                    e.preventDefault();
                    onReorderStops(draggedStopId, stop.stopId);
                    setDraggedStopId(null);
                  }}
                  onDragEnd={() => setDraggedStopId(null)}
                  className={`group flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 transition-all ${
                    isDragging
                      ? "scale-[1.02] border-blue-300 opacity-70 shadow-md"
                      : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  } ${isMoving || isDeleting ? "opacity-60" : ""}`}
                >
                  {/* Drag handle */}
                  {canMutate && (
                    <span
                      className="cursor-grab text-slate-300 transition-colors group-hover:text-slate-500 active:cursor-grabbing"
                      title="Sürükle-bırak ile sırala"
                    >
                      <svg
                        width="12"
                        height="16"
                        viewBox="0 0 12 16"
                        fill="currentColor"
                      >
                        <circle cx="3" cy="2" r="1.5" />
                        <circle cx="9" cy="2" r="1.5" />
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="9" cy="8" r="1.5" />
                        <circle cx="3" cy="14" r="1.5" />
                        <circle cx="9" cy="14" r="1.5" />
                      </svg>
                    </span>
                  )}

                  {/* Pin indicator */}
                  <span className={`h-3 w-3 shrink-0 rounded-full ${pinColor} shadow-sm`} />

                  {/* Stop info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {stop.name || `Durak ${stop.order}`}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">
                      {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                    </div>
                  </div>

                  {/* Order badge */}
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    #{stop.order + 1}
                  </span>

                  {/* Distance to next */}
                  {index < segmentDistances.length && (
                    <span className="hidden shrink-0 text-[10px] text-slate-400 sm:block">
                      {formatDistanceKm(segmentDistances[index].km)}
                    </span>
                  )}

                  {/* Delete button */}
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

                {/* Connector line → next stop */}
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

      {/* Add stop inline form */}
      {canMutate && selectedRoute && (
        <div className="space-y-2">
          {!showAddForm && sortedRouteStops.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2.5 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="text-base leading-none">+</span> Durak Ekle
            </button>
          ) : showAddForm || sortedRouteStops.length === 0 ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_1.2fr]">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Durak Adı (opsiyonel)
                  </span>
                  <input
                    type="text"
                    value={stopName}
                    onChange={(e) => onSetStopName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddStop();
                      }
                    }}
                    maxLength={80}
                    placeholder="Levent Metro Çıkışı"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <AddressAutocompleteInput
                  label="Durak Adresi"
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
    </div>
  );
}
