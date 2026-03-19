"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildLiveOpsFilterContextLine,
  buildLiveOpsTripDeepLink,
  buildLiveOpsGeneratedAtMeta,
  buildLiveOpsStreamRecoveryContextLine,
  buildLiveOpsStreamContextLine,
  buildLiveOpsRiskQueue,
  formatLastSignal,
  type LiveOpsStreamRecoverySummary,
  type LiveOpsFilterContext,
  type LiveOpsRiskQueueLimit,
  type LiveOpsRiskTone,
  type LiveOpsSortOption,
  type LiveOpsRiskQueueItem,
  type LiveOpsStreamIssueState,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import {
  isLiveOpsClipboardSupported,
  liveOpsClipboardUnavailableMessage,
} from "@/components/dashboard/live-ops-clipboard-support";
import { LiveOpsStreamRecoveryCallout } from "@/components/dashboard/live-ops-stream-recovery-callout";
import { LiveOpsStreamIssueChip } from "@/components/dashboard/live-ops-stream-issue-chip";
import type { CompanyActiveTripSummary } from "@/features/company/company-types";

type LiveOpsRiskPriorityQueueProps = {
  items: CompanyActiveTripSummary[];
  selectedTripId: string | null;
  onSelectTripId: (tripId: string) => void;
  activeToneFilter: LiveOpsRiskTone | null;
  onToneFilterChange: (tone: LiveOpsRiskTone | null) => void;
  sortOption: LiveOpsSortOption;
  onSortOptionChange: (sort: LiveOpsSortOption) => void;
  queueLimit: LiveOpsRiskQueueLimit;
  onQueueLimitChange: (limit: LiveOpsRiskQueueLimit) => void;
  hideStale: boolean;
  onToggleHideStale: () => void;
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
};

function riskToneClass(tone: LiveOpsRiskQueueItem["tone"]) {
  if (tone === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function riskToneLabel(tone: LiveOpsRiskQueueItem["tone"]) {
  return tone === "critical" ? "Kritik" : "Uyarı";
}

function buildRiskQueueClipboardPayload(params: {
  tone: LiveOpsRiskQueueItem["tone"];
  items: LiveOpsRiskQueueItem[];
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const generatedAt = buildLiveOpsGeneratedAtMeta();
  const toneLabel = params.tone === "critical" ? "Kritik" : "Uyarı";
  const lines = params.items.map((item, index) => {
    return [
      `${index + 1}. ${item.trip.driverPlate ?? "Plaka yok"} - ${item.trip.routeName}`,
      `   Şoför: ${item.trip.driverName}`,
      `   Risk: ${item.reason}`,
      `   Son Sinyal: ${formatLastSignal(item.trip.lastLocationAt)}`,
      `   Trip ID: ${item.trip.tripId}`,
    ].join("\n");
  });
  return [
    `Live Ops Risk Kuyrugu (${toneLabel})`,
    `Generated At (ISO): ${generatedAt.iso}`,
    `Generated At (TR): ${generatedAt.local}`,
    `Stream Durumu: ${buildLiveOpsStreamContextLine(params.streamIssueState)}`,
    `Toparlanma: ${buildLiveOpsStreamRecoveryContextLine(params.streamRecoverySummary)}`,
    `Filtre Baglami: ${buildLiveOpsFilterContextLine(params.filterContext)}`,
    "",
    ...lines,
  ].join("\n");
}

function buildRiskQueueLinksPayload(params: {
  items: LiveOpsRiskQueueItem[];
  sortOption: LiveOpsSortOption;
  riskQueueLimit: LiveOpsRiskQueueLimit;
  hideStale: boolean;
  scopeLabel: string;
  scopeTotalCount: number;
  overallTotalCount: number;
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const generatedAt = buildLiveOpsGeneratedAtMeta();
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://app.neredeservis.app";
  const lines = params.items.map((item, index) => {
    const link = buildLiveOpsTripDeepLink({
      origin,
      tripId: item.trip.tripId,
      routeId: item.trip.routeId,
      driverUid: item.trip.driverUid,
      sortOption: params.sortOption,
      riskTone: item.tone,
      hideStale: params.hideStale,
      riskQueueLimit: params.riskQueueLimit,
    });
    return `${index + 1}. ${item.trip.driverPlate ?? "Plaka yok"} - ${item.trip.routeName}\n   ${link}`;
  });
  return [
    "Live Ops Risk Kuyrugu Linkleri",
    `Kapsam: ${params.scopeLabel}`,
    `Kopyalanan: ${params.items.length}`,
    `Kapsam Toplami: ${params.scopeTotalCount}`,
    `Genel Toplam: ${params.overallTotalCount}`,
    `Generated At (ISO): ${generatedAt.iso}`,
    `Generated At (TR): ${generatedAt.local}`,
    `Stream Durumu: ${buildLiveOpsStreamContextLine(params.streamIssueState)}`,
    `Toparlanma: ${buildLiveOpsStreamRecoveryContextLine(params.streamRecoverySummary)}`,
    `Filtre Baglami: ${buildLiveOpsFilterContextLine(params.filterContext)}`,
    "",
    ...lines,
  ].join("\n");
}

function buildAllRiskQueuePayload(params: {
  items: LiveOpsRiskQueueItem[];
  scopeLabel: string;
  scopeTotalCount: number;
  totalRiskCount: number;
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const generatedAt = buildLiveOpsGeneratedAtMeta();
  const lines = params.items.map((item, index) => {
    return [
      `${index + 1}. [${riskToneLabel(item.tone)}] ${item.trip.driverPlate ?? "Plaka yok"} - ${item.trip.routeName}`,
      `   Şoför: ${item.trip.driverName}`,
      `   Risk: ${item.reason}`,
      `   Son Sinyal: ${formatLastSignal(item.trip.lastLocationAt)}`,
      `   Trip ID: ${item.trip.tripId}`,
    ].join("\n");
  });
  return [
    "Live Ops Tüm Risk Ozet",
    `Kapsam: ${params.scopeLabel}`,
    `Kopyalanan: ${params.items.length}`,
    `Kapsam Toplami: ${params.scopeTotalCount}`,
    `Genel Toplam: ${params.totalRiskCount}`,
    `Generated At (ISO): ${generatedAt.iso}`,
    `Generated At (TR): ${generatedAt.local}`,
    `Stream Durumu: ${buildLiveOpsStreamContextLine(params.streamIssueState)}`,
    `Toparlanma: ${buildLiveOpsStreamRecoveryContextLine(params.streamRecoverySummary)}`,
    `Filtre Baglami: ${buildLiveOpsFilterContextLine(params.filterContext)}`,
    "",
    ...lines,
  ].join("\n");
}

function buildSelectedRiskPayload(params: {
  item: LiveOpsRiskQueueItem;
  scopeLabel: string;
  scopeIndex: number;
  scopeTotalCount: number;
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const generatedAt = buildLiveOpsGeneratedAtMeta();
  return [
    "Live Ops Secili Risk Ozet",
    `Kapsam: ${params.scopeLabel}`,
    `Konum: ${params.scopeIndex + 1}/${params.scopeTotalCount}`,
    `Generated At (ISO): ${generatedAt.iso}`,
    `Generated At (TR): ${generatedAt.local}`,
    `Stream Durumu: ${buildLiveOpsStreamContextLine(params.streamIssueState)}`,
    `Toparlanma: ${buildLiveOpsStreamRecoveryContextLine(params.streamRecoverySummary)}`,
    `Filtre Baglami: ${buildLiveOpsFilterContextLine(params.filterContext)}`,
    "",
    `[${riskToneLabel(params.item.tone)}] ${params.item.trip.driverPlate ?? "Plaka yok"} - ${params.item.trip.routeName}`,
    `Şoför: ${params.item.trip.driverName}`,
    `Risk: ${params.item.reason}`,
    `Son Sinyal: ${formatLastSignal(params.item.trip.lastLocationAt)}`,
    `Trip ID: ${params.item.trip.tripId}`,
  ].join("\n");
}

function buildSelectedRiskDeepLink(params: {
  item: LiveOpsRiskQueueItem;
  sortOption: LiveOpsSortOption;
  riskQueueLimit: LiveOpsRiskQueueLimit;
  hideStale: boolean;
}) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://app.neredeservis.app";
  return buildLiveOpsTripDeepLink({
    origin,
    tripId: params.item.trip.tripId,
    routeId: params.item.trip.routeId,
    driverUid: params.item.trip.driverUid,
    sortOption: params.sortOption,
    riskTone: params.item.tone,
    hideStale: params.hideStale,
    riskQueueLimit: params.riskQueueLimit,
  });
}

function buildSelectedRiskWhatsAppText(params: {
  item: LiveOpsRiskQueueItem;
  sortOption: LiveOpsSortOption;
  riskQueueLimit: LiveOpsRiskQueueLimit;
  hideStale: boolean;
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const deepLink = buildSelectedRiskDeepLink(params);
  return [
    `${riskToneLabel(params.item.tone)} Risk Ozeti`,
    `${params.item.trip.driverPlate ?? "Plaka yok"} - ${params.item.trip.routeName}`,
    `Stream: ${buildLiveOpsStreamContextLine(params.streamIssueState)}`,
    `${buildLiveOpsStreamRecoveryContextLine(params.streamRecoverySummary)}`,
    `Filtre: ${buildLiveOpsFilterContextLine(params.filterContext)}`,
    `Şoför: ${params.item.trip.driverName}`,
    `Risk: ${params.item.reason}`,
    `Son Sinyal: ${formatLastSignal(params.item.trip.lastLocationAt)}`,
    `Link: ${deepLink}`,
  ].join("\n");
}

function buildBulkDispatchPayload(params: {
  tone: LiveOpsRiskQueueItem["tone"];
  items: LiveOpsRiskQueueItem[];
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  filterContext: LiveOpsFilterContext;
}) {
  const generatedAt = buildLiveOpsGeneratedAtMeta();
  const toneLabel = params.tone === "critical" ? "Kritik" : "Uyarı";
  const etaDelta = params.tone === "critical" ? "+20 dk" : "+10 dk";
  const lines = params.items.map((item, index) => {
    return `${index + 1}. ${item.trip.routeName} / ${item.trip.driverPlate ?? item.trip.driverName} - Tahmini varis ${etaDelta}. Son sinyal: ${formatLastSignal(item.trip.lastLocationAt)}.`;
  });
  return [
    `Live Ops Toplu Dispatch (${toneLabel})`,
    `Generated At (ISO): ${generatedAt.iso}`,
    `Generated At (TR): ${generatedAt.local}`,
    `Stream Durumu: ${buildLiveOpsStreamContextLine(params.streamIssueState)}`,
    `Toparlanma: ${buildLiveOpsStreamRecoveryContextLine(params.streamRecoverySummary)}`,
    `Filtre Baglami: ${buildLiveOpsFilterContextLine(params.filterContext)}`,
    "",
    ...lines,
  ].join("\n");
}

function toWhatsAppText(raw: string) {
  const lines = raw.split("\n");
  if (lines.length <= 3) return raw;
  return lines.slice(2).join("\n");
}

export function LiveOpsRiskPriorityQueue({
  items,
  selectedTripId,
  onSelectTripId,
  activeToneFilter,
  onToneFilterChange,
  sortOption,
  onSortOptionChange,
  queueLimit,
  onQueueLimitChange,
  hideStale,
  onToggleHideStale,
  streamIssueState,
  streamRecoverySummary,
  filterContext,
}: LiveOpsRiskPriorityQueueProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const clipboardSupported = isLiveOpsClipboardSupported();
  const toggleQueueLimit = useCallback(() => {
    onQueueLimitChange(queueLimit === 4 ? 8 : 4);
  }, [onQueueLimitChange, queueLimit]);
  const showClipboardUnsupported = useCallback(() => {
    setCopyMessage(liveOpsClipboardUnavailableMessage());
    window.setTimeout(() => setCopyMessage(null), 2200);
  }, []);

  const allRiskQueue = useMemo(() => buildLiveOpsRiskQueue(items, items.length), [items]);
  const scopedRiskQueue = useMemo(() => {
    if (!activeToneFilter) return allRiskQueue;
    return allRiskQueue.filter((item) => item.tone === activeToneFilter);
  }, [activeToneFilter, allRiskQueue]);
  const riskQueue = useMemo(() => scopedRiskQueue.slice(0, queueLimit), [queueLimit, scopedRiskQueue]);
  const totalRiskCount = allRiskQueue.length;
  const criticalItemsAll = useMemo(
    () => allRiskQueue.filter((item) => item.tone === "critical"),
    [allRiskQueue],
  );
  const warningItemsAll = useMemo(
    () => allRiskQueue.filter((item) => item.tone === "warning"),
    [allRiskQueue],
  );
  const criticalCount = criticalItemsAll.length;
  const warningCount = warningItemsAll.length;
  const riskAges = useMemo(
    () => riskQueue.map((item) => item.signalAgeMinutes).filter((age): age is number => age != null),
    [riskQueue],
  );
  const oldestSignalAge = useMemo(() => {
    if (riskAges.length === 0) return null;
    return Math.max(...riskAges);
  }, [riskAges]);
  const averageSignalAge = useMemo(() => {
    if (riskAges.length === 0) return null;
    const total = riskAges.reduce((sum, value) => sum + value, 0);
    return Math.round(total / riskAges.length);
  }, [riskAges]);

  const focusTone = useCallback(
    (tone: LiveOpsRiskTone) => {
      onToneFilterChange(tone);
      const target = tone === "critical" ? criticalItemsAll[0] : warningItemsAll[0];
      if (target) {
        onSelectTripId(target.trip.tripId);
      }
    },
    [criticalItemsAll, onSelectTripId, onToneFilterChange, warningItemsAll],
  );

  const navigableRiskQueue = riskQueue;

  const selectedRiskIndexInVisible = useMemo(() => {
    if (!selectedTripId) return -1;
    return navigableRiskQueue.findIndex((item) => item.trip.tripId === selectedTripId);
  }, [navigableRiskQueue, selectedTripId]);
  const selectedRiskIndexInScope = useMemo(() => {
    if (!selectedTripId) return -1;
    return scopedRiskQueue.findIndex((item) => item.trip.tripId === selectedTripId);
  }, [scopedRiskQueue, selectedTripId]);
  const selectedRiskTotal = scopedRiskQueue.length;
  const selectedRiskVisible = selectedRiskIndexInVisible >= 0;
  const selectedRiskOutsideVisible =
    selectedRiskIndexInScope >= 0 && selectedRiskIndexInVisible < 0;
  const selectedRiskCanExpandToTop8 =
    selectedRiskOutsideVisible &&
    queueLimit === 4 &&
    selectedRiskIndexInScope >= 4 &&
    selectedRiskIndexInScope < 8;
  const selectedRiskCanJumpToVisibleTop = selectedRiskOutsideVisible && riskQueue.length > 0;
  const scopedRiskCount = scopedRiskQueue.length;
  const navigationScopeLabel =
    activeToneFilter == null
      ? "Tüm riskler"
      : activeToneFilter === "critical"
        ? "Kritik odak"
        : "Uyarı odak";
  const selectedRiskLabel =
    selectedRiskIndexInScope >= 0
      ? `Secili risk: ${selectedRiskIndexInScope + 1}/${selectedRiskTotal} (${navigationScopeLabel})${selectedRiskVisible ? "" : " · gorunum disi"}`
      : `Secili risk: yok (${selectedRiskTotal} kayıt, ${navigationScopeLabel})`;
  const selectedRiskItem =
    selectedRiskIndexInScope >= 0 ? scopedRiskQueue[selectedRiskIndexInScope] ?? null : null;
  const allCopyItems = scopedRiskQueue;

  const selectRelativeRisk = useCallback(
    (direction: "prev" | "next") => {
      if (navigableRiskQueue.length === 0) return;
      if (selectedRiskIndexInVisible < 0) {
        const fallback =
          direction === "next"
            ? navigableRiskQueue[0]
            : navigableRiskQueue[navigableRiskQueue.length - 1];
        if (fallback) onSelectTripId(fallback.trip.tripId);
        return;
      }
      const delta = direction === "next" ? 1 : -1;
      const nextIndex =
        (selectedRiskIndexInVisible + delta + navigableRiskQueue.length) % navigableRiskQueue.length;
      const nextItem = navigableRiskQueue[nextIndex];
      if (nextItem) {
        onSelectTripId(nextItem.trip.tripId);
      }
    },
    [navigableRiskQueue, onSelectTripId, selectedRiskIndexInVisible],
  );

  const copySelectedRisk = useCallback(async () => {
    if (!clipboardSupported) {
      showClipboardUnsupported();
      return;
    }
    if (!selectedRiskItem || selectedRiskIndexInScope < 0) {
      setCopyMessage("Kopyalanacak secili risk kaydi yok.");
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = buildSelectedRiskPayload({
      item: selectedRiskItem,
      scopeLabel: navigationScopeLabel,
      scopeIndex: selectedRiskIndexInScope,
      scopeTotalCount: selectedRiskTotal,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopyMessage("Secili risk ozeti panoya kopyalandi.");
    } catch {
      setCopyMessage("Secili risk ozeti kopyalanamadi.");
    }
    window.setTimeout(() => setCopyMessage(null), 2400);
  }, [
    filterContext,
    navigationScopeLabel,
    selectedRiskIndexInScope,
    selectedRiskItem,
    selectedRiskTotal,
    streamIssueState,
    streamRecoverySummary,
    clipboardSupported,
    showClipboardUnsupported,
  ]);

  const sendSelectedRiskWhatsApp = useCallback(() => {
    if (!selectedRiskItem) {
      setCopyMessage("Gonderilecek secili risk kaydi yok.");
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = buildSelectedRiskWhatsAppText({
      item: selectedRiskItem,
      sortOption,
      riskQueueLimit: queueLimit,
      hideStale,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(payload)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setCopyMessage("Secili risk WhatsApp acildi.");
    window.setTimeout(() => setCopyMessage(null), 2400);
  }, [
    queueLimit,
    hideStale,
    filterContext,
    selectedRiskItem,
    sortOption,
    streamIssueState,
    streamRecoverySummary,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (event.key === "Escape") {
        if (activeToneFilter) {
          event.preventDefault();
          onToneFilterChange(null);
          return;
        }
        if (copyMessage) {
          event.preventDefault();
          setCopyMessage(null);
          return;
        }
      }

      if (!event.altKey) return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        selectRelativeRisk("prev");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        selectRelativeRisk("next");
      } else if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        focusTone("critical");
      } else if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        focusTone("warning");
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        onSortOptionChange(sortOption === "risk_desc" ? "signal_desc" : "risk_desc");
      } else if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        toggleQueueLimit();
      } else if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!clipboardSupported) {
          showClipboardUnsupported();
          return;
        }
        if (allCopyItems.length === 0) {
          setCopyMessage("Kopyalanacak risk kaydi yok.");
          window.setTimeout(() => setCopyMessage(null), 2200);
          return;
        }
        const payload = buildAllRiskQueuePayload({
          items: allCopyItems,
          scopeLabel: navigationScopeLabel,
          scopeTotalCount: scopedRiskCount,
          totalRiskCount,
          streamIssueState,
          streamRecoverySummary,
          filterContext,
        });
        void navigator.clipboard
          .writeText(payload)
          .then(() => setCopyMessage("Tüm risk ozeti panoya kopyalandi."))
          .catch(() => setCopyMessage("Tüm risk ozeti kopyalanamadi."))
          .finally(() => {
            window.setTimeout(() => setCopyMessage(null), 2400);
          });
      } else if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        void copySelectedRisk();
      } else if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        sendSelectedRiskWhatsApp();
      } else if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        if (!clipboardSupported) {
          showClipboardUnsupported();
          return;
        }
        if (riskQueue.length === 0) {
          setCopyMessage("Kopyalanacak risk linki yok.");
          window.setTimeout(() => setCopyMessage(null), 2200);
          return;
        }
        const payload = buildRiskQueueLinksPayload({
          items: riskQueue,
          sortOption,
          riskQueueLimit: queueLimit,
          hideStale,
          scopeLabel: navigationScopeLabel,
          scopeTotalCount: scopedRiskCount,
          overallTotalCount: totalRiskCount,
          streamIssueState,
          streamRecoverySummary,
          filterContext,
        });
        void navigator.clipboard
          .writeText(payload)
          .then(() => setCopyMessage("Risk kuyrugu linkleri panoya kopyalandi."))
          .catch(() => setCopyMessage("Risk linkleri kopyalanamadi."))
          .finally(() => {
            window.setTimeout(() => setCopyMessage(null), 2400);
          });
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        if (riskQueue.length === 0) {
          setCopyMessage("Gonderilecek risk linki yok.");
          window.setTimeout(() => setCopyMessage(null), 2200);
          return;
        }
        const payload = buildRiskQueueLinksPayload({
          items: riskQueue,
          sortOption,
          riskQueueLimit: queueLimit,
          hideStale,
          scopeLabel: navigationScopeLabel,
          scopeTotalCount: scopedRiskCount,
          overallTotalCount: totalRiskCount,
          streamIssueState,
          streamRecoverySummary,
          filterContext,
        });
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(payload)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        setCopyMessage("Risk linkleri WhatsApp acildi.");
        window.setTimeout(() => setCopyMessage(null), 2400);
      } else if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        const topItem = riskQueue[0];
        if (!topItem) return;
        onSelectTripId(topItem.trip.tripId);
      } else if (event.key.toLowerCase() === "g") {
        if (!selectedRiskCanExpandToTop8) return;
        event.preventDefault();
        onQueueLimitChange(8);
      } else if (event.key.toLowerCase() === "j") {
        if (!selectedRiskCanJumpToVisibleTop) return;
        event.preventDefault();
        const firstVisible = riskQueue[0];
        if (!firstVisible) return;
        onSelectTripId(firstVisible.trip.tripId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeToneFilter,
    copyMessage,
    copySelectedRisk,
    focusTone,
    onSortOptionChange,
    onSelectTripId,
    onQueueLimitChange,
    onToneFilterChange,
    allCopyItems,
    navigationScopeLabel,
    riskQueue,
    sendSelectedRiskWhatsApp,
    selectedRiskCanJumpToVisibleTop,
    selectedRiskCanExpandToTop8,
    selectRelativeRisk,
    sortOption,
    toggleQueueLimit,
    queueLimit,
    hideStale,
    filterContext,
    scopedRiskCount,
    streamIssueState,
    streamRecoverySummary,
    totalRiskCount,
    clipboardSupported,
    showClipboardUnsupported,
  ]);

  const copyToneQueue = async (tone: LiveOpsRiskQueueItem["tone"]) => {
    if (!clipboardSupported) {
      showClipboardUnsupported();
      return;
    }
    const queueItems = tone === "critical" ? criticalItemsAll : warningItemsAll;
    const toneLabel = tone === "critical" ? "kritik" : "uyarı";
    if (queueItems.length === 0) {
      setCopyMessage(`Kopyalanacak ${toneLabel} risk kaydi yok.`);
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = buildRiskQueueClipboardPayload({
      tone,
      items: queueItems,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopyMessage(`${toneLabel === "kritik" ? "Kritik" : "Uyarı"} risk kuyrugu panoya kopyalandi.`);
    } catch {
      setCopyMessage("Risk kuyrugu kopyalanamadi.");
    }
    window.setTimeout(() => setCopyMessage(null), 2400);
  };

  const copyRiskLinks = async () => {
    if (!clipboardSupported) {
      showClipboardUnsupported();
      return;
    }
    if (riskQueue.length === 0) {
      setCopyMessage("Kopyalanacak risk linki yok.");
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = buildRiskQueueLinksPayload({
      items: riskQueue,
      sortOption,
      riskQueueLimit: queueLimit,
      hideStale,
      scopeLabel: navigationScopeLabel,
      scopeTotalCount: scopedRiskCount,
      overallTotalCount: totalRiskCount,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopyMessage("Risk kuyrugu linkleri panoya kopyalandi.");
    } catch {
      setCopyMessage("Risk linkleri kopyalanamadi.");
    }
    window.setTimeout(() => setCopyMessage(null), 2400);
  };

  const sendRiskLinksWhatsApp = () => {
    if (riskQueue.length === 0) {
      setCopyMessage("Gonderilecek risk linki yok.");
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = buildRiskQueueLinksPayload({
      items: riskQueue,
      sortOption,
      riskQueueLimit: queueLimit,
      hideStale,
      scopeLabel: navigationScopeLabel,
      scopeTotalCount: scopedRiskCount,
      overallTotalCount: totalRiskCount,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(payload)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setCopyMessage("Risk linkleri WhatsApp acildi.");
    window.setTimeout(() => setCopyMessage(null), 2400);
  };

  const copyAllRiskQueue = async () => {
    if (!clipboardSupported) {
      showClipboardUnsupported();
      return;
    }
    if (allCopyItems.length === 0) {
      setCopyMessage("Kopyalanacak risk kaydi yok.");
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = buildAllRiskQueuePayload({
      items: allCopyItems,
      scopeLabel: navigationScopeLabel,
      scopeTotalCount: scopedRiskCount,
      totalRiskCount,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopyMessage("Tüm risk ozeti panoya kopyalandi.");
    } catch {
      setCopyMessage("Tüm risk ozeti kopyalanamadi.");
    }
    window.setTimeout(() => setCopyMessage(null), 2400);
  };

  const copyBulkDispatch = async (tone: LiveOpsRiskQueueItem["tone"]) => {
    if (!clipboardSupported) {
      showClipboardUnsupported();
      return;
    }
    const queueItems = tone === "critical" ? criticalItemsAll : warningItemsAll;
    if (queueItems.length === 0) {
      setCopyMessage(`Kopyalanacak ${tone === "critical" ? "kritik" : "uyarı"} dispatch kaydi yok.`);
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = buildBulkDispatchPayload({
      tone,
      items: queueItems,
      streamIssueState,
      streamRecoverySummary,
      filterContext,
    });
    try {
      await navigator.clipboard.writeText(payload);
      setCopyMessage(`${tone === "critical" ? "Kritik" : "Uyarı"} dispatch mesaji panoya kopyalandi.`);
    } catch {
      setCopyMessage("Dispatch mesaji kopyalanamadi.");
    }
    window.setTimeout(() => setCopyMessage(null), 2400);
  };

  const sendBulkDispatchWhatsApp = (tone: LiveOpsRiskQueueItem["tone"]) => {
    const queueItems = tone === "critical" ? criticalItemsAll : warningItemsAll;
    if (queueItems.length === 0) {
      setCopyMessage(`Gonderilecek ${tone === "critical" ? "kritik" : "uyarı"} dispatch kaydi yok.`);
      window.setTimeout(() => setCopyMessage(null), 2200);
      return;
    }
    const payload = toWhatsAppText(
      buildBulkDispatchPayload({
        tone,
        items: queueItems,
        streamIssueState,
        streamRecoverySummary,
        filterContext,
      }),
    );
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(payload)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setCopyMessage(`${tone === "critical" ? "Kritik" : "Uyarı"} toplu dispatch WhatsApp acildi.`);
    window.setTimeout(() => setCopyMessage(null), 2400);
  };

  if (riskQueue.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-white p-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Risk Oncelik Kuyrugu
        </div>
        <div className="text-xs text-muted">
          {activeToneFilter
            ? `${activeToneFilter === "critical" ? "Kritik" : "Uyarı"} odakta gosterilecek risk yok (Toplam risk: ${totalRiskCount}).`
            : "Kritik/uyari sefer yok. Canlı durum stabil gorunuyor."}
        </div>
        <div className="mt-2">
          <LiveOpsStreamIssueChip issueState={streamIssueState} className="inline-flex px-2 py-0.5" />
        </div>
        <LiveOpsStreamRecoveryCallout summary={streamRecoverySummary} className="mt-2" />
        {activeToneFilter ? (
          <button
            type="button"
            onClick={() => onToneFilterChange(null)}
            className="mt-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
          >
            Odagi Temizle (Esc)
          </button>
        ) : null}
      </div>
    );
  }

  const topItem = riskQueue[0] ?? null;

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Risk Oncelik Kuyrugu
        </div>
        <div className="flex items-center gap-1">
          {scopedRiskCount > 4 ? (
            <button
              type="button"
              onClick={toggleQueueLimit}
              className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              {queueLimit === 4 ? "Top 8 Göster (Alt+Q)" : "Top 4 Göster (Alt+Q)"}
            </button>
          ) : null}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">
              Kritik: {criticalCount}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
              Uyarı: {warningCount}
            </span>
            <LiveOpsStreamIssueChip issueState={streamIssueState} className="px-2 py-0.5" />
          </div>
        </div>
      </div>
      <div className="mb-2 text-[11px] text-muted">
        Gorunum Limiti: Top {queueLimit}
      </div>
      <div className="mb-2 text-[11px] text-muted">
        Filtre baglami: {buildLiveOpsFilterContextLine(filterContext)}
      </div>
      <LiveOpsStreamRecoveryCallout summary={streamRecoverySummary} className="mb-2" />
      {!clipboardSupported ? (
        <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
          Bu tarayicida pano API desteklenmiyor. Kopya aksiyonlari pasif.
        </div>
      ) : null}
      <div className="mb-2">
        <button
          type="button"
          onClick={onToggleHideStale}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
        >
          {hideStale ? "Stale Göster (Alt+H)" : "Stale Gizle (Alt+H)"}
        </button>
      </div>
      <div className="mb-2 text-[11px] text-muted">
        Gosterilen: Top {riskQueue.length}
        {activeToneFilter
          ? ` / ${navigationScopeLabel}: ${scopedRiskCount} / Genel toplam: ${totalRiskCount}`
          : totalRiskCount > riskQueue.length
            ? ` / Toplam risk: ${totalRiskCount}`
            : ""}
      </div>
      {oldestSignalAge != null || averageSignalAge != null ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          {oldestSignalAge != null ? <span>En eski sinyal: {oldestSignalAge} dk</span> : null}
          {averageSignalAge != null ? <span>Ortalama gecikme: {averageSignalAge} dk</span> : null}
        </div>
      ) : null}
      <div className="mb-2 text-[11px] text-muted">{selectedRiskLabel}</div>
      {selectedRiskCanExpandToTop8 ? (
        <button
          type="button"
          onClick={() => onQueueLimitChange(8)}
          className="mb-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
        >
          Secili riski gorunume al (Top 8 · Alt+G)
        </button>
      ) : null}
      {selectedRiskCanJumpToVisibleTop && !selectedRiskCanExpandToTop8 ? (
        <button
          type="button"
          onClick={() => {
            const firstVisible = riskQueue[0];
            if (firstVisible) onSelectTripId(firstVisible.trip.tripId);
          }}
          className="mb-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
        >
          Ilk gorunen riske git (Alt+J)
        </button>
      ) : null}
      <div className="mb-2 text-[10px] text-muted">
        Kisayollar: Alt+Yukari/Asagi gezis, Alt+C kritik, Alt+W uyarı, Esc temizle, Alt+R
        siralama, Alt+Q limit, Alt+H stale, Alt+E en riskli, Alt+G seciliyi getir, Alt+J gorunene
        git, Alt+K tüm risk kopya, Alt+P secili kopya, Alt+O secili WhatsApp, Alt+L risk link
        kopya, Alt+M WhatsApp.
      </div>

      {topItem ? (
        <button
          type="button"
          onClick={() => onSelectTripId(topItem.trip.tripId)}
          className="mb-2 w-full rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-left text-xs font-semibold text-blue-800 hover:bg-blue-100"
        >
          En Riskliyi Ac (Alt+E): {topItem.trip.driverPlate ?? topItem.trip.driverName} -{" "}
          {topItem.reason}
        </button>
      ) : null}

      <div className="mb-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void copyToneQueue("critical")}
          disabled={!clipboardSupported || criticalItemsAll.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kritikleri Kopyala
        </button>
        <button
          type="button"
          onClick={() => void copyToneQueue("warning")}
          disabled={!clipboardSupported || warningItemsAll.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Uyarilari Kopyala
        </button>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => focusTone("critical")}
          disabled={criticalItemsAll.length === 0}
          className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold ${
            activeToneFilter === "critical"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-line bg-white text-slate-900 hover:bg-slate-50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Kritige Odaklan ({criticalItemsAll.length})
        </button>
        <button
          type="button"
          onClick={() => focusTone("warning")}
          disabled={warningItemsAll.length === 0}
          className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold ${
            activeToneFilter === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-line bg-white text-slate-900 hover:bg-slate-50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Uyariya Odaklan ({warningItemsAll.length})
        </button>
        <button
          type="button"
          onClick={() => onToneFilterChange(null)}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
        >
          Odagi Temizle (Esc)
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => selectRelativeRisk("prev")}
          disabled={riskQueue.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Onceki Risk (Alt+^)
        </button>
        <button
          type="button"
          onClick={() => selectRelativeRisk("next")}
          disabled={riskQueue.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sonraki Risk (Alt+v)
        </button>
      </div>

      <div className="mb-2">
        <button
          type="button"
          onClick={() =>
            onSortOptionChange(sortOption === "risk_desc" ? "signal_desc" : "risk_desc")
          }
          className={`w-full rounded-lg border px-2.5 py-2 text-[11px] font-semibold ${
            sortOption === "risk_desc"
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-line bg-white text-slate-900 hover:bg-slate-50"
          }`}
        >
          {sortOption === "risk_desc"
            ? "Risk Siralama: Acik (Alt+R)"
            : "Risk Siralama: Kapali (Alt+R)"}
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void copyAllRiskQueue()}
          disabled={!clipboardSupported || allCopyItems.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tüm Riskleri Kopyala (Alt+K)
        </button>
        <button
          type="button"
          onClick={() => void copyRiskLinks()}
          disabled={!clipboardSupported || riskQueue.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Risk Linklerini Kopyala (Alt+L)
        </button>
        <button
          type="button"
          onClick={() => void copySelectedRisk()}
          disabled={!clipboardSupported || !selectedRiskItem}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Secili Riski Kopyala (Alt+P)
        </button>
        <button
          type="button"
          onClick={sendSelectedRiskWhatsApp}
          disabled={!selectedRiskItem}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Secili Riski WhatsApp Ac (Alt+O)
        </button>
        <button
          type="button"
          onClick={sendRiskLinksWhatsApp}
          disabled={riskQueue.length === 0}
          className="col-span-2 rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Risk Linklerini WhatsApp Ac (Alt+M)
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void copyBulkDispatch("critical")}
          disabled={!clipboardSupported || criticalItemsAll.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kritik Mesaj Kopyala
        </button>
        <button
          type="button"
          onClick={() => void copyBulkDispatch("warning")}
          disabled={!clipboardSupported || warningItemsAll.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Uyarı Mesaj Kopyala
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => sendBulkDispatchWhatsApp("critical")}
          disabled={criticalItemsAll.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kritik WhatsApp
        </button>
        <button
          type="button"
          onClick={() => sendBulkDispatchWhatsApp("warning")}
          disabled={warningItemsAll.length === 0}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Uyarı WhatsApp
        </button>
      </div>

      {copyMessage ? (
        <div className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-[11px] font-medium text-indigo-700">
          {copyMessage}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {riskQueue.map((item, index) => (
          <button
            key={item.trip.tripId}
            type="button"
            onClick={() => onSelectTripId(item.trip.tripId)}
            className={`w-full rounded-lg border px-2.5 py-2 text-left ${
              item.trip.tripId === selectedTripId
                ? "border-blue-200 bg-blue-50/70 ring-1 ring-blue-100"
                : "border-line bg-slate-50/70 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-900">
                  #{index + 1} {item.trip.driverPlate ?? "Plaka yok"} - {item.trip.routeName}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-muted">
                  {item.reason} - Son sinyal: {formatLastSignal(item.trip.lastLocationAt)}
                </div>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskToneClass(
                  item.tone,
                )}`}
              >
                {riskToneLabel(item.tone)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

