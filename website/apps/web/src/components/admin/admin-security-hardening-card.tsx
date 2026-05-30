"use client";

import { useMemo, useState } from "react";
import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";
import {
  persistAdminChecklistStorageState,
  readAdminChecklistStorageState,
} from "@/components/admin/admin-checklist-storage-helpers";
import { emitAdminStorageSync, ADMIN_STORAGE_KEYS } from "@/components/admin/admin-local-storage-sync";

type SecurityItem = {
  id: string;
  label: string;
};

const STORAGE_KEY = ADMIN_STORAGE_KEYS.security;

const DEFAULT_ITEMS: SecurityItem[] = [
  { id: "password_reset", label: "Password reset / email verification akislari kontrol edildi" },
  { id: "session_timeout", label: "Session timeout / re-auth davranisi dogrulandi" },
  { id: "2fa_plan", label: "2FA plan notu ve karar kaydi mevcut" },
  { id: "csp_baseline", label: "CSP baseline (Mapbox uyumlu) hazir" },
  { id: "secret_rotation", label: "Secret rotation proseduru notlandi" },
];

function readStored(): Set<string> {
  const state = readAdminChecklistStorageState(STORAGE_KEY);
  return new Set(state.checked);
}

function persist(next: Set<string>): string | null {
  const state = persistAdminChecklistStorageState(STORAGE_KEY, next);
  emitAdminStorageSync(STORAGE_KEY);
  return state.updatedAt;
}

export function AdminSecurityHardeningCard() {
  const [storedBoot] = useState(() => readAdminChecklistStorageState(STORAGE_KEY));
  const [checked, setChecked] = useState<Set<string>>(() => readStored());
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => storedBoot.updatedAt);

  const completedCount = useMemo(() => checked.size, [checked]);

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

  return (
    <section id="phase5-security-hardening" className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Security Hardening</div>
      <p className="text-xs text-muted">
        Faz 5 güvenlik sertlestirme adimlari. Checkler lokal kaydedilir.
      </p>
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
      <div className="mt-3 text-[11px] text-muted">
        Tamamlanan: {completedCount}/{DEFAULT_ITEMS.length}
      </div>
      <div className="mt-1 text-[11px] text-muted">
        Son guncelleme: {formatAdminDateTime(updatedAt)}
      </div>
    </section>
  );
}

