import type { CompanyDriverItem } from "@/features/company/company-client-shared";

/* ─── Status helpers ─── */

export type DriverStatus = CompanyDriverItem["status"]; // "active" | "passive"

export const DRIVER_STATUS_OPTIONS: Array<{ value: DriverStatus; label: string }> = [
  { value: "active", label: "Aktif" },
  { value: "passive", label: "Pasif" },
];

export function driverStatusBadgeClass(status: DriverStatus): string {
  return status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500";
}

export function driverStatusLabel(status: DriverStatus): string {
  return DRIVER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "—";
}

/* ─── Format helpers ─── */

export const DRIVER_NAME_MAX_LENGTH = 80;

export function formatDriverId(driverId: string): string {
  if (driverId.length <= 14) {
    return driverId;
  }
  return `${driverId.slice(0, 6)}…${driverId.slice(-4)}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) {
    return "—";
  }
  return new Date(ts).toLocaleString("tr-TR");
}

export function normalizePlateInput(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isSimpleEmailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* ─── Credential copy text ─── */

export function formatCredentialCopyText(credentials: {
  name: string;
  loginEmail: string;
  temporaryPassword: string;
}): string {
  return [
    "NeredeServis Sürücü Giriş Bilgileri",
    `Şoför: ${credentials.name}`,
    `Giriş e-postası: ${credentials.loginEmail}`,
    `Geçici şifre: ${credentials.temporaryPassword}`,
    "Not: Bu hesap sadece mobil sürücü girişi içindir.",
    "Not: Sürücü ilk girişte şifresini değiştirmelidir.",
  ].join("\n");
}

/* ─── Filter type ─── */

export type DriverFilter = "all" | "active" | "passive" | "assignment_pending";
