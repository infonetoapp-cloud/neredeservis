"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ModeSelectCompanyPanel } from "@/components/dashboard/mode-select-company-panel";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  acceptCompanyInviteCallable,
  createCompanyCallable,
  declineCompanyInviteCallable,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callables";
import { writeActiveCompanyPreference } from "@/features/company/company-preferences";
import type { CompanyMembershipSummary } from "@/features/company/company-types";
import { useMyCompanies } from "@/features/company/use-my-companies";

type PendingAction =
  | `company:${string}`
  | `create:${string}`
  | `accept:${string}`
  | `decline:${string}`
  | null;

/**
 * Firma seçim / oluşturma / davet kabul kartları.
 * MVP'de bireysel (individual) mod kaldırıldı — web her zaman company modunda çalışır.
 */
export function ModeSelectCards() {
  const router = useRouter();
  const { status: authStatus, user } = useAuthSession();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [companyActionError, setCompanyActionError] = useState<string | null>(null);
  const [localCompanies, setLocalCompanies] = useState<CompanyMembershipSummary[] | null>(null);

  const companiesQuery = useMyCompanies(authStatus === "signed_in");
  const companies = localCompanies ?? companiesQuery.items;

  const handleSelectCompany = (company: CompanyMembershipSummary) => {
    setCompanyActionError(null);
    setPendingAction(`company:${company.companyId}`);
    writeActiveCompanyPreference({
      companyId: company.companyId,
      companyName: company.name,
    });
    router.push("/dashboard");
  };

  const handleAcceptCompanyInvite = async (company: CompanyMembershipSummary) => {
    setCompanyActionError(null);
    setPendingAction(`accept:${company.companyId}`);
    try {
      const accepted = await acceptCompanyInviteCallable({ companyId: company.companyId });
      setLocalCompanies((prev) => {
        const base = prev ?? companiesQuery.items;
        return base.map((item) =>
          item.companyId === company.companyId
            ? { ...item, memberStatus: accepted.memberStatus, role: accepted.role }
            : item,
        );
      });
      writeActiveCompanyPreference({
        companyId: company.companyId,
        companyName: company.name,
      });
      router.push("/dashboard");
    } catch (error) {
      setCompanyActionError(mapCompanyCallableErrorToMessage(error));
      setPendingAction(null);
    }
  };

  const handleDeclineCompanyInvite = async (company: CompanyMembershipSummary) => {
    setCompanyActionError(null);
    setPendingAction(`decline:${company.companyId}`);
    try {
      const declined = await declineCompanyInviteCallable({ companyId: company.companyId });
      setLocalCompanies((prev) => {
        const base = prev ?? companiesQuery.items;
        return base.map((item) =>
          item.companyId === company.companyId
            ? { ...item, memberStatus: declined.memberStatus, role: declined.role }
            : item,
        );
      });
      setPendingAction(null);
    } catch (error) {
      setCompanyActionError(mapCompanyCallableErrorToMessage(error));
      setPendingAction(null);
    }
  };

  const handleCreateCompany = async () => {
    const name = newCompanyName.trim();
    if (!name) {
      setCreateError("Sirket adi gerekli.");
      return;
    }

    setCreateError(null);
    setPendingAction(`create:${name}`);
    try {
      const created = await createCompanyCallable({
        name,
        contactEmail: user?.email ?? null,
      });

      const nextCompany: CompanyMembershipSummary = {
        companyId: created.companyId,
        name,
        role: "owner",
        memberStatus: "active",
        companyStatus: "active",
        billingStatus: "active",
      };

      setLocalCompanies((prev) => {
        const base = prev ?? companiesQuery.items;
        const deduped = base.filter((item) => item.companyId !== nextCompany.companyId);
        return [...deduped, nextCompany].sort((a, b) => a.name.localeCompare(b.name, "tr"));
      });

      writeActiveCompanyPreference({
        companyId: created.companyId,
        companyName: name,
      });
      router.push("/dashboard");
    } catch (error) {
      setCreateError(mapCompanyCallableErrorToMessage(error));
      setPendingAction(null);
    }
  };

  const isCompaniesLoading =
    authStatus === "signed_in" && companiesQuery.status === "loading" && !localCompanies;

  const companiesLoadError =
    authStatus === "signed_in" && companiesQuery.status === "error"
      ? mapCompanyCallableErrorToMessage(companiesQuery.error)
      : null;

  return (
    <div className="space-y-5">
      <ModeSelectCompanyPanel
        authStatus={authStatus}
        isCompaniesLoading={isCompaniesLoading}
        companiesLoadError={companiesLoadError}
        companies={companies}
        pendingAction={pendingAction}
        companyActionError={companyActionError}
        newCompanyName={newCompanyName}
        createError={createError}
        onRetryCompanies={() => {
          void companiesQuery.reload();
        }}
        onAcceptInvite={(company) => {
          void handleAcceptCompanyInvite(company);
        }}
        onDeclineInvite={(company) => {
          void handleDeclineCompanyInvite(company);
        }}
        onSelectCompany={handleSelectCompany}
        onCompanyNameChange={setNewCompanyName}
        onCreateCompany={() => {
          void handleCreateCompany();
        }}
      />
    </div>
  );
}
