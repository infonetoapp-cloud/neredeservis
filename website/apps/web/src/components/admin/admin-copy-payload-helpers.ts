"use client";

import { formatAdminDateTime } from "@/components/admin/admin-date-time-helpers";

type BuildAdminCopyPayloadInput = {
  title: string;
  env?: string | null;
  updatedAt?: string | null;
  bodyLines: string[];
};

export function buildAdminCopyPayload(input: BuildAdminCopyPayloadInput): string {
  const lines: string[] = [input.title];
  if (input.env) {
    lines.push(`Ortam: ${input.env}`);
  }
  lines.push(`Tarih: ${formatAdminDateTime(new Date().toISOString())}`);
  lines.push(`Son guncelleme: ${formatAdminDateTime(input.updatedAt ?? null)}`);
  lines.push(...input.bodyLines);
  return lines.join("\n");
}
