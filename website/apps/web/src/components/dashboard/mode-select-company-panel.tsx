"use client";

import type { CompanyMembershipSummary } from "@/features/company/company-types";

const ROLE_LABEL: Record<string, string> = {
  owner: "Sahip",
  admin: "Yönetici",
  dispatcher: "Dispeçer",
  viewer: "Gözlemci",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  invited: "Davet Bekliyor",
  suspended: "Askıda",
};

type ModeSelectCompanyPanelProps = {
  authStatus: "loading" | "signed_out" | "signed_in" | "disabled";
  isCompaniesLoading: boolean;
  companiesLoadError: string | null;
  companies: CompanyMembershipSummary[];
  pendingAction:
    | `mode:${"individual" | "company"}`
    | `company:${string}`
    | `create:${string}`
    | `accept:${string}`
    | `decline:${string}`
    | null;
  companyActionError: string | null;
  newCompanyName: string;
  createError: string | null;
  onRetryCompanies: () => void;
  onAcceptInvite: (company: CompanyMembershipSummary) => void;
  onDeclineInvite: (company: CompanyMembershipSummary) => void;
  onSelectCompany: (company: CompanyMembershipSummary) => void;
  onCompanyNameChange: (value: string) => void;
  onCreateCompany: () => void;
};

export function ModeSelectCompanyPanel({
  authStatus,
  isCompaniesLoading,
  companiesLoadError,
  companies,
  pendingAction,
  companyActionError,
  newCompanyName,
  createError,
  onRetryCompanies,
  onAcceptInvite,
  onDeclineInvite,
  onSelectCompany,
  onCompanyNameChange,
  onCreateCompany,
}: ModeSelectCompanyPanelProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">Firma Modu</div>
      </div>
      <p className="mb-4 text-sm text-muted">
        Mevcut firma uyeliklerinizden birini sec veya yeni firma olustur. Davet bekleyen uyelikleri de buradan kabul edebilirsin.
      </p>

      {authStatus !== "signed_in" ? (
        <InlineNotice tone="muted">Şirket listesini yüklemek için önce oturum açmış olmalısınız.</InlineNotice>
      ) : isCompaniesLoading ? (
        <div className="space-y-2">
          <div className="h-11 animate-pulse rounded-xl border border-line bg-slate-100" />
          <div className="h-11 animate-pulse rounded-xl border border-line bg-slate-100" />
        </div>
      ) : companiesLoadError ? (
        <div className="space-y-3">
          <InlineNotice tone="danger">{companiesLoadError}</InlineNotice>
          <button
            type="button"
            onClick={onRetryCompanies}
            className="inline-flex w-full items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Tekrar Dene
          </button>
        </div>
      ) : companies.length > 0 ? (
        <div className="space-y-2">
          {companies.map((company) => {
            const isAcceptPending = pendingAction === `accept:${company.companyId}`;
            const isDeclinePending = pendingAction === `decline:${company.companyId}`;
            const isSelectPending = pendingAction === `company:${company.companyId}`;
            const isPending = isAcceptPending || isDeclinePending || isSelectPending;
            const isDisabled = pendingAction !== null;
            const isInvited = company.memberStatus === "invited";
            const isSuspended = company.memberStatus === "suspended";

            return (
              <div
                key={company.companyId}
                className="w-full rounded-xl border border-line bg-white p-3 text-left shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{company.name}</div>
                    <div className="mt-1 text-xs text-muted">
                      {ROLE_LABEL[company.role] ?? company.role} · {STATUS_LABEL[company.memberStatus] ?? company.memberStatus}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-700">
                    {isPending
                      ? "Isleniyor..."
                      : isInvited
                        ? "Davet Bekliyor"
                        : isSuspended
                          ? "Askida"
                          : "Hazir"}
                  </span>
                </div>

                {isInvited ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => onAcceptInvite(company)}
                      disabled={isDisabled}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isAcceptPending ? "Kabul Ediliyor..." : "Daveti Kabul Et"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeclineInvite(company)}
                      disabled={isDisabled}
                      className="inline-flex w-full items-center justify-center rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isDeclinePending ? "Reddediliyor..." : "Daveti Reddet"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (company.memberStatus === "active") {
                        onSelectCompany(company);
                      }
                    }}
                    disabled={isDisabled || isSuspended}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSelectPending ? "Yonlendiriliyor..." : isSuspended ? "Askida" : "Sec"}
                  </button>
                )}
              </div>
            );
          })}

          {companyActionError ? <InlineNotice tone="danger">{companyActionError}</InlineNotice> : null}

          <div className="pt-1">
            <button
              type="button"
              onClick={onRetryCompanies}
              disabled={pendingAction !== null}
              className="inline-flex w-full items-center justify-center rounded-xl border border-dashed border-line bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Listeyi Yenile
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <InlineNotice tone="info">
            Bu hesapla bağlı bir şirket bulunamadı. İlk şirketinizi oluşturarak başlayabilirsiniz.
          </InlineNotice>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Sirket Adi
            </span>
            <input
              value={newCompanyName}
              onChange={(event) => onCompanyNameChange(event.target.value)}
              placeholder="Orn. Acme Servis"
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-300"
              maxLength={120}
            />
          </label>

          {createError ? <InlineNotice tone="danger">{createError}</InlineNotice> : null}

          <button
            type="button"
            onClick={onCreateCompany}
            disabled={pendingAction !== null}
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pendingAction?.startsWith("create:") ? "Olusturuluyor..." : "Sirket Olustur ve Devam Et"}
          </button>
        </div>
      )}
    </div>
  );
}

function InlineNotice({
  tone,
  children,
}: {
  tone: "muted" | "info" | "danger";
  children: React.ReactNode;
}) {
  const className =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : tone === "info"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-line bg-slate-50 text-slate-700";

  return <div className={`rounded-xl border px-3 py-2 text-sm ${className}`}>{children}</div>;
}
