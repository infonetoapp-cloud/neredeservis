"use client";

import { DragEvent as ReactDragEvent } from "react";

import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";
import type { CompanyRouteStopSummary } from "@/features/company/company-types";

type StopsLoadStatus = "idle" | "loading" | "success" | "error";

type Props = {
  status: StopsLoadStatus;
  error: unknown;
  stops: readonly CompanyRouteStopSummary[];
  pending: boolean;
  structuralLocked: boolean;
  draggingStopId: string | null;
  dragOverStopId: string | null;
  onRetry: () => void;
  onDragStart: (event: ReactDragEvent<HTMLDivElement>, stopId: string) => void;
  onDragOver: (event: ReactDragEvent<HTMLDivElement>, stopId: string) => void;
  onDrop: (event: ReactDragEvent<HTMLDivElement>, stopId: string) => void;
  onDragEnd: () => void;
  onMoveUp: (stop: CompanyRouteStopSummary) => void;
  onMoveDown: (stop: CompanyRouteStopSummary) => void;
  onMoveTop: (stop: CompanyRouteStopSummary) => void;
  onMoveBottom: (stop: CompanyRouteStopSummary) => void;
  onEdit: (stop: CompanyRouteStopSummary) => void;
  onDelete: (stop: CompanyRouteStopSummary) => void;
};

export function RouteStopsListSection({
  status,
  error,
  stops,
  pending,
  structuralLocked,
  draggingStopId,
  dragOverStopId,
  onRetry,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  onMoveBottom,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="space-y-2 rounded-xl border border-line bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-800">Durak Listesi</div>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {status}
        </span>
      </div>

      {status === "loading" ? (
        <p className="text-xs text-slate-500">Duraklar yukleniyor...</p>
      ) : status === "error" ? (
        <div className="space-y-2">
          <p className="text-xs text-rose-700">{mapCompanyCallableErrorToMessage(error)}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
          >
            Tekrar Dene
          </button>
        </div>
      ) : stops.length === 0 ? (
        <p className="text-xs text-slate-500">
          Henuz durak yok. Asagidaki form ile ilk duragi ekleyebilirsin.
        </p>
      ) : (
        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div
              key={stop.stopId}
              draggable={!pending && !structuralLocked}
              onDragStart={(event) => onDragStart(event, stop.stopId)}
              onDragOver={(event) => onDragOver(event, stop.stopId)}
              onDrop={(event) => onDrop(event, stop.stopId)}
              onDragEnd={onDragEnd}
              className={`flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 transition ${
                dragOverStopId === stop.stopId && draggingStopId !== stop.stopId
                  ? "border-brand-300 ring-2 ring-brand-100"
                  : "border-line"
              } ${pending || structuralLocked ? "cursor-default" : "cursor-move"}`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">
                  #{stop.order} - {stop.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {stop.location.lat.toFixed(5)}, {stop.location.lng.toFixed(5)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="rounded-md border border-line bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500"
                  title="Tutup tasiyin"
                >
                  SURUKLE
                </span>
                <button
                  type="button"
                  disabled={pending || structuralLocked || index === 0}
                  onClick={() => onMoveTop(stop)}
                  className="inline-flex items-center rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="En uste tasi"
                >
                  Basa
                </button>
                <button
                  type="button"
                  disabled={pending || structuralLocked || index === 0}
                  onClick={() => onMoveUp(stop)}
                  className="inline-flex items-center rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Yukari tasi"
                >
                  Yukari
                </button>
                <button
                  type="button"
                  disabled={pending || structuralLocked || index === stops.length - 1}
                  onClick={() => onMoveDown(stop)}
                  className="inline-flex items-center rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Asagi tasi"
                >
                  Asagi
                </button>
                <button
                  type="button"
                  disabled={pending || structuralLocked || index === stops.length - 1}
                  onClick={() => onMoveBottom(stop)}
                  className="inline-flex items-center rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="En alta tasi"
                >
                  Sona
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(stop)}
                  className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Duzenle
                </button>
                <button
                  type="button"
                  disabled={pending || structuralLocked}
                  onClick={() => onDelete(stop)}
                  className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
