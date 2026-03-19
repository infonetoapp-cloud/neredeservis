"use client";

import { AdminAuditRowItem } from "@/components/admin/admin-audit-row-item";
import type { AdminAuditDensity } from "@/components/admin/use-admin-audit-density";
import type { CompanyAuditLogSummary } from "@/features/company/company-audit-callables";

type AuditLoadStatus = "idle" | "loading" | "success" | "error";

type AdminAuditListSectionProps = {
  status: AuditLoadStatus;
  filteredCount: number;
  pagedItems: CompanyAuditLogSummary[];
  totalSortedCount: number;
  auditActionableOnly: boolean;
  density: AdminAuditDensity;
  canLoadMore: boolean;
  pinnedAuditId: string | null;
  onLoadMore: () => void;
};

export function AdminAuditListSection({
  status,
  filteredCount,
  pagedItems,
  totalSortedCount,
  auditActionableOnly,
  density,
  canLoadMore,
  pinnedAuditId,
  onLoadMore,
}: AdminAuditListSectionProps) {
  if (filteredCount === 0) {
    return (
      <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted">
        {status === "loading"
          ? "Audit kayitlari yukleniyor..."
          : status === "error"
          ? "Audit servisine erisilemedigi için kayıt listelenemiyor."
          : auditActionableOnly
          ? "Secili filtrede aksiyona donusebilir audit kaydi bulunmuyor."
          : "Secili filtre için audit kaydi bulunmuyor."}
      </div>
    );
  }

  return (
    <div className={density === "compact" ? "mt-2 space-y-1.5" : "mt-3 space-y-2"}>
      <div
        className={`rounded-xl border border-line bg-slate-50 text-[11px] text-slate-600 ${
          density === "compact" ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
      >
        Gosterilen: <span className="font-semibold text-slate-900">{pagedItems.length}</span> /{" "}
        <span className="font-semibold text-slate-900">{totalSortedCount}</span>
        {auditActionableOnly ? (
          <>
            <span className="mx-2 text-slate-300">|</span>
            Mod: <span className="font-semibold text-slate-900">Aksiyonlanabilir</span>
          </>
        ) : null}
      </div>
      {pagedItems.map((item) => (
        <AdminAuditRowItem
          key={`${item.auditId}:${pinnedAuditId === item.auditId ? "forced" : "default"}`}
          item={item}
          density={density}
          forcedExpanded={pinnedAuditId !== null && item.auditId === pinnedAuditId}
        />
      ))}
      {canLoadMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Daha Fazla Kayıt Yükle
        </button>
      ) : null}
    </div>
  );
}

