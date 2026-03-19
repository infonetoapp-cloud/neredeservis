"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { CompanyRouteItem } from "@/features/company/company-client";

import type { RouteDraft, RouteTimeSlotOption } from "./routes-management-types";

type RouteFilter = "active" | "archived" | "all";

type RouteReadinessState = {
  label: string;
  className: string;
};

type Props = {
  routes: CompanyRouteItem[] | null;
  sortedRoutes: CompanyRouteItem[];
  selectedRouteId: string | null;
  canMutate: boolean;
  drafts: Record<string, RouteDraft>;
  setDrafts: Dispatch<SetStateAction<Record<string, RouteDraft>>>;
  savingRouteId: string | null;
  archivingRouteId: string | null;
  deletingRouteId: string | null;
  routeDriverNames: Record<string, string>;
  errorMessage: string | null;
  timeSlotOptions: RouteTimeSlotOption[];
  onRefresh: () => void;
  onSaveRoute: (routeId: string) => void;
  onSelectRoute: (routeId: string) => void;
  onToggleArchiveRoute: (routeId: string, nextArchived: boolean) => void;
  onDeleteRoute: (routeId: string) => void;
  onStartCreateRoute: () => void;
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

function softAddress(value: string | null): string {
  return value && value.trim().length > 0 ? value : "Henüz nokta seçilmedi";
}

function formatTimeSlot(value: RouteTimeSlotOption | null): string {
  switch (value) {
    case "morning":
      return "Sabah";
    case "midday":
      return "Öğlen";
    case "evening":
      return "Akşam";
    case "custom":
      return "Özel";
    default:
      return "Belirtilmedi";
  }
}

function getRouteReadinessState(route: CompanyRouteItem): RouteReadinessState {
  const hasDriver = Boolean(route.driverId);
  const hasVehicle = Boolean(route.vehicleId || route.vehiclePlate);

  if (hasDriver && hasVehicle) {
    return {
      label: "Hazır",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (!hasDriver && !hasVehicle) {
    return {
      label: "Şoför ve araç bekliyor",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  if (!hasDriver) {
    return {
      label: "Şoför bekliyor",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    label: "Araç bekliyor",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

function buildRouteSearchIndex(route: CompanyRouteItem): string {
  return [
    route.name,
    route.startAddress ?? "",
    route.endAddress ?? "",
    route.vehiclePlate ?? "",
    route.scheduledTime ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase("tr");
}

export function RouteListSection({
  routes,
  sortedRoutes,
  selectedRouteId,
  canMutate,
  drafts,
  setDrafts,
  savingRouteId,
  archivingRouteId,
  deletingRouteId,
  routeDriverNames,
  errorMessage,
  timeSlotOptions,
  onRefresh,
  onSaveRoute,
  onSelectRoute,
  onToggleArchiveRoute,
  onDeleteRoute,
  onStartCreateRoute,
}: Props) {
  const [filter, setFilter] = useState<RouteFilter>("active");
  const [query, setQuery] = useState("");
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  const activeCount = useMemo(
    () => sortedRoutes.filter((route) => !route.isArchived).length,
    [sortedRoutes],
  );
  const archivedCount = useMemo(
    () => sortedRoutes.filter((route) => route.isArchived).length,
    [sortedRoutes],
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("tr");

  const visibleRoutes = useMemo(() => {
    return sortedRoutes.filter((route) => {
      if (filter === "active" && route.isArchived) {
        return false;
      }
      if (filter === "archived" && !route.isArchived) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return buildRouteSearchIndex(route).includes(normalizedQuery);
    });
  }, [filter, normalizedQuery, sortedRoutes]);

  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Rota merkezi</div>
          <p className="mt-1 text-xs text-muted">
            Rotaları aktif ve arşiv olarak ayır. Seç, düzenle ve gerektiğinde kalıcı olarak sil.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold"
        >
          Yenile
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "active" as const, label: "Aktif", count: activeCount },
            { id: "archived" as const, label: "Arşiv", count: archivedCount },
            { id: "all" as const, label: "Tümü", count: sortedRoutes.length },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === item.id
                  ? "border-[#b7ccc2] bg-[#e8f1ec] text-[#285849]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{item.label}</span>
              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">{item.count}</span>
            </button>
          ))}
        </div>

        <label className="w-full xl:max-w-[240px]">
          <span className="sr-only">Rota ara</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rota veya adres ara"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      {!routes ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 p-4 text-xs text-muted">
          Rotalar yükleniyor...
        </div>
      ) : visibleRoutes.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-slate-50 p-5 text-sm text-slate-600">
          <div className="font-semibold text-slate-900">
            {sortedRoutes.length === 0
              ? "Bu şirkete bağlı rota bulunmuyor."
              : filter === "archived"
                ? "Arşivde rota görünmüyor."
                : "Bu filtrede rota bulunamadı."}
          </div>
          <p className="mt-1 text-xs text-muted">
            {sortedRoutes.length === 0
              ? "İlk rotayı oluşturduğunda durak yönetimi ve harita akışı buradan açılır."
              : "Farklı filtre seç veya arama metnini temizle."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sortedRoutes.length === 0 ? (
              <button
                type="button"
                onClick={onStartCreateRoute}
                className="glass-button-primary rounded-xl px-3 py-2 text-xs font-semibold"
              >
                İlk rotayı oluştur
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="glass-button rounded-xl px-3 py-2 text-xs font-semibold"
              >
                Filtreyi temizle
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {visibleRoutes.map((route) => {
            const draft = readDraft(route, drafts);
            const isSelected = selectedRouteId === route.routeId;
            const isEditing = editingRouteId === route.routeId;
            const isSaving = savingRouteId === route.routeId;
            const isArchiving = archivingRouteId === route.routeId;
            const isDeleting = deletingRouteId === route.routeId;
            const driverName = routeDriverNames[route.routeId] ?? null;
            const readiness = getRouteReadinessState(route);

            return (
              <article
                key={route.routeId}
                className={`rounded-[24px] border bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] transition ${
                  isSelected
                    ? "border-[#a9c8b5] ring-2 ring-[#e2f0e8]"
                    : "border-line hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectRoute(route.routeId)}
                        className="text-left text-base font-semibold text-slate-900 hover:text-slate-700"
                      >
                        {route.name}
                      </button>
                      {isSelected ? (
                        <span className="rounded-full border border-[#cde6df] bg-[#edf9f6] px-2 py-0.5 text-[10px] font-semibold text-[#186355]">
                          Açık
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          route.isArchived
                            ? "border-slate-300 bg-slate-100 text-slate-600"
                            : "border-[#d8e5f3] bg-[#f6f9ff] text-[#49627e]"
                        }`}
                      >
                        {route.isArchived ? "Arşiv" : "Aktif rota"}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${readiness.className}`}
                      >
                        {readiness.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        Saat {route.scheduledTime ?? "-"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {formatTimeSlot(route.timeSlot)}
                      </span>
                      {driverName ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          Şoför {driverName}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        Yolcu {route.passengerCount}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          route.allowGuestTracking
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        Misafir takip {route.allowGuestTracking ? "açık" : "kapalı"}
                      </span>
                      {route.vehiclePlate ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          Araç {route.vehiclePlate}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectRoute(route.routeId)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        isSelected
                          ? "border-[#b7ccc2] bg-[#e8f1ec] text-[#285849]"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected ? "Detay açık" : "Detayı aç"}
                    </button>

                    {canMutate ? (
                      <button
                        type="button"
                        onClick={() => setEditingRouteId((prev) => (prev === route.routeId ? null : route.routeId))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {isEditing ? "Düzenlemeyi kapat" : "Hızlı düzenle"}
                      </button>
                    ) : null}

                    {canMutate ? (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onDeleteRoute(route.routeId)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? "Siliniyor..." : "Sil"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                      Başlangıç
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-700">{softAddress(route.startAddress)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Bitiş</div>
                    <div className="mt-1 text-xs leading-5 text-slate-700">{softAddress(route.endAddress)}</div>
                  </div>
                </div>

                {canMutate && isEditing ? (
                  <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50/90 p-4">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_140px]">
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                          Rota adı
                        </span>
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
                      </label>

                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                          Çıkış
                        </span>
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
                      </label>

                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                          Zaman dilimi
                        </span>
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
                              {formatTimeSlot(slot)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
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
                        Misafir takip açık
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
                        Arşive taşı
                      </label>

                      <button
                        type="button"
                        disabled={isArchiving}
                        onClick={() => onToggleArchiveRoute(route.routeId, !route.isArchived)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          route.isArchived
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {isArchiving
                          ? route.isArchived
                            ? "Aktife alınıyor..."
                            : "Arşivleniyor..."
                          : route.isArchived
                            ? "Arşivden çıkar"
                            : "Arşive taşı"}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSaveRoute(route.routeId)}
                        disabled={isSaving}
                        className="glass-button-primary rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRouteId(null)}
                        className="glass-button rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
