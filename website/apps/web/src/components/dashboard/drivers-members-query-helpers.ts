"use client";

import type {
  DriverRoleFilter,
  DriverSortOption,
  DriverStatusFilter,
} from "@/components/dashboard/drivers-company-members-helpers";

type DriversFilterQuery = {
  q: string;
  role: DriverRoleFilter;
  status: DriverStatusFilter;
  sort: DriverSortOption;
  page: number;
};

type ParsedDriversQuery = {
  memberUidFromQuery: string | null;
  searchTextFromQuery: string | null;
  roleFromQuery: DriverRoleFilter | null;
  statusFromQuery: DriverStatusFilter | null;
  sortFromQuery: DriverSortOption | null;
  pageFromQuery: number | null;
};

export function readDriversMembersQuery(searchParams: URLSearchParams): ParsedDriversQuery {
  const memberUidFromQuery = searchParams.get("memberUid") ?? searchParams.get("driverUid");
  const searchTextFromQuery = searchParams.get("q");
  const roleFromQueryRaw = searchParams.get("role");
  const statusFromQueryRaw = searchParams.get("status");
  const sortFromQueryRaw = searchParams.get("sort");
  const pageFromQueryRaw = searchParams.get("page");

  const roleFromQuery: DriverRoleFilter | null =
    roleFromQueryRaw === "owner" ||
    roleFromQueryRaw === "admin" ||
    roleFromQueryRaw === "dispatcher" ||
    roleFromQueryRaw === "viewer"
      ? roleFromQueryRaw
      : null;
  const statusFromQuery: DriverStatusFilter | null =
    statusFromQueryRaw === "active" ||
    statusFromQueryRaw === "invited" ||
    statusFromQueryRaw === "suspended"
      ? statusFromQueryRaw
      : null;
  const sortFromQuery: DriverSortOption | null =
    sortFromQueryRaw === "name_asc" ||
    sortFromQueryRaw === "name_desc" ||
    sortFromQueryRaw === "role" ||
    sortFromQueryRaw === "status"
      ? sortFromQueryRaw
      : null;
  const parsedPage = pageFromQueryRaw ? Number.parseInt(pageFromQueryRaw, 10) : null;
  const pageFromQuery = parsedPage && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : null;

  return {
    memberUidFromQuery,
    searchTextFromQuery,
    roleFromQuery,
    statusFromQuery,
    sortFromQuery,
    pageFromQuery,
  };
}

export function buildDriversFilterQueryString(
  searchParams: URLSearchParams,
  next: DriversFilterQuery,
): string {
  const params = new URLSearchParams(searchParams.toString());

  if (next.q.trim()) {
    params.set("q", next.q.trim());
  } else {
    params.delete("q");
  }

  if (next.role !== "all") {
    params.set("role", next.role);
  } else {
    params.delete("role");
  }

  if (next.status !== "all") {
    params.set("status", next.status);
  } else {
    params.delete("status");
  }

  if (next.sort !== "name_asc") {
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

export function buildDriversSelectedMemberQueryString(
  searchParams: URLSearchParams,
  memberUid: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (memberUid) {
    params.set("memberUid", memberUid);
  } else {
    params.delete("memberUid");
  }
  params.delete("driverUid");
  return params.toString();
}
