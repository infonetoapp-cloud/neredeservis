"use client";

import { useRouter } from "next/navigation";

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

const ROLE_AVATAR_BG: Record<string, string> = {
  owner: "bg-gradient-to-br from-violet-500 to-violet-700",
  admin: "bg-gradient-to-br from-blue-500 to-blue-700",
  dispatcher: "bg-gradient-to-br from-cyan-500 to-cyan-700",
  viewer: "bg-gradient-to-br from-slate-400 to-slate-600",
};

const ROLE_PILL: Record<string, string> = {
  owner: "bg-violet-100 text-violet-700",
  admin: "bg-blue-100 text-blue-700",
  dispatcher: "bg-cyan-100 text-cyan-700",
  viewer: "bg-slate-100 text-slate-600",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  invited: "bg-amber-400",
  suspended: "bg-rose-500",
};

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
  onMemberUpdated: () => Promise<void> | void;
  onMemberRemoved: () => Promise<void> | void;
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
  onMemberUpdated,
  onMemberRemoved,
}: DriversSidePanelProps) {
  const router = useRouter();
  const activeAssignedRoutesCount = assignedRoutes.filter((route) => !route.isArchived).length;

  /* ── Profile card ── */
  const initials = selectedMember
    ? selectedMember.displayName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0] ?? "")
        .join("")
        .toUpperCase()
    : "?";
  const avatarBg = selectedMember ? (ROLE_AVATAR_BG[selectedMember.role] ?? ROLE_AVATAR_BG.viewer) : "bg-slate-300";
  const rolePill = selectedMember ? (ROLE_PILL[selectedMember.role] ?? ROLE_PILL.viewer) : "";
  const statusDot = selectedMember ? (STATUS_DOT[selectedMember.memberStatus] ?? "bg-slate-400") : "bg-slate-300";

  return (
    <div className="space-y-4">
      {/* ── Profile card ── */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        {selectedMember ? (
          <div className="flex items-start gap-3">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[17px] font-bold text-white ${avatarBg}`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold leading-tight text-slate-900">{selectedMember.displayName}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${rolePill}`}>
                  {roleLabel(selectedMember.role)}
                </span>
                <span className={`h-2 w-2 rounded-full ${statusDot}`} />
                <span className="text-[12px] text-slate-500">{memberStatusLabel(selectedMember.memberStatus)}</span>
              </div>
              {(selectedMember.email || selectedMember.phone) ? (
                <div className="mt-1.5 space-y-0.5">
                  {selectedMember.email ? (
                    <div className="truncate text-[12px] text-slate-500">{selectedMember.email}</div>
                  ) : null}
                  {selectedMember.phone ? (
                    <div className="text-[12px] text-slate-500">{selectedMember.phone}</div>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  router.push(`/live-ops?driverUid=${encodeURIComponent(selectedMember.uid)}&sort=signal_desc`)
                }
                className="mt-3 rounded-xl bg-slate-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-800"
              >
                Canlı Takip&apos;te Aç
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-300">
              —
            </div>
            <p className="text-[13px] text-slate-400">Listeden bir üye seçin.</p>
          </div>
        )}
      </div>
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

      {/* ── Aktif Seferler ── */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-slate-900">Aktif Seferler</div>
          {activeTrips.length > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {activeTrips.length}
            </span>
          ) : null}
        </div>
        {activeTripsLoadStatus === "loading" ? (
          <p className="text-xs text-slate-400">Yükleniyor…</p>
        ) : !selectedMember ? (
          <p className="text-xs text-slate-400">Sefer listesi için üye seçin.</p>
        ) : activeTrips.length === 0 ? (
          <p className="text-xs text-slate-400">Aktif sefer bulunamadı.</p>
        ) : (
          <div className="divide-y divide-slate-100">
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
                className="flex w-full items-center justify-between py-2.5 text-left first:pt-0 last:pb-0"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-slate-900">
                    {trip.driverPlate ?? "Plaka yok"}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {trip.routeName} · {trip.liveState === "online" ? "Canlı" : "Stale"}
                  </span>
                </span>
                <svg className="ml-2 h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            {activeTrips.length > 4 ? (
              <p className="pt-2 text-[11px] text-slate-400">+{activeTrips.length - 4} sefer daha</p>
            ) : null}
          </div>
        )}
        {selectedMember && activeTrips.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              router.push(`/live-ops?driverUid=${encodeURIComponent(selectedMember.uid)}&sort=signal_desc`)
            }
            className="mt-3 w-full rounded-xl border border-line bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tümünü Live Ops&apos;ta Aç
          </button>
        ) : null}
      </div>

      {/* ── Rota Yetkileri ── */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-slate-900">Rota Yetkileri</div>
          {assignedRoutes.length > 0 ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {activeAssignedRoutesCount} aktif
            </span>
          ) : null}
        </div>
        {assignedRoutesLoadStatus === "loading" ? (
          <p className="text-xs text-slate-400">Yükleniyor…</p>
        ) : !selectedMember ? (
          <p className="text-xs text-slate-400">Rota listesi için üye seçin.</p>
        ) : assignedRoutes.length === 0 ? (
          <p className="text-xs text-slate-400">Bu üyeye bağlı rota bulunamadı.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignedRoutes.slice(0, 5).map((route) => (
              <button
                key={route.routeId}
                type="button"
                onClick={() =>
                  router.push(
                    `/routes?routeId=${encodeURIComponent(route.routeId)}&memberUid=${encodeURIComponent(selectedMember.uid)}&sort=updated_desc`,
                  )
                }
                className="flex w-full items-center justify-between py-2.5 text-left first:pt-0 last:pb-0"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-slate-900">{route.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {route.scheduledTime ?? "--:--"} · {route.isArchived ? "Arşiv" : "Aktif"} ·{" "}
                    {route.driverId === selectedMember.uid ? "Ana Sürücü" : "Yetkili Sürücü"}
                  </span>
                </span>
                <svg className="ml-2 h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            {assignedRoutes.length > 5 ? (
              <p className="pt-2 text-[11px] text-slate-400">+{assignedRoutes.length - 5} rota daha</p>
            ) : null}
          </div>
        )}
        {selectedMember ? (
          <button
            type="button"
            onClick={() =>
              router.push(`/routes?memberUid=${encodeURIComponent(selectedMember.uid)}&sort=updated_desc`)
            }
            disabled={selectedMember.memberStatus !== "active"}
            className="mt-3 w-full rounded-xl border border-line bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Rota Yetkilerini Düzenle
          </button>
        ) : null}
        {selectedMember && selectedMember.memberStatus !== "active" ? (
          <p className="mt-1.5 text-[11px] text-amber-700">
            Üye {memberStatusLabel(selectedMember.memberStatus)} durumunda — düzenleme için önce durumu Aktif yapın.
          </p>
        ) : null}
      </div>
    </div>
  );
}
