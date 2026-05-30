"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  RouteUpdateFormSection,
  type RouteFormState,
  type RouteTimeSlot,
} from "@/components/dashboard/route-update-form-section";
import { isValidRouteTime } from "@/components/dashboard/route-time-validation";
import {
  grantDriverRoutePermissionsCallable,
  isCompanyCallableConflictError,
  mapCompanyCallableErrorToMessage,
  revokeDriverRoutePermissionsCallable,
  updateCompanyRouteCallable,
} from "@/features/company/company-callables";
import type {
  CompanyMemberSummary,
  CompanyRouteSummary,
  RouteDriverPermissionFlags,
} from "@/features/company/company-types";

type Props = {
  companyId: string;
  routes: readonly CompanyRouteSummary[];
  members: readonly CompanyMemberSummary[];
  membersLoadStatus: "idle" | "loading" | "success" | "error";
  selectedRouteId: string | null;
  onSelectedRouteIdChange: (routeId: string) => void;
  onUpdated?: () => Promise<void> | void;
};

function toRouteTimeSlot(value: CompanyRouteSummary["timeSlot"]): RouteTimeSlot {
  if (value === "morning" || value === "midday" || value === "evening" || value === "custom") {
    return value;
  }
  return "custom";
}

function buildFormState(route: CompanyRouteSummary): RouteFormState {
  return {
    name: route.name,
    scheduledTime: route.scheduledTime ?? "08:00",
    timeSlot: toRouteTimeSlot(route.timeSlot),
    allowGuestTracking: route.allowGuestTracking,
    isArchived: route.isArchived,
    authorizedDriverIds: [...route.authorizedDriverIds],
  };
}

function arrayEqualsAsSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const aSorted = [...a].sort();
  const bSorted = [...b].sort();
  return aSorted.every((value, index) => value === bSorted[index]);
}

const DEFAULT_ROUTE_DRIVER_PERMISSIONS: RouteDriverPermissionFlags = {
  canStartFinishTrip: true,
  canSendAnnouncements: true,
  canViewPassengerList: true,
  canEditAssignedRouteMeta: false,
  canEditStops: false,
  canManageRouteSchedule: false,
};

export function RouteUpdateDrawerForm({
  companyId,
  routes,
  members,
  membersLoadStatus,
  selectedRouteId,
  onSelectedRouteIdChange,
  onUpdated,
}: Props) {
  const selectedRoute =
    (selectedRouteId ? routes.find((route) => route.routeId === selectedRouteId) ?? null : routes[0] ?? null) ??
    null;

  const [form, setForm] = useState<RouteFormState | null>(
    selectedRoute ? buildFormState(selectedRoute) : null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeMembers = useMemo(
    () => members.filter((member) => member.memberStatus === "active"),
    [members],
  );
  const activeMemberUidSet = useMemo(
    () => new Set(activeMembers.map((member) => member.uid)),
    [activeMembers],
  );
  const inactiveAuthorizedDriverIds = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.authorizedDriverIds.filter((uid) => !activeMemberUidSet.has(uid));
  }, [activeMemberUidSet, selectedRoute]);

  useEffect(() => {
    if (!selectedRoute) {
      setForm(null);
      return;
    }
    setForm(buildFormState(selectedRoute));
    setError(null);
    setSuccessMessage(null);
  }, [selectedRoute]);

  const isScheduledTimeValid = form ? isValidRouteTime(form.scheduledTime) : false;

  const hasChanges = useMemo(() => {
    if (!selectedRoute || !form) return false;
    return (
      selectedRoute.name !== form.name.trim() ||
      (selectedRoute.scheduledTime ?? "08:00") !== form.scheduledTime ||
      toRouteTimeSlot(selectedRoute.timeSlot) !== form.timeSlot ||
      selectedRoute.allowGuestTracking !== form.allowGuestTracking ||
      selectedRoute.isArchived !== form.isArchived ||
      !arrayEqualsAsSet(selectedRoute.authorizedDriverIds, form.authorizedDriverIds)
    );
  }, [form, selectedRoute]);

  const canSubmit = Boolean(
    selectedRoute &&
      form &&
      !pending &&
      form.name.trim().length >= 2 &&
      isScheduledTimeValid &&
      hasChanges,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRoute || !form || !canSubmit) return;

    if (!hasChanges) {
      setSuccessMessage("Degisiklik yok, kayıt gonderilmedi.");
      setError(null);
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Rota adi en az 2 karakter olmali.");
      return;
    }
    if (!isValidRouteTime(form.scheduledTime)) {
      setError("Saat HH:MM formatinda olmali.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const patch: {
        name?: string;
        scheduledTime?: string;
        timeSlot?: RouteTimeSlot;
        allowGuestTracking?: boolean;
        isArchived?: boolean;
      } = {};

      const nextName = form.name.trim();
      const currentScheduledTime = selectedRoute.scheduledTime ?? "08:00";
      const currentTimeSlot = toRouteTimeSlot(selectedRoute.timeSlot);

      if (nextName !== selectedRoute.name) patch.name = nextName;
      if (form.scheduledTime !== currentScheduledTime) patch.scheduledTime = form.scheduledTime;
      if (form.timeSlot !== currentTimeSlot) patch.timeSlot = form.timeSlot;
      if (form.allowGuestTracking !== selectedRoute.allowGuestTracking) {
        patch.allowGuestTracking = form.allowGuestTracking;
      }
      if (form.isArchived !== selectedRoute.isArchived) {
        patch.isArchived = form.isArchived;
      }
      const nextAuthorizedDriverIds = [...new Set(form.authorizedDriverIds)];
      const currentAuthorizedDriverIds = [...new Set(selectedRoute.authorizedDriverIds)];
      const toGrantDriverUids = nextAuthorizedDriverIds.filter(
        (uid) => !currentAuthorizedDriverIds.includes(uid),
      );
      const toRevokeDriverUids = currentAuthorizedDriverIds.filter(
        (uid) => !nextAuthorizedDriverIds.includes(uid),
      );

      if (Object.keys(patch).length === 0 && toGrantDriverUids.length === 0 && toRevokeDriverUids.length === 0) {
        setSuccessMessage("Degisiklik yok, kayıt gonderilmedi.");
        return;
      }

      if (Object.keys(patch).length > 0) {
        await updateCompanyRouteCallable({
          companyId,
          routeId: selectedRoute.routeId,
          lastKnownUpdateToken: selectedRoute.updatedAt ?? undefined,
          patch,
        });
      }

      for (const driverUid of toGrantDriverUids) {
        await grantDriverRoutePermissionsCallable({
          companyId,
          routeId: selectedRoute.routeId,
          driverUid,
          idempotencyKey: `grant:${selectedRoute.routeId}:${driverUid}:${Date.now()}`,
          permissions: { ...DEFAULT_ROUTE_DRIVER_PERMISSIONS },
        });
      }

      for (const driverUid of toRevokeDriverUids) {
        await revokeDriverRoutePermissionsCallable({
          companyId,
          routeId: selectedRoute.routeId,
          driverUid,
          idempotencyKey: `revoke:${selectedRoute.routeId}:${driverUid}:${Date.now()}`,
          resetToDefault: true,
        });
      }

      const permissionDeltaCount = toGrantDriverUids.length + toRevokeDriverUids.length;
      setSuccessMessage(
        permissionDeltaCount > 0
          ? `Rota guncellendi. Yetki aksiyonlari: +${toGrantDriverUids.length} / -${toRevokeDriverUids.length}.`
          : "Rota ozet alanlari guncellendi.",
      );
      if (onUpdated) {
        await onUpdated();
      }
    } catch (nextError) {
      setError(mapCompanyCallableErrorToMessage(nextError));
      if (isCompanyCallableConflictError(nextError) && onUpdated) {
        await onUpdated();
      }
    } finally {
      setPending(false);
    }
  }

  if (!selectedRoute || !form) {
    return (
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Rota Güncelle</div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Liste bos oldugunda guncelleme formu devreye girmez.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Rota Güncelle</h3>
          <p className="text-xs text-slate-500">
            `updateCompanyRoute` ile route ozet alanlari patch edilir.
          </p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          updateCompanyRoute
        </span>
      </div>

      <RouteUpdateFormSection
        selectedRoute={selectedRoute}
        routes={routes}
        form={form}
        isScheduledTimeValid={isScheduledTimeValid}
        hasChanges={hasChanges}
        activeMembers={activeMembers}
        membersLoadStatus={membersLoadStatus}
        canSubmit={canSubmit}
        pending={pending}
        error={error}
        successMessage={successMessage}
        onSubmit={handleSubmit}
        onSelectedRouteIdChange={onSelectedRouteIdChange}
        onFormChange={(next) => setForm(next)}
        onToggleAuthorizedMember={(memberUid, checked) =>
          setForm((prev) => {
            if (!prev) return prev;
            const nextSet = new Set(prev.authorizedDriverIds);
            if (checked) nextSet.add(memberUid);
            else nextSet.delete(memberUid);
            return { ...prev, authorizedDriverIds: Array.from(nextSet) };
          })
        }
      />
      {inactiveAuthorizedDriverIds.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p>
            Bu rotada {inactiveAuthorizedDriverIds.length} inaktif uye yetkisi bulundu. Bu uyeler
            checkbox listesinde gosterilmez.
          </p>
          <button
            type="button"
            onClick={() =>
              setForm((prev) =>
                prev
                  ? {
                      ...prev,
                      authorizedDriverIds: prev.authorizedDriverIds.filter((uid) =>
                        activeMemberUidSet.has(uid),
                      ),
                    }
                  : prev,
              )
            }
            disabled={pending}
            className="mt-2 inline-flex items-center rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Inaktif Yetkileri Formdan Temizle
          </button>
        </div>
      ) : null}
    </section>
  );
}

