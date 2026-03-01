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
    return "Yonetici";
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
      label: "Canli Operasyon",
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
    <nav className="space-y-2">
      <div className="mb-2 px-1 text-[11px] font-semibold tracking-[0.12em] text-[#7c8793] uppercase">
        sekmeler
      </div>
      <div className="mb-3 rounded-xl border border-line bg-[#f8fafc] px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-[#5a6572] uppercase">
        rol: {toRoleLabel(memberRole, loading)}
      </div>
      {errorMessage ? (
        <div className="rounded-xl border border-amber-300/70 bg-amber-50/90 px-2.5 py-2 text-[11px] text-amber-900">
          {errorMessage}
        </div>
      ) : null}
      {visibleItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex w-full items-center rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "border-[#b5e4e3] bg-[linear-gradient(130deg,#e9f9f7_0%,#f4fbfb_100%)] text-[#0c7f81] shadow-[0_8px_20px_rgba(12,127,129,0.12)]"
                : "border-transparent bg-transparent text-slate-600 hover:border-line hover:bg-[#f8fafb] hover:text-slate-900"
            }`}
          >
            <span
              className={`mr-2.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
                active
                  ? "border-[#c8e6e5] bg-white/90 text-[#0c7f81]"
                  : "border-line bg-[#fafbfc] text-[#6a7380] group-hover:bg-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
