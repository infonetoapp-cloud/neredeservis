"use client";

import { type ComponentProps } from "react";

import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { DriversListSection } from "@/components/dashboard/drivers-list-section";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";

type DriversListProps = ComponentProps<typeof DriversListSection>;

type DriversWorkspacePaneProps = {
  authStatus: "loading" | "signed_out" | "signed_in" | "disabled";
  companyId: string | null;
  membersStatus: "idle" | "loading" | "success" | "error";
  membersError: unknown | null;
  membersCount: number;
  driversListProps: DriversListProps;
  onRetryMembers: () => void;
};

export function DriversWorkspacePane({
  authStatus,
  companyId,
  membersStatus,
  membersError,
  membersCount,
  driversListProps,
  onRetryMembers,
}: DriversWorkspacePaneProps) {
  if (authStatus !== "signed_in") {
    return (
      <DashboardStatePlaceholder
        tone="info"
        title="Oturum bekleniyor"
        description="Uye listesini goruntulemek icin giris yapin."
      />
    );
  }

  if (!companyId) {
    return (
      <DashboardStatePlaceholder
        tone="empty"
        title="Firma secilmedi"
        description="Uye listesini goruntulemek icin once bir firma secin."
      />
    );
  }

  if (membersStatus === "loading") {
    return (
      <DashboardStatePlaceholder
        tone="loading"
        title="Uyeler yukleniyor"
        description="Uye listesi yukleniyor, lutfen bekleyin."
      />
    );
  }

  if (membersStatus === "error") {
    return (
      <div className="space-y-3">
        <DashboardStatePlaceholder
          tone="error"
          title="Uyeler yuklenemedi"
          description={mapCompanyCallableErrorToMessage(membersError)}
        />
        <button
          type="button"
          onClick={onRetryMembers}
          className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (membersCount === 0) {
    return (
      <DashboardStatePlaceholder
        tone="empty"
        title="Bu firmada uye bulunamadi"
        description="Ilk davetler eklendiginde owner/admin/dispatcher/viewer uyeleri burada gorunecek."
      />
    );
  }

  return <DriversListSection {...driversListProps} />;
}
