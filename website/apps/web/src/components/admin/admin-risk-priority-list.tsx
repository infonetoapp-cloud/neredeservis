"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { riskCardToneClass } from "@/components/admin/admin-operations-helpers";

type AdminRiskPriorityItem = {
  id: string;
  severity: "warning" | "attention" | "info";
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

type AdminRiskPriorityListProps = {
  visibleItems: AdminRiskPriorityItem[];
  totalItems: number;
  riskModeLabel: string;
};

export function AdminRiskPriorityList({
  visibleItems,
  totalItems,
  riskModeLabel,
}: AdminRiskPriorityListProps) {
  const router = useRouter();

  return (
    <>
      <div className="mt-2 rounded-xl border border-line bg-white px-3 py-2 text-[11px] text-slate-600">
        Gorunen risk: <span className="font-semibold text-slate-900">{visibleItems.length}</span> /{" "}
        <span className="font-semibold text-slate-900">{totalItems}</span>
        <span className="mx-2 text-slate-300">|</span>
        Mod: <span className="font-semibold text-slate-900">{riskModeLabel}</span>
      </div>
      {visibleItems.length === 0 ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          {totalItems === 0
            ? "Simdilik kritik risk gorunmuyor."
            : "Secili severity filtresi icin risk kaydi bulunmuyor."}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {visibleItems.map((risk) =>
            risk.href.startsWith("/admin?") ? (
              <button
                key={risk.id}
                type="button"
                onClick={() => {
                  router.push(risk.href);
                }}
                className={`block w-full rounded-xl border px-3 py-2 text-left transition ${riskCardToneClass(
                  risk.severity,
                )}`}
              >
                <div className="text-sm font-semibold text-slate-900">{risk.title}</div>
                <div className="mt-1 text-xs text-muted">{risk.description}</div>
                <div className="mt-1 text-[11px] font-semibold text-slate-700">{risk.ctaLabel}</div>
              </button>
            ) : (
              <Link
                key={risk.id}
                href={risk.href}
                className={`block rounded-xl border px-3 py-2 transition ${riskCardToneClass(risk.severity)}`}
              >
                <div className="text-sm font-semibold text-slate-900">{risk.title}</div>
                <div className="mt-1 text-xs text-muted">{risk.description}</div>
                <div className="mt-1 text-[11px] font-semibold text-slate-700">{risk.ctaLabel}</div>
              </Link>
            ),
          )}
        </div>
      )}
    </>
  );
}
