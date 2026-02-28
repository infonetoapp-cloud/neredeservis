"use client";

import type { CompanyMemberSummary } from "@/features/company/company-types";

type Props = {
  membersLoadStatus: "idle" | "loading" | "success" | "error";
  activeMembers: readonly CompanyMemberSummary[];
  authorizedDriverIds: readonly string[];
  onToggleMember: (memberUid: string, checked: boolean) => void;
};

function roleLabel(role: CompanyMemberSummary["role"]): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "dispatcher":
      return "Dispatcher";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}

export function RouteAuthorizedMembersFieldset({
  membersLoadStatus,
  activeMembers,
  authorizedDriverIds,
  onToggleMember,
}: Props) {
  return (
    <div className="space-y-2 rounded-xl border border-line bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-800">Yetkili Uye/Surucu (MVP)</div>
          <div className="text-[11px] text-slate-500">
            Toggle islemleri `grant/revokeDriverRoutePermissions` mutasyonlarina donusturulur.
          </div>
        </div>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {membersLoadStatus}
        </span>
      </div>

      {membersLoadStatus === "loading" ? (
        <p className="text-xs text-slate-500">Uyeler yukleniyor...</p>
      ) : membersLoadStatus === "error" ? (
        <p className="text-xs text-amber-700">
          Uye listesi yuklenemedi. Diger route alanlarini yine de guncelleyebilirsin.
        </p>
      ) : activeMembers.length === 0 ? (
        <p className="text-xs text-slate-500">
          Aktif uye listesi bos. Bu dilimde authorizedDriverIds bos liste olarak kaydedilebilir.
        </p>
      ) : (
        <div className="grid gap-2">
          {activeMembers.map((member) => {
            const checked = authorizedDriverIds.includes(member.uid);
            return (
              <label
                key={member.uid}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{member.displayName}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {roleLabel(member.role)} - {member.email ?? member.phone ?? member.uid}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onToggleMember(member.uid, event.target.checked)}
                  className="h-4 w-4 rounded border-line"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
