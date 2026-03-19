"use client";

import type { CompanyDriverItem } from "@/features/company/company-client-shared";

export type DriverStatus = CompanyDriverItem["status"];

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
  return DRIVER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "-";
}

export const DRIVER_NAME_MAX_LENGTH = 80;

export function formatDriverId(driverId: string): string {
  if (driverId.length <= 14) {
    return driverId;
  }
  return `${driverId.slice(0, 6)}...${driverId.slice(-4)}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("tr-TR");
}

export function normalizePlateInput(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function maskValue(value: string, keepLast: number): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length <= keepLast) {
    return normalized;
  }
  return `${"*".repeat(normalized.length - keepLast)}${normalized.slice(-keepLast)}`;
}

export function formatCredentialCopyText(credentials: {
  name: string;
  loginEmail: string;
  temporaryPassword: string;
}): string {
  return [
    "NeredeServis Mobil Şoför Giriş Bilgileri",
    `Şoför: ${credentials.name}`,
    `Giriş e-postası: ${credentials.loginEmail}`,
    `Geçici şifre: ${credentials.temporaryPassword}`,
    "Not: Bu hesap yalnızca mobil şoför girişinde kullanılır.",
  ].join("\n");
}

export type DriverFilter = "all" | "active" | "passive" | "assignment_pending";
