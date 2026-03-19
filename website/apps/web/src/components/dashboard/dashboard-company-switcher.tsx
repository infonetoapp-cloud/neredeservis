"use client";

import { useState } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  writeActiveCompanyPreference,
  type ActiveCompanyPreference,
} from "@/features/company/company-preferences";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useMyCompanies } from "@/features/company/use-my-companies";

export function DashboardCompanySwitcher() {
  const [open, setOpen] = useState(false);
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companiesQuery = useMyCompanies(authStatus === "signed_in");

  const isLoading = companiesQuery.status === "loading";
  const isError = companiesQuery.status === "error";
  const hasCompanies = companiesQuery.items.length > 0;

  const applyCompany = (company: ActiveCompanyPreference) => {
    writeActiveCompanyPreference(company);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
      >
        <span>Firma Degistir</span>
        <span className={`text-[10px] text-muted transition ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-line bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold tracking-wide text-slate-900 uppercase">
                Company Context
              </div>
              <div className="text-[11px] text-muted">
                Aktif firmayi sec. Drivers/Routes/Live Ops gorunumu buna göre çalışır.
              </div>
            </div>
            <button
              type="button"
              onClick={() => void companiesQuery.reload()}
              disabled={isLoading}
              className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Yenile
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-2 py-1">
              <div className="h-10 animate-pulse rounded-xl border border-line bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl border border-line bg-slate-100" />
            </div>
          ) : isError ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                Firma listesi yuklenemedi. Tekrar dene.
              </div>
            </div>
          ) : !hasCompanies ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Bu hesapta firma uyeligi bulunamadi. Firma secim ekranindan firma oluştur.
            </div>
          ) : (
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {companiesQuery.items.map((company) => {
                const selected = activeCompany?.companyId === company.companyId;
                return (
                  <button
                    key={company.companyId}
                    type="button"
                    onClick={() =>
                      applyCompany({
                        companyId: company.companyId,
                        companyName: company.name,
                      })
                    }
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-blue-300 bg-blue-50"
                        : "border-line bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {company.name}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-muted">
                          {company.role} | {company.memberStatus}
                        </div>
                      </div>
                      {selected ? (
                        <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          Aktif
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
            <a
              href="/dashboard"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Firma secim ekranina git
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

