"use client";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { BuildingIcon } from "@/components/shared/app-icons";

export function CompanyActiveContextCard() {
  const { loading, companyName, errorMessage } = useCompanyMembership();
  const displayName = companyName ?? (loading ? "Şirket bilgisi yükleniyor" : "Seçili Şirket");

  return (
    <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F67366] to-[#E85D50] text-white shadow-sm">
          <BuildingIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Şirket</div>
          <span className="block max-w-[180px] truncate text-sm font-semibold leading-tight text-slate-800">{displayName}</span>
        </div>
      </div>
      {errorMessage ? (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
          Şirket bilgisi doğrulanamadı.
        </div>
      ) : null}
    </div>
  );
}

