"use client";

import type { Dispatch, SetStateAction } from "react";

import type { CompanyMemberItem, CompanyMemberRole } from "@/features/company/company-client";

import {
  formatUid,
  getEditableRoleOptions,
  getRoleLockReason,
  MEMBER_STATUS_LABELS,
  ROLE_LABELS,
} from "./member-ui-helpers";

type Props = {
  members: CompanyMemberItem[] | null;
  sortedMembers: CompanyMemberItem[];
  actorRole: CompanyMemberRole | null;
  draftRoles: Record<string, CompanyMemberRole>;
  savingUid: string | null;
  errorMessage: string | null;
  successMessage: string | null;
  onRefresh: () => void;
  onSaveRole: (uid: string) => void;
  setDraftRoles: Dispatch<SetStateAction<Record<string, CompanyMemberRole>>>;
};

export function MemberListSection({
  members,
  sortedMembers,
  actorRole,
  draftRoles,
  savingUid,
  errorMessage,
  successMessage,
  onRefresh,
  onSaveRole,
  setDraftRoles,
}: Props) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Uye listesi</div>
        <button
          type="button"
          onClick={onRefresh}
          className="glass-button rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
        >
          Yenile
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {!members ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Uye listesi yukleniyor...
        </div>
      ) : sortedMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Bu sirkette uye kaydi bulunamadi.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedMembers.map((member) => {
            const roleDraft = draftRoles[member.uid] ?? member.role;
            const allowedRoleOptions = getEditableRoleOptions(actorRole, member.role);
            const resolvedRoleDraft = allowedRoleOptions.includes(roleDraft)
              ? roleDraft
              : (allowedRoleOptions[0] ?? member.role);
            const roleEditDisabled =
              allowedRoleOptions.length === 0 ||
              (allowedRoleOptions.length === 1 && allowedRoleOptions[0] === member.role);
            const canEditRole = !roleEditDisabled;
            const roleLockReason = getRoleLockReason(actorRole, member.role, allowedRoleOptions);
            const updatedAtLabel = member.updatedAt
              ? new Date(member.updatedAt).toLocaleString("tr-TR")
              : "-";

            return (
              <article
                key={member.uid}
                className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_160px_130px]"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900" title={member.uid}>
                    {formatUid(member.uid)}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    rol: {ROLE_LABELS[member.role]} | durum: {MEMBER_STATUS_LABELS[member.status]} |
                    guncelleme: {updatedAtLabel}
                  </div>
                </div>
                {canEditRole ? (
                  <>
                    <select
                      value={resolvedRoleDraft}
                      onChange={(event) =>
                        setDraftRoles((prev) => ({
                          ...prev,
                          [member.uid]: event.target.value as CompanyMemberRole,
                        }))
                      }
                      className="glass-input w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                    >
                      {allowedRoleOptions.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onSaveRole(member.uid)}
                      disabled={savingUid === member.uid || resolvedRoleDraft === member.role}
                      className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingUid === member.uid ? "Kaydediliyor..." : "Rolu kaydet"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                      rol: {ROLE_LABELS[member.role]}
                    </div>
                    <div className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {roleLockReason}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
