"use client";

import { useMemo, useState } from "react";
import { getPublicAppEnv } from "@/lib/env/public-env";
import { buildAdminCopyPayload } from "@/components/admin/admin-copy-payload-helpers";
import {
  persistAdminChecklistStorageWithExtras,
  readAdminChecklistStorageExtras,
  readAdminChecklistStorageState,
} from "@/components/admin/admin-checklist-storage-helpers";
import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";
import { emitAdminStorageSync, ADMIN_STORAGE_KEYS } from "@/components/admin/admin-local-storage-sync";

type SmokeItem = {
  id: string;
  label: string;
};

const DEFAULT_ITEMS: SmokeItem[] = [
  { id: "auth", label: "Auth smoke (Email + Google/Microsoft)" },
  { id: "role_guard", label: "Role/Mode guard smoke" },
  { id: "routes", label: "Routes + Stops smoke" },
  { id: "live_ops", label: "Live Ops list + map + detail smoke" },
  { id: "audit", label: "Audit log smoke (read-only)" },
  { id: "env", label: "Env badge + backend target dogru" },
];

const STORAGE_KEY = ADMIN_STORAGE_KEYS.smokeChecklist;

type StoredSmokeChecklist = {
  checked: string[];
  updatedAt: string | null;
  durationMinutes: string | null;
  targetMinutes: string | null;
  notes: string | null;
};

function readStoredChecklist(): StoredSmokeChecklist {
  const state = readAdminChecklistStorageState(STORAGE_KEY);
  const extras = readAdminChecklistStorageExtras(STORAGE_KEY);
  return {
    checked: state.checked,
    updatedAt: state.updatedAt,
    durationMinutes:
      typeof extras.durationMinutes === "string" ? extras.durationMinutes : null,
    targetMinutes: typeof extras.targetMinutes === "string" ? extras.targetMinutes : null,
    notes: typeof extras.notes === "string" ? extras.notes : null,
  };
}

function persistChecklist(
  next: Set<string>,
  durationMinutes: string | null,
  targetMinutes: string | null,
  notes: string | null,
) {
  const payload = persistAdminChecklistStorageWithExtras(STORAGE_KEY, next, {
    durationMinutes,
    targetMinutes,
    notes,
  });
  emitAdminStorageSync(STORAGE_KEY);
  return payload.updatedAt;
}

export function AdminSmokeChecklistCard() {
  const notesMax = 160;
  const [storedBoot] = useState<StoredSmokeChecklist>(() => readStoredChecklist());
  const [checked, setChecked] = useState<Set<string>>(() => new Set(storedBoot.checked));
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => storedBoot.updatedAt ?? null);
  const [durationMinutes, setDurationMinutes] = useState<string>(() => storedBoot.durationMinutes ?? "");
  const [targetMinutes, setTargetMinutes] = useState<string>(() => storedBoot.targetMinutes ?? "");
  const [notes, setNotes] = useState<string>(() => storedBoot.notes ?? "");
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [supportsClipboard] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
  );

  const completedCount = useMemo(() => checked.size, [checked]);
  const updatedAtLabel = useMemo(() => {
    return `Son guncelleme: ${formatAdminDateTime(updatedAt)}`;
  }, [updatedAt]);
  const noteUpdatedLabel = useMemo(() => {
    if (!notes.trim()) return "Notlar guncelleme: Not yok";
    return `Notlar guncelleme: ${formatAdminDateTime(updatedAt)}`;
  }, [notes, updatedAt]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const nextUpdatedAt = persistChecklist(
        next,
        durationMinutes.trim() ? durationMinutes.trim() : null,
        targetMinutes.trim() ? targetMinutes.trim() : null,
        notes.trim() ? notes.trim() : null,
      );
      setUpdatedAt(nextUpdatedAt);
      return next;
    });
  };

  const handleDurationChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setDurationMinutes(cleaned);
    const nextUpdatedAt = persistChecklist(
      checked,
      cleaned.trim() ? cleaned.trim() : null,
      targetMinutes.trim() ? targetMinutes.trim() : null,
      notes.trim() ? notes.trim() : null,
    );
    setUpdatedAt(nextUpdatedAt);
  };

  const handleTargetChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setTargetMinutes(cleaned);
    const nextUpdatedAt = persistChecklist(
      checked,
      durationMinutes.trim() ? durationMinutes.trim() : null,
      cleaned.trim() ? cleaned.trim() : null,
      notes.trim() ? notes.trim() : null,
    );
    setUpdatedAt(nextUpdatedAt);
  };

  const handleNotesChange = (value: string) => {
    const trimmed = value.slice(0, notesMax);
    setNotes(trimmed);
    const nextUpdatedAt = persistChecklist(
      checked,
      durationMinutes.trim() ? durationMinutes.trim() : null,
      targetMinutes.trim() ? targetMinutes.trim() : null,
      trimmed.trim() ? trimmed.trim() : null,
    );
    setUpdatedAt(nextUpdatedAt);
  };

  const handleCopy = async () => {
    if (!supportsClipboard || typeof navigator === "undefined" || !navigator.clipboard) return;
    const summary = DEFAULT_ITEMS.map((item) => {
      const mark = checked.has(item.id) ? "[x]" : "[ ]";
      return `${mark} ${item.label}`;
    });
    try {
      const durationLine = durationMinutes.trim()
        ? `Toplam süre (dk): ${durationMinutes.trim()}`
        : "Toplam süre (dk): -";
      const targetLine = targetMinutes.trim()
        ? `Hedef süre (dk): ${targetMinutes.trim()}`
        : "Hedef süre (dk): -";
      const notesLine = notes.trim()
        ? ["Notlar:", notes.trim()].join("\n")
        : "Notlar:\n-";
      const noteUpdatedLine = notes.trim() && updatedAt
        ? `Not guncelleme: ${formatAdminDateTime(updatedAt)}`
        : "Not guncelleme: -";
      const payload = buildAdminCopyPayload({
        title: "Staging Smoke Checklist",
        env: getPublicAppEnv(),
        updatedAt,
        bodyLines: [...summary, durationLine, targetLine, notesLine, noteUpdatedLine],
      });
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setCopyStatus("Smoke checklist kopyalandi.");
      window.setTimeout(() => setCopied(false), 1500);
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section id="phase5-smoke-checklist" className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Staging Smoke Checklist</div>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {completedCount}/{DEFAULT_ITEMS.length}
        </span>
      </div>
      <p className="text-xs text-muted">
        Bu liste Faz 5 release gate icindir. Tamamlanan adimlar lokal olarak isaretlenir.
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>{updatedAtLabel}</span>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!supportsClipboard}
          title={supportsClipboard ? "Smoke checklisti panoya kopyala" : "Tarayici panoya kopyalamayi desteklemiyor"}
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
      <div className="mt-1 text-[11px] text-muted">
        {noteUpdatedLabel}
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
      <div className="mt-3 grid gap-3 rounded-xl border border-line bg-white px-3 py-2 md:grid-cols-2">
        <label className="text-[11px] font-semibold text-slate-700" htmlFor="smoke-duration">
          Toplam süre (dk)
        </label>
        <input
          id="smoke-duration"
          inputMode="numeric"
          value={durationMinutes}
          onChange={(event) => handleDurationChange(event.target.value)}
          placeholder="ornek: 18"
          className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-xs text-slate-900"
        />
        <label className="text-[11px] font-semibold text-slate-700" htmlFor="smoke-target">
          Hedef süre (dk)
        </label>
        <input
          id="smoke-target"
          inputMode="numeric"
          value={targetMinutes}
          onChange={(event) => handleTargetChange(event.target.value)}
          placeholder="ornek: 12"
          className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-xs text-slate-900"
        />
      </div>
      <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold text-slate-700" htmlFor="smoke-notes">
            Notlar
          </label>
          <button
            type="button"
            onClick={() => handleNotesChange("")}
            className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          >
            Temizle
          </button>
        </div>
        <textarea
          id="smoke-notes"
          rows={3}
          value={notes}
          onChange={(event) => handleNotesChange(event.target.value)}
          placeholder="Kisa notlar (ops/bug/slow step)"
          className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2 text-xs text-slate-900"
        />
        <div className="mt-1 text-[11px] text-muted">
          {notes.length}/{notesMax}
        </div>
      </div>
    </section>
  );
}

