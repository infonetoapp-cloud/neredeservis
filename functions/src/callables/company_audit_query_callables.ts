import { createHash } from 'node:crypto';

import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type { UpdateCompanyAdminTenantStateOutput } from '../common/output_contract_types.js';
import { parseIsoToMs, pickString } from '../common/runtime_value_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';

interface ListCompanyAuditLogsInput {
  companyId: string;
}

interface GetCompanyAdminTenantStateInput {
  companyId: string;
}

interface UpdateCompanyAdminTenantStateInput {
  companyId: string;
  patch: {
    companyStatus?: 'active' | 'suspended' | 'archived';
    billingStatus?: 'active' | 'past_due' | 'suspended_locked';
    billingValidUntil?: string | null;
    reason?: string;
  };
}

interface CompanyAuditLogItem {
  auditId: string;
  companyId: string;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  actorUid: string | null;
  status: string;
  reason: string | null;
  createdAt: string | null;
}

interface ListCompanyAuditLogsOutput {
  items: CompanyAuditLogItem[];
}

interface GetCompanyAdminTenantStateOutput {
  companyId: string;
  companyStatus: 'active' | 'suspended' | 'archived' | 'unknown';
  billingStatus: 'active' | 'past_due' | 'suspended_locked' | 'unknown';
  billingValidUntil: string | null;
  updatedAt: string | null;
  createdAt: string | null;
}

function readCompanyStatus(value: string | null): GetCompanyAdminTenantStateOutput['companyStatus'] {
  if (value === 'active' || value === 'suspended' || value === 'archived') {
    return value;
  }
  return 'unknown';
}

function readBillingStatus(value: string | null): GetCompanyAdminTenantStateOutput['billingStatus'] {
  if (value === 'active' || value === 'past_due' || value === 'suspended_locked') {
    return value;
  }
  return 'unknown';
}

function ensureAuditReadRole(role: CompanyMemberRole): void {
  if (role === 'owner' || role === 'admin') return;
  throw new HttpsError('permission-denied', 'Audit kayitlarini gormek icin owner/admin yetkisi gerekir.');
}

export function createCompanyAuditQueryCallables({
  db,
  listCompanyAuditLogsInputSchema,
  updateCompanyAdminTenantStateInputSchema,
  requireActiveCompanyMemberRole,
}: {
  db: Firestore;
  listCompanyAuditLogsInputSchema: ZodType<unknown>;
  updateCompanyAdminTenantStateInputSchema: ZodType<unknown>;
  requireActiveCompanyMemberRole: (companyId: string, uid: string) => Promise<CompanyMemberRole>;
}) {
  const listCompanyAuditLogs = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listCompanyAuditLogsInputSchema,
      request.data,
    ) as ListCompanyAuditLogsInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    ensureAuditReadRole(actorRole);

    const auditSnap = await db
      .collection('audit_logs')
      .where('companyId', '==', input.companyId)
      .limit(200)
      .get();

    const items = auditSnap.docs
      .map((doc) => {
        const data = asRecord(doc.data()) ?? {};
        const eventType = pickString(data, 'eventType');
        if (!eventType) {
          return null;
        }
        return {
          auditId: doc.id,
          companyId: input.companyId,
          eventType,
          targetType: pickString(data, 'targetType'),
          targetId: pickString(data, 'targetId'),
          actorUid: pickString(data, 'actorUid'),
          status: pickString(data, 'status') ?? 'unknown',
          reason: pickString(data, 'reason'),
          createdAt: pickString(data, 'createdAt'),
        } satisfies CompanyAuditLogItem;
      })
      .filter((item): item is CompanyAuditLogItem => item !== null)
      .sort((a, b) => {
        const aTime = parseIsoToMs(a.createdAt) ?? 0;
        const bTime = parseIsoToMs(b.createdAt) ?? 0;
        return bTime - aTime;
      })
      .slice(0, 60);

    return apiOk<ListCompanyAuditLogsOutput>({ items });
  });

  const getCompanyAdminTenantState = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listCompanyAuditLogsInputSchema,
      request.data,
    ) as GetCompanyAdminTenantStateInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    ensureAuditReadRole(actorRole);

    const companySnap = await db.collection('companies').doc(input.companyId).get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Firma bulunamadi.');
    }

    const companyData = asRecord(companySnap.data()) ?? {};
    return apiOk<GetCompanyAdminTenantStateOutput>({
      companyId: input.companyId,
      companyStatus: readCompanyStatus(pickString(companyData, 'status')),
      billingStatus: readBillingStatus(pickString(companyData, 'billingStatus')),
      billingValidUntil: pickString(companyData, 'billingValidUntil'),
      updatedAt: pickString(companyData, 'updatedAt'),
      createdAt: pickString(companyData, 'createdAt'),
    });
  });

  const updateCompanyAdminTenantState = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      updateCompanyAdminTenantStateInputSchema,
      request.data,
    ) as UpdateCompanyAdminTenantStateInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    ensureAuditReadRole(actorRole);
    const nowIso = new Date().toISOString();
    const companyRef = db.collection('companies').doc(input.companyId);

    const updated = await db.runTransaction(async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      const companyData = asRecord(companySnap.data()) ?? {};
      const currentCompanyStatus = readCompanyStatus(pickString(companyData, 'status'));
      const currentBillingStatus = readBillingStatus(pickString(companyData, 'billingStatus'));
      const currentBillingValidUntil = pickString(companyData, 'billingValidUntil');

      const patchPayload: Record<string, unknown> = {
        updatedAt: nowIso,
        updatedBy: auth.uid,
      };
      const changedFields: string[] = [];

      if ('companyStatus' in input.patch && input.patch.companyStatus) {
        if (currentCompanyStatus !== input.patch.companyStatus) {
          patchPayload.status = input.patch.companyStatus;
          changedFields.push('companyStatus');
        }
      }
      if ('billingStatus' in input.patch && input.patch.billingStatus) {
        if (currentBillingStatus !== input.patch.billingStatus) {
          patchPayload.billingStatus = input.patch.billingStatus;
          changedFields.push('billingStatus');
        }
      }
      if ('billingValidUntil' in input.patch) {
        const nextBillingValidUntil = input.patch.billingValidUntil ?? null;
        if ((currentBillingValidUntil ?? null) !== nextBillingValidUntil) {
          patchPayload.billingValidUntil = nextBillingValidUntil;
          changedFields.push('billingValidUntil');
        }
      }

      if (changedFields.length === 0) {
        throw new HttpsError('invalid-argument', 'TENANT_STATE_NO_CHANGES');
      }

      tx.update(companyRef, patchPayload);
      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_tenant_state_updated',
        targetType: 'company',
        targetId: input.companyId,
        status: 'success',
        reason: null,
        metadata: {
          actorRole,
          changedFields,
          patchReason: input.patch.reason ?? null,
          previous: {
            companyStatus: currentCompanyStatus,
            billingStatus: currentBillingStatus,
            billingValidUntil: currentBillingValidUntil ?? null,
          },
          next: {
            companyStatus: patchPayload.status ?? currentCompanyStatus,
            billingStatus: patchPayload.billingStatus ?? currentBillingStatus,
            billingValidUntil:
              patchPayload.billingValidUntil === undefined
                ? currentBillingValidUntil ?? null
                : patchPayload.billingValidUntil,
          },
        },
        requestId: createHash('sha256')
          .update(`updateCompanyAdminTenantState:${auth.uid}:${input.companyId}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        companyId: input.companyId,
        companyStatus: readCompanyStatus(
          typeof patchPayload.status === 'string' ? patchPayload.status : currentCompanyStatus,
        ),
        billingStatus: readBillingStatus(
          typeof patchPayload.billingStatus === 'string'
            ? patchPayload.billingStatus
            : currentBillingStatus,
        ),
        billingValidUntil:
          patchPayload.billingValidUntil === undefined
            ? currentBillingValidUntil ?? null
            : (patchPayload.billingValidUntil as string | null),
        updatedAt: nowIso,
        changedFields,
      } satisfies UpdateCompanyAdminTenantStateOutput;
    });

    return apiOk<UpdateCompanyAdminTenantStateOutput>(updated);
  });

  return { listCompanyAuditLogs, getCompanyAdminTenantState, updateCompanyAdminTenantState };
}
