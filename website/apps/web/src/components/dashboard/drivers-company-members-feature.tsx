"use client";

import { useCallback, useMemo, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DriversWorkspacePane } from "@/components/dashboard/drivers-workspace-pane";
import { DriversSidePanel } from "@/components/dashboard/drivers-side-panel";
import {
  buildDriversFilterQueryString,
  buildDriversSelectedMemberQueryString,
  readDriversMembersQuery,
} from "@/components/dashboard/drivers-members-query-helpers";
import {
  filterAndSortMembers,
  type DriverSortOption,
} from "@/components/dashboard/drivers-company-members-helpers";
import { DriversListSection } from "@/components/dashboard/drivers-list-section";
import { DashboardFeaturePlaceholder } from "@/components/dashboard/dashboard-feature-placeholder";
import { useDriversFilterState } from "@/components/dashboard/use-drivers-filter-state";
import { useDriversQueryGuards } from "@/components/dashboard/use-drivers-query-guards";
import { useCopyViewLink } from "@/components/dashboard/use-copy-view-link";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyRoutes } from "@/features/company/use-company-routes";
import { useDashboardDensity } from "@/features/dashboard/use-dashboard-density";

type DriversListSectionProps = ComponentProps<typeof DriversListSection>;

export function DriversCompanyMembersFeature() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, user } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companyId = activeCompany?.companyId ?? null;
  const membersQuery = useCompanyMembers(
    companyId,
    authStatus === "signed_in" && Boolean(companyId),
  );
  const routesQuery = useCompanyRoutes(
    companyId,
    authStatus === "signed_in" && Boolean(companyId),
  );
  const {
    memberUidFromQuery,
    searchTextFromQuery,
    roleFromQuery,
    statusFromQuery,
    sortFromQuery,
    pageFromQuery,
  } = readDriversMembersQuery(searchParams);
  const selectedMemberUidPreference = memberUidFromQuery;

  const { copyViewLinkState: copyLinkState, copyViewLink } = useCopyViewLink();
  const density = useDashboardDensity();

  const syncFilterQuery = useCallback(
    (next: {
      q: string;
      role: "all" | "owner" | "admin" | "dispatcher" | "viewer";
      status: "all" | "active" | "invited" | "suspended";
      sort: DriverSortOption;
      page: number;
    }) => {
      const nextQuery = buildDriversFilterQueryString(searchParams, next);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/drivers?${nextQuery}` : "/drivers", { scroll: false });
    },
    [router, searchParams],
  );
  const {
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
  } = useDriversFilterState({
    searchTextFromQuery,
    roleFromQuery,
    statusFromQuery,
    sortFromQuery,
    pageFromQuery,
    syncFilterQuery,
  });

  const syncSelectedMemberQuery = useCallback(
    (memberUid: string | null) => {
      const nextQuery = buildDriversSelectedMemberQueryString(searchParams, memberUid);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/drivers?${nextQuery}` : "/drivers", { scroll: false });
    },
    [router, searchParams],
  );

  const filteredMembers = useMemo(
    () =>
      filterAndSortMembers({
        items: membersQuery.items,
        searchText: effectiveSearchText,
        roleFilter: effectiveRoleFilter,
        statusFilter: effectiveStatusFilter,
        sortOption: effectiveSortOption,
      }),
    [
      membersQuery.items,
      effectiveRoleFilter,
      effectiveSearchText,
      effectiveStatusFilter,
      effectiveSortOption,
    ],
  );
  const memberStatusSummary = useMemo(
    () => ({
      active: membersQuery.items.filter((item) => item.memberStatus === "active").length,
      invited: membersQuery.items.filter((item) => item.memberStatus === "invited").length,
      suspended: membersQuery.items.filter((item) => item.memberStatus === "suspended").length,
    }),
    [membersQuery.items],
  );
  const memberRoleSummary = useMemo(
    () => ({
      owner: membersQuery.items.filter((item) => item.role === "owner").length,
      admin: membersQuery.items.filter((item) => item.role === "admin").length,
      dispatcher: membersQuery.items.filter((item) => item.role === "dispatcher").length,
      viewer: membersQuery.items.filter((item) => item.role === "viewer").length,
    }),
    [membersQuery.items],
  );
  const pageSize = density === "compact" ? 18 : 12;
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const currentPage = Math.min(Math.max(1, effectivePage), totalPages);
  const pagedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [currentPage, filteredMembers, pageSize]);

  const selectedMember =
    (selectedMemberUidPreference
      ? filteredMembers.find((item) => item.uid === selectedMemberUidPreference)
      : filteredMembers[0]) ?? null;
  const selectedMemberTripsQuery = useCompanyActiveTrips(
    companyId,
    authStatus === "signed_in" && Boolean(companyId) && Boolean(selectedMember),
    {
      driverUid: selectedMember?.uid ?? null,
      pageSize: 8,
    },
  );
  const selectedMemberAssignedRoutes = useMemo(() => {
    if (!selectedMember) return [];
    return routesQuery.items
      .filter(
        (route) =>
          route.driverId === selectedMember.uid ||
          route.authorizedDriverIds.includes(selectedMember.uid),
      )
      .sort((a, b) => {
        const aRoleOrder = a.driverId === selectedMember.uid ? 0 : 1;
        const bRoleOrder = b.driverId === selectedMember.uid ? 0 : 1;
        if (aRoleOrder !== bRoleOrder) return aRoleOrder - bRoleOrder;
        if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
        return (a.name || "").localeCompare(b.name || "", "tr");
      });
  }, [routesQuery.items, selectedMember]);
  const actorMembership = useMemo(() => {
    if (!user) return null;
    return membersQuery.items.find((item) => item.uid === user.uid) ?? null;
  }, [membersQuery.items, user]);
  const actorRole = actorMembership?.role ?? null;
  const actorMemberStatus = actorMembership?.memberStatus ?? null;

  const handleMemberUpdated = useCallback(async () => {
    await Promise.all([
      membersQuery.reload(),
      routesQuery.reload(),
      selectedMemberTripsQuery.reload(),
    ]);
  }, [membersQuery, routesQuery, selectedMemberTripsQuery]);

  useDriversQueryGuards({
    memberUidFromQuery,
    pageFromQuery,
    selectedMemberUid: selectedMember?.uid ?? null,
    filteredMembers,
    pageSize,
    currentPage,
    effectiveSearchText,
    effectiveRoleFilter,
    effectiveStatusFilter,
    effectiveSortOption,
    syncFilterQuery,
    syncSelectedMemberQuery,
  });

  const handleCopyViewLink = useCallback(
    async () => copyViewLink("/drivers", searchParams.toString()),
    [copyViewLink, searchParams],
  );

  const driversListProps = useMemo<DriversListSectionProps>(
    () => ({
      activeCompanyName: activeCompany?.companyName ?? null,
      memberUidFromQuery,
      visibleMembers: pagedMembers,
      filteredMembersCount: filteredMembers.length,
      totalMembersCount: membersQuery.items.length,
      memberStatusSummary,
      memberRoleSummary,
      currentPage,
      totalPages,
      density,
      searchText: effectiveSearchText,
      roleFilter: effectiveRoleFilter,
      statusFilter: effectiveStatusFilter,
      sortOption: effectiveSortOption,
      selectedMemberUid: selectedMember?.uid ?? null,
      onSearchTextChange: handleSearchTextChange,
      onRoleFilterChange: handleRoleFilterChange,
      onStatusFilterChange: handleStatusFilterChange,
      onSortOptionChange: handleSortOptionChange,
      onResetFilters: handleResetFilters,
      onPageChange: syncFiltersForPage,
      onSelectMemberUid: syncSelectedMemberQuery,
    }),
    [
      activeCompany?.companyName,
      currentPage,
      density,
      effectiveRoleFilter,
      effectiveSearchText,
      effectiveSortOption,
      effectiveStatusFilter,
      filteredMembers.length,
      handleResetFilters,
      handleRoleFilterChange,
      handleSearchTextChange,
      handleSortOptionChange,
      handleStatusFilterChange,
      memberRoleSummary,
      memberStatusSummary,
      memberUidFromQuery,
      membersQuery.items.length,
      pagedMembers,
      selectedMember?.uid,
      syncFiltersForPage,
      syncSelectedMemberQuery,
      totalPages,
    ],
  );

  const workspace = (
    <DriversWorkspacePane
      authStatus={authStatus}
      companyId={companyId}
      membersStatus={membersQuery.status}
      membersError={membersQuery.error}
      membersCount={membersQuery.items.length}
      driversListProps={driversListProps}
      onRetryMembers={() => {
        void membersQuery.reload();
      }}
    />
  );

  return (
    <DashboardFeaturePlaceholder
      badge="Operations"
      title="Drivers / Company Members"
      description="Company context'e gore uye listesi Firebase callable ile cekilir. Filtreleme, secim ve detay paneli ayni akista calisir."
      nextPhaseNotes={[
        "Company members + driver profiles birlestirme",
        "Pending davet kabul/onboarding akisi",
        "driver-level operasyon metrikleri",
      ]}
      workspace={workspace}
      sidePanel={
        <DriversSidePanel
          companyId={companyId}
          actorUid={user?.uid ?? null}
          actorRole={actorRole}
          actorMemberStatus={actorMemberStatus}
          selectedMember={selectedMember}
          activeTrips={selectedMemberTripsQuery.items}
          activeTripsLoadStatus={selectedMemberTripsQuery.status}
          assignedRoutes={selectedMemberAssignedRoutes}
          assignedRoutesLoadStatus={routesQuery.status}
          copyLinkState={copyLinkState}
          onMemberUpdated={handleMemberUpdated}
          onMemberRemoved={handleMemberUpdated}
          onCopyViewLink={() => void handleCopyViewLink()}
        />
      }
    />
  );
}
