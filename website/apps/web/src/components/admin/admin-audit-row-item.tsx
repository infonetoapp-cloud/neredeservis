"use client";

import Link from "next/link";
import { useState } from "react";

import {
  buildAuditTargetHref,
  toAuditEventLabel,
  toAuditStatusLabel,
  toAuditTargetLabel,
} from "@/components/admin/admin-audit-panel-helpers";
import { formatLoadTime } from "@/components/admin/admin-operations-helpers";
import type { CompanyAuditLogSummary } from "@/features/company/company-audit-callables";

type AdminAuditRowItemProps = {
  item: CompanyAuditLogSummary;
  forcedExpanded?: boolean;
};

function toRelativeTimeLabel(isoTimestamp: string | null): string | null {
  if (!isoTimestamp) return null;
  const parsed = Date.parse(isoTimestamp);
  if (Number.isNaN(parsed)) return null;
  const diffMs = Date.now() - parsed;
  if (diffMs < 0) return "simdi";
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return "az once";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} dk once`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat once`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gun once`;
}

export function AdminAuditRowItem({ item, forcedExpanded = false }: AdminAuditRowItemProps) {
  const targetHref = buildAuditTargetHref(item.targetType, item.targetId);
  const [idCopied, setIdCopied] = useState(false);
  const [rawCopied, setRawCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(forcedExpanded);
  const shortAuditId = item.auditId.length > 14 ? `${item.auditId.slice(0, 14)}...` : item.auditId;
  const reasonPreview =
    item.reason && item.reason.length > 96 ? `${item.reason.slice(0, 96)}...` : item.reason;
  const relativeTime = toRelativeTimeLabel(item.createdAt);

  const copyAuditId = async () => {
    try {
      await navigator.clipboard.writeText(item.auditId);
      setIdCopied(true);
      window.setTimeout(() => {
        setIdCopied(false);
      }, 1400);
    } catch {
      setIdCopied(false);
    }
  };

  const copyRawItem = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
      setRawCopied(true);
      window.setTimeout(() => {
        setRawCopied(false);
      }, 1400);
    } catch {
      setRawCopied(false);
    }
  };

  const copyItemLink = async () => {
    const params = new URLSearchParams(window.location.search);
    params.set("auditId", item.auditId);
    const queryString = params.toString();
    const fullUrl = queryString.length > 0 ? `${window.location.origin}/admin?${queryString}` : `${window.location.origin}/admin`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setLinkCopied(true);
      window.setTimeout(() => {
        setLinkCopied(false);
      }, 1400);
    } catch {
      setLinkCopied(false);
    }
  };

  const navigateToAuditFilter = (input: {
    auditEvent?: string | null;
    auditTarget?: string | null;
  }) => {
    const params = new URLSearchParams(window.location.search);
    if (input.auditEvent !== undefined) {
      if (input.auditEvent) {
        params.set("auditEvent", input.auditEvent);
      } else {
        params.delete("auditEvent");
      }
    }
    if (input.auditTarget !== undefined) {
      if (input.auditTarget) {
        params.set("auditTarget", input.auditTarget);
      } else {
        params.delete("auditTarget");
      }
    }

    const queryString = params.toString();
    const href = queryString.length > 0 ? `/admin?${queryString}` : "/admin";
    window.location.assign(href);
  };

  return (
    <div
      className={`rounded-xl border bg-white px-3 py-2 ${
        forcedExpanded ? "border-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold text-slate-900">{toAuditEventLabel(item.eventType)}</div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            item.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : item.status === "denied"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toAuditStatusLabel(item.status)}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {toAuditTargetLabel(item.targetType)}: {item.targetId ?? "-"} | actor: {item.actorUid ?? "-"}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {formatLoadTime(item.createdAt)}
        {relativeTime ? ` (${relativeTime})` : ""}
        {reasonPreview ? (
          <>
            {" "}
            | reason:{" "}
            <span title={item.reason ?? undefined} className="text-slate-700">
              {reasonPreview}
            </span>
          </>
        ) : null}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        auditId:{" "}
        <span className="font-mono text-[10px] text-slate-700" title={item.auditId}>
          {shortAuditId}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            navigateToAuditFilter({ auditEvent: item.eventType });
          }}
          className="inline-flex rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          Evente Gore Filtrele
        </button>
        {item.targetType ? (
          <button
            type="button"
            onClick={() => {
              navigateToAuditFilter({ auditTarget: item.targetType });
            }}
            className="inline-flex rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            Hedefe Gore Filtrele
          </button>
        ) : null}
        {targetHref ? (
          <Link
            href={targetHref}
            className="inline-flex rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            Hedefe Git
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => {
            void copyAuditId();
          }}
          className="inline-flex rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          {idCopied ? "ID Kopyalandi" : "Audit ID Kopyala"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowDetails((prev) => !prev);
          }}
          className="inline-flex rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          {showDetails ? "Detayi Gizle" : "Detayi Ac"}
        </button>
        <button
          type="button"
          onClick={() => {
            void copyItemLink();
          }}
          className="inline-flex rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          {linkCopied ? "Kayit Linki Kopyalandi" : "Kayit Linki Kopyala"}
        </button>
      </div>
      {showDetails ? (
        <div className="mt-2 rounded-lg border border-line bg-slate-50 p-2 text-[11px] text-slate-700">
          <div>
            <span className="font-semibold">eventType(raw): </span>
            <span className="font-mono">{item.eventType}</span>
          </div>
          <div>
            <span className="font-semibold">targetType(raw): </span>
            <span className="font-mono">{item.targetType ?? "-"}</span>
          </div>
          <div>
            <span className="font-semibold">status(raw): </span>
            <span className="font-mono">{item.status}</span>
          </div>
          <div>
            <span className="font-semibold">actorUid(raw): </span>
            <span className="font-mono">{item.actorUid ?? "-"}</span>
          </div>
          <div>
            <span className="font-semibold">createdAt(raw): </span>
            <span className="font-mono">{item.createdAt ?? "-"}</span>
          </div>
          <div className="mt-1 break-all">
            <span className="font-semibold">reason(full): </span>
            <span>{item.reason ?? "-"}</span>
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                void copyRawItem();
              }}
              className="inline-flex rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              {rawCopied ? "Ham Kayit Kopyalandi" : "Ham Kaydi Kopyala"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
