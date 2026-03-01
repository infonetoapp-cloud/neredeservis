"use client";

import { useState } from "react";

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

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 text-sm font-semibold text-slate-900">
        Durak yonetimi{selectedRoute ? ` - ${selectedRoute.name}` : ""}
      </div>

      {!selectedRoute ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Durak yonetimi icin listeden bir rota sec.
        </div>
      ) : (
        <div className="space-y-3">
          {!canMutate ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Bu rolde durak ekleme/siralama/silme kapali.
            </div>
          ) : (
            <div className="grid gap-2 lg:grid-cols-[1fr_1.2fr_130px]">
              <label className="space-y-1 text-xs font-semibold text-slate-700">
                <span>Durak adi (istege bagli)</span>
                <input
                  type="text"
                  value={stopName}
                  onChange={(event) => onSetStopName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }
                    event.preventDefault();
                    onAddStop();
                  }}
                  maxLength={80}
                  placeholder="Ornek: Levent Metro cikisi"
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm font-normal text-slate-900"
                />
              </label>
              <AddressAutocompleteInput
                label="Durak adresi"
                value={stopAddressQuery}
                placeholder="Ornek: Kadikoy Iskele"
                maxLength={256}
                selectedSuggestion={stopAddressSuggestion}
                required
                onValueChange={onSetStopAddressQuery}
                onSelectSuggestion={onSelectStopAddressSuggestion}
                onEnterPressed={onAddStop}
              />
              <button
                type="button"
                onClick={onAddStop}
                disabled={!canAddStop}
                className="glass-button-primary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {stopActionPending ? "Ekleniyor..." : "Durak Ekle"}
              </button>
            </div>
          )}

          {canMutate ? (
            <div className="rounded-xl border border-dashed border-line bg-slate-50 p-2 text-xs text-muted">
              Sira otomatik verilir. Durak kartlarini surukleyip birakarak sirayi degistirebilirsiniz.
            </div>
          ) : null}

          {loadingStops ? (
            <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
              Duraklar yukleniyor...
            </div>
          ) : sortedRouteStops.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
              Bu rota icin durak yok.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRouteStops.map((stop, index) => (
                <article
                  key={stop.stopId}
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
                  className={`grid gap-2 rounded-xl border border-line p-3 lg:grid-cols-[70px_1fr_1fr_90px_90px_130px] ${
                    draggedStopId === stop.stopId ? "opacity-75" : ""
                  }`}
                >
                  <div className="glass-panel-muted rounded-xl px-3 py-2 text-sm font-semibold text-slate-900">
                    {stop.order}
                  </div>
                  <div className="glass-input rounded-xl px-3 py-2 text-sm text-slate-900">
                    {stop.name}
                  </div>
                  <div className="glass-input rounded-xl px-3 py-2 text-xs text-slate-700">
                    Konum kaydi hazir
                  </div>
                  {canMutate ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onMoveStop(stop.stopId, "up")}
                        disabled={
                          index === 0 ||
                          movingStopId !== null ||
                          deletingStopId === stop.stopId ||
                          stopActionPending
                        }
                        className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {movingStopId === stop.stopId ? "Tasiniyor..." : "Yukari"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveStop(stop.stopId, "down")}
                        disabled={
                          index === sortedRouteStops.length - 1 ||
                          movingStopId !== null ||
                          deletingStopId === stop.stopId ||
                          stopActionPending
                        }
                        className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {movingStopId === stop.stopId ? "Tasiniyor..." : "Asagi"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStop(stop.stopId)}
                        disabled={deletingStopId === stop.stopId || movingStopId !== null}
                        className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingStopId === stop.stopId ? "Siliniyor..." : "Sil"}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-xs text-slate-500 lg:col-span-3">
                      Bu rolde durak aksiyonlari kapali (salt okuma).
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
