"use client";

import { useEffect } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  clearActiveCompanyPreference,
  writeActiveCompanyPreference,
} from "@/features/company/company-preferences";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";
import { useMyCompanies } from "@/features/company/use-my-companies";

export function DashboardCompanyContextSync() {
  const { status: authStatus } = useAuthSession();
  const activeCompany = useActiveCompanyPreference();
  const companiesQuery = useMyCompanies(authStatus === "signed_in");

  useEffect(() => {
    if (authStatus !== "signed_in") return;
    if (companiesQuery.status !== "success") return;

    const activeMemberships = companiesQuery.items.filter((item) => item.memberStatus === "active");
    const matched = activeCompany
      ? companiesQuery.items.find((item) => item.companyId === activeCompany.companyId) ?? null
      : null;

    if (matched && matched.memberStatus === "active") {
      if (matched.name !== activeCompany?.companyName) {
        writeActiveCompanyPreference({
          companyId: matched.companyId,
          companyName: matched.name,
        });
      }
      return;
    }

    if (activeMemberships.length === 1) {
      const [single] = activeMemberships;
      if (
        !activeCompany ||
        activeCompany.companyId !== single.companyId ||
        activeCompany.companyName !== single.name
      ) {
        writeActiveCompanyPreference({
          companyId: single.companyId,
          companyName: single.name,
        });
      }
      return;
    }

    if (activeCompany) {
      clearActiveCompanyPreference();
    }
  }, [activeCompany, authStatus, companiesQuery.items, companiesQuery.status]);

  return null;
}
