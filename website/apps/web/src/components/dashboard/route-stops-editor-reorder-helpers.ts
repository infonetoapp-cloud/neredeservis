"use client";

import { reorderCompanyRouteStopsCallable } from "@/features/company/company-callables";
import type { CompanyRouteStopSummary } from "@/features/company/company-types";

type ReorderDirection = "up" | "down";

type ReorderStopByStepsInput = {
  companyId: string;
  routeId: string;
  stopId: string;
  direction: ReorderDirection;
  steps: number;
  lastKnownUpdateToken?: string;
};

type ReorderStopByStepsOutput = {
  changedCount: number;
  updatedAtToken?: string;
};

export async function reorderStopBySteps({
  companyId,
  routeId,
  stopId,
  direction,
  steps,
  lastKnownUpdateToken,
}: ReorderStopByStepsInput): Promise<ReorderStopByStepsOutput> {
  let nextToken = lastKnownUpdateToken;
  let changedCount = 0;

  for (let index = 0; index < steps; index += 1) {
    const result = await reorderCompanyRouteStopsCallable({
      companyId,
      routeId,
      stopId,
      direction,
      lastKnownUpdateToken: nextToken,
    });

    nextToken = result.updatedAt;
    if (!result.changed) {
      break;
    }
    changedCount += 1;
  }

  return { changedCount, updatedAtToken: nextToken };
}

type DropReorderPlan = {
  draggedStop: CompanyRouteStopSummary;
  direction: ReorderDirection;
  steps: number;
};

export function resolveDropReorderPlan(
  stops: CompanyRouteStopSummary[],
  draggedStopId: string,
  targetStopId: string,
): DropReorderPlan | null {
  if (draggedStopId === targetStopId) return null;

  const sourceIndex = stops.findIndex((item) => item.stopId === draggedStopId);
  const targetIndex = stops.findIndex((item) => item.stopId === targetStopId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return null;
  }

  const draggedStop = stops[sourceIndex];
  if (!draggedStop) {
    return null;
  }

  return {
    draggedStop,
    direction: targetIndex < sourceIndex ? "up" : "down",
    steps: Math.abs(targetIndex - sourceIndex),
  };
}
