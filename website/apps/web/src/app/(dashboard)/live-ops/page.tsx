import { CompanyModeRouteGuard } from "@/components/dashboard/company-mode-route-guard";
import { LiveOpsCompanyActiveTripsFeature } from "@/components/dashboard/live-ops-company-active-trips-feature";

export default function LiveOpsPage() {
  return (
    <CompanyModeRouteGuard routeLabel="Live Ops">
      <LiveOpsCompanyActiveTripsFeature />
    </CompanyModeRouteGuard>
  );
}
