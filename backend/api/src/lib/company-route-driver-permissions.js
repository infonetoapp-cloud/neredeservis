import { createHash } from "node:crypto";

import { assertCompanyMembersExistAndActive } from "./company-access.js";
import { flushStagedCompanyAuditLog, stageCompanyAuditLogWrite } from "./company-audit-store.js";
import {
  deleteRouteDriverPermissionFromPostgres,
  listRouteDriverPermissionsFromPostgres,
  shouldUsePostgresRouteDriverPermissionStore,
  upsertRouteDriverPermissionToPostgres,
} from "./company-route-driver-permission-store.js";
import { HttpError } from "./http.js";
import { readCompanyRouteFromPostgres, syncCompanyRouteToPostgres } from "./company-route-store.js";
import { asRecord, pickString } from "./runtime-value.js";

const DEFAULT_ROUTE_DRIVER_PERMISSIONS = {
  canStartFinishTrip: true,
  canSendAnnouncements: true,
  canViewPassengerList: true,
  canEditAssignedRouteMeta: false,
  canEditStops: false,
  canManageRouteSchedule: false,
};

function requirePermissionStore() {
  if (!shouldUsePostgresRouteDriverPermissionStore()) {
    throw new HttpError(412, "failed-precondition", "Rota izin depolamasi hazir degil.");
  }
}

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function normalizeId(rawValue, fieldLabel) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value || value.length > 128) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return value;
}

function assertCompanyRoute(routeData, companyId) {
  const routeCompanyId = pickString(routeData, "companyId");
  if (!routeCompanyId || routeCompanyId !== companyId) {
    throw new HttpError(412, "failed-precondition", "ROUTE_TENANT_MISMATCH");
  }

  const visibility = pickString(routeData, "visibility");
  if (visibility && visibility !== "company") {
    throw new HttpError(412, "failed-precondition", "ROUTE_NOT_COMPANY_SCOPED");
  }
}

function normalizeRoutePermissionFlags(rawValue) {
  const record = asRecord(rawValue);
  if (!record) {
    throw new HttpError(400, "invalid-argument", "permissions");
  }

  const readFlag = (key) => {
    const value = record[key];
    if (typeof value !== "boolean") {
      throw new HttpError(400, "invalid-argument", "permissions");
    }
    return value;
  };

  return {
    canStartFinishTrip: readFlag("canStartFinishTrip"),
    canSendAnnouncements: readFlag("canSendAnnouncements"),
    canViewPassengerList: readFlag("canViewPassengerList"),
    canEditAssignedRouteMeta: readFlag("canEditAssignedRouteMeta"),
    canEditStops: readFlag("canEditStops"),
    canManageRouteSchedule: readFlag("canManageRouteSchedule"),
  };
}

function toRoutePermissionFlags(rawValue) {
  const record = asRecord(rawValue);
  if (!record) {
    return { ...DEFAULT_ROUTE_DRIVER_PERMISSIONS };
  }

  const readFlag = (key) => {
    const value = record[key];
    return typeof value === "boolean" ? value : DEFAULT_ROUTE_DRIVER_PERMISSIONS[key];
  };

  return {
    canStartFinishTrip: readFlag("canStartFinishTrip"),
    canSendAnnouncements: readFlag("canSendAnnouncements"),
    canViewPassengerList: readFlag("canViewPassengerList"),
    canEditAssignedRouteMeta: readFlag("canEditAssignedRouteMeta"),
    canEditStops: readFlag("canEditStops"),
    canManageRouteSchedule: readFlag("canManageRouteSchedule"),
  };
}

function normalizePermissionKeys(rawValue) {
  if (rawValue === undefined) {
    return [];
  }
  if (!Array.isArray(rawValue)) {
    throw new HttpError(400, "invalid-argument", "permissionKeys");
  }

  const allowedKeys = new Set(Object.keys(DEFAULT_ROUTE_DRIVER_PERMISSIONS));
  const uniqueKeys = new Set();
  for (const item of rawValue) {
    if (typeof item !== "string" || !allowedKeys.has(item)) {
      throw new HttpError(400, "invalid-argument", "permissionKeys");
    }
    uniqueKeys.add(item);
  }

  return Array.from(uniqueKeys.values());
}

function buildAuditRequestId(prefix, actorUid, routeId, driverUid, nowIso) {
  return createHash("sha256")
    .update(`${prefix}:${actorUid}:${routeId}:${driverUid}:${nowIso}`)
    .digest("hex")
    .slice(0, 24);
}

export async function listRouteDriverPermissions(_db, input) {
  requirePermissionStore();

  const companyId = normalizeId(input?.companyId, "companyId");
  const routeId = normalizeId(input?.routeId, "routeId");
  const postgresResult = await listRouteDriverPermissionsFromPostgres(companyId, routeId).catch(
    () => null,
  );
  if (!postgresResult?.routeExists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }
  return { items: postgresResult.items };
}

export async function grantDriverRoutePermissions(db, actorUid, actorRole, input) {
  requirePermissionStore();

  const companyId = normalizeId(input?.companyId, "companyId");
  const routeId = normalizeId(input?.routeId, "routeId");
  const driverUid = normalizeId(input?.driverUid, "driverUid");
  const permissions = normalizeRoutePermissionFlags(input?.permissions);
  const nowIso = new Date().toISOString();
  await assertCompanyMembersExistAndActive(db, companyId, [driverUid]);

  const [route, permissionsState] = await Promise.all([
    readCompanyRouteFromPostgres(companyId, routeId).catch(() => null),
    listRouteDriverPermissionsFromPostgres(companyId, routeId).catch(() => null),
  ]);

  if (!route) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }
  assertCompanyRoute(route, companyId);

  const routeDriverUid = pickString(route, "driverId");
  if (!routeDriverUid) {
    throw new HttpError(412, "failed-precondition", "ROUTE_DRIVER_MISSING");
  }

  const existingAuthorized = pickStringArray(route, "authorizedDriverIds");
  const nextAuthorized =
    driverUid === routeDriverUid || existingAuthorized.includes(driverUid)
      ? existingAuthorized
      : [...existingAuthorized, driverUid];

  const existingMemberIds = pickStringArray(route, "memberIds");
  const passengerMemberIds = existingMemberIds.filter(
    (uid) => uid !== routeDriverUid && !existingAuthorized.includes(uid),
  );
  const nextMemberIds = Array.from(new Set([routeDriverUid, ...nextAuthorized, ...passengerMemberIds]));

  await syncCompanyRouteToPostgres({
    ...route,
    authorizedDriverIds: nextAuthorized,
    memberIds: nextMemberIds,
    routeId,
    companyId,
    updatedAt: nowIso,
    updatedBy: actorUid,
    createdAt: route.createdAt ?? nowIso,
  });
  await upsertRouteDriverPermissionToPostgres({
    companyId,
    routeId,
    driverUid,
    permissions,
    createdAt:
      permissionsState?.items?.find((item) => item.driverUid === driverUid)?.updatedAt ?? nowIso,
    createdBy: actorUid,
    updatedAt: nowIso,
    updatedBy: actorUid,
  });

  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid,
    actorType: "company_member",
    eventType: "route_driver_permissions_granted",
    targetType: "route_driver_permission",
    targetId: `${routeId}_${driverUid}`,
    status: "success",
    reason: null,
    metadata: {
      actorRole,
      routeId,
      driverUid,
      permissions,
    },
    requestId: buildAuditRequestId("grantDriverRoutePermissions", actorUid, routeId, driverUid, nowIso),
    createdAt: nowIso,
  });
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    routeId,
    driverUid,
    permissions,
    updatedAt: nowIso,
    auditLog,
  };
}

export async function revokeDriverRoutePermissions(db, actorUid, actorRole, input) {
  requirePermissionStore();

  const companyId = normalizeId(input?.companyId, "companyId");
  const routeId = normalizeId(input?.routeId, "routeId");
  const driverUid = normalizeId(input?.driverUid, "driverUid");
  const permissionKeys = normalizePermissionKeys(input?.permissionKeys);
  const resetToDefault = input?.resetToDefault === true;
  const nowIso = new Date().toISOString();

  const [route, permissionsState] = await Promise.all([
    readCompanyRouteFromPostgres(companyId, routeId).catch(() => null),
    listRouteDriverPermissionsFromPostgres(companyId, routeId).catch(() => null),
  ]);

  if (!route) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }
  assertCompanyRoute(route, companyId);

  const routeDriverUid = pickString(route, "driverId");
  if (!routeDriverUid) {
    throw new HttpError(412, "failed-precondition", "ROUTE_DRIVER_MISSING");
  }

  const existingAuthorized = pickStringArray(route, "authorizedDriverIds");
  const existingMemberIds = pickStringArray(route, "memberIds");
  const existingPermissionItem = permissionsState?.items?.find((item) => item.driverUid === driverUid) ?? null;

  if (resetToDefault) {
    if (driverUid === routeDriverUid) {
      throw new HttpError(412, "failed-precondition", "ROUTE_PRIMARY_DRIVER_IMMUTABLE");
    }

    const nextAuthorized = existingAuthorized.filter((uid) => uid !== driverUid);
    const passengerMemberIds = existingMemberIds.filter(
      (uid) => uid !== routeDriverUid && !existingAuthorized.includes(uid),
    );
    const nextMemberIds = Array.from(new Set([routeDriverUid, ...nextAuthorized, ...passengerMemberIds]));

    await syncCompanyRouteToPostgres({
      ...route,
      authorizedDriverIds: nextAuthorized,
      memberIds: nextMemberIds,
      routeId,
      companyId,
      updatedAt: nowIso,
      updatedBy: actorUid,
      createdAt: route.createdAt ?? nowIso,
    });
    await deleteRouteDriverPermissionFromPostgres(companyId, routeId, driverUid, nowIso);
  } else {
    const currentPermissions = toRoutePermissionFlags(existingPermissionItem?.permissions);
    const nextPermissions = { ...currentPermissions };
    permissionKeys.forEach((key) => {
      nextPermissions[key] = false;
    });

    await upsertRouteDriverPermissionToPostgres({
      companyId,
      routeId,
      driverUid,
      permissions: nextPermissions,
      createdAt: existingPermissionItem?.updatedAt ?? nowIso,
      createdBy: actorUid,
      updatedAt: nowIso,
      updatedBy: actorUid,
    });
  }

  const auditLog = stageCompanyAuditLogWrite(db, null, {
    companyId,
    actorUid,
    actorType: "company_member",
    eventType: "route_driver_permissions_revoked",
    targetType: "route_driver_permission",
    targetId: `${routeId}_${driverUid}`,
    status: "success",
    reason: null,
    metadata: {
      actorRole,
      routeId,
      driverUid,
      resetToDefault,
      permissionKeys: resetToDefault ? [] : permissionKeys,
    },
    requestId: buildAuditRequestId("revokeDriverRoutePermissions", actorUid, routeId, driverUid, nowIso),
    createdAt: nowIso,
  });
  await flushStagedCompanyAuditLog(auditLog).catch(() => false);

  return {
    routeId,
    driverUid,
    updatedAt: nowIso,
    auditLog,
  };
}
