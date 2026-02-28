"use client";

import { useEffect } from "react";

import type {
  LiveOpsRiskQueueLimit,
  LiveOpsRiskTone,
  LiveOpsSortOption,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import {
  LIVE_OPS_DRIVER_FILTER_KEY,
  LIVE_OPS_ROUTE_FILTER_KEY,
  writeStringPreference,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";

type RouteSummaryLite = { routeId: string };
type MemberSummaryLite = { uid: string };
type TripSummaryLite = { tripId: string };

type SyncFilterQuery = (
  nextRouteId: string | null,
  nextDriverUid: string | null,
  nextSearchText: string,
  nextSort: LiveOpsSortOption,
  nextTripId: string | null,
  nextHideStale: boolean,
  nextRiskTone: LiveOpsRiskTone | null,
  nextRiskQueueLimit: LiveOpsRiskQueueLimit,
) => void;

type Args = {
  routeFilterFromQuery: string | null;
  routesStatus: "idle" | "loading" | "success" | "error";
  routesItems: readonly RouteSummaryLite[];
  driverFilterFromQuery: string | null;
  membersStatus: "idle" | "loading" | "success" | "error";
  membersItems: readonly MemberSummaryLite[];
  tripIdFromQuery: string | null;
  visibleTrips: readonly TripSummaryLite[];
  selectedTripId: string | null;
  effectiveRouteFilterId: string | null;
  effectiveDriverFilterUid: string | null;
  effectiveSearchText: string;
  effectiveSortOption: LiveOpsSortOption;
  effectiveHideStale: boolean;
  effectiveRiskTone: LiveOpsRiskTone | null;
  effectiveRiskQueueLimit: LiveOpsRiskQueueLimit;
  syncFilterQuery: SyncFilterQuery;
};

export function useLiveOpsQuerySelfHeal({
  routeFilterFromQuery,
  routesStatus,
  routesItems,
  driverFilterFromQuery,
  membersStatus,
  membersItems,
  tripIdFromQuery,
  visibleTrips,
  selectedTripId,
  effectiveRouteFilterId,
  effectiveDriverFilterUid,
  effectiveSearchText,
  effectiveSortOption,
  effectiveHideStale,
  effectiveRiskTone,
  effectiveRiskQueueLimit,
  syncFilterQuery,
}: Args) {
  useEffect(() => {
    if (!routeFilterFromQuery) return;
    if (routesStatus !== "success") return;
    const queryRouteStillAvailable = routesItems.some((item) => item.routeId === routeFilterFromQuery);
    if (queryRouteStillAvailable) return;
    writeStringPreference(LIVE_OPS_ROUTE_FILTER_KEY, null);
    syncFilterQuery(
      null,
      effectiveDriverFilterUid,
      effectiveSearchText,
      effectiveSortOption,
      null,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  }, [
    routeFilterFromQuery,
    routesStatus,
    routesItems,
    effectiveDriverFilterUid,
    effectiveSearchText,
    effectiveSortOption,
    effectiveHideStale,
    effectiveRiskTone,
    effectiveRiskQueueLimit,
    syncFilterQuery,
  ]);

  useEffect(() => {
    if (!driverFilterFromQuery) return;
    if (membersStatus !== "success") return;
    const queryDriverStillAvailable = membersItems.some((item) => item.uid === driverFilterFromQuery);
    if (queryDriverStillAvailable) return;
    writeStringPreference(LIVE_OPS_DRIVER_FILTER_KEY, null);
    syncFilterQuery(
      effectiveRouteFilterId,
      null,
      effectiveSearchText,
      effectiveSortOption,
      null,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  }, [
    driverFilterFromQuery,
    membersStatus,
    membersItems,
    effectiveRouteFilterId,
    effectiveSearchText,
    effectiveSortOption,
    effectiveHideStale,
    effectiveRiskTone,
    effectiveRiskQueueLimit,
    syncFilterQuery,
  ]);

  useEffect(() => {
    if (!tripIdFromQuery) return;
    const queryTripStillVisible = visibleTrips.some((item) => item.tripId === tripIdFromQuery);
    if (queryTripStillVisible) return;
    syncFilterQuery(
      effectiveRouteFilterId,
      effectiveDriverFilterUid,
      effectiveSearchText,
      effectiveSortOption,
      selectedTripId,
      effectiveHideStale,
      effectiveRiskTone,
      effectiveRiskQueueLimit,
    );
  }, [
    tripIdFromQuery,
    visibleTrips,
    selectedTripId,
    effectiveRouteFilterId,
    effectiveDriverFilterUid,
    effectiveSearchText,
    effectiveSortOption,
    effectiveHideStale,
    effectiveRiskTone,
    effectiveRiskQueueLimit,
    syncFilterQuery,
  ]);
}
