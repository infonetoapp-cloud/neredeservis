"use client";

import { getPublicAppEnv } from "@/lib/env/public-env";

export type AdminPhase5Metric = {
  id: string;
  label: string;
  count: number;
  total: number;
  updatedAt: string | null;
};

export const ADMIN_PHASE5_TOTALS = {
  releaseGate: 10,
  smokeChecklist: 6,
  smokeRunbook: 5,
  security: 5,
  secrets: 5,
} as const;

export function resolveAdminCorsAllowlistValues(windowOrigin?: string | null): string[] {
  const env = getPublicAppEnv();
  const list = new Set([
    "https://neredeservis.app",
    "https://www.neredeservis.app",
    "https://app.neredeservis.app",
  ]);
  if (env !== "prod") {
    list.add("http://localhost:3000");
    if (windowOrigin) {
      list.add(windowOrigin);
    }
  }
  return Array.from(list);
}

export function resolveAdminCorsAllowlistTotal(windowOrigin?: string | null): number {
  return resolveAdminCorsAllowlistValues(windowOrigin).length;
}

export function isAdminPhase5MetricReady(metric: AdminPhase5Metric): boolean {
  return metric.count >= metric.total;
}

export function isAdminPhase5Ready(metrics: AdminPhase5Metric[]): boolean {
  return metrics.every((metric) => isAdminPhase5MetricReady(metric));
}

export function getAdminPhase5BlockingLabels(metrics: AdminPhase5Metric[]): string[] {
  return metrics
    .filter((metric) => !isAdminPhase5MetricReady(metric))
    .map((metric) => metric.label);
}

export function getAdminPhase5LatestUpdatedAt(metrics: AdminPhase5Metric[]): string | null {
  let latestMs = -1;
  let latestValue: string | null = null;
  for (const metric of metrics) {
    if (!metric.updatedAt) continue;
    const nextMs = Date.parse(metric.updatedAt);
    if (!Number.isFinite(nextMs)) continue;
    if (nextMs > latestMs) {
      latestMs = nextMs;
      latestValue = metric.updatedAt;
    }
  }
  return latestValue;
}

export function getAdminPhase5FreshnessMinutes(
  latestUpdatedAt: string | null,
  nowMs = Date.now(),
): number | null {
  if (!latestUpdatedAt) return null;
  const latestMs = Date.parse(latestUpdatedAt);
  if (!Number.isFinite(latestMs)) return null;
  const diffMs = Math.max(0, nowMs - latestMs);
  return Math.round(diffMs / 60000);
}

export function getAdminPhase5FreshnessLabel(
  latestUpdatedAt: string | null,
  nowMs = Date.now(),
): string {
  const minutes = getAdminPhase5FreshnessMinutes(latestUpdatedAt, nowMs);
  if (minutes === null) return "Tazelik: -";
  return `Tazelik: ${minutes} dk`;
}

export function getAdminPhase5FreshnessTone(
  latestUpdatedAt: string | null,
  nowMs = Date.now(),
): "ok" | "warn" {
  const minutes = getAdminPhase5FreshnessMinutes(latestUpdatedAt, nowMs);
  if (minutes === null) return "warn";
  return minutes > 180 ? "warn" : "ok";
}

export function buildAdminPhase5MetricLines(metrics: AdminPhase5Metric[]): string[] {
  return metrics.map((metric) => {
    const status = isAdminPhase5MetricReady(metric) ? "OK" : "BLOCK";
    return `[${status}] ${metric.label}: ${metric.count}/${metric.total}`;
  });
}

export function buildAdminPhase5ReadinessReportLines(
  readinessLabel: string,
  metrics: AdminPhase5Metric[],
  freshnessLabel: string,
  blockingLabels: string[],
): string[] {
  const baseLines = [readinessLabel, ...buildAdminPhase5MetricLines(metrics), freshnessLabel];
  if (blockingLabels.length === 0) {
    return baseLines;
  }
  return [...baseLines, "Bloklayan basliklar:", ...blockingLabels.map((item) => `- ${item}`)];
}
