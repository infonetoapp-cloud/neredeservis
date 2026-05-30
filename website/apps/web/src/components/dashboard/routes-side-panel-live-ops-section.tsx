"use client";

import { useRouter } from "next/navigation";

import type { CompanyActiveTripSummary, CompanyRouteSummary } from "@/features/company/company-types";

type CopyLinkState = "idle" | "copied" | "error";

type RoutesSidePanelLiveOpsSectionProps = {
  selectedRoute: CompanyRouteSummary | null;
  activeTrips: readonly CompanyActiveTripSummary[];
  activeTripsLoadStatus: "idle" | "loading" | "success" | "error";
  copyLinkState: CopyLinkState;
  onCopyViewLink: () => void;
};

export function RoutesSidePanelLiveOpsSection({
  selectedRoute,
  activeTrips,
  activeTripsLoadStatus,
  copyLinkState,
  onCopyViewLink,
}: RoutesSidePanelLiveOpsSectionProps) {
  const router = useRouter();
  const copyLinkMessage =
    copyLinkState === "copied"
      ? "Link panoya kopyalandi."
      : copyLinkState === "error"
        ? "Link kopyalanamadi. Tarayici iznini kontrol et."
        : "Filtre ve secim query'siyle paylasim yapabilirsin.";
  const copyLinkToneClass =
    copyLinkState === "error"
      ? "mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
      : "mt-2 text-xs text-muted";

  return (
    <>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Canlı Operasyon Gecisi</div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!selectedRoute) return;
              router.push(`/live-ops?routeId=${encodeURIComponent(selectedRoute.routeId)}&sort=signal_desc`);
            }}
            disabled={!selectedRoute}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Bu Rotanin Canlı Seferlerini Ac
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedRoute) return;
              router.push(`/live-ops?routeId=${encodeURIComponent(selectedRoute.routeId)}&sort=state`);
            }}
            disabled={!selectedRoute}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Stale Kontrol Sirasini Ac
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Aktif Seferler</div>
          <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {activeTripsLoadStatus}
          </span>
        </div>
        {activeTripsLoadStatus === "loading" ? (
          <p className="text-xs text-slate-500">Aktif seferler yukleniyor...</p>
        ) : !selectedRoute ? (
          <p className="text-xs text-slate-500">Aktif sefer listesi için rota sec.</p>
        ) : activeTrips.length === 0 ? (
          <p className="text-xs text-slate-500">Bu rota için aktif sefer bulunamadi.</p>
        ) : (
          <div className="space-y-2">
            {activeTrips.slice(0, 4).map((trip) => (
              <button
                key={trip.tripId}
                type="button"
                onClick={() =>
                  router.push(
                    `/live-ops?tripId=${encodeURIComponent(trip.tripId)}&routeId=${encodeURIComponent(
                      trip.routeId,
                    )}&driverUid=${encodeURIComponent(trip.driverUid)}&sort=signal_desc`,
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {trip.driverPlate ?? "Plaka yok"}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {trip.driverName} - {trip.liveState === "online" ? "Canlı" : "Stale"}
                  </span>
                </span>
                <span className="text-xs font-semibold text-slate-500">Ac</span>
              </button>
            ))}
            {activeTrips.length > 4 ? (
              <p className="text-[11px] text-muted">+{activeTrips.length - 4} aktif sefer daha var.</p>
            ) : null}
            <button
              type="button"
              onClick={() =>
                router.push(`/live-ops?routeId=${encodeURIComponent(selectedRoute.routeId)}&sort=signal_desc`)
              }
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Tumunu Live Ops&apos;ta Ac
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Gorunum Linki</div>
        <button
          type="button"
          onClick={onCopyViewLink}
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Bu Gorunumu Kopyala
        </button>
        <div
          role={copyLinkState === "error" ? "alert" : undefined}
          aria-live="polite"
          className={copyLinkToneClass}
        >
          {copyLinkMessage}
        </div>
      </div>
    </>
  );
}

