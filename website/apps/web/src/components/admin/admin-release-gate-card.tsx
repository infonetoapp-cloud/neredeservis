"use client";

import { useMemo, useState } from "react";
import { getPublicAppEnv } from "@/lib/env/public-env";
import { buildAdminCopyPayload } from "@/components/admin/admin-copy-payload-helpers";
import {
  persistAdminChecklistStorageState,
  readAdminChecklistStorageState,
} from "@/components/admin/admin-checklist-storage-helpers";
import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";
import { emitAdminStorageSync, ADMIN_STORAGE_KEYS } from "@/components/admin/admin-local-storage-sync";

type GateItem = {
  id: string;
  label: string;
};

const STORAGE_KEY = ADMIN_STORAGE_KEYS.releaseGate;

const DEFAULT_ITEMS: GateItem[] = [
  { id: "build_green", label: "CI build/lint yesil" },
  { id: "auth_smoke", label: "Auth smoke (email + OAuth)" },
  { id: "live_ops_smoke", label: "Live ops smoke (liste+harita+detay)" },
  { id: "audit_smoke", label: "Audit read-side smoke" },
  { id: "staging_runbook", label: "Staging smoke runbook tamamlandi" },
  { id: "cors_allowlist", label: "CORS/origin allow-list dogru" },
  { id: "security_hardening", label: "Security hardening checklist onayli" },
  { id: "secret_hygiene", label: "Env/secret hygiene checklist onayli" },
  { id: "cost_alerts", label: "Cost alert / budget guard aktif" },
  { id: "rollback_ready", label: "Rollback referansi kayitli" },
];

function persistSet(next: Set<string>): string | null {
  const state = persistAdminChecklistStorageState(STORAGE_KEY, next);
  emitAdminStorageSync(STORAGE_KEY);
  return state.updatedAt;
}

export function AdminReleaseGateCard() {
  const [storedBoot] = useState(() => readAdminChecklistStorageState(STORAGE_KEY));
  const [checked, setChecked] = useState<Set<string>>(() => new Set(storedBoot.checked));
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => storedBoot.updatedAt ?? null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [supportsClipboard] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
  );

  const completedCount = useMemo(() => checked.size, [checked]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const nextUpdatedAt = persistSet(next);
      setUpdatedAt(nextUpdatedAt);
      return next;
    });
  };

  const handleCopy = async () => {
    if (!supportsClipboard || typeof navigator === "undefined" || !navigator.clipboard) return;
    const summary = DEFAULT_ITEMS.map((item) => {
      const mark = checked.has(item.id) ? "[x]" : "[ ]";
      return `${mark} ${item.label}`;
    });
    const payload = buildAdminCopyPayload({
      title: "Release Gate (Faz 5)",
      env: getPublicAppEnv(),
      updatedAt,
      bodyLines: summary,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setCopyStatus("Release gate listesi kopyalandi.");
      window.setTimeout(() => setCopied(false), 1500);
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section id="phase5-release-gate" className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Release Gate (Faz 5)</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {completedCount}/{DEFAULT_ITEMS.length}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!supportsClipboard}
            title={supportsClipboard ? "Release gate listesini panoya kopyala" : "Tarayici panoya kopyalamayi desteklemiyor"}
            className={[
              "rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600",
              supportsClipboard ? "" : "cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            {copied ? "Kopyalandi" : "Listeyi kopyala"}
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        Bu liste prod/pilot oncesi zorunlu kontrol adimlarini takip eder.
      </p>
      <div className="sr-only" role="status" aria-live="polite">
        {copyStatus}
      </div>
      <div className="mt-1 text-[11px] text-muted">
        Son guncelleme:{" "}
        {formatAdminDateTime(updatedAt)}
      </div>
      <div className="mt-3 space-y-2">
        {DEFAULT_ITEMS.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs text-slate-800"
          >
            <input
              type="checkbox"
              checked={checked.has(item.id)}
              onChange={() => toggle(item.id)}
              className="h-4 w-4 rounded border-line"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
