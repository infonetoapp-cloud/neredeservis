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
  type CompanyDriverItem,
  type CompanyRouteItem,
  type CompanyVehicleItem,
} from "@/features/company/company-client";

import { DriverCreateSection } from "./drivers/driver-create-section";
import { DriverDetailPanel } from "./drivers/driver-detail-panel";
import { DriverListSection } from "./drivers/driver-list-section";
import { normalizePlateInput, type DriverFilter, type DriverStatus } from "./drivers/driver-ui-helpers";

type Props = {
  companyId: string;
};

const FILTER_OPTIONS: Array<{ key: DriverFilter; label: string }> = [
  { key: "all", label: "Tüm şoförler" },
  { key: "active", label: "Aktif" },
  { key: "passive", label: "Pasif" },
  { key: "assignment_pending", label: "Atama bekleyen" },
];

function sortDrivers(items: CompanyDriverItem[]): CompanyDriverItem[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, "tr"));
}

export function CompanyDriversList({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole } = useCompanyMembership();

  const [drivers, setDrivers] = useState<CompanyDriverItem[] | null>(null);
  const [routes, setRoutes] = useState<CompanyRouteItem[] | null>(null);
  const [vehicles, setVehicles] = useState<CompanyVehicleItem[] | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<DriverFilter>("all");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canMutate = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";

  const showAutoInfo = useCallback((message: string) => {
    setInfoMessage(message);
    if (infoTimerRef.current) {
      clearTimeout(infoTimerRef.current);
    }
    infoTimerRef.current = setTimeout(() => setInfoMessage(null), 5000);
  }, []);

  useEffect(() => {
    if (status !== "signed_in") {
      return;
    }

    let cancelled = false;

    Promise.all([
      listCompanyDriversForCompany({ companyId, limit: 200 }),
      listCompanyRoutesForCompany({ companyId, limit: 200 }),
      listCompanyVehiclesForCompany({ companyId, limit: 200 }),
    ])
      .then(([nextDrivers, nextRoutes, nextVehicles]) => {
        if (cancelled) {
          return;
        }
        setDrivers(sortDrivers(nextDrivers));
        setRoutes(nextRoutes);
        setVehicles(nextVehicles);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Şoför listesi alınamadı.");
      });

    return () => {
      cancelled = true;
      if (infoTimerRef.current) {
        clearTimeout(infoTimerRef.current);
      }
    };
  }, [companyId, refreshNonce, showAutoInfo, status]);

  const metrics = useMemo(() => {
    const source = drivers ?? [];
    return {
      total: source.length,
      active: source.filter((driver) => driver.status === "active").length,
      passive: source.filter((driver) => driver.status === "passive").length,
      assignmentPending: source.filter((driver) => driver.assignmentStatus === "unassigned").length,
    };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const source = drivers ?? [];
    const query = searchQuery.trim().toLocaleLowerCase("tr");

    return source.filter((driver) => {
      if (filter === "active" && driver.status !== "active") {
        return false;
      }
      if (filter === "passive" && driver.status !== "passive") {
        return false;
      }
      if (filter === "assignment_pending" && driver.assignmentStatus !== "unassigned") {
        return false;
      }
      if (!query) {
        return true;
      }

      return [
        driver.name,
        driver.driverId,
        driver.plateMasked,
        driver.phoneMasked ?? "",
        driver.loginEmail ?? "",
        ...driver.assignedRoutes.map((route) => route.routeName),
      ]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(query);
    });
  }, [drivers, filter, searchQuery]);

  useEffect(() => {
    if (!drivers || drivers.length === 0) {
      setSelectedDriverId(null);
      return;
    }

    if (selectedDriverId && drivers.some((driver) => driver.driverId === selectedDriverId)) {
      return;
    }

    setSelectedDriverId(drivers[0]?.driverId ?? null);
  }, [drivers, selectedDriverId]);

  const selectedDriver = useMemo(
    () => (drivers ?? []).find((driver) => driver.driverId === selectedDriverId) ?? null,
    [drivers, selectedDriverId],
  );

  const handleCreateDriver = useCallback(
    async (input: {
      name: string;
      phone?: string;
      plate?: string;
    }) => {
      setActionKey("create_driver_account");

      try {
        const credentials = await createCompanyDriverAccountForCompany({ companyId, ...input });
        const optimisticDriver: CompanyDriverItem = {
          driverId: credentials.driverId,
          name: credentials.name,
          plateMasked: input.plate ? normalizePlateInput(input.plate) : "",
          phoneMasked: input.phone ? input.phone.trim() : null,
          loginEmail: credentials.loginEmail,
          temporaryPassword: credentials.temporaryPassword,
          status: "active",
          assignmentStatus: "unassigned",
          lastSeenAt: credentials.createdAt ?? new Date().toISOString(),
          assignedRoutes: [],
        };

        setDrivers((prev) => {
          const base = prev ?? [];
          return sortDrivers([optimisticDriver, ...base.filter((item) => item.driverId !== optimisticDriver.driverId)]);
        });
        setSelectedDriverId(credentials.driverId);
        setErrorMessage(null);
        showAutoInfo("Şoför eklendi. Giriş bilgileri sağ panelde hazır.");
        setRefreshNonce((prev) => prev + 1);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Şoför hesabı oluşturulamadı.");
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
        setDrivers((prev) =>
          prev ? prev.map((driver) => (driver.driverId === driverId ? { ...driver, status: newStatus } : driver)) : prev,
        );
        setErrorMessage(null);
        showAutoInfo(newStatus === "active" ? "Şoför aktif edildi." : "Şoför pasife alındı.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Durum güncellenemedi.");
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
        setErrorMessage(null);
        showAutoInfo("Şoför rotaya atandı.");
        setRefreshNonce((prev) => prev + 1);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Atama yapılamadı.");
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
        setErrorMessage(null);
        showAutoInfo("Şoför rota atamasından çıkarıldı.");
        setRefreshNonce((prev) => prev + 1);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Atama kaldırılamadı.");
      } finally {
        setActionKey(null);
      }
    },
    [companyId, showAutoInfo],
  );

  const isLoading = !drivers || !routes || !vehicles;

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Toplam şoför", value: metrics.total, color: "text-slate-900" },
          { label: "Aktif", value: metrics.active, color: "text-emerald-700" },
          { label: "Pasif", value: metrics.passive, color: "text-slate-600" },
          { label: "Atama bekleyen", value: metrics.assignmentPending, color: "text-amber-700" },
        ].map((card) => (
          <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{card.label}</div>
            <div className={`mt-3 text-4xl font-semibold tracking-tight ${card.color}`}>{card.value}</div>
          </article>
        ))}
      </div>

      <DriverCreateSection canCreate={canMutate} actionKey={actionKey} onCreateDriver={handleCreateDriver} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Şoför listesi</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Operasyon ekranı</h2>
                <p className="mt-1 text-sm text-slate-500">Ekle, filtrele, seç ve sağ panelden rota durumunu yönet.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/c/${companyId}/routes`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                >
                  Rotalara git
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href={`/c/${companyId}/vehicles`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                >
                  Araçlara git
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setRefreshNonce((prev) => prev + 1)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Yenile
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Şoför adı, telefon, plaka veya rota ile ara"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                {filteredDrivers.length}/{drivers?.length ?? 0} görünüyor
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilter(option.key)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    filter === option.key
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {infoMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
              {infoMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-14 text-sm text-slate-500 shadow-sm">
              <span className="mr-3 block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
              Şoför ve rota bilgileri yükleniyor...
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
              <DriverListSection
                drivers={drivers}
                filteredDrivers={filteredDrivers}
                selectedDriverId={selectedDriverId}
                onSelectDriver={setSelectedDriverId}
              />
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
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
        </aside>
      </div>
    </section>
  );
}
