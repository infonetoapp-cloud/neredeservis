"use client";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { BuildingIcon } from "@/components/shared/app-icons";

export function CompanyActiveContextCard() {
  const { loading, companyName, errorMessage } = useCompanyMembership();
  const displayName = companyName ?? (loading ? "Sirket bilgisi yukleniyor" : "Secili sirket");

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/8 p-3.5" style={{background:'rgba(255,255,255,0.07)'}}>
      <div className="text-[10px] font-semibold tracking-[0.16em] text-white/40 uppercase mb-2">Seçili Şirket</div>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5735A] text-white shadow-[0_4px_12px_rgba(245,115,90,0.40)]">
          <BuildingIcon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-white leading-tight max-w-[180px] truncate">{displayName}</span>
      </div>
      {errorMessage ? (
        <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-300">
          Şirket bilgisi doğrulanamadı.
        </div>
      ) : null}
    </div>
  );
}
