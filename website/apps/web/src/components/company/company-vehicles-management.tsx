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
  deleteCompanyVehicleForCompany,
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
const VEHICLE_PLATE_MIN_LENGTH = 4;
const VEHICLE_YEAR_MIN = 1900;
const VEHICLE_YEAR_MAX = 2100;

type VehicleValidationIssue = {
  id: string;
  title: string;
  message: string;
};

type CreateFieldKey = "plate" | "year" | "capacity";

const INITIAL_CREATE_TOUCHED: Record<CreateFieldKey, boolean> = {
  plate: false,
  year: false,
  capacity: false,
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50";

function mergeValidationIssues(...groups: VehicleValidationIssue[][]): VehicleValidationIssue[] {
  const seen = new Set<string>();
  const merged: VehicleValidationIssue[] = [];
  for (const group of groups) {
    for (const issue of group) {
      const key = `${issue.id}:${issue.message}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(issue);
    }
  }
  return merged;
}

function parseVehicleFormIssuesFromMessage(message: string): VehicleValidationIssue[] {
  const normalized = message.trim().toLocaleLowerCase("tr");
  if (!normalized) {
    return [];
  }

  if (
    normalized.includes("ayni plakada") ||
    normalized.includes("bu plaka baska") ||
    normalized.includes("ayni kayit zaten mevcut")
  ) {
    return [
      {
        id: "plate-duplicate",
        title: "Plaka kullaniliyor",
        message: "Bu plaka baska bir arac kaydinda zaten kullaniliyor.",
      },
    ];
  }

  if (normalized.includes("plaka en az 4 karakter") || normalized.includes("plate:")) {
    return [
      {
        id: "plate-min-length",
        title: "Plaka kisa",
        message: `Plaka en az ${VEHICLE_PLATE_MIN_LENGTH} karakter olmali.`,
      },
    ];
  }

  if (normalized.includes("yil 1900-2100") || normalized.includes("year:")) {
    return [
      {
        id: "year-range",
        title: "Yil gecersiz",
        message: `Yil ${VEHICLE_YEAR_MIN}-${VEHICLE_YEAR_MAX} araliginda olmali.`,
      },
    ];
  }

  if (normalized.includes("kapasite") || normalized.includes("capacity:")) {
    return [
      {
        id: "capacity-range",
        title: "Kapasite gecersiz",
        message: `Kapasite ${VEHICLE_CAPACITY_MIN}-${VEHICLE_CAPACITY_MAX} araliginda olmali.`,
      },
    ];
  }

  if (normalized.includes("brand:") || normalized.includes("marka")) {
    return [
      {
        id: "brand-invalid",
        title: "Marka gecersiz",
        message: "Marka bilgisi bos birakilabilir veya 1-80 karakter araliginda girilebilir.",
      },
    ];
  }

  if (normalized.includes("model:")) {
    return [
      {
        id: "model-invalid",
        title: "Model gecersiz",
        message: "Model bilgisi bos birakilabilir veya 1-80 karakter araliginda girilebilir.",
      },
    ];
  }

  if (normalized.includes("status:") || normalized.includes("durumu gecerli degil")) {
    return [
      {
        id: "status-invalid",
        title: "Durum gecersiz",
        message: "Arac durumu tekrar secilerek kaydedilmeli.",
      },
    ];
  }

  return [];
}

function VehicleValidationIssueStack({ issues }: { issues: VehicleValidationIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" className="grid gap-2 sm:grid-cols-2">
      {issues.map((issue, index) => (
        <div
          key={`${issue.id}:${issue.message}`}
          className="rounded-xl border border-rose-200 bg-white px-3 py-2.5 shadow-sm ring-1 ring-rose-100/70"
          style={{ animation: `vehicleValidationCardIn 220ms ease-out ${index * 70}ms both` }}
        >
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
                {issue.title}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-700">{issue.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getVehicleStatusBadgeClass(status: VehicleStatus | null | undefined): string {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "maintenance") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "inactive") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getMetricCardClass(tone: "slate" | "emerald" | "amber" | "blue"): string {
  if (tone === "emerald") {
    return "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80";
  }
  if (tone === "amber") {
    return "border-amber-100 bg-gradient-to-br from-white to-amber-50/80";
  }
  if (tone === "blue") {
    return "border-blue-100 bg-gradient-to-br from-white to-blue-50/80";
  }
  return "border-slate-200 bg-gradient-to-br from-white to-slate-50/80";
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Date(parsed).toLocaleString("tr-TR");
}

function getVehicleDescriptor(vehicle: Pick<CompanyVehicleItem, "brand" | "model" | "label">): string {
  const summary = [vehicle.brand, vehicle.model]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ");
  if (summary) {
    return summary;
  }
  if (vehicle.label && vehicle.label.trim()) {
    return vehicle.label.trim();
  }
  return "Marka ve model bilgisi bekleniyor";
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
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
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
  const [createTouched, setCreateTouched] = useState(INITIAL_CREATE_TOUCHED);
  const [createServerIssues, setCreateServerIssues] = useState<VehicleValidationIssue[]>([]);
  const [deleteTargetVehicle, setDeleteTargetVehicle] = useState<CompanyVehicleItem | null>(null);

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
        const message = error instanceof Error ? error.message : "Araç ve rota bilgileri alınamadı.";
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

  const routeCountsByVehicleId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const route of routes ?? []) {
      if (!route.isArchived || !route.vehicleId) {
        continue;
      }
      counts[route.vehicleId] = (counts[route.vehicleId] ?? 0) + 1;
    }
    return counts;
  }, [routes]);

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
  if (normalizedCreatePlate.length < VEHICLE_PLATE_MIN_LENGTH) {
    createValidationIssues.push(`Plaka en az ${VEHICLE_PLATE_MIN_LENGTH} karakter olmali.`);
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
  const createVisibleFieldIssues = [
    showCreateValidation || createTouched.plate
      ? normalizedCreatePlate.length < VEHICLE_PLATE_MIN_LENGTH
        ? {
            id: "plate-min-length",
            title: "Plaka eksik",
            message: `Plaka en az ${VEHICLE_PLATE_MIN_LENGTH} karakter olmali.`,
          }
        : null
      : null,
    showCreateValidation || createTouched.year
      ? createYear.trim().length > 0
        ? (() => {
            const parsed = Number.parseInt(createYear.trim(), 10);
            return !Number.isFinite(parsed) || parsed < VEHICLE_YEAR_MIN || parsed > VEHICLE_YEAR_MAX
              ? ({
                  id: "year-range",
                  title: "Yil gecersiz",
                  message: `Yil ${VEHICLE_YEAR_MIN}-${VEHICLE_YEAR_MAX} araliginda olmali.`,
                } satisfies VehicleValidationIssue)
              : null;
          })()
        : null
      : null,
    showCreateValidation || createTouched.capacity
      ? createCapacity.trim().length > 0
        ? (() => {
            const parsed = Number.parseInt(createCapacity.trim(), 10);
            return !Number.isFinite(parsed) ||
              parsed < VEHICLE_CAPACITY_MIN ||
              parsed > VEHICLE_CAPACITY_MAX
              ? ({
                  id: "capacity-range",
                  title: "Kapasite gecersiz",
                  message: `Kapasite ${VEHICLE_CAPACITY_MIN}-${VEHICLE_CAPACITY_MAX} araliginda olmali.`,
                } satisfies VehicleValidationIssue)
              : null;
          })()
        : null
      : null,
  ].filter((issue): issue is VehicleValidationIssue => issue !== null);
  const createFeedbackIssues = mergeValidationIssues(createVisibleFieldIssues, createServerIssues);

  // Auto-dismiss info messages after 3 seconds
  const showAutoInfo = useCallback((msg: string) => {
    setInfoMessage(msg);
    setTimeout(() => setInfoMessage((cur) => (cur === msg ? null : cur)), 3000);
  }, []);

  useEffect(() => {
    if (!deleteTargetVehicle) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deletingVehicleId) {
        setDeleteTargetVehicle(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTargetVehicle, deletingVehicleId]);

  const handleCreateVehicle = async () => {
    if (!canCreate || !canMutate) {
      if (canMutate) {
        setShowCreateValidation(true);
        setCreateTouched({
          plate: true,
          year: true,
          capacity: true,
        });
        setCreateServerIssues([]);
        setErrorMessage(null);
        return;
        setErrorMessage("Formda eksik veya geçersiz alanlar var.");
      }
      return;
    }

    const duplicateExists = (vehicles ?? []).some(
      (item) => normalizePlateInput(item.plate) === normalizedCreatePlate,
    );
    if (duplicateExists) {
      setCreateServerIssues([
        {
          id: "plate-duplicate",
          title: "Plaka kullaniliyor",
          message: "Bu plaka baska bir arac kaydinda zaten kullaniliyor.",
        },
      ]);
      setErrorMessage(null);
      return;
    }
    if (duplicateExists) {
      setErrorMessage("Aynı plakada kayıtlı bir araç zaten var.");
      return;
    }
    let createCapacityValue: number | undefined;
    if (createCapacity.trim().length > 0) {
      const parsed = Number.parseInt(createCapacity.trim(), 10);
      if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
        setCreateServerIssues([
          {
            id: "capacity-range",
            title: "Kapasite gecersiz",
            message: `Kapasite ${VEHICLE_CAPACITY_MIN}-${VEHICLE_CAPACITY_MAX} araliginda olmali.`,
          },
        ]);
        setErrorMessage(null);
        return;
      }
      if (!Number.isFinite(parsed) || parsed < VEHICLE_CAPACITY_MIN || parsed > VEHICLE_CAPACITY_MAX) {
        setErrorMessage(`Kapasite ${VEHICLE_CAPACITY_MIN}-${VEHICLE_CAPACITY_MAX} aralığında olmalı.`);
        return;
      }
      createCapacityValue = parsed;
    }
    let createYearValue: number | undefined;
    if (createYear.trim().length > 0) {
      const parsed = Number.parseInt(createYear.trim(), 10);
      if (!Number.isFinite(parsed) || parsed < VEHICLE_YEAR_MIN || parsed > VEHICLE_YEAR_MAX) {
        setCreateServerIssues([
          {
            id: "year-range",
            title: "Yil gecersiz",
            message: `Yil ${VEHICLE_YEAR_MIN}-${VEHICLE_YEAR_MAX} araliginda olmali.`,
          },
        ]);
        setErrorMessage(null);
        return;
      }
      if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
        setErrorMessage("Yıl 1900-2100 aralığında olmalı.");
        return;
      }
      createYearValue = parsed;
    }

    setCreatePending(true);
    setCreateServerIssues([]);
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
      setCreateTouched(INITIAL_CREATE_TOUCHED);
      setCreateServerIssues([]);
      setErrorMessage(null);
      showAutoInfo("Araç başarıyla eklendi.");
      setSelectedVehicleId(created.vehicleId);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "Arac olusturulamadi.";
      const parsedIssues = parseVehicleFormIssuesFromMessage(fallbackMessage);
      if (parsedIssues.length > 0) {
        setShowCreateValidation(true);
        setCreateServerIssues(parsedIssues);
        setErrorMessage(null);
        return;
      }
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
    setCreateTouched(INITIAL_CREATE_TOUCHED);
    setCreateServerIssues([]);
    setErrorMessage(null);
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
    if (normalizedDraftPlate.length < VEHICLE_PLATE_MIN_LENGTH) {
      setErrorMessage(`Plaka en az ${VEHICLE_PLATE_MIN_LENGTH} karakter olmali.`);
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

  const handleRequestDeleteVehicle = (vehicle: CompanyVehicleItem) => {
    if (!canMutate) {
      return;
    }
    if (selectedVehicleRoutes.length > 0) {
      setErrorMessage("Arac rotalara bagliyken silinemez. Once rota baglantilarini kaldir.");
      return;
    }
    setDeleteTargetVehicle(vehicle);
    setErrorMessage(null);
  };

  const handleDeleteVehicle = async (vehicle: CompanyVehicleItem) => {
    setDeletingVehicleId(vehicle.vehicleId);
    try {
      await deleteCompanyVehicleForCompany({
        companyId,
        vehicleId: vehicle.vehicleId,
      });
      setVehicles((prev) => {
        const base = prev ?? [];
        return base.filter((item) => item.vehicleId !== vehicle.vehicleId);
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[vehicle.vehicleId];
        return next;
      });
      setRouteSelectionByVehicle((prev) => {
        const next = { ...prev };
        delete next[vehicle.vehicleId];
        return next;
      });
      setSelectedVehicleId((current) => (current === vehicle.vehicleId ? null : current));
      setErrorMessage(null);
      showAutoInfo("Arac silindi.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arac silinemedi.";
      setErrorMessage(message);
    } finally {
      setDeletingVehicleId(null);
      setDeleteTargetVehicle(null);
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
      setErrorMessage("Bağlamak için bir rota seçin.");
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
      const message = error instanceof Error ? error.message : "Araç rotaya bağlanamadı.";
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
      const message = error instanceof Error ? error.message : "Araç rota bağlantısı kaldırılamadı.";
      setErrorMessage(message);
    } finally {
      setActionKey(null);
    }
  };

  const selectedVehicleStatusOption = selectedVehicle
    ? VEHICLE_STATUS_OPTIONS.find((option) => option.value === selectedVehicle.status) ?? null
    : null;
  const selectedVehicleDescriptor = selectedVehicle ? getVehicleDescriptor(selectedVehicle) : "";
  const selectedVehicleRouteCount = selectedVehicle ? (routeCountsByVehicleId[selectedVehicle.vehicleId] ?? 0) : 0;
  const metricCards = [
    { label: "Toplam", value: metrics.total, valueClass: "text-slate-900", tone: "slate" as const },
    { label: "Aktif", value: metrics.active, valueClass: "text-emerald-600", tone: "emerald" as const },
    { label: "Bakimda", value: metrics.maintenance, valueClass: "text-amber-600", tone: "amber" as const },
    { label: "Pasif", value: metrics.inactive, valueClass: "text-slate-500", tone: "slate" as const },
    { label: "Rotaya bagli", value: metrics.assignedToRoute, valueClass: "text-blue-600", tone: "blue" as const },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Metric cards ─── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Toplam", value: metrics.total, color: "text-slate-900" },
          { label: "Aktif", value: metrics.active, color: "text-emerald-600" },
          { label: "Bakımda", value: metrics.maintenance, color: "text-amber-600" },
          { label: "Pasif", value: metrics.inactive, color: "text-slate-500" },
          { label: "Rotaya Bağlı", value: metrics.assignedToRoute, color: "text-blue-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {card.label}
            </div>
            <div className={`mt-3 text-4xl font-semibold tracking-tight ${card.color}`}>{card.value}</div>
          </div>
        ))}
        {deleteTargetVehicle ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div
              className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
              style={{ animation: "vehicleValidationCardIn 180ms ease-out both" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                    Silme onayi
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Araci silmek istiyor musun?</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Bu islem secili arac kaydini filodan kaldirir. Geri alma akisi yok.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTargetVehicle(null)}
                  disabled={deletingVehicleId === deleteTargetVehicle.vehicleId}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                  aria-label="Modal kapat"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">{deleteTargetVehicle.plate}</p>
                <p className="mt-1 text-sm text-slate-600">{getVehicleDescriptor(deleteTargetVehicle)}</p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTargetVehicle(null)}
                  disabled={deletingVehicleId === deleteTargetVehicle.vehicleId}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Vazgec
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVehicle(deleteTargetVehicle)}
                  disabled={deletingVehicleId === deleteTargetVehicle.vehicleId}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingVehicleId === deleteTargetVehicle.vehicleId ? (
                    <>
                      <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Siliniyor...
                    </>
                  ) : (
                    "Evet, sil"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── Toast messages ─── */}
      {infoMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-emerald-800">{infoMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-rose-800">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="shrink-0 rounded-full p-1 text-rose-400 transition hover:bg-rose-100 hover:text-rose-600"
            aria-label="Hatayi kapat"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ─── Main split-pane ─── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)]">
        {/* ── Left panel: search + list ── */}
        <div className="space-y-4">
          {/* Search & filter bar */}
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                placeholder="Plaka, marka veya model ara..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <select
              value={vehicleStatusFilter}
              onChange={(e) => setVehicleStatusFilter(e.target.value as "all" | VehicleStatus)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="maintenance">Bakımda</option>
              <option value="inactive">Pasif</option>
            </select>
            <button
              type="button"
              onClick={() => setRefreshNonce((p) => p + 1)}
              className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600"
              title="Yenile"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link href={`/c/${companyId}/live-ops`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900">
              Canlı Operasyon →
            </Link>
            <Link href={`/c/${companyId}/drivers`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900">
              Şoförler →
            </Link>
            <span className="ml-auto rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-slate-500">
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
                  className="w-full overflow-hidden rounded-3xl border border-dashed border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.95)_45%,rgba(240,249,255,0.95))] px-5 py-5 text-left text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <span className="text-base leading-none">+</span> Yeni Araç Ekle
                </button>
              ) : (
                <div className="space-y-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Plaka *</span>
                      <input
                        type="text"
                        value={createPlate}
                        onChange={(e) => {
                          setCreatePlate(normalizePlateInput(e.target.value));
                          setCreateTouched((prev) => ({ ...prev, plate: true }));
                          setCreateServerIssues([]);
                          setErrorMessage(null);
                        }}
                        onBlur={() => setCreateTouched((prev) => ({ ...prev, plate: true }))}
                        placeholder="34ABC123"
                        className={inputClassName}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Marka</span>
                      <input
                        type="text"
                        value={createBrand}
                        onChange={(e) => {
                          setCreateBrand(e.target.value);
                          setCreateServerIssues([]);
                          setErrorMessage(null);
                        }}
                        placeholder="Ford"
                        maxLength={80}
                        className={inputClassName}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Model</span>
                      <input
                        type="text"
                        value={createModel}
                        onChange={(e) => {
                          setCreateModel(e.target.value);
                          setCreateServerIssues([]);
                          setErrorMessage(null);
                        }}
                        placeholder="Transit"
                        maxLength={80}
                        className={inputClassName}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Yıl</span>
                        <input
                          type="number"
                          min={VEHICLE_YEAR_MIN}
                          max={VEHICLE_YEAR_MAX}
                          value={createYear}
                          onChange={(e) => {
                            setCreateYear(e.target.value);
                            setCreateTouched((prev) => ({ ...prev, year: true }));
                            setCreateServerIssues([]);
                            setErrorMessage(null);
                          }}
                          onBlur={() => setCreateTouched((prev) => ({ ...prev, year: true }))}
                          placeholder="2024"
                          className={inputClassName}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kapasite</span>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={createCapacity}
                          onChange={(e) => {
                            setCreateCapacity(e.target.value);
                            setCreateTouched((prev) => ({ ...prev, capacity: true }));
                            setCreateServerIssues([]);
                            setErrorMessage(null);
                          }}
                          onBlur={() => setCreateTouched((prev) => ({ ...prev, capacity: true }))}
                          placeholder="30"
                          className={inputClassName}
                        />
                      </div>
                    </div>
                  </div>
                  <VehicleValidationIssueStack issues={createFeedbackIssues} />
                  {false && showCreateValidation && createValidationIssues.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {createValidationIssues.map((issue) => (
                        <div key={issue}>• {issue}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateVehicle}
                      disabled={createPending}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {createPending ? (
                        <>
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Ekleniyor...
                        </>
                      ) : (
                        "Ekle"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleResetCreateForm(); setShowCreateForm(false); }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
                      className={`group w-full rounded-3xl border px-4 py-4 text-left transition-all ${
                        isSelected
                          ? "border-blue-200 bg-blue-50/80 shadow-md ring-1 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-lg font-semibold tracking-tight text-slate-950">{vehicle.plate}</span>
                          {vehicle.label && (
                            <span className="mt-1 block truncate text-sm text-slate-600">{vehicle.label}</span>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge}`}>
                          {statusOpt?.label ?? "—"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        {vehicle.year && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">{vehicle.year}</span>}
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
        <div className="space-y-4 xl:sticky xl:top-4">
          <div>
            {!selectedVehicle || !selectedVehicleDraft ? (
              <div className="flex min-h-[560px] items-center justify-center rounded-[30px] border border-dashed border-slate-300 bg-white/80 px-8 py-12 text-center shadow-sm">
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
                <div className="flex flex-col gap-4 rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_42%),linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#eef4ff_100%)] p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700/80">Secili arac</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{selectedVehicle.plate}</h2>
                    <p className="mt-2 text-sm text-slate-600">{selectedVehicleDescriptor}</p>
                  </div>
                  {(() => {
                    const so = VEHICLE_STATUS_OPTIONS.find((o) => o.value === selectedVehicle.status);
                    const badge = {
                      active: "border-emerald-200 bg-emerald-50 text-emerald-700",
                      maintenance: "border-amber-200 bg-amber-50 text-amber-700",
                      inactive: "border-slate-200 bg-slate-100 text-slate-600",
                    }[selectedVehicle.status] ?? "border-slate-200 bg-slate-100 text-slate-600";
                    return (
                      <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${badge}`}>
                        {so?.label ?? "—"}
                      </span>
                    );
                  })()}
                  {canMutate ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveVehicle(selectedVehicle.vehicleId)}
                        disabled={savingVehicleId === selectedVehicle.vehicleId || deletingVehicleId === selectedVehicle.vehicleId}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingVehicleId === selectedVehicle.vehicleId ? (
                          <>
                            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Kaydediliyor...
                          </>
                        ) : (
                          "Degisiklikleri kaydet"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteVehicle(selectedVehicle)}
                        disabled={
                          deletingVehicleId === selectedVehicle.vehicleId ||
                          savingVehicleId === selectedVehicle.vehicleId ||
                          selectedVehicleRoutes.length > 0
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingVehicleId === selectedVehicle.vehicleId ? (
                          <>
                            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                            Siliniyor...
                          </>
                        ) : (
                          "Araci sil"
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Edit section */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
                            className={inputClassName}
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
                            className={inputClassName}
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
                            className={inputClassName}
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
                              className={inputClassName}
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
                              className={inputClassName}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status segmented control */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Durum</span>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {VEHICLE_STATUS_OPTIONS.map((opt) => {
                            const isSelected = selectedVehicleDraft.status === opt.value;
                            const activeClass =
                              opt.value === "active"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                : opt.value === "maintenance"
                                  ? "border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                                  : "border-slate-300 bg-slate-100 text-slate-700 ring-1 ring-slate-200";
                            const dotClass =
                              opt.value === "active"
                                ? "bg-emerald-500"
                                : opt.value === "maintenance"
                                  ? "bg-amber-500"
                                  : "bg-slate-500";
                            const helperText =
                              opt.value === "active"
                                ? "Kullanimda"
                                : opt.value === "maintenance"
                                  ? "Serviste"
                                  : "Beklemede";

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateDraft(selectedVehicle, { status: opt.value })}
                                className={`rounded-2xl border px-3 py-3 text-left transition ${
                                  isSelected
                                    ? activeClass
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                                  <span className="text-sm font-semibold">{opt.label}</span>
                                </div>
                                <div className="mt-1 text-xs opacity-80">{helperText}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveVehicle(selectedVehicle.vehicleId)}
                        disabled={savingVehicleId === selectedVehicle.vehicleId || deletingVehicleId === selectedVehicle.vehicleId}
                        className="hidden"
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
                      <button
                        type="button"
                        onClick={() => handleDeleteVehicle(selectedVehicle)}
                        disabled={
                          deletingVehicleId === selectedVehicle.vehicleId ||
                          savingVehicleId === selectedVehicle.vehicleId ||
                          selectedVehicleRoutes.length > 0
                        }
                        className="hidden"
                      >
                        {deletingVehicleId === selectedVehicle.vehicleId ? (
                          <>
                            <span className="block h-3 w-3 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                            Siliniyor...
                          </>
                        ) : (
                          "Araci Sil"
                        )}
                      </button>
                      {selectedVehicleRoutes.length > 0 ? (
                        <p className="w-full text-[11px] font-medium text-amber-600">
                          Bu araci silmeden once rota baglantilarini kaldir.
                        </p>
                      ) : null}
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
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

