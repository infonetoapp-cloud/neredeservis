"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getDynamicRoutePreviewCallable,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callables";
import type { DynamicRoutePreviewResponse } from "@/features/company/company-types";

type Props = {
  srvCode: string;
  token: string;
};

type PreviewState =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "ready"; data: DynamicRoutePreviewResponse; error: null }
  | { status: "error"; data: null; error: string };

export function RouteSharePreviewClient({ srvCode, token }: Props) {
  const normalizedCode = useMemo(() => srvCode.trim().toUpperCase(), [srvCode]);
  const normalizedToken = useMemo(() => token.trim(), [token]);
  const [state, setState] = useState<PreviewState>(() =>
    normalizedToken
      ? { status: "loading", data: null, error: null }
      : {
          status: "error",
          data: null,
          error: "Bu onizleme linkinde guvenlik tokeni eksik. Guncel linki panelden yeniden olusturun.",
        },
  );
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedToken) {
      return;
    }

    let cancelled = false;
    void getDynamicRoutePreviewCallable({ srvCode: normalizedCode, token: normalizedToken })
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", data, error: null });
      })
      .catch((nextError) => {
        if (cancelled) return;
        setState({
          status: "error",
          data: null,
          error: mapCompanyCallableErrorToMessage(nextError),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedCode, normalizedToken]);

  async function handleCopyDeepLink() {
    if (!state.data?.deepLinkUrl) return;
    if (!navigator?.clipboard) {
      setCopyMessage("Tarayici panoya kopyalama destegi vermiyor.");
      return;
    }
    try {
      await navigator.clipboard.writeText(state.data.deepLinkUrl);
      setCopyMessage("Mobil deep link panoya kopyalandi.");
      window.setTimeout(() => setCopyMessage(null), 1_800);
    } catch {
      setCopyMessage("Deep link panoya kopyalanamadi.");
      window.setTimeout(() => setCopyMessage(null), 2_200);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            NeredeServis Rota Paylasimi
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Rota Takip Onizlemesi</h1>
          <p className="text-sm text-slate-600">
            Bu sayfa imzali link ile acilir. Gecersiz/eskimis token durumunda panelden yeni link
            uretilmelidir.
          </p>
        </div>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rota Kodu</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">{normalizedCode}</div>
          {!normalizedToken ? (
            <p className="mt-2 text-xs text-rose-700">
              Bu onizleme linkinde guvenlik tokeni eksik. Guncel linki panelden yeniden olusturun.
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Token algilandi, preview verisi yukleniyor.</p>
          )}
        </section>

        {state.status === "loading" ? (
          <section className="rounded-2xl border border-line bg-white p-4 text-sm text-slate-600 shadow-sm">
            Preview verisi yukleniyor...
          </section>
        ) : null}

        {state.status === "error" ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {state.error}
          </section>
        ) : null}

        {state.status === "ready" ? (
          <section className="space-y-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Rota" value={state.data.routeName} />
              <Info label="Sofor" value={state.data.driverDisplayName} />
              <Info label="Saat" value={state.data.scheduledTime ?? "--:--"} />
              <Info label="Slot" value={state.data.timeSlot ?? "-"} />
            </div>
            <div className="rounded-xl border border-line bg-slate-50 p-3 text-xs text-slate-600">
              Misafir takip:{" "}
              <span className="font-semibold text-slate-800">
                {state.data.allowGuestTracking ? "Acilabilir" : "Kapali"}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <button
                type="button"
                onClick={handleCopyDeepLink}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Mobil Deep Link Kopyala
              </button>
              <a
                href={state.data.deepLinkUrl}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Uygulamada Acmayi Dene
              </a>
            </div>
            {copyMessage ? <p className="text-xs text-slate-500">{copyMessage}</p> : null}
          </section>
        ) : null}

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Panel Girisi</div>
          <p className="mt-1 text-xs text-slate-500">
            Kurumsal panelde canli sefer ve durak detaylarini gormek icin giris yapin.
          </p>
          <Link
            href="/giris"
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Panel Girisi
          </Link>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
