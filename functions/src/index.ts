import { getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { onValueWritten } from 'firebase-functions/v2/database';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
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
const rtdb = getDatabase();

const DRIVER_SEARCH_MAX_LIMIT = 10;
const DRIVER_SEARCH_RATE_WINDOW_MS = 60_000;
const DRIVER_SEARCH_RATE_MAX_CALLS = 30;
const GUEST_SESSION_TTL_MINUTES_DEFAULT = 30;
const TRIP_REQUEST_TTL_DAYS = 7;
const TRIP_STARTED_NOTIFICATION_COOLDOWN_MS = 15 * 60 * 1000;

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

interface UpsertStopOutput {
  routeId: string;
  stopId: string;
  updatedAt: string;
}

interface DeleteStopOutput {
  routeId: string;
  stopId: string;
  deleted: boolean;
}

interface JoinRouteBySrvCodeOutput {
  routeId: string;
  routeName: string;
  role: 'passenger';
}

interface LeaveRouteOutput {
  routeId: string;
  left: boolean;
}

interface RegisterDeviceOutput {
  activeDeviceId: string;
  previousDeviceRevoked: boolean;
  updatedAt: string;
}

interface UpdatePassengerSettingsOutput {
  routeId: string;
  updatedAt: string;
}

interface SubmitSkipTodayOutput {
  routeId: string;
  dateKey: string;
  status: 'skip_today';
}

interface CreateGuestSessionOutput {
  sessionId: string;
  routeId: string;
  expiresAt: string;
  rtdbReadPath: string;
}

interface StartTripOutput {
  tripId: string;
  status: 'active';
  transitionVersion: number;
}

interface FinishTripOutput {
  tripId: string;
  status: 'completed' | 'abandoned';
  endedAt: string;
  transitionVersion: number;
}

interface SendDriverAnnouncementOutput {
  announcementId: string;
  fcmCount: number;
  shareUrl: string;
}

type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'mock';

interface SubscriptionProductOutput {
  id: string;
  price: string;
}

interface GetSubscriptionStateOutput {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  products: SubscriptionProductOutput[];
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

const upsertStopInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  stopId: z.string().trim().min(1).max(128).optional(),
  name: z.string().trim().min(2).max(80),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  order: z.number().int().min(0).max(500),
});

const deleteStopInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  stopId: z.string().trim().min(1).max(128),
});

const joinRouteBySrvCodeInputSchema = z.object({
  srvCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24).optional(),
  showPhoneToDriver: z.boolean(),
  boardingArea: z.string().trim().min(1).max(120),
  notificationTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
});

const leaveRouteInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
});

const registerDeviceInputSchema = z.object({
  deviceId: z.string().trim().min(3).max(128),
  activeDeviceToken: z.string().trim().min(8).max(1024),
  lastSeenAt: z.string().datetime().optional(),
});

const updatePassengerSettingsInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  showPhoneToDriver: z.boolean(),
  phone: z.string().trim().min(7).max(24).optional(),
  boardingArea: z.string().trim().min(1).max(120),
  virtualStop: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  virtualStopLabel: z.string().trim().min(1).max(120).optional(),
  notificationTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm formatinda olmalidir.'),
});

const submitSkipTodayInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  idempotencyKey: z.string().trim().min(8).max(128),
});

const createGuestSessionInputSchema = z.object({
  srvCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/),
  ttlMinutes: z.number().int().min(5).max(60).optional(),
});

const startTripInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  deviceId: z.string().trim().min(3).max(128),
  idempotencyKey: z.string().trim().min(8).max(128),
  expectedTransitionVersion: z.number().int().min(0),
});

const finishTripInputSchema = z.object({
  tripId: z.string().trim().min(1).max(128),
  deviceId: z.string().trim().min(3).max(128),
  idempotencyKey: z.string().trim().min(8).max(128),
  expectedTransitionVersion: z.number().int().min(0),
});

const sendDriverAnnouncementInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  templateKey: z.string().trim().min(1).max(64),
  customText: z.string().trim().min(1).max(240).optional(),
  idempotencyKey: z.string().trim().min(8).max(128),
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

function pickGeoPoint(
  record: Record<string, unknown> | null,
  key: string,
): { lat: number; lng: number } | null {
  if (!record) {
    return null;
  }
  const value = asRecord(record[key]);
  if (!value) {
    return null;
  }
  const lat = value['lat'];
  const lng = value['lng'];
  if (typeof lat !== 'number' || !Number.isFinite(lat)) {
    return null;
  }
  if (typeof lng !== 'number' || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
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

function buildIstanbulDateKey(when: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(when);
}

function readTransitionVersion(record: Record<string, unknown> | null): number {
  const rawValue = record?.transitionVersion;
  if (typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue >= 0) {
    return rawValue;
  }
  return 0;
}

function parseTripIdFromResultRef(resultRef: string | null): string | null {
  if (!resultRef) {
    return null;
  }
  const prefix = 'trips/';
  if (!resultRef.startsWith(prefix)) {
    return null;
  }
  const tripId = resultRef.slice(prefix.length).trim();
  return tripId.length > 0 ? tripId : null;
}

function parseIsoToMs(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameStringArray(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function readSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (value === 'active' || value === 'expired' || value === 'mock' || value === 'trial') {
    return value;
  }
  return 'mock';
}

function resolveEffectiveSubscriptionStatus(
  status: SubscriptionStatus,
  trialEndsAt: string | null,
  nowMs: number,
): SubscriptionStatus {
  if (status !== 'trial') {
    return status;
  }
  const trialEndsAtMs = parseIsoToMs(trialEndsAt);
  if (trialEndsAtMs != null && trialEndsAtMs <= nowMs) {
    return 'expired';
  }
  return 'trial';
}

async function resolveDriverSubscriptionState(uid: string): Promise<GetSubscriptionStateOutput> {
  const nowMs = Date.now();
  const driverSnap = await db.collection('drivers').doc(uid).get();
  const driverData = asRecord(driverSnap.data());

  const rawStatus = readSubscriptionStatus(driverData?.subscriptionStatus);
  const trialEndsAt = pickString(driverData, 'trialEndsAt');
  const effectiveStatus = resolveEffectiveSubscriptionStatus(rawStatus, trialEndsAt, nowMs);

  const output: GetSubscriptionStateOutput = {
    subscriptionStatus: effectiveStatus,
    products: [],
  };
  if (trialEndsAt) {
    output.trialEndsAt = trialEndsAt;
  }
  return output;
}

async function requirePremiumEntitlement(uid: string, feature: string): Promise<void> {
  const state = await resolveDriverSubscriptionState(uid);
  if (state.subscriptionStatus === 'active' || state.subscriptionStatus === 'trial') {
    return;
  }
  throw new HttpsError(
    'permission-denied',
    `${feature} icin premium entitlement gerekli. subscriptionStatus=${state.subscriptionStatus}`,
  );
}

async function requireOwnedRoute(
  routeId: string,
  ownerUid: string,
): Promise<Record<string, unknown>> {
  const routeSnap = await db.collection('routes').doc(routeId).get();
  if (!routeSnap.exists) {
    throw new HttpsError('not-found', 'Route bulunamadi.');
  }

  const routeData = asRecord(routeSnap.data());
  const routeOwnerUid = pickString(routeData, 'driverId');
  if (routeOwnerUid !== ownerUid) {
    throw new HttpsError('permission-denied', 'Bu route icin yetkin yok.');
  }

  return routeData ?? {};
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

export const registerDevice = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(registerDeviceInputSchema, request.data);
  const nowIso = new Date().toISOString();
  const driverRef = db.collection('drivers').doc(auth.uid);
  const currentDeviceRef = driverRef.collection('devices').doc(input.deviceId);
  let previousDeviceRevoked = false;

  await db.runTransaction(async (tx) => {
    const driverSnap = await tx.get(driverRef);
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Driver profile bulunamadi.');
    }

    const driverData = asRecord(driverSnap.data()) ?? {};
    const previousDeviceId = pickString(driverData, 'activeDeviceId');
    previousDeviceRevoked = previousDeviceId != null && previousDeviceId !== input.deviceId;

    if (previousDeviceRevoked && previousDeviceId != null) {
      const previousDeviceRef = driverRef.collection('devices').doc(previousDeviceId);
      tx.set(
        previousDeviceRef,
        {
          isActive: false,
          revokedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );

      const switchAuditRef = db.collection('_audit_device_switches').doc();
      tx.set(switchAuditRef, {
        uid: auth.uid,
        previousDeviceId,
        nextDeviceId: input.deviceId,
        createdAt: nowIso,
        notificationStatus: 'pending',
      });

      const notificationOutboxRef = db.collection('_notification_outbox').doc();
      tx.set(notificationOutboxRef, {
        type: 'device_switch_notice',
        uid: auth.uid,
        previousDeviceId,
        nextDeviceId: input.deviceId,
        targetToken: pickString(driverData, 'activeDeviceToken'),
        status: 'pending',
        createdAt: nowIso,
      });
    }

    const currentDeviceSnap = await tx.get(currentDeviceRef);
    const currentDeviceData = asRecord(currentDeviceSnap.data());
    const firstSeenAt = pickString(currentDeviceData, 'firstSeenAt') ?? nowIso;

    tx.set(
      currentDeviceRef,
      {
        deviceId: input.deviceId,
        token: input.activeDeviceToken,
        isActive: true,
        firstSeenAt,
        lastSeenAt: nowIso,
        clientLastSeenAt: input.lastSeenAt ?? null,
        revokedAt: null,
        updatedAt: nowIso,
      },
      { merge: true },
    );

    tx.set(
      driverRef,
      {
        activeDeviceId: input.deviceId,
        activeDeviceToken: input.activeDeviceToken,
        lastSeenAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
  });

  return apiOk<RegisterDeviceOutput>({
    activeDeviceId: input.deviceId,
    previousDeviceRevoked,
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
  const routeData = await requireOwnedRoute(input.routeId, auth.uid);

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

export const upsertStop = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(upsertStopInputSchema, request.data);
  await requireOwnedRoute(input.routeId, auth.uid);

  const nowIso = new Date().toISOString();
  const stopRef = input.stopId
    ? db.collection('routes').doc(input.routeId).collection('stops').doc(input.stopId)
    : db.collection('routes').doc(input.routeId).collection('stops').doc();
  const stopSnap = await stopRef.get();
  const existing = asRecord(stopSnap.data());
  const existingCreatedAt = pickString(existing, 'createdAt');

  await stopRef.set(
    {
      name: input.name,
      location: input.location,
      order: input.order,
      createdAt: existingCreatedAt ?? nowIso,
      updatedAt: nowIso,
    },
    { merge: true },
  );

  return apiOk<UpsertStopOutput>({
    routeId: input.routeId,
    stopId: stopRef.id,
    updatedAt: nowIso,
  });
});

export const deleteStop = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(deleteStopInputSchema, request.data);
  await requireOwnedRoute(input.routeId, auth.uid);

  await db.collection('routes').doc(input.routeId).collection('stops').doc(input.stopId).delete();

  return apiOk<DeleteStopOutput>({
    routeId: input.routeId,
    stopId: input.stopId,
    deleted: true,
  });
});

export const joinRouteBySrvCode = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['passenger'],
  });

  const input = validateInput(joinRouteBySrvCodeInputSchema, request.data);
  const routeQuery = await db
    .collection('routes')
    .where('srvCode', '==', input.srvCode)
    .where('isArchived', '==', false)
    .limit(1)
    .get();

  if (routeQuery.empty) {
    throw new HttpsError('not-found', 'SRV kodu ile route bulunamadi.');
  }

  const routeDoc = routeQuery.docs[0];
  if (!routeDoc) {
    throw new HttpsError('not-found', 'Route bulunamadi.');
  }
  const routeData = asRecord(routeDoc.data());
  const routeDriverUid = pickString(routeData, 'driverId');
  if (routeDriverUid === auth.uid) {
    throw new HttpsError('permission-denied', "Route sahibi kendi route'a katilamaz.");
  }
  const routeName = pickString(routeData, 'name') ?? '';

  const routeRef = db.collection('routes').doc(routeDoc.id);
  const passengerRef = routeRef.collection('passengers').doc(auth.uid);
  const nowIso = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    const routeSnap = await tx.get(routeRef);
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }

    const currentRoute = asRecord(routeSnap.data()) ?? {};
    const currentRouteDriverUid = pickString(currentRoute, 'driverId');
    if (currentRouteDriverUid === auth.uid) {
      throw new HttpsError('permission-denied', "Route sahibi kendi route'a katilamaz.");
    }
    if (currentRoute.isArchived === true) {
      throw new HttpsError('failed-precondition', "Arsivlenmis route'a katilim kapali.");
    }

    const passengerSnap = await tx.get(passengerRef);
    const existingPassenger = asRecord(passengerSnap.data());
    const hasPassengerRecord = passengerSnap.exists;
    const currentMembers = pickStringArray(currentRoute, 'memberIds');
    const isMember = currentMembers.includes(auth.uid);
    const nextMembers = isMember
      ? currentMembers
      : Array.from(new Set<string>([...currentMembers, auth.uid]));

    const currentPassengerCountRaw = currentRoute.passengerCount;
    const currentPassengerCount =
      typeof currentPassengerCountRaw === 'number' && Number.isFinite(currentPassengerCountRaw)
        ? currentPassengerCountRaw
        : 0;

    tx.update(routeRef, {
      memberIds: nextMembers,
      passengerCount: hasPassengerRecord ? currentPassengerCount : currentPassengerCount + 1,
      updatedAt: nowIso,
    });

    tx.set(
      passengerRef,
      {
        name: input.name,
        phone: input.phone ?? null,
        showPhoneToDriver: input.showPhoneToDriver,
        boardingArea: input.boardingArea,
        virtualStop: null,
        virtualStopLabel: null,
        notificationTime: input.notificationTime,
        joinedAt: pickString(existingPassenger, 'joinedAt') ?? nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
  });

  return apiOk<JoinRouteBySrvCodeOutput>({
    routeId: routeDoc.id,
    routeName,
    role: 'passenger',
  });
});

export const leaveRoute = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['passenger'],
  });

  const input = validateInput(leaveRouteInputSchema, request.data);
  const routeRef = db.collection('routes').doc(input.routeId);
  const passengerRef = routeRef.collection('passengers').doc(auth.uid);
  const nowIso = new Date().toISOString();
  let left = false;

  await db.runTransaction(async (tx) => {
    const routeSnap = await tx.get(routeRef);
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }

    const routeData = asRecord(routeSnap.data()) ?? {};
    const routeDriverUid = pickString(routeData, 'driverId');
    if (routeDriverUid === auth.uid) {
      throw new HttpsError('permission-denied', 'Route sahibi leaveRoute kullanamaz.');
    }
    const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
    if (authorizedDriverIds.includes(auth.uid)) {
      throw new HttpsError(
        'permission-denied',
        'Yetkili sofor leaveRoute kullanamaz; route sahibi cikarmalidir.',
      );
    }

    const passengerSnap = await tx.get(passengerRef);
    const hasPassengerRecord = passengerSnap.exists;
    const memberIds = pickStringArray(routeData, 'memberIds');
    const nextMembers = hasPassengerRecord
      ? memberIds.filter((memberUid) => memberUid !== auth.uid)
      : memberIds;

    const currentPassengerCountRaw = routeData.passengerCount;
    const currentPassengerCount =
      typeof currentPassengerCountRaw === 'number' && Number.isFinite(currentPassengerCountRaw)
        ? currentPassengerCountRaw
        : 0;
    const nextPassengerCount = hasPassengerRecord
      ? Math.max(0, currentPassengerCount - 1)
      : currentPassengerCount;

    if (hasPassengerRecord) {
      tx.update(routeRef, {
        memberIds: nextMembers,
        passengerCount: nextPassengerCount,
        updatedAt: nowIso,
      });
    }

    tx.delete(passengerRef);
    left = hasPassengerRecord;
  });

  return apiOk<LeaveRouteOutput>({
    routeId: input.routeId,
    left,
  });
});

export const updatePassengerSettings = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['passenger'],
  });

  const input = validateInput(updatePassengerSettingsInputSchema, request.data);
  const routeRef = db.collection('routes').doc(input.routeId);
  const passengerRef = routeRef.collection('passengers').doc(auth.uid);
  const nowIso = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    const routeSnap = await tx.get(routeRef);
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }

    const routeData = asRecord(routeSnap.data()) ?? {};
    if (pickString(routeData, 'driverId') === auth.uid) {
      throw new HttpsError('permission-denied', 'Route sahibi passenger ayari guncelleyemez.');
    }
    if (routeData.isArchived === true) {
      throw new HttpsError('failed-precondition', 'Arsivlenmis route icin ayar guncellenemez.');
    }

    const passengerSnap = await tx.get(passengerRef);
    if (!passengerSnap.exists) {
      throw new HttpsError('not-found', 'Passenger kaydi bulunamadi.');
    }
    const passengerData = asRecord(passengerSnap.data()) ?? {};

    const memberIds = pickStringArray(routeData, 'memberIds');
    const isMember = memberIds.includes(auth.uid);
    const nextMembers = isMember
      ? memberIds
      : Array.from(new Set<string>([...memberIds, auth.uid]));

    const currentPassengerCountRaw = routeData.passengerCount;
    const currentPassengerCount =
      typeof currentPassengerCountRaw === 'number' && Number.isFinite(currentPassengerCountRaw)
        ? currentPassengerCountRaw
        : 0;
    const nextPassengerCount = isMember ? currentPassengerCount : currentPassengerCount + 1;

    tx.set(
      passengerRef,
      {
        showPhoneToDriver: input.showPhoneToDriver,
        phone: input.phone ?? pickString(passengerData, 'phone') ?? null,
        boardingArea: input.boardingArea,
        virtualStop: input.virtualStop ?? pickGeoPoint(passengerData, 'virtualStop'),
        virtualStopLabel: input.virtualStopLabel ?? pickString(passengerData, 'virtualStopLabel'),
        notificationTime: input.notificationTime,
        updatedAt: nowIso,
      },
      { merge: true },
    );

    if (!isMember) {
      tx.update(routeRef, {
        memberIds: nextMembers,
        passengerCount: nextPassengerCount,
        updatedAt: nowIso,
      });
    }
  });

  return apiOk<UpdatePassengerSettingsOutput>({
    routeId: input.routeId,
    updatedAt: nowIso,
  });
});

export const submitSkipToday = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['passenger'],
  });

  const input = validateInput(submitSkipTodayInputSchema, request.data);
  const routeRef = db.collection('routes').doc(input.routeId);
  const passengerRef = routeRef.collection('passengers').doc(auth.uid);
  const skipRequestRef = routeRef.collection('skip_requests').doc(`${auth.uid}_${input.dateKey}`);
  const now = new Date();
  const nowIso = now.toISOString();
  const todayKey = buildIstanbulDateKey(now);

  if (input.dateKey !== todayKey) {
    throw new HttpsError(
      'failed-precondition',
      `submitSkipToday sadece bugun icin kabul edilir. beklenenDateKey=${todayKey}`,
    );
  }

  await db.runTransaction(async (tx) => {
    const routeSnap = await tx.get(routeRef);
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }
    const routeData = asRecord(routeSnap.data()) ?? {};
    if (routeData.isArchived === true) {
      throw new HttpsError('failed-precondition', 'Arsivlenmis route icin skip kaydi acilamaz.');
    }

    const passengerSnap = await tx.get(passengerRef);
    if (!passengerSnap.exists) {
      throw new HttpsError('permission-denied', 'Bu route icin passenger kaydin bulunmuyor.');
    }

    const skipRequestSnap = await tx.get(skipRequestRef);
    const existingSkipRequest = asRecord(skipRequestSnap.data());
    const existingCreatedAt = pickString(existingSkipRequest, 'createdAt');

    tx.set(
      skipRequestRef,
      {
        passengerId: auth.uid,
        dateKey: input.dateKey,
        status: 'skip_today',
        idempotencyKey: input.idempotencyKey,
        createdAt: existingCreatedAt ?? nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
  });

  return apiOk<SubmitSkipTodayOutput>({
    routeId: input.routeId,
    dateKey: input.dateKey,
    status: 'skip_today',
  });
});

export const createGuestSession = onCall(async (request) => {
  const auth = requireAuth(request);
  const input = validateInput(createGuestSessionInputSchema, request.data);

  const routeQuery = await db
    .collection('routes')
    .where('srvCode', '==', input.srvCode)
    .where('isArchived', '==', false)
    .limit(1)
    .get();

  if (routeQuery.empty) {
    throw new HttpsError('not-found', 'SRV kodu ile route bulunamadi.');
  }

  const routeDoc = routeQuery.docs[0];
  if (!routeDoc) {
    throw new HttpsError('not-found', 'Route bulunamadi.');
  }
  const routeData = asRecord(routeDoc.data()) ?? {};
  if (routeData.allowGuestTracking !== true) {
    throw new HttpsError('permission-denied', 'Bu route icin misafir takip kapali.');
  }

  const now = Date.now();
  const ttlMinutes = input.ttlMinutes ?? GUEST_SESSION_TTL_MINUTES_DEFAULT;
  const expiresAtMs = now + ttlMinutes * 60_000;
  const nowIso = new Date(now).toISOString();
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  const sessionRef = db.collection('guest_sessions').doc();
  const userRef = db.collection('users').doc(auth.uid);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const existingUser = asRecord(userSnap.data());
    const existingRole = readRole(existingUser?.role);
    const existingCreatedAt = pickString(existingUser, 'createdAt');
    const existingDisplayName = pickString(existingUser, 'displayName');
    const existingPhone = pickString(existingUser, 'phone');
    const existingEmail = pickString(existingUser, 'email');

    if (!userSnap.exists || existingRole == null) {
      tx.set(
        userRef,
        {
          role: 'guest',
          displayName: existingDisplayName ?? 'Misafir',
          phone: existingPhone,
          email: existingEmail,
          createdAt: existingCreatedAt ?? nowIso,
          updatedAt: nowIso,
          deletedAt: null,
        },
        { merge: true },
      );
    }

    tx.set(sessionRef, {
      routeId: routeDoc.id,
      guestUid: auth.uid,
      expiresAt: expiresAtIso,
      status: 'active',
      createdAt: nowIso,
    });
  });

  try {
    await rtdb.ref(`guestReaders/${routeDoc.id}/${auth.uid}`).set({
      active: true,
      expiresAtMs,
      updatedAtMs: now,
    });
  } catch {
    await sessionRef.set(
      {
        status: 'revoked',
        revokedAt: nowIso,
        revokeReason: 'RTDB_WRITE_FAILED',
      },
      { merge: true },
    );
    throw new HttpsError('internal', 'Guest reader erisimi acilamadi.');
  }

  return apiOk<CreateGuestSessionOutput>({
    sessionId: sessionRef.id,
    routeId: routeDoc.id,
    expiresAt: expiresAtIso,
    rtdbReadPath: `/locations/${routeDoc.id}`,
  });
});

export const startTrip = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(startTripInputSchema, request.data);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const requestExpiresAtIso = new Date(
    now + TRIP_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const routeRef = db.collection('routes').doc(input.routeId);
  const driverRef = db.collection('drivers').doc(auth.uid);
  const requestRef = db.collection('trip_requests').doc(`${auth.uid}_${input.idempotencyKey}`);
  const activeTripQuery = db
    .collection('trips')
    .where('routeId', '==', input.routeId)
    .where('status', '==', 'active')
    .limit(1);

  let output: StartTripOutput | null = null;

  await db.runTransaction(async (tx) => {
    const routeSnap = await tx.get(routeRef);
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }
    const routeData = asRecord(routeSnap.data()) ?? {};
    if (routeData.isArchived === true) {
      throw new HttpsError('failed-precondition', 'Arsivlenmis route icin trip baslatilamaz.');
    }

    const routeOwnerUid = pickString(routeData, 'driverId');
    const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
    const canStartTrip = routeOwnerUid === auth.uid || authorizedDriverIds.includes(auth.uid);
    if (!canStartTrip) {
      throw new HttpsError('permission-denied', 'Bu route icin startTrip yetkin yok.');
    }

    const requestSnap = await tx.get(requestRef);
    if (requestSnap.exists) {
      const requestData = asRecord(requestSnap.data());
      if (pickString(requestData, 'requestType') !== 'start_trip') {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency key farkli islem tipiyle kullanildi.',
        );
      }

      const existingTripId = parseTripIdFromResultRef(pickString(requestData, 'resultRef'));
      if (!existingTripId) {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency kaydi gecersiz resultRef iceriyor.',
        );
      }

      const existingTripRef = db.collection('trips').doc(existingTripId);
      const existingTripSnap = await tx.get(existingTripRef);
      if (!existingTripSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency kaydi ilgili trip dokumanini bulamadi.',
        );
      }

      const existingTripData = asRecord(existingTripSnap.data()) ?? {};
      const existingStatus = pickString(existingTripData, 'status');
      if (existingStatus !== 'active') {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency kaydi aktif olmayan trip durumuna isaret ediyor.',
        );
      }

      output = {
        tripId: existingTripRef.id,
        status: 'active',
        transitionVersion: readTransitionVersion(existingTripData),
      };
      return;
    }

    const activeTripSnap = await tx.get(activeTripQuery);
    const activeTripDoc = activeTripSnap.docs[0];
    const activeTripData = asRecord(activeTripDoc?.data());
    const currentTransitionVersion = readTransitionVersion(activeTripData);

    if (input.expectedTransitionVersion !== currentTransitionVersion) {
      throw new HttpsError(
        'failed-precondition',
        `TRANSITION_VERSION_MISMATCH: expected=${input.expectedTransitionVersion}, actual=${currentTransitionVersion}`,
      );
    }

    if (activeTripDoc) {
      const activeTripDriverUid = pickString(activeTripData, 'driverId');
      const activeTripDeviceId = pickString(activeTripData, 'startedByDeviceId');
      if (activeTripDriverUid !== auth.uid || activeTripDeviceId !== input.deviceId) {
        throw new HttpsError('failed-precondition', 'Route icin zaten aktif bir trip var.');
      }

      tx.set(requestRef, {
        requestType: 'start_trip',
        uid: auth.uid,
        resultRef: `trips/${activeTripDoc.id}`,
        createdAt: nowIso,
        expiresAt: requestExpiresAtIso,
      });

      output = {
        tripId: activeTripDoc.id,
        status: 'active',
        transitionVersion: currentTransitionVersion,
      };
      return;
    }

    const driverSnap = await tx.get(driverRef);
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Driver profile bulunamadi.');
    }
    const driverData = asRecord(driverSnap.data()) ?? {};
    const showPhoneToPassengers = driverData.showPhoneToPassengers === true;
    const snapshotPhone = showPhoneToPassengers ? pickString(driverData, 'phone') : null;

    const tripRef = db.collection('trips').doc();
    const transitionVersion = currentTransitionVersion + 1;

    tx.set(tripRef, {
      routeId: input.routeId,
      driverId: auth.uid,
      driverSnapshot: {
        name: pickString(driverData, 'name') ?? '',
        plate: pickString(driverData, 'plate') ?? '',
        phone: snapshotPhone,
      },
      status: 'active',
      startedAt: nowIso,
      endedAt: null,
      lastLocationAt: nowIso,
      endReason: null,
      startedByDeviceId: input.deviceId,
      transitionVersion,
      updatedAt: nowIso,
    });

    tx.set(requestRef, {
      requestType: 'start_trip',
      uid: auth.uid,
      resultRef: `trips/${tripRef.id}`,
      createdAt: nowIso,
      expiresAt: requestExpiresAtIso,
    });

    const lastTripStartedNotificationAt = pickString(routeData, 'lastTripStartedNotificationAt');
    const lastTripStartedNotificationAtMs = parseIsoToMs(lastTripStartedNotificationAt);
    const shouldRefreshTripStartedNotification =
      lastTripStartedNotificationAtMs == null ||
      now - lastTripStartedNotificationAtMs >= TRIP_STARTED_NOTIFICATION_COOLDOWN_MS;

    tx.update(routeRef, {
      updatedAt: nowIso,
      lastTripStartedNotificationAt: shouldRefreshTripStartedNotification
        ? nowIso
        : lastTripStartedNotificationAt,
    });

    output = {
      tripId: tripRef.id,
      status: 'active',
      transitionVersion,
    };
  });

  if (!output) {
    throw new HttpsError('internal', 'startTrip sonucu hesaplanamadi.');
  }

  await rtdb.ref(`routeWriters/${input.routeId}/${auth.uid}`).set(true);

  return apiOk<StartTripOutput>(output);
});

export const finishTrip = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);

  const input = validateInput(finishTripInputSchema, request.data);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const requestExpiresAtIso = new Date(
    now + TRIP_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const tripRef = db.collection('trips').doc(input.tripId);
  const requestRef = db.collection('trip_requests').doc(`${auth.uid}_${input.idempotencyKey}`);

  let output: FinishTripOutput | null = null;
  let routeIdForWriterRevoke: string | null = null;

  await db.runTransaction(async (tx) => {
    const tripSnap = await tx.get(tripRef);
    if (!tripSnap.exists) {
      throw new HttpsError('not-found', 'Trip bulunamadi.');
    }

    const tripData = asRecord(tripSnap.data()) ?? {};
    const tripDriverUid = pickString(tripData, 'driverId');
    if (tripDriverUid !== auth.uid) {
      throw new HttpsError('permission-denied', 'Bu trip icin finishTrip yetkin yok.');
    }

    const routeId = pickString(tripData, 'routeId');
    if (!routeId) {
      throw new HttpsError('failed-precondition', 'Trip routeId alani gecersiz.');
    }
    routeIdForWriterRevoke = routeId;

    const requestSnap = await tx.get(requestRef);
    if (requestSnap.exists) {
      const requestData = asRecord(requestSnap.data());
      if (pickString(requestData, 'requestType') !== 'finish_trip') {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency key farkli islem tipiyle kullanildi.',
        );
      }

      const existingTripId = parseTripIdFromResultRef(pickString(requestData, 'resultRef'));
      if (!existingTripId) {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency kaydi gecersiz resultRef iceriyor.',
        );
      }

      const existingTripRef = db.collection('trips').doc(existingTripId);
      const existingTripSnap = await tx.get(existingTripRef);
      if (!existingTripSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency kaydi ilgili trip dokumanini bulamadi.',
        );
      }

      const existingTripData = asRecord(existingTripSnap.data()) ?? {};
      const existingStatus = pickString(existingTripData, 'status');
      const existingEndedAt = pickString(existingTripData, 'endedAt');
      if (
        (existingStatus !== 'completed' && existingStatus !== 'abandoned') ||
        existingEndedAt == null
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Idempotency kaydi terminal olmayan trip durumuna isaret ediyor.',
        );
      }

      output = {
        tripId: existingTripRef.id,
        status: existingStatus,
        endedAt: existingEndedAt,
        transitionVersion: readTransitionVersion(existingTripData),
      };
      return;
    }

    const currentStatus = pickString(tripData, 'status');
    const currentTransitionVersion = readTransitionVersion(tripData);

    if (input.expectedTransitionVersion !== currentTransitionVersion) {
      throw new HttpsError(
        'failed-precondition',
        `TRANSITION_VERSION_MISMATCH: expected=${input.expectedTransitionVersion}, actual=${currentTransitionVersion}`,
      );
    }

    if (currentStatus === 'completed' || currentStatus === 'abandoned') {
      const endedAt = pickString(tripData, 'endedAt') ?? nowIso;
      tx.set(requestRef, {
        requestType: 'finish_trip',
        uid: auth.uid,
        resultRef: `trips/${tripRef.id}`,
        createdAt: nowIso,
        expiresAt: requestExpiresAtIso,
      });

      output = {
        tripId: tripRef.id,
        status: currentStatus,
        endedAt,
        transitionVersion: currentTransitionVersion,
      };
      return;
    }

    if (currentStatus !== 'active') {
      throw new HttpsError('failed-precondition', 'Trip aktif degil; finishTrip uygulanamaz.');
    }

    const startedByDeviceId = pickString(tripData, 'startedByDeviceId');
    if (startedByDeviceId !== input.deviceId) {
      throw new HttpsError(
        'permission-denied',
        'finishTrip sadece startedByDeviceId ile yapilabilir.',
      );
    }

    const nextTransitionVersion = currentTransitionVersion + 1;
    tx.update(tripRef, {
      status: 'completed',
      endedAt: nowIso,
      endReason: 'driver_finished',
      transitionVersion: nextTransitionVersion,
      updatedAt: nowIso,
    });

    tx.set(requestRef, {
      requestType: 'finish_trip',
      uid: auth.uid,
      resultRef: `trips/${tripRef.id}`,
      createdAt: nowIso,
      expiresAt: requestExpiresAtIso,
    });

    output = {
      tripId: tripRef.id,
      status: 'completed',
      endedAt: nowIso,
      transitionVersion: nextTransitionVersion,
    };
  });

  if (!output) {
    throw new HttpsError('internal', 'finishTrip sonucu hesaplanamadi.');
  }
  const routeIdForWriterRevokeValue = String(routeIdForWriterRevoke ?? '');
  if (!routeIdForWriterRevokeValue) {
    throw new HttpsError('internal', 'finishTrip route baglantisi bulunamadi.');
  }

  await rtdb.ref(`routeWriters/${routeIdForWriterRevokeValue}/${auth.uid}`).set(false);

  return apiOk<FinishTripOutput>(output);
});

export const getSubscriptionState = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  const output = await resolveDriverSubscriptionState(auth.uid);
  return apiOk<GetSubscriptionStateOutput>(output);
});

export const sendDriverAnnouncement = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  await requireRole({
    db,
    uid: auth.uid,
    allowedRoles: ['driver'],
  });
  await requireDriverProfile(db, auth.uid);
  await requirePremiumEntitlement(auth.uid, 'sendDriverAnnouncement');

  const input = validateInput(sendDriverAnnouncementInputSchema, request.data);
  const routeRef = db.collection('routes').doc(input.routeId);
  const announcementRef = db
    .collection('announcements')
    .doc(`${input.routeId}_${auth.uid}_${input.idempotencyKey}`);
  const nowIso = new Date().toISOString();
  let shareUrl = '';
  let output: SendDriverAnnouncementOutput | null = null;

  await db.runTransaction(async (tx) => {
    const routeSnap = await tx.get(routeRef);
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }
    const routeData = asRecord(routeSnap.data()) ?? {};
    if (routeData.isArchived === true) {
      throw new HttpsError('failed-precondition', 'Arsivlenmis route icin duyuru gonderilemez.');
    }

    const routeOwnerUid = pickString(routeData, 'driverId');
    const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
    const canAnnounce = routeOwnerUid === auth.uid || authorizedDriverIds.includes(auth.uid);
    if (!canAnnounce) {
      throw new HttpsError('permission-denied', 'Bu route icin duyuru gonderme yetkin yok.');
    }

    const srvCode = pickString(routeData, 'srvCode');
    if (!srvCode) {
      throw new HttpsError('failed-precondition', 'Route srvCode bilgisi eksik.');
    }
    shareUrl = `https://nerede.servis/r/${srvCode}`;

    const announcementSnap = await tx.get(announcementRef);
    if (!announcementSnap.exists) {
      tx.set(announcementRef, {
        routeId: input.routeId,
        driverId: auth.uid,
        templateKey: input.templateKey,
        customText: input.customText ?? null,
        channels: ['fcm', 'whatsapp_link'],
        shareUrl,
        idempotencyKey: input.idempotencyKey,
        createdAt: nowIso,
      });
    }

    output = {
      announcementId: announcementRef.id,
      fcmCount: 0,
      shareUrl,
    };
  });

  if (!output) {
    throw new HttpsError('internal', 'sendDriverAnnouncement sonucu hesaplanamadi.');
  }

  return apiOk<SendDriverAnnouncementOutput>(output);
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

export const syncPassengerCount = onDocumentWritten(
  'routes/{routeId}/passengers/{passengerId}',
  async (event) => {
    const routeId = event.params.routeId;
    const routeRef = db.collection('routes').doc(routeId);
    const routeSnap = await routeRef.get();
    if (!routeSnap.exists) {
      return;
    }

    const passengersSnap = await routeRef.collection('passengers').get();
    const nextPassengerCount = passengersSnap.size;
    const routeData = asRecord(routeSnap.data());
    const currentPassengerCountRaw = routeData?.passengerCount;
    const currentPassengerCount =
      typeof currentPassengerCountRaw === 'number' && Number.isFinite(currentPassengerCountRaw)
        ? currentPassengerCountRaw
        : 0;

    if (currentPassengerCount === nextPassengerCount) {
      return;
    }

    await routeRef.set(
      {
        passengerCount: nextPassengerCount,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  },
);

export const syncRouteMembership = onDocumentWritten('routes/{routeId}', async (event) => {
  const routeId = event.params.routeId;
  const afterSnap = event.data?.after;
  if (!afterSnap || !afterSnap.exists) {
    return;
  }

  const routeData = asRecord(afterSnap.data()) ?? {};
  const routeDriverUid = pickString(routeData, 'driverId');
  if (!routeDriverUid) {
    return;
  }

  const normalizedAuthorizedDrivers = normalizeAuthorizedDriverIds(
    pickStringArray(routeData, 'authorizedDriverIds'),
    routeDriverUid,
  ).sort();
  const passengerIds = (
    await db.collection('routes').doc(routeId).collection('passengers').get()
  ).docs
    .map((doc) => doc.id)
    .sort();
  const expectedMemberIds = [routeDriverUid, ...normalizedAuthorizedDrivers, ...passengerIds];
  const currentMemberIds = pickStringArray(routeData, 'memberIds');

  if (sameStringArray(currentMemberIds, expectedMemberIds)) {
    return;
  }

  await db.collection('routes').doc(routeId).set(
    {
      memberIds: expectedMemberIds,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
});

export const syncTripHeartbeatFromLocation = onValueWritten(
  '/locations/{routeId}',
  async (event) => {
    const routeId = event.params.routeId;
    const afterValue: unknown = event.data.after.val();
    const payload = asRecord(afterValue);
    if (!payload) {
      return;
    }

    const tripId = pickString(payload, 'tripId');
    if (!tripId) {
      return;
    }

    const tripRef = db.collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return;
    }
    const tripData = asRecord(tripSnap.data()) ?? {};
    if (pickString(tripData, 'routeId') !== routeId) {
      return;
    }
    if (pickString(tripData, 'status') !== 'active') {
      return;
    }

    const timestampRaw = payload['timestamp'];
    const timestampMs =
      typeof timestampRaw === 'number' && Number.isFinite(timestampRaw) ? timestampRaw : Date.now();
    const lastLocationAtIso = new Date(timestampMs).toISOString();

    await tripRef.set(
      {
        lastLocationAt: lastLocationAtIso,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  },
);
