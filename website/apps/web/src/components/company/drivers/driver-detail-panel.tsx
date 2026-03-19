"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  formatCredentialCopyText,
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

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50";

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
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const assignableRoutes = useMemo(() => {
    if (!driver) {
      return [];
    }
    const assignedRouteIds = new Set(driver.assignedRoutes.map((route) => route.routeId));
    return routes.filter((route) => !route.isArchived && !route.driverId && !assignedRouteIds.has(route.routeId));
  }, [driver, routes]);

  const linkedVehicles = useMemo(() => {
    if (!driver) {
      return [];
    }
    const assignedRouteIds = new Set(driver.assignedRoutes.map((route) => route.routeId));
    const vehicleIds = new Set(
      routes
        .filter((route) => !route.isArchived && assignedRouteIds.has(route.routeId) && route.vehicleId)
        .map((route) => route.vehicleId as string),
    );
    if (vehicleIds.size === 0) {
      return [];
    }
    return vehicles.filter((vehicle) => vehicleIds.has(vehicle.vehicleId));
  }, [driver, routes, vehicles]);

  const profileIssues = useMemo(() => {
    if (!driver) {
      return [];
    }

    const issues: string[] = [];
    if (!driver.phoneMasked) {
      issues.push("Telefon eklenmeli");
    }
    if (!driver.plateMasked) {
      issues.push("Plaka eklenmeli");
    }
    if (driver.assignedRoutes.length === 0) {
      issues.push("Atama bekliyor");
    }
    return issues;
  }, [driver]);

  const credentialBundle =
    driver && driver.loginEmail && driver.temporaryPassword
      ? {
          loginEmail: driver.loginEmail,
          temporaryPassword: driver.temporaryPassword,
        }
      : null;

  useEffect(() => {
    if (!selectedRouteId || !assignableRoutes.some((route) => route.routeId === selectedRouteId)) {
      setSelectedRouteId(assignableRoutes[0]?.routeId ?? "");
    }
  }, [assignableRoutes, selectedRouteId]);

  useEffect(() => {
    setCopyMessage(null);
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, [driver?.driverId]);

  const copyToClipboard = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => setCopyMessage(null), 3000);
    } catch {
      setCopyMessage("Kopyalama başarısız oldu.");
    }
  };

  if (!driver) {
    return (
      <div className="flex h-full min-h-[480px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-700">Şoför detayı</p>
          <p className="mt-1 text-sm text-slate-500">Soldaki listeden bir şoför seç. Profil, mobil giriş ve atama akışı burada açılır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_42%),linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#eef4ff_100%)] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{driver.name}</h2>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${driverStatusBadgeClass(driver.status)}`}>
            {driverStatusLabel(driver.status)}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-400" title={driver.driverId}>
          Şoför kodu: {driver.driverId}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
            {driver.phoneMasked ? `Tel: ${driver.phoneMasked}` : "Telefon yok"}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
            {driver.plateMasked ? `Plaka: ${driver.plateMasked}` : "Plaka yok"}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
            Son hareket: {formatDateTime(driver.lastSeenAt)}
          </span>
        </div>

        {profileIssues.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {profileIssues.map((issue) => (
              <span
                key={`${driver.driverId}:${issue}`}
                className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100"
              >
                {issue}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mobil şoför girişi</div>
            <p className="mt-1 text-xs text-slate-500">Bu bilgiler yalnızca mobil şoför girişinde kullanılır. Şirket panelinde geçerli değildir.</p>
          </div>
          {credentialBundle ? (
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  formatCredentialCopyText({
                    name: driver.name,
                    loginEmail: credentialBundle.loginEmail,
                    temporaryPassword: credentialBundle.temporaryPassword,
                  }),
                  "Mobil giriş bilgileri kopyalandı.",
                )
              }
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-white"
            >
              Tümünü kopyala
            </button>
          ) : null}
        </div>

        {credentialBundle ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Giriş e-postası</div>
                <div className="mt-2 break-all text-sm font-semibold text-slate-900">{credentialBundle.loginEmail}</div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentialBundle.loginEmail, "E-posta kopyalandı.")}
                  className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  E-postayı kopyala
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Geçici şifre</div>
                <div className="mt-2 break-all text-sm font-semibold text-slate-900">{credentialBundle.temporaryPassword}</div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentialBundle.temporaryPassword, "Şifre kopyalandı.")}
                  className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Şifreyi kopyala
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Hesap oluşturulurken otomatik üretildi. Gerekirse şoförle yalnızca mobil uygulama için paylaş.
            </div>
            {copyMessage ? <div className="text-xs font-medium text-emerald-700">{copyMessage}</div> : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Bu şoför için saklanan mobil giriş bilgisi yok. Yeni oluşturulan şoförlerde burada otomatik görünür.
          </div>
        )}
      </div>

      {canMutate ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Durum</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {DRIVER_STATUS_OPTIONS.map((option) => {
              const isCurrent = driver.status === option.value;
              const isUpdating = actionKey === `status:${driver.driverId}`;
              const activeClass =
                option.value === "active"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                  : "border-slate-300 bg-slate-100 text-slate-700 ring-1 ring-slate-200";

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isCurrent || isUpdating}
                  onClick={() => onStatusChange(driver.driverId, option.value)}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    isCurrent
                      ? activeClass
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  } disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2">
                    {isUpdating && !isCurrent ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          option.value === "active" ? "bg-emerald-500" : "bg-slate-500"
                        }`}
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                  <div className="mt-1 text-xs opacity-75">
                    {option.value === "active" ? "Mobil giriş ve atamalarda kullanılabilir" : "Mobil girişleri kapatılır"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Atanmış rotalar ({driver.assignedRoutes.length})
        </div>
        {driver.assignedRoutes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Bu şoför için aktif rota ataması yok.
          </div>
        ) : (
          <div className="space-y-2">
            {driver.assignedRoutes.map((route) => {
              const isUnassigning = actionKey === `unassign:${driver.driverId}:${route.routeId}`;
              return (
                <div
                  key={route.routeId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">{route.routeName}</div>
                    <div className="text-xs text-slate-500">Saat: {route.scheduledTime ?? "Bilgi yok"}</div>
                  </div>
                  {canMutate ? (
                    <button
                      type="button"
                      onClick={() => onUnassign(driver.driverId, route.routeId)}
                      disabled={isUnassigning}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUnassigning ? "Kaldırılıyor..." : "Kaldır"}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Bağlı araçlar ({linkedVehicles.length})
        </div>
        {linkedVehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Bu şoförün rotalarına bağlı araç yok.
          </div>
        ) : (
          <div className="space-y-2">
            {linkedVehicles.map((vehicle) => (
              <div
                key={vehicle.vehicleId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{vehicle.plate}</div>
                  <div className="text-xs text-slate-500">
                    {vehicle.label ?? "Etiket yok"}
                    {vehicle.capacity ? ` • ${vehicle.capacity} kişi` : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
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

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Atama merkezi</div>
          <p className="mt-1 text-xs text-slate-500">Şoförü ve rotayı bağımsız oluştur. Eşleştirmeyi bu alandan tek adımda yap.</p>
        </div>
        {canMutate ? (
          assignableRoutes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Şoför bekleyen rota yok. Önce yeni rota oluşturabilir ya da başka bir rotadan sürücüyü kaldırabilirsin.
            </div>
          ) : (
            <div className="space-y-3">
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Şoför bekleyen rotalar</span>
                <select
                  value={selectedRouteId}
                  onChange={(event) => setSelectedRouteId(event.target.value)}
                  className={inputClassName}
                >
                  {assignableRoutes.map((route) => (
                    <option key={route.routeId} value={route.routeId}>
                      {route.name}
                      {route.scheduledTime ? ` • ${route.scheduledTime}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedRouteId) {
                    void onAssign(driver.driverId, selectedRouteId);
                  }
                }}
                disabled={!selectedRouteId || actionKey === `assign:${driver.driverId}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionKey === `assign:${driver.driverId}` ? (
                  <>
                    <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Atanıyor...
                  </>
                ) : (
                  "Seçili rotaya ata"
                )}
              </button>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Rota atama aksiyonları bu rolde kapalı.
          </div>
        )}
      </div>
    </div>
  );
}
