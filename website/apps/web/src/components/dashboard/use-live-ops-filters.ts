"use client";

import { useMemo, useState } from "react";

import {
  LIVE_OPS_AUTO_REFRESH_KEY,
  LIVE_OPS_DRIVER_FILTER_KEY,
  LIVE_OPS_HIDE_STALE_KEY,
  LIVE_OPS_RISK_QUEUE_LIMIT_KEY,
  LIVE_OPS_ROUTE_FILTER_KEY,
  readBooleanPreference,
  readStringPreference,
  type LiveOpsRiskQueueLimit,
  type LiveOpsRiskTone,
  type LiveOpsSortOption,
  writeBooleanPreference,
  writeStringPreference,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import type { CompanyMemberSummary, CompanyRouteSummary } from "@/features/company/company-types";

type QueryStatus = "idle" | "loading" | "success" | "error";

type UseLiveOpsFiltersArgs = {
  tripIdFromQuery: string | null;
  routeFilterFromQuery: string | null;
  driverFilterFromQuery: string | null;
  searchTextFromQuery: string | null;
  hideStaleFromQuery: boolean | null;
  sortFromQuery: LiveOpsSortOption | null;
  riskToneFromQuery: LiveOpsRiskTone | null;
  riskQueueLimitFromQuery: LiveOpsRiskQueueLimit | null;
  routesStatus: QueryStatus;
  routesItems: CompanyRouteSummary[];
  membersStatus: QueryStatus;
  membersItems: CompanyMemberSummary[];
  syncFilterQuery: (
    nextRouteId: string | null,
    nextDriverUid: string | null,
    nextSearchText: string,
    nextSort: LiveOpsSortOption,
    nextTripId: string | null,
    nextHideStale: boolean,
    nextRiskTone: LiveOpsRiskTone | null,
    nextRiskQueueLimit: LiveOpsRiskQueueLimit,
  ) => void;
};

export function useLiveOpsFilters({
  tripIdFromQuery,
  routeFilterFromQuery,
  driverFilterFromQuery,
  searchTextFromQuery,
  hideStaleFromQuery,
  sortFromQuery,
  riskToneFromQuery,
  riskQueueLimitFromQuery,
  routesStatus,
  routesItems,
  membersStatus,
  membersItems,
  syncFilterQuery,
}: UseLiveOpsFiltersArgs) {
  const [routeFilterId, setRouteFilterId] = useState<string | null>(
    () => routeFilterFromQuery ?? readStringPreference(LIVE_OPS_ROUTE_FILTER_KEY),
  );
  const [driverFilterUid, setDriverFilterUid] = useState<string | null>(
    () => driverFilterFromQuery ?? readStringPreference(LIVE_OPS_DRIVER_FILTER_KEY),
  );
  const [searchText, setSearchText] = useState(searchTextFromQuery ?? "");
  const [sortOption, setSortOption] = useState<LiveOpsSortOption>(sortFromQuery ?? "signal_desc");
  const [selectedTripIdPreference, setSelectedTripIdPreference] = useState<string | null>(
    () => tripIdFromQuery,
  );
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() =>
    readBooleanPreference(LIVE_OPS_AUTO_REFRESH_KEY, true),
  );
  const [hideStale, setHideStale] = useState(() =>
    readBooleanPreference(LIVE_OPS_HIDE_STALE_KEY, false),
  );
  const [riskTone, setRiskTone] = useState<LiveOpsRiskTone | null>(() => riskToneFromQuery);
  const [riskQueueLimit, setRiskQueueLimit] = useState<LiveOpsRiskQueueLimit>(() => {
    if (riskQueueLimitFromQuery) return riskQueueLimitFromQuery;
    return readStringPreference(LIVE_OPS_RISK_QUEUE_LIMIT_KEY) === "8" ? 8 : 4;
  });

  const routeFilterIdCandidate = routeFilterFromQuery ?? routeFilterId;
  const effectiveRouteFilterId = useMemo(() => {
    if (!routeFilterIdCandidate) return null;
    if (routesStatus !== "success") return routeFilterIdCandidate;
    return routesItems.some((item) => item.routeId === routeFilterIdCandidate)
      ? routeFilterIdCandidate
      : null;
  }, [routeFilterIdCandidate, routesItems, routesStatus]);

  const driverFilterUidCandidate = driverFilterFromQuery ?? driverFilterUid;
  const effectiveDriverFilterUid = useMemo(() => {
    if (!driverFilterUidCandidate) return null;
    if (membersStatus !== "success") return driverFilterUidCandidate;
    return membersItems.some((item) => item.uid === driverFilterUidCandidate)
      ? driverFilterUidCandidate
      : null;
  }, [driverFilterUidCandidate, membersItems, membersStatus]);

  const effectiveSearchText = searchTextFromQuery ?? searchText;
  const effectiveSortOption = sortFromQuery ?? sortOption;
  const effectiveHideStale = hideStaleFromQuery ?? hideStale;
  const effectiveRiskTone = riskToneFromQuery ?? riskTone;
  const effectiveRiskQueueLimit = riskQueueLimitFromQuery ?? riskQueueLimit;
  const selectedTripId = tripIdFromQuery ?? selectedTripIdPreference;

  const handleToggleAutoRefresh = () => {
    setAutoRefreshEnabled((prev) => {
      const next = !prev;
      writeBooleanPreference(LIVE_OPS_AUTO_REFRESH_KEY, next);
      return next;
    });
  };

  const handleRouteFilterChange = (nextRouteId: string | null) => {
    setRouteFilterId(nextRouteId);
    writeStringPreference(LIVE_OPS_ROUTE_FILTER_KEY, nextRouteId);
    setSelectedTripIdPreference(null);
    setHoveredTripId(null);
    syncFilterQuery(
      nextRouteId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      effectiveSortOption,
      null,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  };

  const handleDriverFilterChange = (nextDriverUid: string | null) => {
    setDriverFilterUid(nextDriverUid);
    writeStringPreference(LIVE_OPS_DRIVER_FILTER_KEY, nextDriverUid);
    setSelectedTripIdPreference(null);
    setHoveredTripId(null);
    syncFilterQuery(
      effectiveRouteFilterId,
      nextDriverUid,
      effectiveSearchText,
      effectiveSortOption,
      null,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  };

  const handleSearchTextChange = (nextSearchText: string) => {
    setSearchText(nextSearchText);
    setSelectedTripIdPreference(null);
    setHoveredTripId(null);
    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      nextSearchText,
      effectiveSortOption,
      null,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  };

  const handleSortOptionChange = (nextSort: LiveOpsSortOption) => {
    setSortOption(nextSort);
    setSelectedTripIdPreference(null);
    setHoveredTripId(null);
    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      nextSort,
      null,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  };

  const handleResetFilters = () => {
    setRouteFilterId(null);
    setDriverFilterUid(null);
    setSearchText("");
    setSortOption("signal_desc");
    setRiskTone(null);
    setHideStale(false);
    setRiskQueueLimit(4);
    writeStringPreference(LIVE_OPS_ROUTE_FILTER_KEY, null);
    writeStringPreference(LIVE_OPS_DRIVER_FILTER_KEY, null);
    writeBooleanPreference(LIVE_OPS_HIDE_STALE_KEY, false);
    writeStringPreference(LIVE_OPS_RISK_QUEUE_LIMIT_KEY, null);
    setSelectedTripIdPreference(null);
    setHoveredTripId(null);
    syncFilterQuery(null, null, "", "signal_desc", null, false, null, 4);
  };

  const handleSelectTripId = (nextTripId: string) => {
    setSelectedTripIdPreference(nextTripId);
    setHoveredTripId(nextTripId);
    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      effectiveSortOption,
      nextTripId,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  };

  const handleToggleHideStale = () => {
    const nextHideStale = !effectiveHideStale;
    setHideStale(nextHideStale);
    writeBooleanPreference(LIVE_OPS_HIDE_STALE_KEY, nextHideStale);
    setSelectedTripIdPreference(null);
    setHoveredTripId(null);
    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      effectiveSortOption,
      null,
      nextHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  };

  const handleRiskToneChange = (nextRiskTone: LiveOpsRiskTone | null) => {
    setRiskTone(nextRiskTone);
    const nextSort: LiveOpsSortOption =
      nextRiskTone != null ? "risk_desc" : effectiveSortOption;
    setSortOption(nextSort);
    setSelectedTripIdPreference(null);
    setHoveredTripId(null);
    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      nextSort,
      null,
      effectiveHideStale,
      nextRiskTone,
      effectiveRiskQueueLimit,
    );
  };

  const handleRiskQueueLimitChange = (nextLimit: LiveOpsRiskQueueLimit) => {
    setRiskQueueLimit(nextLimit);
    writeStringPreference(
      LIVE_OPS_RISK_QUEUE_LIMIT_KEY,
      nextLimit === 4 ? null : String(nextLimit),
    );
    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      effectiveSortOption,
      selectedTripId,
      effectiveHideStale,
      effectiveRiskTone,
      nextLimit,
    );
  };

  return {
    selectedTripId,
    hoveredTripId,
    setHoveredTripId,
    autoRefreshEnabled,
    handleToggleAutoRefresh,
    effectiveRouteFilterId,
    handleRouteFilterChange,
    effectiveDriverFilterUid,
    handleDriverFilterChange,
    effectiveSearchText,
    handleSearchTextChange,
    effectiveSortOption,
    handleSortOptionChange,
    handleResetFilters,
    effectiveHideStale,
    handleToggleHideStale,
    effectiveRiskTone,
    handleRiskToneChange,
    effectiveRiskQueueLimit,
    handleRiskQueueLimitChange,
    handleSelectTripId,
  };
}
