import { createHash } from 'node:crypto';

import type { Database } from 'firebase-admin/database';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type {
  CreateCompanyOutput,
  ListActiveTripsByCompanyItem,
  ListActiveTripsByCompanyOutput,
  ListCompanyMembersItem,
  ListCompanyMembersOutput,
  ListCompanyRouteStopsItem,
  ListCompanyRouteStopsOutput,
  ListCompanyRoutesItem,
  ListCompanyRoutesOutput,
  ListCompanyVehiclesItem,
  ListCompanyVehiclesOutput,
  ListMyCompaniesItem,
  ListMyCompaniesOutput,
} from '../common/output_contract_types.js';
import { readRouteTimeSlot } from '../common/mapbox_route_preview_helpers.js';
import { parseIsoToMs, pickFiniteNumber, pickString, pickStringArray } from '../common/runtime_value_helpers.js';
import { runTransactionWithResult } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';

interface CreateCompanyInput {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface ListCompanyMembersInput {
  companyId: string;
}

interface ListCompanyRoutesInput {
  companyId: string;
  includeArchived?: boolean;
  limit?: number;
}

interface ListCompanyRouteStopsInput {
  companyId: string;
  routeId: string;
}

interface ListActiveTripsByCompanyInput {
  companyId: string;
  routeId?: string;
  driverUid?: string;
  pageSize?: number;
}

interface ListCompanyVehiclesInput {
  companyId: string;
  limit?: number;
}

export function createCompanyQueryCallables({
  db,
  rtdb,
  createCompanyInputSchema,
  listCompanyMembersInputSchema,
  listCompanyRoutesInputSchema,
  listCompanyRouteStopsInputSchema,
  listActiveTripsByCompanyInputSchema,
  listCompanyVehiclesInputSchema,
  defaultCompanyTimezone,
  defaultCompanyCountryCode,
  liveOpsOnlineThresholdMs,
  requireActiveCompanyMemberRole,
}: {
  db: Firestore;
  rtdb: Database;
  createCompanyInputSchema: ZodType<unknown>;
  listCompanyMembersInputSchema: ZodType<unknown>;
  listCompanyRoutesInputSchema: ZodType<unknown>;
  listCompanyRouteStopsInputSchema: ZodType<unknown>;
  listActiveTripsByCompanyInputSchema: ZodType<unknown>;
  listCompanyVehiclesInputSchema: ZodType<unknown>;
  defaultCompanyTimezone: string;
  defaultCompanyCountryCode: string;
  liveOpsOnlineThresholdMs: number;
  requireActiveCompanyMemberRole: (companyId: string, uid: string) => Promise<string>;
}) {
  const createCompany = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(createCompanyInputSchema, request.data) as CreateCompanyInput;

    const nowIso = new Date().toISOString();
    const normalizedContactEmail = input.contactEmail?.trim() || null;
    const normalizedContactPhone = input.contactPhone?.trim() || null;

    const created = await runTransactionWithResult<CreateCompanyOutput>(db, (tx) => {
      const companyRef = db.collection('companies').doc();
      const memberRef = companyRef.collection('members').doc(auth.uid);
      const userMembershipRef = db
        .collection('users')
        .doc(auth.uid)
        .collection('company_memberships')
        .doc(companyRef.id);
      const auditRef = db.collection('audit_logs').doc();

      tx.set(companyRef, {
        name: input.name,
        legalName: null,
        status: 'active',
        timezone: defaultCompanyTimezone,
        countryCode: defaultCompanyCountryCode,
        contactPhone: normalizedContactPhone,
        contactEmail: normalizedContactEmail,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: auth.uid,
      });

      tx.set(memberRef, {
        companyId: companyRef.id,
        uid: auth.uid,
        role: 'owner',
        status: 'active',
        permissions: null,
        invitedBy: null,
        invitedAt: null,
        acceptedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      tx.set(userMembershipRef, {
        companyId: companyRef.id,
        uid: auth.uid,
        role: 'owner',
        status: 'active',
        companyName: input.name,
        companyStatus: 'active',
        acceptedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      tx.set(auditRef, {
        companyId: companyRef.id,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_created',
        targetType: 'company',
        targetId: companyRef.id,
        status: 'success',
        reason: null,
        metadata: {
          role: 'owner',
        },
        requestId: createHash('sha256')
          .update(`${auth.uid}:${companyRef.id}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        companyId: companyRef.id,
        ownerMember: {
          uid: auth.uid,
          role: 'owner',
          status: 'active',
        },
        createdAt: nowIso,
      };
    });

    return apiOk<CreateCompanyOutput>(created);
  });

  const listMyCompanies = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const membershipSnap = await db
      .collection('users')
      .doc(auth.uid)
      .collection('company_memberships')
      .get();
    if (membershipSnap.empty) {
      return apiOk<ListMyCompaniesOutput>({ items: [] });
    }

    const membershipRows = membershipSnap.docs
      .map((doc) => {
        const memberData = asRecord(doc.data()) ?? {};
        const companyId =
          typeof memberData.companyId === 'string' && memberData.companyId.trim()
            ? memberData.companyId
            : doc.id;
        const role = memberData.role;
        const status = memberData.status ?? memberData.memberStatus;
        if (
          !companyId ||
          !['owner', 'admin', 'dispatcher', 'viewer'].includes(String(role)) ||
          !['active', 'invited', 'suspended'].includes(String(status))
        ) {
          return null;
        }
        return {
          companyId,
          role: role as ListMyCompaniesItem['role'],
          memberStatus: status as ListMyCompaniesItem['memberStatus'],
          companyNameSnapshot:
            typeof memberData.companyName === 'string' && memberData.companyName.trim()
              ? memberData.companyName.trim()
              : null,
        };
      })
      .filter(
        (
          row,
        ): row is {
          companyId: string;
          role: ListMyCompaniesItem['role'];
          memberStatus: ListMyCompaniesItem['memberStatus'];
          companyNameSnapshot: string | null;
        } => row !== null,
      );

    const companyDocs = await Promise.all(
      membershipRows.map(async (row) => {
        const snap = await db.collection('companies').doc(row.companyId).get();
        return { row, data: asRecord(snap.data()) ?? null };
      }),
    );

    const items = companyDocs
      .map(({ row, data }) => {
        const name =
          typeof data?.name === 'string' && data.name.trim() ? data.name : row.companyNameSnapshot;
        if (typeof name !== 'string' || !name.trim()) {
          return null;
        }
        return {
          companyId: row.companyId,
          name,
          role: row.role,
          memberStatus: row.memberStatus,
        } satisfies ListMyCompaniesItem;
      })
      .filter((item): item is ListMyCompaniesItem => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    return apiOk<ListMyCompaniesOutput>({ items });
  });

  const listCompanyMembers = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listCompanyMembersInputSchema,
      request.data,
    ) as ListCompanyMembersInput;

    await requireActiveCompanyMemberRole(input.companyId, auth.uid);

    const companyRef = db.collection('companies').doc(input.companyId);
    const [companySnap, membersSnap] = await Promise.all([
      companyRef.get(),
      companyRef.collection('members').orderBy('createdAt', 'asc').limit(200).get(),
    ]);

    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Firma bulunamadi.');
    }

    const rows = membersSnap.docs
      .map((doc) => {
        const data = asRecord(doc.data()) ?? {};
        const uid = pickString(data, 'uid') ?? doc.id;
        const role = data.role;
        const memberStatus = data.status;
        if (
          !uid ||
          !['owner', 'admin', 'dispatcher', 'viewer'].includes(String(role)) ||
          !['active', 'invited', 'suspended'].includes(String(memberStatus))
        ) {
          return null;
        }
        return {
          uid,
          role: role as ListCompanyMembersItem['role'],
          memberStatus: memberStatus as ListCompanyMembersItem['memberStatus'],
          createdAt: pickString(data, 'createdAt') ?? '',
        };
      })
      .filter(
        (
          row,
        ): row is {
          uid: string;
          role: ListCompanyMembersItem['role'];
          memberStatus: ListCompanyMembersItem['memberStatus'];
          createdAt: string;
        } => row !== null,
      );

    const userDocs = await Promise.all(rows.map((row) => db.collection('users').doc(row.uid).get()));
    const usersByUid = new Map<string, Record<string, unknown>>();
    for (const snap of userDocs) {
      const data = asRecord(snap.data());
      if (snap.id && data) {
        usersByUid.set(snap.id, data);
      }
    }

    const items = rows
      .map((row) => {
        const userData = usersByUid.get(row.uid) ?? null;
        const displayName =
          pickString(userData, 'displayName') ??
          pickString(userData, 'name') ??
          `Uye (${row.uid.slice(0, 6)})`;
        return {
          uid: row.uid,
          displayName,
          email: pickString(userData, 'email'),
          phone: pickString(userData, 'phone'),
          role: row.role,
          memberStatus: row.memberStatus,
          companyId: input.companyId,
        } satisfies ListCompanyMembersItem;
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'tr'));

    return apiOk<ListCompanyMembersOutput>({ items });
  });

  const listCompanyRoutes = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(listCompanyRoutesInputSchema, request.data) as ListCompanyRoutesInput;

    await requireActiveCompanyMemberRole(input.companyId, auth.uid);

    const baseQuery = db.collection('routes').where('companyId', '==', input.companyId);
    const queryLimit = input.limit ?? 50;
    const routesSnap = input.includeArchived
      ? await baseQuery.limit(queryLimit).get()
      : await baseQuery.where('isArchived', '==', false).limit(queryLimit).get();

    const items = routesSnap.docs
      .map((doc) => {
        const data = asRecord(doc.data()) ?? {};
        const isArchivedRaw = data.isArchived;
        const allowGuestTrackingRaw = data.allowGuestTracking;
        const passengerCountRaw = data.passengerCount;

        return {
          routeId: doc.id,
          companyId: input.companyId,
          name: pickString(data, 'name') ?? `Route (${doc.id.slice(0, 6)})`,
          srvCode: pickString(data, 'srvCode'),
          driverId: pickString(data, 'driverId'),
          authorizedDriverIds: pickStringArray(data, 'authorizedDriverIds'),
          scheduledTime: pickString(data, 'scheduledTime'),
          timeSlot: readRouteTimeSlot(data.timeSlot),
          isArchived: typeof isArchivedRaw === 'boolean' ? isArchivedRaw : false,
          allowGuestTracking:
            typeof allowGuestTrackingRaw === 'boolean' ? allowGuestTrackingRaw : false,
          passengerCount:
            typeof passengerCountRaw === 'number' && Number.isFinite(passengerCountRaw)
              ? passengerCountRaw
              : 0,
          updatedAt: pickString(data, 'updatedAt'),
        } satisfies ListCompanyRoutesItem;
      })
      .sort((a, b) => {
        const aTime = parseIsoToMs(a.updatedAt) ?? 0;
        const bTime = parseIsoToMs(b.updatedAt) ?? 0;
        return bTime - aTime;
      });

    return apiOk<ListCompanyRoutesOutput>({ items });
  });

  const listCompanyRouteStops = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listCompanyRouteStopsInputSchema,
      request.data,
    ) as ListCompanyRouteStopsInput;

    await requireActiveCompanyMemberRole(input.companyId, auth.uid);

    const routeRef = db.collection('routes').doc(input.routeId);
    const routeSnap = await routeRef.get();
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

    const stopsSnap = await routeRef.collection('stops').get();
    const items = stopsSnap.docs
      .map((doc) => {
        const data = asRecord(doc.data()) ?? {};
        const name = pickString(data, 'name');
        const orderRaw = data.order;
        const location = asRecord(data.location);
        const lat =
          typeof location?.lat === 'number' && Number.isFinite(location.lat) ? location.lat : null;
        const lng =
          typeof location?.lng === 'number' && Number.isFinite(location.lng) ? location.lng : null;
        const order = typeof orderRaw === 'number' && Number.isFinite(orderRaw) ? orderRaw : null;
        if (!name || lat == null || lng == null || order == null) {
          return null;
        }

        return {
          stopId: doc.id,
          routeId: input.routeId,
          companyId: input.companyId,
          name,
          location: { lat, lng },
          order,
          createdAt: pickString(data, 'createdAt'),
          updatedAt: pickString(data, 'updatedAt'),
        } satisfies ListCompanyRouteStopsItem;
      })
      .filter((item): item is ListCompanyRouteStopsItem => item !== null)
      .sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        const aTime = parseIsoToMs(a.updatedAt) ?? 0;
        const bTime = parseIsoToMs(b.updatedAt) ?? 0;
        return bTime - aTime;
      });

    return apiOk<ListCompanyRouteStopsOutput>({
      companyId: input.companyId,
      routeId: input.routeId,
      items,
    });
  });

  const listActiveTripsByCompany = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listActiveTripsByCompanyInputSchema,
      request.data,
    ) as ListActiveTripsByCompanyInput;

    await requireActiveCompanyMemberRole(input.companyId, auth.uid);

    const routeFilterId = input.routeId ?? null;
    const driverFilterUid = input.driverUid ?? null;
    const pageSize = input.pageSize ?? 50;
    const overfetchLimit = Math.min(Math.max(pageSize * 4, pageSize), 200);

    const tripsSnap = await db
      .collection('trips')
      .where('status', '==', 'active')
      .limit(overfetchLimit)
      .get();

    type RawTrip = {
      tripId: string;
      routeId: string;
      driverUid: string;
      startedAt: string | null;
      lastLocationAt: string | null;
      updatedAt: string | null;
      driverName: string;
      driverPlate: string | null;
    };

    const rawTrips = tripsSnap.docs
      .map((doc) => {
        const data = asRecord(doc.data()) ?? {};
        const routeId = pickString(data, 'routeId');
        const driverUid = pickString(data, 'driverId');
        if (!routeId || !driverUid || pickString(data, 'status') !== 'active') {
          return null;
        }
        if (routeFilterId && routeId !== routeFilterId) {
          return null;
        }
        if (driverFilterUid && driverUid !== driverFilterUid) {
          return null;
        }
        const driverSnapshot = asRecord(data.driverSnapshot);
        return {
          tripId: doc.id,
          routeId,
          driverUid,
          startedAt: pickString(data, 'startedAt'),
          lastLocationAt: pickString(data, 'lastLocationAt'),
          updatedAt: pickString(data, 'updatedAt'),
          driverName: pickString(driverSnapshot, 'name') ?? `Sofor (${driverUid.slice(0, 6)})`,
          driverPlate: pickString(driverSnapshot, 'plate'),
        } satisfies RawTrip;
      })
      .filter((item): item is RawTrip => item !== null);

    if (rawTrips.length === 0) {
      return apiOk<ListActiveTripsByCompanyOutput>({ items: [] });
    }

    const uniqueRouteIds = Array.from(new Set(rawTrips.map((trip) => trip.routeId)));
    const routeSnaps = await Promise.all(
      uniqueRouteIds.map((routeId) => db.collection('routes').doc(routeId).get()),
    );
    const routeMetaById = new Map<
      string,
      { companyId: string | null; visibility: string | null; routeName: string }
    >();
    for (const routeSnap of routeSnaps) {
      if (!routeSnap.exists) continue;
      const routeData = asRecord(routeSnap.data()) ?? {};
      routeMetaById.set(routeSnap.id, {
        companyId: pickString(routeData, 'companyId'),
        visibility: pickString(routeData, 'visibility'),
        routeName: pickString(routeData, 'name') ?? `Route (${routeSnap.id.slice(0, 6)})`,
      });
    }

    const nowMs = Date.now();
    const candidateTrips = rawTrips
      .map((trip) => {
        const routeMeta = routeMetaById.get(trip.routeId);
        if (!routeMeta) {
          return null;
        }
        if (!routeMeta.companyId || routeMeta.companyId !== input.companyId) {
          return null;
        }
        if (routeMeta.visibility && routeMeta.visibility !== 'company') {
          return null;
        }
        return { ...trip, routeName: routeMeta.routeName };
      })
      .filter((item): item is RawTrip & { routeName: string } => item !== null)
      .sort((a, b) => {
        const aSort = parseIsoToMs(a.lastLocationAt) ?? parseIsoToMs(a.updatedAt) ?? 0;
        const bSort = parseIsoToMs(b.lastLocationAt) ?? parseIsoToMs(b.updatedAt) ?? 0;
        return bSort - aSort;
      })
      .slice(0, pageSize);

    if (candidateTrips.length === 0) {
      return apiOk<ListActiveTripsByCompanyOutput>({ items: [] });
    }

    const uniqueCandidateRouteIds = Array.from(new Set(candidateTrips.map((trip) => trip.routeId)));
    const rtdbPayloadByRouteId = new Map<string, Record<string, unknown> | null>();
    await Promise.all(
      uniqueCandidateRouteIds.map(async (routeId) => {
        try {
          const snap = await rtdb.ref(`locations/${routeId}`).get();
          rtdbPayloadByRouteId.set(routeId, asRecord(snap.val()));
        } catch {
          rtdbPayloadByRouteId.set(routeId, null);
        }
      }),
    );

    const items: ListActiveTripsByCompanyItem[] = candidateTrips.map((trip) => {
      const lastLocationAtMs = parseIsoToMs(trip.lastLocationAt);
      const stale =
        lastLocationAtMs == null || nowMs - lastLocationAtMs > liveOpsOnlineThresholdMs;
      const rtdbPayload = rtdbPayloadByRouteId.get(trip.routeId) ?? null;
      const payloadTripId = pickString(rtdbPayload, 'tripId');
      const payloadLat = pickFiniteNumber(rtdbPayload, 'lat');
      const payloadLng = pickFiniteNumber(rtdbPayload, 'lng');
      const hasRtdbCoordinates =
        payloadTripId === trip.tripId && payloadLat != null && payloadLng != null;

      return {
        tripId: trip.tripId,
        routeId: trip.routeId,
        routeName: trip.routeName,
        driverUid: trip.driverUid,
        driverName: trip.driverName,
        driverPlate: trip.driverPlate,
        status: 'active',
        startedAt: trip.startedAt,
        lastLocationAt: trip.lastLocationAt,
        updatedAt: trip.updatedAt,
        liveState: stale ? 'stale' : 'online',
        live: {
          lat: hasRtdbCoordinates ? payloadLat : null,
          lng: hasRtdbCoordinates ? payloadLng : null,
          source: hasRtdbCoordinates ? 'rtdb' : 'trip_doc',
          stale,
        },
      };
    });

    return apiOk<ListActiveTripsByCompanyOutput>({ items });
  });

  const listCompanyVehicles = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listCompanyVehiclesInputSchema,
      request.data,
    ) as ListCompanyVehiclesInput;

    await requireActiveCompanyMemberRole(input.companyId, auth.uid);

    const vehiclesSnap = await db
      .collection('companies')
      .doc(input.companyId)
      .collection('vehicles')
      .limit(input.limit ?? 50)
      .get();

    const items = vehiclesSnap.docs
      .map((doc) => {
        const data = asRecord(doc.data()) ?? {};
        const yearRaw = data.year;
        const capacityRaw = data.capacity;

        const plate = pickString(data, 'plate');
        if (!plate) {
          return null;
        }

        return {
          vehicleId: doc.id,
          companyId: input.companyId,
          plate,
          status: pickString(data, 'status') ?? 'active',
          brand: pickString(data, 'brand'),
          model: pickString(data, 'model'),
          year: typeof yearRaw === 'number' && Number.isFinite(yearRaw) ? yearRaw : null,
          capacity:
            typeof capacityRaw === 'number' && Number.isFinite(capacityRaw) ? capacityRaw : null,
          updatedAt: pickString(data, 'updatedAt'),
        } satisfies ListCompanyVehiclesItem;
      })
      .filter((item): item is ListCompanyVehiclesItem => item !== null)
      .sort((a, b) => {
        const aTime = parseIsoToMs(a.updatedAt) ?? 0;
        const bTime = parseIsoToMs(b.updatedAt) ?? 0;
        return bTime - aTime;
      });

    return apiOk<ListCompanyVehiclesOutput>({ items });
  });

  return {
    createCompany,
    listMyCompanies,
    listCompanyMembers,
    listCompanyRoutes,
    listCompanyRouteStops,
    listActiveTripsByCompany,
    listCompanyVehicles,
  };
}
