import { AdminOperationsFeature } from "@/components/admin/admin-operations-feature";
import { CompanyRoleRouteGuard } from "@/components/dashboard/company-role-route-guard";

export default function AdminPage() {
  return (
    <CompanyRoleRouteGuard routeLabel="Admin" allowedRoles={["owner", "admin"]}>
      <AdminOperationsFeature />
    </CompanyRoleRouteGuard>
  );
}

