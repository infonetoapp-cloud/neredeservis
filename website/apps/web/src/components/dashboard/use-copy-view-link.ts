"use client";

import { useCallback, useState } from "react";

import { isLiveOpsClipboardSupported } from "@/components/dashboard/live-ops-clipboard-support";

export type CopyViewLinkState = "idle" | "copied" | "error";

export function useCopyViewLink() {
  const [copyViewLinkState, setCopyViewLinkState] = useState<CopyViewLinkState>("idle");

  const copyViewLink = useCallback(async (pathname: string, queryString: string) => {
    const url = `${window.location.origin}${pathname}${queryString ? `?${queryString}` : ""}`;
    if (!isLiveOpsClipboardSupported()) {
      setCopyViewLinkState("error");
      window.setTimeout(() => setCopyViewLinkState("idle"), 2_200);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyViewLinkState("copied");
      window.setTimeout(() => setCopyViewLinkState("idle"), 1_800);
    } catch {
      setCopyViewLinkState("error");
      window.setTimeout(() => setCopyViewLinkState("idle"), 2_200);
    }
  }, []);

  return { copyViewLinkState, copyViewLink };
}
