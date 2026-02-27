"use client";

import { useEffect } from "react";

import type { CompanyVehicleSummary } from "@/features/company/company-types";
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

type UseVehiclesQueryGuardsInput = {
  vehicleIdFromQuery: string | null;
  pageFromQuery: number | null;
  selectedVehicleId: string | null;
  filteredVehicles: CompanyVehicleSummary[];
  pageSize: number;
  currentPage: number;
  effectiveSearchText: string;
  effectiveStatusFilter: VehicleStatusFilter;
  effectiveSortOption: VehicleSortOption;
  syncFilterQuery: SyncFilterQuery;
  syncSelectedVehicleQuery: (vehicleId: string | null) => void;
};

export function useVehiclesQueryGuards({
  vehicleIdFromQuery,
  pageFromQuery,
  selectedVehicleId,
  filteredVehicles,
  pageSize,
  currentPage,
  effectiveSearchText,
  effectiveStatusFilter,
  effectiveSortOption,
  syncFilterQuery,
  syncSelectedVehicleQuery,
}: UseVehiclesQueryGuardsInput) {
  useEffect(() => {
    if (!vehicleIdFromQuery) return;
    const queryVehicleStillVisible = filteredVehicles.some((item) => item.vehicleId === vehicleIdFromQuery);
    if (queryVehicleStillVisible) return;
    syncSelectedVehicleQuery(selectedVehicleId);
  }, [filteredVehicles, selectedVehicleId, syncSelectedVehicleQuery, vehicleIdFromQuery]);

  useEffect(() => {
    if (pageFromQuery === currentPage) return;
    syncFilterQuery({
      q: effectiveSearchText,
      status: effectiveStatusFilter,
      sort: effectiveSortOption,
      page: currentPage,
    });
  }, [
    currentPage,
    effectiveSearchText,
    effectiveSortOption,
    effectiveStatusFilter,
    pageFromQuery,
    syncFilterQuery,
  ]);

  useEffect(() => {
    if (!vehicleIdFromQuery) return;
    const vehicleIndex = filteredVehicles.findIndex((item) => item.vehicleId === vehicleIdFromQuery);
    if (vehicleIndex < 0) return;
    const targetPage = Math.floor(vehicleIndex / pageSize) + 1;
    if (targetPage === currentPage) return;
    syncFilterQuery({
      q: effectiveSearchText,
      status: effectiveStatusFilter,
      sort: effectiveSortOption,
      page: targetPage,
    });
  }, [
    currentPage,
    effectiveSearchText,
    effectiveSortOption,
    effectiveStatusFilter,
    filteredVehicles,
    pageSize,
    syncFilterQuery,
    vehicleIdFromQuery,
  ]);
}
