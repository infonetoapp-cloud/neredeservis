"use client";

export const ACTIVE_COMPANY_STORAGE_KEY = "nsv.activeCompany.v1";
export const ACTIVE_COMPANY_STORAGE_EVENT = "nsv:active-company-changed";

export type ActiveCompanyPreference = {
  companyId: string;
  companyName: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readActiveCompanyPreference(): ActiveCompanyPreference | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ActiveCompanyPreference>;
    if (
      typeof parsed.companyId === "string" &&
      parsed.companyId &&
      typeof parsed.companyName === "string" &&
      parsed.companyName
    ) {
      return { companyId: parsed.companyId, companyName: parsed.companyName };
    }
  } catch {
    // no-op
  }
  return null;
}

export function writeActiveCompanyPreference(input: ActiveCompanyPreference) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, JSON.stringify(input));
  window.dispatchEvent(new Event(ACTIVE_COMPANY_STORAGE_EVENT));
}

export function clearActiveCompanyPreference() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
  window.dispatchEvent(new Event(ACTIVE_COMPANY_STORAGE_EVENT));
}

export function subscribeActiveCompanyPreference(
  callback: () => void,
): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === ACTIVE_COMPANY_STORAGE_KEY) {
      callback();
    }
  };
  const onCustom = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(ACTIVE_COMPANY_STORAGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ACTIVE_COMPANY_STORAGE_EVENT, onCustom);
  };
}
