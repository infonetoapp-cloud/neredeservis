"use client";

/**
 * PanelMode — MVP'de web her zaman "company" modunda çalışır.
 * Bireysel (individual) mod kaldırıldı. Tip ve yardımcı fonksiyonlar
 * geriye uyumluluk için korunuyor; localStorage artık kullanılmıyor.
 */

export type PanelMode = "company";

/** @deprecated Her zaman "company" döner. */
export function parsePanelMode(_value: string | null | undefined): PanelMode {
  return "company";
}

/** @deprecated Her zaman "company" döner. */
export function readStoredPanelMode(): PanelMode {
  return "company";
}

/** @deprecated Noop — localStorage artık kullanılmıyor. */
export function writeStoredPanelMode(_mode: PanelMode): void {}

/** @deprecated Noop — subscribe mekanizması kaldırıldı. */
export function subscribePanelMode(_listener: () => void): () => void {
  return () => {};
}

/**
 * Login sonrası yönlendirme yolu. `next` query parametresi varsa onu kullanır,
 * yoksa `/dashboard` döner.
 */
export function resolvePostLoginPath(nextPathRaw: string | null | undefined): string {
  const nextPath = (nextPathRaw ?? "").trim();

  if (!nextPath || !nextPath.startsWith("/")) {
    return "/dashboard";
  }

  return nextPath;
}

/** @deprecated Her zaman "company" döner. */
export function getModeLabel(_mode: PanelMode): string {
  return "company";
}
