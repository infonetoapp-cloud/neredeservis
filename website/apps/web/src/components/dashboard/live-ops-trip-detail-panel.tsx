"use client";

import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import {
  formatLastSignal,
  formatStreamTimestamp,
  rtdbConnectionStatusLabel,
  statusLabel,
  streamStatusLabel,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";
import type {
  CompanyActiveTripSummary,
  CompanyRouteStopSummary,
} from "@/features/company/company-types";
import type { RouteLiveLocationStreamSnapshot } from "@/features/company/use-route-live-location-stream";

type SelectedTripLiveStream = {
  status: "idle" | "connecting" | "live" | "mismatch" | "error";
  error: string | null;
  snapshot: RouteLiveLocationStreamSnapshot | null;
};

type RtdbConnectionState = {
  status: "idle" | "connecting" | "online" | "offline" | "error";
  error: string | null;
};

type SelectedTripStopsState = {
  status: "idle" | "loading" | "success" | "error";
  items: CompanyRouteStopSummary[];
  error: string | null;
  reload: () => Promise<void> | void;
};

export type LiveOpsTripDetailPanelProps = {
  selectedTrip: CompanyActiveTripSummary | null;
  selectedTripLiveStream: SelectedTripLiveStream;
  selectedTripStreamErrorSemantic: "none" | "access_denied" | "other_error";
  rtdbConnection: RtdbConnectionState;
  effectiveLiveCoords:
    | { lat: number | null; lng: number | null; source?: string | null }
    | null;
  selectedTripStopsQuery: SelectedTripStopsState;
  onOpenRouteEditor: () => void;
  onOpenDriverRecord: () => void;
  onCopyDispatchSummary: () => Promise<void> | void;
  onCopyTripLink: () => Promise<void> | void;
  onSendWhatsApp: () => void;
  dispatchCopyMessage: string | null;
  tripLinkCopyMessage: string | null;
  whatsAppMessage: string | null;
};

export function LiveOpsTripDetailPanel({
  selectedTrip,
  selectedTripLiveStream,
  selectedTripStreamErrorSemantic,
  rtdbConnection,
  effectiveLiveCoords,
  selectedTripStopsQuery,
  onOpenRouteEditor,
  onOpenDriverRecord,
  onCopyDispatchSummary,
  onCopyTripLink,
  onSendWhatsApp,
  dispatchCopyMessage,
  tripLinkCopyMessage,
  whatsAppMessage,
}: LiveOpsTripDetailPanelProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-900">
        Secili Sefer Detayi
      </div>
      {!selectedTrip ? (
        <DashboardStatePlaceholder
          tone="empty"
          title="Secili sefer yok"
          description="Listeden bir aktif sefer secildiginde detaylar burada gorunur."
        />
      ) : (
        <div className="space-y-2">
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
            ["RTDB Stream", streamStatusLabel(selectedTripLiveStream.status)],
            ["RTDB Baglanti", rtdbConnectionStatusLabel(rtdbConnection.status)],
            [
              "RTDB Hata",
              selectedTripStreamErrorSemantic === "access_denied"
                ? "Yetki reddedildi"
                : selectedTripLiveStream.error ?? rtdbConnection.error ?? "-",
            ],
            [
              "Stream Sinyal",
              formatStreamTimestamp(
                selectedTripLiveStream.snapshot?.timestampMs ?? null,
                selectedTripLiveStream.snapshot?.receivedAt ?? null,
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

          <div className="rounded-xl border border-line bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Rota Duraklari (Preview)
              </div>
              <button
                type="button"
                onClick={() => void selectedTripStopsQuery.reload()}
                className="rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Yenile
              </button>
            </div>

            {selectedTripStopsQuery.status === "loading" ? (
              <div className="text-xs text-muted">Duraklar yukleniyor...</div>
            ) : selectedTripStopsQuery.status === "error" ? (
              <div className="text-xs text-rose-700">
                {mapCompanyCallableErrorToMessage(selectedTripStopsQuery.error)}
              </div>
            ) : selectedTripStopsQuery.items.length === 0 ? (
              <div className="text-xs text-muted">
                Bu rota icin durak bulunamadi. Route editor uzerinden durak
                eklenebilir.
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedTripStopsQuery.items.slice(0, 5).map((stop) => (
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
                {selectedTripStopsQuery.items.length > 5 ? (
                  <div className="pt-1 text-[11px] text-muted">
                    +{selectedTripStopsQuery.items.length - 5} durak daha (route
                    editor ekraninda goruntule)
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={onOpenRouteEditor}
              disabled={!selectedTrip}
              className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Route Editorunu Ac
            </button>
            <button
              type="button"
              onClick={onOpenDriverRecord}
              disabled={!selectedTrip}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Sofor Kaydina Git
            </button>
            <button
              type="button"
              onClick={() => void onCopyDispatchSummary()}
              disabled={!selectedTrip}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Sefer Ozetini Kopyala
            </button>
            <button
              type="button"
              onClick={() => void onCopyTripLink()}
              disabled={!selectedTrip}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Sefer Linkini Kopyala
            </button>
            <button
              type="button"
              onClick={onSendWhatsApp}
              disabled={!selectedTrip}
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              WhatsApp ile Gonder
            </button>
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
          </div>
        </div>
      )}
    </section>
  );
}
