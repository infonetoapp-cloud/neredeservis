"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DashboardFeaturePlaceholder } from "@/components/dashboard/dashboard-feature-placeholder";
import {
  buildRoutesFilterQueryString,
  buildRoutesSelectionQueryString,
  buildRoutesSelectedRouteQueryString,
  readRoutesQuery,
} from "@/components/dashboard/routes-query-helpers";
import { type RouteSortOption } from "@/components/dashboard/routes-company-routes-helpers";
import { RoutesSidePanel } from "@/components/dashboard/routes-side-panel";
import { useRoutesDerivedView } from "@/components/dashboard/use-routes-derived-view";
import { RoutesWorkspacePane } from "@/components/dashboard/routes-workspace-pane";
import { useRoutesFilterState } from "@/components/dashboard/use-routes-filter-state";
import { useRoutesQueryGuards } from "@/components/dashboard/use-routes-query-guards";
import { useCopyViewLink } from "@/components/dashboard/use-copy-view-link";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { canMutateCompanyOperations } from "@/features/company/company-rbac";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyRoutes } from "@/features/company/use-company-routes";
import { useRouteDriverPermissions } from "@/features/company/use-route-driver-permissions";
import { useDashboardDensity } from "@/features/dashboard/use-dashboard-density";

export function RoutesCompanyRoutesFeature() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, user } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companyId = activeCompany?.companyId ?? null;
  const {
    routeIdFromQuery,
    memberUidFromQuery,
    searchTextFromQuery,
    statusFromQuery,
    timeSlotFromQuery,
    sortFromQuery,
    pageFromQuery,
  } = readRoutesQuery(searchParams);
  const [selectedRouteIdPreference, setSelectedRouteIdPreference] = useState<string | null>(
    () => routeIdFromQuery,
  );
  const { copyViewLinkState: copyLinkState, copyViewLink } = useCopyViewLink();
  const density = useDashboardDensity();

  const syncFilterQuery = useCallback(
    (next: {
      q: string;
      status: "all" | "active" | "archived";
      slot: "all" | "morning" | "midday" | "evening" | "custom" | "unspecified";
      sort: RouteSortOption;
      page: number;
    }) => {
      const nextQuery = buildRoutesFilterQueryString(searchParams, next);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/routes?${nextQuery}` : "/routes", { scroll: false });
    },
    [router, searchParams],
  );

  const syncSelectedRouteQuery = useCallback(
    (nextRouteId: string | null) => {
      const nextQuery = buildRoutesSelectedRouteQueryString(searchParams, nextRouteId);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/routes?${nextQuery}` : "/routes", { scroll: false });
    },
    [router, searchParams],
  );
  const syncSelectedMemberQuery = useCallback(
    (nextMemberUid: string | null) => {
      const nextQuery = buildRoutesSelectionQueryString(searchParams, {
        routeId: routeIdFromQuery,
        memberUid: nextMemberUid,
      });
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/routes?${nextQuery}` : "/routes", { scroll: false });
    },
    [routeIdFromQuery, router, searchParams],
  );
  const syncSelectionQuery = useCallback(
    (next: { routeId: string | null; memberUid: string | null }) => {
      const nextQuery = buildRoutesSelectionQueryString(searchParams, next);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/routes?${nextQuery}` : "/routes", { scroll: false });
    },
    [router, searchParams],
  );
  const {
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveTimeSlotFilter,
    effectiveSortOption,
    effectivePage,
    syncFiltersForPage,
    handleSearchTextChange,
    handleStatusFilterChange,
    handleTimeSlotFilterChange,
    handleSortOptionChange,
    handleResetFilters,
  } = useRoutesFilterState({
    searchTextFromQuery,
    statusFromQuery,
    timeSlotFromQuery,
    sortFromQuery,
    pageFromQuery,
    syncFilterQuery,
  });
  const includeArchivedRoutes = useMemo(
    () => effectiveStatusFilter !== "active" || Boolean(routeIdFromQuery),
    [effectiveStatusFilter, routeIdFromQuery],
  );
  const routesQuery = useCompanyRoutes(
    companyId,
    authStatus === "signed_in" && Boolean(companyId),
    includeArchivedRoutes,
  );
  const membersQuery = useCompanyMembers(companyId, authStatus === "signed_in" && Boolean(companyId));

  const handleRouteSelection = useCallback(
    (routeId: string) => {
      setSelectedRouteIdPreference(routeId);
      const selectedRouteItem = routesQuery.items.find((item) => item.routeId === routeId);
      const memberStillAssigned =
        Boolean(selectedRouteItem) &&
        Boolean(memberUidFromQuery) &&
        (selectedRouteItem?.driverId === memberUidFromQuery ||
          selectedRouteItem?.authorizedDriverIds.includes(memberUidFromQuery ?? ""));
      syncSelectionQuery({
        routeId,
        memberUid: memberStillAssigned ? memberUidFromQuery : null,
      });
    },
    [memberUidFromQuery, routesQuery.items, syncSelectionQuery],
  );
  const {
    filteredRoutes,
    preferredMemberRouteId,
    selectedRoute,
    selectedRouteId,
    currentPage,
    pageSize,
    routesListProps,
  } = useRoutesDerivedView({
    routesItems: routesQuery.items,
    activeCompanyName: activeCompany?.companyName ?? null,
    routeIdFromQuery,
    memberUidFromQuery,
    selectedRouteIdPreference,
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveTimeSlotFilter,
    effectiveSortOption,
    effectivePage,
    density,
    onSearchTextChange: handleSearchTextChange,
    onStatusFilterChange: handleStatusFilterChange,
    onTimeSlotFilterChange: handleTimeSlotFilterChange,
    onSortOptionChange: handleSortOptionChange,
    onResetFilters: handleResetFilters,
    onPageChange: syncFiltersForPage,
    onSelectRoute: handleRouteSelection,
    onClearMemberFocus: (nextSelectedRouteId) =>
      syncSelectionQuery({
        routeId: nextSelectedRouteId,
        memberUid: null,
      }),
  });
  const selectedRouteTripsQuery = useCompanyActiveTrips(
    companyId,
    authStatus === "signed_in" && Boolean(companyId) && Boolean(selectedRoute),
    {
      routeId: selectedRoute?.routeId ?? null,
      pageSize: 8,
    },
  );
  const routePermissionsQuery = useRouteDriverPermissions(
    companyId,
    selectedRoute?.routeId ?? null,
    authStatus === "signed_in" && Boolean(companyId) && Boolean(selectedRoute),
  );

  const actorMembership = useMemo(() => {
    if (!user) return null;
    return membersQuery.items.find((item) => item.uid === user.uid) ?? null;
  }, [membersQuery.items, user]);
  const actorRole = actorMembership?.role ?? null;
  const actorMemberStatus = actorMembership?.memberStatus ?? null;
  const canMutateRoutes = canMutateCompanyOperations(actorRole, actorMemberStatus);

  useRoutesQueryGuards({
    routeIdFromQuery,
    memberUidFromQuery,
    pageFromQuery,
    selectedRouteId: selectedRoute?.routeId ?? null,
    preferredMemberRouteId,
    filteredRoutes,
    routesItems: routesQuery.items,
    routesStatus: routesQuery.status,
    membersItems: membersQuery.items,
    membersStatus: membersQuery.status,
    pageSize,
    currentPage,
    effectiveSearchText,
    effectiveStatusFilter,
    effectiveTimeSlotFilter,
    effectiveSortOption,
    syncFilterQuery,
    syncSelectedRouteQuery,
    syncSelectedMemberQuery,
  });

  const handleCopyViewLink = useCallback(
    async () => copyViewLink("/routes", searchParams.toString()),
    [copyViewLink, searchParams],
  );
  const handleRouteCreated = async ({ routeId }: { routeId: string }) => {
    await routesQuery.reload();
    await routePermissionsQuery.reload();
    setSelectedRouteIdPreference(routeId);
    syncSelectedRouteQuery(routeId);
  };

  const handleRoutesUpdated = useCallback(async () => {
    await Promise.all([routesQuery.reload(), routePermissionsQuery.reload()]);
  }, [routePermissionsQuery, routesQuery]);
  const workspace = (
    <RoutesWorkspacePane
      authStatus={authStatus}
      companyId={companyId}
      canMutateRoutes={canMutateRoutes}
      routesStatus={routesQuery.status}
      routesError={routesQuery.error}
      routesCount={routesQuery.items.length}
      routesListProps={routesListProps}
      onRetryRoutes={() => void routesQuery.reload()}
      onRouteCreated={handleRouteCreated}
    />
  );

  return (
    <DashboardFeaturePlaceholder
      badge="Operations"
      title="Routes / Company Route Summaries"
      description="Routes ekrani company route summary read-side, filtreleme, update ve durak editoru akisini birlikte sunar."
      nextPhaseNotes={[
        "route detail + geometry editor",
        "driver/assignment gorunumleri",
        "route-level operasyon ozetleri",
      ]}
      workspace={workspace}
      sidePanel={
        <RoutesSidePanel
          actorRole={actorRole}
          actorMemberStatus={actorMemberStatus}
          selectedRoute={selectedRoute}
          companyId={companyId}
          preferredMemberUid={memberUidFromQuery}
          filteredRoutes={filteredRoutes}
          members={membersQuery.items}
          membersLoadStatus={membersQuery.status}
          activeTrips={selectedRouteTripsQuery.items}
          activeTripsLoadStatus={selectedRouteTripsQuery.status}
          selectedRouteId={selectedRouteId}
          copyLinkState={copyLinkState}
          routePermissions={routePermissionsQuery.items}
          routePermissionsLoadStatus={routePermissionsQuery.status}
          onCopyViewLink={() => void handleCopyViewLink()}
          onSelectedRouteIdChange={setSelectedRouteIdPreference}
          onRoutesUpdated={handleRoutesUpdated}
        />
      }
    />
  );
}
