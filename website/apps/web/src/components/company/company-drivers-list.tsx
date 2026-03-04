"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  assignCompanyDriverToRouteForCompany,
  createCompanyDriverAccountForCompany,
  listCompanyDriversForCompany,
  listCompanyRoutesForCompany,
  listCompanyVehiclesForCompany,
  unassignCompanyDriverFromRouteForCompany,
  updateCompanyDriverStatusForCompany,
  type CompanyDriverCredentialBundle,
  type CompanyDriverItem,
  type CompanyRouteItem,
  type CompanyVehicleItem,
} from "@/features/company/company-client";

import { DriverCreateSection } from "./drivers/driver-create-section";
import { DriverDetailPanel } from "./drivers/driver-detail-panel";
import { DriverListSection } from "./drivers/driver-list-section";
import type { DriverFilter, DriverStatus } from "./drivers/driver-ui-helpers";

/* ------------------------------------------------------------------ */

type Props = { companyId: string };

const FILTER_OPTIONS: Array<{ key: DriverFilter; label: string }> = [
  { key: "all", label: "Tüm şoförler" },
  { key: "active", label: "Aktif" },
  { key: "passive", label: "Pasif" },
  { key: "assignment_pending", label: "Atama bekleyen" },
];

/* ------------------------------------------------------------------ */

export function CompanyDriversList({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole } = useCompanyMembership();

  /* ---- data ---- */
  const [drivers, setDrivers] = useState<CompanyDriverItem[] | null>(null);
  const [routes, setRoutes] = useState<CompanyRouteItem[] | null>(null);
  const [vehicles, setVehicles] = useState<CompanyVehicleItem[] | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  /* ---- ui state ---- */
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<DriverFilter>("all");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [latestCredentials, setLatestCredentials] = useState<CompanyDriverCredentialBundle | null>(null);

  /* ---- messages ---- */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAutoInfo = useCallback((msg: string) => {
    setInfoMessage(msg);
    if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    infoTimerRef.current = setTimeout(() => setInfoMessage(null), 5000);
  }, []);

  /* ---- permissions ---- */
  const canMutate = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";

  /* ---- data fetch ---- */
  useEffect(() => {
    if (status !== "signed_in") return;
    let cancelled = false;
    Promise.all([
      listCompanyDriversForCompany({ companyId, limit: 200 }),
      listCompanyRoutesForCompany({ companyId, limit: 200 }),
      listCompanyVehiclesForCompany({ companyId, limit: 200 }),
    ])
      .then(([d, r, v]) => {
        if (cancelled) return;
        setDrivers(d);
        setRoutes(r);
        setVehicles(v);
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Şoför listesi alınamadı.");
      });
    return () => { cancelled = true; };
  }, [companyId, refreshNonce, status]);

  /* ---- derived ---- */
  const metrics = useMemo(() => {
    const s = drivers ?? [];
    return {
      total: s.length,
      active: s.filter((d) => d.status === "active").length,
      passive: s.filter((d) => d.status === "passive").length,
      assignmentPending: s.filter((d) => d.assignmentStatus === "unassigned").length,
    };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const src = drivers ?? [];
    const q = searchQuery.trim().toLocaleLowerCase("tr");
    return src.filter((d) => {
      if (filter === "active" && d.status !== "active") return false;
      if (filter === "passive" && d.status !== "passive") return false;
      if (filter === "assignment_pending" && d.assignmentStatus !== "unassigned") return false;
      if (!q) return true;
      return [d.name, d.driverId, d.plateMasked, d.phoneMasked ?? "", ...d.assignedRoutes.map((r) => r.routeName)]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(q);
    });
  }, [drivers, filter, searchQuery]);

  /* auto-select first driver */
  useEffect(() => {
    if (!drivers || drivers.length === 0) { setSelectedDriverId(null); return; }
    if (selectedDriverId && drivers.some((d) => d.driverId === selectedDriverId)) return;
    setSelectedDriverId(drivers[0]?.driverId ?? null);
  }, [drivers, selectedDriverId]);

  const selectedDriver = useMemo(
    () => (drivers ?? []).find((d) => d.driverId === selectedDriverId) ?? null,
    [drivers, selectedDriverId],
  );

  /* ---- handlers ---- */
  const handleCreateDriver = useCallback(
    async (input: { name: string; phone?: string; plate?: string; loginEmail?: string; temporaryPassword?: string }) => {
      setActionKey("create_driver_account");
      try {
        const creds = await createCompanyDriverAccountForCompany({ companyId, ...input });
        setLatestCredentials(creds);
        showAutoInfo("Şoför hesabı oluşturuldu. Giriş bilgilerini kopyalayıp paylaşabilirsin.");
        setErrorMessage(null);
        setRefreshNonce((n) => n + 1);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Şoför hesabı oluşturulamadı.");
      } finally {
        setActionKey(null);
      }
    },
    [companyId, showAutoInfo],
  );

  const handleStatusChange = useCallback(
    async (driverId: string, newStatus: DriverStatus) => {
      setActionKey(`status:${driverId}`);
      try {
        await updateCompanyDriverStatusForCompany({ companyId, driverId, status: newStatus });
        showAutoInfo(newStatus === "active" ? "Şoför aktif edildi." : "Şoför pasif yapıldı.");
        setErrorMessage(null);
        setRefreshNonce((n) => n + 1);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Durum güncellenemedi.");
      } finally {
        setActionKey(null);
      }
    },
    [companyId, showAutoInfo],
  );

  const handleAssign = useCallback(
    async (driverId: string, routeId: string) => {
      setActionKey(`assign:${driverId}`);
      try {
        await assignCompanyDriverToRouteForCompany({ companyId, driverId, routeId });
        showAutoInfo("Şoför rotaya atandı.");
        setErrorMessage(null);
        setRefreshNonce((n) => n + 1);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Atama yapılamadı.");
      } finally {
        setActionKey(null);
      }
    },
    [companyId, showAutoInfo],
  );

  const handleUnassign = useCallback(
    async (driverId: string, routeId: string) => {
      setActionKey(`unassign:${driverId}:${routeId}`);
      try {
        await unassignCompanyDriverFromRouteForCompany({ companyId, driverId, routeId });
        showAutoInfo("Şoför rota atamasından çıkarıldı.");
        setErrorMessage(null);
        setRefreshNonce((n) => n + 1);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Atama kaldırılamadı.");
      } finally {
        setActionKey(null);
      }
    },
    [companyId, showAutoInfo],
  );

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  const isLoading = !drivers || !routes;

  return (
    <section className="space-y-5">
      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Toplam şoför", value: metrics.total, color: "text-slate-900" },
          { label: "Aktif", value: metrics.active, color: "text-emerald-700" },
          { label: "Pasif", value: metrics.passive, color: "text-slate-600" },
          { label: "Atama bekleyen", value: metrics.assignmentPending, color: "text-amber-700" },
        ].map((m) => (
          <article
            key={m.label}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {m.label}
            </div>
            <div className={`mt-1.5 text-2xl font-semibold ${m.color}`}>{m.value}</div>
          </article>
        ))}
      </div>

      {/* Create section */}
      <DriverCreateSection
        canCreate={canMutate}
        actionKey={actionKey}
        latestCredentials={latestCredentials}
        onCreateDriver={handleCreateDriver}
      />

      {/* Operation center */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Header + refresh */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Şoför operasyon merkezi</div>
          <button
            type="button"
            onClick={() => setRefreshNonce((n) => n + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Yenile
          </button>
        </div>

        {/* Search + count */}
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Şoför adı, telefon, plaka veya rota ile ara"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {filteredDrivers.length}/{drivers?.length ?? 0} görünüyor
          </div>
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === opt.key
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Quick links */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={`/c/${companyId}/routes`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
          >
            Rotalara git
          </Link>
          <Link
            href={`/c/${companyId}/vehicles`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
          >
            Araçlara git
          </Link>
        </div>

        {/* Messages */}
        {infoMessage && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {infoMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {errorMessage}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-xs text-slate-400">
            <span className="mr-2 block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
            Şoför ve rota bilgileri yükleniyor...
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
            <div className="mb-2 text-3xl">🚐</div>
            <div className="text-sm font-semibold text-slate-600">Henüz şoför kaydı yok</div>
            <div className="mt-1 text-xs text-slate-400">
              Yukarıdaki formu kullanarak ilk şoför hesabını oluşturabilirsin.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Left: list */}
            <DriverListSection
              drivers={drivers}
              filteredDrivers={filteredDrivers}
              selectedDriverId={selectedDriverId}
              onSelectDriver={setSelectedDriverId}
            />

            {/* Right: detail panel */}
            <aside className="xl:sticky xl:top-4 xl:self-start">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <DriverDetailPanel
                  driver={selectedDriver}
                  routes={routes ?? []}
                  vehicles={vehicles ?? []}
                  canMutate={canMutate}
                  actionKey={actionKey}
                  onStatusChange={handleStatusChange}
                  onAssign={handleAssign}
                  onUnassign={handleUnassign}
                />
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
