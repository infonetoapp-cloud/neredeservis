"use client";

import { useState, useMemo, useEffect } from "react";

import type {
  CompanyDriverItem,
  CompanyRouteItem,
  CompanyVehicleItem,
} from "@/features/company/company-client-shared";

import {
  type DriverStatus,
  DRIVER_STATUS_OPTIONS,
  driverStatusBadgeClass,
  driverStatusLabel,
  formatDateTime,
} from "./driver-ui-helpers";

type Props = {
  driver: CompanyDriverItem | null;
  routes: CompanyRouteItem[];
  vehicles: CompanyVehicleItem[];
  canMutate: boolean;
  actionKey: string | null;
  onStatusChange: (driverId: string, status: DriverStatus) => Promise<void>;
  onAssign: (driverId: string, routeId: string) => Promise<void>;
  onUnassign: (driverId: string, routeId: string) => Promise<void>;
};

export function DriverDetailPanel({
  driver,
  routes,
  vehicles,
  canMutate,
  actionKey,
  onStatusChange,
  onAssign,
  onUnassign,
}: Props) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  const assignableRoutes = useMemo(() => {
    if (!driver) return [];
    const assignedIds = new Set(driver.assignedRoutes.map((r) => r.routeId));
    return routes.filter((r) => !r.isArchived && !assignedIds.has(r.routeId));
  }, [driver, routes]);

  const linkedVehicles = useMemo(() => {
    if (!driver) return [];
    const assignedRouteIds = new Set(driver.assignedRoutes.map((r) => r.routeId));
    const vehicleIds = new Set(
      routes
        .filter((r) => !r.isArchived && assignedRouteIds.has(r.routeId) && r.vehicleId)
        .map((r) => r.vehicleId as string),
    );
    if (vehicleIds.size === 0) return [];
    return vehicles.filter((v) => vehicleIds.has(v.vehicleId));
  }, [driver, routes, vehicles]);

  // Auto-select first assignable route
  useEffect(() => {
    if (!selectedRouteId || !assignableRoutes.some((r) => r.routeId === selectedRouteId)) {
      setSelectedRouteId(assignableRoutes[0]?.routeId ?? "");
    }
  }, [assignableRoutes, selectedRouteId]);

  if (!driver) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400">
        Detay için sol listeden bir şoför seçin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="text-base font-semibold text-slate-900">{driver.name}</div>
          <span className={driverStatusBadgeClass(driver.status)}>
            {driverStatusLabel(driver.status)}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-400" title={driver.driverId}>
          Şoför kodu: {driver.driverId}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Son görülme: {formatDateTime(driver.lastSeenAt)}
        </div>
        {driver.phoneMasked && (
          <div className="mt-0.5 text-xs text-slate-500">Tel: {driver.phoneMasked}</div>
        )}
        {driver.plateMasked && (
          <div className="mt-0.5 text-xs text-slate-500">Plaka: {driver.plateMasked}</div>
        )}
      </div>

      {/* Status control */}
      {canMutate && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Durum
          </div>
          <div className="flex gap-1.5">
            {DRIVER_STATUS_OPTIONS.map((opt) => {
              const isCurrent = driver.status === opt.value;
              const isUpdating = actionKey === `status:${driver.driverId}`;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isCurrent || isUpdating}
                  onClick={() => onStatusChange(driver.driverId, opt.value)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isCurrent
                      ? opt.value === "active"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  } disabled:cursor-not-allowed`}
                >
                  {isUpdating && !isCurrent ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  ) : (
                    opt.label
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Assigned routes */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Atanmış rotalar ({driver.assignedRoutes.length})
        </div>
        {driver.assignedRoutes.length === 0 ? (
          <div className="text-xs text-slate-400">Bu şoför için aktif rota ataması yok.</div>
        ) : (
          <div className="space-y-1.5">
            {driver.assignedRoutes.map((route) => {
              const isUnassigning = actionKey === `unassign:${driver.driverId}:${route.routeId}`;
              return (
                <div
                  key={route.routeId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{route.routeName}</div>
                    <div className="text-[11px] text-slate-400">
                      Saat: {route.scheduledTime ?? "Bilgi yok"}
                    </div>
                  </div>
                  {canMutate && (
                    <button
                      type="button"
                      onClick={() => onUnassign(driver.driverId, route.routeId)}
                      disabled={isUnassigning}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUnassigning ? "Kaldırılıyor..." : "Kaldır"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Linked vehicles */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Bağlı araçlar ({linkedVehicles.length})
        </div>
        {linkedVehicles.length === 0 ? (
          <div className="text-xs text-slate-400">Bu şoförün rotalarına bağlı araç yok.</div>
        ) : (
          <div className="space-y-1.5">
            {linkedVehicles.map((vehicle) => (
              <div
                key={vehicle.vehicleId}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800">{vehicle.plate}</div>
                  <div className="text-[11px] text-slate-400">
                    {vehicle.label ?? "Etiket yok"}
                    {vehicle.capacity ? ` · ${vehicle.capacity} kişi` : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    vehicle.isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-500"
                  }`}
                >
                  {vehicle.isActive ? "Aktif" : "Pasif"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route assignment */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Rota ata
        </div>
        {canMutate ? (
          <div className="space-y-2">
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {assignableRoutes.length === 0 && <option value="">Uygun rota yok</option>}
              {assignableRoutes.map((r) => (
                <option key={r.routeId} value={r.routeId}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (selectedRouteId) void onAssign(driver.driverId, selectedRouteId);
              }}
              disabled={
                !selectedRouteId ||
                assignableRoutes.length === 0 ||
                actionKey === `assign:${driver.driverId}`
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionKey === `assign:${driver.driverId}` ? (
                <>
                  <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Atanıyor...
                </>
              ) : (
                "Seçili rotaya ata"
              )}
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Rota atama aksiyonları bu rolde kapalı (salt okuma).
          </div>
        )}
      </div>
    </div>
  );
}
