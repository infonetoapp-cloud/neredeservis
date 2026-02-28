"use client";

import { useMemo, useState } from "react";

import {
  formatLoadTime,
  toBillingStatusLabel,
  toCompanyStatusLabel,
} from "@/components/admin/admin-operations-helpers";
import { mapCompanyCallableErrorToMessage } from "@/features/company/company-callable-error-messages";
import {
  type CompanyAdminTenantState,
  updateCompanyAdminTenantStateCallable,
} from "@/features/company/company-audit-callables";

type AdminTenantStateMutationCardProps = {
  companyId: string | null;
  tenantState: CompanyAdminTenantState | null;
  enabled: boolean;
  onUpdated: () => Promise<void> | void;
};

type SaveState = "idle" | "saving" | "success" | "error";

function toDateTimeLocalValue(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const shifted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function AdminTenantStateMutationCard({
  companyId,
  tenantState,
  enabled,
  onUpdated,
}: AdminTenantStateMutationCardProps) {
  const [companyStatusPatch, setCompanyStatusPatch] = useState<"" | "active" | "suspended" | "archived">("");
  const [billingStatusPatch, setBillingStatusPatch] = useState<"" | "active" | "past_due" | "suspended_locked">("");
  const [billingValidUntilMode, setBillingValidUntilMode] = useState<"keep" | "set" | "clear">("keep");
  const [billingValidUntilLocal, setBillingValidUntilLocal] = useState("");
  const [reason, setReason] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const canSubmit = enabled && Boolean(companyId) && saveState !== "saving";

  const currentBillingValidUntilLocal = useMemo(
    () => toDateTimeLocalValue(tenantState?.billingValidUntil ?? null),
    [tenantState?.billingValidUntil],
  );

  const handleApplyCurrentDateTime = () => {
    setBillingValidUntilLocal(currentBillingValidUntilLocal);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !companyId) return;

    const patch: {
      companyStatus?: "active" | "suspended" | "archived";
      billingStatus?: "active" | "past_due" | "suspended_locked";
      billingValidUntil?: string | null;
      reason?: string;
    } = {};

    if (companyStatusPatch) {
      patch.companyStatus = companyStatusPatch;
    }
    if (billingStatusPatch) {
      patch.billingStatus = billingStatusPatch;
    }
    if (billingValidUntilMode === "clear") {
      patch.billingValidUntil = null;
    }
    if (billingValidUntilMode === "set") {
      if (!billingValidUntilLocal) {
        setSaveState("error");
        setFeedback("Billing Valid Until icin tarih/saat secin.");
        return;
      }
      const parsed = new Date(billingValidUntilLocal);
      if (Number.isNaN(parsed.getTime())) {
        setSaveState("error");
        setFeedback("Billing Valid Until tarihi gecersiz.");
        return;
      }
      patch.billingValidUntil = parsed.toISOString();
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length > 0) {
      patch.reason = trimmedReason;
    }

    if (Object.keys(patch).length === 0) {
      setSaveState("error");
      setFeedback("En az bir alan secmeden guncelleme yapilamaz.");
      return;
    }

    setSaveState("saving");
    setFeedback(null);
    try {
      const result = await updateCompanyAdminTenantStateCallable({
        companyId,
        patch,
      });
      setSaveState("success");
      setFeedback(
        `Tenant state guncellendi (${result.changedFields.join(", ")}). Son guncelleme: ${formatLoadTime(result.updatedAt)}`,
      );
      setCompanyStatusPatch("");
      setBillingStatusPatch("");
      setBillingValidUntilMode("keep");
      setReason("");
      await onUpdated();
    } catch (error) {
      setSaveState("error");
      setFeedback(mapCompanyCallableErrorToMessage(error));
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Tenant State Mutation (Admin)</h3>
      <p className="mt-1 text-xs text-muted">
        Company suspension ve billing lock degisiklikleri bu karttan yapilir. Bu aksiyon audit loga yazilir.
      </p>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-xs text-muted">
          <span>Company Status (opsiyonel)</span>
          <select
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-900"
            value={companyStatusPatch}
            onChange={(event) => {
              setCompanyStatusPatch(event.target.value as "" | "active" | "suspended" | "archived");
            }}
          >
            <option value="">Degistirme</option>
            <option value="active">Aktif</option>
            <option value="suspended">Askida</option>
            <option value="archived">Arsiv</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-muted">
          <span>Billing Status (opsiyonel)</span>
          <select
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-900"
            value={billingStatusPatch}
            onChange={(event) => {
              setBillingStatusPatch(event.target.value as "" | "active" | "past_due" | "suspended_locked");
            }}
          >
            <option value="">Degistirme</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="suspended_locked">Suspended Locked</option>
          </select>
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-white p-3">
        <div className="text-xs text-muted">Billing Valid Until</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            className={`rounded-full border px-2 py-1 ${billingValidUntilMode === "keep" ? "border-slate-300 bg-slate-100 text-slate-900" : "border-line bg-white text-muted"}`}
            onClick={() => setBillingValidUntilMode("keep")}
          >
            Keep
          </button>
          <button
            type="button"
            className={`rounded-full border px-2 py-1 ${billingValidUntilMode === "set" ? "border-slate-300 bg-slate-100 text-slate-900" : "border-line bg-white text-muted"}`}
            onClick={() => setBillingValidUntilMode("set")}
          >
            Set
          </button>
          <button
            type="button"
            className={`rounded-full border px-2 py-1 ${billingValidUntilMode === "clear" ? "border-slate-300 bg-slate-100 text-slate-900" : "border-line bg-white text-muted"}`}
            onClick={() => setBillingValidUntilMode("clear")}
          >
            Clear
          </button>
        </div>
        {billingValidUntilMode === "set" ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="datetime-local"
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-900"
              value={billingValidUntilLocal}
              onChange={(event) => setBillingValidUntilLocal(event.target.value)}
            />
            <button
              type="button"
              className="rounded-xl border border-line px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              onClick={handleApplyCurrentDateTime}
            >
              Mevcut Degeri Getir
            </button>
          </div>
        ) : null}
      </div>

      <label className="mt-3 block space-y-1 text-xs text-muted">
        <span>Reason (opsiyonel)</span>
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={240}
          placeholder="Ornek: pilot deneme lock / odeme gecikmesi"
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <div className="mt-3 rounded-xl border border-line bg-white p-3 text-xs text-muted">
        <div>Mevcut Company: {toCompanyStatusLabel(tenantState?.companyStatus ?? "unknown")}</div>
        <div>Mevcut Billing: {toBillingStatusLabel(tenantState?.billingStatus ?? "unknown")}</div>
        <div>Mevcut Valid Until: {tenantState?.billingValidUntil ? formatLoadTime(tenantState.billingValidUntil) : "-"}</div>
      </div>

      {feedback ? (
        <div
          className={`mt-3 rounded-xl border px-3 py-2 text-xs ${saveState === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
        >
          {feedback}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          void handleSubmit();
        }}
        className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveState === "saving" ? "Kaydediliyor..." : "Tenant Durumunu Guncelle"}
      </button>
    </section>
  );
}
