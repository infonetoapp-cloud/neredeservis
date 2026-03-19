"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import type { AddressSuggestion } from "@/components/company/routes/place-autocomplete-input";
import { RouteCreateSection } from "@/components/company/routes/route-create-section";
import { RouteListSection } from "@/components/company/routes/route-list-section";
import { RoutePerformanceSummary } from "@/components/company/routes/route-performance-summary";
import { RouteStopsSection } from "@/components/company/routes/route-stops-section";
import type { RouteDraft, RouteTimeSlotOption } from "@/components/company/routes/routes-management-types";
import { RouteCreationMapPreview } from "@/components/dashboard/route-creation-map-preview";
import type { RouteWaypoint } from "@/components/dashboard/route-distance-helpers";
import { getPublicMapboxToken } from "@/lib/env/public-env";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  createCompanyRouteForCompany,
  deleteCompanyRouteForCompany,
  deleteCompanyRouteStopForRoute,
  listCompanyDriversForCompany,
  listCompanyRouteStopsForRoute,
  listCompanyRoutesForCompany,
  upsertCompanyRouteStopForRoute,
  updateCompanyRouteForCompany,
  type CompanyDriverItem,
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

function normalizeAddressForCompare(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("tr");
}

function areAddressesSimilar(left: string | null | undefined, right: string | null | undefined): boolean {
  const normalizedLeft = normalizeAddressForCompare(left);
  const normalizedRight = normalizeAddressForCompare(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

async function resolveAddressSuggestionFromText(
  address: string | null | undefined,
  token: string | null,
): Promise<AddressSuggestion | null> {
  const normalizedAddress = address?.trim();
  if (!normalizedAddress || !token) {
    return null;
  }

  const params = new URLSearchParams({
    access_token: token,
    country: "tr",
    language: "tr",
    limit: "1",
    types: "address,poi,place,district,locality,neighborhood",
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedAddress)}.json?${params.toString()}`,
  );
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    features?: Array<{
      id?: string;
      place_name?: string;
      place_name_tr?: string;
      center?: [number, number];
    }>;
  };
  const feature = payload.features?.[0];
  if (!feature?.center || feature.center.length < 2) {
    return null;
  }

  const label = String(feature.place_name_tr || feature.place_name || normalizedAddress)
    .replace(/,\s*Türkiye$/i, "")
    .trim();

  return {
    id: feature.id ?? `forward_${feature.center[1]}_${feature.center[0]}`,
    label,
    lat: feature.center[1],
    lng: feature.center[0],
    source: "mapbox",
  };
}

export function CompanyRoutesManagement({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole } = useCompanyMembership();
  const [routes, setRoutes] = useState<CompanyRouteItem[] | null>(null);
  const [drivers, setDrivers] = useState<CompanyDriverItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);
  const [archivingRouteId, setArchivingRouteId] = useState<string | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);

  const [createName, setCreateName] = useState<string>("");
  const [createStartAddress, setCreateStartAddress] = useState<string>("");
  const [createEndAddress, setCreateEndAddress] = useState<string>("");
  const [createStartSuggestion, setCreateStartSuggestion] = useState<AddressSuggestion | null>(null);
  const [createEndSuggestion, setCreateEndSuggestion] = useState<AddressSuggestion | null>(null);
  const [createIntermediateStopQuery, setCreateIntermediateStopQuery] = useState<string>("");
  const [createIntermediateStopSuggestion, setCreateIntermediateStopSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [createIntermediateStops, setCreateIntermediateStops] = useState<AddressSuggestion[]>([]);
  const [createScheduledTime, setCreateScheduledTime] = useState<string>("08:00");
  const [createTimeSlot, setCreateTimeSlot] = useState<RouteTimeSlotOption>("morning");
  const [createAllowGuestTracking, setCreateAllowGuestTracking] = useState<boolean>(false);
  const [createPending, setCreatePending] = useState<boolean>(false);
  const [showCreateValidation, setShowCreateValidation] = useState<boolean>(false);
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);

  const [drafts, setDrafts] = useState<Record<string, RouteDraft>>({});
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeStops, setRouteStops] = useState<CompanyRouteStopItem[] | null>(null);
  const [selectedRouteEndpoints, setSelectedRouteEndpoints] = useState<{
    start: AddressSuggestion | null;
    end: AddressSuggestion | null;
  }>({
    start: null,
    end: null,
  });
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
    Promise.all([
      listCompanyRoutesForCompany({ companyId, limit: 200 }),
      listCompanyDriversForCompany({ companyId, limit: 200 }),
    ])
      .then(([nextRoutes, nextDrivers]) => {
        if (cancelled) {
          return;
        }
        setRoutes(nextRoutes);
        setDrivers(nextDrivers);
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
        const message = error instanceof Error ? error.message : "Rota listesi alınamadı.";
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
  const driverNameById = useMemo(
    () => new Map((drivers ?? []).map((driver) => [driver.driverId, driver.name])),
    [drivers],
  );
  const routeIntermediateStops = useMemo(() => {
    if (!selectedRoute) {
      return sortedRouteStops;
    }

    return sortedRouteStops.filter((stop, index) => {
      const isFirst = index === 0;
      const isLast = index === sortedRouteStops.length - 1;
      const matchesStart = isFirst && areAddressesSimilar(stop.name, selectedRoute.startAddress);
      const matchesEnd = isLast && areAddressesSimilar(stop.name, selectedRoute.endAddress);
      return !matchesStart && !matchesEnd;
    });
  }, [selectedRoute, sortedRouteStops]);
  const routeDriverNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const route of sortedRoutes) {
      if (!route.driverId) {
        continue;
      }
      const driverName = driverNameById.get(route.driverId);
      if (driverName) {
        names[route.routeId] = driverName;
      }
    }
    return names;
  }, [driverNameById, sortedRoutes]);

  useEffect(() => {
    if (!routes) {
      return;
    }
    if (routes.length === 0) {
      setShowCreatePanel(true);
    }
  }, [routes]);

  useEffect(() => {
    if (!routes) {
      return;
    }
    if (selectedRouteId && routes.some((item) => item.routeId === selectedRouteId)) {
      return;
    }
    if (showCreatePanel) {
      setRouteStops(null);
      return;
    }
    const firstRouteId = routes[0]?.routeId ?? null;
    setSelectedRouteId(firstRouteId);
    setRouteStops(null);
  }, [routes, selectedRouteId, showCreatePanel]);

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
        const message = error instanceof Error ? error.message : "Rota durak listesi alınamadı.";
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

  useEffect(() => {
    let cancelled = false;

    if (!selectedRoute) {
      setSelectedRouteEndpoints({ start: null, end: null });
      return () => {
        cancelled = true;
      };
    }

    const token = getPublicMapboxToken();
    if (!token) {
      setSelectedRouteEndpoints({ start: null, end: null });
      return () => {
        cancelled = true;
      };
    }

    void Promise.all([
      resolveAddressSuggestionFromText(selectedRoute.startAddress, token),
      resolveAddressSuggestionFromText(selectedRoute.endAddress, token),
    ])
      .then(([start, end]) => {
        if (cancelled) {
          return;
        }
        setSelectedRouteEndpoints({ start, end });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setSelectedRouteEndpoints({ start: null, end: null });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRoute]);

  const canMutate = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";
  const isCreateTimeValid = SCHEDULED_TIME_REGEX.test(createScheduledTime.trim());
  const createValidationIssues: string[] = [];
  if (createName.trim().length < 2) {
    createValidationIssues.push("Rota adı en az 2 karakter olmalı.");
  }
  if (createName.trim().length > ROUTE_NAME_MAX) {
    createValidationIssues.push("Rota adı en fazla 80 karakter olabilir.");
  }
  if (createStartAddress.trim().length < 3) {
    createValidationIssues.push("Başlangıç adresi en az 3 karakter olmalı.");
  }
  if (createStartAddress.trim().length > ROUTE_ADDRESS_MAX) {
    createValidationIssues.push("Başlangıç adresi en fazla 256 karakter olabilir.");
  }
  if (createEndAddress.trim().length < 3) {
    createValidationIssues.push("Bitiş adresi en az 3 karakter olmalı.");
  }
  if (createEndAddress.trim().length > ROUTE_ADDRESS_MAX) {
    createValidationIssues.push("Bitiş adresi en fazla 256 karakter olabilir.");
  }
  if (!isCreateTimeValid) {
    createValidationIssues.push("Planlanan saat HH:mm formatında olmalı.");
  }
  if (!createStartSuggestion) {
    createValidationIssues.push("Başlangıç noktası listeden seçilmeli.");
  }
  if (!createEndSuggestion) {
    createValidationIssues.push("Bitiş noktası listeden seçilmeli.");
  }
  const canCreate = createValidationIssues.length === 0 && !createPending && canMutate;

  const canAddStop =
    canMutate &&
    Boolean(selectedRouteId) &&
    !movingStopId &&
    !stopActionPending &&
    Boolean(stopAddressSuggestion);
  const canCopyFromSelectedRoute = Boolean(
    selectedRoute && selectedRouteEndpoints.start && selectedRouteEndpoints.end,
  );

  const handleCreateRoute = async () => {
    if (!canCreate) {
      setShowCreateValidation(true);
      return;
    }

    if (!createStartSuggestion || !createEndSuggestion) {
      setErrorMessage("Başlangıç ve bitiş noktalarını listeden seçin.");
      return;
    }
    const normalizedName = createName.trim();
    const normalizedStartAddress = createStartAddress.trim();
    const normalizedEndAddress = createEndAddress.trim();
    if (normalizedName.length < 2 || normalizedName.length > ROUTE_NAME_MAX) {
      setErrorMessage("Rota adı 2-80 karakter arasında olmalı.");
      return;
    }
    if (
      normalizedStartAddress.length < 3 ||
      normalizedStartAddress.length > ROUTE_ADDRESS_MAX ||
      normalizedEndAddress.length < 3 ||
      normalizedEndAddress.length > ROUTE_ADDRESS_MAX
    ) {
      setErrorMessage("Başlangıç ve bitiş adresi 3-256 karakter arasında olmalı.");
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

      const orderedStopsPayload: Array<{
        name: string;
        location: { lat: number; lng: number };
        order: number;
      }> = createIntermediateStops.map((stop, index) => ({
        name: stop.label.trim().slice(0, STOP_NAME_MAX),
        location: { lat: stop.lat, lng: stop.lng },
        order: index,
      }));

      const createdStops = await Promise.all(
        orderedStopsPayload.map((stop) =>
          upsertCompanyRouteStopForRoute({
            companyId,
            routeId: created.routeId,
            name: stop.name,
            location: stop.location,
            order: stop.order,
          }),
        ),
      );

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
      setCreateIntermediateStopQuery("");
      setCreateIntermediateStopSuggestion(null);
      setCreateIntermediateStops([]);
      setCreateAllowGuestTracking(false);
      setShowCreateValidation(false);
      setShowCreatePanel(false);
      setSelectedRouteId(created.routeId);
      setRouteStops(sortStopsByOrder(createdStops));
      setErrorMessage(null);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rota oluşturulamadı.";
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
    setCreateIntermediateStopQuery("");
    setCreateIntermediateStopSuggestion(null);
    setCreateIntermediateStops([]);
    setCreateScheduledTime("08:00");
    setCreateTimeSlot("morning");
    setCreateAllowGuestTracking(false);
    setShowCreateValidation(false);
  };

  const handleOpenCreatePanel = useCallback(() => {
    setSelectedRouteId(null);
    setRouteStops(null);
    setShowCreatePanel(true);
    setErrorMessage(null);
  }, []);

  const handleCloseCreatePanel = useCallback(() => {
    setShowCreatePanel(false);
  }, []);

  const handleSelectRoute = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
    setRouteStops(null);
    setShowCreatePanel(false);
  }, []);

  const handleSwapCreateEndpoints = () => {
    setCreateStartAddress(createEndAddress);
    setCreateEndAddress(createStartAddress);
    setCreateStartSuggestion(createEndSuggestion);
    setCreateEndSuggestion(createStartSuggestion);
    setShowCreateValidation(false);
  };

  const handleApplyRouteTemplate = () => {
    const templateStart: AddressSuggestion = {
      id: "template-start",
      label: "Rasimpaşa, İskele Sokak, Kadıköy, İstanbul",
      lat: 40.9896,
      lng: 29.0286,
      source: "history",
    };
    const templateIntermediate: AddressSuggestion = {
      id: "template-stop-1",
      label: "Mecidiyeköy, Şişli, İstanbul",
      lat: 41.0672,
      lng: 28.9948,
      source: "history",
    };
    const templateEnd: AddressSuggestion = {
      id: "template-end",
      label: "Levent, Beşiktaş, İstanbul",
      lat: 41.0812,
      lng: 29.01,
      source: "history",
    };

    setCreateName("Sabah Merkez Ring");
    setCreateScheduledTime("08:15");
    setCreateTimeSlot("morning");
    setCreateStartSuggestion(templateStart);
    setCreateStartAddress(templateStart.label.slice(0, ROUTE_ADDRESS_MAX));
    setCreateIntermediateStops([templateIntermediate]);
    setCreateIntermediateStopQuery("");
    setCreateIntermediateStopSuggestion(null);
    setCreateEndSuggestion(templateEnd);
    setCreateEndAddress(templateEnd.label.slice(0, ROUTE_ADDRESS_MAX));
    setCreateAllowGuestTracking(true);
    setShowCreateValidation(false);
    setSelectedRouteId(null);
    setRouteStops(null);
    setShowCreatePanel(true);
  };

  const handleCopySelectedRouteToDraft = () => {
    if (!selectedRoute || !selectedRouteEndpoints.start || !selectedRouteEndpoints.end) {
      return;
    }
    const mapStopToSuggestion = (stop: CompanyRouteStopItem): AddressSuggestion => ({
      id: stop.stopId,
      label: stop.name,
      lat: stop.location.lat,
      lng: stop.location.lng,
      source: "history",
    });

    const selectedDraft = drafts[selectedRoute.routeId];
    setCreateName((selectedDraft?.name ?? selectedRoute.name).slice(0, ROUTE_NAME_MAX));
    setCreateScheduledTime(selectedDraft?.scheduledTime ?? selectedRoute.scheduledTime ?? "08:00");
    setCreateTimeSlot(selectedDraft?.timeSlot ?? selectedRoute.timeSlot ?? "custom");
    setCreateAllowGuestTracking(selectedDraft?.allowGuestTracking ?? selectedRoute.allowGuestTracking);
    setCreateStartSuggestion(selectedRouteEndpoints.start);
    setCreateStartAddress(selectedRouteEndpoints.start.label.slice(0, ROUTE_ADDRESS_MAX));
    setCreateEndSuggestion(selectedRouteEndpoints.end);
    setCreateEndAddress(selectedRouteEndpoints.end.label.slice(0, ROUTE_ADDRESS_MAX));
    setCreateIntermediateStops(routeIntermediateStops.map(mapStopToSuggestion));
    setCreateIntermediateStopQuery("");
    setCreateIntermediateStopSuggestion(null);
    setShowCreateValidation(false);
    setSelectedRouteId(null);
    setRouteStops(null);
    setShowCreatePanel(true);
  };

  const handleAddCreateIntermediateStop = () => {
    if (!createIntermediateStopSuggestion) {
      return;
    }
    setCreateIntermediateStops((prev) => [...prev, createIntermediateStopSuggestion]);
    setCreateIntermediateStopQuery("");
    setCreateIntermediateStopSuggestion(null);
    setShowCreateValidation(false);
  };

  const handleRemoveCreateIntermediateStop = (index: number) => {
    setCreateIntermediateStops((prev) => prev.filter((_, stopIndex) => stopIndex !== index));
    setShowCreateValidation(false);
  };

  const handleReorderCreateIntermediateStop = (fromIndex: number, toIndex: number) => {
    setCreateIntermediateStops((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const next = [...prev];
      const [movedStop] = next.splice(fromIndex, 1);
      if (!movedStop) {
        return prev;
      }
      next.splice(toIndex, 0, movedStop);
      return next;
    });
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
      const nextRoutes = (routes ?? []).map((item) => (item.routeId === routeId ? updated : item));
      setRoutes(nextRoutes);
      setDrafts((prev) => ({
        ...prev,
        [routeId]: {
          name: updated.name,
          scheduledTime: updated.scheduledTime ?? "08:00",
          timeSlot: updated.timeSlot ?? "custom",
          allowGuestTracking: updated.allowGuestTracking,
          isArchived: updated.isArchived,
        },
      }));
      if (updated.isArchived && selectedRouteId === routeId) {
        const nextSelectableRouteId =
          [...nextRoutes]
            .sort((left, right) => left.name.localeCompare(right.name, "tr"))
            .find((item) => item.routeId !== routeId && !item.isArchived)?.routeId ?? null;
        setSelectedRouteId(nextSelectableRouteId);
        setRouteStops(null);
      }
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rota güncellenemedi.";
      setErrorMessage(message);
    } finally {
      setSavingRouteId(null);
    }
  };

  const handleToggleArchiveRoute = async (routeId: string, nextArchived: boolean) => {
    if (!canMutate) {
      return;
    }

    const route = routes?.find((item) => item.routeId === routeId);
    if (!route) {
      return;
    }

    const confirmationMessage = nextArchived
      ? "Bu işlem rotayı kalıcı silmez. Rota arşive taşınır ve aktif listeden kaldırılır. Devam edilsin mi?"
      : "Bu rotayı tekrar aktif listeye almak istiyor musun?";
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setArchivingRouteId(routeId);
    try {
      const updated = await updateCompanyRouteForCompany({
        companyId,
        routeId,
        isArchived: nextArchived,
      });
      const nextRoutes = (routes ?? []).map((item) => (item.routeId === routeId ? updated : item));
      setRoutes(nextRoutes);
      setDrafts((prev) => ({
        ...prev,
        [routeId]: {
          name: updated.name,
          scheduledTime: updated.scheduledTime ?? "08:00",
          timeSlot: updated.timeSlot ?? "custom",
          allowGuestTracking: updated.allowGuestTracking,
          isArchived: updated.isArchived,
        },
      }));
      if (nextArchived && selectedRouteId === routeId) {
        const nextSelectableRouteId =
          [...nextRoutes]
            .sort((left, right) => left.name.localeCompare(right.name, "tr"))
            .find((item) => item.routeId !== routeId && !item.isArchived)?.routeId ?? null;
        setSelectedRouteId(nextSelectableRouteId);
        setRouteStops(null);
      }
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rota listeden kaldırılamadı.";
      setErrorMessage(message);
    } finally {
      setArchivingRouteId(null);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!canMutate || deletingRouteId) {
      return;
    }

    const route = routes?.find((item) => item.routeId === routeId);
    if (!route) {
      return;
    }

    const confirmed = window.confirm(
      `"${route.name}" rotası kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musun?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingRouteId(routeId);
    try {
      await deleteCompanyRouteForCompany({
        companyId,
        routeId,
      });

      const nextRoutes = (routes ?? []).filter((item) => item.routeId !== routeId);
      setRoutes(nextRoutes);
      setDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[routeId];
        return nextDrafts;
      });

      if (selectedRouteId === routeId) {
        const nextSelectableRouteId =
          [...nextRoutes]
            .sort((left, right) => left.name.localeCompare(right.name, "tr"))[0]?.routeId ?? null;
        setSelectedRouteId(nextSelectableRouteId);
        setRouteStops(null);
      }

      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rota kalıcı olarak silinemedi.";
      setErrorMessage(message);
    } finally {
      setDeletingRouteId(null);
    }
  };

  const handleAddStop = async () => {
    if (!canAddStop || !selectedRouteId || movingStopId) {
      return;
    }
    if (!stopAddressSuggestion) {
      setErrorMessage("Durak adresini listeden seçin.");
      return;
    }
    const orderParsed = Math.max(0, (sortedRouteStops.at(-1)?.order ?? -1) + 1);
    const fallbackStopName = stopAddressSuggestion.label.trim().slice(0, STOP_NAME_MAX);
    const resolvedStopName = stopName.trim().length >= 2 ? stopName.trim() : fallbackStopName;
    if (resolvedStopName.length < 2 || resolvedStopName.length > STOP_NAME_MAX) {
      setErrorMessage("Durak adı 2-80 karakter arasında olmalı.");
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
      const message = error instanceof Error ? error.message : "Durak sırası güncellenemedi.";
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
      const message = error instanceof Error ? error.message : "Durak sıralaması güncellenemedi.";
      setErrorMessage(message);
    } finally {
      setMovingStopId(null);
    }
  };

  // ─── Unified map waypoints ────────────────────────────────────
  const unifiedWaypoints = useMemo<RouteWaypoint[]>(() => {
    // Priority 1: If user selected a route → show its stops + pending suggestion
    if (selectedRoute) {
      const points: RouteWaypoint[] = [];

      if (selectedRouteEndpoints.start) {
        points.push({
          id: `route-start-${selectedRoute.routeId}`,
          label: selectedRouteEndpoints.start.label,
          lat: selectedRouteEndpoints.start.lat,
          lng: selectedRouteEndpoints.start.lng,
          type: "start",
        });
      }

      for (const stop of routeIntermediateStops) {
        points.push({
          id: stop.stopId,
          label: stop.name || `Durak ${stop.order + 1}`,
          lat: stop.location.lat,
          lng: stop.location.lng,
          type: "stop",
        });
      }
      if (stopAddressSuggestion) {
        points.push({
          id: "__pending__",
          label: `⊕ ${stopName || stopAddressQuery || "Yeni durak"}`,
          lat: stopAddressSuggestion.lat,
          lng: stopAddressSuggestion.lng,
          type: "stop",
        });
      }
      if (selectedRouteEndpoints.end) {
        points.push({
          id: `route-end-${selectedRoute.routeId}`,
          label: selectedRouteEndpoints.end.label,
          lat: selectedRouteEndpoints.end.lat,
          lng: selectedRouteEndpoints.end.lng,
          type: "end",
        });
      }
      if (points.length > 0) {
        return points;
      }
    }

    // Priority 2: Creating a new route → show start/intermediate/end suggestions
    const createPoints: RouteWaypoint[] = [];
    if (createStartSuggestion) {
      createPoints.push({
        id: "create-start",
        label: createStartSuggestion.label,
        lat: createStartSuggestion.lat,
        lng: createStartSuggestion.lng,
        type: "start",
      });
    }
    for (const [index, stop] of createIntermediateStops.entries()) {
      createPoints.push({
        id: `create-stop-${stop.id}-${index}`,
        label: stop.label,
        lat: stop.lat,
        lng: stop.lng,
        type: "stop",
      });
    }
    if (createIntermediateStopSuggestion) {
      createPoints.push({
        id: "__create_pending_stop__",
        label: `⊕ ${createIntermediateStopQuery || createIntermediateStopSuggestion.label}`,
        lat: createIntermediateStopSuggestion.lat,
        lng: createIntermediateStopSuggestion.lng,
        type: "stop",
      });
    }
    if (createEndSuggestion) {
      createPoints.push({
        id: "create-end",
        label: createEndSuggestion.label,
        lat: createEndSuggestion.lat,
        lng: createEndSuggestion.lng,
        type: "end",
      });
    }
    return createPoints;
  }, [
    selectedRoute,
    selectedRouteEndpoints,
    routeIntermediateStops,
    stopAddressSuggestion,
    stopName,
    stopAddressQuery,
    createStartSuggestion,
    createIntermediateStops,
    createIntermediateStopSuggestion,
    createIntermediateStopQuery,
    createEndSuggestion,
  ]);

  // ─── Click-to-add-stop via map click + reverse geocode ───────
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (!canMutate) {
        return;
      }

      let resolvedSuggestion: AddressSuggestion | null = null;
      const token = getPublicMapboxToken();

      if (token) {
        try {
          const mapboxResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,poi,place&language=tr&limit=1`,
          );
          if (mapboxResponse.ok) {
            const data = await mapboxResponse.json();
            const feature = data?.features?.[0];
            if (feature) {
              const label = String(feature.place_name_tr || feature.place_name || "")
                .replace(/,\s*Türkiye$/i, "")
                .trim();
              const center = feature.center as [number, number];
              resolvedSuggestion = {
                id: feature.id ?? `${center[1]}_${center[0]}`,
                label,
                lat: center[1],
                lng: center[0],
                source: "mapbox",
              };
            }
          }
        } catch {
          // continue with fallback
        }
      }

      if (!resolvedSuggestion) {
        try {
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=tr`,
            {
              headers: {
                "Accept-Language": "tr",
              },
            },
          );
          if (nominatimResponse.ok) {
            const data = (await nominatimResponse.json()) as { display_name?: string };
            const label = (data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
              .replace(/,\s*Türkiye$/i, "")
              .trim();
            resolvedSuggestion = {
              id: `nominatim_${lat.toFixed(6)}_${lng.toFixed(6)}`,
              label,
              lat,
              lng,
              source: "history",
            };
          }
        } catch {
          // ignore
        }
      }

      if (!resolvedSuggestion) {
        return;
      }

      if (selectedRouteId) {
        setStopAddressSuggestion(resolvedSuggestion);
        setStopAddressQuery(resolvedSuggestion.label.slice(0, ROUTE_ADDRESS_MAX));
        setStopName("");
        return;
      }

      if (!createStartSuggestion) {
        setCreateStartSuggestion(resolvedSuggestion);
        setCreateStartAddress(resolvedSuggestion.label.slice(0, ROUTE_ADDRESS_MAX));
      } else if (!createEndSuggestion) {
        setCreateEndSuggestion(resolvedSuggestion);
        setCreateEndAddress(resolvedSuggestion.label.slice(0, ROUTE_ADDRESS_MAX));
      } else {
        setCreateIntermediateStopSuggestion(resolvedSuggestion);
        setCreateIntermediateStopQuery(resolvedSuggestion.label.slice(0, ROUTE_ADDRESS_MAX));
      }
    },
    [selectedRouteId, canMutate, createStartSuggestion, createEndSuggestion],
  );

  useEffect(() => {
    if (!showCreatePanel) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCreatePanel(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showCreatePanel]);

  const createRouteDrawer = showCreatePanel ? (
    <div
      className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-[2px]"
      onClick={handleCloseCreatePanel}
      role="presentation"
    >
      <div className="absolute inset-3 sm:inset-4 lg:inset-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex h-full min-h-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(480px,620px)]">
          <section className="flex h-[34vh] min-h-[320px] flex-col overflow-hidden rounded-[28px] border border-line bg-white/95 shadow-2xl lg:h-full">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Canlı önizleme</div>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Rota haritası</h2>
                <p className="mt-1 text-sm text-muted">
                  Harita Gebze merkezinden açılır. Noktaları seçtikçe rota ve duraklar burada otomatik güncellenir.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">
                {unifiedWaypoints.length > 0 ? `${unifiedWaypoints.length} nokta hazır` : "Gebze görünümü"}
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-slate-100">
              <RouteCreationMapPreview
                waypoints={unifiedWaypoints}
                height="100%"
                onMapClick={canMutate ? handleMapClick : undefined}
                autoDrawRoute
              />
            </div>
          </section>

          <aside
            className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-line bg-white/95 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Yeni rota oluştur"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Yeni rota</div>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Rota oluşturma paneli</h2>
                <p className="mt-1 text-sm text-muted">
                  Başlangıç, ara duraklar ve bitişi tek akışta tamamla. Sol tarafta canlı harita hep görünür kalsın.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCreatePanel}
                className="glass-button shrink-0 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <RouteCreateSection
                canMutate={canMutate}
                createName={createName}
                createScheduledTime={createScheduledTime}
                createStartAddress={createStartAddress}
                createEndAddress={createEndAddress}
                createStartSuggestion={createStartSuggestion}
                createEndSuggestion={createEndSuggestion}
                createIntermediateStopQuery={createIntermediateStopQuery}
                createIntermediateStopSuggestion={createIntermediateStopSuggestion}
                createIntermediateStops={createIntermediateStops}
                createTimeSlot={createTimeSlot}
                createAllowGuestTracking={createAllowGuestTracking}
                createPending={createPending}
                canCreate={canCreate}
                showCreateValidation={showCreateValidation}
                createValidationIssues={createValidationIssues}
                timeSlotOptions={TIME_SLOT_OPTIONS}
                canCopyFromSelectedRoute={canCopyFromSelectedRoute}
                surface="plain"
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
                onSetCreateIntermediateStopQuery={(value) => {
                  setCreateIntermediateStopQuery(value.slice(0, ROUTE_ADDRESS_MAX));
                  setCreateIntermediateStopSuggestion(null);
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
                onSelectCreateIntermediateStopSuggestion={(suggestion) => {
                  setCreateIntermediateStopSuggestion(suggestion);
                  setCreateIntermediateStopQuery(suggestion.label.slice(0, ROUTE_ADDRESS_MAX));
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
                onSwapCreateEndpoints={handleSwapCreateEndpoints}
                onApplyRouteTemplate={handleApplyRouteTemplate}
                onCopySelectedRouteToDraft={handleCopySelectedRouteToDraft}
                onAddCreateIntermediateStop={handleAddCreateIntermediateStop}
                onRemoveCreateIntermediateStop={handleRemoveCreateIntermediateStop}
                onReorderCreateIntermediateStop={handleReorderCreateIntermediateStop}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
      {/* ─── Left panel: forms & lists (scrollable) ─── */}
      <div className="w-full space-y-4 lg:w-[45%] lg:min-w-[380px]">
        <section className="glass-panel rounded-2xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Yeni rota akışı</div>
              <p className="mt-1 text-xs text-muted">
                Ana ekran rota listesi ve detay için sade kalsın. Oluşturma formunu sadece gerektiğinde aç.
              </p>
            </div>
            <button
              type="button"
              onClick={showCreatePanel ? handleCloseCreatePanel : handleOpenCreatePanel}
              className="glass-button rounded-xl px-3 py-2 text-xs font-semibold"
            >
              {showCreatePanel ? "Formu gizle" : "Yeni rota oluştur"}
            </button>
          </div>
        </section>


        <RouteListSection
          routes={routes}
          sortedRoutes={sortedRoutes}
          selectedRouteId={selectedRouteId}
          canMutate={canMutate}
          drafts={drafts}
          setDrafts={setDrafts}
          savingRouteId={savingRouteId}
          archivingRouteId={archivingRouteId}
          deletingRouteId={deletingRouteId}
          routeDriverNames={routeDriverNames}
          errorMessage={errorMessage}
          timeSlotOptions={TIME_SLOT_OPTIONS}
          onRefresh={() => setRefreshNonce((prev) => prev + 1)}
          onSaveRoute={handleSaveRoute}
          onSelectRoute={handleSelectRoute}
          onToggleArchiveRoute={handleToggleArchiveRoute}
          onDeleteRoute={handleDeleteRoute}
          onStartCreateRoute={handleOpenCreatePanel}
        />

        {selectedRoute && !showCreatePanel && (
          <RoutePerformanceSummary
            companyId={companyId}
            selectedRoute={selectedRoute}
            sortedRouteStops={routeIntermediateStops}
            driverName={selectedRoute.driverId ? routeDriverNames[selectedRoute.routeId] ?? null : null}
          />
        )}

        {!showCreatePanel ? (
          <RouteStopsSection
            selectedRoute={selectedRoute}
            canMutate={canMutate}
            stopName={stopName}
            stopAddressQuery={stopAddressQuery}
            stopAddressSuggestion={stopAddressSuggestion}
            stopActionPending={stopActionPending}
            canAddStop={canAddStop}
            loadingStops={loadingStops}
            sortedRouteStops={routeIntermediateStops}
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
        ) : null}
      </div>

      {/* ─── Right panel: persistent map ─── */}
      <div className="order-first w-full lg:order-last lg:w-[55%]">
        <div className="lg:sticky lg:top-4">
          <RouteCreationMapPreview
            waypoints={unifiedWaypoints}
            height="calc(100vh - 120px)"
            onMapClick={canMutate ? handleMapClick : undefined}
          />
        </div>
      </div>
      </div>
      {createRouteDrawer}
    </>
  );
}
