import { asRecord } from './type_guards.js';

export function pickString(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) {
    return null;
  }
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

export function maskPhoneForSnapshot(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) {
    return null;
  }

  const visiblePrefix = digits.slice(0, 2);
  const visibleSuffix = digits.slice(-2);
  const maskedMiddle = '*'.repeat(Math.max(0, digits.length - 4));
  return `${visiblePrefix}${maskedMiddle}${visibleSuffix}`;
}

export function pickStringArray(record: Record<string, unknown> | null, key: string): string[] {
  if (!record) {
    return [];
  }
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export function pickFiniteNumber(
  record: Record<string, unknown> | null,
  key: string,
): number | null {
  if (!record) {
    return null;
  }
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function pickGeoPoint(
  record: Record<string, unknown> | null,
  key: string,
): { lat: number; lng: number } | null {
  if (!record) {
    return null;
  }
  const value = asRecord(record[key]);
  if (!value) {
    return null;
  }
  const lat = value['lat'];
  const lng = value['lng'];
  if (typeof lat !== 'number' || !Number.isFinite(lat)) {
    return null;
  }
  if (typeof lng !== 'number' || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

export function normalizeAuthorizedDriverIds(rawIds: readonly string[], ownerUid: string): string[] {
  const unique = new Set<string>();
  for (const raw of rawIds) {
    const normalized = raw.trim();
    if (!normalized || normalized === ownerUid) {
      continue;
    }
    unique.add(normalized);
  }
  return Array.from(unique.values());
}

export function buildIstanbulDateKey(when: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(when);
}

export function readTransitionVersion(record: Record<string, unknown> | null): number {
  const rawValue = record?.transitionVersion;
  if (typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue >= 0) {
    return rawValue;
  }
  return 0;
}

export function parseIsoToMs(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sameStringArray(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

export function parseHourMinuteToMinuteOfDay(value: string | null): number | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }
  const [hourText, minuteText] = value.split(':', 2);
  if (!hourText || !minuteText) {
    return null;
  }
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

export function getIstanbulClockInfo(when: Date): { dateKey: string; minuteOfDay: number } | null {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(when);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const hourText = parts.find((part) => part.type === 'hour')?.value;
  const minuteText = parts.find((part) => part.type === 'minute')?.value;
  if (!year || !month || !day || !hourText || !minuteText) {
    return null;
  }

  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return {
    dateKey: `${year}-${month}-${day}`,
    minuteOfDay: hour * 60 + minute,
  };
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

export function collectEnabledRouteWriters(
  value: unknown,
  maxEntries: number,
): Array<{ routeId: string; driverId: string }> {
  if (maxEntries <= 0) {
    return [];
  }
  const routeWriterTree = asRecord(value);
  if (!routeWriterTree) {
    return [];
  }

  const entries: Array<{ routeId: string; driverId: string }> = [];
  for (const [routeId, routeNode] of Object.entries(routeWriterTree)) {
    const routeWriters = asRecord(routeNode);
    if (!routeWriters) {
      continue;
    }

    for (const [driverId, enabled] of Object.entries(routeWriters)) {
      if (enabled !== true) {
        continue;
      }
      entries.push({ routeId, driverId });
      if (entries.length >= maxEntries) {
        return entries;
      }
    }
  }

  return entries;
}

