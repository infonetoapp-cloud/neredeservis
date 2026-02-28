import { redirect } from "next/navigation";

import { AdminOperationsFeature } from "@/components/admin/admin-operations-feature";
import { CompanyRoleRouteGuard } from "@/components/dashboard/company-role-route-guard";
import { isAdminSurfaceEnabled } from "@/lib/env/public-env";

export default function AdminPage() {
  if (!isAdminSurfaceEnabled()) {
    redirect("/dashboard");
  }

  return (
    <CompanyRoleRouteGuard routeLabel="Admin" allowedRoles={["owner", "admin"]}>
      <AdminOperationsFeature />
    </CompanyRoleRouteGuard>
  );
}
