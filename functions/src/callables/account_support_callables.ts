import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import {
  dispatchSupportReportToSlack,
  readRole,
} from '../common/index_domain_helpers.js';
import { enqueueOutboxWithDedupe } from '../common/notification_dedupe.js';
import type {
  DeleteUserDataOutput,
  SendDriverAnnouncementOutput,
  SubmitSupportReportOutput,
} from '../common/output_contract_types.js';
import {
  requirePremiumEntitlement,
  resolveDriverSubscriptionState,
  type GetSubscriptionStateOutput,
} from '../common/premium_entitlement_helpers.js';
import { pickString, pickStringArray, toErrorMessage } from '../common/runtime_value_helpers.js';
import { redactSupportText, redactSupportValue, truncateSupportText } from '../common/support_redaction.js';
import type { SubscriptionStatus } from '../common/subscription_state.js';
import { runTransactionWithResult } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { requireDriverProfile } from '../middleware/driver_profile_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface DeleteUserDataInput {
  dryRun?: boolean;
}

interface SendDriverAnnouncementInput {
  routeId: string;
  templateKey: string;
  customText?: string;
  idempotencyKey: string;
}

interface SubmitSupportReportInput {
  source: string;
  routeId?: string;
  tripId?: string;
  userNote?: string;
  diagnostics?: Record<string, unknown>;
  idempotencyKey: string;
}

export function createAccountSupportCallables({
  db,
  deleteUserDataInputSchema,
  sendDriverAnnouncementInputSchema,
  submitSupportReportInputSchema,
  accountDeleteGraceDays,
  deleteInterceptorMessage,
  manageSubscriptionLabel,
  iosManageSubscriptionUrl,
  androidManageSubscriptionUrl,
  supportEmailDefault,
  supportSlackWebhookUrlEnv,
  supportReportMaxNoteLength,
  supportReportMaxLogSummaryLength,
  announcementDispatchDedupeTtlDays,
  routeShareBaseUrl,
}: {
  db: Firestore;
  deleteUserDataInputSchema: ZodType<unknown>;
  sendDriverAnnouncementInputSchema: ZodType<unknown>;
  submitSupportReportInputSchema: ZodType<unknown>;
  accountDeleteGraceDays: number;
  deleteInterceptorMessage: string;
  manageSubscriptionLabel: string;
  iosManageSubscriptionUrl: string;
  androidManageSubscriptionUrl: string;
  supportEmailDefault: string;
  supportSlackWebhookUrlEnv: string;
  supportReportMaxNoteLength: number;
  supportReportMaxLogSummaryLength: number;
  announcementDispatchDedupeTtlDays: number;
  routeShareBaseUrl: string;
}) {
  const getSubscriptionState = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const output = await resolveDriverSubscriptionState(db, auth.uid);
    return apiOk<GetSubscriptionStateOutput>(output);
  });

  const deleteUserData = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const input = validateInput(deleteUserDataInputSchema, request.data) as DeleteUserDataInput;
    const dryRun = input.dryRun === true;
    const now = new Date();
    const nowIso = now.toISOString();
    const hardDeleteAfterIso = new Date(
      now.getTime() + accountDeleteGraceDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const userRef = db.collection('users').doc(auth.uid);
    const userSnap = await userRef.get();
    const userData = asRecord(userSnap.data()) ?? {};
    const role = readRole(userData.role) ?? 'guest';
    let subscriptionStatus: SubscriptionStatus | null = null;

    if (role === 'driver') {
      const subscriptionState = await resolveDriverSubscriptionState(db, auth.uid);
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
          interceptorMessage: deleteInterceptorMessage,
          manageSubscriptionLabel,
          manageSubscriptionUrls: {
            ios: iosManageSubscriptionUrl,
            android: androidManageSubscriptionUrl,
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

  const sendDriverAnnouncement = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver'],
    });
    await requireDriverProfile(db, auth.uid);
    await requirePremiumEntitlement(db, auth.uid, 'sendDriverAnnouncement');

    const input = validateInput(
      sendDriverAnnouncementInputSchema,
      request.data,
    ) as SendDriverAnnouncementInput;
    const routeRef = db.collection('routes').doc(input.routeId);
    const announcementRef = db
      .collection('announcements')
      .doc(`${input.routeId}_${auth.uid}_${input.idempotencyKey}`);
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const announcementDispatchDedupeExpiresAtIso = new Date(
      nowMs + announcementDispatchDedupeTtlDays * 24 * 60 * 60 * 1000,
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
      const shareUrl = `${routeShareBaseUrl}/${srvCode}`;

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

  const submitSupportReport = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const input = validateInput(submitSupportReportInputSchema, request.data) as SubmitSupportReportInput;
    const nowIso = new Date().toISOString();
    const supportEmail = supportEmailDefault;
    const reportId = `${auth.uid}_${input.idempotencyKey}`;
    const reportRef = db.collection('support_reports').doc(reportId);
    const existing = await reportRef.get();
    if (existing.exists) {
      const existingData = asRecord(existing.data()) ?? {};
      const existingSlackDispatch = pickString(existingData, 'slackDispatch');
      const normalizedSlackDispatch =
        existingSlackDispatch === 'sent' || existingSlackDispatch === 'failed'
          ? existingSlackDispatch
          : 'skipped';
      return apiOk<SubmitSupportReportOutput>({
        reportId,
        queued: true,
        supportEmail,
        slackDispatch: normalizedSlackDispatch,
      });
    }

    const userSnapshot = await db.collection('users').doc(auth.uid).get();
    const role = readRole(userSnapshot.data()?.role) ?? 'guest';
    const rawDiagnostics = input.diagnostics ?? {};
    const sanitizedDiagnostics = redactSupportValue(rawDiagnostics);
    const diagnosticsRecord = asRecord(sanitizedDiagnostics) ?? {};
    const rawNote = input.userNote ?? '';
    const redactedNote = truncateSupportText(
      redactSupportText(rawNote),
      supportReportMaxNoteLength,
    );
    const rawLogSummary = pickString(diagnosticsRecord, 'last5MinLogSummary') ?? '';
    diagnosticsRecord.last5MinLogSummary = truncateSupportText(
      redactSupportText(rawLogSummary),
      supportReportMaxLogSummaryLength,
    );

    let slackDispatch: 'sent' | 'skipped' | 'failed' = 'skipped';
    let slackDispatchError: string | null = null;
    const slackWebhookUrl = process.env[supportSlackWebhookUrlEnv]?.trim() ?? '';
    if (slackWebhookUrl) {
      try {
        await dispatchSupportReportToSlack(slackWebhookUrl, {
          reportId,
          uid: auth.uid,
          source: input.source,
          supportEmail,
          note: redactedNote.length === 0 ? null : truncateSupportText(redactedNote, 280),
        });
        slackDispatch = 'sent';
      } catch (error) {
        slackDispatch = 'failed';
        slackDispatchError = truncateSupportText(redactSupportText(toErrorMessage(error)), 180);
      }
    }

    await reportRef.set({
      uid: auth.uid,
      role,
      source: input.source,
      routeId: input.routeId ?? null,
      tripId: input.tripId ?? null,
      userNote: redactedNote.length === 0 ? null : redactedNote,
      diagnostics: diagnosticsRecord,
      idempotencyKey: input.idempotencyKey,
      supportEmail,
      slackDispatch,
      slackDispatchError,
      status: 'received',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return apiOk<SubmitSupportReportOutput>({
      reportId,
      queued: true,
      supportEmail,
      slackDispatch,
    });
  });

  return {
    getSubscriptionState,
    deleteUserData,
    sendDriverAnnouncement,
    submitSupportReport,
  };
}


