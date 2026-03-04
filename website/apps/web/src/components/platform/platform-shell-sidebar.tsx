"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EnvBadge } from "@/components/shared/env-badge";

type PlatformNavItem = {
  label: string;
  href: string;
  section: "yonetim" | "icerik" | "izleme";
};

const PLATFORM_NAV_ITEMS: readonly PlatformNavItem[] = [
  { label: "Sirketler", href: "/platform/companies", section: "yonetim" },
  { label: "Sirket Olustur", href: "/platform/companies/new", section: "yonetim" },
  { label: "Ana Sayfa CMS", href: "/platform/landing", section: "icerik" },
  { label: "Dashboard'a Don", href: "/dashboard", section: "izleme" },
];

function isItemActive(pathname: string, item: PlatformNavItem): boolean {
  if (item.href === "/platform/companies") {
    return pathname === "/platform/companies";
  }
  return pathname.startsWith(item.href);
}

function PlatformNavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: readonly PlatformNavItem[];
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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${commonClass} ${
                active
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{item.label}</span>
              {active ? (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" aria-hidden="true" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PlatformShellSidebar() {
  const pathname = usePathname() ?? "/platform/companies";

  const yonetimItems = PLATFORM_NAV_ITEMS.filter((item) => item.section === "yonetim");
  const icerikItems = PLATFORM_NAV_ITEMS.filter((item) => item.section === "icerik");
  const izlemeItems = PLATFORM_NAV_ITEMS.filter((item) => item.section === "izleme");

  return (
    <aside className="border-b border-line bg-surface p-4 lg:border-r lg:border-b-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight text-slate-900">NeredeServis</div>
          <div className="text-xs text-indigo-600 font-medium">Platform Yonetimi</div>
        </div>
        <EnvBadge />
      </div>

      <div className="space-y-5">
        <PlatformNavSection title="Yonetim" items={yonetimItems} pathname={pathname} />
        <PlatformNavSection title="Icerik" items={icerikItems} pathname={pathname} />
        <PlatformNavSection title="Gezinme" items={izlemeItems} pathname={pathname} />
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Platform Owner
        </div>
        <div className="mt-1 text-sm font-medium text-slate-900">
          SaaS Yonetim Paneli
        </div>
        <div className="mt-2 text-xs leading-5 text-muted">
          Sirket olusturma, arac limiti belirleme ve firma yonetimi islemleri.
        </div>
      </div>
    </aside>
  );
}
