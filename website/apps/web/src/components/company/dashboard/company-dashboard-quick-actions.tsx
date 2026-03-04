"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { type CompanyMemberRole } from "@/features/company/company-client";
import { CarIcon, DashboardIcon, PulseIcon, RouteIcon, ShieldLockIcon, UsersIcon } from "@/components/shared/app-icons";

type Props = {
  companyId: string;
  memberRole: CompanyMemberRole | null;
};

type ActionItem = {
  label: string;
  href: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function CompanyDashboardQuickActions({ companyId, memberRole }: Props) {
  const basePath = `/c/${encodeURIComponent(companyId)}`;
  const actions: ActionItem[] = [
    {
      label: "Canli Operasyon",
      href: `${basePath}/live-ops`,
      description: "Canli sefer, rota ve konum akisina gec.",
      icon: PulseIcon,
    },
    {
      label: "Rotalar",
      href: `${basePath}/routes`,
      description: "Rota planlarini yonet.",
      icon: RouteIcon,
    },
    {
      label: "Soforler",
      href: `${basePath}/drivers`,
      description: "Sofor listesi ve rol atamalarini ac.",
      icon: UsersIcon,
    },
    {
      label: "Araclar",
      href: `${basePath}/vehicles`,
      description: "Arac havuzunu ve durumlarini yonet.",
      icon: CarIcon,
    },
  ];

  if (memberRole === "owner" || memberRole === "admin") {
    actions.push({
      label: "Uyeler",
      href: `${basePath}/members`,
      description: "Uyeler ve yetkiler.",
      icon: ShieldLockIcon,
    });
  }

  actions.push({
    label: "Paneli Yenile",
    href: `${basePath}/dashboard`,
    description: "Anlik durumu tekrar yukle.",
    icon: DashboardIcon,
  });

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold tracking-[0.14em] text-[#7d8693] uppercase">Hizli Aksiyon</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-950">Tek tikla operasyon gecisleri</h2>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="group rounded-2xl border border-line bg-[#fafbfd] p-3 transition hover:-translate-y-0.5 hover:border-[#b8d3cc] hover:bg-white"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#dbe7e3] bg-[#eef6f3] text-[#25665b]">
              <action.icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{action.label}</div>
            <div className="mt-1 text-xs text-[#6f7783]">{action.description}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
