import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { z } from 'zod';

import { apiOk } from './common/api_response.js';
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
