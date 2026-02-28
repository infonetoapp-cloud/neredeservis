"use client";

type AdminOperationsStatusCardProps = {
  companyName: string | null;
  role: string | null;
  memberStatus: string | null;
  lastLoadedLabel: string;
  isPhase5Ready: boolean;
  phase5BlockingSummary: string;
  phase5ProgressLabel: string;
  phase5FreshnessLabel: string;
  phase5FreshnessTone: "ok" | "warn";
  phase5FreshnessUpdatedLabel: string;
  phase5FirstBlockingHref: string | null;
  phase5FirstBlockingTitle: string | null;
  isReloading: boolean;
  isLoading: boolean;
  onReload: () => void;
};

export function AdminOperationsStatusCard({
  companyName,
  role,
  memberStatus,
  lastLoadedLabel,
  isPhase5Ready,
  phase5BlockingSummary,
  phase5ProgressLabel,
  phase5FreshnessLabel,
  phase5FreshnessTone,
  phase5FreshnessUpdatedLabel,
  phase5FirstBlockingHref,
  phase5FirstBlockingTitle,
  isReloading,
  isLoading,
  onReload,
}: AdminOperationsStatusCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Operasyon Durumu</h2>
          <p className="mt-1 text-xs text-muted">
            Company: <span className="font-semibold text-slate-900">{companyName ?? "-"}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Rol: <span className="font-semibold text-slate-900">{role ?? "-"}</span> /{" "}
            <span className="font-semibold text-slate-900">{memberStatus ?? "-"}</span>
          </p>
          <p className="mt-1 text-xs text-muted">Son canli sefer yuklemesi: {lastLoadedLabel}</p>
          <p className="mt-1 text-xs text-muted">
            Faz 5 Readiness:{" "}
            <span className={isPhase5Ready ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
              {isPhase5Ready ? "READY" : "BLOCKED"}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">Faz 5 ilerleme: {phase5ProgressLabel}</p>
          <p className="mt-1 text-xs text-muted">
            Faz 5 tazelik:{" "}
            <span className={phase5FreshnessTone === "ok" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
              {phase5FreshnessLabel}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">{phase5FreshnessUpdatedLabel}</p>
          {!isPhase5Ready ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-amber-700">
              <span>Bloklayan: {phase5BlockingSummary}</span>
              {phase5FirstBlockingHref && phase5FirstBlockingTitle ? (
                <a
                  href={phase5FirstBlockingHref}
                  title={phase5FirstBlockingTitle}
                  className="rounded-full border border-amber-200 bg-white px-2 py-0.5 font-semibold text-amber-700 hover:text-amber-800"
                >
                  Ilk blokaja git
                </a>
              ) : null}
            </div>
          ) : null}
          <p className="mt-1 text-[11px] text-slate-500">
            Faz 5 release gate checklist Admin side panelde takip edilir.
          </p>
        </div>

        <button
          type="button"
          onClick={onReload}
          className="inline-flex items-center rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isReloading || isLoading}
        >
          {isReloading || isLoading ? "Yenileniyor..." : "Tum Veriyi Yenile"}
        </button>
      </div>
    </section>
  );
}
