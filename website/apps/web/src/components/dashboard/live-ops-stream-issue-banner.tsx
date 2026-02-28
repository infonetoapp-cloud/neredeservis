"use client";

import {
  resolveStreamIssuePresentation,
  type LiveOpsStreamIssueState,
} from "@/components/dashboard/live-ops-company-active-trips-helpers";

type LiveOpsStreamIssueBannerProps = {
  issueState: LiveOpsStreamIssueState;
  className?: string;
  showSeverity?: boolean;
};

export function LiveOpsStreamIssueBanner({
  issueState,
  className = "",
  showSeverity = true,
}: LiveOpsStreamIssueBannerProps) {
  if (!issueState.label) return null;
  const presentation = resolveStreamIssuePresentation(issueState);
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 text-xs ${presentation.containerClass} ${className}`.trim()}
    >
      {showSeverity ? (
        <span className="mr-1 font-semibold">{presentation.severityLabel}:</span>
      ) : null}
      <span>{issueState.label}</span>
    </div>
  );
}

