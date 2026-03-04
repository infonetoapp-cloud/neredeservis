import { createHash } from 'node:crypto';

import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import type {
  AcceptCompanyInviteOutput,
  DeclineCompanyInviteOutput,
  InviteCompanyMemberOutput,
  RemoveCompanyMemberOutput,
  RevokeCompanyInviteOutput,
  UpdateCompanyMemberOutput,
} from '../common/output_contract_types.js';
import { pickString } from '../common/runtime_value_helpers.js';
import { runTransactionWithResult } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';
type CompanyMemberStatus = 'active' | 'invited' | 'suspended';
type InviteCompanyMemberRole = 'admin' | 'dispatcher' | 'viewer';

interface InviteCompanyMemberInput {
  companyId: string;
  email: string;
  role: InviteCompanyMemberRole;
}

interface AcceptCompanyInviteInput {
  companyId: string;
}

interface DeclineCompanyInviteInput {
  companyId: string;
}

interface UpdateCompanyMemberInput {
  companyId: string;
  memberUid: string;
  patch: {
    role?: CompanyMemberRole;
    memberStatus?: CompanyMemberStatus;
  };
}

interface RemoveCompanyMemberInput {
  companyId: string;
  memberUid: string;
}

interface RevokeCompanyInviteInput {
  companyId: string;
  inviteId: string;
}

function ensureMemberManageRole(actorRole: CompanyMemberRole): void {
  if (actorRole === 'owner' || actorRole === 'admin') return;
  throw new HttpsError('permission-denied', 'Bu islem icin member yonetim yetkisi gerekli.');
}

function assertMemberRole(value: string | null): CompanyMemberRole {
  if (value === 'owner' || value === 'admin' || value === 'dispatcher' || value === 'viewer') {
    return value;
  }
  throw new HttpsError('failed-precondition', 'COMPANY_MEMBER_ROLE_INVALID');
}

function assertMemberStatus(value: string | null): CompanyMemberStatus {
  if (value === 'active' || value === 'invited' || value === 'suspended') {
    return value;
  }
  throw new HttpsError('failed-precondition', 'COMPANY_MEMBER_STATUS_INVALID');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function createCompanyMemberMutationCallables({
  db,
  inviteCompanyMemberInputSchema,
  acceptCompanyInviteInputSchema,
  declineCompanyInviteInputSchema,
  updateCompanyMemberInputSchema,
  removeCompanyMemberInputSchema,
  revokeCompanyInviteInputSchema,
  requireActiveCompanyMemberRole,
}: {
  db: Firestore;
  inviteCompanyMemberInputSchema: ZodType<unknown>;
  acceptCompanyInviteInputSchema: ZodType<unknown>;
  declineCompanyInviteInputSchema: ZodType<unknown>;
  updateCompanyMemberInputSchema: ZodType<unknown>;
  removeCompanyMemberInputSchema: ZodType<unknown>;
  revokeCompanyInviteInputSchema: ZodType<unknown>;
  requireActiveCompanyMemberRole: (companyId: string, uid: string) => Promise<CompanyMemberRole>;
}) {
  const inviteCompanyMember = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      inviteCompanyMemberInputSchema,
      request.data,
    ) as InviteCompanyMemberInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    ensureMemberManageRole(actorRole);
    if (actorRole === 'admin' && input.role === 'admin') {
      throw new HttpsError('permission-denied', 'Admin rolunde kullanici admin daveti gonderemez.');
    }

    const normalizedEmail = normalizeEmail(input.email);
    let targetUid = '';
    try {
      const targetUser = await getAuth().getUserByEmail(normalizedEmail);
      targetUid = targetUser.uid;
    } catch (error) {
      const errorCode = (error as { code?: string } | null)?.code ?? '';
      if (errorCode === 'auth/user-not-found') {
        throw new HttpsError(
          'failed-precondition',
          'INVITE_EMAIL_NOT_FOUND: Bu e-posta ile kayitli kullanici bulunamadi.',
        );
      }
      throw error;
    }
    if (targetUid === auth.uid) {
      throw new HttpsError('failed-precondition', 'SELF_INVITE_FORBIDDEN');
    }

    const companyRef = db.collection('companies').doc(input.companyId);
    const memberRef = companyRef.collection('members').doc(targetUid);
    const userMembershipRef = db
      .collection('users')
      .doc(targetUid)
      .collection('company_memberships')
      .doc(input.companyId);
    const inviteRef = companyRef.collection('member_invites').doc();
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invited = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, memberSnap] = await Promise.all([tx.get(companyRef), tx.get(memberRef)]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }

      const companyData = asRecord(companySnap.data()) ?? {};
      const companyName = pickString(companyData, 'name');
      const companyStatus = pickString(companyData, 'status') ?? 'active';

      let previousRole: CompanyMemberRole | null = null;
      let previousMemberStatus: CompanyMemberStatus | null = null;
      if (memberSnap.exists) {
        const memberData = asRecord(memberSnap.data()) ?? {};
        previousRole = assertMemberRole(pickString(memberData, 'role'));
        previousMemberStatus = assertMemberStatus(pickString(memberData, 'status'));
        if (previousRole === 'owner') {
          throw new HttpsError('failed-precondition', 'OWNER_MEMBER_IMMUTABLE');
        }
        if (previousMemberStatus === 'active') {
          throw new HttpsError('already-exists', 'Bu kullanici zaten aktif company uyesi.');
        }
      }

      const memberPatch: Record<string, unknown> = {
        companyId: input.companyId,
        uid: targetUid,
        role: input.role,
        status: 'invited',
        permissions: null,
        invitedBy: auth.uid,
        invitedAt: nowIso,
        acceptedAt: null,
        updatedAt: nowIso,
      };
      if (!memberSnap.exists) {
        memberPatch.createdAt = nowIso;
      }
      tx.set(memberRef, memberPatch, { merge: true });
      tx.set(
        userMembershipRef,
        {
          companyId: input.companyId,
          uid: targetUid,
          role: input.role,
          status: 'invited',
          companyName: companyName ?? null,
          companyStatus,
          invitedAt: nowIso,
          acceptedAt: null,
          updatedAt: nowIso,
          createdAt: nowIso,
        },
        { merge: true },
      );
      tx.set(inviteRef, {
        companyId: input.companyId,
        inviteId: inviteRef.id,
        invitedUid: targetUid,
        invitedEmail: normalizedEmail,
        role: input.role,
        status: 'pending',
        invitedBy: auth.uid,
        createdAt: nowIso,
        updatedAt: nowIso,
        expiresAt: expiresAtIso,
      });

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_member_invited',
        targetType: 'company_member',
        targetId: targetUid,
        status: 'success',
        reason: null,
        metadata: {
          actorRole,
          role: input.role,
          invitedEmail: normalizedEmail,
          previousRole,
          previousMemberStatus,
          expiresAt: expiresAtIso,
        },
        requestId: createHash('sha256')
          .update(`inviteCompanyMember:${auth.uid}:${input.companyId}:${targetUid}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        companyId: input.companyId,
        inviteId: inviteRef.id,
        memberUid: targetUid,
        invitedEmail: normalizedEmail,
        role: input.role,
        status: 'pending',
        expiresAt: expiresAtIso,
        createdAt: nowIso,
      } satisfies InviteCompanyMemberOutput;
    });

    return apiOk<InviteCompanyMemberOutput>(invited);
  });

  const acceptCompanyInvite = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      acceptCompanyInviteInputSchema,
      request.data,
    ) as AcceptCompanyInviteInput;

    const companyRef = db.collection('companies').doc(input.companyId);
    const memberRef = companyRef.collection('members').doc(auth.uid);
    const userMembershipRef = db
      .collection('users')
      .doc(auth.uid)
      .collection('company_memberships')
      .doc(input.companyId);
    const nowIso = new Date().toISOString();

    const accepted = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, memberSnap] = await Promise.all([tx.get(companyRef), tx.get(memberRef)]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      if (!memberSnap.exists) {
        throw new HttpsError('not-found', 'Bu firma icin bekleyen davet bulunamadi.');
      }

      const memberData = asRecord(memberSnap.data()) ?? {};
      const currentRole = assertMemberRole(pickString(memberData, 'role'));
      const currentMemberStatus = assertMemberStatus(pickString(memberData, 'status'));
      const acceptedAt = pickString(memberData, 'acceptedAt') ?? nowIso;
      if (currentMemberStatus === 'active') {
        return {
          companyId: input.companyId,
          memberUid: auth.uid,
          role: currentRole,
          memberStatus: 'active',
          acceptedAt,
        } satisfies AcceptCompanyInviteOutput;
      }
      if (currentMemberStatus !== 'invited') {
        throw new HttpsError('failed-precondition', 'INVITE_NOT_ACCEPTABLE');
      }

      tx.set(
        memberRef,
        {
          status: 'active',
          acceptedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );
      tx.set(
        userMembershipRef,
        {
          companyId: input.companyId,
          uid: auth.uid,
          role: currentRole,
          status: 'active',
          acceptedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );

      const invitesSnap = await tx.get(
        companyRef.collection('member_invites').where('invitedUid', '==', auth.uid).limit(50),
      );
      invitesSnap.docs.forEach((doc) => {
        const data = asRecord(doc.data()) ?? {};
        if (pickString(data, 'status') !== 'pending') {
          return;
        }
        tx.set(
          doc.ref,
          {
            status: 'accepted',
            acceptedAt: nowIso,
            acceptedBy: auth.uid,
            updatedAt: nowIso,
          },
          { merge: true },
        );
      });

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_member_invite_accepted',
        targetType: 'company_member',
        targetId: auth.uid,
        status: 'success',
        reason: null,
        metadata: {
          role: currentRole,
        },
        requestId: createHash('sha256')
          .update(`acceptCompanyInvite:${auth.uid}:${input.companyId}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        companyId: input.companyId,
        memberUid: auth.uid,
        role: currentRole,
        memberStatus: 'active',
        acceptedAt: nowIso,
      } satisfies AcceptCompanyInviteOutput;
    });

    return apiOk<AcceptCompanyInviteOutput>(accepted);
  });

  const declineCompanyInvite = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      declineCompanyInviteInputSchema,
      request.data,
    ) as DeclineCompanyInviteInput;

    const companyRef = db.collection('companies').doc(input.companyId);
    const memberRef = companyRef.collection('members').doc(auth.uid);
    const userMembershipRef = db
      .collection('users')
      .doc(auth.uid)
      .collection('company_memberships')
      .doc(input.companyId);
    const nowIso = new Date().toISOString();

    const declined = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, memberSnap] = await Promise.all([tx.get(companyRef), tx.get(memberRef)]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      if (!memberSnap.exists) {
        throw new HttpsError('not-found', 'Bu firma icin bekleyen davet bulunamadi.');
      }

      const memberData = asRecord(memberSnap.data()) ?? {};
      const currentRole = assertMemberRole(pickString(memberData, 'role'));
      const currentMemberStatus = assertMemberStatus(pickString(memberData, 'status'));
      const declinedAt =
        pickString(memberData, 'declinedAt') ?? pickString(memberData, 'updatedAt') ?? nowIso;

      if (currentMemberStatus === 'suspended') {
        return {
          companyId: input.companyId,
          memberUid: auth.uid,
          role: currentRole,
          memberStatus: 'suspended',
          declinedAt,
        } satisfies DeclineCompanyInviteOutput;
      }
      if (currentMemberStatus !== 'invited') {
        throw new HttpsError('failed-precondition', 'INVITE_NOT_DECLINABLE');
      }

      tx.set(
        memberRef,
        {
          status: 'suspended',
          declinedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );
      tx.set(
        userMembershipRef,
        {
          companyId: input.companyId,
          uid: auth.uid,
          role: currentRole,
          status: 'suspended',
          declinedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );

      const invitesSnap = await tx.get(
        companyRef.collection('member_invites').where('invitedUid', '==', auth.uid).limit(50),
      );
      invitesSnap.docs.forEach((doc) => {
        const data = asRecord(doc.data()) ?? {};
        if (pickString(data, 'status') !== 'pending') {
          return;
        }
        tx.set(
          doc.ref,
          {
            status: 'declined',
            declinedAt: nowIso,
            declinedBy: auth.uid,
            updatedAt: nowIso,
          },
          { merge: true },
        );
      });

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_member_invite_declined',
        targetType: 'company_member',
        targetId: auth.uid,
        status: 'success',
        reason: null,
        metadata: {
          role: currentRole,
        },
        requestId: createHash('sha256')
          .update(`declineCompanyInvite:${auth.uid}:${input.companyId}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        companyId: input.companyId,
        memberUid: auth.uid,
        role: currentRole,
        memberStatus: 'suspended',
        declinedAt: nowIso,
      } satisfies DeclineCompanyInviteOutput;
    });

    return apiOk<DeclineCompanyInviteOutput>(declined);
  });

  const updateCompanyMember = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      updateCompanyMemberInputSchema,
      request.data,
    ) as UpdateCompanyMemberInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    ensureMemberManageRole(actorRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const memberRef = companyRef.collection('members').doc(input.memberUid);
    const userMembershipRef = db
      .collection('users')
      .doc(input.memberUid)
      .collection('company_memberships')
      .doc(input.companyId);
    const nowIso = new Date().toISOString();

    const updated = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, memberSnap] = await Promise.all([tx.get(companyRef), tx.get(memberRef)]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      if (!memberSnap.exists) {
        throw new HttpsError('not-found', 'Uye bulunamadi.');
      }

      const memberData = asRecord(memberSnap.data()) ?? {};
      const currentRole = assertMemberRole(pickString(memberData, 'role'));
      const currentMemberStatus = assertMemberStatus(pickString(memberData, 'status'));

      if (currentRole === 'owner') {
        throw new HttpsError('failed-precondition', 'OWNER_MEMBER_IMMUTABLE');
      }
      if (actorRole === 'admin' && input.patch.role === 'owner') {
        throw new HttpsError('permission-denied', 'Admin owner rolune yukseltemez.');
      }
      if (input.memberUid === auth.uid && input.patch.memberStatus === 'suspended') {
        throw new HttpsError('failed-precondition', 'Kendi hesabinizi askiya alamazsiniz.');
      }

      const nextRole = input.patch.role ?? currentRole;
      const nextMemberStatus = input.patch.memberStatus ?? currentMemberStatus;
      const changedFields: string[] = [];
      if (nextRole !== currentRole) changedFields.push('role');
      if (nextMemberStatus !== currentMemberStatus) changedFields.push('memberStatus');
      if (changedFields.length === 0) {
        throw new HttpsError('invalid-argument', 'En az bir farkli patch alani gonderilmelidir.');
      }

      tx.update(memberRef, {
        role: nextRole,
        status: nextMemberStatus,
        updatedAt: nowIso,
      });
      tx.set(
        userMembershipRef,
        {
          companyId: input.companyId,
          uid: input.memberUid,
          role: nextRole,
          status: nextMemberStatus,
          updatedAt: nowIso,
        },
        { merge: true },
      );

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_member_updated',
        targetType: 'company_member',
        targetId: input.memberUid,
        status: 'success',
        reason: null,
        metadata: {
          actorRole,
          changedFields,
          prevRole: currentRole,
          prevMemberStatus: currentMemberStatus,
          nextRole,
          nextMemberStatus,
        },
        requestId: createHash('sha256')
          .update(`updateCompanyMember:${auth.uid}:${input.companyId}:${input.memberUid}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        companyId: input.companyId,
        memberUid: input.memberUid,
        role: nextRole,
        memberStatus: nextMemberStatus,
        updatedAt: nowIso,
      } satisfies UpdateCompanyMemberOutput;
    });

    return apiOk<UpdateCompanyMemberOutput>(updated);
  });

  const removeCompanyMember = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      removeCompanyMemberInputSchema,
      request.data,
    ) as RemoveCompanyMemberInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    ensureMemberManageRole(actorRole);

    if (input.memberUid === auth.uid) {
      throw new HttpsError('failed-precondition', 'SELF_MEMBER_REMOVE_FORBIDDEN');
    }

    const companyRef = db.collection('companies').doc(input.companyId);
    const memberRef = companyRef.collection('members').doc(input.memberUid);
    const userMembershipRef = db
      .collection('users')
      .doc(input.memberUid)
      .collection('company_memberships')
      .doc(input.companyId);
    const nowIso = new Date().toISOString();

    const removed = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, memberSnap] = await Promise.all([tx.get(companyRef), tx.get(memberRef)]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      if (!memberSnap.exists) {
        throw new HttpsError('not-found', 'Uye bulunamadi.');
      }

      const memberData = asRecord(memberSnap.data()) ?? {};
      const removedRole = assertMemberRole(pickString(memberData, 'role'));
      const removedMemberStatus = assertMemberStatus(pickString(memberData, 'status'));
      if (removedRole === 'owner') {
        throw new HttpsError('failed-precondition', 'OWNER_MEMBER_IMMUTABLE');
      }
      if (actorRole === 'admin' && removedRole === 'admin') {
        throw new HttpsError('permission-denied', 'Admin rolundeki uye admin uyeyi cikarama.');
      }

      tx.delete(memberRef);
      tx.delete(userMembershipRef);

      const invitesSnap = await tx.get(
        companyRef.collection('member_invites').where('invitedUid', '==', input.memberUid).limit(50),
      );
      invitesSnap.docs.forEach((doc) => {
        const data = asRecord(doc.data()) ?? {};
        if (pickString(data, 'status') !== 'pending') {
          return;
        }
        tx.set(
          doc.ref,
          {
            status: 'revoked',
            revokedAt: nowIso,
            revokedBy: auth.uid,
            updatedAt: nowIso,
          },
          { merge: true },
        );
      });

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_member_removed',
        targetType: 'company_member',
        targetId: input.memberUid,
        status: 'success',
        reason: null,
        metadata: {
          actorRole,
          removedRole,
          removedMemberStatus,
        },
        requestId: createHash('sha256')
          .update(`removeCompanyMember:${auth.uid}:${input.companyId}:${input.memberUid}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        companyId: input.companyId,
        memberUid: input.memberUid,
        removedRole,
        removedMemberStatus,
        removed: true,
        removedAt: nowIso,
      } satisfies RemoveCompanyMemberOutput;
    });

    return apiOk<RemoveCompanyMemberOutput>(removed);
  });

  const revokeCompanyInvite = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      revokeCompanyInviteInputSchema,
      request.data,
    ) as RevokeCompanyInviteInput;

    const actorRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    ensureMemberManageRole(actorRole);

    const companyRef = db.collection('companies').doc(input.companyId);
    const inviteRef = companyRef.collection('member_invites').doc(input.inviteId);
    const nowIso = new Date().toISOString();

    const revoked = await runTransactionWithResult(db, async (tx) => {
      const [companySnap, inviteSnap] = await Promise.all([tx.get(companyRef), tx.get(inviteRef)]);
      if (!companySnap.exists) {
        throw new HttpsError('not-found', 'Firma bulunamadi.');
      }
      if (!inviteSnap.exists) {
        throw new HttpsError('not-found', 'Davet bulunamadi.');
      }

      const companyData = asRecord(companySnap.data()) ?? {};
      const companyName = pickString(companyData, 'name') ?? '';

      const inviteData = asRecord(inviteSnap.data()) ?? {};
      const currentStatus = pickString(inviteData, 'status');
      if (currentStatus !== 'pending') {
        throw new HttpsError(
          'failed-precondition',
          `INVITE_NOT_REVOCABLE: Davet durumu '${currentStatus}', sadece 'pending' iptal edilebilir.`,
        );
      }

      const invitedEmail = pickString(inviteData, 'invitedEmail') ?? '';
      const invitedUid = pickString(inviteData, 'invitedUid') ?? '';
      const rawRole = pickString(inviteData, 'role');
      const role: 'admin' | 'dispatcher' | 'viewer' =
        rawRole === 'admin' || rawRole === 'dispatcher' ? rawRole : 'viewer';

      tx.set(
        inviteRef,
        {
          status: 'revoked',
          revokedAt: nowIso,
          revokedBy: auth.uid,
          updatedAt: nowIso,
        },
        { merge: true },
      );

      // If the invited user has a member doc with status 'invited', revert to 'suspended'
      if (invitedUid) {
        const memberRef = companyRef.collection('members').doc(invitedUid);
        const memberSnap = await tx.get(memberRef);
        if (memberSnap.exists) {
          const memberData = asRecord(memberSnap.data()) ?? {};
          const memberStatus = pickString(memberData, 'status');
          if (memberStatus === 'invited') {
            tx.set(
              memberRef,
              {
                status: 'suspended',
                updatedAt: nowIso,
              },
              { merge: true },
            );
            const userMembershipRef = db
              .collection('users')
              .doc(invitedUid)
              .collection('company_memberships')
              .doc(input.companyId);
            tx.set(
              userMembershipRef,
              {
                status: 'suspended',
                updatedAt: nowIso,
              },
              { merge: true },
            );
          }
        }
      }

      const auditRef = db.collection('audit_logs').doc();
      tx.set(auditRef, {
        companyId: input.companyId,
        actorUid: auth.uid,
        actorType: 'company_member',
        eventType: 'company_member_invite_revoked',
        targetType: 'company_invite',
        targetId: input.inviteId,
        status: 'success',
        reason: null,
        metadata: {
          actorRole,
          invitedEmail,
          invitedUid,
          role,
        },
        requestId: createHash('sha256')
          .update(`revokeCompanyInvite:${auth.uid}:${input.companyId}:${input.inviteId}:${nowIso}`)
          .digest('hex')
          .slice(0, 24),
        createdAt: nowIso,
      });

      return {
        inviteId: input.inviteId,
        companyId: input.companyId,
        companyName,
        invitedEmail,
        role,
        status: 'revoked',
        revokedAt: nowIso,
      } satisfies RevokeCompanyInviteOutput;
    });

    return apiOk<RevokeCompanyInviteOutput>(revoked);
  });

  return {
    inviteCompanyMember,
    acceptCompanyInvite,
    declineCompanyInvite,
    updateCompanyMember,
    removeCompanyMember,
    revokeCompanyInvite,
  };
}
