"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  Bus,
  MapPin,
  RadioTower,
  Settings,
  UsersRound,
  FileText,
  Download,
  type LucideIcon,
} from "lucide-react";

import { ActiveCompanySidebarCard } from "@/components/dashboard/active-company-sidebar-card";
import { EnvBadge } from "@/components/shared/env-badge";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AccentTheme = {
  activeBg: string;
  activeText: string;
  iconActiveBg: string;
  hoverBg: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  /** If set, only visible for these roles */
  roles?: readonly string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

/* ------------------------------------------------------------------ */
/*  Accent color system — per-page accent                             */
/* ------------------------------------------------------------------ */

const ACCENT_THEMES: Record<string, AccentTheme> = {
  indigo: {
    activeBg: "bg-indigo-50",
    activeText: "text-indigo-700",
    iconActiveBg: "bg-indigo-100 text-indigo-600",
    hoverBg: "hover:bg-indigo-50/60",
  },
  emerald: {
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    iconActiveBg: "bg-emerald-100 text-emerald-600",
    hoverBg: "hover:bg-emerald-50/60",
  },
  violet: {
    activeBg: "bg-violet-50",
    activeText: "text-violet-700",
    iconActiveBg: "bg-violet-100 text-violet-600",
    hoverBg: "hover:bg-violet-50/60",
  },
  rose: {
    activeBg: "bg-rose-50",
    activeText: "text-rose-700",
    iconActiveBg: "bg-rose-100 text-rose-600",
    hoverBg: "hover:bg-rose-50/60",
  },
  orange: {
    activeBg: "bg-orange-50",
    activeText: "text-orange-700",
    iconActiveBg: "bg-orange-100 text-orange-600",
    hoverBg: "hover:bg-orange-50/60",
  },
  slate: {
    activeBg: "bg-slate-100",
    activeText: "text-slate-700",
    iconActiveBg: "bg-slate-200 text-slate-600",
    hoverBg: "hover:bg-slate-50",
  },
  teal: {
    activeBg: "bg-teal-50",
    activeText: "text-teal-700",
    iconActiveBg: "bg-teal-100 text-teal-600",
    hoverBg: "hover:bg-teal-50/60",
  },
  sky: {
    activeBg: "bg-sky-50",
    activeText: "text-sky-700",
    iconActiveBg: "bg-sky-100 text-sky-600",
    hoverBg: "hover:bg-sky-50/60",
  },
  amber: {
    activeBg: "bg-amber-50",
    activeText: "text-amber-700",
    iconActiveBg: "bg-amber-100 text-amber-600",
    hoverBg: "hover:bg-amber-50/60",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildSections(companyId: string | null, role: string | null): NavSection[] {
  if (!companyId) {
    return [];
  }

  const base = `/c/${encodeURIComponent(companyId)}`;

  const sections: NavSection[] = [
    {
      title: "",
      items: [
        { label: "Genel Bakış", href: `${base}/dashboard`, icon: LayoutDashboard, accent: "indigo" },
      ],
    },
    {
      title: "Operasyon",
      items: [
        { label: "Canlı Operasyon", href: `${base}/live-ops`, icon: RadioTower, accent: "emerald" },
        { label: "Rotalar", href: `${base}/routes`, icon: MapPin, accent: "violet" },
        { label: "Araçlar", href: `${base}/vehicles`, icon: Bus, accent: "sky" },
        { label: "Şoförler", href: `${base}/drivers`, icon: Users, accent: "amber" },
      ],
    },
    {
      title: "Yönetim",
      items: [
        { label: "Üyeler", href: `${base}/members`, icon: UsersRound, accent: "rose", roles: ["owner", "admin"] },
        { label: "Şoför Belgeler", href: `${base}/driver-documents`, icon: FileText, accent: "orange" },
        { label: "Ayarlar", href: `${base}/settings`, icon: Settings, accent: "slate", roles: ["owner", "admin"] },
      ],
    },
    {
      title: "",
      items: [
        { label: "Dışa Aktarma", href: `${base}/export`, icon: Download, accent: "teal" },
      ],
    },
  ];

  // Filter role-gated items
  return sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.roles) return true;
      if (!role) return false;
      return item.roles.includes(role);
    }),
  })).filter((section) => section.items.length > 0);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DashboardShellSidebar() {
  const pathname = usePathname() ?? "";
  const activeCompany = useActiveCompanyPreference();
  const membership = useActiveCompanyMembership();

  const companyId = activeCompany?.companyId ?? null;
  const sections = buildSections(companyId, membership.role);

  return (
    <aside className="flex h-screen flex-col border-r border-slate-200 bg-white lg:sticky lg:top-0">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#F67366] to-[#E85D50] shadow-sm">
            <RadioTower className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-tight text-slate-800">NeredeServis</div>
            <div className="text-[10px] text-slate-400">Yönetim Paneli</div>
          </div>
        </div>
        <EnvBadge />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <div className="text-sm font-medium text-slate-400">Şirket seçilmedi</div>
            <div className="mt-1 text-xs text-slate-400">
              Aşağıdan bir şirket seçin
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title || "_root"}>
                {section.title ? (
                  <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    {section.title}
                  </div>
                ) : null}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    const Icon = item.icon;
                    const theme = ACCENT_THEMES[item.accent] ?? ACCENT_THEMES.indigo;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? `${theme.activeBg} ${theme.activeText}`
                            : `text-slate-600 ${theme.hoverBg} hover:text-slate-900`
                        }`}
                      >
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            active
                              ? theme.iconActiveBg
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Active Company Card */}
      <div className="border-t border-slate-100 px-3 py-3">
        <ActiveCompanySidebarCard />
      </div>
    </aside>
  );
}
