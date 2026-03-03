"use client";

import { useCallback, useMemo, useState, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { VehiclesListSection } from "@/components/dashboard/vehicles-list-section";
import {
  buildVehiclesFilterQueryString,
  buildVehiclesSelectedVehicleQueryString,
  readVehiclesQuery,
} from "@/components/dashboard/vehicles-query-helpers";
import { VehiclesSidePanel } from "@/components/dashboard/vehicles-side-panel";
import { VehiclesWorkspacePane } from "@/components/dashboard/vehicles-workspace-pane";
import { useVehiclesFilterState } from "@/components/dashboard/use-vehicles-filter-state";
import { useVehiclesQueryGuards } from "@/components/dashboard/use-vehicles-query-guards";
import { useCopyViewLink } from "@/components/dashboard/use-copy-view-link";
import {
  filterAndSortVehicles,
  type VehicleSortOption,
} from "@/components/dashboard/vehicles-company-vehicles-helpers";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { canMutateCompanyOperations } from "@/features/company/company-rbac";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyVehicles } from "@/features/company/use-company-vehicles";
import { useDashboardDensity } from "@/features/dashboard/use-dashboard-density";

type VehiclesListSectionProps = ComponentProps<typeof VehiclesListSection>;

export function VehiclesCompanyVehiclesFeature() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, user } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companyId = activeCompany?.companyId ?? null;
  const { vehicleIdFromQuery, searchTextFromQuery, statusFromQuery, sortFromQuery, pageFromQuery } =
    readVehiclesQuery(searchParams);
  const vehiclesQuery = useCompanyVehicles(
    companyId,
    authStatus === "signed_in" && Boolean(companyId),
  );
  const membersQuery = useCompanyMembers(
    companyId,
    authStatus === "signed_in" && Boolean(companyId),
  );
  const [selectedVehicleIdPreference, setSelectedVehicleIdPreference] = useState<string | null>(
    () => vehicleIdFromQuery,
  );
  const { copyViewLinkState: copyLinkState, copyViewLink } = useCopyViewLink();
  const density = useDashboardDensity();

  const syncFilterQuery = useCallback(
    (next: {
      q: string;
      status: "all" | "active" | "maintenance" | "inactive";
      sort: VehicleSortOption;
      page: number;
    }) => {
      const nextQuery = buildVehiclesFilterQueryString(searchParams, next);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/vehicles?${nextQuery}` : "/vehicles", { scroll: false });
    },
    [router, searchParams],
  );
  const {
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveSortOption,
    effectivePage,
    syncFiltersForPage,
    handleSearchTextChange,
    handleStatusFilterChange,
    handleSortOptionChange,
    handleResetFilters,
  } = useVehiclesFilterState({
    searchTextFromQuery,
    statusFromQuery,
    sortFromQuery,
    pageFromQuery,
    syncFilterQuery,
  });

  const syncSelectedVehicleQuery = useCallback(
    (nextVehicleId: string | null) => {
      const nextQuery = buildVehiclesSelectedVehicleQueryString(searchParams, nextVehicleId);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/vehicles?${nextQuery}` : "/vehicles", { scroll: false });
    },
    [router, searchParams],
  );

  const filteredVehicles = useMemo(
    () =>
      filterAndSortVehicles({
        items: vehiclesQuery.items,
        searchText: effectiveSearchText,
        statusFilter: effectiveStatusFilter,
        sortOption: effectiveSortOption,
      }),
    [vehiclesQuery.items, effectiveSearchText, effectiveStatusFilter, effectiveSortOption],
  );
  const pageSize = density === "compact" ? 18 : 12;
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const currentPage = Math.min(Math.max(1, effectivePage), totalPages);
  const pagedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [currentPage, filteredVehicles, pageSize]);
  const vehicleStatusSummary = useMemo(
    () => ({
      active: vehiclesQuery.items.filter((item) => item.status === "active").length,
      maintenance: vehiclesQuery.items.filter((item) => item.status === "maintenance").length,
      inactive: vehiclesQuery.items.filter((item) => item.status === "inactive").length,
    }),
    [vehiclesQuery.items],
  );

  const selectedVehicle = useMemo(() => {
    if (filteredVehicles.length === 0) return null;
    const preferredId = vehicleIdFromQuery ?? selectedVehicleIdPreference;
    if (preferredId) {
      const preferred = filteredVehicles.find((item) => item.vehicleId === preferredId);
      if (preferred) return preferred;
    }
    return filteredVehicles[0] ?? null;
  }, [filteredVehicles, vehicleIdFromQuery, selectedVehicleIdPreference]);
  const selectedVehicleId = selectedVehicle?.vehicleId ?? null;
  const selectedVehicleTripsQuery = useCompanyActiveTrips(
    companyId,
    authStatus === "signed_in" && Boolean(companyId) && Boolean(selectedVehicle),
    {
      pageSize: 50,
    },
  );
  const actorMembership = useMemo(() => {
    if (!user) return null;
    return membersQuery.items.find((item) => item.uid === user.uid) ?? null;
  }, [membersQuery.items, user]);
  const actorRole = actorMembership?.role ?? null;
  const actorMemberStatus = actorMembership?.memberStatus ?? null;
  const canMutateVehicles = canMutateCompanyOperations(actorRole, actorMemberStatus);
  const selectedVehicleActiveTrips = useMemo(() => {
    if (!selectedVehicle) return [];
    const plate = selectedVehicle.plate.trim().toLowerCase();
    if (!plate) return [];
    return selectedVehicleTripsQuery.items.filter(
      (trip) => (trip.driverPlate ?? "").trim().toLowerCase() === plate,
    );
  }, [selectedVehicle, selectedVehicleTripsQuery.items]);

  useVehiclesQueryGuards({
    vehicleIdFromQuery,
    pageFromQuery,
    selectedVehicleId: selectedVehicle?.vehicleId ?? null,
    filteredVehicles,
    pageSize,
    currentPage,
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveSortOption,
    syncFilterQuery,
    syncSelectedVehicleQuery,
  });

  const handleCopyViewLink = useCallback(
    async () => copyViewLink("/vehicles", searchParams.toString()),
    [copyViewLink, searchParams],
  );
  const handleVehicleCreated = async ({ vehicleId }: { vehicleId: string }) => {
    await vehiclesQuery.reload();
    setSelectedVehicleIdPreference(vehicleId);
    syncSelectedVehicleQuery(vehicleId);
  };
  const vehiclesListProps = useMemo<VehiclesListSectionProps>(
    () => ({
      activeCompanyName: activeCompany?.companyName ?? null,
      vehicleIdFromQuery,
      visibleVehicles: pagedVehicles,
      filteredVehiclesCount: filteredVehicles.length,
      vehicleStatusSummary,
      totalVehiclesCount: vehiclesQuery.items.length,
      currentPage,
      totalPages,
      density,
      searchText: effectiveSearchText,
      statusFilter: effectiveStatusFilter,
      sortOption: effectiveSortOption,
      selectedVehicleId,
      onSearchTextChange: handleSearchTextChange,
      onStatusFilterChange: handleStatusFilterChange,
      onSortOptionChange: handleSortOptionChange,
      onResetFilters: handleResetFilters,
      onPageChange: syncFiltersForPage,
      onSelectVehicle: (vehicleId) => {
        setSelectedVehicleIdPreference(vehicleId);
        syncSelectedVehicleQuery(vehicleId);
      },
    }),
    [
      activeCompany?.companyName,
      currentPage,
      density,
      effectiveSearchText,
      effectiveSortOption,
      effectiveStatusFilter,
      filteredVehicles.length,
      handleResetFilters,
      handleSearchTextChange,
      handleSortOptionChange,
      handleStatusFilterChange,
      pagedVehicles,
      selectedVehicleId,
      syncFiltersForPage,
      syncSelectedVehicleQuery,
      totalPages,
      vehicleIdFromQuery,
      vehicleStatusSummary,
      vehiclesQuery.items.length,
    ],
  );

  const workspace = (
    <VehiclesWorkspacePane
      authStatus={authStatus}
      companyId={companyId}
      canMutateVehicles={canMutateVehicles}
      vehiclesStatus={vehiclesQuery.status}
      vehiclesError={vehiclesQuery.error}
      vehiclesCount={vehiclesQuery.items.length}
      vehiclesListProps={vehiclesListProps}
      onRetryVehicles={() => {
        void vehiclesQuery.reload();
      }}
      onVehicleCreated={handleVehicleCreated}
    />
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      {workspace}
      <VehiclesSidePanel
        actorRole={actorRole}
        actorMemberStatus={actorMemberStatus}
        selectedVehicle={selectedVehicle}
        companyId={companyId}
        activeTrips={selectedVehicleActiveTrips}
        activeTripsLoadStatus={selectedVehicleTripsQuery.status}
        filteredVehicles={filteredVehicles}
        selectedVehicleId={selectedVehicleId}
        copyLinkState={copyLinkState}
        onCopyViewLink={() => void handleCopyViewLink()}
        onSelectedVehicleIdChange={setSelectedVehicleIdPreference}
        onUpdated={() => vehiclesQuery.reload()}
      />
    </div>
  );
}
