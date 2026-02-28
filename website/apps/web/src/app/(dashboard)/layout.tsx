import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { DashboardShellHeader } from "@/components/dashboard/dashboard-shell-header";
import { DashboardShellSidebar } from "@/components/dashboard/dashboard-shell-sidebar";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <DashboardShellSidebar />

        <div className="min-w-0">
          <DashboardShellHeader />
          <main className="p-4 sm:p-6">
            <ConfigValidationBanner scopeLabel="Dashboard Shell" />
            <DashboardAuthGate>{children}</DashboardAuthGate>
          </main>
        </div>
      </div>
    </div>
  );
}
