"use client";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import { DashboardIcon } from "@/components/shared/app-icons";

export function CompanyDashboardHero() {
  const { companyName, loading } = useCompanyMembership();
  const displayCompany = companyName ?? (loading ? "Şirket bilgisi yukleniyor" : "Secili şirket");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_5%,rgba(13,164,164,0.12),transparent_40%),radial-gradient(circle_at_95%_20%,rgba(59,130,246,0.10),transparent_38%)]" />
      <div className="relative">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#6f7884] uppercase">Operasyon Ozeti</p>
        <h1 className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e6e6] bg-[#eef6f6] text-[#1d7f81]">
            <DashboardIcon className="h-4.5 w-4.5" />
          </span>
          Operasyon merkezi
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6874]">
          Bu ekran tek bakista rota, sefer, risk ve canlı konum ozetini verir.
        </p>
        <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[#d9e8e8] bg-white/80 px-3 py-2 text-xs text-[#51606f]">
          <span className="font-semibold text-slate-900">Aktif şirket:</span>
          <span className="rounded-full border border-[#cfe3df] bg-[#edf7f5] px-2 py-0.5 font-semibold text-[#245e53]">
            {displayCompany}
          </span>
        </div>
      </div>
    </div>
  );
}

