"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { memberStatusLabel, roleLabel } from "@/components/dashboard/drivers-company-members-helpers";
import {
  mapCompanyCallableErrorToMessage,
  removeCompanyMemberCallable,
  updateCompanyMemberCallable,
} from "@/features/company/company-callables";
import { canManageCompanyMembers } from "@/features/company/company-rbac";
import type {
  CompanyMemberRole,
  CompanyMemberStatus,
  CompanyMemberSummary,
} from "@/features/company/company-types";

type DriversMemberManagementCardProps = {
  companyId: string | null;
  actorUid: string | null;
  actorRole: CompanyMemberRole | null;
  actorMemberStatus: CompanyMemberStatus | null;
  selectedMember: CompanyMemberSummary | null;
  onMemberUpdated: () => Promise<void> | void;
  onMemberRemoved: () => Promise<void> | void;
};

export function DriversMemberManagementCard({
  companyId,
  actorUid,
  actorRole,
  actorMemberStatus,
  selectedMember,
  onMemberUpdated,
  onMemberRemoved,
}: DriversMemberManagementCardProps) {
  const [role, setRole] = useState<CompanyMemberRole>("viewer");
  const [memberStatus, setMemberStatus] = useState<CompanyMemberStatus>("active");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMember) {
      setRole("viewer");
      setMemberStatus("active");
      setErrorMessage(null);
      setSuccessMessage(null);
      return;
    }
    setRole(selectedMember.role);
    setMemberStatus(selectedMember.memberStatus);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [selectedMember]);

  const patch = useMemo(() => {
    if (!selectedMember) return null;
    const nextPatch: { role?: CompanyMemberRole; memberStatus?: CompanyMemberStatus } = {};
    if (role !== selectedMember.role) {
      nextPatch.role = role;
    }
    if (memberStatus !== selectedMember.memberStatus) {
      nextPatch.memberStatus = memberStatus;
    }
    return nextPatch;
  }, [memberStatus, role, selectedMember]);

  const patchFieldCount = patch ? Object.keys(patch).length : 0;
  const targetIsOwner = selectedMember?.role === "owner";
  const showOwnerOption = actorRole === "owner" || targetIsOwner;
  const selfSuspendAttempt = selectedMember?.uid === actorUid && memberStatus === "suspended";
  const selfRemoveAttempt = selectedMember?.uid === actorUid;
  const adminRemovingAdmin = actorRole === "admin" && selectedMember?.role === "admin";
  const memberManageEnabled = canManageCompanyMembers(actorRole, actorMemberStatus);
  const canSubmit =
    Boolean(companyId) &&
    Boolean(selectedMember) &&
    memberManageEnabled &&
    !targetIsOwner &&
    !selfSuspendAttempt &&
    patchFieldCount > 0 &&
    !pending;

  const guardMessage =
    !selectedMember
      ? "Üye seçildiğinde rol ve durum düzenleme açılır."
      : !companyId
        ? "Aktif firma seçimi gerekli."
        : !memberManageEnabled
          ? "Bu işlem için yönetici üyeliği gerekir."
          : targetIsOwner
            ? "Sahip üye bu panelden değiştirilemez."
            : patchFieldCount === 0
              ? "Değişiklik yapmak için rol veya durum seçin."
            : null;
  const saveDisabledReason = !canSubmit ? guardMessage ?? (pending ? "İşlem devam ediyor." : null) : null;

  const removeGuardMessage =
    !selectedMember
      ? "Üye seçildiğinde kaldırma seçeneği açılır."
      : !companyId
        ? "Aktif firma seçimi gerekli."
        : !memberManageEnabled
          ? "Bu işlem için sahip veya yönetici rolü gerekir."
          : targetIsOwner
            ? "Sahip üye çıkarılamaz."
            : selfRemoveAttempt
              ? "Kendi üyeliğinizi bu panelden kaldıramazsınız."
              : adminRemovingAdmin
                ? "Yönetici başka bir yöneticiyi çıkaramaz."
                : null;
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMember || !companyId) return;
    if (!canSubmit) return;
    if (!patch || Object.keys(patch).length === 0) return;

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateCompanyMemberCallable({
        companyId,
        memberUid: selectedMember.uid,
        patch,
      });
      setSuccessMessage("Üye bilgileri güncellendi.");
      await onMemberUpdated();
    } catch (error) {
      setErrorMessage(mapCompanyCallableErrorToMessage(error));
    } finally {
      setPending(false);
    }
  };

  const canRemove =
    Boolean(companyId) &&
    Boolean(selectedMember) &&
    memberManageEnabled &&
    !targetIsOwner &&
    !selfRemoveAttempt &&
    !adminRemovingAdmin &&
    !pending;
  const removeDisabledReason = !canRemove
    ? removeGuardMessage ?? (pending ? "İşlem devam ediyor." : null)
    : null;

  const handleRemove = async () => {
    if (!selectedMember || !companyId) return;
    if (!canRemove) return;
    const confirmed = window.confirm(
      `${selectedMember.displayName} üyeliği firmadan kaldırılacak. Devam etmek istiyor musun?`,
    );
    if (!confirmed) return;

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await removeCompanyMemberCallable({
        companyId,
        memberUid: selectedMember.uid,
      });
      setSuccessMessage("Üye firmadan çıkarıldı.");
      await onMemberRemoved();
    } catch (error) {
      setErrorMessage(mapCompanyCallableErrorToMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 text-[13px] font-semibold text-slate-900">Üye Ayarları</div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Rol</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as CompanyMemberRole)}
            disabled={!selectedMember || !memberManageEnabled || targetIsOwner || pending}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            {showOwnerOption ? <option value="owner">{roleLabel("owner")}</option> : null}
            <option value="admin">{roleLabel("admin")}</option>
            <option value="dispatcher">{roleLabel("dispatcher")}</option>
            <option value="viewer">{roleLabel("viewer")}</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">Durum</span>
          <select
            value={memberStatus}
            onChange={(event) => setMemberStatus(event.target.value as CompanyMemberStatus)}
            disabled={!selectedMember || !memberManageEnabled || targetIsOwner || pending}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="active">{memberStatusLabel("active")}</option>
            <option value="invited">{memberStatusLabel("invited")}</option>
            <option value="suspended">{memberStatusLabel("suspended")}</option>
          </select>
        </label>

        {selfSuspendAttempt ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Kendi hesabınızı askıya alamazsınız.
          </div>
        ) : null}
        {guardMessage ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
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
          disabled={!canSubmit}
          title={saveDisabledReason ?? undefined}
          className="w-full rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
        </button>
        {removeGuardMessage ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {removeGuardMessage}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void handleRemove()}
          disabled={!canRemove}
          title={removeDisabledReason ?? undefined}
          className="w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          {pending ? "İşleniyor…" : "Üyeyi Çıkar"}
        </button>
      </form>
    </div>
  );
}
