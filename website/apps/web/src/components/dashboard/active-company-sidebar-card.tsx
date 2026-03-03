"use client";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useMyCompanies } from "@/features/company/use-my-companies";

export function ActiveCompanySidebarCard() {
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companiesQuery = useMyCompanies(authStatus === "signed_in");

  const matched = activeCompany
    ? companiesQuery.items.find((item) => item.companyId === activeCompany.companyId)
    : null;
  const companyName = matched?.name ?? activeCompany?.companyName ?? null;
  const roleLabel = matched?.role === "owner"
    ? "Sahip"
    : matched?.role === "admin"
      ? "Y\u00f6netici"
      : matched?.role === "dispatcher"
        ? "Dispeçer"
        : matched?.role === "viewer"
          ? "Gözlemci"
          : matched?.role ?? null;

  return (
    <Link
      href="/mode-select"
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-slate-50"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Building2 className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-slate-800">
          {companyName ?? "Şirket seçilmedi"}
        </div>
        <div className="text-[11px] text-slate-500">
          {companiesQuery.status === "loading"
            ? "Yükleniyor..."
            : roleLabel
              ? roleLabel
              : "Şirket seç"}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-500" />
    </Link>
  );
}
