"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { DashboardDetailDrawerPlaceholder } from "@/components/dashboard/dashboard-detail-drawer-placeholder";
import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { VehicleUpdateDrawerForm } from "@/components/dashboard/vehicle-update-drawer-form";
import { vehicleStatusLabel } from "@/components/dashboard/vehicles-company-vehicles-helpers";
import { canMutateCompanyOperations } from "@/features/company/company-rbac";
import type {
  CompanyActiveTripSummary,
  CompanyMemberRole,
  CompanyMemberStatus,
  CompanyVehicleSummary,
} from "@/features/company/company-types";

type CopyLinkState = "idle" | "copied" | "error";

type VehiclesSidePanelProps = {
  actorRole: CompanyMemberRole | null;
  actorMemberStatus: CompanyMemberStatus | null;
  selectedVehicle: CompanyVehicleSummary | null;
  companyId: string | null;
  activeTrips: readonly CompanyActiveTripSummary[];
  activeTripsLoadStatus: "idle" | "loading" | "success" | "error";
  filteredVehicles: readonly CompanyVehicleSummary[];
  selectedVehicleId: string | null;
  copyLinkState: CopyLinkState;
  onCopyViewLink: () => void;
  onSelectedVehicleIdChange: (vehicleId: string | null) => void;
  onUpdated: () => Promise<void> | void;
};

export function VehiclesSidePanel({
  actorRole,
  actorMemberStatus,
  selectedVehicle,
  companyId,
  activeTrips,
  activeTripsLoadStatus,
  filteredVehicles,
  selectedVehicleId,
  copyLinkState,
  onCopyViewLink,
  onSelectedVehicleIdChange,
  onUpdated,
}: VehiclesSidePanelProps) {
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
  const assignmentSummary = useMemo(() => {
    const activeDriverMap = new Map<string, string>();
    const routeNames = new Set<string>();
    for (const trip of activeTrips) {
      activeDriverMap.set(trip.driverUid, trip.driverName);
      routeNames.add(trip.routeName);
    }
    return {
      activeDriverCount: activeDriverMap.size,
      activeDriverNames: [...activeDriverMap.values()],
      activeRouteNames: [...routeNames],
    };
  }, [activeTrips]);
  const canMutateVehicles = canMutateCompanyOperations(actorRole, actorMemberStatus);

  return (
    <div className="space-y-4">
      <DashboardDetailDrawerPlaceholder
        title="Secili Arac Detayi"
        subtitle="Vehicle listesi canli; update drawer formu aktif"
        statusLabel={selectedVehicle ? vehicleStatusLabel(selectedVehicle.status) : "Secim Yok"}
        statusTone={selectedVehicle?.status === "maintenance" ? "warning" : "success"}
        fields={
          selectedVehicle
            ? [
                { label: "Plaka", value: selectedVehicle.plate },
                { label: "Durum", value: vehicleStatusLabel(selectedVehicle.status) },
                {
                  label: "Tip",
                  value:
                    [selectedVehicle.brand, selectedVehicle.model].filter(Boolean).join(" ") || "-",
                },
                {
                  label: "Kapasite",
                  value: selectedVehicle.capacity ? String(selectedVehicle.capacity) : "-",
                },
                { label: "Yil", value: selectedVehicle.year ? String(selectedVehicle.year) : "-" },
                {
                  label: "Aktif Atama",
                  value: assignmentSummary.activeDriverCount
                    ? `${assignmentSummary.activeDriverCount} sofor`
                    : "Yok",
                },
              ]
            : [
                { label: "Durum", value: "Secili arac yok" },
                { label: "Not", value: "Liste dolunca vehicle drawer detayi burada genisleyecek" },
              ]
        }
        actions={["Detay", "Update", "Atama Gecmisi"]}
      />
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Canli Operasyon Gecisi</div>
        <button
          type="button"
          onClick={() => {
            if (!selectedVehicle) return;
            router.push(`/live-ops?q=${encodeURIComponent(selectedVehicle.plate)}&sort=signal_desc`);
          }}
          disabled={!selectedVehicle}
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Bu Plakayi Canli Operasyonda Ara
        </button>
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
        ) : !selectedVehicle ? (
          <p className="text-xs text-slate-500">Aktif sefer listesi icin arac sec.</p>
        ) : activeTrips.length === 0 ? (
          <p className="text-xs text-slate-500">Bu plakaya bagli aktif sefer bulunamadi.</p>
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
                    {trip.routeName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {trip.driverName} - {trip.liveState === "online" ? "Canli" : "Stale"}
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
                router.push(`/live-ops?q=${encodeURIComponent(selectedVehicle.plate)}&sort=signal_desc`)
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
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Atama Ozeti (Canli)</div>
        {!selectedVehicle ? (
          <p className="text-xs text-slate-500">Atama ozeti icin arac sec.</p>
        ) : assignmentSummary.activeDriverCount === 0 ? (
          <p className="text-xs text-slate-500">
            Bu plakaya bagli aktif sefer yok. Atama ozeti sefer baslayinca gorunur.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-slate-600">
              Aktif sofor sayisi: {assignmentSummary.activeDriverCount}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {assignmentSummary.activeDriverNames.slice(0, 6).map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800"
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-slate-500">
              Rotalar: {assignmentSummary.activeRouteNames.slice(0, 3).join(", ")}
              {assignmentSummary.activeRouteNames.length > 3
                ? ` +${assignmentSummary.activeRouteNames.length - 3}`
                : ""}
            </div>
          </div>
        )}
      </div>
      {companyId ? (
        canMutateVehicles ? (
          <VehicleUpdateDrawerForm
            companyId={companyId}
            vehicles={filteredVehicles}
            selectedVehicleId={selectedVehicleId}
            onSelectedVehicleIdChange={(vehicleId) => onSelectedVehicleIdChange(vehicleId)}
            onUpdated={onUpdated}
          />
        ) : (
          <DashboardStatePlaceholder
            tone="info"
            title="Arac guncelleme kapali"
            description="Arac mutasyonlari icin aktif owner/admin/dispatcher uyeligi gerekir."
          />
        )
      ) : null}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Vehicle Ops Snapshot</div>
        {!selectedVehicle ? (
          <p className="text-xs text-slate-500">Snapshot icin bir arac sec.</p>
        ) : (
          <dl className="space-y-1 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Plaka</dt>
              <dd className="font-semibold text-slate-900">{selectedVehicle.plate}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Durum</dt>
              <dd className="font-semibold text-slate-900">{vehicleStatusLabel(selectedVehicle.status)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Aktif Sefer</dt>
              <dd className="font-semibold text-slate-900">{activeTrips.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Aktif Sofor</dt>
              <dd className="font-semibold text-slate-900">{assignmentSummary.activeDriverCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Aktif Rota</dt>
              <dd className="font-semibold text-slate-900">{assignmentSummary.activeRouteNames.length}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
