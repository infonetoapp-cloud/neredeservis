"use client";

import { callBackendApi } from "@/lib/backend-api/client";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";
import { callFirebaseCallable } from "@/lib/firebase/callable";

export type CompanyAuditLogSummary = {
  auditId: string;
  companyId: string;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  actorUid: string | null;
  status: string;
  reason: string | null;
  createdAt: string | null;
};

type ListCompanyAuditLogsResponse = {
  items: CompanyAuditLogSummary[];
};

export type CompanyAdminTenantState = {
  companyId: string;
  companyStatus: "active" | "suspended" | "archived" | "unknown";
  billingStatus: "active" | "past_due" | "suspended_locked" | "unknown";
  billingValidUntil: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type UpdateCompanyAdminTenantStateInput = {
  companyId: string;
  patch: {
    companyStatus?: "active" | "suspended" | "archived";
    billingStatus?: "active" | "past_due" | "suspended_locked";
    billingValidUntil?: string | null;
    reason?: string;
  };
};

export type UpdateCompanyAdminTenantStateResponse = {
  companyId: string;
  companyStatus: "active" | "suspended" | "archived" | "unknown";
  billingStatus: "active" | "past_due" | "suspended_locked" | "unknown";
  billingValidUntil: string | null;
  updatedAt: string | null;
  changedFields: string[];
};

type UnknownRecord = Record<string, unknown>;

const COMPANY_STATUSES = new Set(["active", "suspended", "archived", "unknown"]);
const BILLING_STATUSES = new Set(["active", "past_due", "suspended_locked", "unknown"]);

function contractError(callableName: string, detail: string): never {
  throw new Error(`CONTRACT_MISMATCH:${callableName}:${detail}`);
}

function asRecord(value: unknown, callableName: string, field: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    contractError(callableName, `${field} must be object`);
  }
  return value as UnknownRecord;
}

function asArray(value: unknown, callableName: string, field: string): unknown[] {
  if (!Array.isArray(value)) {
    contractError(callableName, `${field} must be array`);
  }
  return value;
}

function asString(
  record: UnknownRecord,
  key: string,
  callableName: string,
  opts: { allowNull?: boolean } = {},
): string | null {
  const value = record[key];
  if (value === null && opts.allowNull) return null;
  if (typeof value !== "string") {
    contractError(callableName, `${key} must be string`);
  }
  return value;
}

function ensureEnum(
  record: UnknownRecord,
  key: string,
  callableName: string,
  allowed: Set<string>,
): string {
  const value = asString(record, key, callableName);
  if (!value || !allowed.has(value)) {
    contractError(callableName, `${key} has invalid enum value`);
  }
  return value;
}

function ensureStringArray(record: UnknownRecord, key: string, callableName: string): string[] {
  const values = asArray(record[key], callableName, key);
  return values.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      contractError(callableName, `${key} item must be non-empty string`);
    }
    return item;
  });
}

function parseAuditLogSummary(value: unknown, callableName: string): CompanyAuditLogSummary {
  const record = asRecord(value, callableName, "items[]");
  return {
    auditId: asString(record, "auditId", callableName) as string,
    companyId: asString(record, "companyId", callableName) as string,
    eventType: asString(record, "eventType", callableName) as string,
    targetType: asString(record, "targetType", callableName, { allowNull: true }),
    targetId: asString(record, "targetId", callableName, { allowNull: true }),
    actorUid: asString(record, "actorUid", callableName, { allowNull: true }),
    status: asString(record, "status", callableName) as string,
    reason: asString(record, "reason", callableName, { allowNull: true }),
    createdAt: asString(record, "createdAt", callableName, { allowNull: true }),
  };
}

function ensureListCompanyAuditLogsResponse(
  value: unknown,
  callableName: string,
): ListCompanyAuditLogsResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseAuditLogSummary(item, callableName),
  );
  return { items };
}

function ensureCompanyAdminTenantState(
  value: unknown,
  callableName: string,
): CompanyAdminTenantState {
  const record = asRecord(value, callableName, "response");
  return {
    companyId: asString(record, "companyId", callableName) as string,
    companyStatus: ensureEnum(
      record,
      "companyStatus",
      callableName,
      COMPANY_STATUSES,
    ) as CompanyAdminTenantState["companyStatus"],
    billingStatus: ensureEnum(
      record,
      "billingStatus",
      callableName,
      BILLING_STATUSES,
    ) as CompanyAdminTenantState["billingStatus"],
    billingValidUntil: asString(record, "billingValidUntil", callableName, { allowNull: true }),
    updatedAt: asString(record, "updatedAt", callableName, { allowNull: true }),
    createdAt: asString(record, "createdAt", callableName, { allowNull: true }),
  };
}

function ensureUpdateCompanyAdminTenantStateResponse(
  value: unknown,
  callableName: string,
): UpdateCompanyAdminTenantStateResponse {
  const record = asRecord(value, callableName, "response");
  return {
    companyId: asString(record, "companyId", callableName) as string,
    companyStatus: ensureEnum(
      record,
      "companyStatus",
      callableName,
      COMPANY_STATUSES,
    ) as UpdateCompanyAdminTenantStateResponse["companyStatus"],
    billingStatus: ensureEnum(
      record,
      "billingStatus",
      callableName,
      BILLING_STATUSES,
    ) as UpdateCompanyAdminTenantStateResponse["billingStatus"],
    billingValidUntil: asString(record, "billingValidUntil", callableName, { allowNull: true }),
    updatedAt: asString(record, "updatedAt", callableName, { allowNull: true }),
    changedFields: ensureStringArray(record, "changedFields", callableName),
  };
}

export async function listCompanyAuditLogsCallable(input: {
  companyId: string;
}): Promise<CompanyAuditLogSummary[]> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/audit-logs`,
    });
    return ensureListCompanyAuditLogsResponse(envelope.data, "listCompanyAuditLogs").items;
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "listCompanyAuditLogs",
    input,
  );
  return ensureListCompanyAuditLogsResponse(envelope.data, "listCompanyAuditLogs").items;
}

export async function getCompanyAdminTenantStateCallable(input: {
  companyId: string;
}): Promise<CompanyAdminTenantState> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/admin-tenant-state`,
    });
    return ensureCompanyAdminTenantState(envelope.data, "getCompanyAdminTenantState");
  }

  const envelope = await callFirebaseCallable<typeof input, unknown>(
    "getCompanyAdminTenantState",
    input,
  );
  return ensureCompanyAdminTenantState(envelope.data, "getCompanyAdminTenantState");
}

export async function updateCompanyAdminTenantStateCallable(
  input: UpdateCompanyAdminTenantStateInput,
): Promise<UpdateCompanyAdminTenantStateResponse> {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    const companyId = input.companyId.trim();
    const envelope = await callBackendApi<unknown>({
      baseUrl: backendApiBaseUrl,
      path: `/api/companies/${encodeURIComponent(companyId)}/admin-tenant-state`,
      method: "PATCH",
      body: {
        patch: input.patch,
      },
    });
    return ensureUpdateCompanyAdminTenantStateResponse(
      envelope.data,
      "updateCompanyAdminTenantState",
    );
  }

  const envelope = await callFirebaseCallable<UpdateCompanyAdminTenantStateInput, unknown>(
    "updateCompanyAdminTenantState",
    input,
  );
  return ensureUpdateCompanyAdminTenantStateResponse(
    envelope.data,
    "updateCompanyAdminTenantState",
  );
}
