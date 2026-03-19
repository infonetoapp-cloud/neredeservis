"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  type CompanyBillingStatus,
  listMyCompaniesForCurrentUser,
  type CompanyMemberRole,
  type CompanyMembershipStatus,
  type CompanyStatus,
} from "@/features/company/company-client";

export type CompanyAccessLockReason =
  | "company_suspended"
  | "company_archived"
  | "billing_locked"
  | "membership_suspended"
  | null;

type CompanyMembershipContextValue = {
  companyId: string;
  companyName: string | null;
  loading: boolean;
  hasActiveMembership: boolean;
  memberRole: CompanyMemberRole | null;
  membershipStatus: CompanyMembershipStatus | null;
  companyStatus: CompanyStatus | null;
  billingStatus: CompanyBillingStatus | null;
  lockReason: CompanyAccessLockReason;
  errorMessage: string | null;
};

type ResolutionState = {
  resolvedForCompanyId: string | null;
  companyName: string | null;
  memberRole: CompanyMemberRole | null;
  membershipStatus: CompanyMembershipStatus | null;
  companyStatus: CompanyStatus | null;
  billingStatus: CompanyBillingStatus | null;
  errorMessage: string | null;
};

const CompanyMembershipContext = createContext<CompanyMembershipContextValue | null>(null);

type ProviderProps = {
  companyId: string;
  children: ReactNode;
};

export function CompanyMembershipProvider({ companyId, children }: ProviderProps) {
  const { status } = useAuthSession();
  const [resolution, setResolution] = useState<ResolutionState>({
    resolvedForCompanyId: null,
    companyName: null,
    memberRole: null,
    membershipStatus: null,
    companyStatus: null,
    billingStatus: null,
    errorMessage: null,
  });

  useEffect(() => {
    if (status !== "signed_in") {
      return;
    }

    let cancelled = false;
    listMyCompaniesForCurrentUser()
      .then((memberships) => {
        if (cancelled) {
          return;
        }
        const matching = memberships.find((item) => item.companyId === companyId);
        setResolution({
          resolvedForCompanyId: companyId,
          companyName: matching?.companyName ?? null,
          memberRole: matching?.memberRole ?? null,
          membershipStatus: matching?.membershipStatus ?? null,
          companyStatus: matching?.companyStatus ?? null,
          billingStatus: matching?.billingStatus ?? null,
          errorMessage: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setResolution({
          resolvedForCompanyId: companyId,
          companyName: null,
          memberRole: null,
          membershipStatus: null,
          companyStatus: null,
          billingStatus: null,
          errorMessage: error instanceof Error ? error.message : "Şirket uyelik bilgisi alinamadi.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, status]);

  const value = useMemo<CompanyMembershipContextValue>(() => {
    const isResolved = resolution.resolvedForCompanyId === companyId;
    const loading = status !== "signed_in" || !isResolved;
    const hasActiveMembership = isResolved && resolution.membershipStatus === "active";
    let lockReason: CompanyAccessLockReason = null;
    if (isResolved) {
      if (resolution.membershipStatus === "suspended") {
        lockReason = "membership_suspended";
      } else if (resolution.companyStatus === "suspended") {
        lockReason = "company_suspended";
      } else if (resolution.companyStatus === "archived") {
        lockReason = "company_archived";
      } else if (resolution.billingStatus === "suspended_locked") {
        lockReason = "billing_locked";
      }
    }
    return {
      companyId,
      companyName: isResolved ? resolution.companyName : null,
      loading,
      hasActiveMembership,
      memberRole: hasActiveMembership ? resolution.memberRole : null,
      membershipStatus: isResolved ? resolution.membershipStatus : null,
      companyStatus: isResolved ? resolution.companyStatus : null,
      billingStatus: isResolved ? resolution.billingStatus : null,
      lockReason,
      errorMessage: isResolved ? resolution.errorMessage : null,
    };
  }, [companyId, resolution, status]);

  return <CompanyMembershipContext.Provider value={value}>{children}</CompanyMembershipContext.Provider>;
}

export function useCompanyMembership(): CompanyMembershipContextValue {
  const context = useContext(CompanyMembershipContext);
  if (!context) {
    throw new Error("CompanyMembershipProvider eksik.");
  }
  return context;
}

