"use client";

import { LiveOpsMapSplitPane } from "@/components/dashboard/live-ops-map-split-pane";
import { LiveOpsSelectedTripDetailPane } from "@/components/dashboard/live-ops-selected-trip-detail-pane";
import { TripsListPane } from "@/components/dashboard/live-ops-trips-list-pane";
import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { useLiveOpsCompanyActiveTripsState } from "@/components/dashboard/use-live-ops-company-active-trips-state";

export function LiveOpsCompanyActiveTripsFeature() {
  const liveOps = useLiveOpsCompanyActiveTripsState();

  const workspace =
    liveOps.authStatus !== "signed_in" ? (
      <DashboardStatePlaceholder
        tone="info"
        title="Oturum bekleniyor"
        description="Live Ops listesi için aktif oturum gerekiyor."
      />
    ) : !liveOps.companyId ? (
      <DashboardStatePlaceholder
        tone="empty"
        title="Aktif company secimi yok"
        description="Live Ops company context gerektirir. Once firma sec."
      />
    ) : (
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.25fr_0.8fr]">
        <TripsListPane
          status={liveOps.tripsQuery.status}
          isRefreshing={liveOps.tripsQuery.isRefreshing}
          lastLoadedAt={liveOps.tripsQuery.lastLoadedAt}
          rawTotalCount={liveOps.tripsQuery.items.length}
          items={liveOps.filteredAndSortedTrips}
          error={liveOps.tripsQuery.error}
          selectedTripId={liveOps.selectedTrip?.tripId ?? null}
          onSelectTripId={liveOps.handleSelectTripId}
          hoveredTripId={liveOps.effectiveHoveredTripId}
          onHoverTripId={liveOps.setHoveredTripId}
          onReload={() => liveOps.reloadActiveTrips()}
          autoRefreshEnabled={liveOps.autoRefreshEnabled}
          onToggleAutoRefresh={liveOps.handleToggleAutoRefresh}
          routeFilterId={liveOps.effectiveRouteFilterId}
          routeOptions={liveOps.routesQuery.items}
          onRouteFilterChange={liveOps.handleRouteFilterChange}
          driverFilterUid={liveOps.effectiveDriverFilterUid}
          driverOptions={liveOps.driverSelectOptions}
          onDriverFilterChange={liveOps.handleDriverFilterChange}
          streamIssueState={liveOps.streamIssueState}
          streamStatus={liveOps.selectedTripLiveStream.status}
          rtdbConnectionStatus={liveOps.rtdbConnection.status}
          selectedTripStreamRetryAttempt={liveOps.selectedTripLiveStream.retryAttempt}
          selectedTripStreamNextRetryAt={liveOps.selectedTripLiveStream.nextRetryAt}
          selectedTripStreamLagSeconds={liveOps.streamLagSeconds}
          selectedTripStreamStaleReason={liveOps.streamStaleReason}
          selectedTripAuthRefreshInFlight={liveOps.streamAuthRefreshInFlight}
          streamRecoverySummary={liveOps.streamRecoverySummary}
          searchText={liveOps.effectiveSearchText}
          onSearchTextChange={liveOps.handleSearchTextChange}
          sortOption={liveOps.effectiveSortOption}
          onSortOptionChange={liveOps.handleSortOptionChange}
          onResetFilters={liveOps.handleResetFilters}
          filterContext={liveOps.liveOpsFilterContext}
          density={liveOps.density}
          hideStale={liveOps.effectiveHideStale}
          onToggleHideStale={liveOps.handleToggleHideStale}
          riskToneFilter={liveOps.effectiveRiskTone}
          onRiskToneFilterChange={liveOps.handleRiskToneChange}
          riskQueueLimit={liveOps.effectiveRiskQueueLimit}
          onRiskQueueLimitChange={liveOps.handleRiskQueueLimitChange}
          hasActiveFilters={liveOps.hasActiveFilters}
          filterDurationMs={liveOps.filterDurationMs}
          readModelPressure={liveOps.readModelPressure}
          clipboardSupported={liveOps.clipboardSupported}
          copyViewLinkState={liveOps.copyViewLinkState}
          onCopyViewLink={() => void liveOps.handleCopyViewLink()}
        />

        <LiveOpsMapSplitPane
          selectedTrip={liveOps.selectedTrip}
          selectedTripStreamStatus={liveOps.selectedTripLiveStream.status}
          selectedTripStreamSnapshot={liveOps.selectedTripLiveStream.snapshot}
          streamIssueState={liveOps.streamIssueState}
          rtdbConnectionStatus={liveOps.rtdbConnection.status}
          visibleTrips={liveOps.mapVisibleTrips}
          selectedTripId={liveOps.selectedTrip?.tripId ?? null}
          hoveredTripId={liveOps.effectiveHoveredTripId}
          onSelectTripId={liveOps.handleSelectTripId}
          effectiveLiveCoords={liveOps.effectiveLiveCoords}
          selectedTripStops={liveOps.selectedTripStopsQuery.items}
          streamLagSeconds={liveOps.streamLagSeconds}
          selectedTripStreamRetryAttempt={liveOps.selectedTripLiveStream.retryAttempt}
          selectedTripStreamNextRetryAt={liveOps.selectedTripLiveStream.nextRetryAt}
          selectedTripStreamStaleReason={liveOps.streamStaleReason}
          selectedTripAuthRefreshInFlight={liveOps.streamAuthRefreshInFlight}
          riskToneFilter={liveOps.effectiveRiskTone}
          onRiskToneFilterChange={liveOps.handleRiskToneChange}
          hideStale={liveOps.effectiveHideStale}
          onToggleHideStale={liveOps.handleToggleHideStale}
          mapPinnedSelectedOutsideRisk={liveOps.mapPinnedSelectedOutsideRisk}
          mapRiskExcludedCount={liveOps.mapRiskExcludedCount}
          mapRiskHiddenByStaleCount={liveOps.mapRiskHiddenByStaleCount}
          mapRiskHiddenByStaleCriticalCount={liveOps.mapRiskHiddenByStaleCriticalCount}
          mapRiskHiddenByStaleWarningCount={liveOps.mapRiskHiddenByStaleWarningCount}
          mapMarkerLimit={liveOps.mapMarkerLimit}
        />

        <LiveOpsSelectedTripDetailPane
          selectedTrip={liveOps.selectedTrip}
          effectiveLiveCoords={liveOps.effectiveLiveCoords}
          streamStatus={liveOps.selectedTripLiveStream.status}
          streamSnapshot={liveOps.selectedTripLiveStream.snapshot}
          streamError={liveOps.selectedTripLiveStream.error}
          streamErrorSemantic={liveOps.selectedTripStreamErrorSemantic}
          streamIssueState={liveOps.streamIssueState}
          streamRetryAttempt={liveOps.selectedTripLiveStream.retryAttempt}
          streamNextRetryAt={liveOps.selectedTripLiveStream.nextRetryAt}
          streamStale={liveOps.streamStale}
          streamLagSeconds={liveOps.streamLagSeconds}
          streamStaleReason={liveOps.streamStaleReason}
          rtdbConnectionStatus={liveOps.rtdbConnection.status}
          rtdbConnectionError={liveOps.rtdbConnection.error}
          stopsStatus={liveOps.selectedTripStopsQuery.status}
          stopsError={liveOps.selectedTripStopsQuery.error}
          stops={liveOps.selectedTripStopsQuery.items}
          onReloadStops={() => liveOps.selectedTripStopsQuery.reload()}
          onOpenRouteEditor={liveOps.handleOpenRouteEditor}
          onOpenDriverRecord={liveOps.handleOpenDriverRecord}
          onCopyDispatchSummary={liveOps.handleCopyDispatchSummary}
          onCopyTripLink={liveOps.handleCopyTripLink}
          onSendWhatsApp={liveOps.handleSendWhatsApp}
          onCopyDispatchTemplate={liveOps.handleCopyDispatchTemplate}
          onSendWhatsAppTemplate={liveOps.handleSendWhatsAppTemplate}
          clipboardSupported={liveOps.clipboardSupported}
          dispatchCopyMessage={liveOps.dispatchCopyMessage}
          tripLinkCopyMessage={liveOps.tripLinkCopyMessage}
          whatsAppMessage={liveOps.whatsAppMessage}
          dispatchTemplateCopyMessage={liveOps.dispatchTemplateCopyMessage}
          dispatchTemplateWhatsAppMessage={liveOps.dispatchTemplateWhatsAppMessage}
          supportPacketCopyMessage={liveOps.supportPacketCopyMessage}
          dispatchHistoryCopyMessage={liveOps.dispatchHistoryCopyMessage}
          dispatchTemplateActions={liveOps.dispatchTemplateActions}
          dispatchHistory={liveOps.dispatchHistory}
          onClearDispatchHistory={liveOps.handleClearDispatchHistory}
          onCopyDispatchHistory={liveOps.handleCopyDispatchHistory}
          onCopySupportPacket={liveOps.handleCopySupportPacket}
        />
      </div>
    );

  return <>{workspace}</>;
}

