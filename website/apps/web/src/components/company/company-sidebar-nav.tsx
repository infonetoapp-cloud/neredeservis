"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import {
  CarIcon,
  DashboardIcon,
  PulseIcon,
  RouteIcon,
  ShieldLockIcon,
  UsersIcon,
} from "@/components/shared/app-icons";
import { type CompanyMemberRole } from "@/features/company/company-client";

type Props = {
  companyId: string;
};

type NavItem = {
  label: string;
  href: string;
  allowedRoles: CompanyMemberRole[];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function toRoleLabel(role: CompanyMemberRole | null, loading: boolean): string {
  if (loading) {
    return "Yukleniyor";
  }
  if (role === "owner") {
    return "Sahip";
  }
  if (role === "admin") {
    return "Yönetici";
  }
  if (role === "dispatcher") {
    return "Operasyon";
  }
  if (role === "viewer") {
    return "Goruntuleyici";
  }
  return "Yok";
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CompanySidebarNav({ companyId }: Props) {
  const pathname = usePathname();
  const { loading, memberRole, errorMessage } = useCompanyMembership();

  const basePath = `/c/${encodeURIComponent(companyId)}`;
  const items: NavItem[] = [
    {
      label: "Genel Bakis",
      href: `${basePath}/dashboard`,
      allowedRoles: ["owner", "admin", "dispatcher", "viewer"],
      icon: DashboardIcon,
    },
    {
      label: "Canlı Operasyon",
      href: `${basePath}/live-ops`,
      allowedRoles: ["owner", "admin", "dispatcher", "viewer"],
      icon: PulseIcon,
    },
    {
      label: "Rotalar",
      href: `${basePath}/routes`,
      allowedRoles: ["owner", "admin", "dispatcher", "viewer"],
      icon: RouteIcon,
    },
    {
      label: "Soforler",
      href: `${basePath}/drivers`,
      allowedRoles: ["owner", "admin", "dispatcher", "viewer"],
      icon: UsersIcon,
    },
    {
      label: "Araclar",
      href: `${basePath}/vehicles`,
      allowedRoles: ["owner", "admin", "dispatcher", "viewer"],
      icon: CarIcon,
    },
    {
      label: "Uyeler",
      href: `${basePath}/members`,
      allowedRoles: ["owner", "admin"],
      icon: ShieldLockIcon,
    },
  ];
  const visibleItems = memberRole
    ? items.filter((item) => item.allowedRoles.includes(memberRole))
    : items.filter((item) => item.label !== "Uyeler");

  return (
    <nav className="space-y-1">
      <div className="mb-3 px-1 text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
        Ana Menü
      </div>

      {errorMessage ? (
        <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
          {errorMessage}
        </div>
      ) : null}

      {visibleItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
              active
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span
              className={`mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                active
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
            </span>
            {item.label}
          </Link>
        );
      })}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-600">
            {memberRole ? memberRole[0].toUpperCase() : "?"}
          </span>
          <span className="text-[11px] font-medium text-slate-500">{toRoleLabel(memberRole, loading)}</span>
        </div>
      </div>
    </nav>
  );
}

