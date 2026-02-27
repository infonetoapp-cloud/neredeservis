"use client";

import { AdminAuditRowItem } from "@/components/admin/admin-audit-row-item";
import type { CompanyAuditLogSummary } from "@/features/company/company-audit-callables";

type AuditLoadStatus = "idle" | "loading" | "success" | "error";

type AdminAuditListSectionProps = {
  status: AuditLoadStatus;
  filteredCount: number;
  pagedItems: CompanyAuditLogSummary[];
  totalSortedCount: number;
  auditActionableOnly: boolean;
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
          ? "Audit servisine erisilemedigi icin kayit listelenemiyor."
          : auditActionableOnly
          ? "Secili filtrede aksiyona donusebilir audit kaydi bulunmuyor."
          : "Secili filtre icin audit kaydi bulunmuyor."}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
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
          forcedExpanded={pinnedAuditId !== null && item.auditId === pinnedAuditId}
        />
      ))}
      {canLoadMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Daha Fazla Kayit Yukle
        </button>
      ) : null}
    </div>
  );
}
