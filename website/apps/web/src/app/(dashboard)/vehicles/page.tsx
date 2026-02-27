import { CompanyModeRouteGuard } from "@/components/dashboard/company-mode-route-guard";
import { VehiclesCompanyVehiclesFeature } from "@/components/dashboard/vehicles-company-vehicles-feature";

export default function VehiclesPage() {
  return (
    <CompanyModeRouteGuard routeLabel="Vehicles">
      <VehiclesCompanyVehiclesFeature />
    </CompanyModeRouteGuard>
  );
}
