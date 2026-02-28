"use client";

import type { CompanyRouteSummary } from "@/features/company/company-types";

export type RouteSortOption =
  | "updated_desc"
  | "name_asc"
  | "name_desc"
  | "time_asc"
  | "time_desc";

export type RouteStatusFilter = "all" | "active" | "archived";
export type RouteTimeSlotFilter =
  | "all"
  | "morning"
  | "midday"
  | "evening"
  | "custom"
  | "unspecified";

export function timeSlotLabel(
  value: "morning" | "evening" | "midday" | "custom" | null,
): string {
  switch (value) {
    case "morning":
      return "Sabah";
    case "midday":
      return "Ogle";
    case "evening":
      return "Aksam";
    case "custom":
      return "Custom";
    default:
      return "-";
  }
}

export function routeStatusLabel(isArchived: boolean): string {
  return isArchived ? "Arsiv" : "Aktif";
}

export function filterAndSortRoutes(params: {
  items: CompanyRouteSummary[];
  searchText: string;
  statusFilter: RouteStatusFilter;
  timeSlotFilter: RouteTimeSlotFilter;
  sortOption: RouteSortOption;
}): CompanyRouteSummary[] {
  const { items, searchText, statusFilter, timeSlotFilter, sortOption } = params;
  const normalizedSearch = searchText.trim().toLocaleLowerCase("tr");

  const filtered = items.filter((item) => {
    const statusMatch =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? !item.isArchived
          : item.isArchived;
    const timeSlotMatch =
      timeSlotFilter === "all"
        ? true
        : timeSlotFilter === "unspecified"
          ? item.timeSlot === null
          : item.timeSlot === timeSlotFilter;
    const searchMatch =
      normalizedSearch.length === 0
        ? true
        : [
            item.name,
            item.srvCode ?? "",
            item.driverId ?? "",
            item.scheduledTime ?? "",
            item.timeSlot ?? "",
            routeStatusLabel(item.isArchived),
          ]
            .join(" ")
            .toLocaleLowerCase("tr")
            .includes(normalizedSearch);
    return statusMatch && timeSlotMatch && searchMatch;
  });

  const sorted = [...filtered];
  sorted.sort((left, right) => {
    if (sortOption === "name_asc") {
      return left.name.localeCompare(right.name, "tr");
    }
    if (sortOption === "name_desc") {
      return right.name.localeCompare(left.name, "tr");
    }
    if (sortOption === "time_asc") {
      return (left.scheduledTime ?? "99:99").localeCompare(right.scheduledTime ?? "99:99", "tr");
    }
    if (sortOption === "time_desc") {
      return (right.scheduledTime ?? "00:00").localeCompare(left.scheduledTime ?? "00:00", "tr");
    }
    const rightMs = right.updatedAt ? Date.parse(right.updatedAt) : 0;
    const leftMs = left.updatedAt ? Date.parse(left.updatedAt) : 0;
    if (rightMs !== leftMs) return rightMs - leftMs;
    return left.name.localeCompare(right.name, "tr");
  });

  return sorted;
}
