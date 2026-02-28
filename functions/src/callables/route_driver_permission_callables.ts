import { createHash } from 'node:crypto';

import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type {
  GrantDriverRoutePermissionsOutput,
  ListRouteDriverPermissionsOutput,
  RevokeDriverRoutePermissionsOutput,
  RouteDriverPermissionFlags,
} from '../common/output_contract_types.js';
import { pickString, pickStringArray } from '../common/runtime_value_helpers.js';
import { runTransactionWithResult } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';
type RoutePermissionKey = keyof RouteDriverPermissionFlags;

interface GrantDriverRoutePermissionsInput {
  companyId: string;
  routeId: string;
  driverUid: string;
  idempotencyKey?: string;
  permissions: RouteDriverPermissionFlags;
}

interface RevokeDriverRoutePermissionsInput {
  companyId: string;
  routeId: string;
  driverUid: string;
  idempotencyKey?: string;
  permissionKeys: RoutePermissionKey[];
  resetToDefault?: boolean;
}

interface ListRouteDriverPermissionsInput {
  companyId: string;
  routeId: string;
}

const DEFAULT_ROUTE_DRIVER_PERMISSIONS: RouteDriverPermissionFlags = {
  canStartFinishTrip: true,
  canSendAnnouncements: true,
  canViewPassengerList: true,
  canEditAssignedRouteMeta: false,
  canEditStops: false,
  canManageRouteSchedule: false,
};

function toRoutePermissionFlags(value: unknown): RouteDriverPermissionFlags {
  const record = asRecord(value);
  if (!record) {
    return { ...DEFAULT_ROUTE_DRIVER_PERMISSIONS };
  }
  const readFlag = (key: RoutePermissionKey): boolean => {
    const raw = record[key];
    return typeof raw === 'boolean' ? raw : DEFAULT_ROUTE_DRIVER_PERMISSIONS[key];
  };
  return {
    canStartFinishTrip: readFlag('canStartFinishTrip'),
    canSendAnnouncements: readFlag('canSendAnnouncements'),
    canViewPassengerList: readFlag('canViewPassengerList'),
    canEditAssignedRouteMeta: readFlag('canEditAssignedRouteMeta'),
    canEditStops: readFlag('canEditStops'),
    canManageRouteSchedule: readFlag('canManageRouteSchedule'),
  };
}

export function createRouteDriverPermissionCallables({
  db,
  grantDriverRoutePermissionsInputSchema,
  revokeDriverRoutePermissionsInputSchema,
  listRouteDriverPermissionsInputSchema,
  requireActiveCompanyMemberRole,
  requireCompanyRouteWriteRole,
  assertCompanyMembersExistAndActive,
}: {
  db: Firestore;
  grantDriverRoutePermissionsInputSchema: ZodType<unknown>;
  revokeDriverRoutePermissionsInputSchema: ZodType<unknown>;
  listRouteDriverPermissionsInputSchema: ZodType<unknown>;
  requireActiveCompanyMemberRole: (companyId: string, uid: string) => Promise<CompanyMemberRole>;
  requireCompanyRouteWriteRole: (role: CompanyMemberRole) => void;
  assertCompanyMembersExistAndActive: (companyId: string, memberUids: string[]) => Promise<void>;
}) {
  const listRouteDriverPermissions = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listRouteDriverPermissionsInputSchema,
      request.data,
    ) as ListRouteDriverPermissionsInput;

    await requireActiveCompanyMemberRole(input.companyId, auth.uid);

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const [companySnap, routeSnap, permissionsSnap] = await Promise.all([
      companyRef.get(),
      routeRef.get(),
      routeRef.collection('driver_permissions').get(),
    ]);

    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Firma bulunamadi.');
    }
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }

    const routeData = asRecord(routeSnap.data()) ?? {};
    const routeCompanyId = pickString(routeData, 'companyId');
    if (!routeCompanyId || routeCompanyId !== input.companyId) {
      throw new HttpsError('failed-precondition', 'ROUTE_TENANT_MISMATCH');
    }
    const visibility = pickString(routeData, 'visibility');
    if (visibility && visibility !== 'company') {
      throw new HttpsError('failed-precondition', 'ROUTE_NOT_COMPANY_SCOPED');
    }

    const items = permissionsSnap.docs
      .map((doc) => {
        const data = asRecord(doc.data()) ?? {};
        return {
          routeId: input.routeId,
          driverUid: pickString(data, 'driverUid') ?? doc.id,
          permissions: toRoutePermissionFlags(data.permissions),
          updatedAt: pickString(data, 'updatedAt'),
        };
      })
      .sort((left, right) => left.driverUid.localeCompare(right.driverUid, 'tr'));

    return apiOk<ListRouteDriverPermissionsOutput>({ items });
  });

  const grantDriverRoutePermissions = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      grantDriverRoutePermissionsInputSchema,
      request.data,
    ) as GrantDriverRoutePermissionsInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(actorRole);
    await assertCompanyMembersExistAndActive(input.companyId, [input.driverUid]);

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const routePermissionRef = routeRef.collection('driver_permissions').doc(input.driverUid);
    const nowIso = new Date().toISOString();

    const granted = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, routeSnap, permissionSnap] = await Promise.all([
        tx.get(companyRef),
        tx.get(routeRef),
        tx.get(routePermissionRef),
      ]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      if (!routeSnap.exists) {
        throw new HttpsError('not-found', 'Route bulunamadi.');
      }

      const routeData = asRecord(routeSnap.data()) ?? {};
      const routeCompanyId = pickString(routeData, 'companyId');
      if (!routeCompanyId || routeCompanyId !== input.companyId) {
        throw new HttpsError('failed-precondition', 'ROUTE_TENANT_MISMATCH');
      }
      const visibility = pickString(routeData, 'visibility');
      if (visibility && visibility !== 'company') {
        throw new HttpsError('failed-precondition', 'ROUTE_NOT_COMPANY_SCOPED');
      }

      const routeDriverUid = pickString(routeData, 'driverId');
      if (!routeDriverUid) {
        throw new HttpsError('failed-precondition', 'ROUTE_DRIVER_MISSING');
      }
      const existingAuthorized = pickStringArray(routeData, 'authorizedDriverIds');
      const nextAuthorized =
        input.driverUid === routeDriverUid || existingAuthorized.includes(input.driverUid)
          ? existingAuthorized
          : [...existingAuthorized, input.driverUid];

      const existingMemberIds = pickStringArray(routeData, 'memberIds');
      const passengerMemberIds = existingMemberIds.filter(
        (uid) => uid !== routeDriverUid && !existingAuthorized.includes(uid),
      );
      const nextMemberIds = Array.from(
        new Set<string>([routeDriverUid, ...nextAuthorized, ...passengerMemberIds]),
      );

      tx.update(routeRef, {
        authorizedDriverIds: nextAuthorized,
        memberIds: nextMemberIds,
        updatedAt: nowIso,
        updatedBy: auth.uid,
      });
      tx.set(
        routePermissionRef,
        {
          companyId: input.companyId,
          routeId: input.routeId,
          driverUid: input.driverUid,
          permissions: input.permissions,
          createdAt: pickString(asRecord(permissionSnap.data()), 'createdAt') ?? nowIso,
          createdBy: pickString(asRecord(permissionSnap.data()), 'createdBy') ?? auth.uid,
          updatedAt: nowIso,
          updatedBy: auth.uid,
        },
        { merge: true },
      );

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'route_driver_permissions_granted',
        targetType: 'route_driver_permission',
        targetId: `${input.routeId}_${input.driverUid}`,
        status: 'success',
        reason: null,
        metadata: {
          actorRole,
          routeId: input.routeId,
          driverUid: input.driverUid,
          permissions: input.permissions,
        },
        requestId: createHash('sha256')
          .update(`grantDriverRoutePermissions:${auth.uid}:${input.routeId}:${input.driverUid}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        routeId: input.routeId,
        driverUid: input.driverUid,
        permissions: input.permissions,
        updatedAt: nowIso,
      } satisfies GrantDriverRoutePermissionsOutput;
    });

    return apiOk<GrantDriverRoutePermissionsOutput>(granted);
  });

  const revokeDriverRoutePermissions = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      revokeDriverRoutePermissionsInputSchema,
      request.data,
    ) as RevokeDriverRoutePermissionsInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(actorRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const routePermissionRef = routeRef.collection('driver_permissions').doc(input.driverUid);
    const nowIso = new Date().toISOString();

    const revoked = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, routeSnap, permissionSnap] = await Promise.all([
        tx.get(companyRef),
        tx.get(routeRef),
        tx.get(routePermissionRef),
      ]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      if (!routeSnap.exists) {
        throw new HttpsError('not-found', 'Route bulunamadi.');
      }

      const routeData = asRecord(routeSnap.data()) ?? {};
      const routeCompanyId = pickString(routeData, 'companyId');
      if (!routeCompanyId || routeCompanyId !== input.companyId) {
        throw new HttpsError('failed-precondition', 'ROUTE_TENANT_MISMATCH');
      }
      const visibility = pickString(routeData, 'visibility');
      if (visibility && visibility !== 'company') {
        throw new HttpsError('failed-precondition', 'ROUTE_NOT_COMPANY_SCOPED');
      }

      const routeDriverUid = pickString(routeData, 'driverId');
      if (!routeDriverUid) {
        throw new HttpsError('failed-precondition', 'ROUTE_DRIVER_MISSING');
      }

      const shouldReset = input.resetToDefault === true;
      const existingAuthorized = pickStringArray(routeData, 'authorizedDriverIds');
      const existingMemberIds = pickStringArray(routeData, 'memberIds');

      if (shouldReset) {
        if (input.driverUid === routeDriverUid) {
          throw new HttpsError('failed-precondition', 'ROUTE_PRIMARY_DRIVER_IMMUTABLE');
        }
        const nextAuthorized = existingAuthorized.filter((uid) => uid !== input.driverUid);
        const passengerMemberIds = existingMemberIds.filter(
          (uid) => uid !== routeDriverUid && !existingAuthorized.includes(uid),
        );
        const nextMemberIds = Array.from(
          new Set<string>([routeDriverUid, ...nextAuthorized, ...passengerMemberIds]),
        );

        tx.update(routeRef, {
          authorizedDriverIds: nextAuthorized,
          memberIds: nextMemberIds,
          updatedAt: nowIso,
          updatedBy: auth.uid,
        });
        tx.delete(routePermissionRef);
      } else {
        const currentPermissions = toRoutePermissionFlags(asRecord(permissionSnap.data())?.permissions);
        const nextPermissions = { ...currentPermissions };
        input.permissionKeys.forEach((key) => {
          nextPermissions[key] = false;
        });
        tx.set(
          routePermissionRef,
          {
            companyId: input.companyId,
            routeId: input.routeId,
            driverUid: input.driverUid,
            permissions: nextPermissions,
            createdAt: pickString(asRecord(permissionSnap.data()), 'createdAt') ?? nowIso,
            createdBy: pickString(asRecord(permissionSnap.data()), 'createdBy') ?? auth.uid,
            updatedAt: nowIso,
            updatedBy: auth.uid,
          },
          { merge: true },
        );
      }

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'route_driver_permissions_revoked',
        targetType: 'route_driver_permission',
        targetId: `${input.routeId}_${input.driverUid}`,
        status: 'success',
        reason: null,
        metadata: {
          actorRole,
          routeId: input.routeId,
          driverUid: input.driverUid,
          resetToDefault: shouldReset,
          permissionKeys: shouldReset ? [] : input.permissionKeys,
        },
        requestId: createHash('sha256')
          .update(
            `revokeDriverRoutePermissions:${auth.uid}:${input.routeId}:${input.driverUid}:${nowIso}`,
          )
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        routeId: input.routeId,
        driverUid: input.driverUid,
        updatedAt: nowIso,
      } satisfies RevokeDriverRoutePermissionsOutput;
    });

    return apiOk<RevokeDriverRoutePermissionsOutput>(revoked);
  });

  return {
    listRouteDriverPermissions,
    grantDriverRoutePermissions,
    revokeDriverRoutePermissions,
  };
}
