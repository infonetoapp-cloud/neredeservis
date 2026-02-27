"use client";

import type { LiveOpsTripInsight } from "@/components/dashboard/live-ops-selected-trip-insights";
import {
  resolveStreamIssuePresentation,
  type LiveOpsStreamIssueState,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";
import { LiveOpsStreamIssueChip } from "@/components/dashboard/live-ops-stream-issue-chip";
import type { DispatchTemplateId } from "@/components/dashboard/use-live-ops-dispatch-actions";

type PlaybookMode = "stream_issue" | "critical" | "warning" | "stable";

type LiveOpsOperatorPlaybookCardProps = {
  tripInsight: LiveOpsTripInsight | null;
  streamIssueState: LiveOpsStreamIssueState;
  onOpenRouteEditor: () => void;
  onCopyTripLink: () => void | Promise<void>;
  onCopySupportPacket: () => void | Promise<void>;
  onSendWhatsAppTemplate: (templateId: DispatchTemplateId) => void;
};

type PlaybookAction = {
  id: string;
  label: string;
  tone: "primary" | "neutral";
  onClick: () => void;
};

type PlaybookCopy = {
  title: string;
  description: string;
  modeLabel: string;
};

function resolvePlaybookMode(params: {
  tripInsight: LiveOpsTripInsight | null;
  streamIssueState: LiveOpsStreamIssueState;
}): PlaybookMode {
  const { tripInsight, streamIssueState } = params;
  if (streamIssueState.tone !== "none") {
    return "stream_issue";
  }
  if (tripInsight?.riskTone === "critical") {
    return "critical";
  }
  if (tripInsight?.riskTone === "warning") {
    return "warning";
  }
  return "stable";
}

function resolvePlaybookCopy(mode: PlaybookMode): PlaybookCopy {
  switch (mode) {
    case "stream_issue":
      return {
        title: "Operasyon Playbook",
        description: "Canli stream sorunu var. Once destek kaydini hazirlayip ekip icinde paylas.",
        modeLabel: "Stream Sorunu",
      };
    case "critical":
      return {
        title: "Operasyon Playbook",
        description: "Kritik risk gorunuyor. Yolcu beklentisini hizli yonet ve destek paketini hazir tut.",
        modeLabel: "Kritik",
      };
    case "warning":
      return {
        title: "Operasyon Playbook",
        description: "Uyari seviyesinde gecikme/fallback var. Proaktif dispatch mesaji onerilir.",
        modeLabel: "Uyari",
      };
    default:
      return {
        title: "Operasyon Playbook",
        description: "Sefer stabil. Standart dispatch ritminde durum bilgilendirmesi yapilabilir.",
        modeLabel: "Stabil",
      };
  }
}

function buildActions(params: {
  mode: PlaybookMode;
  onOpenRouteEditor: () => void;
  onCopyTripLink: () => void | Promise<void>;
  onCopySupportPacket: () => void | Promise<void>;
  onSendWhatsAppTemplate: (templateId: DispatchTemplateId) => void;
}): PlaybookAction[] {
  const { mode, onOpenRouteEditor, onCopyTripLink, onCopySupportPacket, onSendWhatsAppTemplate } = params;
  if (mode === "stream_issue") {
    return [
      {
        id: "support_packet",
        label: "Destek Paketini Kopyala",
        tone: "primary",
        onClick: () => {
          void onCopySupportPacket();
        },
      },
      {
        id: "trip_link",
        label: "Sefer Linkini Kopyala",
        tone: "neutral",
        onClick: () => {
          void onCopyTripLink();
        },
      },
      {
        id: "open_route",
        label: "Route Editorunu Ac",
        tone: "neutral",
        onClick: onOpenRouteEditor,
      },
    ];
  }
  if (mode === "critical") {
    return [
      {
        id: "eta_20",
        label: "WhatsApp: 20 dk Gecikme",
        tone: "primary",
        onClick: () => onSendWhatsAppTemplate("eta_delay_20"),
      },
      {
        id: "support_packet",
        label: "Destek Paketini Kopyala",
        tone: "neutral",
        onClick: () => {
          void onCopySupportPacket();
        },
      },
      {
        id: "open_route",
        label: "Route Editorunu Ac",
        tone: "neutral",
        onClick: onOpenRouteEditor,
      },
    ];
  }
  if (mode === "warning") {
    return [
      {
        id: "eta_10",
        label: "WhatsApp: 10 dk Gecikme",
        tone: "primary",
        onClick: () => onSendWhatsAppTemplate("eta_delay_10"),
      },
      {
        id: "boarding_started",
        label: "WhatsApp: Yolcu Alim Basladi",
        tone: "neutral",
        onClick: () => onSendWhatsAppTemplate("boarding_started"),
      },
      {
        id: "open_route",
        label: "Route Editorunu Ac",
        tone: "neutral",
        onClick: onOpenRouteEditor,
      },
    ];
  }
  return [
    {
      id: "arrival_soon",
      label: "WhatsApp: Varisa 5 dk",
      tone: "primary",
      onClick: () => onSendWhatsAppTemplate("arrival_soon"),
    },
    {
      id: "boarding_started",
      label: "WhatsApp: Yolcu Alim Basladi",
      tone: "neutral",
      onClick: () => onSendWhatsAppTemplate("boarding_started"),
    },
    {
      id: "copy_trip_link",
      label: "Sefer Linkini Kopyala",
      tone: "neutral",
      onClick: () => {
        void onCopyTripLink();
      },
    },
  ];
}

export function LiveOpsOperatorPlaybookCard({
  tripInsight,
  streamIssueState,
  onOpenRouteEditor,
  onCopyTripLink,
  onCopySupportPacket,
  onSendWhatsAppTemplate,
}: LiveOpsOperatorPlaybookCardProps) {
  const mode = resolvePlaybookMode({
    tripInsight,
    streamIssueState,
  });
  const copy = resolvePlaybookCopy(mode);
  const streamIssuePresentation = resolveStreamIssuePresentation(streamIssueState);
  const actions = buildActions({
    mode,
    onOpenRouteEditor,
    onCopyTripLink,
    onCopySupportPacket,
    onSendWhatsAppTemplate,
  });

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{copy.title}</div>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              mode === "stream_issue" || mode === "critical"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : mode === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {copy.modeLabel}
          </span>
          <LiveOpsStreamIssueChip issueState={streamIssueState} className="px-2 py-0.5" />
        </div>
      </div>
      <div className="mb-3 rounded-lg border border-line bg-slate-50/70 px-2.5 py-2 text-xs text-slate-700">
        {copy.description}
        {streamIssueState.label ? (
          <div className={`mt-2 text-[11px] ${streamIssuePresentation.textClass}`}>
            {streamIssuePresentation.severityLabel}: {streamIssueState.label}
          </div>
        ) : null}
      </div>
      <div className="grid gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${
              action.tone === "primary"
                ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
                : "border-line bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
