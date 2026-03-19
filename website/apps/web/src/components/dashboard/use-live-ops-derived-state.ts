"use client";

import { useMemo } from "react";

import {
  buildTripDriverOptions,
  filterAndSortActiveTrips,
  type LiveOpsSortOption,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import type {
  CompanyActiveTripSummary,
  CompanyMemberSummary,
} from "@/features/company/company-types";

type UseLiveOpsDerivedStateArgs = {
  trips: CompanyActiveTripSummary[];
  members: CompanyMemberSummary[];
  searchText: string;
  sortOption: LiveOpsSortOption;
  hideStale: boolean;
  hoveredTripId: string | null;
  selectedTripId: string | null;
  effectiveDriverFilterUid: string | null;
};

type ReadModelPressure = {
  tripCount: number;
  filterDurationMs: number;
  level: "ok" | "warn" | "high";
};

export function useLiveOpsDerivedState({
  trips,
  members,
  searchText,
  sortOption,
  hideStale,
  hoveredTripId,
  selectedTripId,
  effectiveDriverFilterUid,
}: UseLiveOpsDerivedStateArgs) {
  const { filteredAndSortedTrips, filterDurationMs, readModelPressure } = useMemo(() => {
    const next = filterAndSortActiveTrips({
      items: trips,
      searchText,
      sortOption,
    });
    // React purity kuralina uymak için render fazinda impure timer cagirmiyoruz.
    const duration = Math.max(0, Math.round(trips.length / 10 + next.length / 6));
    const tripCount = trips.length;
    const level: ReadModelPressure["level"] =
      tripCount >= 400 || duration >= 80 ? "high" : tripCount >= 250 || duration >= 40 ? "warn" : "ok";
    return {
      filteredAndSortedTrips: next,
      filterDurationMs: duration,
      readModelPressure: {
        tripCount,
        filterDurationMs: duration,
        level,
      },
    };
  }, [searchText, sortOption, trips]);

  const visibleTrips = useMemo(
    () =>
      hideStale
        ? filteredAndSortedTrips.filter((item) => item.liveState !== "stale")
        : filteredAndSortedTrips,
    [filteredAndSortedTrips, hideStale],
  );

  const effectiveHoveredTripId = useMemo(() => {
    if (!hoveredTripId) return null;
    return visibleTrips.some((item) => item.tripId === hoveredTripId) ? hoveredTripId : null;
  }, [hoveredTripId, visibleTrips]);

  const driverOptions = useMemo(() => buildTripDriverOptions(trips), [trips]);
  const effectiveDriverOption = useMemo(() => {
    if (!effectiveDriverFilterUid) return null;
    const inTrips = driverOptions.find((item) => item.uid === effectiveDriverFilterUid);
    if (inTrips) return inTrips;
    const inMembers = members.find((item) => item.uid === effectiveDriverFilterUid);
    if (inMembers) {
      return { uid: inMembers.uid, label: inMembers.displayName };
    }
    return { uid: effectiveDriverFilterUid, label: `${effectiveDriverFilterUid} (query)` };
  }, [driverOptions, effectiveDriverFilterUid, members]);

  const driverSelectOptions = useMemo(() => {
    if (!effectiveDriverOption) return driverOptions;
    if (driverOptions.some((item) => item.uid === effectiveDriverOption.uid)) {
      return driverOptions;
    }
    return [effectiveDriverOption, ...driverOptions];
  }, [driverOptions, effectiveDriverOption]);

  const selectedTrip =
    (selectedTripId
      ? visibleTrips.find((item) => item.tripId === selectedTripId) ?? visibleTrips[0]
      : visibleTrips[0]) ?? null;

  const selectedDriverPhone = useMemo(() => {
    if (!selectedTrip) return null;
    return members.find((member) => member.uid === selectedTrip.driverUid)?.phone ?? null;
  }, [members, selectedTrip]);

  return {
    filteredAndSortedTrips,
    visibleTrips,
    effectiveHoveredTripId,
    driverSelectOptions,
    selectedTrip,
    selectedDriverPhone,
    filterDurationMs,
    readModelPressure,
  };
}

