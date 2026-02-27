"use client";

export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("tr-TR");
  } catch {
    return "-";
  }
}

export function formatAdminLabeledDateTime(
  label: string,
  value: string | null | undefined,
): string {
  return `${label}: ${formatAdminDateTime(value)}`;
}
