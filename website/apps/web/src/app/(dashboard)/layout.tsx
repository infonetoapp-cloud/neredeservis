import type { ReactNode } from "react";

import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { DashboardHeaderActions } from "@/components/auth/dashboard-header-actions";
import { BellIcon, BuildingIcon, SearchIcon } from "@/components/shared/app-icons";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";
import { EnvBadge } from "@/components/shared/env-badge";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#ecf8f6_0%,transparent_32%),radial-gradient(circle_at_100%_100%,#eaf1ff_0%,transparent_30%),#f4f6f8] text-foreground">
      <header className="sticky top-0 z-20 border-b border-line bg-white/88 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/72 sm:px-6">
        <div className="flex w-full items-center gap-3">
          <div className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
            <span className="icon-badge h-8 w-8">
              <BuildingIcon className="h-4 w-4" />
            </span>
            NeredeServis Panel
          </div>

          <div className="relative hidden min-w-[320px] flex-1 lg:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search here..."
              className="h-10 w-full rounded-full border border-line bg-[#f4f5f7] pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#8fd0cf]"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <BellIcon className="h-4 w-4" />
            </button>
            <EnvBadge />
            <DashboardHeaderActions />
          </div>
        </div>
      </header>

      <main className="w-full p-4 sm:p-6">
        <ConfigValidationBanner scopeLabel="Dashboard Shell" />
        <DashboardAuthGate>{children}</DashboardAuthGate>
      </main>
    </div>
  );
}
