"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

type RiskSeverityFilter = "all" | "warning" | "attention" | "info";

type AdminRiskFilterMetaProps = {
  selected: RiskSeverityFilter;
  searchQuery: string;
  canResetToPreset: boolean;
  onResetToPreset: () => void;
  canClearQueryPreset: boolean;
  onClearQueryPreset: () => void;
};

function toRiskSeverityLabel(selected: RiskSeverityFilter): string {
  if (selected === "all") return "Tüm seviyeler";
  if (selected === "warning") return "Kritik";
  if (selected === "attention") return "Uyarı";
  return "Bilgi";
}

export function AdminRiskFilterMeta({
  selected,
  searchQuery,
  canResetToPreset,
  onResetToPreset,
  canClearQueryPreset,
  onClearQueryPreset,
}: AdminRiskFilterMetaProps) {
  const pathname = usePathname();
  const [linkCopied, setLinkCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [supportsClipboard] = useState(
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
  );
  const trimmedSearchQuery = searchQuery.trim();

  const copyFilterLink = async () => {
    if (!supportsClipboard || typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyStatus("Tarayici panoya kopyalamayi desteklemiyor.");
      window.setTimeout(() => setCopyStatus(""), 1600);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (selected === "all") {
      params.delete("riskSeverity");
    } else {
      params.set("riskSeverity", selected);
    }
    if (searchQuery.trim().length > 0) {
      params.set("riskQ", searchQuery.trim());
    } else {
      params.delete("riskQ");
    }
    const path = pathname || "/admin";
    const queryString = params.toString();
    const fullUrl = queryString.length > 0 ? `${window.location.origin}${path}?${queryString}` : `${window.location.origin}${path}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setLinkCopied(true);
      setCopyStatus("Filtre linki kopyalandi.");
      window.setTimeout(() => {
        setLinkCopied(false);
        setCopyStatus("");
      }, 1400);
    } catch {
      setLinkCopied(false);
      setCopyStatus("Filtre linki kopyalanamadi.");
      window.setTimeout(() => setCopyStatus(""), 1600);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
      <span>
        Risk filtresi: <span className="font-semibold text-slate-900">{toRiskSeverityLabel(selected)}</span>
      </span>
      <span>
        Arama:{" "}
        <span className="font-semibold text-slate-900">{trimmedSearchQuery.length > 0 ? trimmedSearchQuery : "-"}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          void copyFilterLink();
        }}
        disabled={!supportsClipboard}
        title={supportsClipboard ? "Filtre URL'sini panoya kopyala" : "Tarayici panoya kopyalamayi desteklemiyor"}
        className={[
          "rounded-lg border border-line bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50",
          supportsClipboard ? "" : "cursor-not-allowed opacity-50",
        ].join(" ")}
      >
        {linkCopied ? "Link Kopyalandi" : "Filtre Linki Kopyala"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copyStatus}
      </span>
      {canResetToPreset ? (
        <button
          type="button"
          onClick={onResetToPreset}
          className="rounded-lg border border-line bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
        >
          URL Presetine Don
        </button>
      ) : null}
      {canClearQueryPreset ? (
        <button
          type="button"
          onClick={onClearQueryPreset}
          className="rounded-lg border border-line bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
        >
          URL Risk Filtresini Temizle
        </button>
      ) : null}
      {copyStatus ? (
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {copyStatus}
        </span>
      ) : null}
    </div>
  );
}

