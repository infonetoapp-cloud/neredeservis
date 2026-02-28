"use client";

import { useMemo, useState } from "react";
import { buildAdminCopyPayload } from "@/components/admin/admin-copy-payload-helpers";
import {
  persistAdminChecklistStorageState,
  readAdminChecklistStorageState,
} from "@/components/admin/admin-checklist-storage-helpers";
import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";
import { emitAdminStorageSync, ADMIN_STORAGE_KEYS } from "@/components/admin/admin-local-storage-sync";
import { getPublicAppEnv } from "@/lib/env/public-env";

type RunbookStep = {
  id: string;
  label: string;
};

const STORAGE_KEY = ADMIN_STORAGE_KEYS.smokeRunbook;

const DEFAULT_STEPS: RunbookStep[] = [
  { id: "login", label: "Login + role/mode guard dogrula" },
  { id: "routes", label: "Routes/Stops CRUD smoke (liste->detay->guncelle)" },
  { id: "live_ops", label: "Live Ops: liste + harita + secili sefer" },
  { id: "audit", label: "Audit panel filtre + CSV indir" },
  { id: "admin", label: "Admin risk/tenant kartlari gorunur" },
];

function persist(next: Set<string>): string | null {
  const payload = persistAdminChecklistStorageState(STORAGE_KEY, next);
  emitAdminStorageSync(STORAGE_KEY);
  return payload.updatedAt;
}

export function AdminStagingSmokeRunbookCard() {
  const [storedBoot] = useState(() => readAdminChecklistStorageState(STORAGE_KEY));
  const [checked, setChecked] = useState<Set<string>>(() => new Set(storedBoot.checked));
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => storedBoot.updatedAt ?? null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [supportsClipboard] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
  );

  const completedCount = useMemo(() => checked.size, [checked]);
  const updatedAtLabel = useMemo(() => {
    return `Son guncelleme: ${formatAdminDateTime(updatedAt)}`;
  }, [updatedAt]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const nextUpdatedAt = persist(next);
      setUpdatedAt(nextUpdatedAt);
      return next;
    });
  };

  const handleCopy = async () => {
    if (!supportsClipboard || typeof navigator === "undefined" || !navigator.clipboard) return;
    const summaryLines = DEFAULT_STEPS.map((step) => {
      const mark = checked.has(step.id) ? "[x]" : "[ ]";
      return `${mark} ${step.label}`;
    });
    const payload = buildAdminCopyPayload({
      title: "Staging Smoke Runbook",
      env: getPublicAppEnv(),
      updatedAt,
      bodyLines: summaryLines,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setCopyStatus("Runbook kopyalandi.");
      window.setTimeout(() => setCopied(false), 1500);
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section id="phase5-smoke-runbook" className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Staging Smoke Runbook</div>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {completedCount}/{DEFAULT_STEPS.length}
        </span>
      </div>
      <p className="text-xs text-muted">
        Staging smoke suite icin adim adim kontrol listesi. Checkler lokal saklanir.
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>{updatedAtLabel}</span>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!supportsClipboard}
          title={supportsClipboard ? "Staging runbook raporunu panoya kopyala" : "Tarayici panoya kopyalamayi desteklemiyor"}
          className={[
            "rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600",
            supportsClipboard ? "" : "cursor-not-allowed opacity-50",
          ].join(" ")}
        >
          {copied ? "Kopyalandi" : "Runbook kopyala"}
        </button>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {copyStatus}
      </div>
      <div className="mt-3 space-y-2">
        {DEFAULT_STEPS.map((step) => (
          <label
            key={step.id}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs text-slate-800"
          >
            <input
              type="checkbox"
              checked={checked.has(step.id)}
              onChange={() => toggle(step.id)}
              className="h-4 w-4 rounded border-line"
            />
            <span>{step.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
