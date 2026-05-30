"use client";

import type { CompanyMemberRole } from "@/features/company/company-client";

import { ROLE_LABELS } from "./member-ui-helpers";

type Props = {
  actorRole: CompanyMemberRole | null;
  inviteEmail: string;
  inviteRole: CompanyMemberRole;
  invitePending: boolean;
  canInvite: boolean;
  inviteRoleOptions: CompanyMemberRole[];
  onSetInviteEmail: (value: string) => void;
  onSetInviteRole: (role: CompanyMemberRole) => void;
  onInvite: () => void;
};

export function InviteMemberSection({
  actorRole,
  inviteEmail,
  inviteRole,
  invitePending,
  canInvite,
  inviteRoleOptions,
  onSetInviteEmail,
  onSetInviteRole,
  onInvite,
}: Props) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Uye davet et (Email ile)</div>
      <p className="mb-3 text-xs text-muted">
        Davet once bekleyen duruma duser. Kabul edildiginde uye aktif olarak sisteme eklenir.
      </p>
      {actorRole === "admin" ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Admin rolu sadece Dispatcher ve Viewer rollerine davet gonderebilir.
        </div>
      ) : null}
      {inviteRoleOptions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          Bu rolde uye daveti acik degil. Davet islemleri için owner/admin yetkisi gerekir.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-[1fr_180px_120px]">
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => onSetInviteEmail(event.target.value)}
            placeholder="ornek@firma.com"
            className="glass-input w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none"
          />
          <select
            value={inviteRole}
            onChange={(event) => onSetInviteRole(event.target.value as CompanyMemberRole)}
            className="glass-input w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none"
          >
            {inviteRoleOptions.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <button
                type="button"
                onClick={onInvite}
                disabled={!canInvite}
                className="glass-button-primary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {invitePending ? "Gonderiliyor..." : "Davet gonder"}
              </button>
            </div>
          )}
    </div>
  );
}

