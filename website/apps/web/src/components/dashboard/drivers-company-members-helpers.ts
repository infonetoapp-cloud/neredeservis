"use client";

import type { CompanyMemberSummary } from "@/features/company/company-types";

export type DriverSortOption = "name_asc" | "name_desc" | "role" | "status";
export type DriverRoleFilter = "all" | "owner" | "admin" | "dispatcher" | "viewer";
export type DriverStatusFilter = "all" | "active" | "invited" | "suspended";

export function roleLabel(role: "owner" | "admin" | "dispatcher" | "viewer") {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "dispatcher":
      return "Dispatcher";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}

export function memberStatusLabel(status: "active" | "invited" | "suspended") {
  switch (status) {
    case "active":
      return "Active";
    case "invited":
      return "Invited";
    case "suspended":
      return "Suspended";
    default:
      return status;
  }
}

function roleOrder(role: "owner" | "admin" | "dispatcher" | "viewer"): number {
  if (role === "owner") return 0;
  if (role === "admin") return 1;
  if (role === "dispatcher") return 2;
  return 3;
}

function memberStatusOrder(status: "active" | "invited" | "suspended"): number {
  if (status === "active") return 0;
  if (status === "invited") return 1;
  return 2;
}

export function filterAndSortMembers(params: {
  items: CompanyMemberSummary[];
  searchText: string;
  roleFilter: DriverRoleFilter;
  statusFilter: DriverStatusFilter;
  sortOption: DriverSortOption;
}): CompanyMemberSummary[] {
  const { items, searchText, roleFilter, statusFilter, sortOption } = params;
  const normalizedSearch = searchText.trim().toLocaleLowerCase("tr");

  const filtered = items.filter((item) => {
    const roleMatch = roleFilter === "all" ? true : item.role === roleFilter;
    const statusMatch = statusFilter === "all" ? true : item.memberStatus === statusFilter;
    const searchMatch =
      normalizedSearch.length === 0
        ? true
        : [item.displayName, item.email ?? "", item.phone ?? "", item.uid, item.role, item.memberStatus]
            .join(" ")
            .toLocaleLowerCase("tr")
            .includes(normalizedSearch);
    return roleMatch && statusMatch && searchMatch;
  });

  const sorted = [...filtered];
  sorted.sort((left, right) => {
    if (sortOption === "name_desc") {
      return right.displayName.localeCompare(left.displayName, "tr");
    }
    if (sortOption === "role") {
      const roleDelta = roleOrder(left.role) - roleOrder(right.role);
      if (roleDelta !== 0) return roleDelta;
      return left.displayName.localeCompare(right.displayName, "tr");
    }
    if (sortOption === "status") {
      const statusDelta = memberStatusOrder(left.memberStatus) - memberStatusOrder(right.memberStatus);
      if (statusDelta !== 0) return statusDelta;
      return left.displayName.localeCompare(right.displayName, "tr");
    }
    return left.displayName.localeCompare(right.displayName, "tr");
  });

  return sorted;
}
