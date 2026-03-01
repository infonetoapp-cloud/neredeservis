"use client";

import type { Dispatch, SetStateAction } from "react";

import type { CompanyRouteItem } from "@/features/company/company-client";

import type { RouteDraft, RouteTimeSlotOption } from "./routes-management-types";

type Props = {
  routes: CompanyRouteItem[] | null;
  sortedRoutes: CompanyRouteItem[];
  selectedRouteId: string | null;
  canMutate: boolean;
  drafts: Record<string, RouteDraft>;
  setDrafts: Dispatch<SetStateAction<Record<string, RouteDraft>>>;
  savingRouteId: string | null;
  errorMessage: string | null;
  timeSlotOptions: RouteTimeSlotOption[];
  onRefresh: () => void;
  onSaveRoute: (routeId: string) => void;
  onSelectRoute: (routeId: string) => void;
};

function readDraft(route: CompanyRouteItem, drafts: Record<string, RouteDraft>): RouteDraft {
  return (
    drafts[route.routeId] ?? {
      name: route.name,
      scheduledTime: route.scheduledTime ?? "08:00",
      timeSlot: route.timeSlot ?? "custom",
      allowGuestTracking: route.allowGuestTracking,
      isArchived: route.isArchived,
    }
  );
}

export function RouteListSection({
  routes,
  sortedRoutes,
  selectedRouteId,
  canMutate,
  drafts,
  setDrafts,
  savingRouteId,
  errorMessage,
  timeSlotOptions,
  onRefresh,
  onSaveRoute,
  onSelectRoute,
}: Props) {
  const timeSlotLabels: Record<RouteTimeSlotOption, string> = {
    morning: "Sabah",
    midday: "Oglen",
    evening: "Aksam",
    custom: "Ozel",
  };

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Rota listesi</div>
        <button
          type="button"
          onClick={onRefresh}
          className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold"
        >
          Yenile
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      {!routes ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Rotalar yukleniyor...
        </div>
      ) : sortedRoutes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Bu sirkete bagli rota bulunmuyor.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRoutes.map((route) => {
            const draft = readDraft(route, drafts);

            return (
              <article
                key={route.routeId}
                className={`grid gap-2 rounded-xl border border-line p-3 ${
                  canMutate
                    ? "lg:grid-cols-[1fr_120px_120px_140px_120px_120px_120px]"
                    : "lg:grid-cols-[1fr_160px_140px_120px_120px]"
                }`}
              >
                {canMutate ? (
                  <>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [route.routeId]: {
                            ...readDraft(route, prev),
                            name: event.target.value,
                          },
                        }))
                      }
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="time"
                      value={draft.scheduledTime}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [route.routeId]: {
                            ...readDraft(route, prev),
                            scheduledTime: event.target.value,
                          },
                        }))
                      }
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                    />
                    <select
                      value={draft.timeSlot}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [route.routeId]: {
                            ...readDraft(route, prev),
                            timeSlot: event.target.value as RouteTimeSlotOption,
                          },
                        }))
                      }
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                    >
                      {timeSlotOptions.map((slot) => (
                        <option key={slot} value={slot}>
                          {timeSlotLabels[slot]}
                        </option>
                      ))}
                    </select>
                    <label className="glass-input inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900">
                      <input
                        type="checkbox"
                        checked={draft.allowGuestTracking}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [route.routeId]: {
                              ...readDraft(route, prev),
                              allowGuestTracking: event.target.checked,
                            },
                          }))
                        }
                      />
                      Misafir takip
                    </label>
                    <label className="glass-input inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900">
                      <input
                        type="checkbox"
                        checked={draft.isArchived}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [route.routeId]: {
                              ...readDraft(route, prev),
                              isArchived: event.target.checked,
                            },
                          }))
                        }
                      />
                      Arsiv
                    </label>
                    <button
                      type="button"
                      onClick={() => onSaveRoute(route.routeId)}
                      disabled={savingRouteId === route.routeId}
                      className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingRouteId === route.routeId ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="glass-input rounded-xl px-3 py-2 text-sm font-semibold text-slate-900">
                      {route.name}
                    </div>
                    <div className="glass-input rounded-xl px-3 py-2 text-sm text-slate-700">
                      {route.scheduledTime ?? "-"} |{" "}
                      {route.timeSlot ? timeSlotLabels[route.timeSlot] : "-"}
                    </div>
                    <div
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        route.allowGuestTracking
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      Misafir takip: {route.allowGuestTracking ? "acik" : "kapali"}
                    </div>
                    <div
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        route.isArchived
                          ? "border-slate-300 bg-slate-100 text-slate-600"
                          : "border-[#b7ccc2] bg-[#e8f1ec] text-[#285849]"
                      }`}
                    >
                      {route.isArchived ? "arsiv" : "aktif"}
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onSelectRoute(route.routeId)}
                  className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold ${
                    selectedRouteId === route.routeId
                      ? "border-[#b7ccc2] bg-[#e8f1ec] text-[#285849]"
                      : "border-line bg-white/70 text-slate-900 hover:bg-white"
                  }`}
                >
                  Duraklari ac
                </button>
                <div className="text-xs text-[#607080] lg:col-span-full">
                  Gidis: {route.startAddress ?? "BULUNAMADI"} | Donus: {route.endAddress ?? "BULUNAMADI"}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
