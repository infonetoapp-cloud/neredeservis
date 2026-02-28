"use client";

export const ADMIN_STORAGE_KEYS = {
  releaseGate: "nsv:web:admin:release-gate",
  smokeChecklist: "nsv:web:admin:staging-smoke",
  smokeRunbook: "nsv:web:admin:staging-smoke-runbook",
  security: "nsv:web:admin:security-hardening",
  secrets: "nsv:web:admin:secret-hygiene",
  cors: "nsv:web:admin:cors-allowlist",
  auditDensity: "nsv:web:admin:audit-density",
} as const;

const ADMIN_STORAGE_SYNC_EVENT = "nsv:web:admin:storage-sync";
const ADMIN_STORAGE_KEY_SET = new Set<string>(Object.values(ADMIN_STORAGE_KEYS));

function isTrackedAdminStorageKey(value: string | null | undefined): value is string {
  if (!value) return false;
  return ADMIN_STORAGE_KEY_SET.has(value);
}

export function emitAdminStorageSync(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ADMIN_STORAGE_SYNC_EVENT, {
      detail: { key, at: Date.now() },
    }),
  );
}

export function subscribeAdminStorageSync(onChange: (key: string) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleCustom = (event: Event) => {
    const customEvent = event as CustomEvent<{ key?: string }>;
    const key = customEvent.detail?.key;
    if (isTrackedAdminStorageKey(key)) {
      onChange(key);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (!isTrackedAdminStorageKey(event.key)) return;
    onChange(event.key);
  };

  window.addEventListener(ADMIN_STORAGE_SYNC_EVENT, handleCustom as EventListener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(ADMIN_STORAGE_SYNC_EVENT, handleCustom as EventListener);
    window.removeEventListener("storage", handleStorage);
  };
}
