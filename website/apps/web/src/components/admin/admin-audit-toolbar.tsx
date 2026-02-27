"use client";

type AdminAuditToolbarProps = {
  filterSummaryLabel: string;
  filteredRangeLabel: string;
  hasLocalOverride: boolean;
  hasQueryPreset: boolean;
  hasPinnedAuditId: boolean;
  summaryCopied: boolean;
  filterLinkCopied: boolean;
  csvExported: boolean;
  canExportCsv: boolean;
  onResetToUrlPreset: () => void;
  onClearUrlPreset: () => void;
  onClearPinnedAuditId: () => void;
  onCopySummary: () => void;
  onCopyFilterLink: () => void;
  onExportCsv: () => void;
};

export function AdminAuditToolbar({
  filterSummaryLabel,
  filteredRangeLabel,
  hasLocalOverride,
  hasQueryPreset,
  hasPinnedAuditId,
  summaryCopied,
  filterLinkCopied,
  csvExported,
  canExportCsv,
  onResetToUrlPreset,
  onClearUrlPreset,
  onClearPinnedAuditId,
  onCopySummary,
  onCopyFilterLink,
  onExportCsv,
}: AdminAuditToolbarProps) {
  return (
    <div className="mt-2 rounded-xl border border-line bg-white px-3 py-2 text-[11px] text-slate-600">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          Filtre Ozeti: <span className="font-semibold text-slate-900">{filterSummaryLabel}</span>
          <span className="mx-2 text-slate-300">|</span>
          Aralik: <span className="font-semibold text-slate-900">{filteredRangeLabel}</span>
        </div>
        {hasLocalOverride && hasQueryPreset ? (
          <button
            type="button"
            onClick={onResetToUrlPreset}
            className="rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            URL Presetine Don
          </button>
        ) : null}
        {hasQueryPreset && !hasLocalOverride ? (
          <button
            type="button"
            onClick={onClearUrlPreset}
            className="rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            URL Filtrelerini Temizle
          </button>
        ) : null}
        {hasPinnedAuditId ? (
          <button
            type="button"
            onClick={onClearPinnedAuditId}
            className="rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            Kayit Vurgusunu Kaldir
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCopySummary}
          className="rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          {summaryCopied ? "Kopyalandi" : "Ozeti Kopyala"}
        </button>
        <button
          type="button"
          onClick={onCopyFilterLink}
          className="rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          {filterLinkCopied ? "Link Kopyalandi" : "Filtre Linki Kopyala"}
        </button>
        <button
          type="button"
          onClick={onExportCsv}
          disabled={!canExportCsv}
          className="rounded-lg border border-line bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {csvExported ? "CSV Hazirlandi" : "CSV Indir"}
        </button>
      </div>
    </div>
  );
}
