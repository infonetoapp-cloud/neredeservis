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
import { resolveAdminCorsAllowlistValues } from "@/components/admin/admin-phase5-readiness-helpers";

type AllowItem = {
  id: string;
  label: string;
};

const STORAGE_KEY = ADMIN_STORAGE_KEYS.cors;

function resolveAllowlist(): AllowItem[] {
  const origin = typeof window !== "undefined" ? window.location.origin : null;
  return resolveAdminCorsAllowlistValues(origin).map((value) => ({
    id: value,
    label: value,
  }));
}

function persist(next: Set<string>): string | null {
  const state = persistAdminChecklistStorageState(STORAGE_KEY, next);
  emitAdminStorageSync(STORAGE_KEY);
  return state.updatedAt;
}

export function AdminCorsAllowlistCard() {
  const [storedBoot] = useState(() => readAdminChecklistStorageState(STORAGE_KEY));
  const [checked, setChecked] = useState<Set<string>>(() => new Set(storedBoot.checked));
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => storedBoot.updatedAt ?? null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [supportsClipboard] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
  );

  const allowlist = useMemo(() => resolveAllowlist(), []);

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
    const selected = allowlist.filter((item) => checked.has(item.id)).map((item) => item.label);
    const payload = buildAdminCopyPayload({
      title: "CORS Allow-list",
      env: getPublicAppEnv(),
      updatedAt,
      bodyLines: [
        `Secili: ${selected.length}/${allowlist.length}`,
        "Liste:",
        ...(selected.length > 0 ? selected : ["-"]),
      ],
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setCopyStatus("CORS allow-list kopyalandi.");
      window.setTimeout(() => setCopied(false), 1500);
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section id="phase5-cors-allowlist" className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">CORS / Origin Allow-list</div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!supportsClipboard}
          title={supportsClipboard ? "CORS allow-listi panoya kopyala" : "Tarayici panoya kopyalamayi desteklemiyor"}
          className={[
            "rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600",
            supportsClipboard ? "" : "cursor-not-allowed opacity-50",
          ].join(" ")}
        >
          {copied ? "Kopyalandi" : "Listeyi kopyala"}
        </button>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {copyStatus}
      </div>
      <p className="text-xs text-muted">
        Firebase callable ve panel domainleri için allow-list doğrulama listesi. Isaretler lokal
        saklanir.
      </p>
      <div className="mt-3 space-y-2">
        {allowlist.map((item) => (
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
      <div className="mt-3 text-[11px] text-muted">
        Ortam: {getPublicAppEnv()} | Secili: {checked.size}/{allowlist.length}
      </div>
      <div className="mt-1 text-[11px] text-muted">
        Son guncelleme:{" "}
        {formatAdminDateTime(updatedAt)}
      </div>
    </section>
  );
}

