import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { z } from 'zod';

import { apiOk } from './common/api_response.js';
import {
  SRV_CODE_COLLISION_LIMIT_ERROR,
  SRV_CODE_COLLISION_MAX_RETRY,
  generateSrvCodeCandidate,
} from './common/srv_code.js';
import { applyMapMatchingWithGuard } from './ghost_drive/map_matching_guard.js';
import {
  GhostTraceValidationError,
  encodeTracePolyline,
  processGhostTrace,
} from './ghost_drive/trace_processing.js';
import { asRecord } from './common/type_guards.js';
import { requireAuth, requireNonAnonymous } from './middleware/auth_middleware.js';
import { requireDriverProfile } from './middleware/driver_profile_middleware.js';
import { validateInput } from './middleware/input_validation_middleware.js';
import { enforceRateLimit } from './middleware/rate_limit_middleware.js';
import { requireRole } from './middleware/role_middleware.js';

setGlobalOptions({
  region: 'europe-west3',
  timeoutSeconds: 30,
  memory: '256MiB',
});

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const DRIVER_SEARCH_MAX_LIMIT = 10;
const DRIVER_SEARCH_RATE_WINDOW_MS = 60_000;
const DRIVER_SEARCH_RATE_MAX_CALLS = 30;

interface HealthCheckOutput {
  ok: boolean;
  timestamp: number;
  region: string;
}

interface DriverDirectoryResult {
  driverId: string;
  displayName: string;
  plateMasked: string;
}

interface SearchDriverDirectoryOutput {
  results: DriverDirectoryResult[];
}

type WritableRole = 'driver' | 'passenger' | 'guest';

interface BootstrapUserProfileOutput {
  uid: string;
  role: WritableRole;
  createdOrUpdated: boolean;
}

interface UpdateUserProfileOutput {
  uid: string;
  updatedAt: string;
}

interface UpsertConsentOutput {
  uid: string;
  acceptedAt: string;
}

interface UpsertDriverProfileOutput {
  driverId: string;
  updatedAt: string;
}

interface CreateRouteOutput {
  routeId: string;
  srvCode: string;
}

interface UpdateRouteOutput {
  routeId: string;
  updatedAt: string;
}

interface InferredStopOutput {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number;
}

interface CreateRouteFromGhostDriveOutput {
  routeId: string;
  srvCode: string;
  inferredStops: InferredStopOutput[];
}

const profileInputSchema = z.object({
  displayName: z.string().trim().min(2, 'minimum 2 karakter olmalidir.').max(80),
  phone: z.string().trim().min(7).max(24).optional(),
});

const upsertConsentInputSchema = z.object({
  privacyVersion: z.string().trim().min(1).max(32),
  kvkkTextVersion: z.string().trim().min(1).max(32),
  locationConsent: z.boolean(),
  platform: z.enum(['android', 'ios']),
});

const upsertDriverProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24),
  plate: z.string().trim().min(2).max(20),
  showPhoneToPassengers: z.boolean().default(false),
  companyId: z.string().trim().min(1).max(64).nullable().optional(),
});

const createRouteInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  startPoint: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  startAddress: z.string().trim().min(3).max(256),
  endPoint: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  endAddress: z.string().trim().min(3).max(256),
  scheduledTime: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/, 'HH:mm formatinda olmalidir.'),
  timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']),
  allowGuestTracking: z.boolean(),
  authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional().default([]),
});

const updateRouteInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  name: z.string().trim().min(2).max(80).optional(),
  startPoint: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  startAddress: z.string().trim().min(3).max(256).optional(),
  endPoint: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  endAddress: z.string().trim().min(3).max(256).optional(),
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.')
    .optional(),
  timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']).optional(),
  allowGuestTracking: z.boolean().optional(),
  authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional(),
  isArchived: z.boolean().optional(),
  vacationUntil: z.string().datetime().nullable().optional(),
});

const createRouteFromGhostDriveInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tracePoints: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        accuracy: z.number().min(0).max(500),
        sampledAtMs: z.number().int().min(0),
      }),
    )
    .min(2),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
  timeSlot: z.enum(['morning', 'evening', 'midday', 'custom']),
  allowGuestTracking: z.boolean(),
  authorizedDriverIds: z.array(z.string().trim().min(1).max(128)).optional().default([]),
});

const searchDriverDirectoryInputSchema = z.object({
  queryHash: z
    .string()
    .trim()
    .min(8, 'minimum 8 karakter olmalidir.')
    .max(128, 'maksimum 128 karakter olmalidir.')
    .transform((value) => value.toLowerCase()),
  limit: z.number().int().min(1).max(DRIVER_SEARCH_MAX_LIMIT).optional().default(5),
});

function readRole(value: unknown): WritableRole | null {
  if (value === 'driver' || value === 'passenger' || value === 'guest') {
    return value;
  }
  return null;
}

function isAnonymousProvider(token: Record<string, unknown>): boolean {
  const firebaseClaim = asRecord(token.firebase);
  return firebaseClaim?.sign_in_provider === 'anonymous';
}

function pickString(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) {
    return null;
  }
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function pickStringArray(record: Record<string, unknown> | null, key: string): string[] {
  if (!record) {
    return [];
  }
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeAuthorizedDriverIds(rawIds: readonly string[], ownerUid: string): string[] {
  const unique = new Set<string>();
  for (const raw of rawIds) {
    const normalized = raw.trim();
    if (!normalized || normalized === ownerUid) {
      continue;
    }
    unique.add(normalized);
  }
  return Array.from(unique.values());
}

function inferStopsFromTrace(
  tracePoints: readonly { lat: number; lng: number }[],
): InferredStopOutput[] {
  if (tracePoints.length === 0) {
    return [];
  }

  const first = tracePoints[0];
  const last = tracePoints[tracePoints.length - 1];
  if (!first || !last) {
    return [];
  }

  if (tracePoints.length < 5) {
    return [
      { name: 'Baslangic', location: { lat: first.lat, lng: first.lng }, order: 1 },
      { name: 'Bitis', location: { lat: last.lat, lng: last.lng }, order: 2 },
    ];
  }

  const middle = tracePoints[Math.floor(tracePoints.length / 2)] ?? first;
  return [
    { name: 'Baslangic', location: { lat: first.lat, lng: first.lng }, order: 1 },
    { name: 'Ara Durak', location: { lat: middle.lat, lng: middle.lng }, order: 2 },
    { name: 'Bitis', location: { lat: last.lat, lng: last.lng }, order: 3 },
  ];
}

function mapGhostTraceValidationError(error: GhostTraceValidationError): HttpsError {
  return new HttpsError('invalid-argument', `${error.code}: ${error.message}`);
}

async function createRouteWithSrvCode({
  routeData,
  ownerUid,
  createdAtIso,
}: {
  routeData: Record<string, unknown>;
  ownerUid: string;
  createdAtIso: string;
}): Promise<CreateRouteOutput> {
  for (let attempt = 1; attempt <= SRV_CODE_COLLISION_MAX_RETRY; attempt += 1) {
    const srvCode = generateSrvCodeCandidate();
    const routeRef = db.collection('routes').doc();
    const srvCodeRef = db.collection('_srv_codes').doc(srvCode);

    try {
      await db.runTransaction(async (tx) => {
        const srvCodeSnap = await tx.get(srvCodeRef);
        if (srvCodeSnap.exists) {
          throw new Error(SRV_CODE_COLLISION_LIMIT_ERROR);
        }

        tx.set(routeRef, {
          ...routeData,
          srvCode,
        });

        tx.set(srvCodeRef, {
          routeId: routeRef.id,
          createdBy: ownerUid,
          createdAt: createdAtIso,
        });
      });

      return {
        routeId: routeRef.id,
        srvCode,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === SRV_CODE_COLLISION_LIMIT_ERROR &&
        attempt < SRV_CODE_COLLISION_MAX_RETRY
      ) {
        continue;
      }
      if (error instanceof Error && error.message === SRV_CODE_COLLISION_LIMIT_ERROR) {
        throw new HttpsError(
          'resource-exhausted',
          `${SRV_CODE_COLLISION_LIMIT_ERROR}: retry limiti asildi.`,
        );
      }
      throw error;
    }
  }

  throw new HttpsError(
    'resource-exhausted',
    `${SRV_CODE_COLLISION_LIMIT_ERROR}: retry limiti asildi.`,
  );
}

export const healthCheck = onCall(() => {
  return apiOk<HealthCheckOutput>({
    ok: true,
    timestamp: Date.now(),
    region: 'europe-west3',
  });
});

export const bootstrapUserProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  const input = validateInput(profileInputSchema, request.data);

  const nowIso = new Date().toISOString();
  const userRef = db.collection('users').doc(auth.uid);
  const userSnap = await userRef.get();
  const existing = asRecord(userSnap.data());

  const existingRole = readRole(existing?.role);
  const resolvedRole: WritableRole =
    existingRole ?? (isAnonymousProvider(auth.token) ? 'guest' : 'passenger');

  const existingCreatedAt = pickString(existing, 'createdAt');
  const emailClaim = auth.token.email;
  const email = typeof emailClaim === 'string' ? emailClaim : null;

  await userRef.set(
    {
      role: resolvedRole,
      displayName: input.displayName,
      phone: input.phone ?? null,
      email,
      createdAt: existingCreatedAt ?? nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    },
    { merge: true },
  );

  return apiOk<BootstrapUserProfileOutput>({
    uid: auth.uid,
    role: resolvedRole,
    createdOrUpdated: true,
  });
});

export const updateUserProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  const input = validateInput(profileInputSchema, request.data);

  const nowIso = new Date().toISOString();
  const userRef = db.collection('users').doc(auth.uid);
  const userSnap = await userRef.get();
  const existing = asRecord(userSnap.data());

  const existingRole = readRole(existing?.role);
  const resolvedRole: WritableRole =
    existingRole ?? (isAnonymousProvider(auth.token) ? 'guest' : 'passenger');
  const existingCreatedAt = pickString(existing, 'createdAt');
  const existingEmail = pickString(existing, 'email');
  const tokenEmail = auth.token.email;
  const resolvedEmail = existingEmail ?? (typeof tokenEmail === 'string' ? tokenEmail : null);

  await userRef.set(
    {
      role: resolvedRole,
      displayName: input.displayName,
      phone: input.phone ?? pickString(existing, 'phone'),
      email: resolvedEmail,
      createdAt: existingCreatedAt ?? nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    },
    { merge: true },
  );

  return apiOk<UpdateUserProfileOutput>({
    uid: auth.uid,
    updatedAt: nowIso,
  });
});

export const upsertConsent = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  const input = validateInput(upsertConsentInputSchema, request.data);
  const nowIso = new Date().toISOString();

  await db.collection('consents').doc(auth.uid).set(
    {
      privacyVersion: input.privacyVersion,
      kvkkTextVersion: input.kvkkTextVersion,
      locationConsent: input.locationConsent,
      acceptedAt: nowIso,
      platform: input.platform,
    },
    { merge: true },
  );

  return apiOk<UpsertConsentOutput>({
    uid: auth.uid,
    acceptedAt: nowIso,
  });
});

export const upsertDriverProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });

  const input = validateInput(upsertDriverProfileInputSchema, request.data);
  const nowIso = new Date().toISOString();
  const driverRef = db.collection('drivers').doc(auth.uid);
  const driverSnap = await driverRef.get();
  const existing = asRecord(driverSnap.data());

  const existingCreatedAt = pickString(existing, 'createdAt');
  const existingSubscriptionStatus = pickString(existing, 'subscriptionStatus');
  const existingTrialStartDate = pickString(existing, 'trialStartDate');
  const existingTrialEndsAt = pickString(existing, 'trialEndsAt');
  const existingLastPaywallShownAt = pickString(existing, 'lastPaywallShownAt');
  const existingActiveDeviceToken = pickString(existing, 'activeDeviceToken');

  await driverRef.set(
    {
      name: input.name,
      phone: input.phone,
      plate: input.plate,
      showPhoneToPassengers: input.showPhoneToPassengers,
      companyId: input.companyId ?? null,
      subscriptionStatus: existingSubscriptionStatus ?? 'trial',
      trialStartDate: existingTrialStartDate,
      trialEndsAt: existingTrialEndsAt,
      lastPaywallShownAt: existingLastPaywallShownAt,
      activeDeviceToken: existingActiveDeviceToken,
      createdAt: existingCreatedAt ?? nowIso,
      updatedAt: nowIso,
    },
    { merge: true },
  );

  return apiOk<UpsertDriverProfileOutput>({
    driverId: auth.uid,
    updatedAt: nowIso,
  });
});

export const createRoute = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(createRouteInputSchema, request.data);
  const nowIso = new Date().toISOString();
  const authorizedDriverIds = normalizeAuthorizedDriverIds(
    input.authorizedDriverIds ?? [],
    auth.uid,
  );
  const memberIds = Array.from(new Set<string>([auth.uid, ...authorizedDriverIds]));

  const created = await createRouteWithSrvCode({
    ownerUid: auth.uid,
    createdAtIso: nowIso,
    routeData: {
      name: input.name,
      driverId: auth.uid,
      authorizedDriverIds,
      memberIds,
      companyId: null,
      visibility: 'private',
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
    },
  });

  return apiOk<CreateRouteOutput>(created);
});

export const createRouteFromGhostDrive = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(createRouteFromGhostDriveInputSchema, request.data);
  const nowIso = new Date().toISOString();
  const authorizedDriverIds = normalizeAuthorizedDriverIds(
    input.authorizedDriverIds ?? [],
    auth.uid,
  );
  const memberIds = Array.from(new Set<string>([auth.uid, ...authorizedDriverIds]));

  let processedTrace;
  try {
    processedTrace = processGhostTrace(input.tracePoints);
  } catch (error) {
    if (error instanceof GhostTraceValidationError) {
      throw mapGhostTraceValidationError(error);
    }
    throw error;
  }

  const mapMatched = await applyMapMatchingWithGuard({
    db,
    tracePoints: processedTrace.simplifiedTrace,
  });
  const finalTrace = mapMatched.tracePoints;
  const finalPolyline = encodeTracePolyline(finalTrace);
  const inferredStops = inferStopsFromTrace(finalTrace);

  const firstPoint = finalTrace[0];
  const lastPoint = finalTrace[finalTrace.length - 1];
  if (!firstPoint || !lastPoint) {
    throw new HttpsError('failed-precondition', 'Ghost trace route uretimi icin yetersiz.');
  }

  const created = await createRouteWithSrvCode({
    ownerUid: auth.uid,
    createdAtIso: nowIso,
    routeData: {
      name: input.name,
      driverId: auth.uid,
      authorizedDriverIds,
      memberIds,
      companyId: null,
      visibility: 'private',
      allowGuestTracking: input.allowGuestTracking,
      creationMode: 'ghost_drive',
      routePolyline: finalPolyline,
      startPoint: {
        lat: firstPoint.lat,
        lng: firstPoint.lng,
      },
      startAddress: 'Ghost Baslangic',
      endPoint: {
        lat: lastPoint.lat,
        lng: lastPoint.lng,
      },
      endAddress: 'Ghost Bitis',
      scheduledTime: input.scheduledTime,
      timeSlot: input.timeSlot,
      isArchived: false,
      vacationUntil: null,
      passengerCount: 0,
      lastTripStartedNotificationAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      ghostTraceMeta: {
        sanitizedCount: processedTrace.sanitizedTrace.length,
        simplifiedCount: processedTrace.simplifiedTrace.length,
        finalCount: finalTrace.length,
        mapMatchingFallbackUsed: mapMatched.fallbackUsed,
        mapMatchingSource: mapMatched.source,
        mapMatchingConfidence: mapMatched.confidence,
      },
    },
  });

  return apiOk<CreateRouteFromGhostDriveOutput>({
    routeId: created.routeId,
    srvCode: created.srvCode,
    inferredStops,
  });
});

export const updateRoute = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(updateRouteInputSchema, request.data);
  const nowIso = new Date().toISOString();
  const routeRef = db.collection('routes').doc(input.routeId);
  const routeSnap = await routeRef.get();

  if (!routeSnap.exists) {
    throw new HttpsError('not-found', 'Route bulunamadi.');
  }

  const routeData = asRecord(routeSnap.data());
  const routeOwnerUid = pickString(routeData, 'driverId');
  if (routeOwnerUid !== auth.uid) {
    throw new HttpsError('permission-denied', 'Bu route icin guncelleme yetkin yok.');
  }

  const updatePayload: Record<string, unknown> = {
    updatedAt: nowIso,
  };

  if (input.name != null) {
    updatePayload['name'] = input.name;
  }
  if (input.startPoint != null) {
    updatePayload['startPoint'] = input.startPoint;
  }
  if (input.startAddress != null) {
    updatePayload['startAddress'] = input.startAddress;
  }
  if (input.endPoint != null) {
    updatePayload['endPoint'] = input.endPoint;
  }
  if (input.endAddress != null) {
    updatePayload['endAddress'] = input.endAddress;
  }
  if (input.scheduledTime != null) {
    updatePayload['scheduledTime'] = input.scheduledTime;
  }
  if (input.timeSlot != null) {
    updatePayload['timeSlot'] = input.timeSlot;
  }
  if (input.allowGuestTracking != null) {
    updatePayload['allowGuestTracking'] = input.allowGuestTracking;
  }
  if (input.isArchived != null) {
    updatePayload['isArchived'] = input.isArchived;
  }
  if (input.vacationUntil !== undefined) {
    updatePayload['vacationUntil'] = input.vacationUntil;
  }

  if (input.authorizedDriverIds != null) {
    const existingAuthorized = pickStringArray(routeData, 'authorizedDriverIds');
    const existingMemberIds = pickStringArray(routeData, 'memberIds');
    const passengerMembers = existingMemberIds.filter(
      (memberUid) => memberUid !== auth.uid && !existingAuthorized.includes(memberUid),
    );
    const newAuthorizedDriverIds = normalizeAuthorizedDriverIds(
      input.authorizedDriverIds,
      auth.uid,
    );
    const newMemberIds = Array.from(
      new Set<string>([auth.uid, ...newAuthorizedDriverIds, ...passengerMembers]),
    );

    updatePayload['authorizedDriverIds'] = newAuthorizedDriverIds;
    updatePayload['memberIds'] = newMemberIds;
  }

  await routeRef.update(updatePayload);

  return apiOk<UpdateRouteOutput>({
    routeId: input.routeId,
    updatedAt: nowIso,
  });
});

export const searchDriverDirectory = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  const input = validateInput(searchDriverDirectoryInputSchema, request.data);
  const limit = input.limit ?? 5;

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);
  await enforceRateLimit({
    db,
    key: `driver_directory_${auth.uid}`,
    windowMs: DRIVER_SEARCH_RATE_WINDOW_MS,
    maxCalls: DRIVER_SEARCH_RATE_MAX_CALLS,
    exceededMessage: 'Arama limiti asildi. Lutfen daha sonra tekrar dene.',
  });

  const [phoneSnap, plateSnap] = await Promise.all([
    db
      .collection('driver_directory')
      .where('searchPhoneHash', '==', input.queryHash)
      .limit(limit)
      .get(),
    db
      .collection('driver_directory')
      .where('searchPlateHash', '==', input.queryHash)
      .limit(limit)
      .get(),
  ]);

  const merged = new Map<string, DriverDirectoryResult>();
  const docs = [...phoneSnap.docs, ...plateSnap.docs];

  for (const doc of docs) {
    if (merged.size >= limit) {
      break;
    }

    const data = asRecord(doc.data());
    if (!data || data.isActive !== true) {
      continue;
    }

    if (typeof data.displayName !== 'string' || typeof data.plateMasked !== 'string') {
      continue;
    }

    if (!merged.has(doc.id)) {
      merged.set(doc.id, {
        driverId: doc.id,
        displayName: data.displayName,
        plateMasked: data.plateMasked,
      });
    }
  }

  return apiOk<SearchDriverDirectoryOutput>({
    results: Array.from(merged.values()),
  });
});
