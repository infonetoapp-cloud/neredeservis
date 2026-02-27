"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ActiveCompanySidebarCard } from "@/components/dashboard/active-company-sidebar-card";
import { EnvBadge } from "@/components/shared/env-badge";
import { canAccessAdminSurface } from "@/features/company/company-rbac";
import { useActiveCompanyMembership } from "@/features/company/use-active-company-membership";

type NavItem = {
  label: string;
  href?: string;
  section: "core" | "operations";
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", section: "core" },
  { label: "Mod Sec", href: "/mode-select", section: "core" },
  { label: "Admin", href: "/admin", section: "core" },
  { label: "Drivers", href: "/drivers", section: "operations" },
  { label: "Vehicles", href: "/vehicles", section: "operations" },
  { label: "Routes", href: "/routes", section: "operations" },
  { label: "Live Ops", href: "/live-ops", section: "operations" },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  if (!item.href) {
    return false;
  }

  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(item.href);
}

function SidebarNavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: readonly NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const active = isItemActive(pathname, item);
          const commonClass =
            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition";

          if (!item.href) {
            return (
              <div
                key={`${title}-${item.label}`}
                className={`${commonClass} border border-transparent text-slate-500 hover:bg-slate-50`}
                aria-disabled="true"
              >
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={`${title}-${item.label}`}
              href={item.href}
              className={`${commonClass} ${
                active
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{item.label}</span>
              {active ? (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardShellSidebar() {
  const pathname = usePathname() ?? "/dashboard";
  const membership = useActiveCompanyMembership();
  const allowAdmin = canAccessAdminSurface(membership.role, membership.memberStatus);

  const coreItems = NAV_ITEMS.filter((item) =>
    item.section === "core" && (item.href !== "/admin" || allowAdmin || pathname.startsWith("/admin")),
  );
  const operationItems = NAV_ITEMS.filter((item) => item.section === "operations");

  return (
    <aside className="border-b border-line bg-surface p-4 lg:border-r lg:border-b-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight text-slate-900">Neredeservis</div>
          <div className="text-xs text-muted">Panel shell</div>
        </div>
        <EnvBadge />
      </div>

      <div className="space-y-5">
        <SidebarNavSection title="Core" items={coreItems} pathname={pathname} />
        <SidebarNavSection title="Operations" items={operationItems} pathname={pathname} />
      </div>

      <ActiveCompanySidebarCard />

      <div className="mt-4 rounded-2xl border border-line bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Faz 2</div>
        <div className="mt-1 text-sm font-medium text-slate-900">
          Company operasyon ekranlari canli
        </div>
        <div className="mt-2 text-xs leading-5 text-muted">
          Drivers, Vehicles, Routes ve Live Ops read-side dilimleri aktif. Sonraki adim detail
          davranislarini Faz 2 kapanisinda stabilize etmek.
        </div>
      </div>
    </aside>
  );
}
