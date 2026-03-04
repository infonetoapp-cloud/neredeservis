"use client";

import type {
  AcceptCompanyInviteResponse,
  CompanyActiveTripSummary,
  CompanyMemberSummary,
  CompanyMembershipSummary,
  CompanyRouteStopSummary,
  CompanyRouteSummary,
  CompanyVehicleSummary,
  CreateCompanyRouteResponse,
  CreateCompanyResponse,
  CreateVehicleResponse,
  DeclineCompanyInviteResponse,
  DeleteCompanyRouteStopResponse,
  GrantDriverRoutePermissionsResponse,
  InviteCompanyMemberResponse,
  ListActiveTripsByCompanyResponse,
  ListCompanyMembersResponse,
  ListCompanyRouteStopsResponse,
  ListCompanyRoutesResponse,
  ListCompanyVehiclesResponse,
  ListMyCompaniesResponse,
  ListRouteDriverPermissionsResponse,
  ReorderCompanyRouteStopsResponse,
  RemoveCompanyMemberResponse,
  RouteDriverPermissionSummary,
  RouteDriverPermissionFlags,
  RevokeDriverRoutePermissionsResponse,
  UpdateCompanyMemberResponse,
  UpdateCompanyRouteResponse,
  UpdateVehicleResponse,
  UpsertCompanyRouteStopResponse,
} from "@/features/company/company-types";

type UnknownRecord = Record<string, unknown>;

const MEMBER_ROLES = new Set(["owner", "admin", "dispatcher", "viewer"]);
const INVITE_MEMBER_ROLES = new Set(["admin", "dispatcher", "viewer"]);
const MEMBER_STATUSES = new Set(["active", "invited", "suspended"]);
const COMPANY_STATUSES = new Set(["active", "suspended", "archived"]);
const BILLING_STATUSES = new Set(["active", "past_due", "suspended_locked"]);
const TIME_SLOTS = new Set(["morning", "evening", "midday", "custom"]);
const VEHICLE_STATUSES = new Set(["active", "maintenance", "inactive"]);

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
  if (typeof value !== "string" || value.trim().length === 0) {
    contractError(callableName, `${key} must be non-empty string`);
  }
  return value;
}

function asBoolean(record: UnknownRecord, key: string, callableName: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    contractError(callableName, `${key} must be boolean`);
  }
  return value;
}

function asNumber(
  record: UnknownRecord,
  key: string,
  callableName: string,
  opts: { allowNull?: boolean } = {},
): number | null {
  const value = record[key];
  if (value === null && opts.allowNull) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    contractError(callableName, `${key} must be finite number`);
  }
  return value;
}

function asStringArray(record: UnknownRecord, key: string, callableName: string): string[] {
  const value = asArray(record[key], callableName, key);
  const values: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.trim().length === 0) {
      contractError(callableName, `${key} item must be non-empty string`);
    }
    values.push(item);
  }
  return values;
}

function asEnumValue(
  record: UnknownRecord,
  key: string,
  allowed: Set<string>,
  callableName: string,
  opts: { allowNull?: boolean } = {},
): string | null {
  const value = record[key];
  if (value === null && opts.allowNull) return null;
  if (typeof value !== "string" || !allowed.has(value)) {
    contractError(callableName, `${key} has invalid enum value`);
  }
  return value;
}

function parseMembershipSummary(value: unknown, callableName: string): CompanyMembershipSummary {
  const record = asRecord(value, callableName, "items[]");
  const role = asEnumValue(record, "role", MEMBER_ROLES, callableName) as CompanyMembershipSummary["role"];
  const memberStatus = asEnumValue(
    record,
    "memberStatus",
    MEMBER_STATUSES,
    callableName,
  ) as CompanyMembershipSummary["memberStatus"];
  return {
    companyId: asString(record, "companyId", callableName) as string,
    name: asString(record, "name", callableName) as string,
    role,
    memberStatus,
    companyStatus: (asEnumValue(record, "companyStatus", COMPANY_STATUSES, callableName) ?? "active") as CompanyMembershipSummary["companyStatus"],
    billingStatus: (asEnumValue(record, "billingStatus", BILLING_STATUSES, callableName) ?? "active") as CompanyMembershipSummary["billingStatus"],
  };
}

function parseMemberSummary(value: unknown, callableName: string): CompanyMemberSummary {
  const record = asRecord(value, callableName, "items[]");
  const role = asEnumValue(record, "role", MEMBER_ROLES, callableName) as CompanyMemberSummary["role"];
  const memberStatus = asEnumValue(
    record,
    "memberStatus",
    MEMBER_STATUSES,
    callableName,
  ) as CompanyMemberSummary["memberStatus"];
  return {
    uid: asString(record, "uid", callableName) as string,
    displayName: asString(record, "displayName", callableName) as string,
    email: asString(record, "email", callableName, { allowNull: true }),
    phone: asString(record, "phone", callableName, { allowNull: true }),
    role,
    memberStatus,
    companyId: asString(record, "companyId", callableName) as string,
  };
}

function parseRouteSummary(value: unknown, callableName: string): CompanyRouteSummary {
  const record = asRecord(value, callableName, "items[]");
  const timeSlot = asEnumValue(record, "timeSlot", TIME_SLOTS, callableName, {
    allowNull: true,
  }) as CompanyRouteSummary["timeSlot"];
  return {
    routeId: asString(record, "routeId", callableName) as string,
    companyId: asString(record, "companyId", callableName) as string,
    name: asString(record, "name", callableName) as string,
    srvCode: asString(record, "srvCode", callableName, { allowNull: true }),
    driverId: asString(record, "driverId", callableName, { allowNull: true }),
    authorizedDriverIds: asStringArray(record, "authorizedDriverIds", callableName),
    scheduledTime: asString(record, "scheduledTime", callableName, { allowNull: true }),
    timeSlot,
    isArchived: asBoolean(record, "isArchived", callableName),
    allowGuestTracking: asBoolean(record, "allowGuestTracking", callableName),
    passengerCount: asNumber(record, "passengerCount", callableName) as number,
    updatedAt: asString(record, "updatedAt", callableName, { allowNull: true }),
  };
}

function parseVehicleSummary(value: unknown, callableName: string): CompanyVehicleSummary {
  const record = asRecord(value, callableName, "items[]");
  const status = asEnumValue(
    record,
    "status",
    VEHICLE_STATUSES,
    callableName,
  ) as CompanyVehicleSummary["status"];
  return {
    vehicleId: asString(record, "vehicleId", callableName) as string,
    companyId: asString(record, "companyId", callableName) as string,
    plate: asString(record, "plate", callableName) as string,
    status,
    brand: asString(record, "brand", callableName, { allowNull: true }),
    model: asString(record, "model", callableName, { allowNull: true }),
    year: asNumber(record, "year", callableName, { allowNull: true }),
    capacity: asNumber(record, "capacity", callableName, { allowNull: true }),
    updatedAt: asString(record, "updatedAt", callableName, { allowNull: true }),
  };
}

function parseRouteStopSummary(value: unknown, callableName: string): CompanyRouteStopSummary {
  const record = asRecord(value, callableName, "items[]");
  const locationRecord = asRecord(record.location, callableName, "location");
  return {
    stopId: asString(record, "stopId", callableName) as string,
    routeId: asString(record, "routeId", callableName) as string,
    companyId: asString(record, "companyId", callableName) as string,
    name: asString(record, "name", callableName) as string,
    order: asNumber(record, "order", callableName) as number,
    location: {
      lat: asNumber(locationRecord, "lat", callableName) as number,
      lng: asNumber(locationRecord, "lng", callableName) as number,
    },
    createdAt: asString(record, "createdAt", callableName, { allowNull: true }),
    updatedAt: asString(record, "updatedAt", callableName, { allowNull: true }),
  };
}

function parseActiveTripSummary(value: unknown, callableName: string): CompanyActiveTripSummary {
  const record = asRecord(value, callableName, "items[]");
  const status = asString(record, "status", callableName);
  if (status !== "active") {
    contractError(callableName, "status must be active");
  }
  const liveState = asString(record, "liveState", callableName);
  if (liveState !== "online" && liveState !== "stale") {
    contractError(callableName, "liveState must be online|stale");
  }
  const live = asRecord(record.live, callableName, "live");
  const source = asString(live, "source", callableName);
  if (source !== "rtdb" && source !== "trip_doc") {
    contractError(callableName, "live.source must be rtdb|trip_doc");
  }
  return {
    tripId: asString(record, "tripId", callableName) as string,
    routeId: asString(record, "routeId", callableName) as string,
    routeName: asString(record, "routeName", callableName) as string,
    driverUid: asString(record, "driverUid", callableName) as string,
    driverName: asString(record, "driverName", callableName) as string,
    driverPlate: asString(record, "driverPlate", callableName, { allowNull: true }),
    status: "active",
    startedAt: asString(record, "startedAt", callableName, { allowNull: true }),
    lastLocationAt: asString(record, "lastLocationAt", callableName, { allowNull: true }),
    updatedAt: asString(record, "updatedAt", callableName, { allowNull: true }),
    liveState,
    live: {
      lat: asNumber(live, "lat", callableName, { allowNull: true }),
      lng: asNumber(live, "lng", callableName, { allowNull: true }),
      source,
      stale: asBoolean(live, "stale", callableName),
    },
  };
}

function parseRouteDriverPermissionFlags(
  value: unknown,
  callableName: string,
): RouteDriverPermissionFlags {
  const record = asRecord(value, callableName, "permissions");
  return {
    canStartFinishTrip: asBoolean(record, "canStartFinishTrip", callableName),
    canSendAnnouncements: asBoolean(record, "canSendAnnouncements", callableName),
    canViewPassengerList: asBoolean(record, "canViewPassengerList", callableName),
    canEditAssignedRouteMeta: asBoolean(record, "canEditAssignedRouteMeta", callableName),
    canEditStops: asBoolean(record, "canEditStops", callableName),
    canManageRouteSchedule: asBoolean(record, "canManageRouteSchedule", callableName),
  };
}

function parseRouteDriverPermissionSummary(
  value: unknown,
  callableName: string,
): RouteDriverPermissionSummary {
  const record = asRecord(value, callableName, "items[]");
  return {
    routeId: asString(record, "routeId", callableName) as string,
    driverUid: asString(record, "driverUid", callableName) as string,
    permissions: parseRouteDriverPermissionFlags(record.permissions, callableName),
    updatedAt: asString(record, "updatedAt", callableName, { allowNull: true }),
  };
}

export function ensureListMyCompaniesResponse(
  value: unknown,
  callableName: string,
): ListMyCompaniesResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseMembershipSummary(item, callableName),
  );
  return { items };
}

export function ensureCreateCompanyResponse(
  value: unknown,
  callableName: string,
): CreateCompanyResponse {
  const record = asRecord(value, callableName, "response");
  const ownerMember = asRecord(record.ownerMember, callableName, "ownerMember");
  const ownerRole = asString(ownerMember, "role", callableName);
  const ownerStatus = asString(ownerMember, "status", callableName);
  if (ownerRole !== "owner") {
    contractError(callableName, "ownerMember.role must be owner");
  }
  if (ownerStatus !== "active") {
    contractError(callableName, "ownerMember.status must be active");
  }
  return {
    companyId: asString(record, "companyId", callableName) as string,
    ownerMember: {
      uid: asString(ownerMember, "uid", callableName) as string,
      role: "owner",
      status: "active",
    },
    createdAt: asString(record, "createdAt", callableName) as string,
  };
}

export function ensureListCompanyMembersResponse(
  value: unknown,
  callableName: string,
): ListCompanyMembersResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseMemberSummary(item, callableName),
  );
  return { items };
}

export function ensureListCompanyRoutesResponse(
  value: unknown,
  callableName: string,
): ListCompanyRoutesResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseRouteSummary(item, callableName),
  );
  return { items };
}

export function ensureListCompanyVehiclesResponse(
  value: unknown,
  callableName: string,
): ListCompanyVehiclesResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseVehicleSummary(item, callableName),
  );
  return { items };
}

export function ensureCreateVehicleResponse(
  value: unknown,
  callableName: string,
): CreateVehicleResponse {
  const record = asRecord(value, callableName, "response");
  return {
    vehicleId: asString(record, "vehicleId", callableName) as string,
    createdAt: asString(record, "createdAt", callableName) as string,
  };
}

export function ensureUpdateVehicleResponse(
  value: unknown,
  callableName: string,
): UpdateVehicleResponse {
  const record = asRecord(value, callableName, "response");
  return {
    vehicleId: asString(record, "vehicleId", callableName) as string,
    updatedAt: asString(record, "updatedAt", callableName) as string,
  };
}

export function ensureCreateCompanyRouteResponse(
  value: unknown,
  callableName: string,
): CreateCompanyRouteResponse {
  const record = asRecord(value, callableName, "response");
  return {
    routeId: asString(record, "routeId", callableName) as string,
    srvCode: asString(record, "srvCode", callableName) as string,
  };
}

export function ensureUpdateCompanyRouteResponse(
  value: unknown,
  callableName: string,
): UpdateCompanyRouteResponse {
  const record = asRecord(value, callableName, "response");
  return {
    routeId: asString(record, "routeId", callableName) as string,
    updatedAt: asString(record, "updatedAt", callableName) as string,
  };
}

export function ensureListCompanyRouteStopsResponse(
  value: unknown,
  callableName: string,
): ListCompanyRouteStopsResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseRouteStopSummary(item, callableName),
  );
  return {
    companyId: asString(record, "companyId", callableName) as string,
    routeId: asString(record, "routeId", callableName) as string,
    items,
  };
}

export function ensureUpsertCompanyRouteStopResponse(
  value: unknown,
  callableName: string,
): UpsertCompanyRouteStopResponse {
  const record = asRecord(value, callableName, "response");
  return {
    companyId: asString(record, "companyId", callableName) as string,
    routeId: asString(record, "routeId", callableName) as string,
    stopId: asString(record, "stopId", callableName) as string,
    updatedAt: asString(record, "updatedAt", callableName) as string,
  };
}

export function ensureDeleteCompanyRouteStopResponse(
  value: unknown,
  callableName: string,
): DeleteCompanyRouteStopResponse {
  const record = asRecord(value, callableName, "response");
  const deleted = asBoolean(record, "deleted", callableName);
  if (!deleted) {
    contractError(callableName, "deleted must be true");
  }
  return {
    routeId: asString(record, "routeId", callableName) as string,
    stopId: asString(record, "stopId", callableName) as string,
    deleted: true,
  };
}

export function ensureReorderCompanyRouteStopsResponse(
  value: unknown,
  callableName: string,
): ReorderCompanyRouteStopsResponse {
  const record = asRecord(value, callableName, "response");
  return {
    routeId: asString(record, "routeId", callableName) as string,
    updatedAt: asString(record, "updatedAt", callableName) as string,
    changed: asBoolean(record, "changed", callableName),
  };
}

export function ensureListActiveTripsByCompanyResponse(
  value: unknown,
  callableName: string,
): ListActiveTripsByCompanyResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseActiveTripSummary(item, callableName),
  );
  return { items };
}

export function ensureInviteCompanyMemberResponse(
  value: unknown,
  callableName: string,
): InviteCompanyMemberResponse {
  const record = asRecord(value, callableName, "response");
  const status = asString(record, "status", callableName);
  if (status !== "pending") {
    contractError(callableName, "status must be pending");
  }
  return {
    companyId: asString(record, "companyId", callableName) as string,
    inviteId: asString(record, "inviteId", callableName) as string,
    memberUid: asString(record, "memberUid", callableName) as string,
    invitedEmail: asString(record, "invitedEmail", callableName) as string,
    role: asEnumValue(
      record,
      "role",
      INVITE_MEMBER_ROLES,
      callableName,
    ) as InviteCompanyMemberResponse["role"],
    status: "pending",
    expiresAt: asString(record, "expiresAt", callableName) as string,
    createdAt: asString(record, "createdAt", callableName) as string,
  };
}

export function ensureAcceptCompanyInviteResponse(
  value: unknown,
  callableName: string,
): AcceptCompanyInviteResponse {
  const record = asRecord(value, callableName, "response");
  const memberStatus = asString(record, "memberStatus", callableName);
  if (memberStatus !== "active") {
    contractError(callableName, "memberStatus must be active");
  }
  return {
    companyId: asString(record, "companyId", callableName) as string,
    memberUid: asString(record, "memberUid", callableName) as string,
    role: asEnumValue(record, "role", MEMBER_ROLES, callableName) as AcceptCompanyInviteResponse["role"],
    memberStatus: "active",
    acceptedAt: asString(record, "acceptedAt", callableName) as string,
  };
}

export function ensureDeclineCompanyInviteResponse(
  value: unknown,
  callableName: string,
): DeclineCompanyInviteResponse {
  const record = asRecord(value, callableName, "response");
  const memberStatus = asString(record, "memberStatus", callableName);
  if (memberStatus !== "suspended") {
    contractError(callableName, "memberStatus must be suspended");
  }
  return {
    companyId: asString(record, "companyId", callableName) as string,
    memberUid: asString(record, "memberUid", callableName) as string,
    role: asEnumValue(record, "role", MEMBER_ROLES, callableName) as DeclineCompanyInviteResponse["role"],
    memberStatus: "suspended",
    declinedAt: asString(record, "declinedAt", callableName) as string,
  };
}

export function ensureUpdateCompanyMemberResponse(
  value: unknown,
  callableName: string,
): UpdateCompanyMemberResponse {
  const record = asRecord(value, callableName, "response");
  return {
    companyId: asString(record, "companyId", callableName) as string,
    memberUid: asString(record, "memberUid", callableName) as string,
    role: asEnumValue(record, "role", MEMBER_ROLES, callableName) as UpdateCompanyMemberResponse["role"],
    memberStatus: asEnumValue(
      record,
      "memberStatus",
      MEMBER_STATUSES,
      callableName,
    ) as UpdateCompanyMemberResponse["memberStatus"],
    updatedAt: asString(record, "updatedAt", callableName) as string,
  };
}

export function ensureRemoveCompanyMemberResponse(
  value: unknown,
  callableName: string,
): RemoveCompanyMemberResponse {
  const record = asRecord(value, callableName, "response");
  const removed = asBoolean(record, "removed", callableName);
  if (!removed) {
    contractError(callableName, "removed must be true");
  }
  return {
    companyId: asString(record, "companyId", callableName) as string,
    memberUid: asString(record, "memberUid", callableName) as string,
    removedRole: asEnumValue(
      record,
      "removedRole",
      MEMBER_ROLES,
      callableName,
    ) as RemoveCompanyMemberResponse["removedRole"],
    removedMemberStatus: asEnumValue(
      record,
      "removedMemberStatus",
      MEMBER_STATUSES,
      callableName,
    ) as RemoveCompanyMemberResponse["removedMemberStatus"],
    removed: true,
    removedAt: asString(record, "removedAt", callableName) as string,
  };
}

export function ensureGrantDriverRoutePermissionsResponse(
  value: unknown,
  callableName: string,
): GrantDriverRoutePermissionsResponse {
  const record = asRecord(value, callableName, "response");
  return {
    routeId: asString(record, "routeId", callableName) as string,
    driverUid: asString(record, "driverUid", callableName) as string,
    permissions: parseRouteDriverPermissionFlags(record.permissions, callableName),
    updatedAt: asString(record, "updatedAt", callableName) as string,
  };
}

export function ensureRevokeDriverRoutePermissionsResponse(
  value: unknown,
  callableName: string,
): RevokeDriverRoutePermissionsResponse {
  const record = asRecord(value, callableName, "response");
  return {
    routeId: asString(record, "routeId", callableName) as string,
    driverUid: asString(record, "driverUid", callableName) as string,
    updatedAt: asString(record, "updatedAt", callableName) as string,
  };
}

export function ensureListRouteDriverPermissionsResponse(
  value: unknown,
  callableName: string,
): ListRouteDriverPermissionsResponse {
  const record = asRecord(value, callableName, "response");
  const items = asArray(record.items, callableName, "items").map((item) =>
    parseRouteDriverPermissionSummary(item, callableName),
  );
  return { items };
}
