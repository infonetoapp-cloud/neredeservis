"use client";

import type {
  LiveOpsRiskQueueLimit,
  LiveOpsRiskTone,
  LiveOpsSortOption,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";

type SearchParamsLike = {
  get: (name: string) => string | null;
  toString: () => string;
};

export type LiveOpsQuerySnapshot = {
  tripIdFromQuery: string | null;
  routeFilterFromQuery: string | null;
  driverFilterFromQuery: string | null;
  searchTextFromQuery: string | null;
  hideStaleFromQuery: boolean | null;
  sortFromQuery: LiveOpsSortOption | null;
  riskToneFromQuery: LiveOpsRiskTone | null;
  riskQueueLimitFromQuery: LiveOpsRiskQueueLimit | null;
};

function toSortOption(value: string | null): LiveOpsSortOption | null {
  if (
    value === "signal_desc" ||
    value === "risk_desc" ||
    value === "driver_asc" ||
    value === "plate_asc" ||
    value === "state"
  ) {
    return value;
  }
  return null;
}

function toHideStale(value: string | null): boolean | null {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function toRiskTone(value: string | null): LiveOpsRiskTone | null {
  if (value === "critical" || value === "warning") {
    return value;
  }
  return null;
}

function toRiskQueueLimit(value: string | null): LiveOpsRiskQueueLimit | null {
  if (value === "4") return 4;
  if (value === "8") return 8;
  return null;
}

export function readLiveOpsQuery(searchParams: SearchParamsLike): LiveOpsQuerySnapshot {
  return {
    tripIdFromQuery: searchParams.get("tripId"),
    routeFilterFromQuery: searchParams.get("routeId"),
    driverFilterFromQuery: searchParams.get("driverUid") ?? searchParams.get("memberUid"),
    searchTextFromQuery: searchParams.get("q"),
    hideStaleFromQuery: toHideStale(searchParams.get("hideStale")),
    sortFromQuery: toSortOption(searchParams.get("sort")),
    riskToneFromQuery: toRiskTone(searchParams.get("riskTone")),
    riskQueueLimitFromQuery: toRiskQueueLimit(searchParams.get("riskLimit")),
  };
}

type BuildLiveOpsQueryStringInput = {
  searchParams: SearchParamsLike;
  routeId: string | null;
  driverUid: string | null;
  searchText: string;
  sort: LiveOpsSortOption;
  tripId: string | null;
  hideStale: boolean;
  riskTone: LiveOpsRiskTone | null;
  riskQueueLimit: LiveOpsRiskQueueLimit;
};

export function buildLiveOpsQueryString({
  searchParams,
  routeId,
  driverUid,
  searchText,
  sort,
  tripId,
  hideStale,
  riskTone,
  riskQueueLimit,
}: BuildLiveOpsQueryStringInput): string {
  const params = new URLSearchParams(searchParams.toString());
  if (routeId) params.set("routeId", routeId);
  else params.delete("routeId");

  if (driverUid) {
    params.set("driverUid", driverUid);
    params.delete("memberUid");
  } else {
    params.delete("driverUid");
    params.delete("memberUid");
  }

  if (searchText.trim()) params.set("q", searchText.trim());
  else params.delete("q");

  if (sort !== "signal_desc") params.set("sort", sort);
  else params.delete("sort");

  if (tripId) params.set("tripId", tripId);
  else params.delete("tripId");

  if (hideStale) params.set("hideStale", "1");
  else params.delete("hideStale");

  if (riskTone) params.set("riskTone", riskTone);
  else params.delete("riskTone");

  if (riskQueueLimit !== 4) params.set("riskLimit", String(riskQueueLimit));
  else params.delete("riskLimit");

  return params.toString();
}
