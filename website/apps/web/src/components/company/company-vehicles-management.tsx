"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import {
  normalizePlateInput,
  vehicleDraftFromItem,
  type VehicleDraft,
  VEHICLE_CAPACITY_MAX,
  VEHICLE_CAPACITY_MIN,
  VEHICLE_STATUS_OPTIONS,
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
  type VehicleStatus,
} from "@/features/company/company-client";

type Props = {
  companyId: string;
};

const VEHICLE_LABEL_MAX = 80;

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Date(parsed).toLocaleString("tr-TR");
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
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<"all" | VehicleStatus>("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [routeSelectionByVehicle, setRouteSelectionByVehicle] = useState<Record<string, string>>({});

  // Create form state
  const [createPlate, setCreatePlate] = useState("");
  const [createBrand, setCreateBrand] = useState("");
  const [createModel, setCreateModel] = useState("");
  const [createYear, setCreateYear] = useState("");
  const [createCapacity, setCreateCapacity] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [showCreateValidation, setShowCreateValidation] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
            nextDrafts[vehicle.vehicleId] = prev[vehicle.vehicleId] ?? vehicleDraftFromItem(vehicle);
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
      if (vehicleStatusFilter !== "all" && vehicle.status !== vehicleStatusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const fields = [vehicle.plate, vehicle.label ?? "", vehicle.brand ?? "", vehicle.model ?? "", vehicle.vehicleId].join(" ").toLocaleLowerCase("tr");
      return fields.includes(query);
    });
  }, [sortedVehicles, vehicleSearchQuery, vehicleStatusFilter]);

  const metrics = useMemo(() => {
    return {
      total: sortedVehicles.length,
      active: sortedVehicles.filter((item) => item.status === "active").length,
      maintenance: sortedVehicles.filter((item) => item.status === "maintenance").length,
      inactive: sortedVehicles.filter((item) => item.status === "inactive").length,
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
    return drafts[selectedVehicle.vehicleId] ?? vehicleDraftFromItem(selectedVehicle);
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
  const createValidationIssues: string[] = [];
  if (normalizedCreatePlate.length < 2) {
    createValidationIssues.push("Plaka en az 2 karakter olmalı.");
  }
  if (createCapacity.trim().length > 0) {
    const parsed = Number.parseInt(createCapacity.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
      createValidationIssues.push(`Kapasite ${VEHICLE_CAPACITY_MIN}-${VEHICLE_CAPACITY_MAX} aralığında olmalı.`);
    }
  }
  if (createYear.trim().length > 0) {
    const parsed = Number.parseInt(createYear.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
      createValidationIssues.push("Yıl 1900-2100 aralığında olmalı.");
    }
  }
  const canCreate = createValidationIssues.length === 0 && !createPending;
  const canMutate = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";

  // Auto-dismiss info messages after 3 seconds
  const showAutoInfo = useCallback((msg: string) => {
    setInfoMessage(msg);
    setTimeout(() => setInfoMessage((cur) => (cur === msg ? null : cur)), 3000);
  }, []);

  const handleCreateVehicle = async () => {
    if (!canCreate || !canMutate) {
      if (canMutate) {
        setShowCreateValidation(true);
        setErrorMessage("Formda eksik veya geçersiz alanlar var.");
      }
      return;
    }

    const duplicateExists = (vehicles ?? []).some(
      (item) => normalizePlateInput(item.plate) === normalizedCreatePlate,
    );
    if (duplicateExists) {
      setErrorMessage("Aynı plakada kayıtlı bir araç zaten var.");
      return;
    }
    let createCapacityValue: number | undefined;
    if (createCapacity.trim().length > 0) {
      const parsed = Number.parseInt(createCapacity.trim(), 10);
      if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
        setErrorMessage(`Kapasite ${VEHICLE_CAPACITY_MIN}-${VEHICLE_CAPACITY_MAX} aralığında olmalı.`);
        return;
      }
      createCapacityValue = parsed;
    }
    let createYearValue: number | undefined;
    if (createYear.trim().length > 0) {
      const parsed = Number.parseInt(createYear.trim(), 10);
      if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
        setErrorMessage("Yıl 1900-2100 aralığında olmalı.");
        return;
      }
      createYearValue = parsed;
    }

    setCreatePending(true);
    try {
      const created = await createCompanyVehicleForCompany({
        companyId,
        plate: normalizedCreatePlate,
        brand: createBrand.trim() || undefined,
        model: createModel.trim() || undefined,
        year: createYearValue,
        capacity: createCapacityValue,
      });
      setVehicles((prev) => {
        const base = prev ?? [];
        return [created, ...base.filter((item) => item.vehicleId !== created.vehicleId)];
      });
      setDrafts((prev) => ({
        ...prev,
        [created.vehicleId]: vehicleDraftFromItem(created),
      }));
      setCreatePlate("");
      setCreateBrand("");
      setCreateModel("");
      setCreateYear("");
      setCreateCapacity("");
      setShowCreateValidation(false);
      setShowCreateForm(false);
      setErrorMessage(null);
      showAutoInfo("Araç başarıyla eklendi.");
      setSelectedVehicleId(created.vehicleId);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Araç oluşturulamadı.";
      setErrorMessage(message);
    } finally {
      setCreatePending(false);
    }
  };

  const handleResetCreateForm = () => {
    setCreatePlate("");
    setCreateBrand("");
    setCreateModel("");
    setCreateYear("");
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
      setErrorMessage("Plaka en az 2 karakter olmalı.");
      return;
    }
    const duplicateExists = (vehicles ?? []).some(
      (item) => item.vehicleId !== vehicleId && normalizePlateInput(item.plate) === normalizedDraftPlate,
    );
    if (duplicateExists) {
      setErrorMessage("Bu plaka başka bir araç kaydında kullanılıyor.");
      return;
    }
    const draftCapacityRaw = draft.capacity.trim();
    let draftCapacity: number | null = null;
    if (draftCapacityRaw.length > 0) {
      const parsed = Number.parseInt(draftCapacityRaw, 10);
      if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
        setErrorMessage(`Kapasite ${VEHICLE_CAPACITY_MIN}-${VEHICLE_CAPACITY_MAX} aralığında olmalı.`);
        return;
      }
      draftCapacity = parsed;
    }
    let draftYear: number | null = null;
    if (draft.year.trim().length > 0) {
      const parsed = Number.parseInt(draft.year.trim(), 10);
      if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
        setErrorMessage("Yıl 1900-2100 aralığında olmalı.");
        return;
      }
      draftYear = parsed;
    }

    setSavingVehicleId(vehicleId);
    try {
      const updated = await updateCompanyVehicleForCompany({
        companyId,
        vehicleId,
        plate: normalizedDraftPlate,
        brand: draft.brand.trim().length > 0 ? draft.brand.trim() : null,
        model: draft.model.trim().length > 0 ? draft.model.trim() : null,
        year: draftYear,
        capacity: draftCapacity,
        status: draft.status,
      });
      setVehicles((prev) => {
        const base = prev ?? [];
        return base.map((item) => (item.vehicleId === vehicleId ? updated : item));
      });
      setErrorMessage(null);
      showAutoInfo("Araç kaydı güncellendi.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Araç güncellenemedi.";
      setErrorMessage(message);
    } finally {
      setSavingVehicleId(null);
    }
  };

  const updateDraft = (vehicle: CompanyVehicleItem, patch: Partial<VehicleDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [vehicle.vehicleId]: {
        ...(prev[vehicle.vehicleId] ?? vehicleDraftFromItem(vehicle)),
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
      showAutoInfo("Araç rotaya bağlandı.");
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
      showAutoInfo("Araç rota bağlantısından çıkarıldı.");
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arac rota baglantisi kaldirilamadi.";
      setErrorMessage(message);
    } finally {
      setActionKey(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Metric cards ─── */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Toplam", value: metrics.total, color: "text-slate-900" },
          { label: "Aktif", value: metrics.active, color: "text-emerald-600" },
          { label: "Bakımda", value: metrics.maintenance, color: "text-amber-600" },
          { label: "Pasif", value: metrics.inactive, color: "text-slate-500" },
          { label: "Rotaya Bağlı", value: metrics.assignedToRoute, color: "text-blue-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {card.label}
            </div>
            <div className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Toast messages ─── */}
      {infoMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-medium text-emerald-800">{infoMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <span className="text-xs font-medium text-red-800">{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="shrink-0 text-red-400 hover:text-red-600">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ─── Main split-pane ─── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* ── Left panel: search + list ── */}
        <div className="w-full space-y-3 lg:w-[45%] lg:min-w-[340px]">
          {/* Search & filter bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                placeholder="Plaka, marka veya model ara..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={vehicleStatusFilter}
              onChange={(e) => setVehicleStatusFilter(e.target.value as "all" | VehicleStatus)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="maintenance">Bakımda</option>
              <option value="inactive">Pasif</option>
            </select>
            <button
              type="button"
              onClick={() => setRefreshNonce((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm hover:bg-slate-50 hover:text-slate-600"
              title="Yenile"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Quick links */}
          <div className="flex gap-2 text-xs">
            <Link href={`/c/${companyId}/live-ops`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 shadow-sm hover:bg-slate-50">
              Canlı Operasyon →
            </Link>
            <Link href={`/c/${companyId}/drivers`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 shadow-sm hover:bg-slate-50">
              Şoförler →
            </Link>
            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {filteredVehicles.length}/{sortedVehicles.length}
            </span>
          </div>

          {/* Add vehicle button or form */}
          {canMutate && (
            <>
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2.5 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="text-base leading-none">+</span> Yeni Araç Ekle
                </button>
              ) : (
                <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Plaka *</span>
                      <input
                        type="text"
                        value={createPlate}
                        onChange={(e) => { setCreatePlate(normalizePlateInput(e.target.value)); setShowCreateValidation(false); }}
                        placeholder="34ABC123"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Marka</span>
                      <input
                        type="text"
                        value={createBrand}
                        onChange={(e) => setCreateBrand(e.target.value)}
                        placeholder="Ford"
                        maxLength={80}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Model</span>
                      <input
                        type="text"
                        value={createModel}
                        onChange={(e) => setCreateModel(e.target.value)}
                        placeholder="Transit"
                        maxLength={80}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Yıl</span>
                        <input
                          type="number"
                          min={1900}
                          max={2100}
                          value={createYear}
                          onChange={(e) => setCreateYear(e.target.value)}
                          placeholder="2024"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kapasite</span>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={createCapacity}
                          onChange={(e) => setCreateCapacity(e.target.value)}
                          placeholder="30"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                  {showCreateValidation && createValidationIssues.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {createValidationIssues.map((issue) => (
                        <div key={issue}>• {issue}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateVehicle}
                      disabled={!canCreate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {createPending ? (
                        <>
                          <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Ekleniyor...
                        </>
                      ) : (
                        "Ekle"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleResetCreateForm(); setShowCreateForm(false); }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Vehicle list */}
          {!vehicles || !routes ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
              <span className="text-xs text-slate-500">Araçlar yükleniyor...</span>
            </div>
          ) : sortedVehicles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.276a2.25 2.25 0 00-.659-1.591l-2.432-2.432a2.25 2.25 0 00-1.591-.659H13.5V7.5a.75.75 0 00-.75-.75H5.625m7.5 11.25H12m0 0H5.625m0 0H3.375" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-500">Henüz araç eklenmemiş</p>
              <p className="mt-1 text-xs text-slate-400">İlk aracınızı ekleyerek filonuzu oluşturun.</p>
              {canMutate && !showCreateForm && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <span className="text-base leading-none">+</span> İlk Aracı Ekle
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredVehicles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  Arama ve filtreye uygun araç bulunamadı.
                </div>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const isSelected = selectedVehicleId === vehicle.vehicleId;
                  const statusOpt = VEHICLE_STATUS_OPTIONS.find((o) => o.value === vehicle.status);
                  const statusBadge = statusOpt
                    ? {
                        active: "border-emerald-200 bg-emerald-50 text-emerald-700",
                        maintenance: "border-amber-200 bg-amber-50 text-amber-700",
                        inactive: "border-slate-200 bg-slate-100 text-slate-600",
                      }[statusOpt.value]
                    : "border-slate-200 bg-slate-100 text-slate-600";

                  return (
                    <button
                      key={vehicle.vehicleId}
                      type="button"
                      onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                      className={`group w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                        isSelected
                          ? "border-blue-300 bg-blue-50/60 shadow-sm"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{vehicle.plate}</span>
                          {vehicle.label && (
                            <span className="truncate text-xs text-slate-500">{vehicle.label}</span>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadge}`}>
                          {statusOpt?.label ?? "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                        {vehicle.year && <span>{vehicle.year}</span>}
                        {vehicle.capacity != null && <span>{vehicle.capacity} kişi</span>}
                        <span className="ml-auto">{formatDateTime(vehicle.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: detail (sticky) ── */}
        <div className="w-full lg:w-[55%]">
          <div className="lg:sticky lg:top-4">
            {!selectedVehicle || !selectedVehicleDraft ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center" style={{ minHeight: "400px" }}>
                <div className="space-y-2 px-6">
                  <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.276a2.25 2.25 0 00-.659-1.591l-2.432-2.432a2.25 2.25 0 00-1.591-.659H13.5V7.5a.75.75 0 00-.75-.75H5.625m7.5 11.25H12m0 0H5.625m0 0H3.375" />
                  </svg>
                  <p className="text-sm font-medium text-slate-400">Araç Detayı</p>
                  <p className="text-xs text-slate-400">Listeden bir araç seçin.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vehicle header */}
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedVehicle.plate}</h2>
                    {selectedVehicle.label && (
                      <p className="text-sm text-slate-500">{selectedVehicle.label}</p>
                    )}
                  </div>
                  {(() => {
                    const so = VEHICLE_STATUS_OPTIONS.find((o) => o.value === selectedVehicle.status);
                    const badge = {
                      active: "border-emerald-200 bg-emerald-50 text-emerald-700",
                      maintenance: "border-amber-200 bg-amber-50 text-amber-700",
                      inactive: "border-slate-200 bg-slate-100 text-slate-600",
                    }[selectedVehicle.status] ?? "border-slate-200 bg-slate-100 text-slate-600";
                    return (
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}>
                        {so?.label ?? "—"}
                      </span>
                    );
                  })()}
                </div>

                {/* Edit section */}
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Araç Bilgileri</h3>
                  {canMutate ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Plaka</span>
                          <input
                            type="text"
                            value={selectedVehicleDraft.plate}
                            onChange={(e) => updateDraft(selectedVehicle, { plate: normalizePlateInput(e.target.value) })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Marka</span>
                          <input
                            type="text"
                            value={selectedVehicleDraft.brand}
                            onChange={(e) => updateDraft(selectedVehicle, { brand: e.target.value })}
                            placeholder="Ford"
                            maxLength={80}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Model</span>
                          <input
                            type="text"
                            value={selectedVehicleDraft.model}
                            onChange={(e) => updateDraft(selectedVehicle, { model: e.target.value })}
                            placeholder="Transit"
                            maxLength={80}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Yıl</span>
                            <input
                              type="number"
                              min={1900}
                              max={2100}
                              value={selectedVehicleDraft.year}
                              onChange={(e) => updateDraft(selectedVehicle, { year: e.target.value })}
                              placeholder="2024"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kapasite</span>
                            <input
                              type="number"
                              min={1}
                              max={200}
                              value={selectedVehicleDraft.capacity}
                              onChange={(e) => updateDraft(selectedVehicle, { capacity: e.target.value })}
                              placeholder="30"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status segmented control */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Durum</span>
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                          {VEHICLE_STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateDraft(selectedVehicle, { status: opt.value })}
                              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                selectedVehicleDraft.status === opt.value
                                  ? opt.value === "active"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : opt.value === "maintenance"
                                      ? "bg-amber-500 text-white shadow-sm"
                                      : "bg-slate-500 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveVehicle(selectedVehicle.vehicleId)}
                        disabled={savingVehicleId === selectedVehicle.vehicleId}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingVehicleId === selectedVehicle.vehicleId ? (
                          <>
                            <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Kaydediliyor...
                          </>
                        ) : (
                          "Değişiklikleri Kaydet"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {[
                        { label: "Marka", value: selectedVehicle.brand },
                        { label: "Model", value: selectedVehicle.model },
                        { label: "Yıl", value: selectedVehicle.year },
                        { label: "Kapasite", value: selectedVehicle.capacity != null ? `${selectedVehicle.capacity} kişi` : null },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-100 px-3 py-2">
                          <span className="text-[10px] font-semibold uppercase text-slate-400">{item.label}</span>
                          <p className="text-sm text-slate-700">{item.value ?? "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-4 text-[11px] text-slate-400">
                    <span>Oluşturma: {formatDateTime(selectedVehicle.createdAt)}</span>
                    <span>Güncelleme: {formatDateTime(selectedVehicle.updatedAt)}</span>
                  </div>
                </div>

                {/* Linked drivers */}
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Bağlı Şoförler</h3>
                  {selectedVehicleDrivers.length === 0 ? (
                    <p className="text-xs text-slate-400">Bu aracın rotalarına atanmış şoför yok.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedVehicleDrivers.map((driver) => (
                        <div key={driver.driverId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                          <div>
                            <span className="text-xs font-semibold text-slate-900">{driver.name}</span>
                            <span className="ml-2 text-[11px] text-slate-400">
                              {driver.plateMasked}{driver.phoneMasked ? ` · ${driver.phoneMasked}` : ""}
                            </span>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            driver.status === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}>
                            {driver.status === "active" ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Route assignments */}
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Rota Bağlantıları</h3>
                  {selectedVehicleRoutes.length === 0 ? (
                    <p className="text-xs text-slate-400">Bu araca bağlı aktif rota yok.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedVehicleRoutes.map((route) => (
                        <div key={route.routeId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                          <div>
                            <span className="text-xs font-semibold text-slate-900">{route.name}</span>
                            <span className="ml-2 text-[11px] text-slate-400">
                              Saat: {route.scheduledTime ?? "—"}
                            </span>
                          </div>
                          {canMutate && (
                            <button
                              type="button"
                              onClick={() => handleUnassignVehicleFromRoute(route.routeId)}
                              disabled={actionKey === `unassign:${selectedVehicle.vehicleId}:${route.routeId}`}
                              className="rounded-md px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              {actionKey === `unassign:${selectedVehicle.vehicleId}:${route.routeId}` ? "Kaldırılıyor..." : "Kaldır"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {canMutate && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rotaya Bağla</span>
                      <div className="flex gap-2">
                        <select
                          value={routeSelectionByVehicle[selectedVehicle.vehicleId] ?? ""}
                          onChange={(e) =>
                            setRouteSelectionByVehicle((prev) => ({
                              ...prev,
                              [selectedVehicle.vehicleId]: e.target.value,
                            }))
                          }
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          {assignableRoutes.length === 0 ? <option value="">Uygun rota yok</option> : null}
                          {assignableRoutes.map((route) => (
                            <option key={route.routeId} value={route.routeId}>
                              {route.name} {route.vehiclePlate ? `(şu an: ${route.vehiclePlate})` : ""}
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
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionKey ===
                          `assign:${selectedVehicle.vehicleId}:${routeSelectionByVehicle[selectedVehicle.vehicleId]}`
                            ? "Bağlanıyor..."
                            : "Bağla"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
