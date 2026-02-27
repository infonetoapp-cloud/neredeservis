"use client";

import { type ComponentProps } from "react";

import { DashboardStatePlaceholder } from "@/components/dashboard/dashboard-state-placeholder";
import { VehicleCreateInlineForm } from "@/components/dashboard/vehicle-create-inline-form";
import { VehiclesListSection } from "@/components/dashboard/vehicles-list-section";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callables";

type VehiclesListProps = ComponentProps<typeof VehiclesListSection>;

type VehiclesWorkspacePaneProps = {
  authStatus: "loading" | "signed_out" | "signed_in" | "disabled";
  companyId: string | null;
  canMutateVehicles: boolean;
  vehiclesStatus: "idle" | "loading" | "success" | "error";
  vehiclesError: unknown | null;
  vehiclesCount: number;
  vehiclesListProps: VehiclesListProps;
  onRetryVehicles: () => void;
  onVehicleCreated: (payload: { vehicleId: string }) => void | Promise<void>;
};

export function VehiclesWorkspacePane({
  authStatus,
  companyId,
  canMutateVehicles,
  vehiclesStatus,
  vehiclesError,
  vehiclesCount,
  vehiclesListProps,
  onRetryVehicles,
  onVehicleCreated,
}: VehiclesWorkspacePaneProps) {
  if (authStatus !== "signed_in") {
    return (
      <DashboardStatePlaceholder
        tone="info"
        title="Oturum bekleniyor"
        description="Vehicle listesi icin aktif oturum gerekir."
      />
    );
  }

  if (!companyId) {
    return (
      <DashboardStatePlaceholder
        tone="empty"
        title="Aktif company secimi yok"
        description="Vehicles ekrani company context gerektirir. Once company sec."
      />
    );
  }

  if (vehiclesStatus === "loading") {
    return (
      <DashboardStatePlaceholder
        tone="loading"
        title="Araclar yukleniyor"
        description="Firebase callable listCompanyVehicles ile company-scoped vehicle listesi getiriliyor."
      />
    );
  }

  if (vehiclesStatus === "error") {
    return (
      <div className="space-y-3">
        <DashboardStatePlaceholder
          tone="error"
          title="Araclar yuklenemedi"
          description={mapCompanyCallableErrorToMessage(vehiclesError)}
        />
        <button
          type="button"
          onClick={onRetryVehicles}
          className="inline-flex items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (vehiclesCount === 0) {
    return (
      <div className="space-y-4">
        <DashboardStatePlaceholder
          tone="empty"
          title="Bu firma icin arac bulunamadi"
          description="Ilk company araci olusturuldugunda liste burada gorunur."
        />
        {canMutateVehicles ? (
          <VehicleCreateInlineForm companyId={companyId} onCreated={onVehicleCreated} />
        ) : (
          <DashboardStatePlaceholder
            tone="info"
            title="Arac olusturma yetkisi yok"
            description="Arac olusturmak icin aktif owner/admin/dispatcher uyeligi gerekir."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canMutateVehicles ? (
        <VehicleCreateInlineForm companyId={companyId} onCreated={onVehicleCreated} />
      ) : (
        <DashboardStatePlaceholder
          tone="info"
          title="Bu hesap salt-okuma modunda"
          description="Arac mutasyonlari icin aktif owner/admin/dispatcher uyeligi gerekir."
        />
      )}
      <VehiclesListSection {...vehiclesListProps} />
    </div>
  );
}
