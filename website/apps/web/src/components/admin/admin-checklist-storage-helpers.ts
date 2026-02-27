"use client";

export type AdminChecklistStorageState = {
  checked: string[];
  updatedAt: string | null;
};

export type AdminChecklistStorageExtras = Record<string, unknown>;

function toCheckedArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function readStorageRecord(key: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { checked: toCheckedArray(parsed) };
    }
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export function readAdminChecklistStorageState(key: string): AdminChecklistStorageState {
  const record = readStorageRecord(key);
  return {
    checked: toCheckedArray(record.checked),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
  };
}

export function readAdminChecklistStorageCount(key: string): number {
  return readAdminChecklistStorageState(key).checked.length;
}

export function readAdminChecklistStorageExtras(key: string): AdminChecklistStorageExtras {
  const record = readStorageRecord(key);
  const next: AdminChecklistStorageExtras = {};
  for (const [field, value] of Object.entries(record)) {
    if (field === "checked" || field === "updatedAt") continue;
    next[field] = value;
  }
  return next;
}

export function persistAdminChecklistStorageState(
  key: string,
  checkedSet: Set<string>,
): AdminChecklistStorageState {
  return persistAdminChecklistStorageWithExtras(key, checkedSet);
}

export function persistAdminChecklistStorageWithExtras(
  key: string,
  checkedSet: Set<string>,
  extras: AdminChecklistStorageExtras = {},
): AdminChecklistStorageState {
  const next: AdminChecklistStorageState = {
    checked: Array.from(checkedSet),
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify({ ...extras, ...next }));
  }
  return next;
}
