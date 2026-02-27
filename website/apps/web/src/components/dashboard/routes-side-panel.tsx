"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { DashboardDetailDrawerPlaceholder } from "@/components/dashboard/dashboard-detail-drawer-placeholder";
import { RouteDriverPermissionsEditor } from "@/components/dashboard/route-driver-permissions-editor";
import { RouteSharePanel } from "@/components/dashboard/route-share-panel";
import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { RouteStopsDrawerEditor } from "@/components/dashboard/route-stops-drawer-editor";
import { RouteUpdateDrawerForm } from "@/components/dashboard/route-update-drawer-form";
import { RoutesSidePanelLiveOpsSection } from "@/components/dashboard/routes-side-panel-live-ops-section";
import { routeStatusLabel, timeSlotLabel } from "@/components/dashboard/routes-company-routes-helpers";
import {
  canManageRoutePermissions,
  canMutateCompanyOperations,
} from "@/features/company/company-rbac";
import type {
  CompanyActiveTripSummary,
  CompanyMemberRole,
  CompanyMemberStatus,
  CompanyMemberSummary,
  CompanyRouteSummary,
  RouteDriverPermissionSummary,
} from "@/features/company/company-types";

type CopyLinkState = "idle" | "copied" | "error";

type RoutesSidePanelProps = {
  actorRole: CompanyMemberRole | null;
  actorMemberStatus: CompanyMemberStatus | null;
  selectedRoute: CompanyRouteSummary | null;
  companyId: string | null;
  preferredMemberUid: string | null;
  filteredRoutes: readonly CompanyRouteSummary[];
  members: readonly CompanyMemberSummary[];
  membersLoadStatus: "idle" | "loading" | "success" | "error";
  activeTrips: readonly CompanyActiveTripSummary[];
  activeTripsLoadStatus: "idle" | "loading" | "success" | "error";
  selectedRouteId: string | null;
  copyLinkState: CopyLinkState;
  routePermissions: readonly RouteDriverPermissionSummary[];
  routePermissionsLoadStatus: "idle" | "loading" | "success" | "error";
  onCopyViewLink: () => void;
  onSelectedRouteIdChange: (routeId: string | null) => void;
  onRoutesUpdated: () => Promise<void> | void;
};

export function RoutesSidePanel({
  actorRole,
  actorMemberStatus,
  selectedRoute,
  companyId,
  preferredMemberUid,
  filteredRoutes,
  members,
  membersLoadStatus,
  activeTrips,
  activeTripsLoadStatus,
  selectedRouteId,
  copyLinkState,
  routePermissions,
  routePermissionsLoadStatus,
  onCopyViewLink,
  onSelectedRouteIdChange,
  onRoutesUpdated,
}: RoutesSidePanelProps) {
  const router = useRouter();
  const permissionMap = useMemo(
    () => new Map(routePermissions.map((item) => [item.driverUid, item])),
    [routePermissions],
  );
  const canEditRoutePermissions = canManageRoutePermissions(actorRole, actorMemberStatus);
  const canMutateRoutes = canMutateCompanyOperations(actorRole, actorMemberStatus);

  const enabledPermissionCount = (item: RouteDriverPermissionSummary | undefined) => {
    if (!item) return 3;
    return Object.values(item.permissions).filter(Boolean).length;
  };
  const selectedRouteAuthorizedMembers = useMemo(() => {
    if (!selectedRoute) return [];
    const uidSet = new Set(selectedRoute.authorizedDriverIds);
    if (selectedRoute.driverId) {
      uidSet.add(selectedRoute.driverId);
    }
    if (uidSet.size === 0) return [];
    return members
      .filter((member) => uidSet.has(member.uid))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "tr"));
  }, [members, selectedRoute]);
  const permissionEligibleMembers = useMemo(
    () => selectedRouteAuthorizedMembers.filter((member) => member.memberStatus === "active"),
    [selectedRouteAuthorizedMembers],
  );
  const inactiveAuthorizedMembersCount =
    selectedRouteAuthorizedMembers.length - permissionEligibleMembers.length;

  return (
    <div className="space-y-4">
      <DashboardDetailDrawerPlaceholder
        title="Secili Rota Detayi"
        subtitle="Route summary listesi ile senkron detay paneli"
        statusLabel={selectedRoute ? routeStatusLabel(selectedRoute.isArchived) : "Secim Yok"}
        statusTone={selectedRoute?.isArchived ? "warning" : "success"}
        fields={
          selectedRoute
            ? [
                { label: "Rota", value: selectedRoute.name },
                { label: "SRV", value: selectedRoute.srvCode ?? "-" },
                {
                  label: "Saat / Slot",
                  value: `${selectedRoute.scheduledTime ?? "--:--"} / ${timeSlotLabel(selectedRoute.timeSlot)}`,
                },
                { label: "Driver", value: selectedRoute.driverId ?? "-" },
                { label: "Yolcu", value: String(selectedRoute.passengerCount) },
              ]
            : [
                { label: "Durum", value: "Secili rota yok" },
                { label: "Not", value: "Liste dolunca route drawer detayi burada genisleyecek" },
              ]
        }
        actions={["Detay Ac", "Duraklar", "Sefer Kurallari"]}
      />
      <RoutesSidePanelLiveOpsSection
        selectedRoute={selectedRoute}
        activeTrips={activeTrips}
        activeTripsLoadStatus={activeTripsLoadStatus}
        copyLinkState={copyLinkState}
        onCopyViewLink={onCopyViewLink}
      />
      <RouteSharePanel selectedRoute={selectedRoute} />
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Yetkili Uyeler</div>
          <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {membersLoadStatus} / {routePermissionsLoadStatus}
          </span>
        </div>
        {membersLoadStatus === "loading" || routePermissionsLoadStatus === "loading" ? (
          <p className="text-xs text-slate-500">Uye ve yetki listesi yukleniyor...</p>
        ) : !selectedRoute ? (
          <p className="text-xs text-slate-500">Yetki listesi icin rota sec.</p>
        ) : selectedRouteAuthorizedMembers.length === 0 ? (
          <p className="text-xs text-slate-500">Bu rota icin tanimli uye bulunamadi.</p>
        ) : (
          <div className="space-y-2">
            {selectedRouteAuthorizedMembers.slice(0, 5).map((member) => (
              <button
                key={member.uid}
                type="button"
                onClick={() =>
                  router.push(`/drivers?memberUid=${encodeURIComponent(member.uid)}&sort=name_asc`)
                }
                className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {member.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {member.role} - {member.memberStatus}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    Yetki: {enabledPermissionCount(permissionMap.get(member.uid))}/6 aktif
                  </span>
                </span>
                <span className="text-xs font-semibold text-slate-500">Ac</span>
              </button>
            ))}
            {selectedRouteAuthorizedMembers.length > 5 ? (
              <p className="text-[11px] text-muted">
                +{selectedRouteAuthorizedMembers.length - 5} uye daha var.
              </p>
            ) : null}
            {inactiveAuthorizedMembersCount > 0 ? (
              <p className="text-[11px] text-amber-700">
                {inactiveAuthorizedMembersCount} uye aktif olmadigi icin detayli yetki editorunde
                duzenlenemez.
              </p>
            ) : null}
            {routePermissionsLoadStatus === "error" ? (
              <p className="text-[11px] text-amber-700">
                Yetki detaylari su an yuklenemedi; gorunum varsayilan izin sayisiyla gosteriliyor.
              </p>
            ) : null}
          </div>
        )}
      </div>
      {companyId ? (
        canEditRoutePermissions ? (
          <RouteDriverPermissionsEditor
            key={`perm:${selectedRoute?.routeId ?? "none"}:${preferredMemberUid ?? "none"}`}
            companyId={companyId}
            routeId={selectedRoute?.routeId ?? null}
            members={permissionEligibleMembers}
            routePermissions={routePermissions}
            routePermissionsLoadStatus={routePermissionsLoadStatus}
            initialDriverUid={preferredMemberUid}
            onUpdated={onRoutesUpdated}
          />
        ) : (
          <DashboardStatePlaceholder
            tone="info"
            title="Rota yetkisi duzenleme kapali"
            description="Bu panel yalnizca aktif owner/admin uyeleri icin acilir."
          />
        )
      ) : null}
      {companyId ? (
        canMutateRoutes ? (
          <>
            <RouteUpdateDrawerForm
              companyId={companyId}
              routes={filteredRoutes}
              members={members}
              membersLoadStatus={membersLoadStatus}
              selectedRouteId={selectedRouteId}
              onSelectedRouteIdChange={(routeId) => onSelectedRouteIdChange(routeId)}
              onUpdated={onRoutesUpdated}
            />
          <RouteStopsDrawerEditor
            companyId={companyId}
            selectedRoute={selectedRoute}
            activeTripsCount={activeTrips.length}
            onRouteMutated={onRoutesUpdated}
          />
          </>
        ) : (
          <DashboardStatePlaceholder
            tone="info"
            title="Rota mutasyonlari kapali"
            description="Rota ve durak duzenlemek icin aktif owner/admin/dispatcher uyeligi gerekir."
          />
        )
      ) : null}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-900">Route Ops Snapshot</div>
        {!selectedRoute ? (
          <p className="text-xs text-slate-500">Snapshot icin bir rota sec.</p>
        ) : (
          <dl className="space-y-1 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Rota</dt>
              <dd className="font-semibold text-slate-900">{selectedRoute.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Durum</dt>
              <dd className="font-semibold text-slate-900">{routeStatusLabel(selectedRoute.isArchived)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Yolcu</dt>
              <dd className="font-semibold text-slate-900">{selectedRoute.passengerCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Aktif Sefer</dt>
              <dd className="font-semibold text-slate-900">{activeTrips.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Yetkili Uye</dt>
              <dd className="font-semibold text-slate-900">
                {selectedRouteAuthorizedMembers.length} (aktif {permissionEligibleMembers.length})
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
