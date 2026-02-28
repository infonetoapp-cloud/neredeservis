"use client";

import type {
  RouteSortOption,
  RouteStatusFilter,
  RouteTimeSlotFilter,
} from "@/components/dashboard/routes-company-routes-helpers";

type ParsedRoutesQuery = {
  routeIdFromQuery: string | null;
  memberUidFromQuery: string | null;
  searchTextFromQuery: string | null;
  statusFromQuery: RouteStatusFilter | null;
  timeSlotFromQuery: RouteTimeSlotFilter | null;
  sortFromQuery: RouteSortOption | null;
  pageFromQuery: number | null;
};

type RouteFilterQueryInput = {
  q: string;
  status: RouteStatusFilter;
  slot: RouteTimeSlotFilter;
  sort: RouteSortOption;
  page: number;
};

export function readRoutesQuery(searchParams: URLSearchParams): ParsedRoutesQuery {
  const routeIdFromQuery = searchParams.get("routeId");
  const memberUidFromQuery = searchParams.get("memberUid");
  const searchTextFromQuery = searchParams.get("q");
  const statusFromQueryRaw = searchParams.get("status");
  const timeSlotFromQueryRaw = searchParams.get("slot");
  const sortFromQueryRaw = searchParams.get("sort");
  const pageFromQueryRaw = searchParams.get("page");

  const statusFromQuery: RouteStatusFilter | null =
    statusFromQueryRaw === "active" || statusFromQueryRaw === "archived"
      ? statusFromQueryRaw
      : null;
  const timeSlotFromQuery: RouteTimeSlotFilter | null =
    timeSlotFromQueryRaw === "morning" ||
    timeSlotFromQueryRaw === "midday" ||
    timeSlotFromQueryRaw === "evening" ||
    timeSlotFromQueryRaw === "custom" ||
    timeSlotFromQueryRaw === "unspecified"
      ? timeSlotFromQueryRaw
      : null;
  const sortFromQuery: RouteSortOption | null =
    sortFromQueryRaw === "updated_desc" ||
    sortFromQueryRaw === "name_asc" ||
    sortFromQueryRaw === "name_desc" ||
    sortFromQueryRaw === "time_asc" ||
    sortFromQueryRaw === "time_desc"
      ? sortFromQueryRaw
      : null;
  const parsedPage = pageFromQueryRaw ? Number.parseInt(pageFromQueryRaw, 10) : null;
  const pageFromQuery = parsedPage && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : null;

  return {
    routeIdFromQuery,
    memberUidFromQuery,
    searchTextFromQuery,
    statusFromQuery,
    timeSlotFromQuery,
    sortFromQuery,
    pageFromQuery,
  };
}

export function buildRoutesFilterQueryString(
  searchParams: URLSearchParams,
  next: RouteFilterQueryInput,
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

  if (next.slot !== "all") {
    params.set("slot", next.slot);
  } else {
    params.delete("slot");
  }

  if (next.sort !== "updated_desc") {
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

export function buildRoutesSelectedRouteQueryString(
  searchParams: URLSearchParams,
  routeId: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (routeId) {
    params.set("routeId", routeId);
  } else {
    params.delete("routeId");
  }
  return params.toString();
}

export function buildRoutesSelectedMemberQueryString(
  searchParams: URLSearchParams,
  memberUid: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (memberUid) {
    params.set("memberUid", memberUid);
  } else {
    params.delete("memberUid");
  }
  return params.toString();
}

export function buildRoutesSelectionQueryString(
  searchParams: URLSearchParams,
  next: {
    routeId: string | null;
    memberUid: string | null;
  },
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (next.routeId) {
    params.set("routeId", next.routeId);
  } else {
    params.delete("routeId");
  }
  if (next.memberUid) {
    params.set("memberUid", next.memberUid);
  } else {
    params.delete("memberUid");
  }
  return params.toString();
}
