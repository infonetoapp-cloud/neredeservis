"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  buildLiveOpsStreamRecoverySummary,
  evaluateLiveOpsTripRisk,
  type LiveOpsFilterContext,
  type LiveOpsRiskQueueLimit,
  type LiveOpsRiskTone,
  type LiveOpsSortOption,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import {
  buildLiveOpsQueryString,
  readLiveOpsQuery,
} from "@/components/dashboard/live-ops-query-helpers";
import { useCopyViewLink } from "@/components/dashboard/use-copy-view-link";
import { useLiveOpsDerivedState } from "@/components/dashboard/use-live-ops-derived-state";
import { useLiveOpsFilters } from "@/components/dashboard/use-live-ops-filters";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useCompanyActiveTrips } from "@/features/company/use-company-active-trips";
import { useCompanyMembers } from "@/features/company/use-company-members";
import { useCompanyRoutes } from "@/features/company/use-company-routes";
import { useDashboardDensity } from "@/features/dashboard/use-dashboard-density";
import { useLiveOpsDispatchActions } from "@/components/dashboard/use-live-ops-dispatch-actions";
import { useLiveOpsQuerySelfHeal } from "@/components/dashboard/use-live-ops-query-self-heal";
import { useLiveOpsSelectedTripStreamState } from "@/components/dashboard/use-live-ops-selected-trip-stream-state";

export function useLiveOpsCompanyActiveTripsState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const density = useDashboardDensity();
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companyId = activeCompany?.companyId ?? null;
  const {
    tripIdFromQuery,
    routeFilterFromQuery,
    driverFilterFromQuery,
    searchTextFromQuery,
    hideStaleFromQuery,
    sortFromQuery,
    riskToneFromQuery,
    riskQueueLimitFromQuery,
  } = readLiveOpsQuery(searchParams);
  const sortRawFromQuery = searchParams.get("sort");
  const riskToneRawFromQuery = searchParams.get("riskTone");
  const hideStaleRawFromQuery = searchParams.get("hideStale");
  const riskQueueLimitRawFromQuery = searchParams.get("riskLimit");

  const routesQuery = useCompanyRoutes(companyId, authStatus === "signed_in" && Boolean(companyId));
  const membersQuery = useCompanyMembers(companyId, authStatus === "signed_in" && Boolean(companyId));
  const { copyViewLinkState, copyViewLink } = useCopyViewLink();

  const syncFilterQuery = useCallback(
    (
      nextRouteId: string | null,
      nextDriverUid: string | null,
      nextSearchText: string,
      nextSort: LiveOpsSortOption,
      nextTripId: string | null,
      nextHideStale: boolean,
      nextRiskTone: LiveOpsRiskTone | null,
      nextRiskQueueLimit: LiveOpsRiskQueueLimit,
    ) => {
      const nextQuery = buildLiveOpsQueryString({
        searchParams,
        routeId: nextRouteId,
        driverUid: nextDriverUid,
        searchText: nextSearchText,
        sort: nextSort,
        tripId: nextTripId,
        hideStale: nextHideStale,
        riskTone: nextRiskTone,
        riskQueueLimit: nextRiskQueueLimit,
      });
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `/live-ops?${nextQuery}` : "/live-ops", { scroll: false });
    },
    [router, searchParams],
  );

  const {
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
  } = useLiveOpsFilters({
    tripIdFromQuery,
    routeFilterFromQuery,
    driverFilterFromQuery,
    searchTextFromQuery,
    hideStaleFromQuery,
    sortFromQuery,
    riskToneFromQuery,
    riskQueueLimitFromQuery,
    routesStatus: routesQuery.status,
    routesItems: routesQuery.items,
    membersStatus: membersQuery.status,
    membersItems: membersQuery.items,
    syncFilterQuery,
  });

  const tripsQuery = useCompanyActiveTrips(companyId, authStatus === "signed_in" && Boolean(companyId), {
    routeId: effectiveRouteFilterId,
    driverUid: effectiveDriverFilterUid,
    pageSize: 50,
  });
  const reloadActiveTrips = tripsQuery.reload;
  const streamLagRecoveryReloadAtRef = useRef(0);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    if (authStatus !== "signed_in" || !companyId) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void reloadActiveTrips({ background: true });
    }, 15_000);

    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, authStatus, companyId, reloadActiveTrips]);
  const handleCopyViewLink = useCallback(
    async () => copyViewLink("/live-ops", searchParams.toString()),
    [copyViewLink, searchParams],
  );

  const {
    filteredAndSortedTrips,
    visibleTrips,
    effectiveHoveredTripId,
    driverSelectOptions,
    selectedTrip,
    selectedDriverPhone,
    filterDurationMs,
    readModelPressure,
  } = useLiveOpsDerivedState({
    trips: tripsQuery.items,
    members: membersQuery.items,
    searchText: effectiveSearchText,
    sortOption: effectiveSortOption,
    hideStale: effectiveHideStale,
    hoveredTripId,
    selectedTripId,
    effectiveDriverFilterUid,
  });

  const mapVisibleTrips = useMemo(() => {
    if (!effectiveRiskTone) {
      return visibleTrips;
    }
    const riskFiltered = visibleTrips.filter(
      (trip) => evaluateLiveOpsTripRisk(trip)?.tone === effectiveRiskTone,
    );
    if (!selectedTrip) {
      return riskFiltered;
    }
    const hasSelected = riskFiltered.some((trip) => trip.tripId === selectedTrip.tripId);
    if (hasSelected) {
      return riskFiltered;
    }
    return [selectedTrip, ...riskFiltered.filter((trip) => trip.tripId !== selectedTrip.tripId)];
  }, [effectiveRiskTone, selectedTrip, visibleTrips]);

  const mapPinnedSelectedOutsideRisk = useMemo(() => {
    if (!effectiveRiskTone || !selectedTrip) {
      return false;
    }
    const selectedTone = evaluateLiveOpsTripRisk(selectedTrip)?.tone ?? null;
    return selectedTone !== effectiveRiskTone;
  }, [effectiveRiskTone, selectedTrip]);

  const mapRiskExcludedCount = useMemo(() => {
    if (!effectiveRiskTone) {
      return 0;
    }
    let matchingCount = 0;
    for (const trip of visibleTrips) {
      if (evaluateLiveOpsTripRisk(trip)?.tone === effectiveRiskTone) {
        matchingCount += 1;
      }
    }
    return Math.max(0, visibleTrips.length - matchingCount);
  }, [effectiveRiskTone, visibleTrips]);
  const mapRiskHiddenByStaleCounts = useMemo(() => {
    if (!effectiveHideStale) {
      return { critical: 0, warning: 0 };
    }
    let critical = 0;
    let warning = 0;
    for (const trip of filteredAndSortedTrips) {
      if (trip.liveState !== "stale") continue;
      const tone = evaluateLiveOpsTripRisk(trip)?.tone;
      if (tone === "critical") {
        critical += 1;
      } else if (tone === "warning") {
        warning += 1;
      }
    }
    return { critical, warning };
  }, [effectiveHideStale, filteredAndSortedTrips]);
  const mapRiskHiddenByStaleCount = useMemo(() => {
    if (!effectiveRiskTone) return 0;
    return effectiveRiskTone === "critical"
      ? mapRiskHiddenByStaleCounts.critical
      : mapRiskHiddenByStaleCounts.warning;
  }, [effectiveRiskTone, mapRiskHiddenByStaleCounts]);
  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        effectiveRouteFilterId ||
          effectiveDriverFilterUid ||
          effectiveSearchText.trim() ||
          effectiveSortOption !== "signal_desc" ||
          effectiveHideStale ||
          effectiveRiskTone ||
          effectiveRiskQueueLimit !== 4,
      ),
    [
      effectiveDriverFilterUid,
      effectiveHideStale,
      effectiveRiskQueueLimit,
      effectiveRiskTone,
      effectiveRouteFilterId,
      effectiveSearchText,
      effectiveSortOption,
    ],
  );

  useEffect(() => {
    const hasInvalidSort = sortRawFromQuery != null && sortFromQuery == null;
    const hasInvalidRiskTone = riskToneRawFromQuery != null && riskToneFromQuery == null;
    const hasInvalidHideStale = hideStaleRawFromQuery != null && hideStaleFromQuery == null;
    const hasInvalidRiskLimit =
      riskQueueLimitRawFromQuery != null &&
      riskQueueLimitRawFromQuery !== "4" &&
      riskQueueLimitRawFromQuery !== "8";

    if (!hasInvalidSort && !hasInvalidRiskTone && !hasInvalidHideStale && !hasInvalidRiskLimit) {
      return;
    }

    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      effectiveSortOption,
      selectedTrip?.tripId ?? null,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  }, [
    effectiveDriverFilterUid,
    effectiveHideStale,
    effectiveRiskQueueLimit,
    effectiveRiskTone,
    effectiveRouteFilterId,
    effectiveSearchText,
    effectiveSortOption,
    hideStaleFromQuery,
    hideStaleRawFromQuery,
    riskToneFromQuery,
    riskToneRawFromQuery,
    riskQueueLimitRawFromQuery,
    sortFromQuery,
    sortRawFromQuery,
    selectedTrip,
    syncFilterQuery,
  ]);

  useLiveOpsQuerySelfHeal({
    routeFilterFromQuery,
    routesStatus: routesQuery.status,
    routesItems: routesQuery.items,
    driverFilterFromQuery,
    membersStatus: membersQuery.status,
    membersItems: membersQuery.items,
    tripIdFromQuery,
    visibleTrips,
    selectedTripId: selectedTrip?.tripId ?? null,
    effectiveRouteFilterId,
    effectiveDriverFilterUid,
    effectiveSearchText,
    effectiveSortOption,
    effectiveHideStale,
    effectiveRiskTone,
    effectiveRiskQueueLimit,
    syncFilterQuery,
  });
  const {
    liveStreamEnabled,
    rtdbConnection,
    selectedTripLiveStream,
    selectedTripStopsQuery,
    selectedTripStreamErrorSemantic,
    streamIssueState,
    effectiveLiveCoords,
    streamStale,
    streamLagSeconds,
    streamStaleReason,
  } = useLiveOpsSelectedTripStreamState({
    authStatus,
    companyId,
    selectedTrip,
    tripsStatus: tripsQuery.status,
  });
  const streamRecoverySummary = useMemo(
    () =>
      buildLiveOpsStreamRecoverySummary({
        staleReason: streamStaleReason,
        lagSeconds: streamLagSeconds,
        retryAttempt: selectedTripLiveStream.retryAttempt,
        nextRetryAt: selectedTripLiveStream.nextRetryAt,
      }),
    [
      selectedTripLiveStream.nextRetryAt,
      selectedTripLiveStream.retryAttempt,
      streamLagSeconds,
      streamStaleReason,
    ],
  );
  const liveOpsFilterContext = useMemo<LiveOpsFilterContext>(
    () => ({
      sortOption: effectiveSortOption,
      riskTone: effectiveRiskTone,
      hideStale: effectiveHideStale,
      riskQueueLimit: effectiveRiskQueueLimit,
      routeFilterId: effectiveRouteFilterId,
      driverFilterUid: effectiveDriverFilterUid,
      searchText: effectiveSearchText,
    }),
    [
      effectiveDriverFilterUid,
      effectiveHideStale,
      effectiveRiskQueueLimit,
      effectiveRiskTone,
      effectiveRouteFilterId,
      effectiveSearchText,
      effectiveSortOption,
    ],
  );
  useEffect(() => {
    if (authStatus !== "signed_in" || !companyId) return;
    if (!selectedTrip?.tripId) return;
    if (tripsQuery.status !== "success" || tripsQuery.isRefreshing) return;
    if (streamStaleReason !== "stream_lag_timeout") return;
    if (document.visibilityState !== "visible") return;

    const now = Date.now();
    if (now - streamLagRecoveryReloadAtRef.current < 30_000) return;
    streamLagRecoveryReloadAtRef.current = now;
    void reloadActiveTrips({ background: true });
  }, [
    authStatus,
    companyId,
    reloadActiveTrips,
    selectedTrip?.tripId,
    streamStaleReason,
    tripsQuery.isRefreshing,
    tripsQuery.status,
  ]);
  const dispatchActions = useLiveOpsDispatchActions({
    selectedTrip,
    selectedDriverPhone,
    effectiveLiveCoords,
    streamStatus: selectedTripLiveStream.status,
    rtdbConnectionStatus: rtdbConnection.status,
    streamIssueState,
    streamRecoverySummary,
    filterContext: liveOpsFilterContext,
  });

  return {
    density,
    authStatus,
    companyId,
    routesQuery,
    tripsQuery,
    reloadActiveTrips,
    selectedTrip,
    filteredAndSortedTrips,
    visibleTrips,
    mapVisibleTrips,
    mapPinnedSelectedOutsideRisk,
    mapRiskExcludedCount,
    mapRiskHiddenByStaleCount,
    mapRiskHiddenByStaleCriticalCount: mapRiskHiddenByStaleCounts.critical,
    mapRiskHiddenByStaleWarningCount: mapRiskHiddenByStaleCounts.warning,
    effectiveHoveredTripId,
    setHoveredTripId,
    autoRefreshEnabled,
    handleToggleAutoRefresh,
    effectiveRouteFilterId,
    handleRouteFilterChange,
    effectiveDriverFilterUid,
    driverSelectOptions,
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
    hasActiveFilters,
    copyViewLinkState,
    handleCopyViewLink,
    handleSelectTripId,
    filterDurationMs,
    readModelPressure,
    selectedTripLiveStream,
    selectedTripStreamErrorSemantic,
    streamIssueState,
    liveOpsFilterContext,
    rtdbConnection,
    liveStreamEnabled,
    effectiveLiveCoords,
    selectedTripStopsQuery,
    streamStale,
    streamLagSeconds,
    streamStaleReason,
    streamRecoverySummary,
    handleOpenRouteEditor: dispatchActions.handleOpenRouteEditor,
    handleOpenDriverRecord: dispatchActions.handleOpenDriverRecord,
    handleCopyDispatchSummary: dispatchActions.handleCopyDispatchSummary,
    handleCopyTripLink: dispatchActions.handleCopyTripLink,
    handleSendWhatsApp: dispatchActions.handleSendWhatsApp,
    handleCopyDispatchTemplate: dispatchActions.handleCopyDispatchTemplate,
    handleSendWhatsAppTemplate: dispatchActions.handleSendWhatsAppTemplate,
    clipboardSupported: dispatchActions.clipboardSupported,
    dispatchCopyMessage: dispatchActions.dispatchCopyMessage,
    tripLinkCopyMessage: dispatchActions.tripLinkCopyMessage,
    whatsAppMessage: dispatchActions.whatsAppMessage,
    dispatchTemplateCopyMessage: dispatchActions.dispatchTemplateCopyMessage,
    dispatchTemplateWhatsAppMessage: dispatchActions.dispatchTemplateWhatsAppMessage,
    supportPacketCopyMessage: dispatchActions.supportPacketCopyMessage,
    dispatchHistoryCopyMessage: dispatchActions.dispatchHistoryCopyMessage,
    dispatchTemplateActions: dispatchActions.dispatchTemplateActions,
    dispatchHistory: dispatchActions.dispatchHistory,
    handleClearDispatchHistory: dispatchActions.handleClearDispatchHistory,
    handleCopyDispatchHistory: dispatchActions.handleCopyDispatchHistory,
    handleCopySupportPacket: dispatchActions.handleCopySupportPacket,
  };
}
