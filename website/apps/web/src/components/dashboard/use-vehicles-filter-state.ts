"use client";

import { useCallback, useState } from "react";

import type {
  VehicleSortOption,
  VehicleStatusFilter,
} from "@/components/dashboard/vehicles-company-vehicles-helpers";

type SyncFilterQuery = (next: {
  q: string;
  status: VehicleStatusFilter;
  sort: VehicleSortOption;
  page: number;
}) => void;

type UseVehiclesFilterStateInput = {
  searchTextFromQuery: string | null;
  statusFromQuery: VehicleStatusFilter | null;
  sortFromQuery: VehicleSortOption | null;
  pageFromQuery: number | null;
  syncFilterQuery: SyncFilterQuery;
};

export function useVehiclesFilterState({
  searchTextFromQuery,
  statusFromQuery,
  sortFromQuery,
  pageFromQuery,
  syncFilterQuery,
}: UseVehiclesFilterStateInput) {
  const [searchText, setSearchText] = useState(searchTextFromQuery ?? "");
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>(statusFromQuery ?? "all");
  const [sortOption, setSortOption] = useState<VehicleSortOption>(sortFromQuery ?? "plate_asc");

  const effectiveSearchText = searchTextFromQuery ?? searchText;
  const effectiveStatusFilter = statusFromQuery ?? statusFilter;
  const effectiveSortOption = sortFromQuery ?? sortOption;
  const effectivePage = pageFromQuery ?? 1;

  const syncFiltersForPage = useCallback(
    (
      nextPage: number,
      overrides?: Partial<{
        q: string;
        status: VehicleStatusFilter;
        sort: VehicleSortOption;
      }>,
    ) => {
      syncFilterQuery({
        q: overrides?.q ?? effectiveSearchText,
        status: overrides?.status ?? effectiveStatusFilter,
        sort: overrides?.sort ?? effectiveSortOption,
        page: nextPage,
      });
    },
    [effectiveSearchText, effectiveSortOption, effectiveStatusFilter, syncFilterQuery],
  );

  const handleSearchTextChange = useCallback(
    (nextQ: string) => {
      setSearchText(nextQ);
      syncFiltersForPage(1, { q: nextQ });
    },
    [syncFiltersForPage],
  );
  const handleStatusFilterChange = useCallback(
    (nextStatus: VehicleStatusFilter) => {
      setStatusFilter(nextStatus);
      syncFiltersForPage(1, { status: nextStatus });
    },
    [syncFiltersForPage],
  );
  const handleSortOptionChange = useCallback(
    (nextSort: VehicleSortOption) => {
      setSortOption(nextSort);
      syncFiltersForPage(1, { sort: nextSort });
    },
    [syncFiltersForPage],
  );
  const handleResetFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("all");
    setSortOption("plate_asc");
    syncFiltersForPage(1, {
      q: "",
      status: "all",
      sort: "plate_asc",
    });
  }, [syncFiltersForPage]);

  return {
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveSortOption,
    effectivePage,
    syncFiltersForPage,
    handleSearchTextChange,
    handleStatusFilterChange,
    handleSortOptionChange,
    handleResetFilters,
  };
}
