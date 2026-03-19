"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  buildDispatchSummary,
  buildLiveOpsFilterContextLine,
  buildLiveOpsTripDeepLink,
  buildLiveOpsGeneratedAtMeta,
  buildLiveOpsStreamRecoveryContextLine,
  buildLiveOpsStreamContextLine,
  type LiveOpsFilterContext,
  type LiveOpsStreamRecoverySummary,
  type LiveOpsStreamIssueState,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import {
  isLiveOpsClipboardSupported,
  liveOpsClipboardUnavailableMessage,
} from "@/components/dashboard/live-ops-clipboard-support";
import type { CompanyActiveTripSummary } from "@/features/company/company-types";

type EffectiveLiveCoords =
  | {
      lat: number | null;
      lng: number | null;
      source: "rtdb_stream" | "rtdb" | "trip_doc";
      stale: boolean;
    }
  | null;

export type DispatchTemplateId =
  | "eta_delay_10"
  | "eta_delay_20"
  | "boarding_started"
  | "arrival_soon";

export type DispatchTemplateAction = {
  id: DispatchTemplateId;
  label: string;
};

const DISPATCH_TEMPLATE_ACTIONS: DispatchTemplateAction[] = [
  { id: "eta_delay_10", label: "10 dk gecikme" },
  { id: "eta_delay_20", label: "20 dk gecikme" },
  { id: "boarding_started", label: "Yolcu alim basladi" },
  { id: "arrival_soon", label: "Varisa 5 dk kaldi" },
];
const DISPATCH_HISTORY_STORAGE_KEY = "nsv:web:liveops:dispatch-history";
const MAX_DISPATCH_HISTORY = 20;

export type DispatchHistoryEntry = {
  id: string;
  tripId: string;
  label: string;
  channel: "copy" | "whatsapp";
  createdAtIso: string;
};

function normalizePhoneForWhatsApp(rawPhone: string | null): string | null {
  if (!rawPhone) return null;
  const digitsOnly = rawPhone.replace(/\D/g, "");
  if (!digitsOnly) return null;
  if (digitsOnly.startsWith("90") && digitsOnly.length >= 12) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith("0") && digitsOnly.length >= 11) {
    return `9${digitsOnly}`;
  }
  if (digitsOnly.length === 10) {
    return `90${digitsOnly}`;
  }
  return digitsOnly.length >= 11 ? digitsOnly : null;
}

function buildDispatchTemplateText(params: {
  templateId: DispatchTemplateId;
  trip: CompanyActiveTripSummary;
  effectiveLiveCoords: EffectiveLiveCoords;
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const { templateId, trip, effectiveLiveCoords } = params;
  const nowLabel = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  const streamLine = `Stream: ${buildLiveOpsStreamContextLine(params.streamIssueState)}.`;
  const recoveryLine = `${buildLiveOpsStreamRecoveryContextLine(params.streamRecoverySummary)}.`;
  const filterLine = `Filtre: ${buildLiveOpsFilterContextLine(params.filterContext)}.`;

  const locationSuffix =
    effectiveLiveCoords?.lat != null && effectiveLiveCoords?.lng != null
      ? `Konum: ${effectiveLiveCoords.lat.toFixed(5)}, ${effectiveLiveCoords.lng.toFixed(5)}.`
      : null;

  switch (templateId) {
    case "eta_delay_10":
      return [
        `${trip.routeName} seferinde operasyonel yogunluk nedeniyle tahmini varis +10 dk guncellendi.`,
        `Saat: ${nowLabel}.`,
        streamLine,
        recoveryLine,
        filterLine,
        locationSuffix,
      ]
        .filter(Boolean)
        .join(" ");
    case "eta_delay_20":
      return [
        `${trip.routeName} seferinde trafik/yogunluk nedeniyle tahmini varis +20 dk guncellendi.`,
        `Saat: ${nowLabel}.`,
        streamLine,
        recoveryLine,
        filterLine,
        locationSuffix,
      ]
        .filter(Boolean)
        .join(" ");
    case "boarding_started":
      return [
        `${trip.routeName} seferinde yolcu alim sureci baslatildi.`,
        `Saat: ${nowLabel}.`,
        streamLine,
        recoveryLine,
        filterLine,
        locationSuffix,
      ]
        .filter(Boolean)
        .join(" ");
    case "arrival_soon":
      return [
        `${trip.routeName} seferinde varisa yaklasik 5 dk kaldi.`,
        `Saat: ${nowLabel}.`,
        streamLine,
        recoveryLine,
        filterLine,
        locationSuffix,
      ]
        .filter(Boolean)
        .join(" ");
    default:
      return `${trip.routeName} operasyon guncellemesi (${nowLabel}).`;
  }
}

function readDispatchHistoryFromStorage(): DispatchHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(DISPATCH_HISTORY_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item === "object" && item != null)
      .map((item) => {
        const candidate = item as Partial<DispatchHistoryEntry>;
        const channel: DispatchHistoryEntry["channel"] =
          candidate.channel === "whatsapp" ? "whatsapp" : "copy";
        return {
          id: typeof candidate.id === "string" ? candidate.id : `${Date.now()}`,
          tripId: typeof candidate.tripId === "string" ? candidate.tripId : "",
          label: typeof candidate.label === "string" ? candidate.label : "Dispatch Aksiyonu",
          channel,
          createdAtIso:
            typeof candidate.createdAtIso === "string"
              ? candidate.createdAtIso
              : new Date().toISOString(),
        } as DispatchHistoryEntry;
      })
      .filter((item) => item.tripId.length > 0)
      .slice(0, MAX_DISPATCH_HISTORY);
  } catch {
    return [];
  }
}

function persistDispatchHistoryToStorage(items: DispatchHistoryEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DISPATCH_HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function clearDispatchHistoryStorage() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DISPATCH_HISTORY_STORAGE_KEY);
}

export function useLiveOpsDispatchActions(params: {
  selectedTrip: CompanyActiveTripSummary | null;
  selectedDriverPhone: string | null;
  effectiveLiveCoords: EffectiveLiveCoords;
  streamStatus: "idle" | "connecting" | "live" | "mismatch" | "error";
  rtdbConnectionStatus: "idle" | "connecting" | "online" | "offline" | "error";
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const {
    selectedTrip,
    selectedDriverPhone,
    effectiveLiveCoords,
    streamStatus,
    rtdbConnectionStatus,
    streamIssueState,
    streamRecoverySummary,
    filterContext,
  } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dispatchCopyMessage, setDispatchCopyMessage] = useState<string | null>(null);
  const [tripLinkCopyMessage, setTripLinkCopyMessage] = useState<string | null>(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState<string | null>(null);
  const [dispatchTemplateCopyMessage, setDispatchTemplateCopyMessage] = useState<string | null>(null);
  const [dispatchTemplateWhatsAppMessage, setDispatchTemplateWhatsAppMessage] = useState<string | null>(null);
  const [supportPacketCopyMessage, setSupportPacketCopyMessage] = useState<string | null>(null);
  const [dispatchHistoryCopyMessage, setDispatchHistoryCopyMessage] = useState<string | null>(null);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchHistoryEntry[]>(() =>
    readDispatchHistoryFromStorage(),
  );
  const clipboardSupported = isLiveOpsClipboardSupported();

  const appendDispatchHistory = (input: {
    tripId: string;
    label: string;
    channel: "copy" | "whatsapp";
  }) => {
    const nextEntry: DispatchHistoryEntry = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      tripId: input.tripId,
      label: input.label,
      channel: input.channel,
      createdAtIso: new Date().toISOString(),
    };
    setDispatchHistory((prev) => {
      const next = [nextEntry, ...prev].slice(0, MAX_DISPATCH_HISTORY);
      persistDispatchHistoryToStorage(next);
      return next;
    });
  };

  const selectedTripWhatsAppUrl = useMemo(() => {
    if (!selectedTrip) return null;
    const normalizedPhone = normalizePhoneForWhatsApp(selectedDriverPhone);
    if (!normalizedPhone) return null;
    const baseSummary = buildDispatchSummary({
      trip: selectedTrip,
      effectiveLiveCoords:
        effectiveLiveCoords != null
          ? {
              lat: effectiveLiveCoords.lat,
              lng: effectiveLiveCoords.lng,
              source: effectiveLiveCoords.source,
            }
          : null,
    });
    const summary = [
      baseSummary,
      `Stream: ${buildLiveOpsStreamContextLine(streamIssueState)}`,
      buildLiveOpsStreamRecoveryContextLine(streamRecoverySummary),
      `Filtre: ${buildLiveOpsFilterContextLine(filterContext)}`,
    ].join("\n");
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(summary)}`;
  }, [
    effectiveLiveCoords,
    filterContext,
    selectedDriverPhone,
    selectedTrip,
    streamIssueState,
    streamRecoverySummary,
  ]);

  const handleOpenRouteEditor = () => {
    if (!selectedTrip) return;
    router.push(`/routes?routeId=${encodeURIComponent(selectedTrip.routeId)}`);
  };

  const handleOpenDriverRecord = () => {
    if (!selectedTrip) return;
    router.push(`/drivers?memberUid=${encodeURIComponent(selectedTrip.driverUid)}`);
  };

  const handleCopyDispatchSummary = async () => {
    if (!selectedTrip) return;
    if (!clipboardSupported) {
      setDispatchCopyMessage(liveOpsClipboardUnavailableMessage());
      window.setTimeout(() => setDispatchCopyMessage(null), 2400);
      return;
    }
    const baseText = buildDispatchSummary({
      trip: selectedTrip,
      effectiveLiveCoords: effectiveLiveCoords
        ? {
            lat: effectiveLiveCoords.lat,
            lng: effectiveLiveCoords.lng,
            source: effectiveLiveCoords.source,
          }
        : null,
    });
    const text = [
      baseText,
      `Stream: ${buildLiveOpsStreamContextLine(streamIssueState)}`,
      buildLiveOpsStreamRecoveryContextLine(streamRecoverySummary),
      `Filtre: ${buildLiveOpsFilterContextLine(filterContext)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setDispatchCopyMessage("Sefer ozeti panoya kopyalandi.");
      appendDispatchHistory({
        tripId: selectedTrip.tripId,
        label: "Sefer Ozeti",
        channel: "copy",
      });
    } catch {
      setDispatchCopyMessage("Pano erisimi saglanamadi.");
    }
    window.setTimeout(() => {
      setDispatchCopyMessage(null);
    }, 2400);
  };

  const handleCopyTripLink = async () => {
    if (!selectedTrip) return;
    if (!clipboardSupported) {
      setTripLinkCopyMessage(liveOpsClipboardUnavailableMessage());
      window.setTimeout(() => setTripLinkCopyMessage(null), 2400);
      return;
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://app.neredeservis.app";
    const deepLink = buildLiveOpsTripDeepLink({
      origin,
      tripId: selectedTrip.tripId,
      routeId: selectedTrip.routeId,
      driverUid: selectedTrip.driverUid,
      baseSearchParams: searchParams.toString(),
    });
    try {
      await navigator.clipboard.writeText(deepLink);
      setTripLinkCopyMessage("Sefer linki panoya kopyalandi.");
    } catch {
      setTripLinkCopyMessage("Link panoya kopyalanamadi.");
    }
    window.setTimeout(() => {
      setTripLinkCopyMessage(null);
    }, 2400);
  };

  const handleSendWhatsApp = () => {
    if (!selectedTrip) return;
    if (!selectedTripWhatsAppUrl) {
      setWhatsAppMessage("Şoför telefonu bulunamadi, WhatsApp aksiyonu acilamadi.");
      window.setTimeout(() => setWhatsAppMessage(null), 2600);
      return;
    }
    window.open(selectedTripWhatsAppUrl, "_blank", "noopener,noreferrer");
    appendDispatchHistory({
      tripId: selectedTrip.tripId,
      label: "Sefer Ozeti",
      channel: "whatsapp",
    });
  };

  const handleCopyDispatchTemplate = async (templateId: DispatchTemplateId) => {
    if (!selectedTrip) return;
    if (!clipboardSupported) {
      setDispatchTemplateCopyMessage(liveOpsClipboardUnavailableMessage());
      window.setTimeout(() => setDispatchTemplateCopyMessage(null), 2600);
      return;
    }
    const template = DISPATCH_TEMPLATE_ACTIONS.find((item) => item.id === templateId);
    if (!template) return;
    const text = buildDispatchTemplateText({
      templateId,
      trip: selectedTrip,
      effectiveLiveCoords,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    try {
      await navigator.clipboard.writeText(text);
      setDispatchTemplateCopyMessage(`Hazir mesaj kopyalandi: ${template.label}`);
      appendDispatchHistory({
        tripId: selectedTrip.tripId,
        label: template.label,
        channel: "copy",
      });
    } catch {
      setDispatchTemplateCopyMessage("Hazir mesaj panoya kopyalanamadi.");
    }
    window.setTimeout(() => {
      setDispatchTemplateCopyMessage(null);
    }, 2600);
  };

  const handleSendWhatsAppTemplate = (templateId: DispatchTemplateId) => {
    if (!selectedTrip) return;
    const normalizedPhone = normalizePhoneForWhatsApp(selectedDriverPhone);
    if (!normalizedPhone) {
      setDispatchTemplateWhatsAppMessage("Şoför telefonu bulunamadi, hazir mesaj gonderilemedi.");
      window.setTimeout(() => setDispatchTemplateWhatsAppMessage(null), 2600);
      return;
    }
    const text = buildDispatchTemplateText({
      templateId,
      trip: selectedTrip,
      effectiveLiveCoords,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    const template = DISPATCH_TEMPLATE_ACTIONS.find((item) => item.id === templateId);
    appendDispatchHistory({
      tripId: selectedTrip.tripId,
      label: template?.label ?? "Hazir Mesaj",
      channel: "whatsapp",
    });
  };

  const handleCopySupportPacket = async () => {
    if (!selectedTrip) return;
    if (!clipboardSupported) {
      setSupportPacketCopyMessage(liveOpsClipboardUnavailableMessage());
      window.setTimeout(() => setSupportPacketCopyMessage(null), 2600);
      return;
    }
    const generatedAt = buildLiveOpsGeneratedAtMeta();
    const supportText = [
      "Live Ops Destek Paketi",
      `Trip ID: ${selectedTrip.tripId}`,
      `Route ID: ${selectedTrip.routeId}`,
      `Driver UID: ${selectedTrip.driverUid}`,
      `Driver: ${selectedTrip.driverName}`,
      `Plate: ${selectedTrip.driverPlate ?? "-"}`,
      `Live State: ${selectedTrip.liveState}`,
      `Stream Status: ${streamStatus}`,
      `Stream Issue: ${buildLiveOpsStreamContextLine(streamIssueState)}`,
      `Recovery: ${buildLiveOpsStreamRecoveryContextLine(streamRecoverySummary)}`,
      `Filter Context: ${buildLiveOpsFilterContextLine(filterContext)}`,
      `RTDB Connection: ${rtdbConnectionStatus}`,
      `Last Location At: ${selectedTrip.lastLocationAt ?? "-"}`,
      `Started At: ${selectedTrip.startedAt ?? "-"}`,
      effectiveLiveCoords?.lat != null && effectiveLiveCoords?.lng != null
        ? `Effective Coords: ${effectiveLiveCoords.lat.toFixed(5)}, ${effectiveLiveCoords.lng.toFixed(5)} (${effectiveLiveCoords.source}, stale=${effectiveLiveCoords.stale ? "1" : "0"})`
        : "Effective Coords: yok",
      `Generated At (ISO): ${generatedAt.iso}`,
      `Generated At (TR): ${generatedAt.local}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(supportText);
      setSupportPacketCopyMessage("Destek paketi panoya kopyalandi.");
      appendDispatchHistory({
        tripId: selectedTrip.tripId,
        label: "Destek Paketi",
        channel: "copy",
      });
    } catch {
      setSupportPacketCopyMessage("Destek paketi kopyalanamadi.");
    }
    window.setTimeout(() => setSupportPacketCopyMessage(null), 2600);
  };

  const handleClearDispatchHistory = (tripId: string) => {
    setDispatchHistory((prev) => {
      const next = prev.filter((item) => item.tripId !== tripId);
      if (next.length === 0) {
        clearDispatchHistoryStorage();
      } else {
        persistDispatchHistoryToStorage(next);
      }
      return next;
    });
  };

  const handleCopyDispatchHistory = async (tripId: string) => {
    if (!selectedTrip) return;
    if (!clipboardSupported) {
      setDispatchHistoryCopyMessage(liveOpsClipboardUnavailableMessage());
      window.setTimeout(() => setDispatchHistoryCopyMessage(null), 2400);
      return;
    }
    const entries = dispatchHistory
      .filter((item) => item.tripId === tripId)
      .slice(0, 10);
    if (entries.length === 0) {
      setDispatchHistoryCopyMessage("Bu sefer için kopyalanacak dispatch gecmisi yok.");
      window.setTimeout(() => setDispatchHistoryCopyMessage(null), 2400);
      return;
    }
    const lines = entries.map((item) => {
      const timeLabel = new Date(item.createdAtIso).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `- ${timeLabel} | ${item.channel === "copy" ? "Kopyala" : "WhatsApp"} | ${item.label}`;
    });
    const generatedAt = buildLiveOpsGeneratedAtMeta();
    const payload = [
      "Live Ops Dispatch Gecmisi",
      `Trip ID: ${tripId}`,
      `Route: ${selectedTrip.routeName}`,
      `Driver: ${selectedTrip.driverName} (${selectedTrip.driverPlate ?? "-"})`,
      `Stream Durumu: ${buildLiveOpsStreamContextLine(streamIssueState)}`,
      `Toparlanma: ${buildLiveOpsStreamRecoveryContextLine(streamRecoverySummary)}`,
      `Filtre Baglami: ${buildLiveOpsFilterContextLine(filterContext)}`,
      `Generated At (ISO): ${generatedAt.iso}`,
      `Generated At (TR): ${generatedAt.local}`,
      "",
      ...lines,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      setDispatchHistoryCopyMessage("Dispatch gecmisi panoya kopyalandi.");
    } catch {
      setDispatchHistoryCopyMessage("Dispatch gecmisi kopyalanamadi.");
    }
    window.setTimeout(() => setDispatchHistoryCopyMessage(null), 2600);
  };

  return {
    clipboardSupported,
    dispatchCopyMessage,
    tripLinkCopyMessage,
    whatsAppMessage,
    dispatchTemplateCopyMessage,
    dispatchTemplateWhatsAppMessage,
    supportPacketCopyMessage,
    dispatchHistoryCopyMessage,
    dispatchTemplateActions: DISPATCH_TEMPLATE_ACTIONS,
    dispatchHistory,
    handleClearDispatchHistory,
    handleCopyDispatchHistory,
    handleOpenRouteEditor,
    handleOpenDriverRecord,
    handleCopyDispatchSummary,
    handleCopyTripLink,
    handleSendWhatsApp,
    handleCopyDispatchTemplate,
    handleSendWhatsAppTemplate,
    handleCopySupportPacket,
  };
}

