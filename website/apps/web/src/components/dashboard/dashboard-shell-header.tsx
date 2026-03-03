"use client";

import { usePathname } from "next/navigation";

import { DashboardHeaderActions } from "@/components/auth/dashboard-header-actions";
import { DashboardCommandPalette } from "@/components/dashboard/dashboard-command-palette";

/* ------------------------------------------------------------------ */
/*  Page titles — matches both flat and /c/[companyId]/… segments      */
/* ------------------------------------------------------------------ */

const SEGMENT_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Genel Bakış",
    subtitle: "Özet istatistikler ve hızlı erişim",
  },
  "select-company": {
    title: "Şirket Seç",
    subtitle: "Üye olduğunuz şirketler arasında geçiş yapın",
  },
  drivers: {
    title: "Şoförler",
    subtitle: "Şoför ekle, davet et ve üyelikleri yönet",
  },
  vehicles: {
    title: "Araçlar",
    subtitle: "Filonuzu yönetin; araç ekle, düzenle ve takip et",
  },
  routes: {
    title: "Rotalar",
    subtitle: "Güzergahları tanımlayın ve düzenleyin",
  },
  "live-ops": {
    title: "Canlı Takip",
    subtitle: "Şu an aktif seferler ve araç konumları",
  },
  admin: {
    title: "Ayarlar",
    subtitle: "Şirket ayarları ve erişim kontrolü",
  },
  members: {
    title: "Üyeler",
    subtitle: "Şirket üyelerini görüntüle ve yönet",
  },
};

const FALLBACK_META = { title: "Panel", subtitle: "NeredeServis Yönetim" };

function resolveHeaderMeta(pathname: string) {
  // Try matching the last meaningful segment
  // For /c/[companyId]/dashboard → "dashboard"
  // For /drivers → "drivers"
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";

  if (SEGMENT_META[lastSegment]) {
    return SEGMENT_META[lastSegment];
  }

  // For /c/[companyId] root
  if (segments.length >= 2 && segments[0] === "c") {
    return SEGMENT_META.dashboard;
  }

  return FALLBACK_META;
}

export function DashboardShellHeader() {
  const pathname = usePathname() ?? "/";
  const meta = resolveHeaderMeta(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-5 py-3.5 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-slate-900">{meta.title}</div>
          <div className="text-xs text-slate-500">{meta.subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <DashboardCommandPalette />
          <DashboardHeaderActions />
        </div>
      </div>
    </header>
  );
}
