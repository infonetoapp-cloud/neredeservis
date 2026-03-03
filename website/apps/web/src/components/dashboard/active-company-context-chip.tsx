"use client";

import Link from "next/link";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useMyCompanies } from "@/features/company/use-my-companies";

function statusLabel(memberStatus: "active" | "invited" | "suspended") {
  switch (memberStatus) {
    case "active":
      return "active";
    case "invited":
      return "invited";
    case "suspended":
      return "suspended";
    default:
      return memberStatus;
  }
}

export function ActiveCompanyContextChip() {
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companiesQuery = useMyCompanies(authStatus === "signed_in");

  if (!activeCompany) {
    return (
      <Link
        href="/mode-select"
        className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
      >
        Firma secimi gerekli
      </Link>
    );
  }

  const matched = companiesQuery.items.find((item) => item.companyId === activeCompany.companyId);
  const title = matched?.name ?? activeCompany.companyName;
  const subtitle = matched
    ? `${matched.role} | ${statusLabel(matched.memberStatus)}`
    : companiesQuery.status === "loading"
      ? "Company baglami dogrulaniyor..."
      : "Local company secimi (sync bekliyor)";

  const toneClass =
    matched && matched.memberStatus === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : matched && matched.memberStatus === "suspended"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <Link
      href="/mode-select"
      className={`inline-flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition hover:opacity-90 ${toneClass}`}
      title={`${title} (${subtitle})`}
    >
      <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-current opacity-70" />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold">{title}</span>
        <span className="block truncate text-[11px] opacity-80">{subtitle}</span>
      </span>
    </Link>
  );
}

