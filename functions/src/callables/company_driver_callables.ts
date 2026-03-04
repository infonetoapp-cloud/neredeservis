import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { pickString } from '../common/runtime_value_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';

/* ------------------------------------------------------------------ */
/*  Types – matching input schemas                                    */
/* ------------------------------------------------------------------ */

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';

interface CreateCompanyDriverAccountInput {
  companyId: string;
  name: string;
  phone?: string;
  plate?: string;
  loginEmail?: string;
  temporaryPassword?: string;
}

interface AssignCompanyDriverToRouteInput {
  companyId: string;
  driverId: string;
  routeId: string;
}

interface UnassignCompanyDriverFromRouteInput {
  companyId: string;
  driverId: string;
  routeId: string;
}

interface UpdateCompanyDriverStatusInput {
  companyId: string;
  driverId: string;
  status: 'active' | 'passive';
}

/* ------------------------------------------------------------------ */
/*  Factory                                                           */
/* ------------------------------------------------------------------ */

export function createCompanyDriverCallables({
  db,
  createCompanyDriverAccountInputSchema,
  assignCompanyDriverToRouteInputSchema,
  unassignCompanyDriverFromRouteInputSchema,
  updateCompanyDriverStatusInputSchema,
  requireActiveCompanyMemberRole,
}: {
  db: Firestore;
  createCompanyDriverAccountInputSchema: ZodType<unknown>;
  assignCompanyDriverToRouteInputSchema: ZodType<unknown>;
  unassignCompanyDriverFromRouteInputSchema: ZodType<unknown>;
  updateCompanyDriverStatusInputSchema: ZodType<unknown>;
  requireActiveCompanyMemberRole: (companyId: string, uid: string) => Promise<CompanyMemberRole>;
}) {
  /* ---------- helper: require write role ---------- */
  function requireDriverWriteRole(role: CompanyMemberRole): void {
    if (role === 'owner' || role === 'admin' || role === 'dispatcher') {
      return;
    }
    throw new HttpsError('permission-denied', 'Bu islem icin sofor yazma yetkisi gerekli.');
  }

  /* ---------- helper: generate safe password ---------- */
  function generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /* ---------- helper: generate login email ---------- */
  function generateLoginEmail(name: string, companyId: string): string {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${slug}${suffix}@driver.neredeservis.app`;
  }

  /* ─── createCompanyDriverAccount ─── */
  const createCompanyDriverAccount = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      createCompanyDriverAccountInputSchema,
      request.data,
    ) as CreateCompanyDriverAccountInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireDriverWriteRole(memberRole);

    const name = input.name.trim();
    const phone = input.phone?.trim() || null;
    const plate = input.plate?.trim().toUpperCase().replace(/\s+/g, '') || null;
    const loginEmail = input.loginEmail?.trim() || generateLoginEmail(name, input.companyId);
    const temporaryPassword = input.temporaryPassword?.trim() || generateSecurePassword();

    // 1. Create Firebase Auth user
    let uid: string;
    try {
      const userRecord = await getAuth().createUser({
        email: loginEmail,
        password: temporaryPassword,
        displayName: name,
        disabled: false,
      });
      uid = userRecord.uid;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Firebase Auth kullanici olusturulamadi.';
      throw new HttpsError('already-exists', `Sofor hesabi olusturulamadi: ${msg}`);
    }

    // 2. Create Firestore driver document
    const now = new Date().toISOString();
    const driverData: Record<string, unknown> = {
      name,
      companyId: input.companyId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: auth.uid,
    };
    if (phone) driverData.phone = phone;
    if (plate) driverData.plate = plate;

    await db.collection('drivers').doc(uid).set(driverData);

    // 3. Set custom claims for mobile-only driver
    try {
      await getAuth().setCustomUserClaims(uid, { mobileDriver: true });
    } catch {
      // Non-critical — silently continue
    }

    return apiOk({
      credentials: {
        driverId: uid,
        name,
        loginEmail,
        temporaryPassword,
        mobileOnly: true,
        createdAt: now,
      },
    });
  });

  /* ─── assignCompanyDriverToRoute ─── */
  const assignCompanyDriverToRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      assignCompanyDriverToRouteInputSchema,
      request.data,
    ) as AssignCompanyDriverToRouteInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireDriverWriteRole(memberRole);

    // Verify driver exists and belongs to this company
    const driverSnap = await db.collection('drivers').doc(input.driverId).get();
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Sofor bulunamadi.');
    }
    const driverData = asRecord(driverSnap.data()) ?? {};
    if (pickString(driverData, 'companyId') !== input.companyId) {
      throw new HttpsError('permission-denied', 'Sofor bu sirkete ait degil.');
    }

    // Verify route exists, belongs to this company, and is not archived
    const routeSnap = await db.collection('routes').doc(input.routeId).get();
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Rota bulunamadi.');
    }
    const routeData = asRecord(routeSnap.data()) ?? {};
    if (pickString(routeData, 'companyId') !== input.companyId) {
      throw new HttpsError('permission-denied', 'Rota bu sirkete ait degil.');
    }
    if (routeData.isArchived === true) {
      throw new HttpsError('failed-precondition', 'Arsivlenmis rotaya sofor atanamaz.');
    }

    // Add to authorizedDriverIds (and set as primary if none)
    const updates: Record<string, unknown> = {
      authorizedDriverIds: FieldValue.arrayUnion(input.driverId),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.uid,
    };
    const currentPrimary = pickString(routeData, 'driverId');
    if (!currentPrimary) {
      updates.driverId = input.driverId;
    }

    await db.collection('routes').doc(input.routeId).update(updates);

    return apiOk({ route: { routeId: input.routeId } });
  });

  /* ─── unassignCompanyDriverFromRoute ─── */
  const unassignCompanyDriverFromRoute = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      unassignCompanyDriverFromRouteInputSchema,
      request.data,
    ) as UnassignCompanyDriverFromRouteInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireDriverWriteRole(memberRole);

    // Verify route exists and belongs to company
    const routeSnap = await db.collection('routes').doc(input.routeId).get();
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Rota bulunamadi.');
    }
    const routeData = asRecord(routeSnap.data()) ?? {};
    if (pickString(routeData, 'companyId') !== input.companyId) {
      throw new HttpsError('permission-denied', 'Rota bu sirkete ait degil.');
    }

    // Remove from authorizedDriverIds
    const updates: Record<string, unknown> = {
      authorizedDriverIds: FieldValue.arrayRemove(input.driverId),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.uid,
    };

    // If this was the primary driver, clear it
    const currentPrimary = pickString(routeData, 'driverId');
    if (currentPrimary === input.driverId) {
      updates.driverId = null;
    }

    await db.collection('routes').doc(input.routeId).update(updates);

    return apiOk({ route: { routeId: input.routeId } });
  });

  /* ─── updateCompanyDriverStatus ─── */
  const updateCompanyDriverStatus = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      updateCompanyDriverStatusInputSchema,
      request.data,
    ) as UpdateCompanyDriverStatusInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireDriverWriteRole(memberRole);

    // Verify driver exists and belongs to this company
    const driverSnap = await db.collection('drivers').doc(input.driverId).get();
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Sofor bulunamadi.');
    }
    const driverData = asRecord(driverSnap.data()) ?? {};
    if (pickString(driverData, 'companyId') !== input.companyId) {
      throw new HttpsError('permission-denied', 'Sofor bu sirkete ait degil.');
    }

    await db.collection('drivers').doc(input.driverId).update({
      status: input.status,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.uid,
    });

    return apiOk({ driverId: input.driverId, status: input.status });
  });

  return {
    createCompanyDriverAccount,
    assignCompanyDriverToRoute,
    unassignCompanyDriverFromRoute,
    updateCompanyDriverStatus,
  };
}
