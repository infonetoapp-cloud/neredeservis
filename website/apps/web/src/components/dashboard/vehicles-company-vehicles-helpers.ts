"use client";

import type { CompanyVehicleSummary } from "@/features/company/company-types";

export type VehicleSortOption = "plate_asc" | "plate_desc" | "updated_desc" | "status";
export type VehicleStatusFilter = "all" | "active" | "maintenance" | "inactive";

export function vehicleStatusLabel(status: string): string {
  if (status === "maintenance") return "Bakim";
  if (status === "inactive") return "Pasif";
  if (status === "active") return "Aktif";
  return status;
}

function vehicleStatusOrder(status: string): number {
  if (status === "active") return 0;
  if (status === "maintenance") return 1;
  if (status === "inactive") return 2;
  return 3;
}

export function filterAndSortVehicles(params: {
  items: CompanyVehicleSummary[];
  searchText: string;
  statusFilter: VehicleStatusFilter;
  sortOption: VehicleSortOption;
}) {
  const { items, searchText, statusFilter, sortOption } = params;
  const normalizedSearch = searchText.trim().toLocaleLowerCase("tr");
  const filtered = items.filter((item) => {
    const statusMatch = statusFilter === "all" ? true : item.status === statusFilter;
    const searchMatch =
      normalizedSearch.length === 0
        ? true
        : [
            item.plate,
            item.brand ?? "",
            item.model ?? "",
            item.vehicleId,
            item.status,
            item.year ? String(item.year) : "",
            item.capacity ? String(item.capacity) : "",
          ]
            .join(" ")
            .toLocaleLowerCase("tr")
            .includes(normalizedSearch);
    return statusMatch && searchMatch;
  });

  const sorted = [...filtered];
  sorted.sort((left, right) => {
    if (sortOption === "plate_desc") {
      return right.plate.localeCompare(left.plate, "tr");
    }
    if (sortOption === "updated_desc") {
      const rightMs = right.updatedAt ? Date.parse(right.updatedAt) : 0;
      const leftMs = left.updatedAt ? Date.parse(left.updatedAt) : 0;
      if (rightMs !== leftMs) return rightMs - leftMs;
      return left.plate.localeCompare(right.plate, "tr");
    }
    if (sortOption === "status") {
      const statusDelta = vehicleStatusOrder(left.status) - vehicleStatusOrder(right.status);
      if (statusDelta !== 0) return statusDelta;
      return left.plate.localeCompare(right.plate, "tr");
    }
    return left.plate.localeCompare(right.plate, "tr");
  });

  return sorted;
}
