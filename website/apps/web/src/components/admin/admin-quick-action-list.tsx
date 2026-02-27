"use client";

import Link from "next/link";

import type { AdminQuickAction } from "@/components/admin/admin-operations-helpers";

type AdminQuickActionListProps = {
  items: AdminQuickAction[];
  badgeCountByHref?: Record<string, number>;
};

export function AdminQuickActionList({
  items,
  badgeCountByHref,
}: AdminQuickActionListProps) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => {
        const hasMetric = Object.prototype.hasOwnProperty.call(
          badgeCountByHref ?? {},
          item.href,
        );
        const badgeCount = badgeCountByHref?.[item.href] ?? 0;
        const showBadge = hasMetric;
        const isDisabled = hasMetric && badgeCount === 0;
        const isAdminQueryAction = item.href.startsWith("/admin?");

        const content = (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">{item.label}</div>
              {showBadge ? (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    isDisabled
                      ? "border-slate-200 bg-slate-50 text-slate-600"
                      : "border-blue-200 bg-blue-50 text-blue-800"
                  }`}
                >
                  {badgeCount}
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-muted">
              {item.hint}
              {isDisabled ? " (su an kayit yok)" : ""}
            </div>
          </>
        );

        if (isDisabled) {
          return (
            <div
              key={item.href}
              className="cursor-not-allowed rounded-xl border border-line bg-slate-50 p-3 opacity-80"
              aria-disabled="true"
              title="Bu aksiyon icin su an kayit bulunmuyor."
            >
              {content}
            </div>
          );
        }

        if (isAdminQueryAction) {
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => {
                window.location.assign(item.href);
              }}
              className="block w-full rounded-xl border border-line bg-white p-3 text-left transition hover:bg-slate-50"
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl border border-line bg-white p-3 transition hover:bg-slate-50"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
