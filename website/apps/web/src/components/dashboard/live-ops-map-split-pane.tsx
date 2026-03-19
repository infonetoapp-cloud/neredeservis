"use client";

import { LiveOpsMapboxCanvas } from "@/components/dashboard/live-ops-mapbox-canvas";
import { LiveOpsStreamRecoveryCallout } from "@/components/dashboard/live-ops-stream-recovery-callout";
import { LiveOpsStreamIssueChip } from "@/components/dashboard/live-ops-stream-issue-chip";
import { LiveOpsStreamIssueBanner } from "@/components/dashboard/live-ops-stream-issue-banner";
import {
  buildLiveOpsStreamRecoverySummary,
  buildLiveOpsMapTelemetry,
  evaluateLiveOpsTripRisk,
  formatLastSignal,
  formatStreamTimestamp,
  resolveLiveOpsStreamContextMessage,
  resolveLiveOpsStreamLagTone,
  streamRecoveryToneClasses,
  streamLagToneClasses,
  type LiveOpsRtdbConnectionStatus,
  type LiveOpsRiskTone,
  type LiveOpsStreamStaleReason,
  type LiveOpsStreamStatus,
  type LiveOpsStreamIssueState,
  rtdbConnectionStatusClasses,
  rtdbConnectionStatusLabel,
  statusLabel,
  streamStatusClasses,
  streamStatusLabel,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import type { CompanyActiveTripSummary, CompanyRouteStopSummary } from "@/features/company/company-types";
import type { RouteLiveLocationStreamSnapshot } from "@/features/company/use-route-live-location-stream";

export type LiveOpsMapSplitPaneProps = {
  selectedTrip: CompanyActiveTripSummary | null;
  selectedTripStreamStatus: LiveOpsStreamStatus;
  selectedTripStreamSnapshot: RouteLiveLocationStreamSnapshot | null;
  streamIssueState: LiveOpsStreamIssueState;
  rtdbConnectionStatus: LiveOpsRtdbConnectionStatus;
  visibleTrips: CompanyActiveTripSummary[];
  selectedTripId: string | null;
  hoveredTripId: string | null;
  onSelectTripId: (tripId: string) => void;
  effectiveLiveCoords: {
    lat: number | null;
    lng: number | null;
    source: "rtdb_stream" | "rtdb" | "trip_doc";
    stale: boolean;
  } | null;
  selectedTripStops: CompanyRouteStopSummary[];
  streamLagSeconds: number | null;
  selectedTripStreamRetryAttempt: number;
  selectedTripStreamNextRetryAt: number | null;
  selectedTripStreamStaleReason: LiveOpsStreamStaleReason;
  selectedTripAuthRefreshInFlight: boolean;
  riskToneFilter: LiveOpsRiskTone | null;
  onRiskToneFilterChange: (tone: LiveOpsRiskTone | null) => void;
  hideStale: boolean;
  onToggleHideStale: () => void;
  mapPinnedSelectedOutsideRisk: boolean;
  mapRiskExcludedCount: number;
  mapRiskHiddenByStaleCount: number;
  mapRiskHiddenByStaleCriticalCount: number;
  mapRiskHiddenByStaleWarningCount: number;
  mapMarkerLimit: number;
};

function liveSourceLabel(
  source: "rtdb_stream" | "rtdb" | "trip_doc" | null,
  stale: boolean,
) {
  if (source == null) return "Konum kaynagi yok";
  if (source === "rtdb_stream") return stale ? "Kaynak: RTDB Stream (stale)" : "Kaynak: RTDB Stream";
  if (source === "rtdb") return stale ? "Kaynak: RTDB (stale)" : "Kaynak: RTDB";
  return stale ? "Kaynak: Trip Doc (stale)" : "Kaynak: Trip Doc";
}

export function LiveOpsMapSplitPane({
  selectedTrip,
  selectedTripStreamStatus,
  selectedTripStreamSnapshot,
  streamIssueState,
  rtdbConnectionStatus,
  visibleTrips,
  selectedTripId,
  hoveredTripId,
  onSelectTripId,
  effectiveLiveCoords,
  selectedTripStops,
  streamLagSeconds,
  selectedTripStreamRetryAttempt,
  selectedTripStreamNextRetryAt,
  selectedTripStreamStaleReason,
  selectedTripAuthRefreshInFlight,
  riskToneFilter,
  onRiskToneFilterChange,
  hideStale,
  onToggleHideStale,
  mapPinnedSelectedOutsideRisk,
  mapRiskExcludedCount,
  mapRiskHiddenByStaleCount,
  mapRiskHiddenByStaleCriticalCount,
  mapRiskHiddenByStaleWarningCount,
  mapMarkerLimit,
}: LiveOpsMapSplitPaneProps) {
  const mapTelemetry = buildLiveOpsMapTelemetry(visibleTrips);
  const mapPerfClass =
    mapTelemetry.perfTone === "slow"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : mapTelemetry.perfTone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const mapHealthClass =
    mapTelemetry.healthLabel === "Kritik"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : mapTelemetry.healthLabel === "Izlenmeli"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const mapCriticalTotal = mapTelemetry.criticalCount + mapRiskHiddenByStaleCriticalCount;
  const mapWarningTotal = mapTelemetry.warningCount + mapRiskHiddenByStaleWarningCount;
  const mapRiskExcludedPercent =
    riskToneFilter && mapTelemetry.totalCount > 0
      ? Math.round((mapRiskExcludedCount / mapTelemetry.totalCount) * 100)
      : 0;
  const mapRiskDensityClasses =
    mapTelemetry.riskDensityPercent >= 60
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : mapTelemetry.riskDensityPercent >= 30
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const activeToneVisibleCount =
    riskToneFilter === "critical"
      ? mapTelemetry.criticalCount
      : riskToneFilter === "warning"
        ? mapTelemetry.warningCount
        : 0;
  const activeToneHiddenByStaleCount =
    riskToneFilter === "critical"
      ? mapRiskHiddenByStaleCriticalCount
      : riskToneFilter === "warning"
        ? mapRiskHiddenByStaleWarningCount
        : 0;
  const activeToneTotalCount = activeToneVisibleCount + activeToneHiddenByStaleCount;
  const showHiddenOnlyRiskHint =
    Boolean(riskToneFilter) &&
    hideStale &&
    activeToneVisibleCount === 0 &&
    activeToneHiddenByStaleCount > 0;
  const selectedTripRiskTone = selectedTrip ? evaluateLiveOpsTripRisk(selectedTrip)?.tone ?? null : null;
  const showNoTrips = mapTelemetry.totalCount === 0;
  const streamLagTone = resolveLiveOpsStreamLagTone(streamLagSeconds);
  const streamRecoverySummary = buildLiveOpsStreamRecoverySummary({
    staleReason: selectedTripStreamStaleReason,
    lagSeconds: streamLagSeconds,
    retryAttempt: selectedTripStreamRetryAttempt,
    nextRetryAt: selectedTripStreamNextRetryAt,
  });

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">Harita / Split View</div>
          <div className="text-xs text-muted">
            Secili sefer stream overlay ve gorunen markerlar read-side fallback ile birlikte
            gosterilir
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
            {selectedTrip ? statusLabel(selectedTrip.liveState) : "Secim yok"}
          </span>
          {selectedTrip ? (
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              Son Sinyal: {formatLastSignal(selectedTrip.lastLocationAt)}
            </span>
          ) : null}
          {mapTelemetry.criticalCount > 0 ? (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
              {mapTelemetry.criticalCount} Kritik
            </span>
          ) : null}
          {mapTelemetry.warningCount > 0 ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
              {mapTelemetry.warningCount} Uyarı
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onRiskToneFilterChange(riskToneFilter === "critical" ? null : "critical")}
            disabled={mapCriticalTotal === 0}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
              riskToneFilter === "critical"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-line bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Kritik Odagi ({mapCriticalTotal})
          </button>
          <button
            type="button"
            onClick={() => onRiskToneFilterChange(riskToneFilter === "warning" ? null : "warning")}
            disabled={mapWarningTotal === 0}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
              riskToneFilter === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-line bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Uyarı Odagi ({mapWarningTotal})
          </button>
          {riskToneFilter ? (
            <button
              type="button"
              onClick={() => onRiskToneFilterChange(null)}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Odagi Temizle
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleHideStale}
            aria-pressed={hideStale}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
              hideStale
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-line bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {hideStale ? "Belirsiz Gizli" : "Belirsiz Göster"}
          </button>
        </div>
      </div>
      {showHiddenOnlyRiskHint ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-xs text-indigo-800">
          <span>
            {riskToneFilter === "critical" ? "Kritik" : "Uyarı"} odaginda gorunen marker yok.
            {` ${activeToneHiddenByStaleCount} kayıt stale-gizli.`}
          </span>
          <button
            type="button"
            onClick={onToggleHideStale}
            className="rounded-md border border-indigo-300 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Stale Gorunurlugunu Ac
          </button>
        </div>
      ) : null}
      <LiveOpsStreamIssueBanner issueState={streamIssueState} className="mb-3" />
      <LiveOpsStreamRecoveryCallout summary={streamRecoverySummary} className="mb-3" />
      {mapTelemetry.perfTone === "slow" ? (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-800">
          Marker yogunlugu yuksek ({mapTelemetry.totalCount}). Harita stabilitesi için stale gizle veya risk odagi filtrelerini ac.
        </div>
      ) : null}
      {mapMarkerLimit < 200 ? (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
          Performans koruma modu aktif: marker limiti {mapMarkerLimit}. Yuk azaldiginda limit otomatik 200e doner.
        </div>
      ) : null}
      <div className="relative h-[360px] overflow-hidden rounded-xl border border-line bg-gradient-to-br from-slate-100 via-white to-blue-50">
        <div className="absolute inset-x-4 top-4">
          <div className="inline-block rounded-xl border border-line bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm">
            {selectedTrip
              ? `${selectedTrip.driverPlate ?? "Plaka yok"} secili · ${formatStreamTimestamp(
                  selectedTripStreamSnapshot?.timestampMs ?? null,
                  selectedTripStreamSnapshot?.receivedAt ?? selectedTrip.lastLocationAt,
                )}`
              : "Secili sefer yok"}
          </div>
        </div>

        {showNoTrips ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-6 max-w-sm rounded-2xl border border-line bg-white/90 p-4 text-xs text-slate-700 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Aktif sefer yok</div>
              <div className="mt-1 text-xs text-muted">
                Araclar sefer baslattiginda markerlar otomatik görünür. Filtreler
                nedeniyle gizlendiyse asagidaki aksiyonlari kullan.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {riskToneFilter ? (
                  <button
                    type="button"
                    onClick={() => onRiskToneFilterChange(null)}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Risk Odagini Temizle
                  </button>
                ) : null}
                {hideStale ? (
                  <button
                    type="button"
                    onClick={onToggleHideStale}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Stale Gorunurlugunu Ac
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <LiveOpsMapboxCanvas
          trips={visibleTrips}
          selectedTripId={selectedTripId}
          hoveredTripId={hoveredTripId}
          effectiveLiveCoords={effectiveLiveCoords}
          selectedTripStops={selectedTripStops}
          maxMarkerCount={mapMarkerLimit}
          onSelectTripId={onSelectTripId}
        />
      </div>
    </section>
  );
}

