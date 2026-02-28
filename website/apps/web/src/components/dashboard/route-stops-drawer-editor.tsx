"use client";

import { DragEvent as ReactDragEvent, FormEvent, useEffect, useMemo, useState } from "react";

import {
  deleteCompanyRouteStopCallable,
  isCompanyCallableConflictError,
  mapCompanyCallableErrorToMessage,
  upsertCompanyRouteStopCallable,
} from "@/features/company/company-callables";
import {
  buildEditForm,
  buildEmptyForm,
  findStopOrderConflict,
  type StopFormState,
  validateStopFormInput,
} from "@/components/dashboard/route-stops-editor-helpers";
import {
  reorderStopBySteps,
  resolveDropReorderPlan,
} from "@/components/dashboard/route-stops-editor-reorder-helpers";
import { RouteStopsFormSection } from "@/components/dashboard/route-stops-form-section";
import { RouteStopsListSection } from "@/components/dashboard/route-stops-list-section";
import type {
  CompanyRouteStopSummary,
  CompanyRouteSummary,
} from "@/features/company/company-types";
import { useCompanyRouteStops } from "@/features/company/use-company-route-stops";

type Props = {
  companyId: string;
  selectedRoute: CompanyRouteSummary | null;
  activeTripsCount?: number;
  onRouteMutated?: () => Promise<void> | void;
};

export function RouteStopsDrawerEditor({
  companyId,
  selectedRoute,
  activeTripsCount = 0,
  onRouteMutated,
}: Props) {
  const routeId = selectedRoute?.routeId ?? null;
  const stopsQuery = useCompanyRouteStops(companyId, routeId, Boolean(companyId && routeId));
  const [form, setForm] = useState<StopFormState>(buildEmptyForm(0));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);
  const [dragOverStopId, setDragOverStopId] = useState<string | null>(null);
  const hasActiveTrips = activeTripsCount > 0;
  const structuralLockReason =
    "Aktif sefer varken durak ekleme, silme ve sira degistirme kilitlidir.";
  const lockedEditReason =
    "Aktif seferde sadece durak adi guncellenebilir; koordinat ve sira degistirilemez.";

  const nextOrder = useMemo(() => {
    if (stopsQuery.items.length === 0) return 0;
    return Math.max(...stopsQuery.items.map((item) => item.order)) + 1;
  }, [stopsQuery.items]);

  useEffect(() => {
    setForm(buildEmptyForm(nextOrder));
    setError(null);
    setSuccessMessage(null);
  }, [routeId, nextOrder]);

  const formValidation = useMemo(() => validateStopFormInput(form), [form]);
  const orderConflictStop = useMemo(
    () => findStopOrderConflict(stopsQuery.items, form),
    [form, stopsQuery.items],
  );
  const orderConflictMessage = orderConflictStop
    ? `Bu sirada zaten \"${orderConflictStop.name}\" duragi var.`
    : null;
  const isCreateMode = !form.stopId;
  const editingStop = useMemo(() => {
    if (!form.stopId) return null;
    return stopsQuery.items.find((item) => item.stopId === form.stopId) ?? null;
  }, [form.stopId, stopsQuery.items]);
  const isLockedEditStructuralMutation = useMemo(() => {
    if (!hasActiveTrips || !editingStop || !form.stopId) return false;
    const formLat = Number(form.lat);
    const formLng = Number(form.lng);
    const latChanged = Number.isFinite(formLat)
      ? Math.abs(formLat - editingStop.location.lat) > 1e-9
      : true;
    const lngChanged = Number.isFinite(formLng)
      ? Math.abs(formLng - editingStop.location.lng) > 1e-9
      : true;
    return form.order !== editingStop.order || latChanged || lngChanged;
  }, [editingStop, form.lat, form.lng, form.order, form.stopId, hasActiveTrips]);
  const canSubmit = Boolean(
    routeId &&
      !pending &&
      formValidation.ok &&
      !orderConflictStop &&
      !isLockedEditStructuralMutation &&
      (!hasActiveTrips || !isCreateMode),
  );

  useEffect(() => {
    if (!hasActiveTrips || !editingStop || !form.stopId) return;
    setForm((prev) => {
      if (prev.stopId !== editingStop.stopId) return prev;
      const nextLat = String(editingStop.location.lat);
      const nextLng = String(editingStop.location.lng);
      if (prev.order === editingStop.order && prev.lat === nextLat && prev.lng === nextLng) {
        return prev;
      }
      return {
        ...prev,
        order: editingStop.order,
        lat: nextLat,
        lng: nextLng,
      };
    });
  }, [editingStop, form.stopId, hasActiveTrips]);

  async function refreshAfterConflict(error: unknown) {
    if (!isCompanyCallableConflictError(error)) return;
    await stopsQuery.reload();
    if (onRouteMutated) {
      await onRouteMutated();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentRoute = selectedRoute;
    if (!routeId || !canSubmit || !currentRoute) return;
    if (hasActiveTrips && !form.stopId) {
      setError(structuralLockReason);
      return;
    }
    if (isLockedEditStructuralMutation) {
      setError(lockedEditReason);
      return;
    }

    if (!formValidation.ok) {
      setError(formValidation.error);
      return;
    }
    if (orderConflictMessage) {
      setError(orderConflictMessage);
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await upsertCompanyRouteStopCallable({
        companyId,
        routeId,
        lastKnownUpdateToken: currentRoute.updatedAt ?? undefined,
        stopId: form.stopId ?? undefined,
        name: formValidation.data.name,
        order:
          hasActiveTrips && editingStop && form.stopId ? editingStop.order : formValidation.data.order,
        location:
          hasActiveTrips && editingStop && form.stopId
            ? {
                lat: editingStop.location.lat,
                lng: editingStop.location.lng,
              }
            : { lat: formValidation.data.lat, lng: formValidation.data.lng },
      });
      await stopsQuery.reload();
      if (onRouteMutated) {
        await onRouteMutated();
      }
      setSuccessMessage(form.stopId ? "Durak guncellendi." : "Durak eklendi.");
      setForm(buildEmptyForm(nextOrder));
    } catch (nextError) {
      setError(mapCompanyCallableErrorToMessage(nextError));
      await refreshAfterConflict(nextError);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(stop: CompanyRouteStopSummary) {
    if (!routeId || pending) return;
    if (hasActiveTrips) {
      setError(structuralLockReason);
      return;
    }
    const confirmed = window.confirm(
      `\"${stop.name}\" duragi silinsin mi? Bu islem Faz 2 MVP'de geri alinamaz.`,
    );
    if (!confirmed) return;

    setPending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await deleteCompanyRouteStopCallable({
        companyId,
        routeId,
        stopId: stop.stopId,
        lastKnownUpdateToken: selectedRoute?.updatedAt ?? undefined,
      });
      await stopsQuery.reload();
      if (onRouteMutated) {
        await onRouteMutated();
      }
      if (form.stopId === stop.stopId) {
        setForm(buildEmptyForm(nextOrder));
      }
      setSuccessMessage("Durak silindi.");
    } catch (nextError) {
      setError(mapCompanyCallableErrorToMessage(nextError));
      await refreshAfterConflict(nextError);
    } finally {
      setPending(false);
    }
  }

  async function handleReorder(stop: CompanyRouteStopSummary, direction: "up" | "down") {
    if (!routeId || pending) return;
    if (hasActiveTrips) {
      setError(structuralLockReason);
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await reorderStopBySteps({
        companyId,
        routeId,
        stopId: stop.stopId,
        direction,
        steps: 1,
        lastKnownUpdateToken: selectedRoute?.updatedAt ?? undefined,
      });
      await stopsQuery.reload();
      if (onRouteMutated) {
        await onRouteMutated();
      }
      if (form.stopId === stop.stopId) {
        setForm((prev) => {
          if (prev.stopId !== stop.stopId) return prev;
          if (result.changedCount === 0) return prev;
          return {
            ...prev,
            order: direction === "up" ? Math.max(0, prev.order - 1) : prev.order + 1,
          };
        });
      }
      setSuccessMessage(result.changedCount > 0 ? "Durak sirasi guncellendi." : "Durak zaten sinirda.");
    } catch (nextError) {
      setError(mapCompanyCallableErrorToMessage(nextError));
      await refreshAfterConflict(nextError);
    } finally {
      setPending(false);
    }
  }

  async function handleReorderBySteps(
    stop: CompanyRouteStopSummary,
    direction: "up" | "down",
    steps: number,
  ) {
    if (!routeId || pending || steps <= 0) return;
    if (hasActiveTrips) {
      setError(structuralLockReason);
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage(null);
    setDragOverStopId(null);
    setDraggingStopId(null);

    try {
      const result = await reorderStopBySteps({
        companyId,
        routeId,
        stopId: stop.stopId,
        direction,
        steps,
        lastKnownUpdateToken: selectedRoute?.updatedAt ?? undefined,
      });
      const changedCount = result.changedCount;

      await stopsQuery.reload();
      if (onRouteMutated) {
        await onRouteMutated();
      }

      if (form.stopId === stop.stopId) {
        setForm((prev) => ({
          ...prev,
          order: direction === "up" ? Math.max(0, prev.order - changedCount) : prev.order + changedCount,
        }));
      }

      if (changedCount > 0) {
        setSuccessMessage(
          steps > 1 ? `Durak ${changedCount} adim tasindi.` : "Durak sirasi guncellendi.",
        );
      } else {
        setSuccessMessage("Durak zaten sinirda.");
      }
    } catch (nextError) {
      setError(mapCompanyCallableErrorToMessage(nextError));
      await refreshAfterConflict(nextError);
    } finally {
      setPending(false);
    }
  }

  function resolveStepsToTop(stopId: string): number {
    const index = stopsQuery.items.findIndex((item) => item.stopId === stopId);
    if (index <= 0) return 0;
    return index;
  }

  function resolveStepsToBottom(stopId: string): number {
    const index = stopsQuery.items.findIndex((item) => item.stopId === stopId);
    if (index < 0 || index >= stopsQuery.items.length - 1) return 0;
    return stopsQuery.items.length - index - 1;
  }

  function handleDragStart(event: ReactDragEvent<HTMLDivElement>, stopId: string) {
    if (pending || hasActiveTrips) {
      event.preventDefault();
      if (hasActiveTrips) {
        setError(structuralLockReason);
      }
      return;
    }
    setDraggingStopId(stopId);
    setDragOverStopId(stopId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", stopId);
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>, stopId: string) {
    if (!draggingStopId || pending || hasActiveTrips) return;
    event.preventDefault();
    if (dragOverStopId !== stopId) {
      setDragOverStopId(stopId);
    }
  }

  async function handleDrop(event: ReactDragEvent<HTMLDivElement>, targetStopId: string) {
    event.preventDefault();
    const draggedId = draggingStopId || event.dataTransfer.getData("text/plain") || null;
    setDragOverStopId(null);
    setDraggingStopId(null);

    if (!draggedId || draggedId === targetStopId || pending || hasActiveTrips) {
      if (hasActiveTrips) {
        setError(structuralLockReason);
      }
      return;
    }

    const plan = resolveDropReorderPlan(stopsQuery.items, draggedId, targetStopId);
    if (!plan) return;

    await handleReorderBySteps(plan.draggedStop, plan.direction, plan.steps);
  }

  const title = selectedRoute ? `Duraklar / ${selectedRoute.name}` : "Duraklar";

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            Faz 2 MVP: `listCompanyRouteStops` + `upsertCompanyRouteStop` + `deleteCompanyRouteStop`.
          </p>
        </div>
        <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          Stop Editor v1
        </span>
      </div>

      {!selectedRoute ? (
        <p className="text-xs text-slate-500">Durak editoru icin once bir rota sec.</p>
      ) : (
        <div className="space-y-4">
          {hasActiveTrips ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {structuralLockReason} (Aktif sefer: {activeTripsCount})
            </div>
          ) : null}
          <RouteStopsListSection
            status={stopsQuery.status}
            error={stopsQuery.error}
            stops={stopsQuery.items}
            pending={pending}
            structuralLocked={hasActiveTrips}
            draggingStopId={draggingStopId}
            dragOverStopId={dragOverStopId}
            onRetry={() => void stopsQuery.reload()}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(event, stopId) => void handleDrop(event, stopId)}
            onDragEnd={() => {
              setDraggingStopId(null);
              setDragOverStopId(null);
            }}
            onMoveUp={(stop) => void handleReorder(stop, "up")}
            onMoveDown={(stop) => void handleReorder(stop, "down")}
            onMoveTop={(stop) => {
              const steps = resolveStepsToTop(stop.stopId);
              if (steps > 0) {
                void handleReorderBySteps(stop, "up", steps);
              }
            }}
            onMoveBottom={(stop) => {
              const steps = resolveStepsToBottom(stop.stopId);
              if (steps > 0) {
                void handleReorderBySteps(stop, "down", steps);
              }
            }}
            onEdit={(stop) => {
              setForm(buildEditForm(stop));
              setError(null);
              setSuccessMessage(null);
            }}
            onDelete={(stop) => void handleDelete(stop)}
          />

          <RouteStopsFormSection
            form={form}
            nextOrder={nextOrder}
            pending={pending}
            canSubmit={canSubmit}
            structuralLocked={hasActiveTrips}
            structuralLockMessage={structuralLockReason}
            structuralEditLockMessage={lockedEditReason}
            error={error}
            orderConflictMessage={orderConflictMessage}
            successMessage={successMessage}
            onSubmit={handleSubmit}
            onResetCreateMode={() => setForm(buildEmptyForm(nextOrder))}
            onNameChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
            onOrderChange={(value) => setForm((prev) => ({ ...prev, order: value }))}
            onLatChange={(value) => setForm((prev) => ({ ...prev, lat: value }))}
            onLngChange={(value) => setForm((prev) => ({ ...prev, lng: value }))}
          />
        </div>
      )}
    </section>
  );
}
