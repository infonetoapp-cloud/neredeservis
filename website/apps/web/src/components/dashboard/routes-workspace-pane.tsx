"use client";

import { type ComponentProps } from "react";

import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { RouteCreateWizardForm } from "@/components/dashboard/route-create-wizard-form";
import { RoutesListSection } from "@/components/dashboard/routes-list-section";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";

type RoutesListProps = ComponentProps<typeof RoutesListSection>;
type RoutesWorkspacePaneProps = {
  authStatus: "loading" | "signed_out" | "signed_in" | "disabled";
  companyId: string | null;
  canMutateRoutes: boolean;
  routesStatus: "idle" | "loading" | "success" | "error";
  routesError: unknown | null;
  routesCount: number;
  routesListProps: RoutesListProps;
  onRetryRoutes: () => void;
  onRouteCreated: (payload: { routeId: string }) => void | Promise<void>;
};

export function RoutesWorkspacePane({
  authStatus,
  companyId,
  canMutateRoutes,
  routesStatus,
  routesError,
  routesCount,
  routesListProps,
  onRetryRoutes,
  onRouteCreated,
}: RoutesWorkspacePaneProps) {
  if (authStatus !== "signed_in") {
    return (
      <DashboardStatePlaceholder
        tone="info"
        title="Oturum bekleniyor"
        description="Route listesi için aktif oturum gerekiyor."
      />
    );
  }

  if (!companyId) {
    return (
      <DashboardStatePlaceholder
        tone="empty"
        title="Aktif company secimi yok"
        description="Routes ekrani company context gerektirir. Once company sec."
      />
    );
  }

  if (routesStatus === "loading") {
    return (
      <DashboardStatePlaceholder
        tone="loading"
        title="Rotalar yukleniyor"
        description="Rotalar yukleniyor, lutfen bekleyin."
      />
    );
  }

  if (routesStatus === "error") {
    return (
      <div className="space-y-3">
        <DashboardStatePlaceholder
          tone="error"
          title="Rotalar yuklenemedi"
          description={mapCompanyCallableErrorToMessage(routesError)}
        />
        <button
          type="button"
          onClick={onRetryRoutes}
          className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (routesCount === 0) {
    return (
      <div className="space-y-4">
        <DashboardStatePlaceholder
          tone="empty"
          title="Bu firma için route bulunamadi"
          description="Ilk company route olusturuldugunda liste burada görünür."
        />
        {canMutateRoutes ? (
          <RouteCreateWizardForm companyId={companyId} onCreated={onRouteCreated} />
        ) : (
          <DashboardStatePlaceholder
            tone="info"
            title="Rota olusturma yetkisi yok"
            description="Rota olusturmak için aktif owner/admin/dispatcher uyeligi gerekir."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canMutateRoutes ? (
        <RouteCreateWizardForm companyId={companyId} onCreated={onRouteCreated} />
      ) : (
        <DashboardStatePlaceholder
          tone="info"
          title="Bu hesap salt-okuma modunda"
          description="Rota mutasyonlari için aktif owner/admin/dispatcher uyeligi gerekir."
        />
      )}
      <RoutesListSection {...routesListProps} />
    </div>
  );
}

