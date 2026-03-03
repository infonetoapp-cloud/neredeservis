"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import {
  normalizePlateInput,
  type VehicleDraft,
  VEHICLE_CAPACITY_MAX,
  VEHICLE_CAPACITY_MIN,
} from "@/components/company/vehicles/vehicle-ui-helpers";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  createCompanyVehicleForCompany,
  listCompanyDriversForCompany,
  listCompanyRoutesForCompany,
  listCompanyVehiclesForCompany,
  updateCompanyRouteForCompany,
  updateCompanyVehicleForCompany,
  type CompanyDriverItem,
  type CompanyRouteItem,
  type CompanyVehicleItem,
} from "@/features/company/company-client";

type Props = {
  companyId: string;
};

const VEHICLE_LABEL_MAX = 80;

function formatDateTime(value: string | null): string {
  if (!value) {
    return "BULUNAMADI";
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return "BULUNAMADI";
  }
  return new Date(parsed).toLocaleString("tr-TR");
}

function readVehicleDraft(
  vehicle: CompanyVehicleItem,
  drafts: Record<string, VehicleDraft>,
): VehicleDraft {
  return (
    drafts[vehicle.vehicleId] ?? {
      plate: vehicle.plate,
      label: vehicle.label ?? "",
      capacity: vehicle.capacity != null ? String(vehicle.capacity) : "",
      isActive: vehicle.isActive,
    }
  );
}

export function CompanyVehiclesManagement({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole } = useCompanyMembership();
  const [vehicles, setVehicles] = useState<CompanyVehicleItem[] | null>(null);
  const [routes, setRoutes] = useState<CompanyRouteItem[] | null>(null);
  const [drivers, setDrivers] = useState<CompanyDriverItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [savingVehicleId, setSavingVehicleId] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [routeSelectionByVehicle, setRouteSelectionByVehicle] = useState<Record<string, string>>({});

  const [createPlate, setCreatePlate] = useState<string>("");
  const [createLabel, setCreateLabel] = useState<string>("");
  const [createCapacity, setCreateCapacity] = useState<string>("");
  const [createPending, setCreatePending] = useState<boolean>(false);
  const [showCreateValidation, setShowCreateValidation] = useState<boolean>(false);

  const [drafts, setDrafts] = useState<Record<string, VehicleDraft>>({});

  useEffect(() => {
    if (status !== "signed_in") {
      return;
    }

    let cancelled = false;
    Promise.all([
      listCompanyVehiclesForCompany({ companyId, limit: 200 }),
      listCompanyRoutesForCompany({ companyId, limit: 200 }),
      listCompanyDriversForCompany({ companyId, limit: 200 }),
    ])
      .then(([nextVehicles, nextRoutes, nextDrivers]) => {
        if (cancelled) {
          return;
        }
        setVehicles(nextVehicles);
        setRoutes(nextRoutes);
        setDrivers(nextDrivers);
        setErrorMessage(null);
        setInfoMessage(null);
        setDrafts((prev) => {
          const nextDrafts: Record<string, VehicleDraft> = {};
          for (const vehicle of nextVehicles) {
            nextDrafts[vehicle.vehicleId] = prev[vehicle.vehicleId] ?? {
              plate: vehicle.plate,
              label: vehicle.label ?? "",
              capacity: vehicle.capacity != null ? String(vehicle.capacity) : "",
              isActive: vehicle.isActive,
            };
          }
          return nextDrafts;
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Arac ve rota bilgileri alinamadi.";
        setErrorMessage(message);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, refreshNonce, status]);

  const sortedVehicles = useMemo(
    () => [...(vehicles ?? [])].sort((left, right) => left.plate.localeCompare(right.plate, "tr")),
    [vehicles],
  );
  const filteredVehicles = useMemo(() => {
    const query = vehicleSearchQuery.trim().toLocaleLowerCase("tr");
    return sortedVehicles.filter((vehicle) => {
      if (vehicleStatusFilter === "active" && !vehicle.isActive) {
        return false;
      }
      if (vehicleStatusFilter === "inactive" && vehicle.isActive) {
        return false;
      }
      if (!query) {
        return true;
      }
      const fields = [vehicle.plate, vehicle.label ?? "", vehicle.vehicleId].join(" ").toLocaleLowerCase("tr");
      return fields.includes(query);
    });
  }, [sortedVehicles, vehicleSearchQuery, vehicleStatusFilter]);

  const metrics = useMemo(() => {
    return {
      total: sortedVehicles.length,
      active: sortedVehicles.filter((item) => item.isActive).length,
      inactive: sortedVehicles.filter((item) => !item.isActive).length,
      capacityDefined: sortedVehicles.filter((item) => item.capacity != null).length,
      unlabeled: sortedVehicles.filter((item) => !item.label || item.label.trim().length === 0).length,
      assignedToRoute:
        routes?.filter((route) => !route.isArchived && typeof route.vehicleId === "string" && route.vehicleId.length > 0)
          .length ?? 0,
    };
  }, [routes, sortedVehicles]);

  useEffect(() => {
    if (sortedVehicles.length === 0) {
      setSelectedVehicleId(null);
      return;
    }
    if (selectedVehicleId && sortedVehicles.some((item) => item.vehicleId === selectedVehicleId)) {
      return;
    }
    setSelectedVehicleId(sortedVehicles[0]?.vehicleId ?? null);
  }, [sortedVehicles, selectedVehicleId]);

  const selectedVehicle = useMemo(
    () => sortedVehicles.find((item) => item.vehicleId === selectedVehicleId) ?? null,
    [selectedVehicleId, sortedVehicles],
  );

  const selectedVehicleDraft = useMemo(() => {
    if (!selectedVehicle) {
      return null;
    }
    return readVehicleDraft(selectedVehicle, drafts);
  }, [drafts, selectedVehicle]);

  const selectedVehicleRoutes = useMemo(() => {
    if (!selectedVehicle || !routes) {
      return [];
    }
    return routes
      .filter((route) => !route.isArchived && route.vehicleId === selectedVehicle.vehicleId)
      .sort((left, right) => left.name.localeCompare(right.name, "tr"));
  }, [routes, selectedVehicle]);

  const assignableRoutes = useMemo(() => {
    if (!selectedVehicle || !routes) {
      return [];
    }
    return routes
      .filter((route) => !route.isArchived && route.vehicleId !== selectedVehicle.vehicleId)
      .sort((left, right) => left.name.localeCompare(right.name, "tr"));
  }, [routes, selectedVehicle]);

  const selectedVehicleDrivers = useMemo(() => {
    if (!selectedVehicle || !drivers || !routes) {
      return [];
    }
    const vehicleRouteIds = new Set(
      routes
        .filter((route) => !route.isArchived && route.vehicleId === selectedVehicle.vehicleId)
        .map((route) => route.routeId),
    );
    if (vehicleRouteIds.size === 0) {
      return [];
    }
    return drivers.filter((driver) =>
      driver.assignedRoutes.some((assignment) => vehicleRouteIds.has(assignment.routeId)),
    );
  }, [drivers, routes, selectedVehicle]);

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }
    const currentSelection = routeSelectionByVehicle[selectedVehicle.vehicleId];
    if (currentSelection) {
      return;
    }
    const firstRouteId = assignableRoutes[0]?.routeId;
    if (!firstRouteId) {
      return;
    }
    setRouteSelectionByVehicle((prev) => ({
      ...prev,
      [selectedVehicle.vehicleId]: firstRouteId,
    }));
  }, [assignableRoutes, routeSelectionByVehicle, selectedVehicle]);

  const normalizedCreatePlate = normalizePlateInput(createPlate);
  const normalizedCreateLabel = createLabel.trim();
  const normalizedCreateCapacityRaw = createCapacity.trim();
  const createValidationIssues: string[] = [];
  if (normalizedCreatePlate.length < 2) {
    createValidationIssues.push("Plaka en az 2 karakter olmali.");
  }
  if (normalizedCreateLabel.length > VEHICLE_LABEL_MAX) {
    createValidationIssues.push("Arac etiketi en fazla 80 karakter olabilir.");
  }
  if (normalizedCreateCapacityRaw.length > 0) {
    const parsed = Number.parseInt(normalizedCreateCapacityRaw, 10);
    if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
      createValidationIssues.push("Kapasite 1-120 araliginda olmali.");
    }
  }
  const canCreate = createValidationIssues.length === 0 && !createPending;
  const canMutate = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";

  const handleCreateVehicle = async () => {
    if (!canCreate || !canMutate) {
      if (canMutate) {
        setShowCreateValidation(true);
        setErrorMessage("Formda eksik veya gecersiz alanlar var.");
      }
      return;
    }

    const duplicateExists = (vehicles ?? []).some(
      (item) => normalizePlateInput(item.plate) === normalizedCreatePlate,
    );
    if (duplicateExists) {
      setErrorMessage("Ayni plakada kayitli bir arac zaten var.");
      return;
    }
    let createCapacityValue: number | undefined;
    if (normalizedCreateCapacityRaw.length > 0) {
      const parsed = Number.parseInt(normalizedCreateCapacityRaw, 10);
      if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
        setErrorMessage("Kapasite 1-120 araliginda olmali.");
        return;
      }
      createCapacityValue = parsed;
    }

    setCreatePending(true);
    try {
      const created = await createCompanyVehicleForCompany({
        companyId,
        plate: normalizedCreatePlate,
        label: normalizedCreateLabel || undefined,
        capacity: createCapacityValue,
      });
      setVehicles((prev) => {
        const base = prev ?? [];
        return [created, ...base.filter((item) => item.vehicleId !== created.vehicleId)];
      });
      setDrafts((prev) => ({
        ...prev,
        [created.vehicleId]: {
          plate: created.plate,
          label: created.label ?? "",
          capacity: created.capacity != null ? String(created.capacity) : "",
          isActive: created.isActive,
        },
      }));
      setCreatePlate("");
      setCreateLabel("");
      setCreateCapacity("");
      setShowCreateValidation(false);
      setErrorMessage(null);
      setInfoMessage("Arac basariyla eklendi.");
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arac olusturulamadi.";
      setErrorMessage(message);
    } finally {
      setCreatePending(false);
    }
  };

  const handleResetCreateForm = () => {
    setCreatePlate("");
    setCreateLabel("");
    setCreateCapacity("");
    setShowCreateValidation(false);
  };

  const handleSaveVehicle = async (vehicleId: string) => {
    if (!canMutate) {
      return;
    }
    const draft = drafts[vehicleId];
    if (!draft) {
      return;
    }
    const normalizedDraftPlate = normalizePlateInput(draft.plate);
    if (normalizedDraftPlate.length < 2) {
      setErrorMessage("Plaka en az 2 karakter olmali.");
      return;
    }
    const duplicateExists = (vehicles ?? []).some(
      (item) => item.vehicleId !== vehicleId && normalizePlateInput(item.plate) === normalizedDraftPlate,
    );
    if (duplicateExists) {
      setErrorMessage("Bu plaka baska bir arac kaydinda kullaniliyor.");
      return;
    }
    const draftCapacityRaw = draft.capacity.trim();
    let draftCapacity: number | null = null;
    if (draftCapacityRaw.length > 0) {
      const parsed = Number.parseInt(draftCapacityRaw, 10);
      if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
        setErrorMessage("Kapasite 1-120 araliginda olmali.");
        return;
      }
      draftCapacity = parsed;
    }

    setSavingVehicleId(vehicleId);
    try {
      const updated = await updateCompanyVehicleForCompany({
        companyId,
        vehicleId,
        plate: normalizedDraftPlate,
        label: draft.label.trim().length > 0 ? draft.label : null,
        capacity: draftCapacity,
        isActive: draft.isActive,
      });
      setVehicles((prev) => {
        const base = prev ?? [];
        return base.map((item) => (item.vehicleId === vehicleId ? updated : item));
      });
      setErrorMessage(null);
      setInfoMessage("Arac kaydi guncellendi.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arac guncellenemedi.";
      setErrorMessage(message);
    } finally {
      setSavingVehicleId(null);
    }
  };

  const updateDraft = (vehicle: CompanyVehicleItem, patch: Partial<VehicleDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [vehicle.vehicleId]: {
        ...readVehicleDraft(vehicle, prev),
        ...patch,
      },
    }));
  };

  const handleAssignVehicleToRoute = async () => {
    if (!selectedVehicle || !canMutate) {
      return;
    }
    const routeId = routeSelectionByVehicle[selectedVehicle.vehicleId];
    if (!routeId) {
      setErrorMessage("Baglamak icin bir rota secin.");
      return;
    }

    setActionKey(`assign:${selectedVehicle.vehicleId}:${routeId}`);
    try {
      await updateCompanyRouteForCompany({
        companyId,
        routeId,
        vehicleId: selectedVehicle.vehicleId,
      });
      setErrorMessage(null);
      setInfoMessage("Arac rotaya baglandi.");
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arac rotaya baglanamadi.";
      setErrorMessage(message);
    } finally {
      setActionKey(null);
    }
  };

  const handleUnassignVehicleFromRoute = async (routeId: string) => {
    if (!selectedVehicle || !canMutate) {
      return;
    }

    setActionKey(`unassign:${selectedVehicle.vehicleId}:${routeId}`);
    try {
      await updateCompanyRouteForCompany({
        companyId,
        routeId,
        vehicleId: null,
      });
      setErrorMessage(null);
      setInfoMessage("Arac rota baglantisindan cikarildi.");
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arac rota baglantisi kaldirilamadi.";
      setErrorMessage(message);
    } finally {
      setActionKey(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Toplam arac</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{metrics.total}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Aktif</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-700">{metrics.active}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Pasif</div>
          <div className="mt-2 text-2xl font-semibold text-slate-700">{metrics.inactive}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Kapasite girili</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f5a4c]">{metrics.capacityDefined}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Etiketsiz</div>
          <div className="mt-2 text-2xl font-semibold text-amber-700">{metrics.unlabeled}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Araca bagli rota</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f5a4c]">{metrics.assignedToRoute}</div>
        </article>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Arac operasyon merkezi</div>
          <button
            type="button"
            onClick={() => setRefreshNonce((prev) => prev + 1)}
            className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            Yenile
          </button>
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <input
            type="search"
            value={vehicleSearchQuery}
            onChange={(event) => setVehicleSearchQuery(event.target.value)}
            placeholder="Plaka veya etiket ile ara"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          />
          <select
            value={vehicleStatusFilter}
            onChange={(event) =>
              setVehicleStatusFilter(event.target.value as "all" | "active" | "inactive")
            }
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">Tum durumlar</option>
            <option value="active">Sadece aktif</option>
            <option value="inactive">Sadece pasif</option>
          </select>
          <div className="glass-chip inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            {filteredVehicles.length}/{sortedVehicles.length} gorunuyor
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={`/c/${companyId}/live-ops`}
            className="glass-button inline-flex items-center rounded-xl px-3 py-1.5 font-semibold"
          >
            Canli operasyona git
          </Link>
          <Link
            href={`/c/${companyId}/drivers`}
            className="glass-button inline-flex items-center rounded-xl px-3 py-1.5 font-semibold"
          >
            Soforlere git
          </Link>
        </div>

        {infoMessage ? (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {infoMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {errorMessage}
          </div>
        ) : null}

        {canMutate ? (
          <div className="mb-3 rounded-xl border border-line bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-slate-700">Yeni arac ekle</div>
            <div className="mb-2 rounded-xl border border-[#d8e5f3] bg-[#f6f9ff] px-3 py-2 text-[11px] text-[#4e637d]">
              Plaka otomatik buyuk harfe donusturulur. Kapasite bilgisi opsiyoneldir.
            </div>
            <div className="grid gap-2 md:grid-cols-[170px_1fr_120px_110px]">
              <input
                type="text"
                value={createPlate}
                onChange={(event) => {
                  setCreatePlate(normalizePlateInput(event.target.value));
                  setShowCreateValidation(false);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }
                  event.preventDefault();
                  void handleCreateVehicle();
                }}
                placeholder="34ABC123"
                className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
              />
              <input
                type="text"
                value={createLabel}
                onChange={(event) => {
                  setCreateLabel(event.target.value);
                  setShowCreateValidation(false);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }
                  event.preventDefault();
                  void handleCreateVehicle();
                }}
                placeholder="Servis Minibus 1"
                className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
              />
              <input
                type="number"
                min={1}
                max={120}
                value={createCapacity}
                onChange={(event) => {
                  setCreateCapacity(event.target.value);
                  setShowCreateValidation(false);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }
                  event.preventDefault();
                  void handleCreateVehicle();
                }}
                placeholder="Kapasite"
                className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
              />
              <button
                type="button"
                onClick={handleCreateVehicle}
                disabled={!canCreate}
                className="glass-button-primary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createPending ? "Ekleniyor..." : "Ekle"}
              </button>
            </div>
            {showCreateValidation && createValidationIssues.length > 0 ? (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="font-semibold">Arac eklemeden once tamamlanmasi gerekenler:</div>
                <div className="mt-1 space-y-1">
                  {createValidationIssues.map((issue) => (
                    <div key={issue}>- {issue}</div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-2">
              <button
                type="button"
                onClick={handleResetCreateForm}
                className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                Formu temizle
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Bu rolde arac ekleme ve guncelleme kapali. Sadece listeyi goruntuleyebilirsin.
          </div>
        )}

        {!vehicles || !routes ? (
          <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
            Arac ve rota bilgileri yukleniyor...
          </div>
        ) : sortedVehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
            Bu sirkete kayitli arac bulunmuyor.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-2">
              {filteredVehicles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
                  Arama ve filtreye uygun arac bulunamadi.
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <button
                    key={vehicle.vehicleId}
                    type="button"
                    onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedVehicleId === vehicle.vehicleId
                        ? "border-[#7ac7b6] bg-[#f2fcf9]"
                        : "border-line bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{vehicle.plate}</div>
                      <div
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          vehicle.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        {vehicle.isActive ? "Aktif" : "Pasif"}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{vehicle.label ?? "Etiket girilmemis"}</div>
                    <div className="mt-1 text-[11px] text-muted">
                      Kapasite: {vehicle.capacity ?? "BULUNAMADI"} | Son guncelleme:{" "}
                      {formatDateTime(vehicle.updatedAt)}
                    </div>
                  </button>
                ))
              )}
            </div>

            <aside className="glass-panel-muted rounded-2xl p-3">
              {!selectedVehicle || !selectedVehicleDraft ? (
                <div className="rounded-xl border border-dashed border-line bg-white p-3 text-xs text-muted">
                  Detay icin bir arac secin.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{selectedVehicle.plate}</div>
                    <div className="mt-1 text-xs text-muted">Sistem kimligi: {selectedVehicle.vehicleId}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Olusturma: {formatDateTime(selectedVehicle.createdAt)} | Son guncelleme:{" "}
                      {formatDateTime(selectedVehicle.updatedAt)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-700">Arac bilgileri</div>
                    {canMutate ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={selectedVehicleDraft.plate}
                          onChange={(event) =>
                            updateDraft(selectedVehicle, {
                              plate: normalizePlateInput(event.target.value),
                            })
                          }
                          className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                        />
                        <input
                          type="text"
                          value={selectedVehicleDraft.label}
                          onChange={(event) => updateDraft(selectedVehicle, { label: event.target.value })}
                          placeholder="Arac etiketi"
                          className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                        />
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={selectedVehicleDraft.capacity}
                          onChange={(event) => updateDraft(selectedVehicle, { capacity: event.target.value })}
                          placeholder="Kapasite"
                          className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                        />
                        <label className="glass-input inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-900">
                          <input
                            type="checkbox"
                            checked={selectedVehicleDraft.isActive}
                            onChange={(event) =>
                              updateDraft(selectedVehicle, { isActive: event.target.checked })
                            }
                          />
                          Arac aktif
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSaveVehicle(selectedVehicle.vehicleId)}
                          disabled={savingVehicleId === selectedVehicle.vehicleId}
                          className="glass-button-primary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingVehicleId === selectedVehicle.vehicleId
                            ? "Kaydediliyor..."
                            : "Degisiklikleri kaydet"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="rounded-xl border border-line px-3 py-2 text-slate-900">
                          Etiket: {selectedVehicle.label ?? "Etiket girilmemis"}
                        </div>
                        <div className="rounded-xl border border-line px-3 py-2 text-slate-900">
                          Kapasite: {selectedVehicle.capacity ?? "BULUNAMADI"}
                        </div>
                        <div className="rounded-xl border border-line px-3 py-2 text-slate-900">
                          Durum: {selectedVehicle.isActive ? "Aktif" : "Pasif"}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-700">Bagli soforler</div>
                    {selectedVehicleDrivers.length === 0 ? (
                      <div className="text-xs text-muted">Bu aracin rotalarina atanmis sofor yok.</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedVehicleDrivers.map((driver) => (
                          <div
                            key={driver.driverId}
                            className="flex items-center justify-between gap-2 rounded-xl border border-line px-2 py-1.5"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{driver.name}</div>
                              <div className="text-[11px] text-muted">
                                {driver.plateMasked}{driver.phoneMasked ? ` · ${driver.phoneMasked}` : ""}
                              </div>
                            </div>
                            <div
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                driver.status === "active"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-100 text-slate-500"
                              }`}
                            >
                              {driver.status === "active" ? "Aktif" : "Pasif"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-700">Rota baglantilari</div>
                    {selectedVehicleRoutes.length === 0 ? (
                      <div className="text-xs text-muted">Bu araca bagli aktif rota yok.</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedVehicleRoutes.map((route) => (
                          <div
                            key={route.routeId}
                            className="flex items-center justify-between gap-2 rounded-xl border border-line px-2 py-1.5"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{route.name}</div>
                              <div className="text-[11px] text-muted">
                                Saat: {route.scheduledTime ?? "BULUNAMADI"}
                              </div>
                            </div>
                            {canMutate ? (
                              <button
                                type="button"
                                onClick={() => handleUnassignVehicleFromRoute(route.routeId)}
                                disabled={actionKey === `unassign:${selectedVehicle.vehicleId}:${route.routeId}`}
                                className="glass-button rounded-lg px-2 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionKey === `unassign:${selectedVehicle.vehicleId}:${route.routeId}`
                                  ? "Kaldiriliyor..."
                                  : "Kaldir"}
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    {canMutate ? (
                      <div className="mt-3">
                        <div className="mb-2 text-xs font-semibold text-slate-700">Rotaya bagla</div>
                        <select
                          value={routeSelectionByVehicle[selectedVehicle.vehicleId] ?? ""}
                          onChange={(event) =>
                            setRouteSelectionByVehicle((prev) => ({
                              ...prev,
                              [selectedVehicle.vehicleId]: event.target.value,
                            }))
                          }
                          className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                        >
                          {assignableRoutes.length === 0 ? <option value="">Uygun rota yok</option> : null}
                          {assignableRoutes.map((route) => (
                            <option key={route.routeId} value={route.routeId}>
                              {route.name} {route.vehiclePlate ? `(su an: ${route.vehiclePlate})` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAssignVehicleToRoute}
                          disabled={
                            assignableRoutes.length === 0 ||
                            !routeSelectionByVehicle[selectedVehicle.vehicleId] ||
                            actionKey ===
                              `assign:${selectedVehicle.vehicleId}:${routeSelectionByVehicle[selectedVehicle.vehicleId]}`
                          }
                          className="glass-button-primary mt-2 inline-flex rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionKey ===
                          `assign:${selectedVehicle.vehicleId}:${routeSelectionByVehicle[selectedVehicle.vehicleId]}`
                            ? "Baglaniyor..."
                            : "Secili rotaya bagla"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted">
                        Rota baglama islemleri bu rolde kapali (salt okuma).
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
