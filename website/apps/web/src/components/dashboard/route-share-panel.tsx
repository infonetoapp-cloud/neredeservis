"use client";

import { useState } from "react";

import {
  generateRouteShareLinkCallable,
  mapCompanyCallableErrorToMessage,
} from "@/features/company/company-callables";
import { useCopyViewLink } from "@/components/dashboard/use-copy-view-link";
import type {
  CompanyRouteSummary,
  GenerateRouteShareLinkResponse,
} from "@/features/company/company-types";

type CopyTarget = "route" | "live_ops" | "guest" | null;

type Props = {
  selectedRoute: CompanyRouteSummary | null;
};

export function RouteSharePanel({ selectedRoute }: Props) {
  const { copyViewLinkState, copyViewLink } = useCopyViewLink();
  const [lastCopyTarget, setLastCopyTarget] = useState<CopyTarget>(null);
  const [guestLinkState, setGuestLinkState] = useState<{
    pending: boolean;
    data: GenerateRouteShareLinkResponse | null;
    error: string | null;
    message: string | null;
  }>({
    pending: false,
    data: null,
    error: null,
    message: null,
  });

  const routeId = selectedRoute?.routeId ?? null;
  const routeViewQuery = routeId ? `routeId=${encodeURIComponent(routeId)}` : "";
  const liveOpsQuery = routeId
    ? `routeId=${encodeURIComponent(routeId)}&sort=signal_desc`
    : "";
  const activeGuestLink =
    guestLinkState.data && guestLinkState.data.routeId === routeId
      ? guestLinkState.data
      : null;
  const supportsClipboard =
    typeof navigator !== "undefined" && Boolean(navigator.clipboard);
  const canGenerateGuestLink = Boolean(selectedRoute?.allowGuestTracking && routeId);

  const copyMessage =
    copyViewLinkState === "copied"
      ? lastCopyTarget === "route"
        ? "Rota gorunumu linki panoya kopyalandi."
        : lastCopyTarget === "live_ops"
          ? "Live Ops linki panoya kopyalandi."
          : "Misafir takip linki panoya kopyalandi."
      : copyViewLinkState === "error"
        ? "Link kopyalanamadi. Tarayici iznini kontrol et."
        : "Rota gorunumlerini ekip icinde paylasmak için linkleri kopyalayabilirsin.";

  async function ensureGuestLink(): Promise<GenerateRouteShareLinkResponse | null> {
    if (!selectedRoute || !routeId) {
      setGuestLinkState({
        pending: false,
        data: null,
        error: "Misafir linki için once bir rota sec.",
        message: null,
      });
      return null;
    }
    if (!selectedRoute.allowGuestTracking) {
      setGuestLinkState({
        pending: false,
        data: null,
        error: "Misafir takip kapali. Once rota ayarlarindan etkinlestir.",
        message: null,
      });
      return null;
    }
    const cachedGuestLink = activeGuestLink;
    if (cachedGuestLink) {
      return cachedGuestLink;
    }

    setGuestLinkState((prev) => ({
      ...prev,
      pending: true,
      error: null,
      message: "Imzali misafir linki uretiliyor...",
    }));
    try {
      const generated = await generateRouteShareLinkCallable({ routeId });
      setGuestLinkState({
        pending: false,
        data: generated,
        error: null,
        message: "Imzali misafir linki hazir.",
      });
      return generated;
    } catch (nextError) {
      setGuestLinkState({
        pending: false,
        data: null,
        error: mapCompanyCallableErrorToMessage(nextError),
        message: null,
      });
      return null;
    }
  }

  async function copyRawLink(url: string) {
    if (!supportsClipboard || !navigator.clipboard) {
      setGuestLinkState((prev) => ({
        ...prev,
        error: "Tarayici panoya kopyalama destegi vermiyor.",
      }));
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setLastCopyTarget("guest");
      setGuestLinkState((prev) => ({
        ...prev,
        error: null,
        message: "Imzali misafir linki panoya kopyalandi.",
      }));
    } catch {
      setGuestLinkState((prev) => ({
        ...prev,
        error: "Misafir linki panoya kopyalanamadi.",
      }));
    }
  }

  async function handleCopyGuestLink() {
    const generated = await ensureGuestLink();
    if (!generated) return;
    await copyRawLink(generated.signedLandingUrl);
  }

  async function handleOpenGuestPreview() {
    const generated = await ensureGuestLink();
    if (!generated) return;
    window.open(generated.signedLandingUrl, "_blank", "noopener,noreferrer");
    setGuestLinkState((prev) => ({
      ...prev,
      error: null,
      message: "Misafir onizlemesi yeni sekmede acildi.",
    }));
  }

  async function handleOpenGuestWhatsApp() {
    const generated = await ensureGuestLink();
    if (!generated) return;
    window.open(generated.whatsappUrl, "_blank", "noopener,noreferrer");
    setGuestLinkState((prev) => ({
      ...prev,
      error: null,
      message: "WhatsApp paylasim penceresi acildi.",
    }));
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Rota Paylasimlari</div>
      {!selectedRoute ? (
        <p className="text-xs text-slate-500">Paylasim için once bir rota sec.</p>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setLastCopyTarget("route");
              void copyViewLink("/routes", routeViewQuery);
            }}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Rota Gorunumu Linkini Kopyala
          </button>
          <button
            type="button"
            onClick={() => {
              setLastCopyTarget("live_ops");
              void copyViewLink("/live-ops", liveOpsQuery);
            }}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Live Ops Linkini Kopyala
          </button>
          <button
            type="button"
            disabled={!canGenerateGuestLink || guestLinkState.pending}
            onClick={() => void handleCopyGuestLink()}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {guestLinkState.pending ? "Misafir Linki Uretiliyor..." : "Misafir Linkini Uret + Kopyala"}
          </button>
          {!canGenerateGuestLink ? (
            <p className="text-[11px] text-slate-500">
              Misafir takip linki için rota uzerinde Misafir takip linki acik secenegi aktif
              olmali.
            </p>
          ) : null}
          {canGenerateGuestLink ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={guestLinkState.pending}
                onClick={() => void handleOpenGuestPreview()}
                className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Onizleme Ac
              </button>
              <button
                type="button"
                disabled={guestLinkState.pending}
                onClick={() => void handleOpenGuestWhatsApp()}
                className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                WhatsApp Ac
              </button>
            </div>
          ) : null}
        </div>
      )}
      <div
        role={copyViewLinkState === "error" ? "alert" : undefined}
        aria-live="polite"
        className={`mt-2 text-xs ${
          copyViewLinkState === "error"
            ? "rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700"
            : "text-muted"
        }`}
      >
        {copyMessage}
      </div>
      {guestLinkState.error ? (
        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
          {guestLinkState.error}
        </div>
      ) : guestLinkState.message ? (
        <div className="mt-2 text-xs text-muted">{guestLinkState.message}</div>
      ) : null}
      {activeGuestLink ? (
        <div className="mt-2 text-[11px] text-slate-500">
          Link gecerlilik sonu: {new Date(activeGuestLink.previewTokenExpiresAt).toLocaleString("tr-TR")}
        </div>
      ) : null}
    </div>
  );
}

