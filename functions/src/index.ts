import { createHash, createHmac } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { onValueWritten } from 'firebase-functions/v2/database';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { z } from 'zod';

import { apiOk } from './common/api_response.js';
import {
  createTripRequestRef,
  readTripRequestReplay,
  setTripRequestRecord,
} from './common/idempotency_repository.js';
import { enqueueOutboxWithDedupe } from './common/notification_dedupe.js';
import {
  SRV_CODE_COLLISION_LIMIT_ERROR,
  SRV_CODE_COLLISION_MAX_RETRY,
  generateSrvCodeCandidate,
} from './common/srv_code.js';
import { runTransactionVoid, runTransactionWithResult } from './common/transaction_helpers.js';
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
const LIVE_LOCATION_MAX_AGE_MS = 30_000;
const LIVE_LOCATION_FUTURE_TOLERANCE_MS = 5_000;
const ABANDONED_TRIP_STALE_WINDOW_MS = 10 * 60 * 1000;
const MORNING_REMINDER_LEAD_MINUTES = 5;
const CLEANUP_STALE_DATA_BATCH_LIMIT = 200;
const CLEANUP_ROUTE_WRITERS_SCAN_LIMIT = 200;
const CLEANUP_ROUTE_WRITER_TASK_BATCH_LIMIT = 200;
const SUPPORT_REPORT_RETENTION_DAYS = 30;
const WRITER_REVOKE_TASK_RETENTION_DAYS = 7;
const DEVICE_SWITCH_NOTICE_DEDUPE_TTL_DAYS = 3;
const ANNOUNCEMENT_DISPATCH_DEDUPE_TTL_DAYS = 7;
const JOIN_ROUTE_RATE_WINDOW_MS = 5 * 60_000;
const JOIN_ROUTE_RATE_MAX_CALLS = 8;
const MAPBOX_DIRECTIONS_RATE_WINDOW_MS = 60_000;
const MAPBOX_DIRECTIONS_RATE_MAX_CALLS = 20;
const MAPBOX_DIRECTIONS_DEFAULT_MONTHLY_MAX = 20_000;
const MAPBOX_DIRECTIONS_DEFAULT_TIMEOUT_MS = 3_000;
const MAPBOX_DIRECTIONS_DEFAULT_MAX_WAYPOINTS = 10;
const ROUTE_PREVIEW_RATE_WINDOW_MS = 60_000;
const ROUTE_PREVIEW_RATE_MAX_CALLS = 60;
const ROUTE_PREVIEW_TOKEN_DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;
const ROUTE_AUDIT_COLLECTION = '_audit_route_events';
const ACCOUNT_DELETE_GRACE_DAYS = 7;
const DELETE_INTERCEPTOR_MESSAGE =
  'Hesabi silmek odemeyi durdurmaz, once store aboneligini iptal et.';
const MANAGE_SUBSCRIPTION_LABEL = 'Manage Subscription';
const IOS_MANAGE_SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';
const ANDROID_MANAGE_SUBSCRIPTION_URL = 'https://play.google.com/store/account/subscriptions';

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
type MapboxDirectionsProfile = 'driving' | 'driving-traffic';

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

interface MapboxDirectionsProxyOutput {
  routeId: string;
  profile: MapboxDirectionsProfile;
  geometry: string;
  distanceMeters: number;
  durationSeconds: number;
  source: 'mapbox';
  requestSignature: string | null;
}

interface MapboxMapMatchingProxyOutput {
  tracePoints: {
    lat: number;
    lng: number;
    accuracy: number;
    sampledAtMs: number;
  }[];
  fallbackUsed: boolean;
  source: 'map_matching' | 'fallback';
  confidence: number;
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

interface GenerateRouteShareLinkOutput {
  routeId: string;
  srvCode: string;
  landingUrl: string;
  signedLandingUrl: string;
  previewToken: string;
  previewTokenExpiresAt: string;
  whatsappUrl: string;
  systemShareText: string;
}

interface DynamicRoutePreviewOutput {
  routeId: string;
  srvCode: string;
  routeName: string;
  driverDisplayName: string;
  scheduledTime: string | null;
  timeSlot: 'morning' | 'evening' | 'midday' | 'custom' | null;
  allowGuestTracking: boolean;
  deepLinkUrl: string;
}

type RouteAuditStatus = 'success' | 'denied';

interface WriteRouteAuditEventInput {
  eventType: string;
  actorUid: string | null;
  routeId?: string | null;
  srvCode?: string | null;
  status?: RouteAuditStatus;
  reason?: string | null;
  requestIp?: string | null;
  metadata?: Record<string, unknown>;
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

interface DeleteUserDataOutput {
  uid: string;
  status: 'blocked_subscription' | 'scheduled';
  blockedBySubscription: boolean;
  dryRun: boolean;
  interceptorMessage: string | null;
  manageSubscriptionLabel: string | null;
  manageSubscriptionUrls: {
    ios: string;
    android: string;
  } | null;
  requestedAt: string | null;
  hardDeleteAfter: string | null;
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

const mapboxDirectionsProxyInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  destination: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  waypoints: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    )
    .max(MAPBOX_DIRECTIONS_DEFAULT_MAX_WAYPOINTS)
    .optional()
    .default([]),
  profile: z.enum(['driving', 'driving-traffic']).optional().default('driving'),
});

const mapboxMapMatchingProxyInputSchema = z.object({
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
});

const generateRouteShareLinkInputSchema = z.object({
  routeId: z.string().trim().min(1).max(128),
  customText: z.string().trim().max(240).optional(),
});

const deleteUserDataInputSchema = z.object({
  dryRun: z.boolean().optional().default(false),
});

const dynamicRoutePreviewInputSchema = z.object({
  srvCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/),
  token: z.string().trim().min(16).max(512),
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

function maskPhoneForSnapshot(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) {
    return null;
  }

  const visiblePrefix = digits.slice(0, 2);
  const visibleSuffix = digits.slice(-2);
  const maskedMiddle = '*'.repeat(Math.max(0, digits.length - 4));
  return `${visiblePrefix}${maskedMiddle}${visibleSuffix}`;
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

function pickFiniteNumber(record: Record<string, unknown> | null, key: string): number | null {
  if (!record) {
    return null;
  }
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
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

function parseHourMinuteToMinuteOfDay(value: string | null): number | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }
  const [hourText, minuteText] = value.split(':', 2);
  if (!hourText || !minuteText) {
    return null;
  }
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

function getIstanbulClockInfo(when: Date): { dateKey: string; minuteOfDay: number } | null {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(when);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const hourText = parts.find((part) => part.type === 'hour')?.value;
  const minuteText = parts.find((part) => part.type === 'minute')?.value;
  if (!year || !month || !day || !hourText || !minuteText) {
    return null;
  }

  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return {
    dateKey: `${year}-${month}-${day}`,
    minuteOfDay: hour * 60 + minute,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

function buildAuditFingerprint(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

async function writeRouteAuditEvent(input: WriteRouteAuditEventInput): Promise<void> {
  await db.collection(ROUTE_AUDIT_COLLECTION).add({
    eventType: input.eventType,
    actorUid: input.actorUid ?? null,
    actorType: input.actorUid ? 'authenticated' : 'public',
    routeId: input.routeId ?? null,
    srvCode: input.srvCode ?? null,
    status: input.status ?? 'success',
    reason: input.reason ?? null,
    requestIpHash: buildAuditFingerprint(input.requestIp ?? null),
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });
}

async function writeRouteAuditEventSafe(input: WriteRouteAuditEventInput): Promise<void> {
  try {
    await writeRouteAuditEvent(input);
  } catch (error) {
    console.error('route audit write failed', {
      eventType: input.eventType,
      errorMessage: toErrorMessage(error),
    });
  }
}

function buildWriterRevokeTaskId(routeId: string, driverId: string, tripId: string): string {
  return `${tripId}_${routeId}_${driverId}`;
}

function collectEnabledRouteWriters(
  value: unknown,
  maxEntries: number,
): Array<{ routeId: string; driverId: string }> {
  if (maxEntries <= 0) {
    return [];
  }
  const routeWriterTree = asRecord(value);
  if (!routeWriterTree) {
    return [];
  }

  const entries: Array<{ routeId: string; driverId: string }> = [];
  for (const [routeId, routeNode] of Object.entries(routeWriterTree)) {
    const routeWriters = asRecord(routeNode);
    if (!routeWriters) {
      continue;
    }

    for (const [driverId, enabled] of Object.entries(routeWriters)) {
      if (enabled !== true) {
        continue;
      }
      entries.push({ routeId, driverId });
      if (entries.length >= maxEntries) {
        return entries;
      }
    }
  }

  return entries;
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

async function requireRouteMember(routeId: string, uid: string): Promise<Record<string, unknown>> {
  const routeSnap = await db.collection('routes').doc(routeId).get();
  if (!routeSnap.exists) {
    throw new HttpsError('not-found', 'Route bulunamadi.');
  }

  const routeData = asRecord(routeSnap.data()) ?? {};
  const routeOwnerUid = pickString(routeData, 'driverId');
  const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
  const memberIds = pickStringArray(routeData, 'memberIds');
  const isMember =
    routeOwnerUid === uid || authorizedDriverIds.includes(uid) || memberIds.includes(uid);
  if (!isMember) {
    throw new HttpsError('permission-denied', 'Bu route icin erisim yetkin yok.');
  }

  return routeData;
}

interface MapboxDirectionsRuntimeConfig {
  enabled: boolean;
  monthlyRequestMax: number;
  timeoutMs: number;
  perRouteWindowMs: number;
  perRouteMaxCalls: number;
}

function parsePositiveIntValue(rawValue: unknown, fallback: number): number {
  let parsed: number;
  if (typeof rawValue === 'number') {
    parsed = rawValue;
  } else if (typeof rawValue === 'string') {
    parsed = Number.parseInt(rawValue, 10);
  } else {
    return fallback;
  }
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function readJoinRouteRateWindowMs(): number {
  return parsePositiveIntValue(process.env.JOIN_ROUTE_RATE_WINDOW_MS, JOIN_ROUTE_RATE_WINDOW_MS);
}

function readJoinRouteRateMaxCalls(): number {
  return parsePositiveIntValue(process.env.JOIN_ROUTE_RATE_MAX_CALLS, JOIN_ROUTE_RATE_MAX_CALLS);
}

function readMapboxDirectionsConfigFromEnv(): MapboxDirectionsRuntimeConfig {
  const enabled = (process.env.MAPBOX_DIRECTIONS_ENABLED ?? 'false').toLowerCase() === 'true';
  const monthlyRequestMax = parsePositiveIntValue(
    process.env.MAPBOX_DIRECTIONS_MONTHLY_MAX,
    MAPBOX_DIRECTIONS_DEFAULT_MONTHLY_MAX,
  );
  const timeoutMs = parsePositiveIntValue(
    process.env.MAPBOX_DIRECTIONS_TIMEOUT_MS,
    MAPBOX_DIRECTIONS_DEFAULT_TIMEOUT_MS,
  );
  const perRouteWindowMs = parsePositiveIntValue(
    process.env.MAPBOX_DIRECTIONS_RATE_WINDOW_MS,
    MAPBOX_DIRECTIONS_RATE_WINDOW_MS,
  );
  const perRouteMaxCalls = parsePositiveIntValue(
    process.env.MAPBOX_DIRECTIONS_RATE_MAX_CALLS,
    MAPBOX_DIRECTIONS_RATE_MAX_CALLS,
  );

  return {
    enabled,
    monthlyRequestMax,
    timeoutMs,
    perRouteWindowMs,
    perRouteMaxCalls,
  };
}

async function readMapboxDirectionsRuntimeConfig(
  fallback: MapboxDirectionsRuntimeConfig,
): Promise<MapboxDirectionsRuntimeConfig> {
  try {
    const snap = await db.collection('_runtime_flags').doc('mapbox_directions').get();
    const data = asRecord(snap.data()) ?? {};

    return {
      enabled: typeof data.enabled === 'boolean' ? data.enabled : fallback.enabled,
      monthlyRequestMax: parsePositiveIntValue(data.monthlyRequestMax, fallback.monthlyRequestMax),
      timeoutMs: parsePositiveIntValue(data.timeoutMs, fallback.timeoutMs),
      perRouteWindowMs: parsePositiveIntValue(data.perRouteWindowMs, fallback.perRouteWindowMs),
      perRouteMaxCalls: parsePositiveIntValue(data.perRouteMaxCalls, fallback.perRouteMaxCalls),
    };
  } catch {
    return fallback;
  }
}

async function reserveMonthlyUsageBudget(usageKey: string, monthlyMax: number): Promise<boolean> {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const counterRef = db.collection('_usage_counters').doc(`${usageKey}_${monthKey}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = asRecord(snap.data()) ?? {};
    const existingCount = parsePositiveIntValue(data.count, 0);

    if (existingCount >= monthlyMax) {
      return false;
    }

    tx.set(
      counterRef,
      {
        count: existingCount + 1,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return true;
  });
}

function readMapboxToken(): string | null {
  const token = process.env.MAPBOX_SECRET_TOKEN?.trim() ?? process.env.MAPBOX_TOKEN?.trim() ?? '';
  return token.length > 0 ? token : null;
}

function buildDirectionsCoordinatePath(points: readonly { lat: number; lng: number }[]): string {
  return points.map((point) => `${point.lng},${point.lat}`).join(';');
}

function buildMapboxRequestSignature(
  routeId: string,
  profile: MapboxDirectionsProfile,
  coordinatePath: string,
): string | null {
  const signingSecret = process.env.MAPBOX_PROXY_SIGNING_SECRET?.trim() ?? '';
  if (!signingSecret) {
    return null;
  }

  const payload = `${routeId}|${profile}|${coordinatePath}`;
  return createHmac('sha256', signingSecret).update(payload).digest('hex');
}

function buildMapboxDirectionsUrl({
  profile,
  coordinatePath,
  token,
}: {
  profile: MapboxDirectionsProfile;
  coordinatePath: string;
  token: string;
}): string {
  const baseUrl = (process.env.MAPBOX_BASE_URL ?? 'https://api.mapbox.com').replace(/\/+$/, '');
  const query = new URLSearchParams({
    geometries: 'polyline6',
    overview: 'full',
    steps: 'false',
    access_token: token,
  });

  return `${baseUrl}/directions/v5/mapbox/${profile}/${coordinatePath}?${query.toString()}`;
}

async function fetchJsonWithTimeout({
  url,
  timeoutMs,
  headers,
}: {
  url: string;
  timeoutMs: number;
  headers: Record<string, string>;
}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new HttpsError('unavailable', `MAPBOX_DIRECTIONS_UPSTREAM_${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const errorRecord = asRecord(error as Record<string, unknown> | null);
    if (pickString(errorRecord, 'name') === 'AbortError') {
      throw new HttpsError('deadline-exceeded', 'MAPBOX_DIRECTIONS_TIMEOUT');
    }
    throw new HttpsError('unavailable', 'MAPBOX_DIRECTIONS_UPSTREAM_FAILED');
  } finally {
    clearTimeout(timeout);
  }
}

function parseMapboxDirectionsResponse(payload: unknown): {
  geometry: string;
  distanceMeters: number;
  durationSeconds: number;
} {
  const body = asRecord(payload) ?? {};
  const routes = Array.isArray(body.routes) ? body.routes : [];
  const firstRoute = asRecord(routes[0]) ?? {};
  const geometry = pickString(firstRoute, 'geometry');
  const distanceRaw = firstRoute.distance;
  const durationRaw = firstRoute.duration;
  const distanceMeters =
    typeof distanceRaw === 'number' && Number.isFinite(distanceRaw) ? distanceRaw : null;
  const durationSeconds =
    typeof durationRaw === 'number' && Number.isFinite(durationRaw) ? durationRaw : null;

  if (!geometry || distanceMeters == null || durationSeconds == null) {
    throw new HttpsError('unavailable', 'MAPBOX_DIRECTIONS_INVALID_RESPONSE');
  }

  return {
    geometry,
    distanceMeters,
    durationSeconds,
  };
}

function readRoutePreviewSigningSecret(): string {
  const secret =
    process.env.ROUTE_PREVIEW_SIGNING_SECRET?.trim() ??
    process.env.MAPBOX_PROXY_SIGNING_SECRET?.trim() ??
    '';
  if (!secret) {
    throw new HttpsError('failed-precondition', 'ROUTE_PREVIEW_SIGNING_SECRET_MISSING');
  }
  return secret;
}

function readRoutePreviewRateWindowMs(): number {
  return parsePositiveIntValue(
    process.env.ROUTE_PREVIEW_RATE_WINDOW_MS,
    ROUTE_PREVIEW_RATE_WINDOW_MS,
  );
}

function readRoutePreviewRateMaxCalls(): number {
  return parsePositiveIntValue(
    process.env.ROUTE_PREVIEW_RATE_MAX_CALLS,
    ROUTE_PREVIEW_RATE_MAX_CALLS,
  );
}

function readRoutePreviewTokenTtlSeconds(): number {
  return parsePositiveIntValue(
    process.env.ROUTE_PREVIEW_TOKEN_TTL_SECONDS,
    ROUTE_PREVIEW_TOKEN_DEFAULT_TTL_SECONDS,
  );
}

function buildRoutePreviewToken({ srvCode, nowMs }: { srvCode: string; nowMs: number }): {
  token: string;
  expiresAtIso: string;
} {
  const ttlSeconds = readRoutePreviewTokenTtlSeconds();
  const expiresAtMs = nowMs + ttlSeconds * 1000;
  const expiresAtSeconds = Math.floor(expiresAtMs / 1000);
  const payload = `${srvCode}.${expiresAtSeconds}`;
  const signature = createHmac('sha256', readRoutePreviewSigningSecret())
    .update(payload)
    .digest('hex');
  return {
    token: `${payload}.${signature}`,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
  };
}

function verifyRoutePreviewToken({
  srvCode,
  token,
  nowMs,
}: {
  srvCode: string;
  token: string;
  nowMs: number;
}): void {
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_INVALID');
  }

  const [tokenSrvCodeRaw, expiresAtSecondsRaw, signature] = tokenParts;
  const tokenSrvCode = tokenSrvCodeRaw?.trim().toUpperCase();
  if (!tokenSrvCode || tokenSrvCode !== srvCode) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_SCOPE_MISMATCH');
  }

  const expiresAtSeconds = Number.parseInt(expiresAtSecondsRaw ?? '', 10);
  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds <= 0) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_INVALID');
  }

  if (expiresAtSeconds * 1000 < nowMs) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_EXPIRED');
  }

  const payload = `${tokenSrvCode}.${expiresAtSeconds}`;
  const expectedSignature = createHmac('sha256', readRoutePreviewSigningSecret())
    .update(payload)
    .digest('hex');
  if (expectedSignature !== signature) {
    throw new HttpsError('permission-denied', 'ROUTE_PREVIEW_TOKEN_INVALID_SIGNATURE');
  }
}

function readRequestIpAddress(rawRequest: unknown): string {
  const requestRecord = asRecord(rawRequest) ?? {};
  const directIp = pickString(requestRecord, 'ip');
  if (directIp) {
    return directIp;
  }

  const requestHeaders = asRecord(requestRecord.headers) ?? {};
  const forwardedFor = pickString(requestHeaders, 'x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return 'unknown';
}

function readRouteTimeSlot(value: unknown): 'morning' | 'evening' | 'midday' | 'custom' | null {
  if (value === 'morning' || value === 'evening' || value === 'midday' || value === 'custom') {
    return value;
  }
  return null;
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
      await runTransactionVoid(db, async (tx) => {
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
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const deviceSwitchNoticeDedupeExpiresAtIso = new Date(
    nowMs + DEVICE_SWITCH_NOTICE_DEDUPE_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const driverRef = db.collection('drivers').doc(auth.uid);
  const currentDeviceRef = driverRef.collection('devices').doc(input.deviceId);
  let previousDeviceRevoked = false;

  await runTransactionVoid(db, async (tx) => {
    const driverSnap = await tx.get(driverRef);
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Driver profile bulunamadi.');
    }

    const driverData = asRecord(driverSnap.data()) ?? {};
    const previousDeviceId = pickString(driverData, 'activeDeviceId');
    previousDeviceRevoked = previousDeviceId != null && previousDeviceId !== input.deviceId;
    const currentDeviceSnap = await tx.get(currentDeviceRef);
    const currentDeviceData = asRecord(currentDeviceSnap.data());
    const firstSeenAt = pickString(currentDeviceData, 'firstSeenAt') ?? nowIso;

    if (previousDeviceRevoked && previousDeviceId != null) {
      const previousDeviceRef = driverRef.collection('devices').doc(previousDeviceId);
      const switchAuditRef = db.collection('_audit_device_switches').doc();
      const dedupeKey = `device_switch_notice_${auth.uid}_${previousDeviceId}_${input.deviceId}`;
      const queued = await enqueueOutboxWithDedupe({
        tx,
        db,
        dedupeKey,
        dedupeData: {
          uid: auth.uid,
          dedupeType: 'device_switch_notice',
          previousDeviceId,
          nextDeviceId: input.deviceId,
          createdAt: nowIso,
          expiresAt: deviceSwitchNoticeDedupeExpiresAtIso,
        },
        outboxData: {
          type: 'device_switch_notice',
          uid: auth.uid,
          previousDeviceId,
          nextDeviceId: input.deviceId,
          targetToken: pickString(driverData, 'activeDeviceToken'),
          dedupeKey,
          status: 'pending',
          createdAt: nowIso,
        },
      });

      tx.set(
        previousDeviceRef,
        {
          isActive: false,
          revokedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );

      tx.set(switchAuditRef, {
        uid: auth.uid,
        previousDeviceId,
        nextDeviceId: input.deviceId,
        createdAt: nowIso,
        notificationStatus: queued ? 'pending' : 'deduped',
      });
    }

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

export const mapboxDirectionsProxy = onCall(
  { secrets: ['MAPBOX_SECRET_TOKEN'] },
  async (request) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver', 'passenger'],
    });

    const input = validateInput(mapboxDirectionsProxyInputSchema, request.data);
    const routeData = await requireRouteMember(input.routeId, auth.uid);
    if (routeData.isArchived === true) {
      throw new HttpsError(
        'failed-precondition',
        'Arsivlenmis route icin directions cagrisi yapilamaz.',
      );
    }

    const directionsConfig = await readMapboxDirectionsRuntimeConfig(
      readMapboxDirectionsConfigFromEnv(),
    );
    if (!directionsConfig.enabled) {
      throw new HttpsError('failed-precondition', 'MAPBOX_DIRECTIONS_DISABLED');
    }

    const mapboxToken = readMapboxToken();
    if (!mapboxToken) {
      throw new HttpsError('failed-precondition', 'MAPBOX_TOKEN_MISSING');
    }

    await enforceRateLimit({
      db,
      key: `mapbox_directions_route_${input.routeId}`,
      windowMs: directionsConfig.perRouteWindowMs,
      maxCalls: directionsConfig.perRouteMaxCalls,
      exceededMessage: 'Mapbox directions route limiti asildi, lutfen bekleyip tekrar dene.',
    });

    const budgetReserved = await reserveMonthlyUsageBudget(
      'mapbox_directions',
      directionsConfig.monthlyRequestMax,
    );
    if (!budgetReserved) {
      throw new HttpsError('resource-exhausted', 'MAPBOX_DIRECTIONS_MONTHLY_CAP_REACHED');
    }

    const profile: MapboxDirectionsProfile = input.profile ?? 'driving';
    const waypoints = input.waypoints ?? [];
    const coordinates = [input.origin, ...waypoints, input.destination];
    const coordinatePath = buildDirectionsCoordinatePath(coordinates);
    const requestSignature = buildMapboxRequestSignature(input.routeId, profile, coordinatePath);

    const headers: Record<string, string> = {
      'User-Agent': 'neredeservis-functions/1.0',
    };
    if (requestSignature) {
      headers['X-Nsv-Signature'] = requestSignature;
    }

    const payload = await fetchJsonWithTimeout({
      url: buildMapboxDirectionsUrl({
        profile,
        coordinatePath,
        token: mapboxToken,
      }),
      timeoutMs: directionsConfig.timeoutMs,
      headers,
    });
    const parsed = parseMapboxDirectionsResponse(payload);

    return apiOk<MapboxDirectionsProxyOutput>({
      routeId: input.routeId,
      profile,
      geometry: parsed.geometry,
      distanceMeters: parsed.distanceMeters,
      durationSeconds: parsed.durationSeconds,
      source: 'mapbox',
      requestSignature,
    });
  },
);

export const mapboxMapMatchingProxy = onCall(
  { secrets: ['MAPBOX_SECRET_TOKEN'] },
  async (request) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);

    const input = validateInput(mapboxMapMatchingProxyInputSchema, request.data);

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

    return apiOk<MapboxMapMatchingProxyOutput>({
      tracePoints: mapMatched.tracePoints,
      fallbackUsed: mapMatched.fallbackUsed,
      source: mapMatched.source,
      confidence: mapMatched.confidence,
    });
  },
);

export const generateRouteShareLink = onCall(
  { secrets: ['ROUTE_PREVIEW_SIGNING_SECRET'] },
  async (request) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver', 'passenger'],
    });

    const input = validateInput(generateRouteShareLinkInputSchema, request.data);
    const routeData = await requireRouteMember(input.routeId, auth.uid);
    const srvCode = pickString(routeData, 'srvCode');
    if (!srvCode) {
      throw new HttpsError('failed-precondition', 'Route srvCode alani bulunamadi.');
    }

    const nowMs = Date.now();
    const previewTokenBundle = buildRoutePreviewToken({
      srvCode,
      nowMs,
    });

    const landingUrl = `https://nerede.servis/r/${srvCode}`;
    const signedLandingUrl = `${landingUrl}?t=${encodeURIComponent(previewTokenBundle.token)}`;
    const systemShareTextRaw = input.customText?.trim();
    const systemShareText =
      systemShareTextRaw && systemShareTextRaw.length > 0
        ? `${systemShareTextRaw} ${signedLandingUrl}`
        : `Nerede Servis daveti: ${signedLandingUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(systemShareText)}`;
    await writeRouteAuditEvent({
      eventType: 'route_share_link_generated',
      actorUid: auth.uid,
      routeId: input.routeId,
      srvCode,
      metadata: {
        customTextProvided: systemShareTextRaw != null && systemShareTextRaw.length > 0,
      },
    });

    return apiOk<GenerateRouteShareLinkOutput>({
      routeId: input.routeId,
      srvCode,
      landingUrl,
      signedLandingUrl,
      previewToken: previewTokenBundle.token,
      previewTokenExpiresAt: previewTokenBundle.expiresAtIso,
      whatsappUrl,
      systemShareText,
    });
  },
);

export const getDynamicRoutePreview = onCall(
  { secrets: ['ROUTE_PREVIEW_SIGNING_SECRET'] },
  async (request) => {
    const input = validateInput(dynamicRoutePreviewInputSchema, request.data);
    const normalizedSrvCode = input.srvCode.trim().toUpperCase();
    const requestIp = readRequestIpAddress(request.rawRequest);
    const nowMs = Date.now();

    try {
      await enforceRateLimit({
        db,
        key: `route_preview_${normalizedSrvCode}_${requestIp}`,
        windowMs: readRoutePreviewRateWindowMs(),
        maxCalls: readRoutePreviewRateMaxCalls(),
        exceededMessage: 'Route preview limiti asildi. Lutfen daha sonra tekrar dene.',
      });

      verifyRoutePreviewToken({
        srvCode: normalizedSrvCode,
        token: input.token,
        nowMs,
      });

      const routeQuerySnap = await db
        .collection('routes')
        .where('srvCode', '==', normalizedSrvCode)
        .where('isArchived', '==', false)
        .limit(1)
        .get();
      if (routeQuerySnap.empty) {
        throw new HttpsError('not-found', 'Route preview bulunamadi.');
      }

      const routeDoc = routeQuerySnap.docs[0];
      if (!routeDoc) {
        throw new HttpsError('not-found', 'Route preview bulunamadi.');
      }
      const routeData = asRecord(routeDoc.data()) ?? {};
      const routeName = pickString(routeData, 'name');
      if (!routeName) {
        throw new HttpsError('failed-precondition', 'Route ad alani eksik.');
      }

      const driverUid = pickString(routeData, 'driverId');
      if (!driverUid) {
        throw new HttpsError('failed-precondition', 'Route owner bilgisi eksik.');
      }

      const driverDoc = await db.collection('drivers').doc(driverUid).get();
      const driverData = asRecord(driverDoc.data());
      const userDoc = await db.collection('users').doc(driverUid).get();
      const userData = asRecord(userDoc.data());
      const driverDisplayName =
        pickString(driverData, 'name') ?? pickString(userData, 'displayName') ?? 'Servis Soforu';

      const output: DynamicRoutePreviewOutput = {
        routeId: routeDoc.id,
        srvCode: normalizedSrvCode,
        routeName,
        driverDisplayName,
        scheduledTime: pickString(routeData, 'scheduledTime'),
        timeSlot: readRouteTimeSlot(routeData.timeSlot),
        allowGuestTracking: routeData.allowGuestTracking === true,
        deepLinkUrl: `neredeservis://route-preview?srvCode=${normalizedSrvCode}`,
      };
      await writeRouteAuditEventSafe({
        eventType: 'route_preview_accessed',
        actorUid: null,
        routeId: output.routeId,
        srvCode: output.srvCode,
        requestIp,
        metadata: {
          allowGuestTracking: output.allowGuestTracking,
        },
      });
      return apiOk<DynamicRoutePreviewOutput>(output);
    } catch (error) {
      await writeRouteAuditEventSafe({
        eventType: 'route_preview_denied',
        actorUid: null,
        srvCode: normalizedSrvCode,
        status: 'denied',
        reason: error instanceof HttpsError ? String(error.code) : 'internal',
        requestIp,
      });
      throw error;
    }
  },
);

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
  await enforceRateLimit({
    db,
    key: `join_route_${auth.uid}`,
    windowMs: readJoinRouteRateWindowMs(),
    maxCalls: readJoinRouteRateMaxCalls(),
    exceededMessage: 'SRV katilim deneme limiti asildi. Lutfen daha sonra tekrar dene.',
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

  await runTransactionVoid(db, async (tx) => {
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
  await writeRouteAuditEvent({
    eventType: 'route_joined_by_srv',
    actorUid: auth.uid,
    routeId: routeDoc.id,
    srvCode: input.srvCode,
    metadata: {
      showPhoneToDriver: input.showPhoneToDriver,
    },
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
  let left = false;

  await runTransactionVoid(db, async (tx) => {
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

  await runTransactionVoid(db, async (tx) => {
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

  await runTransactionVoid(db, async (tx) => {
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
    const existingPassengerId = pickString(existingSkipRequest, 'passengerId');
    const existingDateKey = pickString(existingSkipRequest, 'dateKey');
    if (
      skipRequestSnap.exists &&
      (existingPassengerId !== auth.uid || existingDateKey !== input.dateKey)
    ) {
      throw new HttpsError(
        'failed-precondition',
        'skip_requests kaydi beklenmeyen kimlik iceriyor.',
      );
    }
    const existingCreatedAt = pickString(existingSkipRequest, 'createdAt');
    const existingUpdatedAt = pickString(existingSkipRequest, 'updatedAt');
    const existingIdempotencyKey = pickString(existingSkipRequest, 'idempotencyKey');

    tx.set(
      skipRequestRef,
      {
        passengerId: auth.uid,
        dateKey: input.dateKey,
        status: 'skip_today',
        idempotencyKey: existingIdempotencyKey ?? input.idempotencyKey,
        createdAt: existingCreatedAt ?? nowIso,
        updatedAt: existingUpdatedAt ?? nowIso,
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

  await runTransactionVoid(db, async (tx) => {
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
  const requestRef = createTripRequestRef(db, auth.uid, input.idempotencyKey);
  const activeTripQuery = db
    .collection('trips')
    .where('routeId', '==', input.routeId)
    .where('status', '==', 'active')
    .limit(1);

  const output = await runTransactionWithResult<StartTripOutput>(db, async (tx) => {
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

    const existingTripId = await readTripRequestReplay({
      tx,
      requestRef,
      expectedRequestType: 'start_trip',
    });
    if (existingTripId) {
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

      return {
        tripId: existingTripRef.id,
        status: 'active',
        transitionVersion: readTransitionVersion(existingTripData),
      };
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

      setTripRequestRecord({
        tx,
        requestRef,
        requestType: 'start_trip',
        uid: auth.uid,
        tripId: activeTripDoc.id,
        createdAt: nowIso,
        expiresAt: requestExpiresAtIso,
      });

      return {
        tripId: activeTripDoc.id,
        status: 'active',
        transitionVersion: currentTransitionVersion,
      };
    }

    const driverSnap = await tx.get(driverRef);
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Driver profile bulunamadi.');
    }
    const driverData = asRecord(driverSnap.data()) ?? {};
    const showPhoneToPassengers = driverData.showPhoneToPassengers === true;
    const snapshotPhone = showPhoneToPassengers
      ? maskPhoneForSnapshot(pickString(driverData, 'phone'))
      : null;

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

    setTripRequestRecord({
      tx,
      requestRef,
      requestType: 'start_trip',
      uid: auth.uid,
      tripId: tripRef.id,
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

    return {
      tripId: tripRef.id,
      status: 'active',
      transitionVersion,
    };
  });

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
  const writerRevokeTaskExpiresAtIso = new Date(
    now + WRITER_REVOKE_TASK_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const tripRef = db.collection('trips').doc(input.tripId);
  const requestRef = createTripRequestRef(db, auth.uid, input.idempotencyKey);

  let output: FinishTripOutput | null = null;
  let routeIdForWriterRevoke: string | null = null;
  let writerRevokeTaskId: string | null = null;

  await runTransactionVoid(db, async (tx) => {
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
    const queueWriterRevokeTask = (taskRouteId: string, taskTripId: string) => {
      const writerRevokeTaskRef = db
        .collection('_writer_revoke_tasks')
        .doc(buildWriterRevokeTaskId(taskRouteId, auth.uid, taskTripId));
      writerRevokeTaskId = writerRevokeTaskRef.id;
      tx.set(
        writerRevokeTaskRef,
        {
          tripId: taskTripId,
          routeId: taskRouteId,
          driverId: auth.uid,
          source: 'finish_trip',
          status: 'pending',
          createdAt: nowIso,
          updatedAt: nowIso,
          expiresAt: writerRevokeTaskExpiresAtIso,
          lastError: null,
        },
        { merge: true },
      );
    };

    const existingTripId = await readTripRequestReplay({
      tx,
      requestRef,
      expectedRequestType: 'finish_trip',
    });
    if (existingTripId) {
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

      const existingRouteId = pickString(existingTripData, 'routeId');
      if (!existingRouteId) {
        throw new HttpsError('failed-precondition', 'Idempotency kaydi routeId iceremiyor.');
      }
      routeIdForWriterRevoke = existingRouteId;
      queueWriterRevokeTask(existingRouteId, existingTripRef.id);
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
      setTripRequestRecord({
        tx,
        requestRef,
        requestType: 'finish_trip',
        uid: auth.uid,
        tripId: tripRef.id,
        createdAt: nowIso,
        expiresAt: requestExpiresAtIso,
      });
      queueWriterRevokeTask(routeId, tripRef.id);

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

    setTripRequestRecord({
      tx,
      requestRef,
      requestType: 'finish_trip',
      uid: auth.uid,
      tripId: tripRef.id,
      createdAt: nowIso,
      expiresAt: requestExpiresAtIso,
    });
    queueWriterRevokeTask(routeId, tripRef.id);

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

  const writerRevokeTaskRef = db
    .collection('_writer_revoke_tasks')
    .doc(
      writerRevokeTaskId ??
        buildWriterRevokeTaskId(routeIdForWriterRevokeValue, auth.uid, input.tripId),
    );
  const writerRevokeAttemptAtIso = new Date().toISOString();

  try {
    await rtdb.ref(`routeWriters/${routeIdForWriterRevokeValue}/${auth.uid}`).set(false);
    await writerRevokeTaskRef.set(
      {
        status: 'applied',
        appliedAt: writerRevokeAttemptAtIso,
        lastAttemptAt: writerRevokeAttemptAtIso,
        updatedAt: writerRevokeAttemptAtIso,
        lastError: null,
      },
      { merge: true },
    );
  } catch (error) {
    const errorMessage = toErrorMessage(error);
    console.error('finishTrip writer revoke failed', {
      routeId: routeIdForWriterRevokeValue,
      driverId: auth.uid,
      tripId: input.tripId,
      errorMessage,
    });
    await writerRevokeTaskRef.set(
      {
        status: 'pending',
        lastAttemptAt: writerRevokeAttemptAtIso,
        updatedAt: writerRevokeAttemptAtIso,
        lastError: errorMessage,
      },
      { merge: true },
    );
  }

  return apiOk<FinishTripOutput>(output);
});

export const getSubscriptionState = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  const output = await resolveDriverSubscriptionState(auth.uid);
  return apiOk<GetSubscriptionStateOutput>(output);
});

export const deleteUserData = onCall(async (request) => {
  const auth = requireAuth(request);
  requireNonAnonymous(auth);

  const input = validateInput(deleteUserDataInputSchema, request.data);
  const dryRun = input.dryRun === true;
  const now = new Date();
  const nowIso = now.toISOString();
  const hardDeleteAfterIso = new Date(
    now.getTime() + ACCOUNT_DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const userRef = db.collection('users').doc(auth.uid);
  const userSnap = await userRef.get();
  const userData = asRecord(userSnap.data()) ?? {};
  const role = readRole(userData.role) ?? 'guest';
  let subscriptionStatus: SubscriptionStatus | null = null;

  if (role === 'driver') {
    const subscriptionState = await resolveDriverSubscriptionState(auth.uid);
    subscriptionStatus = subscriptionState.subscriptionStatus;
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trial') {
      await db.collection('_audit_privacy_events').add({
        eventType: 'user_delete_blocked_subscription',
        uid: auth.uid,
        role,
        subscriptionStatus,
        createdAt: nowIso,
      });

      return apiOk<DeleteUserDataOutput>({
        uid: auth.uid,
        status: 'blocked_subscription',
        blockedBySubscription: true,
        dryRun,
        interceptorMessage: DELETE_INTERCEPTOR_MESSAGE,
        manageSubscriptionLabel: MANAGE_SUBSCRIPTION_LABEL,
        manageSubscriptionUrls: {
          ios: IOS_MANAGE_SUBSCRIPTION_URL,
          android: ANDROID_MANAGE_SUBSCRIPTION_URL,
        },
        requestedAt: null,
        hardDeleteAfter: null,
      });
    }
  }

  if (!dryRun) {
    const deleteRequestRef = db.collection('_delete_requests').doc(auth.uid);
    const consentRef = db.collection('consents').doc(auth.uid);
    const driverRef = db.collection('drivers').doc(auth.uid);
    const deleteBatch = db.batch();
    deleteBatch.set(
      deleteRequestRef,
      {
        uid: auth.uid,
        role,
        requestedAt: nowIso,
        hardDeleteAfter: hardDeleteAfterIso,
        status: 'pending',
        dryRun: false,
        subscriptionStatusAtRequest: subscriptionStatus ?? 'none',
        updatedAt: nowIso,
      },
      { merge: true },
    );
    deleteBatch.set(
      userRef,
      {
        deletedAt: nowIso,
        updatedAt: nowIso,
        displayName: 'Silinen Kullanici',
        phone: null,
      },
      { merge: true },
    );
    deleteBatch.set(
      consentRef,
      {
        deleteRequestedAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
    if (role === 'driver') {
      deleteBatch.set(
        driverRef,
        {
          deletedAt: nowIso,
          updatedAt: nowIso,
          activeDeviceId: null,
          activeDeviceToken: null,
          phone: null,
        },
        { merge: true },
      );
    }
    await deleteBatch.commit();
  }

  await db.collection('_audit_privacy_events').add({
    eventType: dryRun ? 'user_delete_dry_run' : 'user_delete_requested',
    uid: auth.uid,
    role,
    subscriptionStatus: subscriptionStatus ?? 'none',
    createdAt: nowIso,
  });

  return apiOk<DeleteUserDataOutput>({
    uid: auth.uid,
    status: 'scheduled',
    blockedBySubscription: false,
    dryRun,
    interceptorMessage: null,
    manageSubscriptionLabel: null,
    manageSubscriptionUrls: null,
    requestedAt: nowIso,
    hardDeleteAfter: hardDeleteAfterIso,
  });
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
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const announcementDispatchDedupeExpiresAtIso = new Date(
    nowMs + ANNOUNCEMENT_DISPATCH_DEDUPE_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const output = await runTransactionWithResult<SendDriverAnnouncementOutput>(db, async (tx) => {
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
    const shareUrl = `https://nerede.servis/r/${srvCode}`;

    const announcementSnap = await tx.get(announcementRef);
    if (!announcementSnap.exists) {
      const dedupeKey = `announcement_dispatch_${announcementRef.id}`;
      await enqueueOutboxWithDedupe({
        tx,
        db,
        dedupeKey,
        dedupeData: {
          dedupeType: 'announcement_dispatch',
          announcementId: announcementRef.id,
          routeId: input.routeId,
          driverId: auth.uid,
          createdAt: nowIso,
          expiresAt: announcementDispatchDedupeExpiresAtIso,
        },
        outboxData: {
          type: 'driver_announcement_dispatch',
          announcementId: announcementRef.id,
          routeId: input.routeId,
          driverId: auth.uid,
          dedupeKey,
          status: 'pending',
          createdAt: nowIso,
        },
      });

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

    return {
      announcementId: announcementRef.id,
      fcmCount: 0,
      shareUrl,
    };
  });

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
  {
    ref: '/locations/{routeId}',
    region: 'europe-west1',
  },
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

    const lat = pickFiniteNumber(payload, 'lat');
    const lng = pickFiniteNumber(payload, 'lng');
    if (lat == null || lng == null) {
      return;
    }

    const nowMs = Date.now();
    const timestampMs = pickFiniteNumber(payload, 'timestamp') ?? nowMs;
    const isFreshLive =
      timestampMs >= nowMs - LIVE_LOCATION_MAX_AGE_MS &&
      timestampMs <= nowMs + LIVE_LOCATION_FUTURE_TOLERANCE_MS;
    const source = isFreshLive ? 'live' : 'offline_replay';
    const ingestedAtIso = new Date(nowMs).toISOString();

    const locationHistoryRef = tripRef.collection('location_history').doc();
    await locationHistoryRef.set({
      routeId,
      driverId: pickString(tripData, 'driverId') ?? '',
      lat,
      lng,
      accuracy: pickFiniteNumber(payload, 'accuracy') ?? 0,
      speed: pickFiniteNumber(payload, 'speed'),
      heading: pickFiniteNumber(payload, 'heading'),
      sampledAtMs: timestampMs,
      ingestedAt: ingestedAtIso,
      source,
    });

    if (!isFreshLive) {
      return;
    }

    await tripRef.set(
      {
        lastLocationAt: new Date(timestampMs).toISOString(),
        updatedAt: ingestedAtIso,
      },
      { merge: true },
    );
  },
);

export const abandonedTripGuard = onSchedule('every 10 minutes', async () => {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const staleCutoffIso = new Date(nowMs - ABANDONED_TRIP_STALE_WINDOW_MS).toISOString();
  const staleTripCandidatesSnap = await db
    .collection('trips')
    .where('status', '==', 'active')
    .where('lastLocationAt', '<=', staleCutoffIso)
    .limit(200)
    .get();

  const writerRevokeTargets = new Set<string>();

  for (const tripDoc of staleTripCandidatesSnap.docs) {
    await runTransactionVoid(db, async (tx) => {
      const tripRef = db.collection('trips').doc(tripDoc.id);
      const tripSnap = await tx.get(tripRef);
      if (!tripSnap.exists) {
        return;
      }

      const tripData = asRecord(tripSnap.data()) ?? {};
      if (pickString(tripData, 'status') !== 'active') {
        return;
      }

      const lastLocationAtIso = pickString(tripData, 'lastLocationAt');
      const lastLocationAtMs = parseIsoToMs(lastLocationAtIso);
      if (lastLocationAtMs == null || lastLocationAtMs > nowMs - ABANDONED_TRIP_STALE_WINDOW_MS) {
        return;
      }

      const routeId = pickString(tripData, 'routeId');
      const driverId = pickString(tripData, 'driverId');
      if (!routeId || !driverId) {
        return;
      }

      const nextTransitionVersion = readTransitionVersion(tripData) + 1;
      tx.update(tripRef, {
        status: 'abandoned',
        endedAt: nowIso,
        endReason: 'auto_abandoned',
        transitionVersion: nextTransitionVersion,
        updatedAt: nowIso,
      });

      writerRevokeTargets.add(`${routeId}:${driverId}`);
    });
  }

  if (writerRevokeTargets.size === 0) {
    return;
  }

  await Promise.all(
    Array.from(writerRevokeTargets.values()).map(async (target) => {
      const [routeId, driverId] = target.split(':', 2);
      if (!routeId || !driverId) {
        return;
      }
      await rtdb.ref(`routeWriters/${routeId}/${driverId}`).set(false);
    }),
  );
});

export const morningReminderDispatcher = onSchedule('every 1 minutes', async () => {
  const now = new Date();
  const nowIso = now.toISOString();
  const istanbulClock = getIstanbulClockInfo(now);
  if (!istanbulClock) {
    return;
  }

  const activeRoutesSnap = await db.collection('routes').where('isArchived', '==', false).get();
  for (const routeDoc of activeRoutesSnap.docs) {
    const routeData = asRecord(routeDoc.data()) ?? {};
    const scheduledTime = pickString(routeData, 'scheduledTime');
    const scheduledMinuteOfDay = parseHourMinuteToMinuteOfDay(scheduledTime);
    if (scheduledMinuteOfDay == null) {
      continue;
    }

    const targetMinuteOfDay =
      (scheduledMinuteOfDay - MORNING_REMINDER_LEAD_MINUTES + 24 * 60) % (24 * 60);
    if (istanbulClock.minuteOfDay !== targetMinuteOfDay) {
      continue;
    }

    const dedupeKey = `${routeDoc.id}_${istanbulClock.dateKey}_morning_reminder`;
    const dedupeExpiresAtIso = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    await runTransactionVoid(db, async (tx) => {
      await enqueueOutboxWithDedupe({
        tx,
        db,
        dedupeKey,
        dedupeData: {
          routeId: routeDoc.id,
          dateKey: istanbulClock.dateKey,
          reminderType: 'morning_reminder',
          createdAt: nowIso,
          expiresAt: dedupeExpiresAtIso,
        },
        outboxData: {
          type: 'morning_reminder',
          routeId: routeDoc.id,
          dateKey: istanbulClock.dateKey,
          scheduledTime,
          dedupeKey,
          status: 'pending',
          createdAt: nowIso,
        },
      });
    });
  }
});

export const guestSessionTtlEnforcer = onSchedule('every 5 minutes', async () => {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const expiredSessionCandidatesSnap = await db
    .collection('guest_sessions')
    .where('expiresAt', '<=', nowIso)
    .limit(CLEANUP_STALE_DATA_BATCH_LIMIT)
    .get();

  if (expiredSessionCandidatesSnap.empty) {
    return;
  }

  const revokeTargets = new Set<string>();
  const batch = db.batch();
  let updateCount = 0;

  for (const sessionDoc of expiredSessionCandidatesSnap.docs) {
    const sessionData = asRecord(sessionDoc.data()) ?? {};
    if (pickString(sessionData, 'status') !== 'active') {
      continue;
    }

    const routeId = pickString(sessionData, 'routeId');
    const guestUid = pickString(sessionData, 'guestUid');
    if (routeId && guestUid) {
      revokeTargets.add(`${routeId}:${guestUid}`);
    }

    batch.set(
      sessionDoc.ref,
      {
        status: 'expired',
        expiredAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
    updateCount += 1;
  }

  if (updateCount > 0) {
    await batch.commit();
  }

  if (revokeTargets.size === 0) {
    return;
  }

  await Promise.all(
    Array.from(revokeTargets.values()).map(async (target) => {
      const [routeId, guestUid] = target.split(':', 2);
      if (!routeId || !guestUid) {
        return;
      }
      await rtdb.ref(`guestReaders/${routeId}/${guestUid}`).set({
        active: false,
        expiresAtMs: 0,
        updatedAtMs: nowMs,
        revokedAtMs: nowMs,
        revokeReason: 'TTL_EXPIRED',
      });
    }),
  );
});

export const cleanupStaleData = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'Europe/Istanbul' },
  async () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayDateKey = buildIstanbulDateKey(now);
    const supportReportRetentionCutoffIso = new Date(
      now.getTime() - SUPPORT_REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const deleteByExpiresAt = async (collectionPath: string): Promise<void> => {
      const expiredDocsSnap = await db
        .collection(collectionPath)
        .where('expiresAt', '<=', nowIso)
        .limit(CLEANUP_STALE_DATA_BATCH_LIMIT)
        .get();
      if (expiredDocsSnap.empty) {
        return;
      }

      const batch = db.batch();
      for (const doc of expiredDocsSnap.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    };

    await deleteByExpiresAt('trip_requests');
    await deleteByExpiresAt('_notification_dedup');
    await deleteByExpiresAt('_writer_revoke_tasks');

    const expiredGuestSessionSnap = await db
      .collection('guest_sessions')
      .where('expiresAt', '<=', nowIso)
      .limit(CLEANUP_STALE_DATA_BATCH_LIMIT)
      .get();
    if (!expiredGuestSessionSnap.empty) {
      const batch = db.batch();
      let updateCount = 0;
      for (const sessionDoc of expiredGuestSessionSnap.docs) {
        const sessionData = asRecord(sessionDoc.data()) ?? {};
        if (pickString(sessionData, 'status') !== 'active') {
          continue;
        }
        batch.set(
          sessionDoc.ref,
          {
            status: 'expired',
            updatedAt: nowIso,
          },
          { merge: true },
        );
        updateCount += 1;
      }
      if (updateCount > 0) {
        await batch.commit();
      }
    }

    const staleSupportReportSnap = await db
      .collection('support_reports')
      .where('createdAt', '<=', supportReportRetentionCutoffIso)
      .limit(CLEANUP_STALE_DATA_BATCH_LIMIT)
      .get();
    if (!staleSupportReportSnap.empty) {
      const supportReportDeleteBatch = db.batch();
      for (const supportReportDoc of staleSupportReportSnap.docs) {
        supportReportDeleteBatch.delete(supportReportDoc.ref);
      }
      await supportReportDeleteBatch.commit();
    }

    const staleSkipRequestSnap = await db
      .collectionGroup('skip_requests')
      .where('dateKey', '<', todayDateKey)
      .limit(CLEANUP_STALE_DATA_BATCH_LIMIT)
      .get();
    if (!staleSkipRequestSnap.empty) {
      const staleSkipDeleteBatch = db.batch();
      for (const skipRequestDoc of staleSkipRequestSnap.docs) {
        staleSkipDeleteBatch.delete(skipRequestDoc.ref);
      }
      await staleSkipDeleteBatch.commit();
    }
  },
);

export const cleanupRouteWriters = onSchedule('every 5 minutes', async () => {
  const nowIso = new Date().toISOString();
  const pendingWriterRevokeTaskSnap = await db
    .collection('_writer_revoke_tasks')
    .where('status', '==', 'pending')
    .limit(CLEANUP_ROUTE_WRITER_TASK_BATCH_LIMIT)
    .get();

  for (const taskDoc of pendingWriterRevokeTaskSnap.docs) {
    const taskData = asRecord(taskDoc.data()) ?? {};
    const routeId = pickString(taskData, 'routeId');
    const driverId = pickString(taskData, 'driverId');

    if (!routeId || !driverId) {
      await taskDoc.ref.set(
        {
          status: 'invalid',
          updatedAt: nowIso,
          lastError: 'routeId/driverId eksik.',
        },
        { merge: true },
      );
      continue;
    }

    try {
      await rtdb.ref(`routeWriters/${routeId}/${driverId}`).set(false);
      await taskDoc.ref.set(
        {
          status: 'applied',
          appliedAt: nowIso,
          lastAttemptAt: nowIso,
          updatedAt: nowIso,
          lastError: null,
        },
        { merge: true },
      );
    } catch (error) {
      await taskDoc.ref.set(
        {
          status: 'pending',
          lastAttemptAt: nowIso,
          updatedAt: nowIso,
          lastError: toErrorMessage(error),
        },
        { merge: true },
      );
    }
  }

  const routeWritersSnap = await rtdb.ref('routeWriters').get();
  const enabledRouteWriters = collectEnabledRouteWriters(
    routeWritersSnap.val(),
    CLEANUP_ROUTE_WRITERS_SCAN_LIMIT,
  );
  for (const routeWriter of enabledRouteWriters) {
    const activeTripForWriterSnap = await db
      .collection('trips')
      .where('routeId', '==', routeWriter.routeId)
      .where('driverId', '==', routeWriter.driverId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (!activeTripForWriterSnap.empty) {
      continue;
    }

    await rtdb.ref(`routeWriters/${routeWriter.routeId}/${routeWriter.driverId}`).set(false);
  }
});
