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
        description="Araç listesini goruntulemek için giriş yapin."
      />
    );
  }

  if (!companyId) {
    return (
      <DashboardStatePlaceholder
        tone="empty"
        title="Firma secilmedi"
        description="Araç listesini goruntulemek için once bir firma secin."
      />
    );
  }

  if (vehiclesStatus === "loading") {
    return (
      <DashboardStatePlaceholder
        tone="loading"
        title="Araclar yukleniyor"
        description="Araç listesi yukleniyor, lutfen bekleyin."
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
          title="Bu firma için araç bulunamadi"
          description="Henuz kayitli araç yok. Asagidan ilk aracinizi ekleyin."
        />
        {canMutateVehicles ? (
          <VehicleCreateInlineForm companyId={companyId} onCreated={onVehicleCreated} />
        ) : (
          <DashboardStatePlaceholder
            tone="info"
            title="Araç olusturma yetkisi yok"
            description="Araç eklemek için yönetici veya koordinator yetkisi gerekir."
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
            title="Salt okuma modunda"
            description="Araç duzenlemek için yönetici veya koordinator yetkisi gerekir."
        />
      )}
      <VehiclesListSection {...vehiclesListProps} />
    </div>
  );
}

