import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { pickString, pickFiniteNumber } from '../common/runtime_value_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import type {
  GetCompanyProfileOutput,
  UpdateCompanyProfileOutput,
} from '../common/output_contract_types.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';

interface GetCompanyProfileInput {
  companyId: string;
}

interface UpdateCompanyProfileInput {
  companyId: string;
  name?: string;
  logoUrl?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function requireOwnerOrAdmin(role: CompanyMemberRole): void {
  if (role !== 'owner' && role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Bu islem icin owner veya admin rolu gereklidir.',
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

export function createCompanySettingsCallables({
  db,
  getCompanyProfileInputSchema,
  updateCompanyProfileInputSchema,
  requireActiveCompanyMemberRole,
}: {
  db: Firestore;
  getCompanyProfileInputSchema: ZodType;
  updateCompanyProfileInputSchema: ZodType;
  requireActiveCompanyMemberRole: (
    companyId: string,
    uid: string,
  ) => Promise<CompanyMemberRole>;
}) {
  /* ─── getCompanyProfile ─── */
  const getCompanyProfile = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      getCompanyProfileInputSchema,
      request.data,
    ) as GetCompanyProfileInput;

    // Any active member can read (page is already role-guarded on frontend)
    await requireActiveCompanyMemberRole(input.companyId, auth.uid);

    const companyRef = db.collection('companies').doc(input.companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Sirket bulunamadi.');
    }
    const data = asRecord(companySnap.data()) ?? {};

    return apiOk<GetCompanyProfileOutput>({
      companyId: input.companyId,
      name: pickString(data, 'name') ?? '',
      logoUrl: pickString(data, 'logoUrl') ?? null,
      contactEmail: pickString(data, 'contactEmail') ?? null,
      contactPhone: pickString(data, 'contactPhone') ?? null,
      address: pickString(data, 'address') ?? null,
      timezone: pickString(data, 'timezone') ?? 'Europe/Istanbul',
      countryCode: pickString(data, 'countryCode') ?? 'TR',
      status: pickString(data, 'status') ?? 'active',
      vehicleLimit: pickFiniteNumber(data, 'vehicleLimit') ?? 10,
      createdAt: pickString(data, 'createdAt') ?? null,
    });
  });

  /* ─── updateCompanyProfile ─── */
  const updateCompanyProfile = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      updateCompanyProfileInputSchema,
      request.data,
    ) as UpdateCompanyProfileInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireOwnerOrAdmin(memberRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Sirket bulunamadi.');
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    const changedFields: string[] = [];

    if (input.name !== undefined) {
      updates.name = input.name;
      changedFields.push('name');
    }
    if (input.logoUrl !== undefined) {
      updates.logoUrl = input.logoUrl || null;
      changedFields.push('logoUrl');
    }

    if (changedFields.length === 0) {
      throw new HttpsError('invalid-argument', 'En az bir alan guncellenmelidir.');
    }

    await companyRef.update(updates);

    return apiOk<UpdateCompanyProfileOutput>({
      companyId: input.companyId,
      changedFields,
      updatedAt: now,
    });
  });

  return {
    getCompanyProfile,
    updateCompanyProfile,
  };
}
