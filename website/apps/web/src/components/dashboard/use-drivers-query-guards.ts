"use client";

import { useEffect } from "react";

import type { CompanyMemberSummary } from "@/features/company/company-types";
import type {
  DriverRoleFilter,
  DriverSortOption,
  DriverStatusFilter,
} from "@/components/dashboard/drivers-company-members-helpers";

type SyncFilterQuery = (next: {
  q: string;
  role: DriverRoleFilter;
  status: DriverStatusFilter;
  sort: DriverSortOption;
  page: number;
}) => void;

type UseDriversQueryGuardsInput = {
  memberUidFromQuery: string | null;
  pageFromQuery: number | null;
  selectedMemberUid: string | null;
  filteredMembers: CompanyMemberSummary[];
  pageSize: number;
  currentPage: number;
  effectiveSearchText: string;
  effectiveRoleFilter: DriverRoleFilter;
  effectiveStatusFilter: DriverStatusFilter;
  effectiveSortOption: DriverSortOption;
  syncFilterQuery: SyncFilterQuery;
  syncSelectedMemberQuery: (memberUid: string | null) => void;
};

export function useDriversQueryGuards({
  memberUidFromQuery,
  pageFromQuery,
  selectedMemberUid,
  filteredMembers,
  pageSize,
  currentPage,
  effectiveSearchText,
  effectiveRoleFilter,
  effectiveStatusFilter,
  effectiveSortOption,
  syncFilterQuery,
  syncSelectedMemberQuery,
}: UseDriversQueryGuardsInput) {
  useEffect(() => {
    if (!memberUidFromQuery) return;
    const queryMemberStillVisible = filteredMembers.some((item) => item.uid === memberUidFromQuery);
    if (queryMemberStillVisible) return;
    syncSelectedMemberQuery(selectedMemberUid);
  }, [filteredMembers, memberUidFromQuery, selectedMemberUid, syncSelectedMemberQuery]);

  useEffect(() => {
    if (pageFromQuery === currentPage) return;
    syncFilterQuery({
      q: effectiveSearchText,
      role: effectiveRoleFilter,
      status: effectiveStatusFilter,
      sort: effectiveSortOption,
      page: currentPage,
    });
  }, [
    currentPage,
    effectiveRoleFilter,
    effectiveSearchText,
    effectiveSortOption,
    effectiveStatusFilter,
    pageFromQuery,
    syncFilterQuery,
  ]);

  useEffect(() => {
    if (!memberUidFromQuery) return;
    const memberIndex = filteredMembers.findIndex((item) => item.uid === memberUidFromQuery);
    if (memberIndex < 0) return;
    const targetPage = Math.floor(memberIndex / pageSize) + 1;
    if (targetPage === currentPage) return;
    syncFilterQuery({
      q: effectiveSearchText,
      role: effectiveRoleFilter,
      status: effectiveStatusFilter,
      sort: effectiveSortOption,
      page: targetPage,
    });
  }, [
    currentPage,
    effectiveRoleFilter,
    effectiveSearchText,
    effectiveSortOption,
    effectiveStatusFilter,
    filteredMembers,
    memberUidFromQuery,
    pageSize,
    syncFilterQuery,
  ]);
}
