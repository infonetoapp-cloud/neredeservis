"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  assignCompanyDriverToRouteForCompany,
  createCompanyDriverAccountForCompany,
  listCompanyDriversForCompany,
  listCompanyRoutesForCompany,
  listCompanyVehiclesForCompany,
  type CompanyDriverCredentialBundle,
  type CompanyDriverItem,
  type CompanyRouteItem,
  type CompanyVehicleItem,
  unassignCompanyDriverFromRouteForCompany,
} from "@/features/company/company-client";

type Props = {
  companyId: string;
};

type DriverFilter = "all" | "active" | "passive" | "assignment_pending";
const DRIVER_NAME_MAX_LENGTH = 80;

function formatDriverId(driverId: string): string {
  if (driverId.length <= 14) {
    return driverId;
  }
  return `${driverId.slice(0, 6)}...${driverId.slice(-4)}`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Bilgi yok";
  }
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) {
    return "Bilgi yok";
  }
  return new Date(ts).toLocaleString("tr-TR");
}

function readStatusLabel(value: CompanyDriverItem["status"]): string {
  return value === "active" ? "Aktif" : "Pasif";
}

function formatCredentialCopyText(credentials: CompanyDriverCredentialBundle): string {
  return [
    "NeredeServis Surucu Giris Bilgileri",
    `Sofor: ${credentials.name}`,
    `Giris e-postasi: ${credentials.loginEmail}`,
    `Gecici sifre: ${credentials.temporaryPassword}`,
    "Not: Bu hesap sadece mobil surucu girisi icindir.",
    "Not: Surucu ilk giriste sifresini degistirmelidir.",
  ].join("\n");
}

function normalizePlateInput(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isSimpleEmailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function CompanyDriversList({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole } = useCompanyMembership();
  const [drivers, setDrivers] = useState<CompanyDriverItem[] | null>(null);
  const [routes, setRoutes] = useState<CompanyRouteItem[] | null>(null);
  const [vehicles, setVehicles] = useState<CompanyVehicleItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<DriverFilter>("all");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [routeSelectionByDriver, setRouteSelectionByDriver] = useState<Record<string, string>>({});
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [createName, setCreateName] = useState<string>("");
  const [createPhone, setCreatePhone] = useState<string>("");
  const [createPlate, setCreatePlate] = useState<string>("");
  const [createLoginEmail, setCreateLoginEmail] = useState<string>("");
  const [createTemporaryPassword, setCreateTemporaryPassword] = useState<string>("");
  const [showCreateValidation, setShowCreateValidation] = useState<boolean>(false);
  const [copyInfoMessage, setCopyInfoMessage] = useState<string | null>(null);
  const [latestCredentials, setLatestCredentials] = useState<CompanyDriverCredentialBundle | null>(null);
  const [showAdvancedCreate, setShowAdvancedCreate] = useState<boolean>(false);

  const canMutate = memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";
  const canCreateDriverAccount =
    memberRole === "owner" || memberRole === "admin" || memberRole === "dispatcher";
  const normalizedCreateName = createName.trim();
  const normalizedCreateLoginEmail = createLoginEmail.trim();
  const normalizedCreateTemporaryPassword = createTemporaryPassword.trim();
  const createValidationIssues: string[] = [];
  if (normalizedCreateName.length < 2) {
    createValidationIssues.push("Sofor adi en az 2 karakter olmali.");
  }
  if (normalizedCreateName.length > DRIVER_NAME_MAX_LENGTH) {
    createValidationIssues.push("Sofor adi en fazla 80 karakter olabilir.");
  }
  if (createPhone.trim().length > 0 && createPhone.trim().length < 7) {
    createValidationIssues.push("Telefon numarasi en az 7 karakter olmali.");
  }
  if (normalizedCreateLoginEmail.length > 0 && !isSimpleEmailValid(normalizedCreateLoginEmail)) {
    createValidationIssues.push("Giris e-postasi gecerli formatta olmali.");
  }
  if (
    normalizedCreateTemporaryPassword.length > 0 &&
    normalizedCreateTemporaryPassword.length < 8
  ) {
    createValidationIssues.push("Gecici sifre en az 8 karakter olmali.");
  }
  const canCreateDriverNow =
    canCreateDriverAccount && createValidationIssues.length === 0 && actionKey !== "create_driver_account";

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
        setDrivers(nextDrivers);
        setRoutes(nextRoutes);
        setVehicles(nextVehicles);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Sofor listesi alinamadi.";
        setErrorMessage(message);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, refreshNonce, status]);

  const metrics = useMemo(() => {
    const source = drivers ?? [];
    return {
      total: source.length,
      active: source.filter((item) => item.status === "active").length,
      passive: source.filter((item) => item.status === "passive").length,
      assignmentPending: source.filter((item) => item.assignmentStatus === "unassigned").length,
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
      const fields = [
        driver.name,
        driver.driverId,
        driver.plateMasked,
        driver.phoneMasked ?? "",
        ...driver.assignedRoutes.map((item) => item.routeName),
      ]
        .join(" ")
        .toLocaleLowerCase("tr");
      return fields.includes(query);
    });
  }, [drivers, filter, searchQuery]);

  useEffect(() => {
    if (!drivers || drivers.length === 0) {
      setSelectedDriverId(null);
      return;
    }
    if (selectedDriverId && drivers.some((item) => item.driverId === selectedDriverId)) {
      return;
    }
    setSelectedDriverId(drivers[0]?.driverId ?? null);
  }, [drivers, selectedDriverId]);

  const selectedDriver = useMemo(
    () => (drivers ?? []).find((item) => item.driverId === selectedDriverId) ?? null,
    [drivers, selectedDriverId],
  );

  const assignableRoutesForSelectedDriver = useMemo(() => {
    if (!selectedDriver || !routes) {
      return [];
    }
    const assignedIds = new Set(selectedDriver.assignedRoutes.map((item) => item.routeId));
    return routes.filter((route) => !route.isArchived && !assignedIds.has(route.routeId));
  }, [routes, selectedDriver]);

  const selectedDriverVehicles = useMemo(() => {
    if (!selectedDriver || !routes || !vehicles) {
      return [];
    }
    const assignedRouteIds = new Set(selectedDriver.assignedRoutes.map((item) => item.routeId));
    const vehicleIds = new Set(
      routes
        .filter((route) => !route.isArchived && assignedRouteIds.has(route.routeId) && route.vehicleId)
        .map((route) => route.vehicleId as string),
    );
    if (vehicleIds.size === 0) {
      return [];
    }
    return vehicles.filter((vehicle) => vehicleIds.has(vehicle.vehicleId));
  }, [routes, selectedDriver, vehicles]);

  useEffect(() => {
    if (!selectedDriver) {
      return;
    }
    const currentSelectedRouteId = routeSelectionByDriver[selectedDriver.driverId];
    if (currentSelectedRouteId) {
      return;
    }
    const firstRouteId = assignableRoutesForSelectedDriver[0]?.routeId;
    if (!firstRouteId) {
      return;
    }
    setRouteSelectionByDriver((prev) => ({
      ...prev,
      [selectedDriver.driverId]: firstRouteId,
    }));
  }, [assignableRoutesForSelectedDriver, routeSelectionByDriver, selectedDriver]);

  const handleAssignSelectedDriver = async () => {
    if (!selectedDriver || !canMutate) {
      return;
    }
    const routeId = routeSelectionByDriver[selectedDriver.driverId];
    if (!routeId) {
      setErrorMessage("Atama icin bir rota secin.");
      return;
    }

    setActionKey(`assign:${selectedDriver.driverId}`);
    try {
      await assignCompanyDriverToRouteForCompany({
        companyId,
        driverId: selectedDriver.driverId,
        routeId,
      });
      setInfoMessage("Sofor rotaya atandi.");
      setErrorMessage(null);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Atama yapilamadi.");
    } finally {
      setActionKey(null);
    }
  };

  const handleUnassignSelectedDriver = async (routeId: string) => {
    if (!selectedDriver || !canMutate) {
      return;
    }

    setActionKey(`unassign:${selectedDriver.driverId}:${routeId}`);
    try {
      await unassignCompanyDriverFromRouteForCompany({
        companyId,
        driverId: selectedDriver.driverId,
        routeId,
      });
      setInfoMessage("Sofor rota atamasindan cikarildi.");
      setErrorMessage(null);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Atama kaldirilamadi.");
    } finally {
      setActionKey(null);
    }
  };

  const handleCreateDriverAccount = async () => {
    if (!canCreateDriverAccount) {
      return;
    }
    if (createValidationIssues.length > 0) {
      setShowCreateValidation(true);
      setErrorMessage("Formda eksik veya gecersiz alanlar var.");
      return;
    }

    setActionKey("create_driver_account");
    setCopyInfoMessage(null);
    try {
      const credentials = await createCompanyDriverAccountForCompany({
        companyId,
        name: normalizedCreateName,
        phone: createPhone || undefined,
        plate: createPlate.trim().length > 0 ? normalizePlateInput(createPlate) : undefined,
        loginEmail: normalizedCreateLoginEmail || undefined,
        temporaryPassword: normalizedCreateTemporaryPassword || undefined,
      });
      setLatestCredentials(credentials);
      setCreateName("");
      setCreatePhone("");
      setCreatePlate("");
      setCreateLoginEmail("");
      setCreateTemporaryPassword("");
      setShowCreateValidation(false);
      setInfoMessage("Sofor hesabi olusturuldu. Giris bilgilerini kopyalayip paylasabilirsin.");
      setErrorMessage(null);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sofor hesabi olusturulamadi.");
    } finally {
      setActionKey(null);
    }
  };

  const handleResetCreateForm = () => {
    setCreateName("");
    setCreatePhone("");
    setCreatePlate("");
    setCreateLoginEmail("");
    setCreateTemporaryPassword("");
    setShowCreateValidation(false);
    setCopyInfoMessage(null);
  };

  const copyToClipboard = async (value: string, successMessage: string) => {
    if (!value.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopyInfoMessage(successMessage);
    } catch {
      setCopyInfoMessage("Kopyalama basarisiz. Tarayici kopyalama iznini kontrol et.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Toplam sofor</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{metrics.total}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Aktif</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-700">{metrics.active}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Pasif</div>
          <div className="mt-2 text-2xl font-semibold text-slate-700">{metrics.passive}</div>
        </article>
        <article className="glass-panel rounded-2xl p-3">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Atama bekleyen
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-700">{metrics.assignmentPending}</div>
        </article>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Sofor giris hesabi olustur</div>
            <div className="mt-1 text-xs text-muted">
              Olusan bilgiler sadece mobil surucu uygulamasi icin gecerlidir.
            </div>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
            Sadece mobil giris
          </span>
        </div>

        {canCreateDriverAccount ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#d8e5f3] bg-[#f6f9ff] px-3 py-2 text-[11px] text-[#4e637d]">
              Sadece sofor adini gir, sistem e-posta ve sifre otomatik olusturur. Detay eklemek icin &quot;Detayli&quot; secenegini ac.
            </div>

            <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Sofor adi</span>
                <input
                  type="text"
                  value={createName}
                  onChange={(event) => {
                    setCreateName(event.target.value);
                    setShowCreateValidation(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }
                    event.preventDefault();
                    void handleCreateDriverAccount();
                  }}
                  placeholder="Ornek: Ahmet Yilmaz"
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowAdvancedCreate((prev) => !prev)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                    showAdvancedCreate
                      ? "border-[#7ac7b6] bg-[#e6f9f4] text-[#0f5a4c]"
                      : "border-line bg-white text-slate-600"
                  }`}
                >
                  {showAdvancedCreate ? "Basit mod" : "Detayli"}
                </button>
              </div>
            </div>

            {showAdvancedCreate ? (
              <div className="grid gap-2 lg:grid-cols-2">
                <label className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-700">Telefon (opsiyonel)</span>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(event) => {
                      setCreatePhone(event.target.value);
                      setShowCreateValidation(false);
                    }}
                    placeholder="+90 5xx xxx xx xx"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-700">Plaka (opsiyonel)</span>
                  <input
                    type="text"
                    value={createPlate}
                    onChange={(event) => {
                      setCreatePlate(normalizePlateInput(event.target.value));
                      setShowCreateValidation(false);
                    }}
                    placeholder="34ABC123"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-700">Giris e-postasi (opsiyonel)</span>
                  <input
                    type="email"
                    value={createLoginEmail}
                    onChange={(event) => {
                      setCreateLoginEmail(event.target.value.trim());
                      setShowCreateValidation(false);
                    }}
                    placeholder="Bos birakirsan sistem olusturur"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-700">Gecici sifre (opsiyonel)</span>
                  <input
                    type="text"
                    value={createTemporaryPassword}
                    onChange={(event) => {
                      setCreateTemporaryPassword(event.target.value.trim());
                      setShowCreateValidation(false);
                    }}
                    placeholder="Bos birakirsan sistem guclu sifre olusturur"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                  />
                </label>
              </div>
            ) : null}

            {showCreateValidation && createValidationIssues.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="font-semibold">Hesap olusturmadan once tamamlanmasi gerekenler:</div>
                <div className="mt-1 space-y-1">
                  {createValidationIssues.map((issue) => (
                    <div key={issue}>- {issue}</div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreateDriverAccount}
                disabled={!canCreateDriverNow}
                className="glass-button-primary inline-flex rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionKey === "create_driver_account" ? "Hesap olusturuluyor..." : "Hizli olustur"}
              </button>
              <button
                type="button"
                onClick={handleResetCreateForm}
                className="glass-button inline-flex rounded-xl px-3 py-2 text-xs font-semibold"
              >
                Formu temizle
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
            Bu alanda hesap olusturma yetkisi owner/admin/dispatcher rolde aciktir.
          </div>
        )}

        {latestCredentials ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="mb-2 text-xs font-semibold text-emerald-900">Son olusturulan sofor giris bilgileri</div>
            <div className="space-y-1 text-xs text-emerald-900">
              <div>Sofor: {latestCredentials.name}</div>
              <div>Sofor kodu: {latestCredentials.driverId}</div>
              <div>Giris e-postasi: {latestCredentials.loginEmail}</div>
              <div>Gecici sifre: {latestCredentials.temporaryPassword}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(latestCredentials.loginEmail, "Giris e-postasi panoya kopyalandi.")
                }
                className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                E-postayi kopyala
              </button>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    latestCredentials.temporaryPassword,
                    "Gecici sifre panoya kopyalandi.",
                  )
                }
                className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                Sifreyi kopyala
              </button>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    formatCredentialCopyText(latestCredentials),
                    "Tum giris bilgileri panoya kopyalandi.",
                  )
                }
                  className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  Tumunu kopyala
                </button>
              </div>
              <div className="mt-2 text-[11px] text-emerald-900">
                Not: Bu bilgiler sadece yetkili kisilerle paylasilmali.
              </div>
            {copyInfoMessage ? <div className="mt-2 text-xs text-emerald-800">{copyInfoMessage}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Sofor operasyon merkezi</div>
          <button
            type="button"
            onClick={() => setRefreshNonce((prev) => prev + 1)}
            className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            Yenile
          </button>
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Sofor adi, telefon, plaka veya rota ile ara"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          />
          <div className="glass-chip inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            {filteredDrivers.length}/{drivers?.length ?? 0} gorunuyor
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {([
            { key: "all", label: "Tum soforler" },
            { key: "active", label: "Aktif" },
            { key: "passive", label: "Pasif" },
            { key: "assignment_pending", label: "Atama bekleyen" },
          ] as Array<{ key: DriverFilter; label: string }>).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                filter === option.key
                  ? "border-[#7ac7b6] bg-[#e6f9f4] text-[#0f5a4c]"
                  : "border-line bg-white text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={`/c/${companyId}/routes`}
            className="glass-button inline-flex items-center rounded-xl px-3 py-1.5 font-semibold"
          >
            Rotalara git
          </Link>
          <Link
            href={`/c/${companyId}/vehicles`}
            className="glass-button inline-flex items-center rounded-xl px-3 py-1.5 font-semibold"
          >
            Araclara git
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

        {!drivers || !routes ? (
          <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
            Sofor ve rota bilgileri yukleniyor...
          </div>
        ) : drivers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
            Bu sirkete bagli sofor kaydi yok.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              {filteredDrivers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
                  Arama/filtre sonucuna uygun sofor bulunamadi.
                </div>
              ) : (
                filteredDrivers.map((driver) => (
                  <button
                    key={driver.driverId}
                    type="button"
                    onClick={() => setSelectedDriverId(driver.driverId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedDriverId === driver.driverId
                        ? "border-[#7ac7b6] bg-[#f2fcf9]"
                        : "border-line bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{driver.name}</div>
                      <div
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          driver.status === "active"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        {readStatusLabel(driver.status)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted" title={driver.driverId}>
                      Sofor kodu: {formatDriverId(driver.driverId)}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {driver.phoneMasked ? `Tel: ${driver.phoneMasked}` : "Tel: Bilgi yok"} | Plaka:{" "}
                      {driver.plateMasked}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600">
                      Atama:{" "}
                      {driver.assignedRoutes.length > 0
                        ? `${driver.assignedRoutes.length} rota`
                        : "Atama bekliyor"}
                    </div>
                  </button>
                ))
              )}
            </div>

            <aside className="glass-panel-muted rounded-2xl p-3">
              {!selectedDriver ? (
                <div className="rounded-xl border border-dashed border-line bg-white p-3 text-xs text-muted">
                  Detay icin bir sofor secin.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{selectedDriver.name}</div>
                    <div className="mt-1 text-xs text-muted">Sofor kodu: {selectedDriver.driverId}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Son gorulme: {formatDateTime(selectedDriver.lastSeenAt)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-700">Atanmis rotalar</div>
                    {selectedDriver.assignedRoutes.length === 0 ? (
                      <div className="text-xs text-muted">Bu sofor icin aktif rota atamasi yok.</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDriver.assignedRoutes.map((route) => (
                          <div
                            key={route.routeId}
                            className="flex items-center justify-between gap-2 rounded-xl border border-line px-2 py-1.5"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{route.routeName}</div>
                              <div className="text-[11px] text-muted">
                                Saat: {route.scheduledTime ?? "Bilgi yok"}
                              </div>
                            </div>
                            {canMutate ? (
                              <button
                                type="button"
                                onClick={() => handleUnassignSelectedDriver(route.routeId)}
                                disabled={
                                  actionKey === `unassign:${selectedDriver.driverId}:${route.routeId}`
                                }
                                className="glass-button rounded-lg px-2 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionKey === `unassign:${selectedDriver.driverId}:${route.routeId}`
                                  ? "Kaldiriliyor..."
                                  : "Kaldir"}
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-700">Bagli araclar</div>
                    {selectedDriverVehicles.length === 0 ? (
                      <div className="text-xs text-muted">Bu soforun rotalarina bagli arac yok.</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDriverVehicles.map((vehicle) => (
                          <div
                            key={vehicle.vehicleId}
                            className="flex items-center justify-between gap-2 rounded-xl border border-line px-2 py-1.5"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{vehicle.plate}</div>
                              <div className="text-[11px] text-muted">
                                {vehicle.label ?? "Etiket yok"}{vehicle.capacity ? ` · ${vehicle.capacity} kisi` : ""}
                              </div>
                            </div>
                            <div
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                vehicle.isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-100 text-slate-500"
                              }`}
                            >
                              {vehicle.isActive ? "Aktif" : "Pasif"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-2 text-xs font-semibold text-slate-700">Rota ata</div>
                    {canMutate ? (
                      <>
                        <select
                          value={routeSelectionByDriver[selectedDriver.driverId] ?? ""}
                          onChange={(event) =>
                            setRouteSelectionByDriver((prev) => ({
                              ...prev,
                              [selectedDriver.driverId]: event.target.value,
                            }))
                          }
                          className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
                        >
                          {assignableRoutesForSelectedDriver.length === 0 ? (
                            <option value="">Uygun rota yok</option>
                          ) : null}
                          {assignableRoutesForSelectedDriver.map((route) => (
                            <option key={route.routeId} value={route.routeId}>
                              {route.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAssignSelectedDriver}
                          disabled={
                            assignableRoutesForSelectedDriver.length === 0 ||
                            !routeSelectionByDriver[selectedDriver.driverId] ||
                            actionKey === `assign:${selectedDriver.driverId}`
                          }
                          className="glass-button-primary mt-2 inline-flex rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionKey === `assign:${selectedDriver.driverId}`
                            ? "Ataniyor..."
                            : "Secili rotaya ata"}
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-muted">
                        Rota atama aksiyonlari bu rolde kapali (salt okuma).
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
