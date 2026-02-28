"use client";

import { useMemo } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useMyCompanies } from "@/features/company/use-my-companies";
import type {
  CompanyMemberRole,
  CompanyMemberStatus,
  CompanyMembershipSummary,
} from "@/features/company/company-types";
import { useActivePanelMode } from "@/features/mode/use-active-panel-mode";

type ActiveCompanyMembershipStatus = "idle" | "loading" | "success" | "error";

type ActiveCompanyMembershipState = {
  status: ActiveCompanyMembershipStatus;
  membership: CompanyMembershipSummary | null;
  role: CompanyMemberRole | null;
  memberStatus: CompanyMemberStatus | null;
  error: unknown | null;
};

export function useActiveCompanyMembership(): ActiveCompanyMembershipState {
  const { status: authStatus } = useAuthSession();
  const { resolvedMode } = useActivePanelMode();
  const activeCompany = useActiveCompanyPreference();
  const companyQueryEnabled = authStatus === "signed_in" && resolvedMode === "company";
  const companiesQuery = useMyCompanies(companyQueryEnabled);

  const membership = useMemo<CompanyMembershipSummary | null>(() => {
    if (!activeCompany) return null;
    return companiesQuery.items.find((item) => item.companyId === activeCompany.companyId) ?? null;
  }, [activeCompany, companiesQuery.items]);

  if (!companyQueryEnabled) {
    return {
      status: "idle",
      membership: null,
      role: null,
      memberStatus: null,
      error: null,
    };
  }

  return {
    status: companiesQuery.status,
    membership,
    role: membership?.role ?? null,
    memberStatus: membership?.memberStatus ?? null,
    error: companiesQuery.error,
  };
}
