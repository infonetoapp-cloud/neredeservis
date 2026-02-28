"use client";

import { useEffect, useMemo } from "react";

import {
  evaluateLiveOpsTripRisk,
  formatStreamRetryCountdown,
  formatLastSignal,
  resolveLiveOpsStreamLagTone,
  streamLagToneClasses,
  streamStaleReasonLabel,
  type LiveOpsFilterContext,
  type LiveOpsRtdbConnectionStatus,
  type LiveOpsStreamRecoverySummary,
  statusBadgeClasses,
  statusLabel,
  type LiveOpsRiskQueueLimit,
  type LiveOpsRiskTone,
  type LiveOpsStreamStatus,
  type LiveOpsStreamStaleReason,
  type LiveOpsStreamIssueState,
  type LiveOpsSortOption
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import { LiveOpsRiskPriorityQueue } from "@/components/dashboard/live-ops-risk-priority-queue";
import { LiveOpsTripsListToolbar } from "@/components/dashboard/live-ops-trips-list-toolbar";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";
import type { CompanyActiveTripSummary, CompanyRouteSummary } from "@/features/company/company-types";

export type TripsListPaneProps = {
  status: "idle" | "loading" | "success" | "error";
  isRefreshing: boolean;
  lastLoadedAt: string | null;
  rawTotalCount: number;
  items: CompanyActiveTripSummary[];
  error: unknown | null;
  selectedTripId: string | null;
  onSelectTripId: (tripId: string) => void;
  hoveredTripId: string | null;
  onHoverTripId: (tripId: string | null) => void;
  onReload: () => Promise<void> | void;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  routeFilterId: string | null;
  routeOptions: CompanyRouteSummary[];
  onRouteFilterChange: (routeId: string | null) => void;
  driverFilterUid: string | null;
  driverOptions: Array<{ uid: string; label: string }>;
  onDriverFilterChange: (driverUid: string | null) => void;
  streamIssueState: LiveOpsStreamIssueState;
  streamStatus: LiveOpsStreamStatus;
  rtdbConnectionStatus: LiveOpsRtdbConnectionStatus;
  selectedTripStreamRetryAttempt: number;
  selectedTripStreamNextRetryAt: number | null;
  selectedTripStreamLagSeconds: number | null;
  selectedTripStreamStaleReason: LiveOpsStreamStaleReason;
  selectedTripAuthRefreshInFlight: boolean;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  sortOption: LiveOpsSortOption;
  onSortOptionChange: (value: LiveOpsSortOption) => void;
  onResetFilters: () => void;
  filterContext: LiveOpsFilterContext;
  density: "comfortable" | "compact";
  hideStale: boolean;
  onToggleHideStale: () => void;
  riskToneFilter: LiveOpsRiskTone | null;
  onRiskToneFilterChange: (tone: LiveOpsRiskTone | null) => void;
  riskQueueLimit: LiveOpsRiskQueueLimit;
  onRiskQueueLimitChange: (limit: LiveOpsRiskQueueLimit) => void;
  hasActiveFilters: boolean;
  filterDurationMs: number;
  readModelPressure: {
    tripCount: number;
    filterDurationMs: number;
    level: "ok" | "warn" | "high";
  };
  clipboardSupported: boolean;
  copyViewLinkState: "idle" | "copied" | "error";
  onCopyViewLink: () => void;
};

function riskBadgeClasses(tone: LiveOpsRiskTone) {
  if (tone === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function riskMetaClasses(tone: LiveOpsRiskTone) {
  if (tone === "critical") {
    return "text-rose-700";
  }
  return "text-amber-700";
}

export function TripsListPane({
  status,
  isRefreshing,
  lastLoadedAt,
  rawTotalCount,
  items,
  error,
  selectedTripId,
  onSelectTripId,
  hoveredTripId,
  onHoverTripId,
  onReload,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  routeFilterId,
  routeOptions,
  onRouteFilterChange,
  driverFilterUid,
  driverOptions,
  onDriverFilterChange,
  streamIssueState,
  streamStatus,
  rtdbConnectionStatus,
  selectedTripStreamRetryAttempt,
  selectedTripStreamNextRetryAt,
  selectedTripStreamLagSeconds,
  selectedTripStreamStaleReason,
  selectedTripAuthRefreshInFlight,
  streamRecoverySummary,
  searchText,
  onSearchTextChange,
  sortOption,
  onSortOptionChange,
  onResetFilters,
  filterContext,
  density,
  hideStale,
  onToggleHideStale,
  riskToneFilter,
  onRiskToneFilterChange,
  riskQueueLimit,
  onRiskQueueLimitChange,
  hasActiveFilters,
  filterDurationMs,
  readModelPressure,
  clipboardSupported,
  copyViewLinkState,
  onCopyViewLink,
}: TripsListPaneProps) {
  const visibleItems = useMemo(
    () => (hideStale ? items.filter((item) => item.liveState !== "stale") : items),
    [hideStale, items],
  );
  const riskFocusedItems = useMemo(() => {
    if (!riskToneFilter) return visibleItems;
    return visibleItems.filter((item) => evaluateLiveOpsTripRisk(item)?.tone === riskToneFilter);
  }, [riskToneFilter, visibleItems]);
  const riskFocusedItemsAll = useMemo(() => {
    if (!riskToneFilter) return items;
    return items.filter((item) => evaluateLiveOpsTripRisk(item)?.tone === riskToneFilter);
  }, [items, riskToneFilter]);
  const riskHiddenByStaleCount = useMemo(() => {
    if (!riskToneFilter || !hideStale) return 0;
    return riskFocusedItemsAll.filter((item) => item.liveState === "stale").length;
  }, [hideStale, riskFocusedItemsAll, riskToneFilter]);
  const onlineCount = useMemo(
    () => items.filter((item) => item.liveState === "online").length,
    [items],
  );
  const staleCount = items.length - onlineCount;
  const { riskCount, criticalRiskCount, warningRiskCount } = useMemo(() => {
    let critical = 0;
    let warning = 0;
    for (const item of items) {
      const risk = evaluateLiveOpsTripRisk(item);
      if (!risk) continue;
      if (risk.tone === "critical") critical += 1;
      if (risk.tone === "warning") warning += 1;
    }
    return {
      riskCount: critical + warning,
      criticalRiskCount: critical,
      warningRiskCount: warning,
    };
  }, [items]);
  const rowClass = density === "compact" ? "px-3 py-2" : "px-3 py-3";
  const riskFilterTotal =
    riskToneFilter === "critical"
      ? criticalRiskCount
      : riskToneFilter === "warning"
        ? warningRiskCount
        : 0;
  const selectedTripLagTone = resolveLiveOpsStreamLagTone(selectedTripStreamLagSeconds);
  const selectedTripStaleReasonLabel =
    selectedTripStreamStaleReason === "none"
      ? null
      : streamStaleReasonLabel(selectedTripStreamStaleReason);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.key.toLowerCase() !== "h") return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      event.preventDefault();
      onToggleHideStale();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleHideStale]);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <LiveOpsTripsListToolbar
        isRefreshing={isRefreshing}
        lastLoadedAt={lastLoadedAt}
        density={density}
        filteredCount={items.length}
        onlineCount={onlineCount}
        staleCount={staleCount}
        riskCount={riskCount}
        criticalRiskCount={criticalRiskCount}
        warningRiskCount={warningRiskCount}
        riskFocusedCount={riskFocusedItems.length}
        riskHiddenByStaleCount={riskHiddenByStaleCount}
        riskQueueLimit={riskQueueLimit}
        rawTotalCount={rawTotalCount}
        autoRefreshEnabled={autoRefreshEnabled}
        hideStale={hideStale}
        riskToneFilter={riskToneFilter}
        clipboardSupported={clipboardSupported}
        copyViewLinkState={copyViewLinkState}
        hasActiveFilters={hasActiveFilters}
        filterDurationMs={filterDurationMs}
        readModelPressure={readModelPressure}
        searchText={searchText}
        routeFilterId={routeFilterId}
        routeOptions={routeOptions}
        driverFilterUid={driverFilterUid}
        driverOptions={driverOptions}
        streamIssueState={streamIssueState}
        streamRecoverySummary={streamRecoverySummary}
        streamStatus={streamStatus}
        rtdbConnectionStatus={rtdbConnectionStatus}
        selectedTripStreamLagSeconds={selectedTripStreamLagSeconds}
        selectedTripAuthRefreshInFlight={selectedTripAuthRefreshInFlight}
        sortOption={sortOption}
        onReload={onReload}
        onToggleAutoRefresh={onToggleAutoRefresh}
        onToggleHideStale={onToggleHideStale}
        onRiskToneFilterChange={onRiskToneFilterChange}
        onRiskQueueLimitChange={onRiskQueueLimitChange}
        onCopyViewLink={onCopyViewLink}
        onResetFilters={onResetFilters}
        onSearchTextChange={onSearchTextChange}
        onRouteFilterChange={onRouteFilterChange}
        onDriverFilterChange={onDriverFilterChange}
        onSortOptionChange={onSortOptionChange}
        filterContext={filterContext}
      />

      {status === "success" ? (
        <div className="mb-3">
          <LiveOpsRiskPriorityQueue
            items={items}
            selectedTripId={selectedTripId}
            onSelectTripId={onSelectTripId}
            activeToneFilter={riskToneFilter}
            onToneFilterChange={onRiskToneFilterChange}
          sortOption={sortOption}
          onSortOptionChange={onSortOptionChange}
          queueLimit={riskQueueLimit}
          onQueueLimitChange={onRiskQueueLimitChange}
          hideStale={hideStale}
          onToggleHideStale={onToggleHideStale}
          streamIssueState={streamIssueState}
          streamRecoverySummary={streamRecoverySummary}
          filterContext={filterContext}
        />
      </div>
      ) : null}

      {status === "loading" ? (
        <p className="text-xs text-slate-500">Aktif seferler yukleniyor...</p>
      ) : status === "error" ? (
        <div className="space-y-2">
          <p className="text-xs text-rose-700">{mapCompanyCallableErrorToMessage(error)}</p>
          <button
            type="button"
            onClick={() => void onReload()}
            className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
          >
            Tekrar Dene
          </button>
        </div>
      ) : riskFocusedItems.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            {rawTotalCount === 0
              ? "Aktif sefer bulunamadi. Driver startTrip yaptiginda burada listelenecek."
              : items.length === 0
                ? "Arama/filtre kriterlerine uygun sefer bulunamadi."
                : riskToneFilter
                  ? `Risk odagina uyan gorunen sefer yok (Toplam ${riskFilterTotal}${riskHiddenByStaleCount > 0 ? `, stale gizlenen ${riskHiddenByStaleCount}` : ""}).`
                  : "Filtreye uyan seferler stale oldugu icin gizlendi."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {riskToneFilter ? (
              <button
                type="button"
                onClick={() => onRiskToneFilterChange(null)}
                className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
              >
                Risk Odagini Temizle
              </button>
            ) : null}
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
              >
                Filtreleri Sifirla
              </button>
            ) : null}
            {riskToneFilter && hideStale && riskHiddenByStaleCount > 0 ? (
              <button
                type="button"
                onClick={onToggleHideStale}
                className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
              >
                Stale Gorunurlugunu Ac
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {riskFocusedItems.map((trip) => {
            const tripRisk = evaluateLiveOpsTripRisk(trip);
            const isSelectedTrip = trip.tripId === selectedTripId;
            return (
              <button
                key={trip.tripId}
                type="button"
                onClick={() => onSelectTripId(trip.tripId)}
                onMouseEnter={() => onHoverTripId(trip.tripId)}
                onMouseLeave={() => onHoverTripId(null)}
                onFocus={() => onHoverTripId(trip.tripId)}
                onBlur={() => onHoverTripId(null)}
                className={`w-full rounded-xl border text-left transition ${
                  trip.tripId === selectedTripId
                    ? "border-blue-200 bg-blue-50/70 ring-1 ring-blue-100"
                    : "border-line bg-white hover:bg-slate-50"
                } ${
                  hoveredTripId === trip.tripId && trip.tripId !== selectedTripId
                    ? "ring-1 ring-slate-300"
                    : ""
                } ${rowClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {trip.driverPlate ?? "Plaka yok"}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted">{trip.routeName}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClasses(
                        trip.liveState,
                      )}`}
                    >
                      {statusLabel(trip.liveState)}
                    </span>
                    {tripRisk ? (
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskBadgeClasses(
                          tripRisk.tone,
                        )}`}
                      >
                        {tripRisk.tone === "critical" ? "Kritik" : "Uyari"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{trip.driverName}</span>
                  <span>Son sinyal: {formatLastSignal(trip.lastLocationAt)}</span>
                  {tripRisk ? (
                    <span className={`font-medium ${riskMetaClasses(tripRisk.tone)}`}>
                      Risk: {tripRisk.reason}
                    </span>
                  ) : null}
                  {isSelectedTrip && selectedTripStreamLagSeconds != null ? (
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${streamLagToneClasses(
                        selectedTripLagTone,
                      )}`}
                    >
                      Stream lag: {selectedTripStreamLagSeconds} sn
                    </span>
                  ) : null}
                  {isSelectedTrip && selectedTripStaleReasonLabel ? (
                    <span className="font-medium text-amber-700">
                      Stale nedeni: {selectedTripStaleReasonLabel}
                    </span>
                  ) : null}
                  {isSelectedTrip && selectedTripStreamNextRetryAt != null ? (
                    <span className="font-medium text-slate-600">
                      Backoff: Deneme {selectedTripStreamRetryAttempt} -{" "}
                      {formatStreamRetryCountdown(selectedTripStreamNextRetryAt)} sonra
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
