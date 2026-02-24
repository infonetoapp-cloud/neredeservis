import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { DashboardHeaderActions } from "@/components/auth/dashboard-header-actions";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";
import { EnvBadge } from "@/components/shared/env-badge";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-surface p-4 lg:border-r lg:border-b-0">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-tight">Neredeservis</span>
            <EnvBadge />
          </div>
          <nav className="space-y-2">
            {["Dashboard", "Drivers", "Vehicles", "Routes", "Live Ops"].map(
              (item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium ${
                    index === 0
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Panel Shell (Placeholder)
                </div>
                <div className="text-xs text-muted">
                  Faz 1 auth shell + dashboard iskeleti
                </div>
              </div>
              <DashboardHeaderActions />
            </div>
          </header>
          <main className="p-4 sm:p-6">
            <ConfigValidationBanner scopeLabel="Dashboard Shell" />
            <DashboardAuthGate>{children}</DashboardAuthGate>
          </main>
        </div>
      </div>
    </div>
  );
}
