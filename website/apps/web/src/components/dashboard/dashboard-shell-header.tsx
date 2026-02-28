"use client";

import { usePathname } from "next/navigation";

import { DashboardHeaderActions } from "@/components/auth/dashboard-header-actions";
import { ActiveCompanyContextChip } from "@/components/dashboard/active-company-context-chip";
import { DashboardCompanySwitcher } from "@/components/dashboard/dashboard-company-switcher";
import { DashboardCommandPalette } from "@/components/dashboard/dashboard-command-palette";
import { DashboardDensityToggle } from "@/components/dashboard/dashboard-density-toggle";

const HEADER_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Panel genel gorunumu ve hizli gecisler",
  },
  "/mode-select": {
    title: "Mode Selector",
    subtitle: "Company / Individual calisma modu secimi",
  },
  "/drivers": {
    title: "Drivers",
    subtitle: "Company members listesi v1 (Faz 2 ilk gercek operasyon listesi)",
  },
  "/vehicles": {
    title: "Vehicles",
    subtitle: "Company vehicle summaries v1 (Faz 2 gercek liste entegrasyonu)",
  },
  "/routes": {
    title: "Routes",
    subtitle: "Company route summaries v1 (Faz 2 gercek liste entegrasyonu)",
  },
  "/live-ops": {
    title: "Live Ops",
    subtitle: "Aktif seferler, canli konum fallback ve dispatch akislari",
  },
  "/admin": {
    title: "Admin",
    subtitle: "Role-gated operasyon denetimi ve uzaktan mudahale shell'i",
  },
};

export function DashboardShellHeader() {
  const pathname = usePathname() ?? "/dashboard";
  const meta = HEADER_META[pathname] ?? HEADER_META["/dashboard"];

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{meta.title}</div>
          <div className="text-xs text-muted">{meta.subtitle}</div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActiveCompanyContextChip />
          <DashboardCompanySwitcher />
          <div className="hidden rounded-xl border border-dashed border-line bg-white px-3 py-2 text-xs text-muted xl:block">
            Quick actions: Yeni rota / Dispatch / Filtreler
          </div>
          <DashboardCommandPalette />
          <DashboardDensityToggle />
          <DashboardHeaderActions />
        </div>
      </div>
    </header>
  );
}
