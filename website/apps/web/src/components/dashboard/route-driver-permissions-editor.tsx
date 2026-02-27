"use client";

import { useEffect, useMemo, useState } from "react";

import {
  grantDriverRoutePermissionsCallable,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callables";
import type {
  CompanyMemberSummary,
  RouteDriverPermissionFlags,
  RouteDriverPermissionSummary,
} from "@/features/company/company-types";

type LoadStatus = "idle" | "loading" | "success" | "error";

type Props = {
  companyId: string | null;
  routeId: string | null;
  initialDriverUid?: string | null;
  members: readonly CompanyMemberSummary[];
  routePermissions: readonly RouteDriverPermissionSummary[];
  routePermissionsLoadStatus: LoadStatus;
  onUpdated: () => Promise<void> | void;
};

const DEFAULT_ROUTE_DRIVER_PERMISSIONS: RouteDriverPermissionFlags = {
  canStartFinishTrip: true,
  canSendAnnouncements: true,
  canViewPassengerList: true,
  canEditAssignedRouteMeta: false,
  canEditStops: false,
  canManageRouteSchedule: false,
};

const PERMISSION_ROWS: Array<{ key: keyof RouteDriverPermissionFlags; label: string }> = [
  { key: "canStartFinishTrip", label: "Sefer Baslat / Bitir" },
  { key: "canSendAnnouncements", label: "Duyuru Gonderebilir" },
  { key: "canViewPassengerList", label: "Yolcu Listesi Gorebilir" },
  { key: "canEditAssignedRouteMeta", label: "Rota Metasi Duzenleyebilir" },
  { key: "canEditStops", label: "Durak Duzenleyebilir" },
  { key: "canManageRouteSchedule", label: "Saat / Takvim Yonetebilir" },
];

function toPermissionFlags(value: unknown): RouteDriverPermissionFlags {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_ROUTE_DRIVER_PERMISSIONS };
  }
  const source = value as Partial<RouteDriverPermissionFlags>;
  return {
    canStartFinishTrip:
      typeof source.canStartFinishTrip === "boolean"
        ? source.canStartFinishTrip
        : DEFAULT_ROUTE_DRIVER_PERMISSIONS.canStartFinishTrip,
    canSendAnnouncements:
      typeof source.canSendAnnouncements === "boolean"
        ? source.canSendAnnouncements
        : DEFAULT_ROUTE_DRIVER_PERMISSIONS.canSendAnnouncements,
    canViewPassengerList:
      typeof source.canViewPassengerList === "boolean"
        ? source.canViewPassengerList
        : DEFAULT_ROUTE_DRIVER_PERMISSIONS.canViewPassengerList,
    canEditAssignedRouteMeta:
      typeof source.canEditAssignedRouteMeta === "boolean"
        ? source.canEditAssignedRouteMeta
        : DEFAULT_ROUTE_DRIVER_PERMISSIONS.canEditAssignedRouteMeta,
    canEditStops:
      typeof source.canEditStops === "boolean"
        ? source.canEditStops
        : DEFAULT_ROUTE_DRIVER_PERMISSIONS.canEditStops,
    canManageRouteSchedule:
      typeof source.canManageRouteSchedule === "boolean"
        ? source.canManageRouteSchedule
        : DEFAULT_ROUTE_DRIVER_PERMISSIONS.canManageRouteSchedule,
  };
}

function permissionEquals(left: RouteDriverPermissionFlags, right: RouteDriverPermissionFlags): boolean {
  return PERMISSION_ROWS.every(({ key }) => left[key] === right[key]);
}

export function RouteDriverPermissionsEditor({
  companyId,
  routeId,
  initialDriverUid,
  members,
  routePermissions,
  routePermissionsLoadStatus,
  onUpdated,
}: Props) {
  const [selectedDriverUid, setSelectedDriverUid] = useState<string | null>(
    () => initialDriverUid ?? null,
  );
  const [form, setForm] = useState<RouteDriverPermissionFlags | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const permissionMap = useMemo(
    () => new Map(routePermissions.map((item) => [item.driverUid, item])),
    [routePermissions],
  );

  useEffect(() => {
    if (members.length === 0) {
      setSelectedDriverUid(null);
      setForm(null);
      setError(null);
      setSuccessMessage(null);
      return;
    }
    const hasSelected = selectedDriverUid ? members.some((member) => member.uid === selectedDriverUid) : false;
    const nextUid = hasSelected ? selectedDriverUid : members[0]?.uid ?? null;
    if (!nextUid) {
      setSelectedDriverUid(null);
      setForm(null);
      return;
    }
    setSelectedDriverUid(nextUid);
    const nextPermissions = toPermissionFlags(permissionMap.get(nextUid)?.permissions);
    setForm(nextPermissions);
    setError(null);
    setSuccessMessage(null);
  }, [members, permissionMap, selectedDriverUid]);

  const baselinePermissions = useMemo(() => {
    if (!selectedDriverUid) return null;
    return toPermissionFlags(permissionMap.get(selectedDriverUid)?.permissions);
  }, [permissionMap, selectedDriverUid]);

  const canSubmit =
    Boolean(companyId) &&
    Boolean(routeId) &&
    Boolean(selectedDriverUid) &&
    Boolean(form) &&
    routePermissionsLoadStatus === "success" &&
    !pending;

  const hasChanges = Boolean(form && baselinePermissions && !permissionEquals(form, baselinePermissions));

  const handleSubmit = async () => {
    if (!companyId || !routeId || !selectedDriverUid || !form || !canSubmit) return;
    if (!hasChanges) {
      setSuccessMessage("Degisiklik yok, kayit gonderilmedi.");
      setError(null);
      return;
    }
    setPending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await grantDriverRoutePermissionsCallable({
        companyId,
        routeId,
        driverUid: selectedDriverUid,
        idempotencyKey: `perm:${routeId}:${selectedDriverUid}:${Date.now()}`,
        permissions: form,
      });
      setSuccessMessage("Rota yetkileri guncellendi.");
      await onUpdated();
    } catch (nextError) {
      setError(mapCompanyCallableErrorToMessage(nextError));
    } finally {
      setPending(false);
    }
  };

  const disabledByState =
    !companyId ||
    !routeId ||
    members.length === 0 ||
    routePermissionsLoadStatus === "loading" ||
    routePermissionsLoadStatus === "error";

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Detayli Rota Yetkileri</h3>
          <p className="text-xs text-slate-500">
            Secili uye icin permission flag&apos;leri `grantDriverRoutePermissions` ile kaydedilir.
          </p>
        </div>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {routePermissionsLoadStatus}
        </span>
      </div>

      <div className="space-y-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Uye</span>
          <select
            value={selectedDriverUid ?? ""}
            onChange={(event) => {
              const nextUid = event.target.value || null;
              setSelectedDriverUid(nextUid);
              if (!nextUid) {
                setForm(null);
                return;
              }
              setForm(toPermissionFlags(permissionMap.get(nextUid)?.permissions));
            }}
            disabled={disabledByState || pending}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            {members.length === 0 ? <option value="">Uye yok</option> : null}
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.displayName} ({member.role})
              </option>
            ))}
          </select>
        </label>

        {form ? (
          <div className="grid gap-2">
            {PERMISSION_ROWS.map((row) => (
              <label
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                <span className="text-slate-800">{row.label}</span>
                <input
                  type="checkbox"
                  checked={form[row.key]}
                  onChange={(event) => setForm({ ...form, [row.key]: event.target.checked })}
                  disabled={disabledByState || pending}
                  className="h-4 w-4 rounded border-line"
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Yetki duzenlemek icin aktif uye sec. Aktif uye yoksa once uye durumunu active yap.
          </p>
        )}

        {routePermissionsLoadStatus === "error" ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Yetki listesi yuklenmeden duzenleme acilmaz. Tekrar denemek icin route panelini yenile.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || !hasChanges}
          className="w-full rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Kaydediliyor..." : "Yetkileri Kaydet"}
        </button>
      </div>
    </section>
  );
}
