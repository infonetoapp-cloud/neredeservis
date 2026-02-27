"use client";

import {
  buildLiveOpsFilterContextSummary,
  formatLastRefresh,
  resolveLiveOpsStreamContextMessage,
  streamLagToneClasses,
  type LiveOpsFilterContext,
  type LiveOpsRtdbConnectionStatus,
  type LiveOpsRiskQueueLimit,
  type LiveOpsRiskTone,
  type LiveOpsStreamRecoverySummary,
  type LiveOpsStreamStatus,
  type LiveOpsStreamIssueState,
  type LiveOpsSortOption,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import { LiveOpsStreamRecoveryCallout } from "@/components/dashboard/live-ops-stream-recovery-callout";
import { LiveOpsStreamIssueChip } from "@/components/dashboard/live-ops-stream-issue-chip";
import type { CompanyRouteSummary } from "@/features/company/company-types";

type Props = {
  isRefreshing: boolean;
  lastLoadedAt: string | null;
  density: "comfortable" | "compact";
  filteredCount: number;
  onlineCount: number;
  staleCount: number;
  riskCount: number;
  criticalRiskCount: number;
  warningRiskCount: number;
  riskFocusedCount: number;
  riskHiddenByStaleCount: number;
  riskQueueLimit: LiveOpsRiskQueueLimit;
  rawTotalCount: number;
  autoRefreshEnabled: boolean;
  hideStale: boolean;
  riskToneFilter: LiveOpsRiskTone | null;
  copyViewLinkState: "idle" | "copied" | "error";
  clipboardSupported: boolean;
  hasActiveFilters: boolean;
  filterDurationMs: number;
  readModelPressure: {
    tripCount: number;
    filterDurationMs: number;
    level: "ok" | "warn" | "high";
  };
  searchText: string;
  routeFilterId: string | null;
  routeOptions: CompanyRouteSummary[];
  driverFilterUid: string | null;
  driverOptions: Array<{ uid: string; label: string }>;
  sortOption: LiveOpsSortOption;
  streamIssueState: LiveOpsStreamIssueState;
  streamRecoverySummary: LiveOpsStreamRecoverySummary;
  streamStatus: LiveOpsStreamStatus;
  rtdbConnectionStatus: LiveOpsRtdbConnectionStatus;
  selectedTripStreamLagSeconds: number | null;
  onReload: () => Promise<void> | void;
  onToggleAutoRefresh: () => void;
  onToggleHideStale: () => void;
  onRiskToneFilterChange: (tone: LiveOpsRiskTone | null) => void;
  onRiskQueueLimitChange: (limit: LiveOpsRiskQueueLimit) => void;
  onCopyViewLink: () => void;
  onResetFilters: () => void;
  onSearchTextChange: (value: string) => void;
  onRouteFilterChange: (routeId: string | null) => void;
  onDriverFilterChange: (driverUid: string | null) => void;
  onSortOptionChange: (value: LiveOpsSortOption) => void;
  filterContext: LiveOpsFilterContext;
};

export function LiveOpsTripsListToolbar({
  isRefreshing,
  lastLoadedAt,
  density,
  filteredCount,
  onlineCount,
  staleCount,
  riskCount,
  criticalRiskCount,
  warningRiskCount,
  riskFocusedCount,
  riskHiddenByStaleCount,
  riskQueueLimit,
  rawTotalCount,
  autoRefreshEnabled,
  hideStale,
  riskToneFilter,
  copyViewLinkState,
  clipboardSupported,
  hasActiveFilters,
  filterDurationMs,
  readModelPressure,
  searchText,
  routeFilterId,
  routeOptions,
  driverFilterUid,
  driverOptions,
  sortOption,
  streamIssueState,
  streamRecoverySummary,
  streamStatus,
  rtdbConnectionStatus,
  selectedTripStreamLagSeconds,
  onReload,
  onToggleAutoRefresh,
  onToggleHideStale,
  onRiskToneFilterChange,
  onRiskQueueLimitChange,
  onCopyViewLink,
  onResetFilters,
  onSearchTextChange,
  onRouteFilterChange,
  onDriverFilterChange,
  onSortOptionChange,
  filterContext,
}: Props) {
  const riskToneLabel = riskToneFilter === "critical" ? "Kritik" : riskToneFilter === "warning" ? "Uyari" : null;
  const riskToneCount =
    riskToneFilter === "critical"
      ? criticalRiskCount
      : riskToneFilter === "warning"
        ? warningRiskCount
        : 0;
  const perfTone =
    filterDurationMs >= 50 ? "slow" : filterDurationMs >= 20 ? "warn" : "ok";
  const perfBadgeClass =
    perfTone === "slow"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : perfTone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const streamContextMessage = resolveLiveOpsStreamContextMessage({
    streamIssueState,
    streamStatus,
    rtdbConnectionStatus,
    fallbackLabel: "Live ops listesi read-side odakli calisiyor",
  });
  const copyViewLinkMessage =
    copyViewLinkState === "copied"
      ? "Gorunum linki kopyalandi."
      : copyViewLinkState === "error"
        ? clipboardSupported
          ? "Link kopyalanamadi."
          : "Bu tarayici pano kopyalamayi desteklemiyor."
        : null;

  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Aktif Seferler</div>
          <div className="text-xs text-muted">Canli sefer listesi (gercek veri)</div>
          <div className="mt-1 text-[11px] text-muted">
            Son yenileme: {formatLastRefresh(lastLoadedAt)}
            {isRefreshing ? " | yenileniyor..." : ""} | density: {density}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Filtreli: {filteredCount} | Canli: {onlineCount} | Stale: {staleCount} | Ham toplam:{" "}
            {rawTotalCount}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Riskli: {riskCount} | Kritik: {criticalRiskCount} | Uyari: {warningRiskCount}
          </div>
          <div className="mt-1 text-[11px] text-muted">Risk kuyrugu limiti: Top {riskQueueLimit}</div>
          <div className="mt-1 text-[11px] text-muted">
            Perf smoke: filtre+sirala {filterDurationMs} ms
            <span className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${perfBadgeClass}`}>
              {perfTone === "slow" ? "Yavas" : perfTone === "warn" ? "Izle" : "OK"}
            </span>
            <LiveOpsStreamIssueChip
              issueState={streamIssueState}
              className="ml-2 inline-flex px-2 py-0.5"
            />
          </div>
          <div className="mt-1 text-[11px] text-muted">Stream ozet: {streamContextMessage}</div>
          {streamRecoverySummary.staleLabel || selectedTripStreamLagSeconds != null ? (
            <div className="mt-1 text-[11px] text-muted">
              Secili stream: {streamRecoverySummary.staleLabel ?? "stale yok"}
              {selectedTripStreamLagSeconds != null ? (
                <span
                  className={`ml-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${streamLagToneClasses(
                    streamRecoverySummary.tone === "critical"
                      ? "critical"
                      : streamRecoverySummary.tone === "warn"
                        ? "warn"
                        : "ok",
                  )}`}
                >
                  Lag {selectedTripStreamLagSeconds} sn
                </span>
              ) : null}
            </div>
          ) : null}
          {streamRecoverySummary.retryLabel ? (
            <div className="mt-1 text-[11px] text-muted">Backoff: {streamRecoverySummary.retryLabel}</div>
          ) : null}
          <div className="mt-1 text-[11px] text-muted">
            Filtre ozet: {buildLiveOpsFilterContextSummary(filterContext)}
          </div>
          {copyViewLinkMessage ? (
            <div className="mt-1 text-[11px] font-medium text-slate-700">{copyViewLinkMessage}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => void onReload()}
            aria-label="Aktif sefer listesini yenile"
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {isRefreshing ? "Yenileniyor..." : "Yenile"}
          </button>
          <button
            type="button"
            onClick={onToggleAutoRefresh}
            aria-pressed={autoRefreshEnabled}
            aria-label="Otomatik yenilemeyi ac veya kapat"
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              autoRefreshEnabled
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-line bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {autoRefreshEnabled ? "Oto Yenileme Acik" : "Oto Yenileme Kapali"}
          </button>
          <button
            type="button"
            onClick={onToggleHideStale}
            aria-pressed={hideStale}
            aria-label="Stale seferleri gizle veya goster"
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {hideStale ? "Stale Goster (Alt+H)" : "Stale Gizle (Alt+H)"}
          </button>
          <button
            type="button"
            onClick={() => onRiskQueueLimitChange(riskQueueLimit === 4 ? 8 : 4)}
            aria-label="Risk kuyrugu limitini degistir"
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Risk Kuyrugu: Top {riskQueueLimit}
          </button>
          <button
            type="button"
            onClick={() =>
              onRiskToneFilterChange(riskToneFilter === "critical" ? null : "critical")
            }
            aria-pressed={riskToneFilter === "critical"}
            aria-label="Kritik risk odagini ac veya kapat"
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              riskToneFilter === "critical"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-line bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Kritik Odak
          </button>
          <button
            type="button"
            onClick={() =>
              onRiskToneFilterChange(riskToneFilter === "warning" ? null : "warning")
            }
            aria-pressed={riskToneFilter === "warning"}
            aria-label="Uyari risk odagini ac veya kapat"
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              riskToneFilter === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-line bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Uyari Odak
          </button>
          <button
            type="button"
            onClick={onCopyViewLink}
            aria-label="Canli operasyon gorunum linkini kopyala"
            disabled={!clipboardSupported}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              clipboardSupported
                ? "border-line bg-white text-slate-700 hover:bg-slate-50"
                : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            Gorunumu Kopyala
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            aria-label="Live ops filtrelerini sifirla"
            disabled={!hasActiveFilters}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              hasActiveFilters
                ? "border-line bg-white text-slate-700 hover:bg-slate-50"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {hasActiveFilters ? "Filtreleri Sifirla" : "Filtre Yok"}
          </button>
        </div>
      </div>

      {readModelPressure.level !== "ok" ? (
        <div
          className={`mb-3 rounded-lg border px-2.5 py-2 text-xs ${
            readModelPressure.level === "high"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          Read-model baskisi: {readModelPressure.tripCount} sefer, filtre+sirala{" "}
          {readModelPressure.filterDurationMs} ms. Projection endpoint (server-side) kararini degerlendir.
        </div>
      ) : null}
      <LiveOpsStreamRecoveryCallout
        summary={streamRecoverySummary}
        className="mb-3"
        onReload={onReload}
        onFocusCritical={
          riskToneFilter !== "critical"
            ? () => onRiskToneFilterChange("critical")
            : null
        }
        onHideStale={!hideStale ? onToggleHideStale : null}
        showFocusCriticalAction={riskToneFilter !== "critical"}
        showHideStaleAction={!hideStale}
      />

      {copyViewLinkState !== "idle" ? (
        <div
          className={`mb-3 rounded-lg border px-2.5 py-2 text-xs ${
            copyViewLinkState === "copied"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {copyViewLinkState === "copied"
            ? "Canli operasyon gorunumu panoya kopyalandi."
            : clipboardSupported
              ? "Gorunum linki kopyalanamadi. Tarayici izinlerini kontrol et."
              : "Bu tarayici pano kopyalamayi desteklemiyor. HTTPS ve modern tarayici kullan."}
        </div>
      ) : null}
      {!clipboardSupported ? (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
          Pano kopyalama desteklenmiyor. Gorunum paylasimi icin modern tarayici + HTTPS kullan.
        </div>
      ) : null}
      {riskToneFilter ? (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-xs text-indigo-800">
          <span className="min-w-0">
            Risk odagi aktif: <span className="font-semibold">{riskToneLabel}</span> ({riskToneCount} kayit) ·
            Gorunen: {riskFocusedCount}
            {hideStale && riskHiddenByStaleCount > 0
              ? ` · Stale gizlenen: ${riskHiddenByStaleCount}`
              : ""}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {hideStale && riskHiddenByStaleCount > 0 ? (
              <button
                type="button"
                onClick={onToggleHideStale}
                className="rounded-md border border-indigo-300 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Stale Gorunurlugunu Ac
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onRiskToneFilterChange(null)}
              className="rounded-md border border-indigo-300 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Risk Odagini Temizle
            </button>
          </div>
        </div>
      ) : null}
      <div className="mb-3 grid gap-2 md:grid-cols-4">
        <label className="grid gap-1 text-xs text-slate-700">
          <span className="font-medium text-slate-800">Hizli arama</span>
          <input
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Sofor, plaka, rota ara..."
            className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-blue-300"
          />
        </label>

        <label className="grid gap-1 text-xs text-slate-700">
          <span className="font-medium text-slate-800">Rota filtresi</span>
          <select
            value={routeFilterId ?? ""}
            onChange={(event) => onRouteFilterChange(event.target.value || null)}
            className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-blue-300"
          >
            <option value="">Tum rotalar</option>
            {routeOptions.map((route) => (
              <option key={route.routeId} value={route.routeId}>
                {route.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs text-slate-700">
          <span className="font-medium text-slate-800">Sofor filtresi</span>
          <select
            value={driverFilterUid ?? ""}
            onChange={(event) => onDriverFilterChange(event.target.value || null)}
            className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-blue-300"
          >
            <option value="">Tum soforler</option>
            {driverOptions.map((driver) => (
              <option key={driver.uid} value={driver.uid}>
                {driver.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs text-slate-700">
          <span className="font-medium text-slate-800">Siralama</span>
          <select
            value={sortOption}
            onChange={(event) => onSortOptionChange(event.target.value as LiveOpsSortOption)}
            className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-blue-300"
          >
            <option value="signal_desc">Son sinyal (yeni-eski)</option>
            <option value="risk_desc">Risk onceligi (kritik-uyari)</option>
            <option value="driver_asc">Sofor (A-Z)</option>
            <option value="plate_asc">Plaka (A-Z)</option>
            <option value="state">Durum (canli to stale)</option>
          </select>
        </label>
      </div>
    </>
  );
}
