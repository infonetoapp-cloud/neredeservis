"use client";

import Link from "next/link";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useMyCompanies } from "@/features/company/use-my-companies";
import { useActivePanelMode } from "@/features/mode/use-active-panel-mode";

export function ActiveCompanySidebarCard() {
  const { status: authStatus } = useAuthSession();
  const { resolvedMode } = useActivePanelMode();
  const activeCompany = useActiveCompanyPreference();
  const companiesQuery = useMyCompanies(authStatus === "signed_in" && resolvedMode === "company");

  if (resolvedMode === "individual") {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Aktif Baglam</div>
        <div className="mt-1 text-sm font-medium text-slate-900">Bireysel Mod</div>
        <div className="mt-2 text-xs leading-5 text-muted">
          Bireysel sofor operasyon gorunumu aktif.
        </div>
      </div>
    );
  }

  const matched = activeCompany
    ? companiesQuery.items.find((item) => item.companyId === activeCompany.companyId)
    : null;
  const companyName = matched?.name ?? activeCompany?.companyName ?? null;
  const statusText = matched
    ? `${matched.role} | ${matched.memberStatus}`
    : companiesQuery.status === "loading"
      ? "Yukleniyor..."
      : activeCompany
        ? "Dogrulama bekleniyor"
        : "Secili company yok";

  return (
    <div className="mt-6 rounded-2xl border border-line bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">Aktif Company</div>
      <div className="mt-1 truncate text-sm font-medium text-slate-900">
        {companyName ?? "Company secimi gerekli"}
      </div>
      <div className="mt-2 text-xs leading-5 text-muted">{statusText}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/mode-select"
          className="inline-flex items-center rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
        >
          Company Sec
        </Link>
        {companiesQuery.status === "error" ? (
          <button
            type="button"
            onClick={() => void companiesQuery.reload()}
            className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            Tekrar Dene
          </button>
        ) : null}
      </div>
    </div>
  );
}
