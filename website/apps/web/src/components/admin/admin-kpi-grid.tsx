"use client";

type AdminKpiSnapshot = {
  membersTotal: number;
  membersActive: number;
  membersInvited: number;
  membersSuspended: number;
  vehiclesTotal: number;
  vehiclesActive: number;
  vehiclesMaintenance: number;
  vehiclesInactive: number;
  routesTotal: number;
  routesActive: number;
  routesArchived: number;
  unassignedRoutes: number;
  activeTripsTotal: number;
  activeTripsOnline: number;
  activeTripsStale: number;
};

type AdminKpiGridProps = {
  snapshot: AdminKpiSnapshot;
};

export function AdminKpiGrid({ snapshot }: AdminKpiGridProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="text-xs font-medium text-muted">Uyeler</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{snapshot.membersTotal}</div>
        <div className="mt-1 text-[11px] text-slate-500">
          Aktif {snapshot.membersActive} / Davet {snapshot.membersInvited} / Askida {snapshot.membersSuspended}
        </div>
      </article>

      <article className="rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="text-xs font-medium text-muted">Araclar</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{snapshot.vehiclesTotal}</div>
        <div className="mt-1 text-[11px] text-slate-500">
          Aktif {snapshot.vehiclesActive} / Bakim {snapshot.vehiclesMaintenance} / Pasif {snapshot.vehiclesInactive}
        </div>
      </article>

      <article className="rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="text-xs font-medium text-muted">Rotalar</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{snapshot.routesTotal}</div>
        <div className="mt-1 text-[11px] text-slate-500">
          Aktif {snapshot.routesActive} / Arsiv {snapshot.routesArchived} / Atamasiz {snapshot.unassignedRoutes}
        </div>
      </article>

      <article className="rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="text-xs font-medium text-muted">Aktif Sefer</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{snapshot.activeTripsTotal}</div>
        <div className="mt-1 text-[11px] text-slate-500">
          Canli {snapshot.activeTripsOnline} / Stale {snapshot.activeTripsStale}
        </div>
      </article>
    </section>
  );
}
