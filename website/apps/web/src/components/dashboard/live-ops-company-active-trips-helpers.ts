import type { CompanyActiveTripSummary } from "@/features/company/company-types";

export type LiveOpsSortOption = "signal_desc" | "risk_desc" | "driver_asc" | "plate_asc" | "state";
export type LiveOpsRiskTone = "critical" | "warning";
export type LiveOpsRiskQueueLimit = 4 | 8;

export type LiveOpsRiskQueueItem = {
  trip: CompanyActiveTripSummary;
  tone: LiveOpsRiskTone;
  reason: string;
  signalAgeMinutes: number | null;
};

export type LiveOpsRiskEvaluation = {
  tone: LiveOpsRiskTone;
  reason: string;
  signalAgeMinutes: number | null;
};

export type LiveOpsMapPerfTone = "ok" | "warn" | "slow";
export type LiveOpsStreamIssueTone = "none" | "warn" | "error";
export type LiveOpsStreamStatus = "idle" | "connecting" | "live" | "mismatch" | "error";
export type LiveOpsRtdbConnectionStatus = "idle" | "connecting" | "online" | "offline" | "error";
export type LiveOpsStreamLagTone = "none" | "ok" | "warn" | "critical";
export type LiveOpsStreamStaleReason =
  | "none"
  | "connection_offline"
  | "stream_error"
  | "stream_mismatch"
  | "stream_lag_timeout";
export type LiveOpsStreamIssueState = {
  label: string | null;
  tone: LiveOpsStreamIssueTone;
};

export type LiveOpsStreamIssuePresentation = {
  containerClass: string;
  textClass: string;
  severityLabel: string;
};

export type LiveOpsStreamIssueSummary = {
  shortLabel: string;
  shortClass: string;
};

export type LiveOpsStreamRecoveryTone = "none" | "warn" | "critical";

export type LiveOpsStreamRecoverySummary = {
  needsRecovery: boolean;
  tone: LiveOpsStreamRecoveryTone;
  line: string | null;
  staleLabel: string | null;
  lagLabel: string | null;
  retryLabel: string | null;
};

export type LiveOpsGeneratedAtMeta = {
  iso: string;
  local: string;
};

export type LiveOpsMapTelemetry = {
  totalCount: number;
  onlineCount: number;
  staleCount: number;
  criticalCount: number;
  warningCount: number;
  riskDensityPercent: number;
  riskDensityLabel: "Dusuk" | "Orta" | "Yuksek";
  perfTone: LiveOpsMapPerfTone;
  perfLabel: "OK" | "Izle" | "Yavas";
  healthLabel: "Stabil" | "Izlenmeli" | "Kritik";
};

export type LiveOpsFilterContext = {
  sortOption: LiveOpsSortOption;
  riskTone: LiveOpsRiskTone | null;
  hideStale: boolean;
  riskQueueLimit: LiveOpsRiskQueueLimit;
  routeFilterId: string | null;
  driverFilterUid: string | null;
  searchText: string;
};

export const LIVE_OPS_HIDE_STALE_KEY = "nsv:web:liveops:hide-stale";
export const LIVE_OPS_AUTO_REFRESH_KEY = "nsv:web:liveops:auto-refresh";
export const LIVE_OPS_ROUTE_FILTER_KEY = "nsv:web:liveops:route-filter";
export const LIVE_OPS_DRIVER_FILTER_KEY = "nsv:web:liveops:driver-filter";
export const LIVE_OPS_RISK_QUEUE_LIMIT_KEY = "nsv:web:liveops:risk-queue-limit";

export function buildLiveOpsGeneratedAtMeta(now = new Date()): LiveOpsGeneratedAtMeta {
  return {
    iso: now.toISOString(),
    local: new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now),
  };
}

export function formatLastSignal(lastLocationAt: string | null): string {
  if (!lastLocationAt) return "Sinyal yok";
  const ms = Date.parse(lastLocationAt);
  if (!Number.isFinite(ms)) return "Sinyal bilinmiyor";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSeconds < 60) return `${diffSeconds} sn once`;
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} dk once`;
  const hours = Math.floor(minutes / 60);
  return `${hours} sa once`;
}

export function signalAgeMinutes(lastLocationAt: string | null): number | null {
  if (!lastLocationAt) return null;
  const ms = Date.parse(lastLocationAt);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 60000));
}

export function buildDispatchSummary(params: {
  trip: CompanyActiveTripSummary;
  effectiveLiveCoords: { lat: number | null; lng: number | null; source?: string | null } | null;
}): string {
  const { trip, effectiveLiveCoords } = params;
  const coordText =
    effectiveLiveCoords?.lat != null && effectiveLiveCoords?.lng != null
      ? `${effectiveLiveCoords.lat.toFixed(5)}, ${effectiveLiveCoords.lng.toFixed(5)}`
      : "Konum yok";
  return [
    `Sefer Ozeti`,
    `Sofor: ${trip.driverName}`,
    `Arac: ${trip.driverPlate ?? "-"}`,
    `Rota: ${trip.routeName}`,
    `Durum: ${trip.liveState === "online" ? "Canli" : "Stale"}`,
    `Son Sinyal: ${formatLastSignal(trip.lastLocationAt)}`,
    `Konum: ${coordText}`,
  ].join("\n");
}

export function formatStreamTimestamp(timestampMs: number | null, receivedAt: string | null): string {
  if (timestampMs != null && Number.isFinite(timestampMs)) {
    return formatLastSignal(new Date(timestampMs).toISOString());
  }
  if (receivedAt) {
    return formatLastSignal(receivedAt);
  }
  return "Sinyal yok";
}

export function streamStaleReasonLabel(reason: LiveOpsStreamStaleReason): string {
  if (reason === "connection_offline") return "RTDB baglanti offline";
  if (reason === "stream_error") return "RTDB stream hatasi";
  if (reason === "stream_mismatch") return "Trip stream mismatch";
  if (reason === "stream_lag_timeout") return "Stream gecikme limiti asildi";
  return "Stale yok";
}

export function formatStreamRetryCountdown(nextRetryAt: number | null): string {
  if (!nextRetryAt) return "-";
  const diffSeconds = Math.max(0, Math.ceil((nextRetryAt - Date.now()) / 1000));
  return `${diffSeconds} sn`;
}

export function resolveLiveOpsStreamLagTone(lagSeconds: number | null): LiveOpsStreamLagTone {
  if (lagSeconds == null) return "none";
  if (lagSeconds > 45) return "critical";
  if (lagSeconds > 25) return "warn";
  return "ok";
}

export function streamLagToneClasses(tone: LiveOpsStreamLagTone): string {
  if (tone === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (tone === "warn") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (tone === "ok") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-line bg-white text-slate-700";
}

export function streamRecoveryToneClasses(tone: LiveOpsStreamRecoveryTone): string {
  if (tone === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (tone === "warn") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-line bg-white text-slate-700";
}

export function buildLiveOpsStreamRecoverySummary(params: {
  staleReason: LiveOpsStreamStaleReason;
  lagSeconds: number | null;
  retryAttempt: number;
  nextRetryAt: number | null;
}): LiveOpsStreamRecoverySummary {
  const staleLabel =
    params.staleReason === "none" ? null : streamStaleReasonLabel(params.staleReason);
  const lagLabel = params.lagSeconds == null ? null : `Lag ${params.lagSeconds} sn`;
  const retryLabel =
    params.nextRetryAt == null
      ? null
      : `Deneme ${params.retryAttempt} - ${formatStreamRetryCountdown(params.nextRetryAt)} sonra`;
  const lagTone = resolveLiveOpsStreamLagTone(params.lagSeconds);
  const needsRecovery =
    staleLabel != null || retryLabel != null || lagTone === "warn" || lagTone === "critical";

  if (!needsRecovery) {
    return {
      needsRecovery: false,
      tone: "none",
      line: null,
      staleLabel,
      lagLabel,
      retryLabel,
    };
  }

  const tone: LiveOpsStreamRecoveryTone =
    lagTone === "critical" ||
    params.staleReason === "connection_offline" ||
    params.staleReason === "stream_error" ||
    params.staleReason === "stream_lag_timeout"
      ? "critical"
      : "warn";

  const parts = [staleLabel, lagLabel, retryLabel].filter(
    (part): part is string => part != null && part.length > 0,
  );
  const line =
    parts.length > 0
      ? `Stream toparlanma gerekiyor: ${parts.join(" · ")}.`
      : "Stream toparlanma gerekiyor.";

  return {
    needsRecovery: true,
    tone,
    line,
    staleLabel,
    lagLabel,
    retryLabel,
  };
}

export function statusBadgeClasses(liveState: "online" | "stale") {
  if (liveState === "online") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function statusLabel(liveState: "online" | "stale") {
  return liveState === "online" ? "Canli" : "Stale";
}

export function streamStatusLabel(status: LiveOpsStreamStatus) {
  switch (status) {
    case "live":
      return "RTDB Stream Canli";
    case "connecting":
      return "RTDB Stream Baglaniyor";
    case "mismatch":
      return "RTDB Payload Baska Sefer";
    case "error":
      return "RTDB Stream Hata";
    default:
      return "RTDB Stream Idle";
  }
}

export function streamStatusClasses(status: LiveOpsStreamStatus) {
  switch (status) {
    case "live":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "connecting":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "mismatch":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-line bg-white text-slate-700";
  }
}

export function streamErrorSemantic(error: string | null): "none" | "access_denied" | "other_error" {
  if (!error) return "none";
  const normalized = error.toLowerCase();
  if (normalized.includes("permission_denied") || normalized.includes("permission denied")) {
    return "access_denied";
  }
  return "other_error";
}

export function resolveStreamIssueLabel(params: {
  streamStatus: LiveOpsStreamStatus;
  rtdbConnectionStatus: LiveOpsRtdbConnectionStatus;
  streamErrorSemantic: "none" | "access_denied" | "other_error";
}) {
  return resolveStreamIssueState(params).label;
}

export function resolveStreamIssueState(params: {
  streamStatus: LiveOpsStreamStatus;
  rtdbConnectionStatus: LiveOpsRtdbConnectionStatus;
  streamErrorSemantic: "none" | "access_denied" | "other_error";
}): LiveOpsStreamIssueState {
  const { streamStatus, rtdbConnectionStatus, streamErrorSemantic } = params;
  if (streamErrorSemantic === "access_denied") {
    return {
      label: "RTDB okuma yetkisi reddedildi (read-side fallback aktif).",
      tone: "error",
    };
  }
  if (rtdbConnectionStatus === "error") {
    return {
      label: "RTDB baglanti hatasi. Read-side fallback ile devam.",
      tone: "error",
    };
  }
  if (streamStatus === "error") {
    return {
      label: "RTDB stream hatasi algilandi. Read-side fallback ile devam.",
      tone: "error",
    };
  }
  if (rtdbConnectionStatus === "offline") {
    return {
      label: "RTDB baglantisi offline. Read-side fallback ile devam.",
      tone: "warn",
    };
  }
  if (streamStatus === "mismatch") {
    return {
      label: "RTDB stream baska sefer verisi donuyor (mismatch).",
      tone: "warn",
    };
  }
  return {
    label: null,
    tone: "none",
  };
}

export function resolveStreamIssuePresentation(
  state: LiveOpsStreamIssueState,
): LiveOpsStreamIssuePresentation {
  if (state.tone === "error") {
    return {
      containerClass: "border-rose-200 bg-rose-50 text-rose-800",
      textClass: "text-rose-700",
      severityLabel: "Kritik",
    };
  }
  if (state.tone === "warn") {
    return {
      containerClass: "border-amber-200 bg-amber-50 text-amber-800",
      textClass: "text-amber-700",
      severityLabel: "Uyari",
    };
  }
  return {
    containerClass: "border-line bg-white text-slate-700",
    textClass: "text-slate-700",
    severityLabel: "Yok",
  };
}

export function buildLiveOpsStreamIssueSummary(
  state: LiveOpsStreamIssueState,
): LiveOpsStreamIssueSummary {
  if (state.tone === "error") {
    return {
      shortLabel: "Stream: Kritik",
      shortClass: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (state.tone === "warn") {
    return {
      shortLabel: "Stream: Uyari",
      shortClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    shortLabel: "Stream: Stabil",
    shortClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function buildLiveOpsStreamContextLine(state: LiveOpsStreamIssueState): string {
  const summary = buildLiveOpsStreamIssueSummary(state);
  if (state.label) {
    return `${summary.shortLabel} - ${state.label}`;
  }
  return summary.shortLabel;
}

export function buildLiveOpsStreamRecoveryContextLine(
  summary: LiveOpsStreamRecoverySummary,
): string {
  if (!summary.needsRecovery) {
    return "Toparlanma: Gerekmiyor";
  }
  return summary.line ?? "Toparlanma: Gerekli";
}

export function resolveLiveOpsStreamContextMessage(params: {
  streamIssueState: LiveOpsStreamIssueState;
  streamStatus: LiveOpsStreamStatus;
  rtdbConnectionStatus: LiveOpsRtdbConnectionStatus;
  fallbackLabel?: string;
}): string {
  const { streamIssueState, streamStatus, rtdbConnectionStatus, fallbackLabel } = params;
  if (streamIssueState.label) {
    return streamIssueState.label;
  }
  if (streamStatus === "live") {
    return "RTDB stream aktif (secili sefer + marker overlay)";
  }
  if (streamStatus === "mismatch") {
    return "RTDB payload baska seferde";
  }
  if (rtdbConnectionStatus === "offline") {
    return "RTDB baglanti yok (read-side fallback)";
  }
  if (streamStatus === "connecting" || rtdbConnectionStatus === "connecting") {
    return "RTDB stream baglanti kontrolu suruyor";
  }
  return fallbackLabel ?? "Liste read-side + stream fallback";
}

export function buildLiveOpsFilterContextLine(context: LiveOpsFilterContext): string {
  const riskLabel =
    context.riskTone === "critical"
      ? "kritik"
      : context.riskTone === "warning"
        ? "uyari"
        : "tum";
  const routeLabel = context.routeFilterId ? "secili" : "tum";
  const driverLabel = context.driverFilterUid ? "secili" : "tum";
  const searchLabel = context.searchText.trim() ? context.searchText.trim() : "-";
  const staleLabel = context.hideStale ? "gizli" : "gorunur";
  return [
    `sort=${context.sortOption}`,
    `risk=${riskLabel}`,
    `stale=${staleLabel}`,
    `limit=top-${context.riskQueueLimit}`,
    `route=${routeLabel}`,
    `driver=${driverLabel}`,
    `search=${searchLabel}`,
  ].join(", ");
}

export function buildLiveOpsFilterContextSummary(context: LiveOpsFilterContext): string {
  const riskLabel =
    context.riskTone === "critical"
      ? "Kritik"
      : context.riskTone === "warning"
        ? "Uyari"
        : "Tum";
  const routeLabel = context.routeFilterId ? "Rota secili" : "Tum rotalar";
  const driverLabel = context.driverFilterUid ? "Sofor secili" : "Tum soforler";
  const staleLabel = context.hideStale ? "Stale gizli" : "Stale gorunur";
  const searchLabel = context.searchText.trim() ? `Arama: ${context.searchText.trim()}` : "Arama yok";
  return `${riskLabel} odak | ${routeLabel} | ${driverLabel} | ${staleLabel} | ${searchLabel}`;
}

export function rtdbConnectionStatusLabel(status: LiveOpsRtdbConnectionStatus) {
  switch (status) {
    case "online":
      return "RTDB Bagli";
    case "offline":
      return "RTDB Baglanti Yok";
    case "connecting":
      return "RTDB Baglanti Kontrol";
    case "error":
      return "RTDB Baglanti Hata";
    default:
      return "RTDB Baglanti Idle";
  }
}

export function rtdbConnectionStatusClasses(
  status: LiveOpsRtdbConnectionStatus,
) {
  switch (status) {
    case "online":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "offline":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "connecting":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-line bg-white text-slate-700";
  }
}

export function readBooleanPreference(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

export function writeBooleanPreference(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // noop
  }
}

export function readStringPreference(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw && raw.trim().length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function writeStringPreference(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value == null || value === "") {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

export function buildLiveOpsTripDeepLinkQuery(params: {
  tripId: string;
  routeId: string;
  driverUid: string;
  sortOption?: LiveOpsSortOption;
  riskTone?: LiveOpsRiskTone | null;
  hideStale?: boolean;
  riskQueueLimit?: LiveOpsRiskQueueLimit;
  baseSearchParams?: string | URLSearchParams | null;
}): string {
  const next = params.baseSearchParams
    ? new URLSearchParams(params.baseSearchParams)
    : new URLSearchParams();

  next.set("tripId", params.tripId);
  next.set("routeId", params.routeId);
  next.set("driverUid", params.driverUid);

  if (params.sortOption) {
    next.set("sort", params.sortOption);
  } else if (!next.get("sort")) {
    next.set("sort", "signal_desc");
  }

  if (params.riskTone) {
    next.set("riskTone", params.riskTone);
  } else {
    next.delete("riskTone");
  }

  if (params.hideStale) {
    next.set("hideStale", "1");
  } else {
    next.delete("hideStale");
  }

  if (params.riskQueueLimit && params.riskQueueLimit !== 4) {
    next.set("riskLimit", String(params.riskQueueLimit));
  } else {
    next.delete("riskLimit");
  }

  return next.toString();
}

export function buildLiveOpsTripDeepLink(params: {
  tripId: string;
  routeId: string;
  driverUid: string;
  sortOption?: LiveOpsSortOption;
  riskTone?: LiveOpsRiskTone | null;
  hideStale?: boolean;
  riskQueueLimit?: LiveOpsRiskQueueLimit;
  baseSearchParams?: string | URLSearchParams | null;
  origin?: string | null;
}): string {
  const query = buildLiveOpsTripDeepLinkQuery(params);
  const origin = params.origin ?? "https://app.neredeservis.app";
  return query ? `${origin}/live-ops?${query}` : `${origin}/live-ops`;
}

export function formatLastRefresh(lastLoadedAt: string | null): string {
  if (!lastLoadedAt) return "Henuz yok";
  const ms = Date.parse(lastLoadedAt);
  if (!Number.isFinite(ms)) return "Bilinmiyor";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSeconds < 5) return "Az once";
  if (diffSeconds < 60) return `${diffSeconds} sn once`;
  const minutes = Math.floor(diffSeconds / 60);
  return `${minutes} dk once`;
}

export function filterAndSortActiveTrips(params: {
  items: CompanyActiveTripSummary[];
  searchText: string;
  sortOption: LiveOpsSortOption;
}) {
  const { items, searchText, sortOption } = params;
  const normalizedSearch = searchText.trim().toLocaleLowerCase("tr");
  const filtered = items.filter((item) => {
    if (!normalizedSearch) return true;
    return [item.driverName, item.driverPlate ?? "", item.routeName, item.tripId]
      .join(" ")
      .toLocaleLowerCase("tr")
      .includes(normalizedSearch);
  });

  const sorted = [...filtered];
  const riskSortMeta = new Map<
    string,
    {
      toneWeight: number;
      ageWeight: number;
    }
  >();
  if (sortOption === "risk_desc") {
    for (const item of sorted) {
      const risk = evaluateLiveOpsTripRisk(item);
      riskSortMeta.set(item.tripId, {
        toneWeight: risk?.tone === "critical" ? 2 : risk?.tone === "warning" ? 1 : 0,
        ageWeight: risk?.signalAgeMinutes ?? -1,
      });
    }
  }

  sorted.sort((left, right) => {
    if (sortOption === "risk_desc") {
      const rightMeta = riskSortMeta.get(right.tripId) ?? { toneWeight: 0, ageWeight: -1 };
      const leftMeta = riskSortMeta.get(left.tripId) ?? { toneWeight: 0, ageWeight: -1 };
      const toneDelta = rightMeta.toneWeight - leftMeta.toneWeight;
      if (toneDelta !== 0) return toneDelta;
      const ageDelta = rightMeta.ageWeight - leftMeta.ageWeight;
      if (ageDelta !== 0) return ageDelta;
      return left.driverName.localeCompare(right.driverName, "tr");
    }
    if (sortOption === "driver_asc") {
      return left.driverName.localeCompare(right.driverName, "tr");
    }
    if (sortOption === "plate_asc") {
      return (left.driverPlate ?? "~").localeCompare(right.driverPlate ?? "~", "tr");
    }
    if (sortOption === "state") {
      const stateDelta = (left.liveState === "online" ? 0 : 1) - (right.liveState === "online" ? 0 : 1);
      if (stateDelta !== 0) return stateDelta;
      return left.driverName.localeCompare(right.driverName, "tr");
    }
    const rightSignalMs = right.lastLocationAt ? Date.parse(right.lastLocationAt) : 0;
    const leftSignalMs = left.lastLocationAt ? Date.parse(left.lastLocationAt) : 0;
    if (rightSignalMs !== leftSignalMs) return rightSignalMs - leftSignalMs;
    return left.driverName.localeCompare(right.driverName, "tr");
  });
  return sorted;
}

export function buildTripDriverOptions(items: CompanyActiveTripSummary[]) {
  const map = new Map<string, { uid: string; label: string }>();
  for (const trip of items) {
    if (!map.has(trip.driverUid)) {
      map.set(trip.driverUid, {
        uid: trip.driverUid,
        label: `${trip.driverName}${trip.driverPlate ? ` (${trip.driverPlate})` : ""}`,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

export function buildLiveOpsRiskQueue(
  items: CompanyActiveTripSummary[],
  maxItems = 5,
): LiveOpsRiskQueueItem[] {
  const queue: LiveOpsRiskQueueItem[] = [];
  for (const trip of items) {
    const risk = evaluateLiveOpsTripRisk(trip);
    if (risk) {
      queue.push({
        trip,
        tone: risk.tone,
        reason: risk.reason,
        signalAgeMinutes: risk.signalAgeMinutes,
      });
    }
  }

  queue.sort((left, right) => {
    const toneWeight = (item: LiveOpsRiskQueueItem) => (item.tone === "critical" ? 2 : 1);
    const toneDelta = toneWeight(right) - toneWeight(left);
    if (toneDelta !== 0) return toneDelta;
    const ageLeft = left.signalAgeMinutes ?? Number.POSITIVE_INFINITY;
    const ageRight = right.signalAgeMinutes ?? Number.POSITIVE_INFINITY;
    if (ageRight !== ageLeft) return ageRight - ageLeft;
    return left.trip.driverName.localeCompare(right.trip.driverName, "tr");
  });

  return queue.slice(0, maxItems);
}

export function evaluateLiveOpsTripRisk(trip: CompanyActiveTripSummary): LiveOpsRiskEvaluation | null {
  const ageMinutes = signalAgeMinutes(trip.lastLocationAt);
  if (trip.liveState === "stale") {
    return {
      tone: "critical",
      reason: ageMinutes == null ? "Sinyal yok / stale" : `Stale (${ageMinutes} dk)`,
      signalAgeMinutes: ageMinutes,
    };
  }
  if (ageMinutes == null) {
    return {
      tone: "critical",
      reason: "Sinyal yok",
      signalAgeMinutes: null,
    };
  }
  if (ageMinutes >= 10) {
    return {
      tone: "critical",
      reason: `Sinyal gecikmesi ${ageMinutes} dk`,
      signalAgeMinutes: ageMinutes,
    };
  }
  if (ageMinutes >= 4) {
    return {
      tone: "warning",
      reason: `Sinyal gecikmesi ${ageMinutes} dk`,
      signalAgeMinutes: ageMinutes,
    };
  }
  return null;
}

export function buildLiveOpsMapTelemetry(
  trips: CompanyActiveTripSummary[],
): LiveOpsMapTelemetry {
  const totalCount = trips.length;
  const onlineCount = trips.filter((trip) => trip.liveState === "online").length;
  const staleCount = totalCount - onlineCount;
  const criticalCount = trips.filter((trip) => evaluateLiveOpsTripRisk(trip)?.tone === "critical").length;
  const warningCount = trips.filter((trip) => evaluateLiveOpsTripRisk(trip)?.tone === "warning").length;
  const riskDensityPercent =
    totalCount === 0 ? 0 : Math.round(((criticalCount + warningCount) / totalCount) * 100);
  const riskDensityLabel: "Dusuk" | "Orta" | "Yuksek" =
    riskDensityPercent >= 60 ? "Yuksek" : riskDensityPercent >= 30 ? "Orta" : "Dusuk";
  const perfTone: LiveOpsMapPerfTone =
    totalCount >= 220 ? "slow" : totalCount >= 140 ? "warn" : "ok";
  const perfLabel: "OK" | "Izle" | "Yavas" =
    perfTone === "slow" ? "Yavas" : perfTone === "warn" ? "Izle" : "OK";
  const healthLabel: "Stabil" | "Izlenmeli" | "Kritik" =
    perfTone === "slow" || riskDensityPercent >= 75
      ? "Kritik"
      : perfTone === "warn" || riskDensityPercent >= 45
        ? "Izlenmeli"
        : "Stabil";
  return {
    totalCount,
    onlineCount,
    staleCount,
    criticalCount,
    warningCount,
    riskDensityPercent,
    riskDensityLabel,
    perfTone,
    perfLabel,
    healthLabel,
  };
}
