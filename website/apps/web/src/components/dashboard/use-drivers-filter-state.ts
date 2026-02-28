"use client";

import { useCallback, useState } from "react";

import type {
  DriverRoleFilter,
  DriverSortOption,
  DriverStatusFilter,
} from "@/components/dashboard/drivers-company-members-helpers";

type SyncFilterQuery = (next: {
  q: string;
  role: DriverRoleFilter;
  status: DriverStatusFilter;
  sort: DriverSortOption;
  page: number;
}) => void;

type UseDriversFilterStateInput = {
  searchTextFromQuery: string | null;
  roleFromQuery: DriverRoleFilter | null;
  statusFromQuery: DriverStatusFilter | null;
  sortFromQuery: DriverSortOption | null;
  pageFromQuery: number | null;
  syncFilterQuery: SyncFilterQuery;
};

export function useDriversFilterState({
  searchTextFromQuery,
  roleFromQuery,
  statusFromQuery,
  sortFromQuery,
  pageFromQuery,
  syncFilterQuery,
}: UseDriversFilterStateInput) {
  const [searchText, setSearchText] = useState(searchTextFromQuery ?? "");
  const [roleFilter, setRoleFilter] = useState<DriverRoleFilter>(roleFromQuery ?? "all");
  const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>(statusFromQuery ?? "all");
  const [sortOption, setSortOption] = useState<DriverSortOption>(sortFromQuery ?? "name_asc");

  const effectiveSearchText = searchTextFromQuery ?? searchText;
  const effectiveRoleFilter = roleFromQuery ?? roleFilter;
  const effectiveStatusFilter = statusFromQuery ?? statusFilter;
  const effectiveSortOption = sortFromQuery ?? sortOption;
  const effectivePage = pageFromQuery ?? 1;

  const syncFiltersForPage = useCallback(
    (
      nextPage: number,
      overrides?: Partial<{
        q: string;
        role: DriverRoleFilter;
        status: DriverStatusFilter;
        sort: DriverSortOption;
      }>,
    ) => {
      syncFilterQuery({
        q: overrides?.q ?? effectiveSearchText,
        role: overrides?.role ?? effectiveRoleFilter,
        status: overrides?.status ?? effectiveStatusFilter,
        sort: overrides?.sort ?? effectiveSortOption,
        page: nextPage,
      });
    },
    [effectiveRoleFilter, effectiveSearchText, effectiveSortOption, effectiveStatusFilter, syncFilterQuery],
  );

  const handleSearchTextChange = useCallback(
    (nextQ: string) => {
      setSearchText(nextQ);
      syncFiltersForPage(1, { q: nextQ });
    },
    [syncFiltersForPage],
  );
  const handleRoleFilterChange = useCallback(
    (nextRole: DriverRoleFilter) => {
      setRoleFilter(nextRole);
      syncFiltersForPage(1, { role: nextRole });
    },
    [syncFiltersForPage],
  );
  const handleStatusFilterChange = useCallback(
    (nextStatus: DriverStatusFilter) => {
      setStatusFilter(nextStatus);
      syncFiltersForPage(1, { status: nextStatus });
    },
    [syncFiltersForPage],
  );
  const handleSortOptionChange = useCallback(
    (nextSort: DriverSortOption) => {
      setSortOption(nextSort);
      syncFiltersForPage(1, { sort: nextSort });
    },
    [syncFiltersForPage],
  );
  const handleResetFilters = useCallback(() => {
    setSearchText("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortOption("name_asc");
    syncFiltersForPage(1, {
      q: "",
      role: "all",
      status: "all",
      sort: "name_asc",
    });
  }, [syncFiltersForPage]);

  return {
    effectiveSearchText,
    effectiveRoleFilter,
    effectiveStatusFilter,
    effectiveSortOption,
    effectivePage,
    syncFiltersForPage,
    handleSearchTextChange,
    handleRoleFilterChange,
    handleStatusFilterChange,
    handleSortOptionChange,
    handleResetFilters,
  };
}
