"use client";

import { useMemo } from "react";

import {
  buildLiveOpsStreamRecoverySummary,
  formatStreamRetryCountdown,
  formatLastSignal,
  formatStreamTimestamp,
  resolveLiveOpsStreamLagTone,
  resolveLiveOpsStreamContextMessage,
  streamRecoveryToneClasses,
  streamLagToneClasses,
  streamStaleReasonLabel,
  type LiveOpsStreamStaleReason,
  type LiveOpsRtdbConnectionStatus,
  type LiveOpsStreamStatus,
  type LiveOpsStreamIssueState,
  rtdbConnectionStatusLabel,
  statusLabel,
  streamStatusLabel,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import { LiveOpsOperatorPlaybookCard } from "@/components/dashboard/live-ops-operator-playbook-card";
import { LiveOpsStreamRecoveryCallout } from "@/components/dashboard/live-ops-stream-recovery-callout";
import { LiveOpsStreamIssueChip } from "@/components/dashboard/live-ops-stream-issue-chip";
import { LiveOpsStreamIssueBanner } from "@/components/dashboard/live-ops-stream-issue-banner";
import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";
import type {
  CompanyActiveTripSummary,
  CompanyRouteStopSummary,
} from "@/features/company/company-types";
import type { RouteLiveLocationStreamSnapshot } from "@/features/company/use-route-live-location-stream";
import type {
  DispatchHistoryEntry,
  DispatchTemplateAction,
  DispatchTemplateId,
} from "@/components/dashboard/use-live-ops-dispatch-actions";
import { buildLiveOpsTripInsight } from "@/components/dashboard/live-ops-selected-trip-insights";

type StopsStatus = "idle" | "loading" | "success" | "error";

export type LiveOpsSelectedTripDetailPaneProps = {
  selectedTrip: CompanyActiveTripSummary | null;
  effectiveLiveCoords:
    | {
        lat: number | null;
        lng: number | null;
        source: "rtdb_stream" | "rtdb" | "trip_doc";
        stale: boolean;
      }
    | null;
  streamStatus: LiveOpsStreamStatus;
  streamSnapshot: RouteLiveLocationStreamSnapshot | null;
  streamError: string | null;
  streamErrorSemantic: "none" | "access_denied" | "other_error";
  streamIssueState: LiveOpsStreamIssueState;
  streamRetryAttempt: number;
  streamNextRetryAt: number | null;
  streamStale: boolean;
  streamLagSeconds: number | null;
  streamStaleReason: LiveOpsStreamStaleReason;
  rtdbConnectionStatus: LiveOpsRtdbConnectionStatus;
  rtdbConnectionError: string | null;
  stopsStatus: StopsStatus;
  stopsError: unknown | null;
  stops: CompanyRouteStopSummary[];
  onReloadStops: () => void | Promise<void>;
  onOpenRouteEditor: () => void;
  onOpenDriverRecord: () => void;
  onCopyDispatchSummary: () => void | Promise<void>;
  onCopyTripLink: () => void | Promise<void>;
  onSendWhatsApp: () => void;
  onCopySupportPacket: () => void | Promise<void>;
  onCopyDispatchHistory: (tripId: string) => void | Promise<void>;
  onCopyDispatchTemplate: (templateId: DispatchTemplateId) => void | Promise<void>;
  onSendWhatsAppTemplate: (templateId: DispatchTemplateId) => void;
  clipboardSupported: boolean;
  dispatchCopyMessage: string | null;
  tripLinkCopyMessage: string | null;
  whatsAppMessage: string | null;
  dispatchTemplateCopyMessage: string | null;
  dispatchTemplateWhatsAppMessage: string | null;
  supportPacketCopyMessage: string | null;
  dispatchHistoryCopyMessage: string | null;
  dispatchTemplateActions: DispatchTemplateAction[];
  dispatchHistory: DispatchHistoryEntry[];
  onClearDispatchHistory: (tripId: string) => void;
};

export function LiveOpsSelectedTripDetailPane({
  selectedTrip,
  effectiveLiveCoords,
  streamStatus,
  streamSnapshot,
  streamError,
  streamErrorSemantic,
  streamIssueState,
  streamRetryAttempt,
  streamNextRetryAt,
  streamStale,
  streamLagSeconds,
  streamStaleReason,
  rtdbConnectionStatus,
  rtdbConnectionError,
  stopsStatus,
  stopsError,
  stops,
  onReloadStops,
  onOpenRouteEditor,
  onOpenDriverRecord,
  onCopyDispatchSummary,
  onCopyTripLink,
  onSendWhatsApp,
  onCopySupportPacket,
  onCopyDispatchHistory,
  onCopyDispatchTemplate,
  onSendWhatsAppTemplate,
  clipboardSupported,
  dispatchCopyMessage,
  tripLinkCopyMessage,
  whatsAppMessage,
  dispatchTemplateCopyMessage,
  dispatchTemplateWhatsAppMessage,
  supportPacketCopyMessage,
  dispatchHistoryCopyMessage,
  dispatchTemplateActions,
  dispatchHistory,
  onClearDispatchHistory,
}: LiveOpsSelectedTripDetailPaneProps) {
  const tripInsight = useMemo(() => {
    if (!selectedTrip) {
      return null;
    }
    return buildLiveOpsTripInsight({
      trip: selectedTrip,
      streamStatus,
      rtdbConnectionStatus,
      effectiveLiveCoords,
      stops,
    });
  }, [effectiveLiveCoords, rtdbConnectionStatus, selectedTrip, stops, streamStatus]);
  const selectedTripDispatchHistory = useMemo(() => {
    if (!selectedTrip) return [] as DispatchHistoryEntry[];
    return dispatchHistory.filter((item) => item.tripId === selectedTrip.tripId);
  }, [dispatchHistory, selectedTrip]);
  const streamLagTone = resolveLiveOpsStreamLagTone(streamLagSeconds);
  const streamRecoverySummary = buildLiveOpsStreamRecoverySummary({
    staleReason: streamStaleReason,
    lagSeconds: streamLagSeconds,
    retryAttempt: streamRetryAttempt,
    nextRetryAt: streamNextRetryAt,
  });
  const latestDispatchActionAt = selectedTripDispatchHistory[0]?.createdAtIso ?? null;
  const hiddenDispatchHistoryCount = Math.max(0, selectedTripDispatchHistory.length - 6);
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-900">Secili Sefer Detayi</div>
      {!selectedTrip ? (
        <DashboardStatePlaceholder
          tone="empty"
          title="Secili sefer yok"
          description="Listeden bir aktif sefer secildiginde detaylar burada gorunur."
        />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <LiveOpsStreamIssueChip issueState={streamIssueState} />
            {streamLagSeconds != null ? (
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${streamLagToneClasses(
                  streamLagTone,
                )}`}
              >
                Stream lag: {streamLagSeconds} sn
              </span>
            ) : null}
            {streamRecoverySummary.needsRecovery ? (
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${streamRecoveryToneClasses(
                  streamRecoverySummary.tone,
                )}`}
              >
                Toparlanma: {streamRecoverySummary.tone === "critical" ? "Kritik" : "Uyari"}
              </span>
            ) : null}
          </div>
          <LiveOpsStreamIssueBanner issueState={streamIssueState} className="rounded-xl px-3 py-2" />
          <LiveOpsStreamRecoveryCallout summary={streamRecoverySummary} className="rounded-xl" />
          {[ 
            ["Sofor", selectedTrip.driverName],
            ["Arac", selectedTrip.driverPlate ?? "-"],
            ["Rota", selectedTrip.routeName],
            [
              "Durum",
              `${statusLabel(selectedTrip.liveState)} (${formatLastSignal(selectedTrip.lastLocationAt)})`,
            ],
            [
              "Konum",
              effectiveLiveCoords?.lat != null && effectiveLiveCoords?.lng != null
                ? `${effectiveLiveCoords.lat.toFixed(5)}, ${effectiveLiveCoords.lng.toFixed(5)} (${effectiveLiveCoords.source})`
                : `Koordinat yok (${selectedTrip.live.source})`,
            ],
            ["RTDB Stream", streamStatusLabel(streamStatus)],
            [
              "Stream Ozet",
              resolveLiveOpsStreamContextMessage({
                streamIssueState,
                streamStatus,
                rtdbConnectionStatus,
              }),
            ],
            [
              "Stream Stale",
              streamStale ? "Stream gecikiyor / stale" : "Stream stabil",
            ],
            [
              "Stream Gecikme",
              streamLagSeconds == null ? "-" : `${streamLagSeconds} sn`,
            ],
            ["Stale Nedeni", streamStaleReasonLabel(streamStaleReason)],
            [
              "Stream Backoff",
              streamNextRetryAt
                ? `Deneme ${streamRetryAttempt} - ${formatStreamRetryCountdown(streamNextRetryAt)} sonra`
                : "-",
            ],
            ["RTDB Baglanti", rtdbConnectionStatusLabel(rtdbConnectionStatus)],
            [
              "RTDB Hata",
              streamErrorSemantic === "access_denied"
                ? "Yetki reddedildi"
                : streamError ?? rtdbConnectionError ?? "-",
            ],
            [
              "Stream Sinyal",
              formatStreamTimestamp(
                streamSnapshot?.timestampMs ?? null,
                streamSnapshot?.receivedAt ?? null,
              ),
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-white px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {label}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
            </div>
          ))}

          {tripInsight ? (
            <div className="rounded-xl border border-line bg-white p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Operasyon Icgorusu
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between rounded-lg border border-line bg-slate-50/70 px-2.5 py-2 text-xs">
                  <span className="font-semibold text-slate-900">Canli Risk</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-semibold ${
                      tripInsight.riskTone === "critical"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : tripInsight.riskTone === "warning"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {tripInsight.riskTone === "critical"
                      ? "Kritik"
                      : tripInsight.riskTone === "warning"
                        ? "Uyari"
                        : "Stabil"}
                  </span>
                </div>
                <div className="rounded-lg border border-line bg-slate-50/70 px-2.5 py-2 text-xs text-slate-700">
                  {tripInsight.riskReason}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-line bg-slate-50/70 px-2.5 py-2 text-xs">
                    <div className="text-muted">Yakin Durak</div>
                    <div className="mt-1 font-semibold text-slate-900">{tripInsight.nextStopLabel}</div>
                  </div>
                  <div className="rounded-lg border border-line bg-slate-50/70 px-2.5 py-2 text-xs">
                    <div className="text-muted">Tahmini Mesafe</div>
                    <div className="mt-1 font-semibold text-slate-900">{tripInsight.nextStopDistanceLabel}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-slate-50/70 px-2.5 py-2 text-xs">
                  <div className="text-muted">Sefer Suresi</div>
                  <div className="mt-1 font-semibold text-slate-900">{tripInsight.tripElapsedLabel}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-line bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Rota Duraklari (Preview)
              </div>
              <button
                type="button"
                onClick={() => void onReloadStops()}
                className="rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Yenile
              </button>
            </div>

            {stopsStatus === "loading" ? (
              <div className="text-xs text-muted">Duraklar yukleniyor...</div>
            ) : stopsStatus === "error" ? (
              <div className="text-xs text-rose-700">
                {mapCompanyCallableErrorToMessage(stopsError)}
              </div>
            ) : stops.length === 0 ? (
              <div className="text-xs text-muted">
                Bu rota icin durak bulunamadi. Route editor uzerinden durak eklenebilir.
              </div>
            ) : (
              <div className="space-y-1.5">
                {stops.slice(0, 5).map((stop) => (
                  <div
                    key={stop.stopId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-slate-50/70 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-900">
                        {stop.order + 1}. {stop.name}
                      </div>
                      <div className="truncate text-[11px] text-muted">
                        {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                      </div>
                    </div>
                    <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      #{stop.order + 1}
                    </span>
                  </div>
                ))}
                {stops.length > 5 ? (
                  <div className="pt-1 text-[11px] text-muted">
                    +{stops.length - 5} durak daha (route editor ekraninda goruntule)
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={onOpenRouteEditor}
              className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Route Editorunu Ac
            </button>
            <button
              type="button"
              onClick={onOpenDriverRecord}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Sofor Kaydina Git
            </button>
            <button
              type="button"
              onClick={() => void onCopyDispatchSummary()}
              disabled={!clipboardSupported}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              Sefer Ozetini Kopyala
            </button>
            <button
              type="button"
              onClick={() => void onCopyTripLink()}
              disabled={!clipboardSupported}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              Sefer Linkini Kopyala
            </button>
            <button
              type="button"
              onClick={onSendWhatsApp}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              WhatsApp ile Gonder
            </button>
            <button
              type="button"
              onClick={() => void onCopySupportPacket()}
              disabled={!clipboardSupported}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              Destek Paketini Kopyala
            </button>
            {!clipboardSupported ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Bu tarayicida pano API desteklenmiyor. Kopya aksiyonlari pasif.
              </div>
            ) : null}

            <div className="rounded-xl border border-line bg-white p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Dispatch Hazir Mesajlar
              </div>
              <div className="grid gap-2">
                {dispatchTemplateActions.map((template) => (
                  <div key={template.id} className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void onCopyDispatchTemplate(template.id)}
                      disabled={!clipboardSupported}
                      className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      Kopyala - {template.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendWhatsAppTemplate(template.id)}
                      className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      WhatsApp - {template.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <LiveOpsOperatorPlaybookCard
              tripInsight={tripInsight}
              streamIssueState={streamIssueState}
              onOpenRouteEditor={onOpenRouteEditor}
              onCopyTripLink={onCopyTripLink}
              onCopySupportPacket={onCopySupportPacket}
              onSendWhatsAppTemplate={onSendWhatsAppTemplate}
            />
            <div className="rounded-xl border border-line bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Son Dispatch Aksiyonlari ({selectedTripDispatchHistory.length})
                </div>
                {latestDispatchActionAt ? (
                  <div className="text-[11px] text-muted">
                    Son aksiyon:{" "}
                    {new Date(latestDispatchActionAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void onCopyDispatchHistory(selectedTrip.tripId)}
                    disabled={!clipboardSupported}
                    className="rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    Gecmisi Kopyala
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearDispatchHistory(selectedTrip.tripId)}
                    className="rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Bu Seferi Temizle
                  </button>
                </div>
              </div>
              {selectedTripDispatchHistory.length === 0 ? (
                <div className="text-xs text-muted">
                  Bu sefer icin dispatch aksiyonu henuz yok.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedTripDispatchHistory.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-line bg-slate-50/70 px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-medium text-slate-900">{item.label}</span>
                        <span className="text-muted">
                          {item.channel === "copy" ? "Kopyala" : "WhatsApp"} -{" "}
                          {new Date(item.createdAtIso).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  {hiddenDispatchHistoryCount > 0 ? (
                    <div className="pt-1 text-[11px] text-muted">
                      +{hiddenDispatchHistoryCount} dispatch aksiyonu daha
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {dispatchCopyMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {dispatchCopyMessage}
              </div>
            ) : null}
            {tripLinkCopyMessage ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                {tripLinkCopyMessage}
              </div>
            ) : null}
            {whatsAppMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                {whatsAppMessage}
              </div>
            ) : null}
            {dispatchTemplateCopyMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {dispatchTemplateCopyMessage}
              </div>
            ) : null}
            {dispatchTemplateWhatsAppMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                {dispatchTemplateWhatsAppMessage}
              </div>
            ) : null}
            {supportPacketCopyMessage ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                {supportPacketCopyMessage}
              </div>
            ) : null}
            {dispatchHistoryCopyMessage ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
                {dispatchHistoryCopyMessage}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
