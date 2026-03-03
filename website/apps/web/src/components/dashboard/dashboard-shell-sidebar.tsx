"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  MapPin,
  RadioTower,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { ActiveCompanySidebarCard } from "@/components/dashboard/active-company-sidebar-card";
import { EnvBadge } from "@/components/shared/env-badge";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";
import { useActiveCompanyPreference } from "@/features/company/use-active-company-preference";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, only visible for these roles */
  roles?: readonly string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
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
        { label: "Genel Bakış", href: `${base}/dashboard`, icon: LayoutDashboard },
      ],
    },
    {
      title: "Operasyon",
      items: [
        { label: "Canlı Takip", href: `${base}/live-ops`, icon: RadioTower },
        { label: "Rotalar", href: `${base}/routes`, icon: MapPin },
        { label: "Araçlar", href: `${base}/vehicles`, icon: Truck },
        { label: "Şoförler", href: `${base}/drivers`, icon: Users },
      ],
    },
    {
      title: "Yönetim",
      items: [
        { label: "Üyeler", href: `${base}/members`, icon: UsersRound, roles: ["owner", "admin"] },
        { label: "Ayarlar", href: "/admin", icon: Settings, roles: ["owner", "admin"] },
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
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? "bg-white/20 text-white"
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
