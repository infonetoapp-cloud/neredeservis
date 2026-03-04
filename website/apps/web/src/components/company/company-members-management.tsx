"use client";

import { useEffect, useMemo, useState } from "react";

import { useCompanyMembership } from "@/components/company/company-membership-context";
import {
  formatUid,
  getEditableRoleOptions,
  getInviteStatusTone,
  getInviteRoleOptions,
  getRoleLockReason,
  INVITE_STATUS_LABELS,
  MEMBER_STATUS_LABELS,
  ROLE_LABELS,
} from "@/components/company/members/member-ui-helpers";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  inviteCompanyMemberByEmailForCompany,
  listCompanyInvitesForCompany,
  listCompanyMembersForCompany,
  revokeCompanyInviteForCompany,
  setCompanyMemberRoleForCompany,
  type CompanyInviteItem,
  type CompanyMemberItem,
  type CompanyMemberRole,
} from "@/features/company/company-client";

type Props = {
  companyId: string;
};

type MemberFilter =
  | "all"
  | "active"
  | "invited"
  | "suspended"
  | "owner"
  | "admin"
  | "dispatcher"
  | "viewer";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "BULUNAMADI";
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return "BULUNAMADI";
  }
  return new Date(parsed).toLocaleString("tr-TR");
}

export function CompanyMembersManagement({ companyId }: Props) {
  const { status } = useAuthSession();
  const { memberRole: actorRole } = useCompanyMembership();
  const [members, setMembers] = useState<CompanyMemberItem[] | null>(null);
  const [invites, setInvites] = useState<CompanyInviteItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<CompanyMemberRole>("viewer");
  const [invitePending, setInvitePending] = useState<boolean>(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const [draftRoles, setDraftRoles] = useState<Record<string, CompanyMemberRole>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [selectedMemberUid, setSelectedMemberUid] = useState<string | null>(null);
  const [inviteSearchQuery, setInviteSearchQuery] = useState<string>("");
  const [pendingOnlyInvites, setPendingOnlyInvites] = useState<boolean>(true);

  useEffect(() => {
    if (status !== "signed_in") {
      return;
    }

    let cancelled = false;

    Promise.all([
      listCompanyMembersForCompany({ companyId, limit: 100 }),
      listCompanyInvitesForCompany({ companyId, limit: 100 }),
    ])
      .then(([nextMembers, nextInvites]) => {
        if (cancelled) {
          return;
        }
        setMembers(nextMembers);
        setInvites(nextInvites);
        setErrorMessage(null);
        setDraftRoles((prev) => {
          const nextDrafts: Record<string, CompanyMemberRole> = {};
          for (const member of nextMembers) {
            nextDrafts[member.uid] = prev[member.uid] ?? member.role;
          }
          return nextDrafts;
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Uye listesi alinamadi.";
        setErrorMessage(message);
        setSuccessMessage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, refreshNonce, status]);

  const sortedMembers = useMemo(() => {
    return [...(members ?? [])].sort((left, right) => left.uid.localeCompare(right.uid, "tr"));
  }, [members]);

  const sortedInvites = useMemo(() => {
    return [...(invites ?? [])].sort((left, right) => left.email.localeCompare(right.email, "tr"));
  }, [invites]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr");
    return sortedMembers.filter((member) => {
      if (filter === "active" && member.status !== "active") {
        return false;
      }
      if (filter === "invited" && member.status !== "invited") {
        return false;
      }
      if (filter === "suspended" && member.status !== "suspended") {
        return false;
      }
      if (
        (filter === "owner" || filter === "admin" || filter === "dispatcher" || filter === "viewer") &&
        member.role !== filter
      ) {
        return false;
      }
      if (!query) {
        return true;
      }
      const fields = [member.uid, ROLE_LABELS[member.role], MEMBER_STATUS_LABELS[member.status]]
        .join(" ")
        .toLocaleLowerCase("tr");
      return fields.includes(query);
    });
  }, [filter, searchQuery, sortedMembers]);

  const filteredInvites = useMemo(() => {
    const query = inviteSearchQuery.trim().toLocaleLowerCase("tr");
    return sortedInvites.filter((invite) => {
      if (pendingOnlyInvites && invite.status !== "pending") {
        return false;
      }
      if (!query) {
        return true;
      }
      const fields = [
        invite.email,
        ROLE_LABELS[invite.role],
        INVITE_STATUS_LABELS[invite.status],
        invite.targetUid ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr");
      return fields.includes(query);
    });
  }, [inviteSearchQuery, pendingOnlyInvites, sortedInvites]);

  const metrics = useMemo(() => {
    const sourceMembers = members ?? [];
    const sourceInvites = invites ?? [];
    return {
      totalMembers: sourceMembers.length,
      activeMembers: sourceMembers.filter((item) => item.status === "active").length,
      invitedMembers: sourceMembers.filter((item) => item.status === "invited").length,
      suspendedMembers: sourceMembers.filter((item) => item.status === "suspended").length,
      owners: sourceMembers.filter((item) => item.role === "owner").length,
      pendingInvites: sourceInvites.filter((item) => item.status === "pending").length,
    };
  }, [invites, members]);

  const inviteRoleOptions = useMemo(() => getInviteRoleOptions(actorRole), [actorRole]);
  const canInvite = inviteEmail.trim().includes("@") && !invitePending && inviteRoleOptions.length > 0;

  useEffect(() => {
    if (inviteRoleOptions.length === 0) {
      return;
    }
    if (!inviteRoleOptions.includes(inviteRole)) {
      setInviteRole(inviteRoleOptions[0]);
    }
  }, [inviteRole, inviteRoleOptions]);

  useEffect(() => {
    if (sortedMembers.length === 0) {
      setSelectedMemberUid(null);
      return;
    }
    if (selectedMemberUid && sortedMembers.some((item) => item.uid === selectedMemberUid)) {
      return;
    }
    setSelectedMemberUid(sortedMembers[0]?.uid ?? null);
  }, [selectedMemberUid, sortedMembers]);

  const selectedMember = useMemo(
    () => sortedMembers.find((member) => member.uid === selectedMemberUid) ?? null,
    [selectedMemberUid, sortedMembers],
  );

  const selectedRoleOptions = useMemo(() => {
    if (!selectedMember) {
      return [];
    }
    return getEditableRoleOptions(actorRole, selectedMember.role);
  }, [actorRole, selectedMember]);

  const selectedRoleDraft = selectedMember ? draftRoles[selectedMember.uid] ?? selectedMember.role : null;
  const selectedRoleResolved =
    selectedMember && selectedRoleDraft && selectedRoleOptions.includes(selectedRoleDraft)
      ? selectedRoleDraft
      : selectedRoleOptions[0] ?? selectedMember?.role ?? null;
  const selectedRoleLocked =
    !selectedMember ||
    selectedRoleOptions.length === 0 ||
    (selectedRoleOptions.length === 1 && selectedRoleOptions[0] === selectedMember.role);

  const handleInvite = async () => {
    if (!canInvite) {
      return;
    }
    setInvitePending(true);
    try {
      const normalizedEmail = inviteEmail.trim();
      const invite = await inviteCompanyMemberByEmailForCompany({
        companyId,
        email: normalizedEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setInvites((prev) => {
        const base = prev ?? [];
        const withoutTarget = base.filter((item) => item.inviteId !== invite.inviteId);
        return [invite, ...withoutTarget];
      });
      setErrorMessage(null);
      setSuccessMessage(`Davet olusturuldu: ${invite.email}`);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Uye daveti basarisiz.";
      setErrorMessage(message);
      setSuccessMessage(null);
    } finally {
      setInvitePending(false);
    }
  };

  const handleSaveRole = async (memberUid: string) => {
    const role = draftRoles[memberUid];
    if (!role) {
      return;
    }
    const targetMember = (members ?? []).find((item) => item.uid === memberUid);
    if (!targetMember) {
      setErrorMessage("Uye kaydi bulunamadi.");
      setSuccessMessage(null);
      return;
    }
    const allowedRoles = getEditableRoleOptions(actorRole, targetMember.role);
    if (!allowedRoles.includes(role)) {
      setErrorMessage("Bu uye icin secilen rol policy tarafindan desteklenmiyor.");
      setSuccessMessage(null);
      return;
    }
    if (allowedRoles.length === 1 && allowedRoles[0] === targetMember.role) {
      setErrorMessage("Bu uye icin rol degisikligi yetkin yok.");
      setSuccessMessage(null);
      return;
    }
    setSavingUid(memberUid);
    try {
      const updatedMember = await setCompanyMemberRoleForCompany({
        companyId,
        memberUid,
        role,
      });
      setMembers((prev) => {
        const base = prev ?? [];
        return base.map((item) =>
          item.uid === updatedMember.uid
            ? { ...item, role: updatedMember.role, status: updatedMember.status, updatedAt: updatedMember.updatedAt }
            : item,
        );
      });
      setErrorMessage(null);
      setSuccessMessage(`Rol guncellendi: ${formatUid(memberUid)} -> ${ROLE_LABELS[role]}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rol guncellenemedi.";
      setErrorMessage(message);
      setSuccessMessage(null);
    } finally {
      setSavingUid(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (revokingInviteId) {
      return;
    }
    setRevokingInviteId(inviteId);
    try {
      const revoked = await revokeCompanyInviteForCompany({
        companyId,
        inviteId,
      });
      setInvites((prev) => {
        const base = prev ?? [];
        return base.map((item) => (item.inviteId === inviteId ? revoked : item));
      });
      setErrorMessage(null);
      setSuccessMessage(`Davet iptal edildi: ${revoked.email}`);
      setRefreshNonce((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Davet iptal edilemedi.";
      setErrorMessage(message);
      setSuccessMessage(null);
    } finally {
      setRevokingInviteId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Toplam uye</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{metrics.totalMembers}</div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Aktif</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-700">{metrics.activeMembers}</div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Davetli</div>
          <div className="mt-2 text-2xl font-semibold text-amber-700">{metrics.invitedMembers}</div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Askida</div>
          <div className="mt-2 text-2xl font-semibold text-slate-700">{metrics.suspendedMembers}</div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Sahip</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f5a4c]">{metrics.owners}</div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Bekleyen davet</div>
          <div className="mt-2 text-2xl font-semibold text-[#155dfc]">{metrics.pendingInvites}</div>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Uye operasyon merkezi</div>
          <button
            type="button"
            onClick={() => setRefreshNonce((prev) => prev + 1)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Yenile
          </button>
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Kullanici kodu, rol veya durum ile ara"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as MemberFilter)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Tum uyeler</option>
            <option value="active">Sadece aktif</option>
            <option value="invited">Sadece davetli</option>
            <option value="suspended">Sadece askida</option>
            <option value="owner">Rol: {ROLE_LABELS.owner}</option>
            <option value="admin">Rol: {ROLE_LABELS.admin}</option>
            <option value="dispatcher">Rol: {ROLE_LABELS.dispatcher}</option>
            <option value="viewer">Rol: {ROLE_LABELS.viewer}</option>
          </select>
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {filteredMembers.length}/{sortedMembers.length} gorunuyor
          </div>
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
          <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-2">
              {filteredMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
                  Arama ve filtreye uygun uye bulunamadi.
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <button
                    key={member.uid}
                    type="button"
                    onClick={() => setSelectedMemberUid(member.uid)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedMemberUid === member.uid
                        ? "border-[#7ac7b6] bg-[#f2fcf9]"
                        : "border-line bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900" title={member.uid}>
                        {formatUid(member.uid)}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {ROLE_LABELS[member.role]}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Durum: {MEMBER_STATUS_LABELS[member.status]}
                    </div>
                    <div className="mt-1 text-[11px] text-muted">
                      Son guncelleme: {formatDateTime(member.updatedAt)}
                    </div>
                  </button>
                ))
              )}
            </div>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                {!selectedMember ? (
                  <div className="rounded-xl border border-dashed border-line bg-white p-3 text-xs text-muted">
                    Detay icin bir uye secin.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{formatUid(selectedMember.uid)}</div>
                      <div className="mt-1 text-xs text-muted">Rol: {ROLE_LABELS[selectedMember.role]}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Durum: {MEMBER_STATUS_LABELS[selectedMember.status]} | Son guncelleme:{" "}
                        {formatDateTime(selectedMember.updatedAt)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-line bg-white p-3">
                      <div className="mb-2 text-xs font-semibold text-slate-700">Rol yonetimi</div>
                      {selectedRoleLocked || !selectedMember ? (
                        <div className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          {selectedMember
                            ? getRoleLockReason(actorRole, selectedMember.role, selectedRoleOptions)
                            : "BULUNAMADI"}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={selectedRoleResolved ?? selectedMember.role}
                            onChange={(event) =>
                              setDraftRoles((prev) => ({
                                ...prev,
                                [selectedMember.uid]: event.target.value as CompanyMemberRole,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          >
                            {selectedRoleOptions.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSaveRole(selectedMember.uid)}
                            disabled={
                              savingUid === selectedMember.uid || selectedRoleResolved === selectedMember.role
                            }
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingUid === selectedMember.uid ? "Kaydediliyor..." : "Rolu guncelle"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-2 text-xs font-semibold text-slate-700">Yeni uye davet et</div>
                {actorRole === "admin" ? (
                  <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
                    Yonetici rolu sadece operasyon ve goruntuleyici rolleri icin davet gonderebilir.
                  </div>
                ) : null}
                {inviteRoleOptions.length === 0 ? (
                  <div className="rounded-xl border border-line bg-slate-50 p-3 text-xs text-slate-600">
                    Bu rolde davet islemi kapali.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="ornek@firma.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <select
                      value={inviteRole}
                      onChange={(event) => setInviteRole(event.target.value as CompanyMemberRole)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {inviteRoleOptions.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleInvite}
                      disabled={!canInvite}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {invitePending ? "Gonderiliyor..." : "Davet gonder"}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700">Davetler</div>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={pendingOnlyInvites}
                      onChange={(event) => setPendingOnlyInvites(event.target.checked)}
                    />
                    Sadece bekleyen
                  </label>
                </div>

                <div className="mb-2">
                  <input
                    type="search"
                    value={inviteSearchQuery}
                    onChange={(event) => setInviteSearchQuery(event.target.value)}
                    placeholder="E-posta veya rol ile ara"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {!invites ? (
                  <div className="rounded-xl border border-dashed border-line bg-white p-3 text-xs text-muted">
                    Davet listesi yukleniyor...
                  </div>
                ) : filteredInvites.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-white p-3 text-xs text-muted">
                    Davet bulunamadi.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredInvites.map((invite) => (
                      <article key={invite.inviteId} className="rounded-xl border border-line bg-white p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-slate-900">{invite.email}</div>
                            <div className="text-[11px] text-muted">Rol: {ROLE_LABELS[invite.role]}</div>
                          </div>
                          <div
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getInviteStatusTone(invite.status)}`}
                          >
                            {INVITE_STATUS_LABELS[invite.status]}
                          </div>
                        </div>
                        {invite.targetUid ? (
                          <div className="mt-1 text-[11px] text-muted">Hedef: {formatUid(invite.targetUid)}</div>
                        ) : null}
                        {invite.status === "pending" ? (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => handleRevokeInvite(invite.inviteId)}
                              disabled={revokingInviteId === invite.inviteId}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {revokingInviteId === invite.inviteId ? "Iptal ediliyor..." : "Daveti iptal et"}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
