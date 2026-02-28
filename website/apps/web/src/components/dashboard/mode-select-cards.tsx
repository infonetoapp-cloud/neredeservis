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
import type { PanelMode } from "@/features/mode/mode-preference";
import { writeStoredPanelMode } from "@/features/mode/mode-preference";

type PendingAction =
  | `mode:${PanelMode}`
  | `company:${string}`
  | `create:${string}`
  | `accept:${string}`
  | `decline:${string}`
  | null;

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

  const pushMode = (mode: PanelMode) => {
    writeStoredPanelMode(mode);
    router.push(`/dashboard?mode=${mode}`);
  };

  const handleSelectIndividual = () => {
    setPendingAction("mode:individual");
    pushMode("individual");
  };

  const handleSelectCompany = (company: CompanyMembershipSummary) => {
    setCompanyActionError(null);
    setPendingAction(`company:${company.companyId}`);
    writeActiveCompanyPreference({
      companyId: company.companyId,
      companyName: company.name,
    });
    pushMode("company");
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
      writeStoredPanelMode("company");
      router.push("/dashboard?mode=company");
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
      writeStoredPanelMode("company");
      router.push("/dashboard?mode=company");
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
      <div className="grid gap-4 sm:grid-cols-2">
        <ModeCard
          title="Individual Driver Mode"
          description="Bireysel sofor dashboard akisi. Kendi rota ve sefer gorunumu icin sade panel deneyimi."
          cta="Bireysel Mod ile Devam Et"
          isPrimary={false}
          pending={pendingAction === "mode:individual"}
          onClick={handleSelectIndividual}
          disabled={pendingAction !== null}
        />
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

      <div className="rounded-2xl border border-dashed border-line bg-slate-50 p-4 text-sm text-muted">
        Faz 2 mode/company dilimi: `listMyCompanies`, `createCompany`, `inviteCompanyMember`,
        `acceptCompanyInvite`, `declineCompanyInvite` gercek callable akisina baglandi. Sonraki adim
        pending davet onboarding detaylarini policy copy&apos;siyle sertlestirmek.
      </div>
    </div>
  );
}

function ModeCard({
  title,
  description,
  cta,
  isPrimary,
  pending,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  cta: string;
  isPrimary: boolean;
  pending: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>
      <p className="mb-4 text-sm text-muted">{description}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${
          isPrimary
            ? "bg-brand text-white hover:bg-blue-700"
            : "border border-line bg-white text-slate-900 hover:bg-slate-50"
        }`}
      >
        {pending ? "Yonlendiriliyor..." : cta}
      </button>
    </div>
  );
}
