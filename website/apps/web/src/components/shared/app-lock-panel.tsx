"use client";

import Link from "next/link";

export type AppLockReason =
  | "force_update"
  | "billing_lock"
  | "company_suspended"
  | "company_archived"
  | "membership_suspended";

type LockCopy = {
  title: string;
  body: string;
  toneClassName: string;
};

function getCopy(reason: AppLockReason): LockCopy {
  if (reason === "force_update") {
    return {
      title: "Guncelleme gerekli",
      body:
        "Bu panel surumu artik desteklenmiyor. Devam etmek için güncel surume gecip tekrar giriş yap.",
      toneClassName: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  if (reason === "billing_lock") {
    return {
      title: "Erisim fatura kilidinde",
      body:
        "Şirket hesabi odeme veya policy nedeni ile kilitli oldugu için bu operasyon ekranlari acik degil.",
      toneClassName: "border-rose-200 bg-rose-50 text-rose-900",
    };
  }
  if (reason === "company_suspended") {
    return {
      title: "Şirket hesabi askiya alinmis",
      body: "Bu şirket baglaminda panel erisimi gecici olarak durdurulmus.",
      toneClassName: "border-rose-200 bg-rose-50 text-rose-900",
    };
  }
  if (reason === "company_archived") {
    return {
      title: "Şirket arsivlenmis",
      body: "Bu şirket paneli arsivde oldugu için aktif operasyon için kullanilamiyor.",
      toneClassName: "border-slate-300 bg-slate-100 text-slate-800",
    };
  }
  return {
    title: "Uyelik gecici olarak askida",
    body: "Bu sirketteki uyeligin askida oldugu için panel erisimi su an kapali.",
    toneClassName: "border-amber-200 bg-amber-50 text-amber-900",
  };
}

type Props = {
  reason: AppLockReason;
  companyId?: string;
};

export function AppLockPanel({ reason, companyId }: Props) {
  const copy = getCopy(reason);
  const dashboardHref = companyId
    ? `/c/${encodeURIComponent(companyId)}/dashboard`
    : "/dashboard";

  return (
    <section className={`rounded-2xl border p-5 text-sm shadow-sm ${copy.toneClassName}`}>
      <div className="text-xs font-semibold tracking-wide uppercase">Erisim durumu</div>
      <h2 className="mt-1 text-lg font-semibold">{copy.title}</h2>
      <p className="mt-2 leading-6">{copy.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl border border-current/30 bg-white px-3 py-2 text-xs font-semibold hover:bg-white/80"
        >
          Genel bakışa dön
        </Link>
        <Link
          href={dashboardHref}
          className="inline-flex items-center rounded-xl border border-current/30 bg-white px-3 py-2 text-xs font-semibold hover:bg-white/80"
        >
          Durumu yenile
        </Link>
      </div>
    </section>
  );
}

