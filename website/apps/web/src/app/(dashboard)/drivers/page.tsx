import { CompanyModeRouteGuard } from "@/components/dashboard/company-mode-route-guard";
import { DriversCompanyMembersFeature } from "@/components/dashboard/drivers-company-members-feature";

export default function DriversPage() {
  return (
    <CompanyModeRouteGuard routeLabel="Drivers">
      <DriversCompanyMembersFeature />
    </CompanyModeRouteGuard>
  );
}
