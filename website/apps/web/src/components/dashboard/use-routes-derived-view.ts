"use client";

import { useMemo, type ComponentProps } from "react";

import {
  filterAndSortRoutes,
  type RouteSortOption,
} from "@/components/dashboard/routes-company-routes-helpers";
import { RoutesListSection } from "@/components/dashboard/routes-list-section";
import type { CompanyRouteSummary } from "@/features/company/company-types";

type RoutesListSectionProps = ComponentProps<typeof RoutesListSection>;

type UseRoutesDerivedViewInput = {
  routesItems: CompanyRouteSummary[];
  activeCompanyName: string | null;
  routeIdFromQuery: string | null;
  memberUidFromQuery: string | null;
  selectedRouteIdPreference: string | null;
  effectiveSearchText: string;
  effectiveStatusFilter: "all" | "active" | "archived";
  effectiveTimeSlotFilter: "all" | "morning" | "midday" | "evening" | "custom" | "unspecified";
  effectiveSortOption: RouteSortOption;
  effectivePage: number;
  density: "comfortable" | "compact";
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "active" | "archived") => void;
  onTimeSlotFilterChange: (value: "all" | "morning" | "midday" | "evening" | "custom" | "unspecified") => void;
  onSortOptionChange: (value: RouteSortOption) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onSelectRoute: (routeId: string) => void;
  onClearMemberFocus: (selectedRouteId: string | null) => void;
};

type UseRoutesDerivedViewOutput = {
  filteredRoutes: CompanyRouteSummary[];
  preferredMemberRouteId: string | null;
  selectedRoute: CompanyRouteSummary | null;
  selectedRouteId: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  routesListProps: RoutesListSectionProps;
};

export function useRoutesDerivedView(input: UseRoutesDerivedViewInput): UseRoutesDerivedViewOutput {
  const {
    routesItems,
    activeCompanyName,
    routeIdFromQuery,
    memberUidFromQuery,
    selectedRouteIdPreference,
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveTimeSlotFilter,
    effectiveSortOption,
    effectivePage,
    density,
    onSearchTextChange,
    onStatusFilterChange,
    onTimeSlotFilterChange,
    onSortOptionChange,
    onResetFilters,
    onPageChange,
    onSelectRoute,
    onClearMemberFocus,
  } = input;

  const filteredRoutes = useMemo(
    () =>
      filterAndSortRoutes({
        items: routesItems,
        searchText: effectiveSearchText,
        statusFilter: effectiveStatusFilter,
        timeSlotFilter: effectiveTimeSlotFilter,
        sortOption: effectiveSortOption,
      }),
    [routesItems, effectiveSearchText, effectiveStatusFilter, effectiveTimeSlotFilter, effectiveSortOption],
  );

  const pageSize = density === "compact" ? 18 : 12;
  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / pageSize));
  const currentPage = Math.min(Math.max(1, effectivePage), totalPages);
  const pagedRoutes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoutes.slice(start, start + pageSize);
  }, [currentPage, filteredRoutes, pageSize]);

  const routeStatusSummary = useMemo(
    () => ({
      active: routesItems.filter((item) => !item.isArchived).length,
      archived: routesItems.filter((item) => item.isArchived).length,
    }),
    [routesItems],
  );

  const preferredMemberRouteId = useMemo(() => {
    if (!memberUidFromQuery || filteredRoutes.length === 0) return null;
    const matched = filteredRoutes.find(
      (route) =>
        route.driverId === memberUidFromQuery || route.authorizedDriverIds.includes(memberUidFromQuery),
    );
    return matched?.routeId ?? null;
  }, [filteredRoutes, memberUidFromQuery]);

  const selectedRoute = useMemo(() => {
    if (filteredRoutes.length === 0) return null;
    const preferredId = routeIdFromQuery ?? preferredMemberRouteId ?? selectedRouteIdPreference;
    if (preferredId) {
      const preferred = filteredRoutes.find((item) => item.routeId === preferredId);
      if (preferred) {
        return preferred;
      }
    }
    return filteredRoutes[0] ?? null;
  }, [filteredRoutes, routeIdFromQuery, preferredMemberRouteId, selectedRouteIdPreference]);
  const selectedRouteId = selectedRoute?.routeId ?? null;

  const routesListProps = useMemo<RoutesListSectionProps>(
    () => ({
      activeCompanyName,
      routeIdFromQuery,
      memberUidFromQuery,
      visibleRoutes: pagedRoutes,
      filteredRoutesCount: filteredRoutes.length,
      routeStatusSummary,
      totalRoutesCount: routesItems.length,
      currentPage,
      totalPages,
      density,
      searchText: effectiveSearchText,
      statusFilter: effectiveStatusFilter,
      timeSlotFilter: effectiveTimeSlotFilter,
      sortOption: effectiveSortOption,
      selectedRouteId,
      onSearchTextChange,
      onStatusFilterChange,
      onTimeSlotFilterChange,
      onSortOptionChange,
      onResetFilters,
      onPageChange,
      onClearMemberFocus: () => onClearMemberFocus(selectedRouteId),
      onSelectRoute,
    }),
    [
      activeCompanyName,
      routeIdFromQuery,
      memberUidFromQuery,
      pagedRoutes,
      filteredRoutes.length,
      routeStatusSummary,
      routesItems.length,
      currentPage,
      totalPages,
      density,
      effectiveSearchText,
      effectiveStatusFilter,
      effectiveTimeSlotFilter,
      effectiveSortOption,
      selectedRouteId,
      onSearchTextChange,
      onStatusFilterChange,
      onTimeSlotFilterChange,
      onSortOptionChange,
      onResetFilters,
      onPageChange,
      onClearMemberFocus,
      onSelectRoute,
    ],
  );

  return {
    filteredRoutes,
    preferredMemberRouteId,
    selectedRoute,
    selectedRouteId,
    currentPage,
    totalPages,
    pageSize,
    routesListProps,
  };
}
