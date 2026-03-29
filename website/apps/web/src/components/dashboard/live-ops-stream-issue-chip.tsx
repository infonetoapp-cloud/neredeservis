"use client";

import {
  buildLiveOpsStreamIssueSummary,
  type LiveOpsStreamIssueState,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";

type LiveOpsStreamIssueChipProps = {
  issueState: LiveOpsStreamIssueState;
  className?: string;
  title?: string;
};

export function LiveOpsStreamIssueChip({
  issueState,
  className,
  title,
}: LiveOpsStreamIssueChipProps) {
  const summary = buildLiveOpsStreamIssueSummary(issueState);
  return (
    <span
      className={`rounded-full border text-[10px] font-semibold ${summary.shortClass} ${className ?? "px-2.5 py-1"}`}
      title={title ?? issueState.label ?? "Canli akis stabil"}
    >
      {summary.shortLabel}
    </span>
  );
}
