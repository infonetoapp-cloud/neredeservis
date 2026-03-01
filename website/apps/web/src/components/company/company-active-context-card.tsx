"use client";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { BuildingIcon } from "@/components/shared/app-icons";

export function CompanyActiveContextCard() {
  const { loading, companyName, errorMessage } = useCompanyMembership();
  const displayName = companyName ?? (loading ? "Sirket bilgisi yukleniyor" : "Secili sirket");

  return (
    <div className="mb-4 rounded-2xl border border-[#d8e6e6] bg-[linear-gradient(145deg,#f0f8f8_0%,#f8fbfd_55%,#ffffff_100%)] p-3">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-[#75808d] uppercase">Secili Sirket</div>
      <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#cfe0df] bg-white text-[#0f9ea0]">
          <BuildingIcon className="h-4 w-4" />
        </span>
        <span className="max-w-[190px] truncate">{displayName}</span>
      </div>
      {errorMessage ? (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
          Sirket bilgisi gecici olarak dogrulanamadi.
        </div>
      ) : null}
    </div>
  );
}
