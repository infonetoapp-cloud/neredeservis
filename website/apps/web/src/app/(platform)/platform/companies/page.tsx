"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { platformListCompanies } from "@/features/platform/platform-callables";
import type { PlatformCompanySummary, PlatformCompanyStatus } from "@/features/platform/platform-types";

type StatusFilter = "all" | PlatformCompanyStatus;

function StatusBadge({ status }: { status: PlatformCompanyStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
      Askiya Alinmis
    </span>
  );
}

function VehicleLimitBar({ count, limit }: { count: number; limit: number }) {
  const pct = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;
  const isNearLimit = pct >= 80;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full transition-all ${
            isNearLimit ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isNearLimit ? "text-amber-600" : "text-slate-600"}`}>
        {count}/{limit}
      </span>
    </div>
  );
}

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<PlatformCompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await platformListCompanies();
      setCompanies(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sirketler yuklenirken hata olustu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  const filtered = companies.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.status === "active").length;
  const totalVehicles = companies.reduce((sum, c) => sum + c.vehicleCount, 0);
  const totalMembers = companies.reduce((sum, c) => sum + c.memberCount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-6 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
          <div className="mx-auto h-4 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <button
          onClick={() => void fetchCompanies()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Toplam Sirket
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalCompanies}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Aktif Sirket
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{activeCompanies}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Toplam Arac
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalVehicles}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Toplam Uye
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalMembers}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Sirket ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />

        <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1 shadow-sm">
          {(["all", "active", "suspended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "all" ? "Tumu" : f === "active" ? "Aktif" : "Askida"}
            </button>
          ))}
        </div>

        <Link
          href="/platform/companies/new"
          className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition"
        >
          + Yeni Sirket
        </Link>
      </div>

      {/* Company Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-700">Sirket Adi</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Yetkili E-posta</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Durum</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Arac (Kullanilan/Limit)</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Uye</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Rota</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Olusturulma</th>
              <th className="px-4 py-3 font-semibold text-slate-700" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((company) => (
              <tr key={company.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-900">{company.name}</td>
                <td className="px-4 py-3 text-muted">{company.ownerEmail}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={company.status} />
                </td>
                <td className="px-4 py-3">
                  <VehicleLimitBar count={company.vehicleCount} limit={company.vehicleLimit} />
                </td>
                <td className="px-4 py-3 text-slate-700">{company.memberCount}</td>
                <td className="px-4 py-3 text-slate-700">{company.routeCount}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(company.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/platform/companies/${company.id}`}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                  >
                    Detay
                  </Link>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                  Aramanizla eslesen sirket bulunamadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
