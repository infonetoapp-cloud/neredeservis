"use client";

import type {
  VehicleSortOption,
  VehicleStatusFilter,
} from "@/components/dashboard/vehicles-company-vehicles-helpers";

type ParsedVehiclesQuery = {
  vehicleIdFromQuery: string | null;
  searchTextFromQuery: string | null;
  statusFromQuery: VehicleStatusFilter | null;
  sortFromQuery: VehicleSortOption | null;
  pageFromQuery: number | null;
};

type VehicleFilterQueryInput = {
  q: string;
  status: VehicleStatusFilter;
  sort: VehicleSortOption;
  page: number;
};

export function readVehiclesQuery(searchParams: URLSearchParams): ParsedVehiclesQuery {
  const vehicleIdFromQuery = searchParams.get("vehicleId");
  const searchTextFromQuery = searchParams.get("q");
  const statusFromQueryRaw = searchParams.get("status");
  const sortFromQueryRaw = searchParams.get("sort");
  const pageFromQueryRaw = searchParams.get("page");

  const statusFromQuery: VehicleStatusFilter | null =
    statusFromQueryRaw === "active" ||
    statusFromQueryRaw === "maintenance" ||
    statusFromQueryRaw === "inactive"
      ? statusFromQueryRaw
      : null;
  const sortFromQuery: VehicleSortOption | null =
    sortFromQueryRaw === "plate_asc" ||
    sortFromQueryRaw === "plate_desc" ||
    sortFromQueryRaw === "updated_desc" ||
    sortFromQueryRaw === "status"
      ? sortFromQueryRaw
      : null;
  const parsedPage = pageFromQueryRaw ? Number.parseInt(pageFromQueryRaw, 10) : null;
  const pageFromQuery = parsedPage && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : null;

  return { vehicleIdFromQuery, searchTextFromQuery, statusFromQuery, sortFromQuery, pageFromQuery };
}

export function buildVehiclesFilterQueryString(
  searchParams: URLSearchParams,
  next: VehicleFilterQueryInput,
): string {
  const params = new URLSearchParams(searchParams.toString());

  if (next.q.trim()) {
    params.set("q", next.q.trim());
  } else {
    params.delete("q");
  }

  if (next.status !== "all") {
    params.set("status", next.status);
  } else {
    params.delete("status");
  }

  if (next.sort !== "plate_asc") {
    params.set("sort", next.sort);
  } else {
    params.delete("sort");
  }
  if (next.page > 1) {
    params.set("page", String(next.page));
  } else {
    params.delete("page");
  }

  return params.toString();
}

export function buildVehiclesSelectedVehicleQueryString(
  searchParams: URLSearchParams,
  vehicleId: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (vehicleId) {
    params.set("vehicleId", vehicleId);
  } else {
    params.delete("vehicleId");
  }
  return params.toString();
}
