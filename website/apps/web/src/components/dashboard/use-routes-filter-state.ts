"use client";

import { useCallback, useState } from "react";

import type {
  RouteSortOption,
  RouteStatusFilter,
  RouteTimeSlotFilter,
} from "@/components/dashboard/routes-company-routes-helpers";

type SyncFilterQuery = (next: {
  q: string;
  status: RouteStatusFilter;
  slot: RouteTimeSlotFilter;
  sort: RouteSortOption;
  page: number;
}) => void;

type UseRoutesFilterStateInput = {
  searchTextFromQuery: string | null;
  statusFromQuery: RouteStatusFilter | null;
  timeSlotFromQuery: RouteTimeSlotFilter | null;
  sortFromQuery: RouteSortOption | null;
  pageFromQuery: number | null;
  syncFilterQuery: SyncFilterQuery;
};

export function useRoutesFilterState({
  searchTextFromQuery,
  statusFromQuery,
  timeSlotFromQuery,
  sortFromQuery,
  pageFromQuery,
  syncFilterQuery,
}: UseRoutesFilterStateInput) {
  const [searchText, setSearchText] = useState(searchTextFromQuery ?? "");
  const [statusFilter, setStatusFilter] = useState<RouteStatusFilter>(statusFromQuery ?? "all");
  const [timeSlotFilter, setTimeSlotFilter] = useState<RouteTimeSlotFilter>(timeSlotFromQuery ?? "all");
  const [sortOption, setSortOption] = useState<RouteSortOption>(sortFromQuery ?? "updated_desc");

  const effectiveSearchText = searchTextFromQuery ?? searchText;
  const effectiveStatusFilter = statusFromQuery ?? statusFilter;
  const effectiveTimeSlotFilter = timeSlotFromQuery ?? timeSlotFilter;
  const effectiveSortOption = sortFromQuery ?? sortOption;
  const effectivePage = pageFromQuery ?? 1;

  const syncFiltersForPage = useCallback(
    (
      nextPage: number,
      overrides?: Partial<{
        q: string;
        status: RouteStatusFilter;
        slot: RouteTimeSlotFilter;
        sort: RouteSortOption;
      }>,
    ) => {
      syncFilterQuery({
        q: overrides?.q ?? effectiveSearchText,
        status: overrides?.status ?? effectiveStatusFilter,
        slot: overrides?.slot ?? effectiveTimeSlotFilter,
        sort: overrides?.sort ?? effectiveSortOption,
        page: nextPage,
      });
    },
    [effectiveSearchText, effectiveSortOption, effectiveStatusFilter, effectiveTimeSlotFilter, syncFilterQuery],
  );

  const handleSearchTextChange = useCallback(
    (nextQ: string) => {
      setSearchText(nextQ);
      syncFiltersForPage(1, { q: nextQ });
    },
    [syncFiltersForPage],
  );
  const handleStatusFilterChange = useCallback(
    (nextStatus: RouteStatusFilter) => {
      setStatusFilter(nextStatus);
      syncFiltersForPage(1, { status: nextStatus });
    },
    [syncFiltersForPage],
  );
  const handleTimeSlotFilterChange = useCallback(
    (nextSlot: RouteTimeSlotFilter) => {
      setTimeSlotFilter(nextSlot);
      syncFiltersForPage(1, { slot: nextSlot });
    },
    [syncFiltersForPage],
  );
  const handleSortOptionChange = useCallback(
    (nextSort: RouteSortOption) => {
      setSortOption(nextSort);
      syncFiltersForPage(1, { sort: nextSort });
    },
    [syncFiltersForPage],
  );
  const handleResetFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("all");
    setTimeSlotFilter("all");
    setSortOption("updated_desc");
    syncFiltersForPage(1, {
      q: "",
      status: "all",
      slot: "all",
      sort: "updated_desc",
    });
  }, [syncFiltersForPage]);

  return {
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveTimeSlotFilter,
    effectiveSortOption,
    effectivePage,
    syncFiltersForPage,
    handleSearchTextChange,
    handleStatusFilterChange,
    handleTimeSlotFilterChange,
    handleSortOptionChange,
    handleResetFilters,
  };
}
