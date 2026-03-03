"use client";

import { useEffect, useMemo, useState } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import type { AddressSuggestion } from "@/components/company/routes/place-autocomplete-input";
import { RouteCreateSection } from "@/components/company/routes/route-create-section";
import { RouteListSection } from "@/components/company/routes/route-list-section";
import { RoutePerformanceSummary } from "@/components/company/routes/route-performance-summary";
import { RouteStopsSection } from "@/components/company/routes/route-stops-section";
import type { RouteDraft, RouteTimeSlotOption } from "@/components/company/routes/routes-management-types";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  createCompanyRouteForCompany,
  deleteCompanyRouteStopForRoute,
  listCompanyRouteStopsForRoute,
  listCompanyRoutesForCompany,
  upsertCompanyRouteStopForRoute,
  updateCompanyRouteForCompany,
  type CompanyRouteItem,
  type CompanyRouteStopItem,
} from "@/features/company/company-client";

type Props = {
  companyId: string;
};

const TIME_SLOT_OPTIONS: RouteTimeSlotOption[] = ["morning", "midday", "evening", "custom"];
const SCHEDULED_TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const ROUTE_NAME_MAX = 80;
const ROUTE_ADDRESS_MAX = 256;
const STOP_NAME_MAX = 80;

function sortStopsByOrder(items: CompanyRouteStopItem[]): CompanyRouteStopItem[] {
  return [...items].sort((left, right) => left.order - right.order);
}

export function CompanyRoutesManagement({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole } = useCompanyMembership();
  const [routes, setRoutes] = useState<CompanyRouteItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);

  const [createName, setCreateName] = useState<string>("");
  const [createStartAddress, setCreateStartAddress] = useState<string>("");
  const [createEndAddress, setCreateEndAddress] = useState<string>("");
  const [createStartSuggestion, setCreateStartSuggestion] = useState<AddressSuggestion | null>(null);
  const [createEndSuggestion, setCreateEndSuggestion] = useState<AddressSuggestion | null>(null);
  const [createScheduledTime, setCreateScheduledTime] = useState<string>("08:00");
  const [createTimeSlot, setCreateTimeSlot] = useState<RouteTimeSlotOption>("morning");
  const [createAllowGuestTracking, setCreateAllowGuestTracking] = useState<boolean>(false);
  const [createPending, setCreatePending] = useState<boolean>(false);
  const [showCreateValidation, setShowCreateValidation] = useState<boolean>(false);

  const [drafts, setDrafts] = useState<Record<string, RouteDraft>>({});
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeStops, setRouteStops] = useState<CompanyRouteStopItem[] | null>(null);
  const [loadingStops, setLoadingStops] = useState<boolean>(false);
  const [stopActionPending, setStopActionPending] = useState<boolean>(false);
  const [deletingStopId, setDeletingStopId] = useState<string | null>(null);
  const [movingStopId, setMovingStopId] = useState<string | null>(null);
  const [stopName, setStopName] = useState<string>("");
  const [stopAddressQuery, setStopAddressQuery] = useState<string>("");
  const [stopAddressSuggestion, setStopAddressSuggestion] = useState<AddressSuggestion | null>(null);

  useEffect(() => {
    if (status !== "signed_in") {
      return;
    }

    let cancelled = false;
    listCompanyRoutesForCompany({ companyId, limit: 200 })
      .then((nextRoutes) => {
        if (cancelled) {
          return;
        }
        setRoutes(nextRoutes);
        setErrorMessage(null);
        setDrafts((prev) => {
          const nextDrafts: Record<string, RouteDraft> = {};
          for (const route of nextRoutes) {
            nextDrafts[route.routeId] = prev[route.routeId] ?? {
              name: route.name,
              scheduledTime: route.scheduledTime ?? "08:00",
              timeSlot: route.timeSlot ?? "custom",
              allowGuestTracking: route.allowGuestTracking,
              isArchived: route.isArchived,
            };
          }
          return nextDrafts;
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Route listesi alinamadi.";
        setErrorMessage(message);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, refreshNonce, status]);

  const sortedRoutes = useMemo(
    () => [...(routes ?? [])].sort((left, right) => left.name.localeCompare(right.name, "tr")),
    [routes],
  );
  const selectedRoute = useMemo(
    () => sortedRoutes.find((item) => item.routeId === selectedRouteId) ?? null,
    [selectedRouteId, sortedRoutes],
  );
  const sortedRouteStops = useMemo(() => sortStopsByOrder(routeStops ?? []), [routeStops]);

  useEffect(() => {
    if (!routes) {
      return;
    }
    if (selectedRouteId && routes.some((item) => item.routeId === selectedRouteId)) {
      return;
    }
    const firstRouteId = routes[0]?.routeId ?? null;
    setSelectedRouteId(firstRouteId);
    setRouteStops(null);
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (status !== "signed_in" || !selectedRouteId) {
      return;
    }
    let cancelled = false;
    setLoadingStops(true);
    listCompanyRouteStopsForRoute({
      companyId,
      routeId: selectedRouteId,
    })
      .then((stops) => {
        if (cancelled) {
          return;
        }
        setRouteStops(sortStopsByOrder(stops));
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Route stop listesi alinamadi.";
        setErrorMessage(message);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setLoadingStops(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, selectedRouteId, status]);

  const canMutate = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";
  const isCreateTimeValid = SCHEDULED_TIME_REGEX.test(createScheduledTime.trim());
  const createValidationIssues: string[] = [];
  if (createName.trim().length < 2) {
    createValidationIssues.push("Rota adi en az 2 karakter olmali.");
  }
  if (createName.trim().length > ROUTE_NAME_MAX) {
    createValidationIssues.push("Rota adi en fazla 80 karakter olabilir.");
  }
  if (createStartAddress.trim().length < 3) {
    createValidationIssues.push("Baslangic adresi en az 3 karakter olmali.");
  }
  if (createStartAddress.trim().length > ROUTE_ADDRESS_MAX) {
    createValidationIssues.push("Baslangic adresi en fazla 256 karakter olabilir.");
  }
  if (createEndAddress.trim().length < 3) {
    createValidationIssues.push("Bitis adresi en az 3 karakter olmali.");
  }
  if (createEndAddress.trim().length > ROUTE_ADDRESS_MAX) {
    createValidationIssues.push("Bitis adresi en fazla 256 karakter olabilir.");
  }
  if (!isCreateTimeValid) {
    createValidationIssues.push("Planlanan saat HH:mm formatinda olmali.");
  }
  if (!createStartSuggestion) {
    createValidationIssues.push("Baslangic noktasi listeden secilmeli.");
  }
  if (!createEndSuggestion) {
    createValidationIssues.push("Bitis noktasi listeden secilmeli.");
  }
  const canCreate = createValidationIssues.length === 0 && !createPending && canMutate;

  const canAddStop =
    canMutate &&
    Boolean(selectedRouteId) &&
    !movingStopId &&
    !stopActionPending &&
    Boolean(stopAddressSuggestion);

  const handleCreateRoute = async () => {
    if (!canCreate) {
      setShowCreateValidation(true);
      return;
    }

    if (!createStartSuggestion || !createEndSuggestion) {
      setErrorMessage("Baslangic ve bitis noktalarini listeden secin.");
      return;
    }
    const normalizedName = createName.trim();
    const normalizedStartAddress = createStartAddress.trim();
    const normalizedEndAddress = createEndAddress.trim();
    if (normalizedName.length < 2 || normalizedName.length > ROUTE_NAME_MAX) {
      setErrorMessage("Rota adi 2-80 karakter arasinda olmali.");
      return;
    }
    if (
      normalizedStartAddress.length < 3 ||
      normalizedStartAddress.length > ROUTE_ADDRESS_MAX ||
      normalizedEndAddress.length < 3 ||
      normalizedEndAddress.length > ROUTE_ADDRESS_MAX
    ) {
      setErrorMessage("Baslangic ve bitis adresi 3-256 karakter arasinda olmali.");
      return;
    }

    setCreatePending(true);
    try {
      const created = await createCompanyRouteForCompany({
        companyId,
        name: normalizedName,
        startPoint: { lat: createStartSuggestion.lat, lng: createStartSuggestion.lng },
        startAddress: normalizedStartAddress,
        endPoint: { lat: createEndSuggestion.lat, lng: createEndSuggestion.lng },
        endAddress: normalizedEndAddress,
        scheduledTime: createScheduledTime.trim(),
        timeSlot: createTimeSlot,
        allowGuestTracking: createAllowGuestTracking,
      });
      setRoutes((prev) => {
        const base = prev ?? [];
        return [created, ...base.filter((item) => item.routeId !== created.routeId)];
      });
      setDrafts((prev) => ({
        ...prev,
        [created.routeId]: {
          name: created.name,
          scheduledTime: created.scheduledTime ?? "08:00",
          timeSlot: created.timeSlot ?? "custom",
          allowGuestTracking: created.allowGuestTracking,
          isArchived: created.isArchived,
        },
      }));
      setCreateName("");
      setCreateStartAddress("");
      setCreateEndAddress("");
      setCreateStartSuggestion(null);
      setCreateEndSuggestion(null);
      setCreateAllowGuestTracking(false);
      setShowCreateValidation(false);
      setSelectedRouteId(created.routeId);
      setRouteStops(null);
      setErrorMessage(null);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Route olusturulamadi.";
      setErrorMessage(message);
    } finally {
      setCreatePending(false);
    }
  };

  const handleResetCreateForm = () => {
    setCreateName("");
    setCreateStartAddress("");
    setCreateEndAddress("");
    setCreateStartSuggestion(null);
    setCreateEndSuggestion(null);
    setCreateScheduledTime("08:00");
    setCreateTimeSlot("morning");
    setCreateAllowGuestTracking(false);
    setShowCreateValidation(false);
  };

  const handleSaveRoute = async (routeId: string) => {
    if (!canMutate) {
      return;
    }
    const draft = drafts[routeId];
    if (!draft) {
      return;
    }
    setSavingRouteId(routeId);
    try {
      const updated = await updateCompanyRouteForCompany({
        companyId,
        routeId,
        name: draft.name,
        scheduledTime: draft.scheduledTime,
        timeSlot: draft.timeSlot,
        allowGuestTracking: draft.allowGuestTracking,
        isArchived: draft.isArchived,
      });
      setRoutes((prev) => {
        const base = prev ?? [];
        return base.map((item) => (item.routeId === routeId ? updated : item));
      });
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Route guncellenemedi.";
      setErrorMessage(message);
    } finally {
      setSavingRouteId(null);
    }
  };

  const handleAddStop = async () => {
    if (!canAddStop || !selectedRouteId || movingStopId) {
      return;
    }
    if (!stopAddressSuggestion) {
      setErrorMessage("Durak adresini listeden secin.");
      return;
    }
    const orderParsed = Math.max(0, (sortedRouteStops.at(-1)?.order ?? -1) + 1);
    const fallbackStopName = stopAddressSuggestion.label.trim().slice(0, STOP_NAME_MAX);
    const resolvedStopName = stopName.trim().length >= 2 ? stopName.trim() : fallbackStopName;
    if (resolvedStopName.length < 2 || resolvedStopName.length > STOP_NAME_MAX) {
      setErrorMessage("Durak adi 2-80 karakter arasinda olmali.");
      return;
    }

    setStopActionPending(true);
    try {
      const stop = await upsertCompanyRouteStopForRoute({
        companyId,
        routeId: selectedRouteId,
        name: resolvedStopName,
        location: { lat: stopAddressSuggestion.lat, lng: stopAddressSuggestion.lng },
        order: orderParsed,
      });
      setRouteStops((prev) => sortStopsByOrder([...(prev ?? []), stop]));
      setStopName("");
      setStopAddressQuery("");
      setStopAddressSuggestion(null);
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Durak eklenemedi.";
      setErrorMessage(message);
    } finally {
      setStopActionPending(false);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!canMutate || !selectedRouteId || movingStopId) {
      return;
    }
    setDeletingStopId(stopId);
    try {
      await deleteCompanyRouteStopForRoute({
        companyId,
        routeId: selectedRouteId,
        stopId,
      });
      setRouteStops((prev) => (prev ?? []).filter((item) => item.stopId !== stopId));
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Durak silinemedi.";
      setErrorMessage(message);
    } finally {
      setDeletingStopId(null);
    }
  };

  const handleMoveStop = async (stopId: string, direction: "up" | "down") => {
    if (!canMutate || !selectedRouteId || stopActionPending || deletingStopId || movingStopId) {
      return;
    }
    const orderedStops = sortStopsByOrder(routeStops ?? []);
    const currentIndex = orderedStops.findIndex((item) => item.stopId === stopId);
    if (currentIndex < 0) {
      return;
    }
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= orderedStops.length) {
      return;
    }

    const currentStop = orderedStops[currentIndex];
    const swapStop = orderedStops[swapIndex];

    setMovingStopId(stopId);
    try {
      const [updatedCurrentStop, updatedSwapStop] = await Promise.all([
        upsertCompanyRouteStopForRoute({
          companyId,
          routeId: selectedRouteId,
          stopId: currentStop.stopId,
          name: currentStop.name,
          location: currentStop.location,
          order: swapStop.order,
        }),
        upsertCompanyRouteStopForRoute({
          companyId,
          routeId: selectedRouteId,
          stopId: swapStop.stopId,
          name: swapStop.name,
          location: swapStop.location,
          order: currentStop.order,
        }),
      ]);

      setRouteStops((prev) => {
        const base = prev ?? [];
        const swapped = base.map((item) => {
          if (item.stopId === updatedCurrentStop.stopId) {
            return updatedCurrentStop;
          }
          if (item.stopId === updatedSwapStop.stopId) {
            return updatedSwapStop;
          }
          return item;
        });
        return sortStopsByOrder(swapped);
      });
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Durak sirasi guncellenemedi.";
      setErrorMessage(message);
    } finally {
      setMovingStopId(null);
    }
  };

  const handleReorderStops = async (draggedStopId: string, targetStopId: string) => {
    if (
      !canMutate ||
      !selectedRouteId ||
      stopActionPending ||
      deletingStopId ||
      movingStopId ||
      draggedStopId === targetStopId
    ) {
      return;
    }

    const orderedStops = sortStopsByOrder(routeStops ?? []);
    const sourceIndex = orderedStops.findIndex((item) => item.stopId === draggedStopId);
    const targetIndex = orderedStops.findIndex((item) => item.stopId === targetStopId);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const reordered = [...orderedStops];
    const [draggedStop] = reordered.splice(sourceIndex, 1);
    if (!draggedStop) {
      return;
    }
    reordered.splice(targetIndex, 0, draggedStop);

    const pendingUpdates = reordered
      .map((item, index) => ({ item, nextOrder: index }))
      .filter(({ item, nextOrder }) => item.order !== nextOrder);
    if (pendingUpdates.length === 0) {
      return;
    }

    setMovingStopId(draggedStopId);
    try {
      const updatedStops = await Promise.all(
        pendingUpdates.map(({ item, nextOrder }) =>
          upsertCompanyRouteStopForRoute({
            companyId,
            routeId: selectedRouteId,
            stopId: item.stopId,
            name: item.name,
            location: item.location,
            order: nextOrder,
          }),
        ),
      );

      const updatedMap = new Map(updatedStops.map((item) => [item.stopId, item]));
      setRouteStops((prev) =>
        sortStopsByOrder((prev ?? []).map((item) => updatedMap.get(item.stopId) ?? item)),
      );
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Durak siralamasi guncellenemedi.";
      setErrorMessage(message);
    } finally {
      setMovingStopId(null);
    }
  };

  return (
    <div className="space-y-4">
      <RouteCreateSection
        canMutate={canMutate}
        createName={createName}
        createScheduledTime={createScheduledTime}
        createStartAddress={createStartAddress}
        createEndAddress={createEndAddress}
        createStartSuggestion={createStartSuggestion}
        createEndSuggestion={createEndSuggestion}
        createTimeSlot={createTimeSlot}
        createAllowGuestTracking={createAllowGuestTracking}
        createPending={createPending}
        canCreate={canCreate}
        showCreateValidation={showCreateValidation}
        createValidationIssues={createValidationIssues}
        timeSlotOptions={TIME_SLOT_OPTIONS}
        onSetCreateName={(value) => {
          setCreateName(value);
          setShowCreateValidation(false);
        }}
        onSetCreateScheduledTime={(value) => {
          setCreateScheduledTime(value);
          setShowCreateValidation(false);
        }}
        onSetCreateStartAddress={(value) => {
          setCreateStartAddress(value.slice(0, ROUTE_ADDRESS_MAX));
          setCreateStartSuggestion(null);
          setShowCreateValidation(false);
        }}
        onSetCreateEndAddress={(value) => {
          setCreateEndAddress(value.slice(0, ROUTE_ADDRESS_MAX));
          setCreateEndSuggestion(null);
          setShowCreateValidation(false);
        }}
        onSelectCreateStartSuggestion={(suggestion) => {
          setCreateStartSuggestion(suggestion);
          setCreateStartAddress(suggestion.label.slice(0, ROUTE_ADDRESS_MAX));
          setShowCreateValidation(false);
        }}
        onSelectCreateEndSuggestion={(suggestion) => {
          setCreateEndSuggestion(suggestion);
          setCreateEndAddress(suggestion.label.slice(0, ROUTE_ADDRESS_MAX));
          setShowCreateValidation(false);
        }}
        onSetCreateTimeSlot={(value) => {
          setCreateTimeSlot(value);
          setShowCreateValidation(false);
        }}
        onSetCreateAllowGuestTracking={(value) => {
          setCreateAllowGuestTracking(value);
          setShowCreateValidation(false);
        }}
        onCreateRoute={handleCreateRoute}
        onResetCreateForm={handleResetCreateForm}
      />

      <RouteListSection
        routes={routes}
        sortedRoutes={sortedRoutes}
        selectedRouteId={selectedRouteId}
        canMutate={canMutate}
        drafts={drafts}
        setDrafts={setDrafts}
        savingRouteId={savingRouteId}
        errorMessage={errorMessage}
        timeSlotOptions={TIME_SLOT_OPTIONS}
        onRefresh={() => setRefreshNonce((prev) => prev + 1)}
        onSaveRoute={handleSaveRoute}
        onSelectRoute={setSelectedRouteId}
      />

      <RoutePerformanceSummary
        companyId={companyId}
        selectedRoute={selectedRoute}
        sortedRouteStops={sortedRouteStops}
      />

      <RouteStopsSection
        selectedRoute={selectedRoute}
        canMutate={canMutate}
        stopName={stopName}
        stopAddressQuery={stopAddressQuery}
        stopAddressSuggestion={stopAddressSuggestion}
        stopActionPending={stopActionPending}
        canAddStop={canAddStop}
        loadingStops={loadingStops}
        sortedRouteStops={sortedRouteStops}
        movingStopId={movingStopId}
        deletingStopId={deletingStopId}
        onSetStopName={setStopName}
        onSetStopAddressQuery={(value) => {
          setStopAddressQuery(value.slice(0, ROUTE_ADDRESS_MAX));
          setStopAddressSuggestion(null);
        }}
        onSelectStopAddressSuggestion={(suggestion) => {
          setStopAddressSuggestion(suggestion);
          setStopAddressQuery(suggestion.label.slice(0, ROUTE_ADDRESS_MAX));
        }}
        onAddStop={handleAddStop}
        onMoveStop={handleMoveStop}
        onReorderStops={handleReorderStops}
        onDeleteStop={handleDeleteStop}
      />
    </div>
  );
}
