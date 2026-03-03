import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { DashboardShellHeader } from "@/components/dashboard/dashboard-shell-header";
import { DashboardShellSidebar } from "@/components/dashboard/dashboard-shell-sidebar";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,#dbeafe50_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_100%_100%,#ede9fe40_0%,transparent_60%),#f0f4f8] text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden lg:block lg:w-[260px] lg:flex-shrink-0">
          <DashboardShellSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardShellHeader />
          <main className="flex-1 p-5 sm:p-6">
            <ConfigValidationBanner scopeLabel="Dashboard Shell" />
            <DashboardAuthGate>{children}</DashboardAuthGate>
          </main>
        </div>
      </div>
    </div>
  );
}
