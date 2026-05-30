import { createHash } from 'node:crypto';

import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { readRouteTimeSlot } from '../common/route_preview_helpers.js';
import type {
  CreateCompanyRouteOutput,
  CreateVehicleOutput,
  DeleteVehicleOutput,
  DeleteCompanyRouteOutput,
  DeleteCompanyRouteStopOutput,
  ListCompanyRoutesItem,
  ListCompanyVehiclesItem,
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
  driverId?: string | null;
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
    vehicleId?: string | null;
    authorizedDriverIds?: string[];
  };
}

interface DeleteVehicleInput {
  companyId: string;
  vehicleId: string;
}

interface DeleteCompanyRouteInput {
  companyId: string;
  routeId: string;
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

function buildRouteListItem(routeId: string, routeData: Record<string, unknown>): ListCompanyRoutesItem {
  return {
    routeId,
    companyId: pickString(routeData, 'companyId') ?? '',
    name: pickString(routeData, 'name') ?? `Route (${routeId.slice(0, 6)})`,
    srvCode: pickString(routeData, 'srvCode'),
    driverId: pickString(routeData, 'driverId'),
    authorizedDriverIds: pickStringArray(routeData, 'authorizedDriverIds'),
    scheduledTime: pickString(routeData, 'scheduledTime'),
    timeSlot: readRouteTimeSlot(routeData.timeSlot),
    isArchived: routeData.isArchived === true,
    allowGuestTracking: routeData.allowGuestTracking === true,
    startAddress: pickString(routeData, 'startAddress'),
    endAddress: pickString(routeData, 'endAddress'),
    vehicleId: pickString(routeData, 'vehicleId'),
    vehiclePlate: pickString(routeData, 'vehiclePlate'),
    passengerCount:
      typeof routeData.passengerCount === 'number' && Number.isFinite(routeData.passengerCount)
        ? routeData.passengerCount
        : 0,
    updatedAt: pickString(routeData, 'updatedAt'),
  };
}

function buildVehicleListItem(vehicleId: string, vehicleData: Record<string, unknown>): ListCompanyVehiclesItem {
  return {
    vehicleId,
    companyId: pickString(vehicleData, 'companyId') ?? '',
    plate: pickString(vehicleData, 'plate') ?? '',
    status:
      pickString(vehicleData, 'status') === 'maintenance'
        ? 'maintenance'
        : pickString(vehicleData, 'status') === 'inactive'
          ? 'inactive'
          : 'active',
    brand: pickString(vehicleData, 'brand'),
    model: pickString(vehicleData, 'model'),
    year:
      typeof vehicleData.year === 'number' && Number.isFinite(vehicleData.year)
        ? Math.trunc(vehicleData.year)
        : null,
    capacity:
      typeof vehicleData.capacity === 'number' && Number.isFinite(vehicleData.capacity)
        ? Math.trunc(vehicleData.capacity)
        : null,
    createdAt: pickString(vehicleData, 'createdAt'),
    updatedAt: pickString(vehicleData, 'updatedAt'),
  };
}

export function createCompanyMutationCallables({
  db,
  createVehicleInputSchema,
  createCompanyRouteInputSchema,
  updateCompanyRouteInputSchema,
  deleteCompanyRouteInputSchema,
  deleteVehicleInputSchema,
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
  deleteCompanyRouteInputSchema: ZodType<unknown>;
  deleteVehicleInputSchema: ZodType<unknown>;
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
        driverId: string | null;
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
    if (plateNormalized.length < 4) {
      throw new HttpsError('invalid-argument', 'plate minimum 4 karakter olmalidir.');
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

      const vehicle = buildVehicleListItem(vehicleRef.id, {
        companyId: input.companyId,
        plate,
        status,
        brand,
        model,
        year: input.year ?? null,
        capacity: input.capacity ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      return {
        vehicleId: vehicleRef.id,
        createdAt: nowIso,
        vehicle,
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
    const primaryDriverId = input.driverId?.trim() || null;
    if (primaryDriverId) {
      const driverSnap = await db.collection('drivers').doc(primaryDriverId).get();
      if (!driverSnap.exists) {
        throw new HttpsError('not-found', 'Sofor bulunamadi.');
      }
      const driverData = asRecord(driverSnap.data()) ?? {};
      if (pickString(driverData, 'companyId') !== input.companyId) {
        throw new HttpsError('permission-denied', 'Sofor bu sirkete ait degil.');
      }
      if (pickString(driverData, 'status') === 'passive') {
        throw new HttpsError('failed-precondition', 'Pasif sofor rotaya atanamaz.');
      }
    }

    const memberIds = Array.from(new Set<string>([auth.uid, ...authorizedDriverIds]));

    const created = await createRouteWithSrvCode({
      db,
      ownerUid: auth.uid,
      createdAtIso: nowIso,
      routeData: {
        name: input.name,
        driverId: primaryDriverId,
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

    const route: ListCompanyRoutesItem = buildRouteListItem(created.routeId, {
      routeId: created.routeId,
      companyId: input.companyId,
      name: input.name,
      srvCode: created.srvCode,
      driverId: primaryDriverId,
      authorizedDriverIds,
      scheduledTime: input.scheduledTime,
      timeSlot: input.timeSlot,
      isArchived: false,
      allowGuestTracking: input.allowGuestTracking,
      startAddress: input.startAddress,
      endAddress: input.endAddress,
      vehicleId: null,
      vehiclePlate: null,
      passengerCount: 0,
      updatedAt: nowIso,
    });

    return apiOk<CreateCompanyRouteOutput>({
      routeId: created.routeId,
      srvCode: created.srvCode,
      route,
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
      if ('vehicleId' in input.patch) {
        if (input.patch.vehicleId) {
          const vehicleRef = companyRef.collection('vehicles').doc(input.patch.vehicleId);
          const vehicleSnap = await tx.get(vehicleRef);
          if (!vehicleSnap.exists) {
            throw new HttpsError('not-found', 'Arac bulunamadi.');
          }
          const vehicleData = asRecord(vehicleSnap.data()) ?? {};
          patchPayload.vehicleId = input.patch.vehicleId;
          patchPayload.vehiclePlate = pickString(vehicleData, 'plate');
        } else {
          patchPayload.vehicleId = null;
          patchPayload.vehiclePlate = null;
        }
        changedFields.push('vehicleId');
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

      const nextRouteData = {
        ...routeData,
        ...patchPayload,
      };

      return {
        routeId: input.routeId,
        updatedAt: nowIso,
        changedFields,
        srvCode: pickString(routeData, 'srvCode'),
        route: buildRouteListItem(input.routeId, nextRouteData),
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
      route: updated.route,
    });
  });

  const deleteCompanyRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(deleteCompanyRouteInputSchema, request.data) as DeleteCompanyRouteInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyRouteWriteRole(memberRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const routeRef = db.collection('routes').doc(input.routeId);
    const activeTripQuery = db
      .collection('trips')
      .where('routeId', '==', input.routeId)
      .where('status', '==', 'active')
      .limit(1);
    const anyTripQuery = db.collection('trips').where('routeId', '==', input.routeId).limit(1);

    const [companySnap, routeSnap, activeTripSnap, anyTripSnap] = await Promise.all([
      companyRef.get(),
      routeRef.get(),
      activeTripQuery.get(),
      anyTripQuery.get(),
    ]);

    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Firma bulunamadi.');
    }
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }
    if (!activeTripSnap.empty) {
      throw new HttpsError('failed-precondition', 'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED');
    }
    if (!anyTripSnap.empty) {
      throw new HttpsError('failed-precondition', 'ROUTE_HAS_TRIP_HISTORY_DELETE_FORBIDDEN');
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

    const [stopsSnap, passengersSnap, skipRequestsSnap, driverPermissionsSnap, announcementsSnap, guestSessionsSnap, conversationsSnap] =
      await Promise.all([
        routeRef.collection('stops').get(),
        routeRef.collection('passengers').get(),
        routeRef.collection('skip_requests').get(),
        routeRef.collection('driver_permissions').get(),
        db.collection('announcements').where('routeId', '==', input.routeId).get(),
        db.collection('guest_sessions').where('routeId', '==', input.routeId).get(),
        db.collection('trip_conversations').where('routeId', '==', input.routeId).get(),
      ]);

    const conversationMessageSnaps = await Promise.all(
      conversationsSnap.docs.map((doc) => doc.ref.collection('messages').get()),
    );

    const refsToDelete = [
      ...stopsSnap.docs.map((doc) => doc.ref),
      ...passengersSnap.docs.map((doc) => doc.ref),
      ...skipRequestsSnap.docs.map((doc) => doc.ref),
      ...driverPermissionsSnap.docs.map((doc) => doc.ref),
      ...announcementsSnap.docs.map((doc) => doc.ref),
      ...guestSessionsSnap.docs.map((doc) => doc.ref),
      ...conversationsSnap.docs.map((doc) => doc.ref),
      ...conversationMessageSnaps.flatMap((snap) => snap.docs.map((doc) => doc.ref)),
      ...(pickString(routeData, 'srvCode')
        ? [db.collection('_srv_codes').doc(pickString(routeData, 'srvCode') as string)]
        : []),
      routeRef,
    ];

    for (let index = 0; index < refsToDelete.length; index += 400) {
      const batch = db.batch();
      for (const ref of refsToDelete.slice(index, index + 400)) {
        batch.delete(ref);
      }
      await batch.commit();
    }

    await writeRouteAuditEventSafe({
      eventType: 'route_deleted',
      actorUid: auth.uid,
      routeId: input.routeId,
      srvCode: pickString(routeData, 'srvCode'),
      metadata: {
        companyId: input.companyId,
        role: memberRole,
        routeMutationScope: 'company_route_delete',
      },
    });

    return apiOk<DeleteCompanyRouteOutput>({
      routeId: input.routeId,
      deleted: true,
      deletedAt: new Date().toISOString(),
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
        if (normalizedPlate.plateNormalized.length < 4) {
          throw new HttpsError('invalid-argument', 'plate minimum 4 karakter olmalidir.');
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

      const vehicle = buildVehicleListItem(input.vehicleId, {
        ...current,
        ...patchPayload,
      });

      return {
        vehicleId: input.vehicleId,
        updatedAt: nowIso,
        vehicle,
      } satisfies UpdateVehicleOutput;
    });

    return apiOk<UpdateVehicleOutput>(updated);
  });

  const deleteVehicle = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(deleteVehicleInputSchema, request.data) as DeleteVehicleInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireCompanyVehicleWriteRole(memberRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const vehicleRef = companyRef.collection('vehicles').doc(input.vehicleId);
    const nowIso = new Date().toISOString();

    const deleted = await runTransactionWithResult(db, async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const vehicleSnap = await tx.get(vehicleRef);
      if (!vehicleSnap.exists) {
        throw new HttpsError('not-found', 'Arac bulunamadi.');
      }

      const linkedRoutesSnap = await tx.get(
        companyRef.collection('routes').where('vehicleId', '==', input.vehicleId).limit(5),
      );
      const linkedActiveRoutes = linkedRoutesSnap.docs.filter((doc) => {
        const routeData = asRecord(doc.data()) ?? {};
        return routeData.isArchived !== true;
      });
      if (linkedActiveRoutes.length > 0) {
        throw new HttpsError(
          'failed-precondition',
          'COMPANY_VEHICLE_ROUTE_LINKED_DELETE_FORBIDDEN',
        );
      }

      tx.delete(vehicleRef);

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'vehicle_deleted',
        targetType: 'vehicle',
        targetId: input.vehicleId,
        status: 'success',
        reason: null,
        metadata: {
          role: memberRole,
        },
        requestId: createHash('sha256')
          .update(`deleteVehicle:${auth.uid}:${input.companyId}:${input.vehicleId}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        vehicleId: input.vehicleId,
        deleted: true,
        deletedAt: nowIso,
      } satisfies DeleteVehicleOutput;
    });

    return apiOk<DeleteVehicleOutput>(deleted);
  });

  return {
    createVehicle,
    createCompanyRoute,
    updateCompanyRoute,
    deleteCompanyRoute,
    upsertCompanyRouteStop,
    deleteCompanyRouteStop,
    reorderCompanyRouteStops,
    updateVehicle,
    deleteVehicle,
  };
}
