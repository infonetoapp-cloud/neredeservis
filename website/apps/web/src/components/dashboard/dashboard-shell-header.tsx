"use client";

import { usePathname } from "next/navigation";

import { DashboardHeaderActions } from "@/components/auth/dashboard-header-actions";
import { ActiveCompanyContextChip } from "@/components/dashboard/active-company-context-chip";
import { DashboardCompanySwitcher } from "@/components/dashboard/dashboard-company-switcher";
import { DashboardCommandPalette } from "@/components/dashboard/dashboard-command-palette";

const HEADER_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Ana Sayfa",
    subtitle: "Genel durum ve hızlı erişim",
  },
  "/mode-select": {
    title: "Şirket Seç",
    subtitle: "Üye olduğunuz şirketler arasında geçiş yapın",
  },
  "/drivers": {
    title: "Şoförler",
    subtitle: "Şoför ekle, davet et ve üyelikleri yönet",
  },
  "/vehicles": {
    title: "Araçlar",
    subtitle: "Filonuzu yönetin; araç ekle, düzenle ve takip et",
  },
  "/routes": {
    title: "Rotalar",
    subtitle: "Güzergahları tanımlayın ve düzenleyin",
  },
  "/live-ops": {
    title: "Canlı Takip",
    subtitle: "Şu an aktif seferler ve araç konumları",
  },
  "/admin": {
    title: "Yönetim",
    subtitle: "Şirket ayarları ve erişim kontrolü",
  },
};

export function DashboardShellHeader() {
  const pathname = usePathname() ?? "/dashboard";
  const meta = HEADER_META[pathname] ?? HEADER_META["/dashboard"];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-5 py-3.5 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-slate-900">{meta.title}</div>
          <div className="text-xs text-slate-500">{meta.subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <ActiveCompanyContextChip />
          <DashboardCompanySwitcher />
          <DashboardCommandPalette />
          <DashboardHeaderActions />
        </div>
      </div>
    </header>
  );
}
