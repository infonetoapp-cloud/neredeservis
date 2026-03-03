"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthSession } from "@/features/auth/auth-session-provider";
import {
  acceptCompanyInviteForCurrentUser,
  createCompanyForCurrentUser,
  listMyCompaniesForCurrentUser,
  listMyPendingCompanyInvitesForCurrentUser,
  type CompanyInviteItem,
  type CompanyMembershipItem,
} from "@/features/company/company-client";
import { ArrowRightIcon, BuildingIcon, RefreshIcon } from "@/components/shared/app-icons";
import { getDevCompanyIds, isDevAppEnv } from "@/lib/env/public-env";

type ListState = "idle" | "loading" | "ready" | "error";
type CreateState = "idle" | "creating" | "error";

function toCompanyLabel(companyId: string): string {
  return companyId
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .toUpperCase();
}

function buildFallbackCompanies(): CompanyMembershipItem[] {
  const fromEnv = getDevCompanyIds();
  const ids = fromEnv.length > 0 ? fromEnv : ["cmp_demo_001"];
  return ids.map((companyId) => ({
    companyId,
    companyName: toCompanyLabel(companyId),
    memberRole: "owner",
    membershipStatus: "active",
    companyStatus: "active",
    billingStatus: "active",
  }));
}

export function SelectCompanyClient() {
  const router = useRouter();
  const { status } = useAuthSession();
  const [memberships, setMemberships] = useState<CompanyMembershipItem[] | null>(null);
  const [pendingInvites, setPendingInvites] = useState<CompanyInviteItem[] | null>(null);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [acceptingCompanyId, setAcceptingCompanyId] = useState<string | null>(null);
  const [acceptErrorMessage, setAcceptErrorMessage] = useState<string | null>(null);

  const [createState, setCreateState] = useState<CreateState>("idle");
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [companyNameInput, setCompanyNameInput] = useState<string>("");

  useEffect(() => {
    if (status !== "signed_in") {
      return;
    }

    let cancelled = false;

    Promise.all([
      listMyCompaniesForCurrentUser(),
      listMyPendingCompanyInvitesForCurrentUser(),
    ])
      .then(([nextMemberships, nextInvites]) => {
        if (cancelled) {
          return;
        }
        setMemberships(nextMemberships);
        setPendingInvites(nextInvites);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Sirket listesi alinamadi.";
        setListErrorMessage(message);
      });

    return () => {
      cancelled = true;
    };
  }, [status, refreshNonce]);

  const fallbackMemberships = useMemo(
    () => (isDevAppEnv() ? buildFallbackCompanies() : []),
    [],
  );
  const effectiveMemberships = memberships ?? [];
  const hasLiveMemberships = effectiveMemberships.length > 0;
  const resolvedMemberships = hasLiveMemberships ? effectiveMemberships : fallbackMemberships;
  const usingDevFallback = !hasLiveMemberships && fallbackMemberships.length > 0;
  const listState: ListState =
    status !== "signed_in"
      ? "idle"
      : memberships == null && !listErrorMessage
        ? "loading"
        : listErrorMessage
          ? "error"
          : "ready";
  const creatingDisabled = companyNameInput.trim().length < 2 || createState === "creating";
  const hasPendingInvites = (pendingInvites ?? []).length > 0;
  const showNoCompanyOnboarding =
    listState === "ready" &&
    !hasLiveMemberships &&
    fallbackMemberships.length === 0 &&
    !hasPendingInvites;

  const refreshCompanyList = () => {
    setRefreshNonce((prev) => prev + 1);
  };

  const handleCreateCompany = async () => {
    if (creatingDisabled) {
      return;
    }
    setCreateState("creating");
    setCreateErrorMessage(null);

    try {
      const created = await createCompanyForCurrentUser({
        name: companyNameInput,
      });
      setMemberships((prev) => {
        const nextBase = prev ?? [];
        const withoutDuplicate = nextBase.filter((item) => item.companyId !== created.companyId);
        return [created, ...withoutDuplicate];
      });
      setCompanyNameInput("");
      setCreateState("idle");
      router.push(`/c/${encodeURIComponent(created.companyId)}/dashboard`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sirket olusturulamadi.";
      setCreateErrorMessage(message);
      setCreateState("error");
    }
  };

  const handleAcceptInvite = async (companyId: string) => {
    if (acceptingCompanyId) {
      return;
    }
    setAcceptingCompanyId(companyId);
    setAcceptErrorMessage(null);
    try {
      const acceptedMembership = await acceptCompanyInviteForCurrentUser({ companyId });
      setRefreshNonce((prev) => prev + 1);
      router.push(`/c/${encodeURIComponent(acceptedMembership.companyId)}/dashboard`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Davet kabul edilemedi.";
      setAcceptErrorMessage(message);
    } finally {
      setAcceptingCompanyId(null);
    }
  };

  const liveMembershipsLabel =
    listState === "loading"
      ? "Sirket baglamlari yukleniyor..."
      : hasLiveMemberships
        ? "Uye oldugun sirketler"
        : usingDevFallback
          ? "Dev fallback listesi"
          : "Uye oldugun sirketler";

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-3 text-sm font-semibold text-slate-900">Yeni sirket olustur</div>
        <p className="mb-3 text-sm text-muted">
          Ilk kurulumda owner olarak yeni bir sirket olusturup dogrudan paneline gecebilirsin.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={companyNameInput}
            onChange={(event) => setCompanyNameInput(event.target.value)}
            placeholder="Ornek: Atlas Servis Operasyon"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-900"
          />
          <button
            type="button"
            onClick={handleCreateCompany}
            disabled={creatingDisabled}
            className="glass-button-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BuildingIcon className="h-4 w-4" />
            {createState === "creating" ? "Olusturuluyor..." : "Sirket Olustur"}
          </button>
        </div>
        {createErrorMessage ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {createErrorMessage}
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">{liveMembershipsLabel}</div>
          <button
            type="button"
            onClick={refreshCompanyList}
            disabled={listState === "loading"}
            className="glass-button inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            {listState === "loading" ? "Yukleniyor..." : "Listeyi Yenile"}
          </button>
        </div>
        {listErrorMessage ? (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {listErrorMessage}
          </div>
        ) : null}
        {!hasLiveMemberships && fallbackMemberships.length > 0 ? (
          <div className="mb-3 rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
            Backend listesi bos dondugunde environment fallback listesi kullanilir.
          </div>
        ) : null}
        {!hasLiveMemberships && fallbackMemberships.length === 0 && listState === "ready" ? (
          <div className="mb-3 rounded-xl border border-dashed border-line bg-slate-50 p-3 text-xs text-muted">
            Uye oldugun sirket bulunamadi. Yeni bir sirket olusturabilir veya bir email daveti bekleyebilirsin.
          </div>
        ) : null}
        {showNoCompanyOnboarding ? (
          <div className="mb-4 rounded-2xl border border-[#d9d2c8] bg-[#faf8f3] p-4">
            <div className="text-sm font-semibold text-[#2f2a24]">
              Hesabin henuz bir sirkete bagli degil
            </div>
            <p className="mt-1 text-sm leading-6 text-[#6d655a]">
              Company paneline girebilmek icin ya yeni bir sirket olustur ya da owner/admin
              tarafindan email daveti al. Davet geldiginde bu ekran otomatik listeler.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e3ddd2] bg-white p-3 text-xs text-[#5e564b]">
                1) Ustteki &quot;Yeni sirket olustur&quot; formunu doldur.
              </div>
              <div className="rounded-xl border border-[#e3ddd2] bg-white p-3 text-xs text-[#5e564b]">
                2) Davet bekliyorsan &quot;Listeyi Yenile&quot; ile tekrar kontrol et.
              </div>
            </div>
          </div>
        ) : null}
        {acceptErrorMessage ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {acceptErrorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {resolvedMemberships.map((membership) => (
            <article
              key={membership.companyId}
              className="glass-panel rounded-2xl p-4"
            >
              {(() => {
                const companyLocked =
                  membership.companyStatus !== "active" ||
                  membership.billingStatus === "suspended_locked";
                return (
                  <>
                    <div className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Company ID
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{membership.companyId}</div>
                    <div className="mt-1 text-sm text-muted">{membership.companyName}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-[#b7ccc2] bg-[#e8f1ec] px-2 py-1 font-semibold text-[#285849]">
                        {membership.memberRole}
                      </span>
                      <span className="glass-chip rounded-full px-2 py-1 font-semibold text-slate-700">
                        {membership.membershipStatus}
                      </span>
                      <span className="glass-chip rounded-full px-2 py-1 font-semibold text-slate-700">
                        company:{membership.companyStatus}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 font-semibold ${
                          membership.billingStatus === "suspended_locked"
                            ? "bg-rose-100 text-rose-700"
                            : membership.billingStatus === "past_due"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        billing:{membership.billingStatus}
                      </span>
                    </div>
                    <div className="mt-4 flex justify-end">
                      {membership.membershipStatus === "active" && !companyLocked ? (
                        <Link
                          href={`/c/${encodeURIComponent(membership.companyId)}/dashboard`}
                          className="glass-button-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold"
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                          Panele gir
                        </Link>
                      ) : membership.membershipStatus === "invited" ? (
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(membership.companyId)}
                          disabled={acceptingCompanyId === membership.companyId}
                          className="glass-button inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {acceptingCompanyId === membership.companyId ? "Kabul ediliyor..." : "Daveti kabul et"}
                        </button>
                      ) : companyLocked ? (
                        <span className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                          Sirket kilitli
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-xl border border-line bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                          Erisim kapali
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      </div>

      {hasPendingInvites ? (
        <div className="glass-panel rounded-2xl p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Bekleyen davetler (email)</div>
          <div className="space-y-2">
            {(pendingInvites ?? []).map((invite) => (
              <article
                key={invite.inviteId}
                className="glass-panel-muted flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{invite.companyName}</div>
                  <div className="mt-1 text-xs text-muted">
                    {invite.email} | role: {invite.role} | status: {invite.status}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAcceptInvite(invite.companyId)}
                  disabled={acceptingCompanyId === invite.companyId}
                  className="glass-button-primary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {acceptingCompanyId === invite.companyId ? "Kabul ediliyor..." : "Kabul Et"}
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
