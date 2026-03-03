"use client";

import { usePathname } from "next/navigation";

import { DashboardHeaderActions } from "@/components/auth/dashboard-header-actions";

const PLATFORM_HEADER_META: Record<string, { title: string; subtitle: string }> = {
  "/platform/companies": {
    title: "Sirketler",
    subtitle: "Kayitli tum sirketleri goruntule ve yonet",
  },
  "/platform/companies/new": {
    title: "Yeni Sirket Olustur",
    subtitle: "Sirket adi ve yetkili e-postasi ile yeni firma kaydi",
  },
};

const DEFAULT_META = {
  title: "Platform Yonetimi",
  subtitle: "SaaS yonetim paneli",
};

export function PlatformShellHeader() {
  const pathname = usePathname() ?? "/platform/companies";

  const meta =
    PLATFORM_HEADER_META[pathname] ??
    (pathname.startsWith("/platform/companies/")
      ? { title: "Sirket Detayi", subtitle: "Sirket bilgileri, uyeler, araclar ve rotalar" }
      : DEFAULT_META);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{meta.title}</div>
          <div className="text-xs text-muted">{meta.subtitle}</div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
            Platform Owner
          </div>
          <DashboardHeaderActions />
        </div>
      </div>
    </header>
  );
}
