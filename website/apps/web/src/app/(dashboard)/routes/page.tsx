import { CompanyModeRouteGuard } from "@/components/dashboard/company-mode-route-guard";
import { RoutesCompanyRoutesFeature } from "@/components/dashboard/routes-company-routes-feature";

export default function RoutesPage() {
  return (
    <CompanyModeRouteGuard routeLabel="Routes">
      <RoutesCompanyRoutesFeature />
    </CompanyModeRouteGuard>
  );
}
