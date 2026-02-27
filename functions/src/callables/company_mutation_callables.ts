import { createHash } from 'node:crypto';

import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type {
  CreateCompanyRouteOutput,
  CreateVehicleOutput,
  DeleteCompanyRouteStopOutput,
  ReorderCompanyRouteStopsOutput,
  UpdateRouteOutput,
  UpdateVehicleOutput,
  UpsertCompanyRouteStopOutput,
} from '../common/output_contract_types.js';
import type { WriteRouteAuditEventInput } from '../common/route_audit_helpers.js';
import {
  normalizeAuthorizedDriverIds,
  parseIsoToMs,
  pickString,
  pickStringArray,
} from '../common/runtime_value_helpers.js';
import { runTransactionWithResult } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';

interface LatLngInput {
  lat: number;
  lng: number;
}

interface CreateVehicleInput {
  ownerType: 'company' | 'individual_driver';
  companyId: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number | null;
  status?: 'active' | 'maintenance' | 'inactive';
}

interface UpdateVehicleInput {
  companyId: string;
  vehicleId: string;
  patch: {
    plate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    capacity?: number | null;
    status?: 'active' | 'maintenance' | 'inactive';
  };
}

interface CreateCompanyRouteInput {
  companyId: string;
  name: string;
  startPoint: LatLngInput;
  startAddress: string;
  endPoint: LatLngInput;
  endAddress: string;
  scheduledTime: string;
  timeSlot: 'morning' | 'evening' | 'midday' | 'custom';
  allowGuestTracking: boolean;
  authorizedDriverIds?: string[];
}

interface UpdateCompanyRouteInput {
  companyId: string;
  routeId: string;
  lastKnownUpdateToken?: string;
  patch: {
    name?: string;
    scheduledTime?: string;
    timeSlot?: 'morning' | 'evening' | 'midday' | 'custom';
    allowGuestTracking?: boolean;
    isArchived?: boolean;
    authorizedDriverIds?: string[];
  };
}

interface UpsertCompanyRouteStopInput {
  companyId: string;
  routeId: string;
  lastKnownUpdateToken?: string;
  stopId?: string;
  name: string;
  location: LatLngInput;
  order: number;
}

interface DeleteCompanyRouteStopInput {
  companyId: string;
  routeId: string;
  stopId: string;
  lastKnownUpdateToken?: string;
}

interface ReorderCompanyRouteStopsInput {
  companyId: string;
  routeId: string;
  stopId: string;
  direction: 'up' | 'down';
  lastKnownUpdateToken?: string;
}

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';

export function createCompanyMutationCallables({
  db,
  createVehicleInputSchema,
  createCompanyRouteInputSchema,
  updateCompanyRouteInputSchema,
  upsertCompanyRouteStopInputSchema,
  deleteCompanyRouteStopInputSchema,
  reorderCompanyRouteStopsInputSchema,
  updateVehicleInputSchema,
  requireActiveCompanyMemberRole,
  requireCompanyVehicleWriteRole,
  requireCompanyRouteWriteRole,
  normalizeVehiclePlate,
  normalizeVehicleTextNullable,
  assertCompanyMembersExistAndActive,
  createRouteWithSrvCode,
  writeRouteAuditEventSafe,
}: {
  db: Firestore;
  createVehicleInputSchema: ZodType<unknown>;
  createCompanyRouteInputSchema: ZodType<unknown>;
  updateCompanyRouteInputSchema: ZodType<unknown>;
  upsertCompanyRouteStopInputSchema: ZodType<unknown>;
  deleteCompanyRouteStopInputSchema: ZodType<unknown>;
  reorderCompanyRouteStopsInputSchema: ZodType<unknown>;
  updateVehicleInputSchema: ZodType<unknown>;
  requireActiveCompanyMemberRole: (companyId: string, uid: string) => Promise<CompanyMemberRole>;
  requireCompanyVehicleWriteRole: (role: CompanyMemberRole) => void;
  requireCompanyRouteWriteRole: (role: CompanyMemberRole) => void;
  normalizeVehiclePlate: (rawPlate: string) => { plate: string; plateNormalized: string };
  normalizeVehicleTextNullable: (rawValue: string | null | undefined) => string | null;
  assertCompanyMembersExistAndActive: (companyId: string, memberUids: string[]) => Promise<void>;
  createRouteWithSrvCode: (input: {
    db: Firestore;
    ownerUid: string;
    createdAtIso: string;
    routeData: {
      name: string;
      driverId: string;
      authorizedDriverIds: string[];
      memberIds: string[];
      companyId: string;
      visibility: 'company';
      allowGuestTracking: boolean;
      creationMode: 'manual_pin';
      routePolyline: null;
      startPoint: LatLngInput;
      startAddress: string;
      endPoint: LatLngInput;
      endAddress: string;
      scheduledTime: string;
      timeSlot: 'morning' | 'evening' | 'midday' | 'custom';
      isArchived: boolean;
      vacationUntil: null;
      passengerCount: number;
      lastTripStartedNotificationAt: null;
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      updatedBy: string;
      routeOwnerType: 'company_member';
      routeOwnerRole: string;
    };
  }) => Promise<{ routeId: string; srvCode: string }>;
  writeRouteAuditEventSafe: (input: WriteRouteAuditEventInput) => Promise<void>;
}) {
  const createVehicle = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(createVehicleInputSchema, request.data) as CreateVehicleInput;

    if (input.ownerType !== 'company') {
      throw new HttpsError(
        'failed-precondition',
        'MVP createVehicle yalnizca ownerType=company icin desteklenir.',
      );
    }

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyVehicleWriteRole(memberRole);

    const { plate, plateNormalized } = normalizeVehiclePlate(input.plate);
    if (plateNormalized.length < 2) {
      throw new HttpsError('invalid-argument', 'Plate bilgisi gecersiz.');
    }

    const brand = normalizeVehicleTextNullable(input.brand);
    const model = normalizeVehicleTextNullable(input.model);
    const status = input.status ?? 'active';
    const nowIso = new Date().toISOString();
    const companyRef = db.collection('companies').doc(input.companyId);

    const created = await runTransactionWithResult(db, async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const duplicateSnap = await tx.get(
        companyRef.collection('vehicles').where('plateNormalized', '==', plateNormalized).limit(1),
      );
      if (!duplicateSnap.empty) {
        throw new HttpsError('already-exists', 'Bu firmada ayni plakali arac zaten var.');
      }

      const vehicleRef = companyRef.collection('vehicles').doc();
      const auditRef = db.collection('audit_logs').doc();

      tx.set(vehicleRef, {
        companyId: input.companyId,
        ownerType: 'company',
        plate,
        plateNormalized,
        status,
        brand,
        model,
        year: input.year ?? null,
        capacity: input.capacity ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: auth.uid,
        updatedBy: auth.uid,
      });

      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'vehicle_created',
        targetType: 'vehicle',
        targetId: vehicleRef.id,
        status: 'success',
        reason: null,
        metadata: {
          role: memberRole,
          plate,
          vehicleStatus: status,
        },
        requestId: createHash('sha256')
          .update(`createVehicle:${auth.uid}:${input.companyId}:${vehicleRef.id}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        vehicleId: vehicleRef.id,
        createdAt: nowIso,
      } satisfies CreateVehicleOutput;
    });

    return apiOk<CreateVehicleOutput>(created);
  });

  const createCompanyRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(createCompanyRouteInputSchema, request.data) as CreateCompanyRouteInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(memberRole);

    const nowIso = new Date().toISOString();
    const authorizedDriverIds = normalizeAuthorizedDriverIds(input.authorizedDriverIds ?? [], auth.uid);
    await assertCompanyMembersExistAndActive(input.companyId, authorizedDriverIds);

    const memberIds = Array.from(new Set<string>([auth.uid, ...authorizedDriverIds]));

    const created = await createRouteWithSrvCode({
      db,
      ownerUid: auth.uid,
      createdAtIso: nowIso,
      routeData: {
        name: input.name,
        driverId: auth.uid,
        authorizedDriverIds,
        memberIds,
        companyId: input.companyId,
        visibility: 'company',
        allowGuestTracking: input.allowGuestTracking,
        creationMode: 'manual_pin',
        routePolyline: null,
        startPoint: input.startPoint,
        startAddress: input.startAddress,
        endPoint: input.endPoint,
        endAddress: input.endAddress,
        scheduledTime: input.scheduledTime,
        timeSlot: input.timeSlot,
        isArchived: false,
        vacationUntil: null,
        passengerCount: 0,
        lastTripStartedNotificationAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: auth.uid,
        updatedBy: auth.uid,
        routeOwnerType: 'company_member',
        routeOwnerRole: memberRole,
      },
    });

    return apiOk<CreateCompanyRouteOutput>({
      routeId: created.routeId,
      srvCode: created.srvCode,
    });
  });

  const updateCompanyRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(updateCompanyRouteInputSchema, request.data) as UpdateCompanyRouteInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(memberRole);

    let normalizedAuthorizedDriverIdsForPatch: string[] | null = null;
    if ('authorizedDriverIds' in input.patch) {
      normalizedAuthorizedDriverIdsForPatch = normalizeAuthorizedDriverIds(
        input.patch.authorizedDriverIds ?? [],
        auth.uid,
      );
      await assertCompanyMembersExistAndActive(input.companyId, normalizedAuthorizedDriverIdsForPatch);
    }

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const nowIso = new Date().toISOString();

    const updated = await runTransactionWithResult(db, async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const routeSnap = await tx.get(routeRef);
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

      const currentUpdatedAt = pickString(routeData, 'updatedAt');
      if (
        input.lastKnownUpdateToken &&
        currentUpdatedAt &&
        currentUpdatedAt !== input.lastKnownUpdateToken
      ) {
        throw new HttpsError('failed-precondition', 'UPDATE_TOKEN_MISMATCH');
      }

      const patchPayload: Record<string, unknown> = {
        updatedAt: nowIso,
        updatedBy: auth.uid,
      };
      const changedFields: string[] = [];

      if ('name' in input.patch) {
        patchPayload.name = input.patch.name;
        changedFields.push('name');
      }
      if ('scheduledTime' in input.patch) {
        patchPayload.scheduledTime = input.patch.scheduledTime;
        changedFields.push('scheduledTime');
      }
      if ('timeSlot' in input.patch) {
        patchPayload.timeSlot = input.patch.timeSlot;
        changedFields.push('timeSlot');
      }
      if ('allowGuestTracking' in input.patch) {
        patchPayload.allowGuestTracking = input.patch.allowGuestTracking;
        changedFields.push('allowGuestTracking');
      }
      if ('isArchived' in input.patch) {
        patchPayload.isArchived = input.patch.isArchived;
        changedFields.push('isArchived');
      }
      if ('authorizedDriverIds' in input.patch) {
        const nextAuthorizedDriverIds = normalizedAuthorizedDriverIdsForPatch ?? [auth.uid];
        const existingAuthorized = pickStringArray(routeData, 'authorizedDriverIds');
        const existingMemberIds = pickStringArray(routeData, 'memberIds');
        const passengerMembers = existingMemberIds.filter(
          (memberUid) => memberUid !== auth.uid && !existingAuthorized.includes(memberUid),
        );
        const nextMemberIds = Array.from(
          new Set<string>([auth.uid, ...nextAuthorizedDriverIds, ...passengerMembers]),
        );

        patchPayload.authorizedDriverIds = nextAuthorizedDriverIds;
        patchPayload.memberIds = nextMemberIds;
        changedFields.push('authorizedDriverIds');
      }

      if (changedFields.length === 0) {
        throw new HttpsError('invalid-argument', 'En az bir gecerli patch alani gonderilmelidir.');
      }

      tx.update(routeRef, patchPayload);

      return {
        routeId: input.routeId,
        updatedAt: nowIso,
        changedFields,
        srvCode: pickString(routeData, 'srvCode'),
      };
    });

    await writeRouteAuditEventSafe({
      eventType: 'route_updated',
      actorUid: auth.uid,
      routeId: updated.routeId,
      srvCode: updated.srvCode ?? null,
      metadata: {
        companyId: input.companyId,
        role: memberRole,
        changedFields: updated.changedFields,
        routeMutationScope: 'company_summary_patch',
      },
    });

    return apiOk<UpdateRouteOutput>({
      routeId: updated.routeId,
      updatedAt: updated.updatedAt,
    });
  });

  const upsertCompanyRouteStop = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      upsertCompanyRouteStopInputSchema,
      request.data,
    ) as UpsertCompanyRouteStopInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(memberRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const nowIso = new Date().toISOString();
    const activeTripQuery = db
      .collection('trips')
      .where('routeId', '==', input.routeId)
      .where('status', '==', 'active')
      .limit(1);

    const updated = await runTransactionWithResult(db, async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const routeSnap = await tx.get(routeRef);
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

      const currentUpdatedAt = pickString(routeData, 'updatedAt');
      if (
        input.lastKnownUpdateToken &&
        currentUpdatedAt &&
        currentUpdatedAt !== input.lastKnownUpdateToken
      ) {
        throw new HttpsError('failed-precondition', 'UPDATE_TOKEN_MISMATCH');
      }

      const activeTripSnap = await tx.get(activeTripQuery);
      if (!activeTripSnap.empty) {
        throw new HttpsError('failed-precondition', 'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED');
      }

      const stopsRef = routeRef.collection('stops');
      const stopRef = input.stopId ? stopsRef.doc(input.stopId) : stopsRef.doc();
      const stopSnap = await tx.get(stopRef);
      const existing = asRecord(stopSnap.data()) ?? {};
      const existingCreatedAt = pickString(existing, 'createdAt');

      tx.set(
        stopRef,
        {
          name: input.name,
          location: input.location,
          order: input.order,
          createdAt: existingCreatedAt ?? nowIso,
          updatedAt: nowIso,
          createdBy: pickString(existing, 'createdBy') ?? auth.uid,
          updatedBy: auth.uid,
        },
        { merge: true },
      );

      tx.update(routeRef, {
        updatedAt: nowIso,
        updatedBy: auth.uid,
      });

      return {
        stopId: stopRef.id,
        routeId: input.routeId,
        companyId: input.companyId,
        updatedAt: nowIso,
        srvCode: pickString(routeData, 'srvCode'),
        operation: stopSnap.exists ? 'updated' : 'created',
      };
    });

    await writeRouteAuditEventSafe({
      eventType: 'route_stop_upserted',
      actorUid: auth.uid,
      routeId: updated.routeId,
      srvCode: updated.srvCode ?? null,
      metadata: {
        companyId: input.companyId,
        role: memberRole,
        stopId: updated.stopId,
        stopOperation: updated.operation,
        routeMutationScope: 'company_stop_upsert',
      },
    });

    return apiOk<UpsertCompanyRouteStopOutput>({
      companyId: updated.companyId,
      routeId: updated.routeId,
      stopId: updated.stopId,
      updatedAt: updated.updatedAt,
    });
  });

  const deleteCompanyRouteStop = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      deleteCompanyRouteStopInputSchema,
      request.data,
    ) as DeleteCompanyRouteStopInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(memberRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const stopRef = routeRef.collection('stops').doc(input.stopId);
    const nowIso = new Date().toISOString();
    const activeTripQuery = db
      .collection('trips')
      .where('routeId', '==', input.routeId)
      .where('status', '==', 'active')
      .limit(1);

    const deleted = await runTransactionWithResult(db, async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const routeSnap = await tx.get(routeRef);
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

      const currentUpdatedAt = pickString(routeData, 'updatedAt');
      if (
        input.lastKnownUpdateToken &&
        currentUpdatedAt &&
        currentUpdatedAt !== input.lastKnownUpdateToken
      ) {
        throw new HttpsError('failed-precondition', 'UPDATE_TOKEN_MISMATCH');
      }

      const activeTripSnap = await tx.get(activeTripQuery);
      if (!activeTripSnap.empty) {
        throw new HttpsError('failed-precondition', 'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED');
      }

      const stopSnap = await tx.get(stopRef);
      if (!stopSnap.exists) {
        throw new HttpsError('not-found', 'Durak bulunamadi.');
      }

      tx.delete(stopRef);
      tx.update(routeRef, {
        updatedAt: nowIso,
        updatedBy: auth.uid,
      });

      return {
        routeId: input.routeId,
        stopId: input.stopId,
        srvCode: pickString(routeData, 'srvCode'),
      };
    });

    await writeRouteAuditEventSafe({
      eventType: 'route_stop_deleted',
      actorUid: auth.uid,
      routeId: deleted.routeId,
      srvCode: deleted.srvCode ?? null,
      metadata: {
        companyId: input.companyId,
        role: memberRole,
        stopId: deleted.stopId,
        routeMutationScope: 'company_stop_delete',
      },
    });

    return apiOk<DeleteCompanyRouteStopOutput>({
      routeId: deleted.routeId,
      stopId: deleted.stopId,
      deleted: true,
    });
  });

  const reorderCompanyRouteStops = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      reorderCompanyRouteStopsInputSchema,
      request.data,
    ) as ReorderCompanyRouteStopsInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(memberRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const stopsRef = routeRef.collection('stops');
    const targetStopRef = stopsRef.doc(input.stopId);
    const nowIso = new Date().toISOString();
    const activeTripQuery = db
      .collection('trips')
      .where('routeId', '==', input.routeId)
      .where('status', '==', 'active')
      .limit(1);

    const reordered = await runTransactionWithResult(db, async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const routeSnap = await tx.get(routeRef);
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

      const currentUpdatedAt = pickString(routeData, 'updatedAt');
      if (
        input.lastKnownUpdateToken &&
        currentUpdatedAt &&
        currentUpdatedAt !== input.lastKnownUpdateToken
      ) {
        throw new HttpsError('failed-precondition', 'UPDATE_TOKEN_MISMATCH');
      }

      const activeTripSnap = await tx.get(activeTripQuery);
      if (!activeTripSnap.empty) {
        throw new HttpsError('failed-precondition', 'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED');
      }

      const [targetStopSnap, stopsSnap] = await Promise.all([tx.get(targetStopRef), tx.get(stopsRef)]);
      if (!targetStopSnap.exists) {
        throw new HttpsError('not-found', 'Durak bulunamadi.');
      }

      const stopItems = stopsSnap.docs
        .map((doc) => {
          const data = asRecord(doc.data()) ?? {};
          const orderRaw = data.order;
          const order =
            typeof orderRaw === 'number' && Number.isFinite(orderRaw) ? Math.trunc(orderRaw) : null;
          if (order == null) {
            return null;
          }
          return {
            ref: doc.ref,
            id: doc.id,
            order,
            updatedAt: pickString(data, 'updatedAt'),
          };
        })
        .filter(
          (
            item,
          ): item is {
            ref: FirebaseFirestore.DocumentReference;
            id: string;
            order: number;
            updatedAt: string | null;
          } => item !== null,
        )
        .sort((a, b) => {
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          const aTime = parseIsoToMs(a.updatedAt) ?? 0;
          const bTime = parseIsoToMs(b.updatedAt) ?? 0;
          return bTime - aTime;
        });

      const currentIndex = stopItems.findIndex((item) => item.id === input.stopId);
      if (currentIndex < 0) {
        throw new HttpsError('failed-precondition', 'ROUTE_STOP_INVALID_STATE');
      }

      const swapIndex = input.direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= stopItems.length) {
        return {
          routeId: input.routeId,
          updatedAt: currentUpdatedAt ?? nowIso,
          changed: false,
          movedStopId: input.stopId,
          swappedWithStopId: null,
          srvCode: pickString(routeData, 'srvCode'),
        };
      }

      const currentItem = stopItems[currentIndex];
      const swapItem = stopItems[swapIndex];
      if (!currentItem || !swapItem) {
        throw new HttpsError('internal', 'ROUTE_STOP_REORDER_STATE_INVALID');
      }

      tx.update(currentItem.ref, {
        order: swapItem.order,
        updatedAt: nowIso,
        updatedBy: auth.uid,
      });
      tx.update(swapItem.ref, {
        order: currentItem.order,
        updatedAt: nowIso,
        updatedBy: auth.uid,
      });
      tx.update(routeRef, {
        updatedAt: nowIso,
        updatedBy: auth.uid,
      });

      return {
        routeId: input.routeId,
        updatedAt: nowIso,
        changed: true,
        movedStopId: currentItem.id,
        swappedWithStopId: swapItem.id,
        srvCode: pickString(routeData, 'srvCode'),
      };
    });

    if (reordered.changed) {
      await writeRouteAuditEventSafe({
        eventType: 'route_stops_reordered',
        actorUid: auth.uid,
        routeId: reordered.routeId,
        srvCode: reordered.srvCode ?? null,
        metadata: {
          companyId: input.companyId,
          role: memberRole,
          movedStopId: reordered.movedStopId,
          swappedWithStopId: reordered.swappedWithStopId,
          direction: input.direction,
          routeMutationScope: 'company_stop_reorder',
        },
      });
    }

    return apiOk<ReorderCompanyRouteStopsOutput>({
      routeId: reordered.routeId,
      updatedAt: reordered.updatedAt,
      changed: reordered.changed,
    });
  });

  const updateVehicle = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(updateVehicleInputSchema, request.data) as UpdateVehicleInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyVehicleWriteRole(memberRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const vehicleRef = companyRef.collection('vehicles').doc(input.vehicleId);
    const nowIso = new Date().toISOString();

    const updated = await runTransactionWithResult(db, async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const vehicleSnap = await tx.get(vehicleRef);
      if (!vehicleSnap.exists) {
        throw new HttpsError('not-found', 'Arac bulunamadi.');
      }

      const current = asRecord(vehicleSnap.data()) ?? {};
      const currentPlateNormalized = pickString(current, 'plateNormalized');

      const patchPayload: Record<string, unknown> = {
        updatedAt: nowIso,
        updatedBy: auth.uid,
      };
      const changedFields: string[] = [];

      if ('plate' in input.patch) {
        if (typeof input.patch.plate !== 'string') {
          throw new HttpsError('invalid-argument', 'Plate bilgisi gecersiz.');
        }
        const normalizedPlate = normalizeVehiclePlate(input.patch.plate);
        if (normalizedPlate.plateNormalized.length < 2) {
          throw new HttpsError('invalid-argument', 'Plate bilgisi gecersiz.');
        }

        if (normalizedPlate.plateNormalized !== currentPlateNormalized) {
          const duplicateSnap = await tx.get(
            companyRef
              .collection('vehicles')
              .where('plateNormalized', '==', normalizedPlate.plateNormalized)
              .limit(1),
          );
          const duplicateOtherDoc = duplicateSnap.docs.find((doc) => doc.id !== input.vehicleId);
          if (duplicateOtherDoc) {
            throw new HttpsError('already-exists', 'Bu firmada ayni plakali arac zaten var.');
          }
        }

        patchPayload.plate = normalizedPlate.plate;
        patchPayload.plateNormalized = normalizedPlate.plateNormalized;
        changedFields.push('plate');
      }

      if ('brand' in input.patch) {
        patchPayload.brand = normalizeVehicleTextNullable(input.patch.brand);
        changedFields.push('brand');
      }

      if ('model' in input.patch) {
        patchPayload.model = normalizeVehicleTextNullable(input.patch.model);
        changedFields.push('model');
      }

      if ('year' in input.patch) {
        patchPayload.year = input.patch.year ?? null;
        changedFields.push('year');
      }

      if ('capacity' in input.patch) {
        patchPayload.capacity = input.patch.capacity ?? null;
        changedFields.push('capacity');
      }

      if ('status' in input.patch) {
        patchPayload.status = input.patch.status;
        changedFields.push('status');
      }

      if (changedFields.length === 0) {
        throw new HttpsError('invalid-argument', 'En az bir gecerli patch alani gonderilmelidir.');
      }

      tx.update(vehicleRef, patchPayload);

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'vehicle_updated',
        targetType: 'vehicle',
        targetId: input.vehicleId,
        status: 'success',
        reason: null,
        metadata: {
          role: memberRole,
          changedFields,
        },
        requestId: createHash('sha256')
          .update(`updateVehicle:${auth.uid}:${input.companyId}:${input.vehicleId}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        vehicleId: input.vehicleId,
        updatedAt: nowIso,
      } satisfies UpdateVehicleOutput;
    });

    return apiOk<UpdateVehicleOutput>(updated);
  });

  return {
    createVehicle,
    createCompanyRoute,
    updateCompanyRoute,
    upsertCompanyRouteStop,
    deleteCompanyRouteStop,
    reorderCompanyRouteStops,
    updateVehicle,
  };
}
