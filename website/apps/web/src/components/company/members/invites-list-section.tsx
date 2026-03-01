"use client";

import type { CompanyInviteItem } from "@/features/company/company-client";

import {
  formatUid,
  getInviteStatusTone,
  INVITE_STATUS_LABELS,
  ROLE_LABELS,
} from "./member-ui-helpers";

type Props = {
  invites: CompanyInviteItem[] | null;
  sortedInvites: CompanyInviteItem[];
  revokingInviteId: string | null;
  onRevokeInvite: (inviteId: string) => void;
};

export function InvitesListSection({
  invites,
  sortedInvites,
  revokingInviteId,
  onRevokeInvite,
}: Props) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-900">Davetler</div>
      {!invites ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Davet listesi yukleniyor...
        </div>
      ) : sortedInvites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
          Bekleyen davet bulunamadi.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedInvites.map((invite) => (
            <article key={invite.inviteId} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{invite.email}</div>
                  <div className="mt-1 text-xs text-muted">
                    rol: {ROLE_LABELS[invite.role]}
                    {invite.targetUid ? ` | hedef hesap: ${formatUid(invite.targetUid)}` : ""}
                  </div>
                </div>
                <div
                  className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getInviteStatusTone(invite.status)}`}
                >
                  {INVITE_STATUS_LABELS[invite.status]}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end">
                {invite.status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => onRevokeInvite(invite.inviteId)}
                    disabled={revokingInviteId === invite.inviteId}
                    className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {revokingInviteId === invite.inviteId ? "Iptal ediliyor..." : "Daveti iptal et"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
