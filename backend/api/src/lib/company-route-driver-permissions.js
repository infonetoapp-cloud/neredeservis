import { createHash } from "node:crypto";

import { assertCompanyMembersExistAndActive } from "./company-access.js";
import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const DEFAULT_ROUTE_DRIVER_PERMISSIONS = {
  canStartFinishTrip: true,
  canSendAnnouncements: true,
  canViewPassengerList: true,
  canEditAssignedRouteMeta: false,
  canEditStops: false,
  canManageRouteSchedule: false,
};

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

export async function listRouteDriverPermissions(db, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const routeId = normalizeId(input?.routeId, "routeId");
  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const [companySnapshot, routeSnapshot, permissionsSnapshot] = await Promise.all([
    companyRef.get(),
    routeRef.get(),
    routeRef.collection("driver_permissions").get(),
  ]);

  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
  if (!routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  assertCompanyRoute(routeData, companyId);

  const items = permissionsSnapshot.docs
    .map((documentSnapshot) => {
      const permissionData = asRecord(documentSnapshot.data()) ?? {};
      return {
        routeId,
        driverUid: pickString(permissionData, "driverUid") ?? documentSnapshot.id,
        permissions: toRoutePermissionFlags(permissionData.permissions),
        updatedAt: pickString(permissionData, "updatedAt"),
      };
    })
    .sort((left, right) => left.driverUid.localeCompare(right.driverUid, "tr"));

  return { items };
}

export async function grantDriverRoutePermissions(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const routeId = normalizeId(input?.routeId, "routeId");
  const driverUid = normalizeId(input?.driverUid, "driverUid");
  const permissions = normalizeRoutePermissionFlags(input?.permissions);
  const nowIso = new Date().toISOString();
  await assertCompanyMembersExistAndActive(db, companyId, [driverUid]);

  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const routePermissionRef = routeRef.collection("driver_permissions").doc(driverUid);

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, routeSnapshot, permissionSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(routeRef),
      transaction.get(routePermissionRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!routeSnapshot.exists) {
      throw new HttpError(404, "not-found", "Route bulunamadi.");
    }

    const routeData = asRecord(routeSnapshot.data()) ?? {};
    assertCompanyRoute(routeData, companyId);

    const routeDriverUid = pickString(routeData, "driverId");
    if (!routeDriverUid) {
      throw new HttpError(412, "failed-precondition", "ROUTE_DRIVER_MISSING");
    }

    const existingAuthorized = pickStringArray(routeData, "authorizedDriverIds");
    const nextAuthorized =
      driverUid === routeDriverUid || existingAuthorized.includes(driverUid)
        ? existingAuthorized
        : [...existingAuthorized, driverUid];

    const existingMemberIds = pickStringArray(routeData, "memberIds");
    const passengerMemberIds = existingMemberIds.filter(
      (uid) => uid !== routeDriverUid && !existingAuthorized.includes(uid),
    );
    const nextMemberIds = Array.from(
      new Set([routeDriverUid, ...nextAuthorized, ...passengerMemberIds]),
    );

    transaction.update(routeRef, {
      authorizedDriverIds: nextAuthorized,
      memberIds: nextMemberIds,
      updatedAt: nowIso,
      updatedBy: actorUid,
    });
    transaction.set(
      routePermissionRef,
      {
        companyId,
        routeId,
        driverUid,
        permissions,
        createdAt: pickString(asRecord(permissionSnapshot.data()), "createdAt") ?? nowIso,
        createdBy: pickString(asRecord(permissionSnapshot.data()), "createdBy") ?? actorUid,
        updatedAt: nowIso,
        updatedBy: actorUid,
      },
      { merge: true },
    );

    const auditRef = db.collection("audit_logs").doc();
    transaction.set(auditRef, {
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
      requestId: createHash("sha256")
        .update(`grantDriverRoutePermissions:${actorUid}:${routeId}:${driverUid}:${nowIso}`)
        .digest("hex")
        .slice(0, 24),
      createdAt: nowIso,
    });

    return {
      routeId,
      driverUid,
      permissions,
      updatedAt: nowIso,
    };
  });
}

export async function revokeDriverRoutePermissions(db, actorUid, actorRole, input) {
  const companyId = normalizeId(input?.companyId, "companyId");
  const routeId = normalizeId(input?.routeId, "routeId");
  const driverUid = normalizeId(input?.driverUid, "driverUid");
  const permissionKeys = normalizePermissionKeys(input?.permissionKeys);
  const resetToDefault = input?.resetToDefault === true;
  const nowIso = new Date().toISOString();
  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const routePermissionRef = routeRef.collection("driver_permissions").doc(driverUid);

  return db.runTransaction(async (transaction) => {
    const [companySnapshot, routeSnapshot, permissionSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(routeRef),
      transaction.get(routePermissionRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!routeSnapshot.exists) {
      throw new HttpError(404, "not-found", "Route bulunamadi.");
    }

    const routeData = asRecord(routeSnapshot.data()) ?? {};
    assertCompanyRoute(routeData, companyId);

    const routeDriverUid = pickString(routeData, "driverId");
    if (!routeDriverUid) {
      throw new HttpError(412, "failed-precondition", "ROUTE_DRIVER_MISSING");
    }

    const existingAuthorized = pickStringArray(routeData, "authorizedDriverIds");
    const existingMemberIds = pickStringArray(routeData, "memberIds");

    if (resetToDefault) {
      if (driverUid === routeDriverUid) {
        throw new HttpError(412, "failed-precondition", "ROUTE_PRIMARY_DRIVER_IMMUTABLE");
      }

      const nextAuthorized = existingAuthorized.filter((uid) => uid !== driverUid);
      const passengerMemberIds = existingMemberIds.filter(
        (uid) => uid !== routeDriverUid && !existingAuthorized.includes(uid),
      );
      const nextMemberIds = Array.from(
        new Set([routeDriverUid, ...nextAuthorized, ...passengerMemberIds]),
      );

      transaction.update(routeRef, {
        authorizedDriverIds: nextAuthorized,
        memberIds: nextMemberIds,
        updatedAt: nowIso,
        updatedBy: actorUid,
      });
      transaction.delete(routePermissionRef);
    } else {
      const currentPermissions = toRoutePermissionFlags(asRecord(permissionSnapshot.data())?.permissions);
      const nextPermissions = { ...currentPermissions };
      permissionKeys.forEach((key) => {
        nextPermissions[key] = false;
      });

      transaction.set(
        routePermissionRef,
        {
          companyId,
          routeId,
          driverUid,
          permissions: nextPermissions,
          createdAt: pickString(asRecord(permissionSnapshot.data()), "createdAt") ?? nowIso,
          createdBy: pickString(asRecord(permissionSnapshot.data()), "createdBy") ?? actorUid,
          updatedAt: nowIso,
          updatedBy: actorUid,
        },
        { merge: true },
      );
    }

    const auditRef = db.collection("audit_logs").doc();
    transaction.set(auditRef, {
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
      requestId: createHash("sha256")
        .update(`revokeDriverRoutePermissions:${actorUid}:${routeId}:${driverUid}:${nowIso}`)
        .digest("hex")
        .slice(0, 24),
      createdAt: nowIso,
    });

    return {
      routeId,
      driverUid,
      updatedAt: nowIso,
    };
  });
}
