"use client";

export function isLiveOpsClipboardSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.isSecureContext && navigator?.clipboard?.writeText);
}

export function liveOpsClipboardUnavailableMessage() {
  return "Bu tarayicida pano API desteklenmiyor.";
}
