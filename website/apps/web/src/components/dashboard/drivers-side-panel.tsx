"use client";

import { useRouter } from "next/navigation";

import { DashboardDetailDrawerPlaceholder } from "@/components/dashboard/dashboard-detail-drawer-placeholder";
import { DriversMemberInviteCard } from "@/components/dashboard/drivers-member-invite-card";
import { DriversMemberManagementCard } from "@/components/dashboard/drivers-member-management-card";
import { memberStatusLabel, roleLabel } from "@/components/dashboard/drivers-company-members-helpers";
import type {
  CompanyActiveTripSummary,
  CompanyMemberRole,
  CompanyMemberStatus,
  CompanyMemberSummary,
  CompanyRouteSummary,
} from "@/features/company/company-types";

type CopyLinkState = "idle" | "copied" | "error";

type DriversSidePanelProps = {
  companyId: string | null;
  actorUid: string | null;
  actorRole: CompanyMemberRole | null;
  actorMemberStatus: CompanyMemberStatus | null;
  selectedMember: CompanyMemberSummary | null;
  activeTrips: readonly CompanyActiveTripSummary[];
  activeTripsLoadStatus: "idle" | "loading" | "success" | "error";
  assignedRoutes: readonly CompanyRouteSummary[];
  assignedRoutesLoadStatus: "idle" | "loading" | "success" | "error";
  copyLinkState: CopyLinkState;
  onMemberUpdated: () => Promise<void> | void;
  onMemberRemoved: () => Promise<void> | void;
  onCopyViewLink: () => void;
};

export function DriversSidePanel({
  companyId,
  actorUid,
  actorRole,
  actorMemberStatus,
  selectedMember,
  activeTrips,
  activeTripsLoadStatus,
  assignedRoutes,
  assignedRoutesLoadStatus,
  copyLinkState,
  onMemberUpdated,
  onMemberRemoved,
  onCopyViewLink,
}: DriversSidePanelProps) {
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
  const activeAssignedRoutesCount = assignedRoutes.filter((route) => !route.isArchived).length;

  return (
    <div className="space-y-4">
      <DashboardDetailDrawerPlaceholder
        title="Secili Uye Detayi"
        subtitle="Liste secimi ile senkron detay paneli"
        statusLabel={selectedMember ? memberStatusLabel(selectedMember.memberStatus) : "Secim Yok"}
        statusTone={
          selectedMember?.memberStatus === "active"
            ? "success"
            : selectedMember?.memberStatus === "suspended"
              ? "warning"
              : "warning"
        }
        fields={
          selectedMember
            ? [
                { label: "Ad Soyad", value: selectedMember.displayName },
                { label: "Rol", value: roleLabel(selectedMember.role) },
                { label: "Durum", value: memberStatusLabel(selectedMember.memberStatus) },
                { label: "E-posta", value: selectedMember.email ?? "-" },
                { label: "Telefon", value: selectedMember.phone ?? "-" },
              ]
            : [
                { label: "Durum", value: "Secili uye yok" },
                { label: "Not", value: "Liste yuklenince drawer burada detay patternini gosterecek" },
              ]
        }
        actions={["Detay Ac", "Rol Degistir", "Durum Guncelle"]}
      />
      <DriversMemberInviteCard
        companyId={companyId}
        actorRole={actorRole}
        actorMemberStatus={actorMemberStatus}
        onInvited={onMemberUpdated}
      />
      <DriversMemberManagementCard
        companyId={companyId}
        actorUid={actorUid}
        actorRole={actorRole}
        actorMemberStatus={actorMemberStatus}
        selectedMember={selectedMember}
        onMemberUpdated={onMemberUpdated}
        onMemberRemoved={onMemberRemoved}
      />
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Canli Operasyon Gecisi</div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!selectedMember) return;
              router.push(`/live-ops?driverUid=${encodeURIComponent(selectedMember.uid)}&sort=signal_desc`);
            }}
            disabled={!selectedMember}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Bu Uyenin Canli Seferlerini Ac
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedMember) return;
              router.push(`/live-ops?driverUid=${encodeURIComponent(selectedMember.uid)}&sort=state`);
            }}
            disabled={!selectedMember}
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
        ) : !selectedMember ? (
          <p className="text-xs text-slate-500">Aktif sefer listesi icin uye sec.</p>
        ) : activeTrips.length === 0 ? (
          <p className="text-xs text-slate-500">Bu uye icin aktif sefer bulunamadi.</p>
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
                    {trip.routeName} - {trip.liveState === "online" ? "Canli" : "Stale"}
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
                router.push(`/live-ops?driverUid=${encodeURIComponent(selectedMember.uid)}&sort=signal_desc`)
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Rota Yetkileri</div>
          <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {assignedRoutesLoadStatus}
          </span>
        </div>
        {assignedRoutesLoadStatus === "loading" ? (
          <p className="text-xs text-slate-500">Rota yetkileri yukleniyor...</p>
        ) : !selectedMember ? (
          <p className="text-xs text-slate-500">Rota baglanti listesi icin bir uye sec.</p>
        ) : assignedRoutes.length === 0 ? (
          <p className="text-xs text-slate-500">Bu uye icin bagli rota bulunamadi.</p>
        ) : (
          <div className="space-y-2">
            {assignedRoutes.slice(0, 5).map((route) => (
              <button
                key={route.routeId}
                type="button"
                onClick={() =>
                  router.push(
                    `/routes?routeId=${encodeURIComponent(route.routeId)}${
                      selectedMember
                        ? `&memberUid=${encodeURIComponent(selectedMember.uid)}`
                        : ""
                    }&sort=updated_desc`,
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">{route.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {route.scheduledTime ?? "--:--"} - {route.isArchived ? "Arsiv" : "Aktif"}
                  </span>
                  {selectedMember ? (
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {route.driverId === selectedMember.uid ? "Rol: Ana Surucu" : "Rol: Yetkili Surucu"}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs font-semibold text-slate-500">Ac</span>
              </button>
            ))}
            {assignedRoutes.length > 5 ? (
              <p className="text-[11px] text-muted">+{assignedRoutes.length - 5} rota daha var.</p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (!selectedMember) return;
                router.push(`/routes?memberUid=${encodeURIComponent(selectedMember.uid)}&sort=updated_desc`);
              }}
              disabled={!selectedMember || selectedMember.memberStatus !== "active"}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Bu Uyenin Rota Yetkilerini Duzenle
            </button>
            {selectedMember && selectedMember.memberStatus !== "active" ? (
              <p className="text-[11px] text-amber-700">
                Bu uye {memberStatusLabel(selectedMember.memberStatus)} durumda. Yetki duzenleme icin
                once durumu active yap.
              </p>
            ) : null}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Driver Ops Snapshot</div>
        {!selectedMember ? (
          <p className="text-xs text-slate-500">Snapshot icin bir uye sec.</p>
        ) : (
          <dl className="space-y-1 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Uye</dt>
              <dd className="font-semibold text-slate-900">{selectedMember.displayName}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-semibold text-slate-900">{roleLabel(selectedMember.role)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Durum</dt>
              <dd className="font-semibold text-slate-900">
                {memberStatusLabel(selectedMember.memberStatus)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Aktif Sefer</dt>
              <dd className="font-semibold text-slate-900">{activeTrips.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Bagli Rota</dt>
              <dd className="font-semibold text-slate-900">
                {assignedRoutes.length} (aktif {activeAssignedRoutesCount})
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
