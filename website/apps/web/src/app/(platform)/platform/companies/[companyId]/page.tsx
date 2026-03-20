"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  platformGetCompanyDetail,
  platformResetOwnerPassword,
  platformSetCompanyStatus,
  platformSetVehicleLimit,
} from "@/features/platform/platform-callables";
import type {
  PlatformCompanyDetail,
  PlatformCompanyMember,
  PlatformCompanyVehicle,
  PlatformCompanyRoute,
  PlatformCompanyStatus,
} from "@/features/platform/platform-types";

/* ---------- Sub-components ---------- */

function StatusBadge({ status }: { status: PlatformCompanyStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
      Askiya Alinmis
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function VehicleLimitCard({
  vehicleCount,
  vehicleLimit,
  onUpdateLimit,
}: {
  vehicleCount: number;
  vehicleLimit: number;
  onUpdateLimit: (limit: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(vehicleLimit);
  const pct = vehicleLimit > 0 ? Math.min((vehicleCount / vehicleLimit) * 100, 100) : 0;
  const isNearLimit = pct >= 80;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        Arac Limiti
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full transition-all ${
              isNearLimit ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={`text-sm font-bold ${isNearLimit ? "text-amber-600" : "text-slate-900"}`}
        >
          {vehicleCount}/{vehicleLimit}
        </span>
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={vehicleCount}
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
            className="w-20 rounded-lg border border-line px-2 py-1 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          />
          <button
            onClick={() => {
              onUpdateLimit(draft);
              setEditing(false);
            }}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition"
          >
            Kaydet
          </button>
          <button
            onClick={() => {
              setDraft(vehicleLimit);
              setEditing(false);
            }}
            className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            Iptal
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
        >
          Limiti Degistir
        </button>
      )}
    </div>
  );
}

function MembersTable({ members }: { members: PlatformCompanyMember[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="border-b border-line bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Uyeler ({members.length})
        </h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-slate-50/50">
            <th className="px-4 py-2.5 font-medium text-slate-600">Ad</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">E-posta</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Rol</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Durum</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Katilim</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {members.map((m) => (
            <tr key={m.uid} className="hover:bg-slate-50 transition">
              <td className="px-4 py-2.5 font-medium text-slate-900">
                {m.displayName ?? "-"}
              </td>
              <td className="px-4 py-2.5 text-muted">{m.email}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {m.role}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {m.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-muted">
                {new Date(m.joinedAt).toLocaleDateString("tr-TR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VehiclesTable({ vehicles }: { vehicles: PlatformCompanyVehicle[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="border-b border-line bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Araclar ({vehicles.length})
        </h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-slate-50/50">
            <th className="px-4 py-2.5 font-medium text-slate-600">Plaka</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Marka</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Model</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Kapasite</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {vehicles.map((v) => (
            <tr key={v.id} className="hover:bg-slate-50 transition">
              <td className="px-4 py-2.5 font-mono font-medium text-slate-900">{v.plate}</td>
              <td className="px-4 py-2.5 text-slate-700">{v.brand ?? "-"}</td>
              <td className="px-4 py-2.5 text-slate-700">{v.model ?? "-"}</td>
              <td className="px-4 py-2.5 text-slate-700">{v.capacity ?? "-"}</td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    v.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {v.status === "active" ? "Aktif" : "Pasif"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoutesTable({ routes }: { routes: PlatformCompanyRoute[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="border-b border-line bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Rotalar ({routes.length})
        </h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-slate-50/50">
            <th className="px-4 py-2.5 font-medium text-slate-600">Rota Adi</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Durak</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Yolcu</th>
            <th className="px-4 py-2.5 font-medium text-slate-600">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {routes.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50 transition">
              <td className="px-4 py-2.5 font-medium text-slate-900">{r.name}</td>
              <td className="px-4 py-2.5 text-slate-700">{r.stopCount}</td>
              <td className="px-4 py-2.5 text-slate-700">{r.passengerCount}</td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.status === "active" ? "Aktif" : "Taslak"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function PlatformCompanyDetailPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [companyData, setCompanyData] = useState<PlatformCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetCopied, setResetCopied] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await platformGetCompanyDetail(companyId);
      setCompanyData(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sirket detayi yuklenirken hata olustu.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-6 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/platform/companies" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">← Sirketlere Don</Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        <button onClick={() => void fetchDetail()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Tekrar Dene</button>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="space-y-4">
        <Link
          href="/platform/companies"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Sirketlere Don
        </Link>
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <div className="text-sm text-muted">
            Sirket bulunamadi: <code className="font-mono text-slate-700">{companyId}</code>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleStatus = async () => {
    const newStatus = companyData.status === "active" ? "suspended" : "active";
    try {
      await platformSetCompanyStatus(companyData.id, newStatus);
      setCompanyData((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Durum degistirme hatasi.");
    }
  };

  const handleUpdateVehicleLimit = async (newLimit: number) => {
    try {
      await platformSetVehicleLimit(companyData.id, newLimit);
      setCompanyData((prev) => (prev ? { ...prev, vehicleLimit: newLimit } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Limit guncelleme hatasi.");
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    setResetLink(null);
    setResetCopied(false);
    try {
      const result = await platformResetOwnerPassword(companyData.id);
      setResetLink(result.loginUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sifre kurulum bildirimi gonderilemedi.");
    } finally {
      setResetting(false);
    }
  };

  const handleCopyResetLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
      setResetCopied(true);
      setTimeout(() => setResetCopied(false), 2500);
    } catch {
      // clipboard izni yoksa sessizce geç
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/platform/companies"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Sirketler
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-900">{companyData.name}</span>
          <StatusBadge status={companyData.status} />
        </div>

        <button
          onClick={handleToggleStatus}
          className={`rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition ${
            companyData.status === "active"
              ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
          }`}
        >
          {companyData.status === "active" ? "Askiya Al" : "Aktif Et"}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoCard label="Yetkili E-posta" value={companyData.ownerEmail} />
        <InfoCard label="Uye Sayisi" value={companyData.memberCount} />
        <InfoCard label="Rota Sayisi" value={companyData.routeCount} />
        <VehicleLimitCard
          vehicleCount={companyData.vehicleCount}
          vehicleLimit={companyData.vehicleLimit}
          onUpdateLimit={handleUpdateVehicleLimit}
        />
      </div>

      {/* Şifre Yenile */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Giris Linki Yenile</div>
            <div className="mt-0.5 text-xs text-muted">
              Sirket sahibine yeni bir sifre kurulum e-postasi gonderir.
            </div>
          </div>
          <button
            onClick={handleResetPassword}
            disabled={resetting}
            className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            {resetting ? "Gonderiliyor..." : "Yeni Sifre Kurulum Maili Gonder"}
          </button>
        </div>

        {resetLink ? (
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="text-xs font-medium text-emerald-700 mb-1">Bildirim Gonderildi</div>
              <div className="text-xs text-emerald-900">
                Yetkili kullanici maildeki link ile sifresini kurabilir.
              </div>
              <div className="mt-2 break-all font-mono text-xs text-emerald-900">{resetLink}</div>
            </div>
            <button
              onClick={handleCopyResetLink}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              {resetCopied ? "Kopyalandi!" : "Giris URL Kopyala"}
            </button>
          </div>
        ) : null}
      </div>

      {/* Company Details */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Sirket Bilgileri</h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Sirket ID</dt>
            <dd className="font-mono text-sm text-slate-900">{companyData.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Owner UID</dt>
            <dd className="font-mono text-sm text-slate-900">
              {companyData.ownerUid ?? "Henuz atanmadi"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Olusturulma Tarihi</dt>
            <dd className="text-sm text-slate-900">
              {new Date(companyData.createdAt).toLocaleString("tr-TR")}
            </dd>
          </div>
        </dl>
      </div>

      {/* Tables */}
      <MembersTable members={companyData.members} />
      <VehiclesTable vehicles={companyData.vehicles} />
      <RoutesTable routes={companyData.routes} />
    </div>
  );
}
