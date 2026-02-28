"use client";

type BlockingLinkConfig = {
  href: string;
  title: string;
};

const BLOCKING_LINKS: Record<string, BlockingLinkConfig> = {
  "Release Gate": {
    href: "#phase5-release-gate",
    title: "Release Gate kartina git",
  },
  "Smoke Checklist": {
    href: "#phase5-smoke-checklist",
    title: "Smoke Checklist kartina git",
  },
  "Smoke Runbook": {
    href: "#phase5-smoke-runbook",
    title: "Smoke Runbook kartina git",
  },
  Security: {
    href: "#phase5-security-hardening",
    title: "Security hardening kartina git",
  },
  Secrets: {
    href: "#phase5-secret-hygiene",
    title: "Secret hygiene kartina git",
  },
  CORS: {
    href: "#phase5-cors-allowlist",
    title: "CORS allow-list kartina git",
  },
};

export type AdminPhase5BlockingLinkItem = {
  label: string;
  href: string;
  title: string;
};

export type AdminPhase5BlockingPreview = {
  visibleItems: AdminPhase5BlockingLinkItem[];
  hiddenCount: number;
};

export function buildAdminPhase5BlockingLinkItems(
  labels: string[],
): AdminPhase5BlockingLinkItem[] {
  return labels.map((label) => {
    const config = BLOCKING_LINKS[label];
    if (!config) {
      return {
        label,
        href: "#phase5-summary",
        title: "Faz 5 ozet kartina git",
      };
    }
    return {
      label,
      href: config.href,
      title: config.title,
    };
  });
}

export function resolveAdminPhase5FirstBlockingLink(
  labels: string[],
): AdminPhase5BlockingLinkItem | null {
  const items = buildAdminPhase5BlockingLinkItems(labels);
  return items[0] ?? null;
}

export function resolveAdminPhase5BlockingPreview(
  labels: string[],
  limit = 3,
): AdminPhase5BlockingPreview {
  const items = buildAdminPhase5BlockingLinkItems(labels);
  return {
    visibleItems: items.slice(0, Math.max(0, limit)),
    hiddenCount: Math.max(0, items.length - Math.max(0, limit)),
  };
}

export function buildAdminPhase5BlockingSummary(labels: string[], limit = 2): string {
  if (labels.length === 0) return "-";
  const visible = labels.slice(0, Math.max(0, limit));
  const hiddenCount = Math.max(0, labels.length - visible.length);
  if (hiddenCount === 0) return visible.join(", ");
  return `${visible.join(", ")} +${hiddenCount}`;
}
