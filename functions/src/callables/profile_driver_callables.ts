import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { enqueueOutboxWithDedupe } from '../common/notification_dedupe.js';
import {
  isAnonymousProvider,
  readRole,
  resolvePreferredRole,
} from '../common/index_domain_helpers.js';
import type {
  BootstrapUserProfileOutput,
  RegisterDeviceOutput,
  RequestDriverAccessOutput,
  UpdateUserProfileOutput,
  UpsertConsentOutput,
  UpsertDriverProfileOutput,
} from '../common/output_contract_types.js';
import { pickString } from '../common/runtime_value_helpers.js';
import { runTransactionVoid } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { requireDriverProfile } from '../middleware/driver_profile_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface ProfileInput {
  displayName: string;
  phone?: string;
  photoUrl?: string;
  photoPath?: string;
  preferredRole?: 'driver' | 'passenger';
}

interface UpsertConsentInput {
  privacyVersion: string;
  kvkkTextVersion: string;
  locationConsent: boolean;
  platform: 'android' | 'ios';
}

interface UpsertDriverProfileInput {
  name: string;
  phone: string;
  plate: string;
  showPhoneToPassengers: boolean;
  photoUrl?: string;
  photoPath?: string;
  companyId?: string | null;
}

interface RegisterDeviceInput {
  deviceId: string;
  activeDeviceToken: string;
  lastSeenAt?: string;
}

export function createProfileDriverCallables({
  db,
  profileInputSchema,
  upsertConsentInputSchema,
  upsertDriverProfileInputSchema,
  registerDeviceInputSchema,
  deviceSwitchNoticeDedupeTtlDays,
}: {
  db: Firestore;
  profileInputSchema: ZodType<unknown>;
  upsertConsentInputSchema: ZodType<unknown>;
  upsertDriverProfileInputSchema: ZodType<unknown>;
  registerDeviceInputSchema: ZodType<unknown>;
  deviceSwitchNoticeDedupeTtlDays: number;
}) {
  const bootstrapUserProfile = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    const input = validateInput(profileInputSchema, request.data) as ProfileInput;

    const nowIso = new Date().toISOString();
    const userRef = db.collection('users').doc(auth.uid);
    const userSnap = await userRef.get();
    const existing = asRecord(userSnap.data());

    const existingRole = readRole(existing?.role);
    const resolvedRole = resolvePreferredRole({
      existingRole,
      preferredRole: input.preferredRole,
      anonymous: isAnonymousProvider(auth.token),
    });

    const existingCreatedAt = pickString(existing, 'createdAt');
    const existingPhotoUrl = pickString(existing, 'photoUrl');
    const existingPhotoPath = pickString(existing, 'photoPath');
    const emailClaim = auth.token.email;
    const email = typeof emailClaim === 'string' ? emailClaim : null;

    await userRef.set(
      {
        role: resolvedRole,
        displayName: input.displayName,
        phone: input.phone ?? null,
        photoUrl: input.photoUrl ?? existingPhotoUrl ?? null,
        photoPath: input.photoPath ?? existingPhotoPath ?? null,
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

  const updateUserProfile = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    const input = validateInput(profileInputSchema, request.data) as ProfileInput;

    const nowIso = new Date().toISOString();
    const userRef = db.collection('users').doc(auth.uid);
    const userSnap = await userRef.get();
    const existing = asRecord(userSnap.data());

    const existingRole = readRole(existing?.role);
    const resolvedRole = resolvePreferredRole({
      existingRole,
      preferredRole: input.preferredRole,
      anonymous: isAnonymousProvider(auth.token),
    });
    const existingCreatedAt = pickString(existing, 'createdAt');
    const existingEmail = pickString(existing, 'email');
    const existingPhotoUrl = pickString(existing, 'photoUrl');
    const existingPhotoPath = pickString(existing, 'photoPath');
    const tokenEmail = auth.token.email;
    const resolvedEmail = existingEmail ?? (typeof tokenEmail === 'string' ? tokenEmail : null);

    await userRef.set(
      {
        role: resolvedRole,
        displayName: input.displayName,
        phone: input.phone ?? pickString(existing, 'phone'),
        photoUrl: input.photoUrl ?? existingPhotoUrl ?? null,
        photoPath: input.photoPath ?? existingPhotoPath ?? null,
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

  const upsertConsent = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const input = validateInput(upsertConsentInputSchema, request.data) as UpsertConsentInput;
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

  const requestDriverAccess = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const nowIso = new Date().toISOString();
    const userRef = db.collection('users').doc(auth.uid);
    const userSnap = await userRef.get();
    const existing = asRecord(userSnap.data());
    const existingRole = readRole(existing?.role);

    if (existingRole === 'driver') {
      return apiOk<RequestDriverAccessOutput>({
        status: 'already_driver',
        requestedAt: null,
      });
    }

    const requestRef = db.collection('_driver_access_requests').doc(auth.uid);
    const tokenEmail = auth.token.email;
    const resolvedEmail =
      pickString(existing, 'email') ?? (typeof tokenEmail === 'string' ? tokenEmail : null);
    const resolvedDisplayName =
      pickString(existing, 'displayName') ??
      (typeof auth.token.name === 'string' ? auth.token.name : null) ??
      '';
    const resolvedPhone = pickString(existing, 'phone');

    await requestRef.set(
      {
        uid: auth.uid,
        status: 'pending',
        requestedAt: nowIso,
        updatedAt: nowIso,
        displayName: resolvedDisplayName,
        email: resolvedEmail,
        phone: resolvedPhone,
        roleAtRequest: existingRole ?? 'passenger',
        source: 'mobile',
      },
      { merge: true },
    );

    await userRef.set(
      {
        role: existingRole ?? 'passenger',
        driverAccessRequest: {
          status: 'pending',
          requestedAt: nowIso,
          updatedAt: nowIso,
        },
        updatedAt: nowIso,
      },
      { merge: true },
    );

    return apiOk<RequestDriverAccessOutput>({
      status: 'pending',
      requestedAt: nowIso,
    });
  });

  const upsertDriverProfile = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });

    const input = validateInput(upsertDriverProfileInputSchema, request.data) as UpsertDriverProfileInput;
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
    const existingPhotoUrl = pickString(existing, 'photoUrl');
    const existingPhotoPath = pickString(existing, 'photoPath');

    await driverRef.set(
      {
        name: input.name,
        phone: input.phone,
        plate: input.plate,
        showPhoneToPassengers: input.showPhoneToPassengers,
        photoUrl: input.photoUrl ?? existingPhotoUrl ?? null,
        photoPath: input.photoPath ?? existingPhotoPath ?? null,
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

  const registerDevice = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);

    const input = validateInput(registerDeviceInputSchema, request.data) as RegisterDeviceInput;
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const deviceSwitchNoticeDedupeExpiresAtIso = new Date(
      nowMs + deviceSwitchNoticeDedupeTtlDays * 24 * 60 * 60 * 1000,
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

  return {
    bootstrapUserProfile,
    updateUserProfile,
    upsertConsent,
    requestDriverAccess,
    upsertDriverProfile,
    registerDevice,
  };
}


