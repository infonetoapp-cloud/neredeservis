"use client";

import { useEffect } from "react";

import type { CompanyMemberSummary, CompanyRouteSummary } from "@/features/company/company-types";
import type { RouteSortOption, RouteStatusFilter, RouteTimeSlotFilter } from "@/components/dashboard/routes-company-routes-helpers";

type RoutesLoadStatus = "idle" | "loading" | "success" | "error";
type SyncFilterQuery = (next: {
  q: string;
  status: RouteStatusFilter;
  slot: RouteTimeSlotFilter;
  sort: RouteSortOption;
  page: number;
}) => void;

type UseRoutesQueryGuardsInput = {
  routeIdFromQuery: string | null;
  memberUidFromQuery: string | null;
  pageFromQuery: number | null;
  selectedRouteId: string | null;
  preferredMemberRouteId: string | null;
  filteredRoutes: CompanyRouteSummary[];
  routesItems: CompanyRouteSummary[];
  routesStatus: RoutesLoadStatus;
  membersItems: CompanyMemberSummary[];
  membersStatus: RoutesLoadStatus;
  pageSize: number;
  currentPage: number;
  effectiveSearchText: string;
  effectiveStatusFilter: RouteStatusFilter;
  effectiveTimeSlotFilter: RouteTimeSlotFilter;
  effectiveSortOption: RouteSortOption;
  syncFilterQuery: SyncFilterQuery;
  syncSelectedRouteQuery: (routeId: string | null) => void;
  syncSelectedMemberQuery: (memberUid: string | null) => void;
};

export function useRoutesQueryGuards({
  routeIdFromQuery,
  memberUidFromQuery,
  pageFromQuery,
  selectedRouteId,
  preferredMemberRouteId,
  filteredRoutes,
  routesItems,
  routesStatus,
  membersItems,
  membersStatus,
  pageSize,
  currentPage,
  effectiveSearchText,
  effectiveStatusFilter,
  effectiveTimeSlotFilter,
  effectiveSortOption,
  syncFilterQuery,
  syncSelectedRouteQuery,
  syncSelectedMemberQuery,
}: UseRoutesQueryGuardsInput) {
  useEffect(() => {
    if (!routeIdFromQuery) return;
    const queryRouteStillVisible = filteredRoutes.some((item) => item.routeId === routeIdFromQuery);
    if (queryRouteStillVisible) return;
    syncSelectedRouteQuery(selectedRouteId);
  }, [filteredRoutes, routeIdFromQuery, selectedRouteId, syncSelectedRouteQuery]);

  useEffect(() => {
    if (pageFromQuery === currentPage) return;
    syncFilterQuery({
      q: effectiveSearchText,
      status: effectiveStatusFilter,
      slot: effectiveTimeSlotFilter,
      sort: effectiveSortOption,
      page: currentPage,
    });
  }, [
    currentPage,
    effectiveSearchText,
    effectiveSortOption,
    effectiveStatusFilter,
    effectiveTimeSlotFilter,
    pageFromQuery,
    syncFilterQuery,
  ]);

  useEffect(() => {
    if (!routeIdFromQuery) return;
    const routeIndex = filteredRoutes.findIndex((item) => item.routeId === routeIdFromQuery);
    if (routeIndex < 0) return;
    const targetPage = Math.floor(routeIndex / pageSize) + 1;
    if (targetPage === currentPage) return;
    syncFilterQuery({
      q: effectiveSearchText,
      status: effectiveStatusFilter,
      slot: effectiveTimeSlotFilter,
      sort: effectiveSortOption,
      page: targetPage,
    });
  }, [
    currentPage,
    effectiveSearchText,
    effectiveSortOption,
    effectiveStatusFilter,
    effectiveTimeSlotFilter,
    filteredRoutes,
    pageSize,
    routeIdFromQuery,
    syncFilterQuery,
  ]);

  useEffect(() => {
    if (!memberUidFromQuery || membersStatus !== "success") return;
    const memberExists = membersItems.some((member) => member.uid === memberUidFromQuery);
    if (memberExists) return;
    syncSelectedMemberQuery(null);
  }, [memberUidFromQuery, membersItems, membersStatus, syncSelectedMemberQuery]);

  useEffect(() => {
    if (!memberUidFromQuery || membersStatus !== "success" || routesStatus !== "success") return;
    const memberExists = membersItems.some((member) => member.uid === memberUidFromQuery);
    if (!memberExists) return;
    const hasAssignedRoute = routesItems.some(
      (route) =>
        route.driverId === memberUidFromQuery || route.authorizedDriverIds.includes(memberUidFromQuery),
    );
    if (hasAssignedRoute) return;
    syncSelectedMemberQuery(null);
  }, [
    memberUidFromQuery,
    membersItems,
    membersStatus,
    routesItems,
    routesStatus,
    syncSelectedMemberQuery,
  ]);

  useEffect(() => {
    if (!memberUidFromQuery || !routeIdFromQuery || filteredRoutes.length === 0) return;
    const route = filteredRoutes.find((item) => item.routeId === routeIdFromQuery);
    if (!route) return;
    const memberAssigned =
      route.driverId === memberUidFromQuery || route.authorizedDriverIds.includes(memberUidFromQuery);
    if (memberAssigned) return;
    if (preferredMemberRouteId) {
      syncSelectedRouteQuery(preferredMemberRouteId);
    }
  }, [
    filteredRoutes,
    memberUidFromQuery,
    preferredMemberRouteId,
    routeIdFromQuery,
    syncSelectedRouteQuery,
  ]);
}
