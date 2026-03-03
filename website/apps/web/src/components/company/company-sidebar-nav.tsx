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
    <nav className="space-y-1">
      <div className="mb-3 px-1 text-[10px] font-semibold tracking-[0.16em] text-white/35 uppercase">
        Ana Menü
      </div>

      {errorMessage ? (
        <div className="mb-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-2.5 py-2 text-[11px] text-amber-300">
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
                ? "bg-[#F5735A] text-white shadow-[0_4px_14px_rgba(245,115,90,0.35)]"
                : "text-white/65 hover:bg-white/8 hover:text-white"
            }`}
            style={active ? {} : undefined}
          >
            <span
              className={`mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                active
                  ? "bg-white/20 text-white"
                  : "bg-white/8 text-white/50 group-hover:bg-white/12 group-hover:text-white/80"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
            </span>
            {item.label}
          </Link>
        );
      })}

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5735A]/20 text-[11px] font-bold text-[#F5735A]">
            {memberRole ? memberRole[0].toUpperCase() : "?"}
          </span>
          <span className="text-[11px] font-medium text-white/50">{toRoleLabel(memberRole, loading)}</span>
        </div>
      </div>
    </nav>
  );
}
