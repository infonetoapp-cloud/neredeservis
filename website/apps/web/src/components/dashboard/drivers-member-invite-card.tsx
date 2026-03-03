"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  inviteCompanyMemberCallable,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callables";
import { canManageCompanyMembers } from "@/features/company/company-rbac";
import type {
  CompanyMemberRole,
  CompanyMemberStatus,
  InviteCompanyMemberRole,
} from "@/features/company/company-types";

type DriversMemberInviteCardProps = {
  companyId: string | null;
  actorRole: CompanyMemberRole | null;
  actorMemberStatus: CompanyMemberStatus | null;
  onInvited: () => Promise<void> | void;
};

export function DriversMemberInviteCard({
  companyId,
  actorRole,
  actorMemberStatus,
  onInvited,
}: DriversMemberInviteCardProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteCompanyMemberRole>("dispatcher");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const memberInviteEnabled = canManageCompanyMembers(actorRole, actorMemberStatus);
  const normalizedEmail = email.trim().toLowerCase();
  const showEmailValidation = normalizedEmail.length > 0;
  const emailLooksValid =
    normalizedEmail.length > 5 && normalizedEmail.includes("@") && normalizedEmail.includes(".");
  const adminInviteBlockedForAdminActor = actorRole === "admin" && role === "admin";
  const emailInputClassName = showEmailValidation && !emailLooksValid
    ? "w-full rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-rose-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    : "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  const canSubmit = Boolean(companyId) && memberInviteEnabled && emailLooksValid && !pending;
  const submitBlocked = !canSubmit || adminInviteBlockedForAdminActor;

  const guardMessage = useMemo(() => {
    if (!companyId) {
      return "Aktif firma seçimi olmadan davet başlatılamaz.";
    }
    if (!memberInviteEnabled) {
      return "Davet için aktif yönetici üyeliği gerekir.";
    }
    if (adminInviteBlockedForAdminActor) {
      return "Yönetici rolü yalnızca dispeçer/gözlemci davet edebilir.";
    }
    return null;
  }, [adminInviteBlockedForAdminActor, companyId, memberInviteEnabled]);
  const submitDisabledReason = submitBlocked
    ? guardMessage ?? (!emailLooksValid ? "Geçerli bir e-posta adresi girin." : pending ? "İşlem devam ediyor." : null)
    : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId || submitBlocked) return;

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const invited = await inviteCompanyMemberCallable({
        companyId,
        email: normalizedEmail,
        role,
      });
      setEmail("");
      setSuccessMessage(
        `Davet acildi: ${invited.invitedEmail} (${invited.role}) - son tarih ${new Date(
          invited.expiresAt,
        ).toLocaleDateString("tr-TR")}`,
      );
      await onInvited();
    } catch (error) {
      setErrorMessage(mapCompanyCallableErrorToMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 text-[13px] font-semibold text-slate-900">Üye Davet Et</div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">E-posta</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setEmail((current) => current.trim().toLowerCase())}
            disabled={!companyId || !memberInviteEnabled || pending}
            placeholder="uye@firma.com"
            aria-invalid={showEmailValidation && !emailLooksValid}
            className={emailInputClassName}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Davet Rolu</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as InviteCompanyMemberRole)}
            disabled={!companyId || !memberInviteEnabled || pending}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="admin">Yönetici</option>
            <option value="dispatcher">Dispeçer</option>
            <option value="viewer">Gözlemci</option>
          </select>
        </label>

        {showEmailValidation && !emailLooksValid ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Geçerli bir e-posta adresi girin.
          </div>
        ) : null}
        {guardMessage ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {guardMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
          >
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
          >
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitBlocked}
          title={submitDisabledReason ?? undefined}
          className="w-full rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Davet açılıyor…" : "Davet Gönder"}
        </button>
      </form>
    </div>
  );
}
