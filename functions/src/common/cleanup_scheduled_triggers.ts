import type { Database } from 'firebase-admin/database';
import type { Firestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { buildIstanbulDateKey, collectEnabledRouteWriters, pickString, toErrorMessage } from './runtime_value_helpers.js';
import { asRecord } from './type_guards.js';

export function createCleanupScheduledTriggers({
  db,
  rtdb,
  cleanupStaleDataBatchLimit,
  supportReportRetentionDays,
  cleanupRouteWritersScanLimit,
  cleanupRouteWriterTaskBatchLimit,
}: {
  db: Firestore;
  rtdb: Database;
  cleanupStaleDataBatchLimit: number;
  supportReportRetentionDays: number;
  cleanupRouteWritersScanLimit: number;
  cleanupRouteWriterTaskBatchLimit: number;
}) {
  const guestSessionTtlEnforcer = onSchedule('every 5 minutes', async () => {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const expiredSessionCandidatesSnap = await db
      .collection('guest_sessions')
      .where('expiresAt', '<=', nowIso)
      .limit(cleanupStaleDataBatchLimit)
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

  const cleanupStaleData = onSchedule(
    { schedule: '0 3 * * *', timeZone: 'Europe/Istanbul' },
    async () => {
      const now = new Date();
      const nowIso = now.toISOString();
      const todayDateKey = buildIstanbulDateKey(now);
      const supportReportRetentionCutoffIso = new Date(
        now.getTime() - supportReportRetentionDays * 24 * 60 * 60 * 1000,
      ).toISOString();

      const deleteByExpiresAt = async (collectionPath: string): Promise<void> => {
        const expiredDocsSnap = await db
          .collection(collectionPath)
          .where('expiresAt', '<=', nowIso)
          .limit(cleanupStaleDataBatchLimit)
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
        .limit(cleanupStaleDataBatchLimit)
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
        .limit(cleanupStaleDataBatchLimit)
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
        .limit(cleanupStaleDataBatchLimit)
        .get();
      if (!staleSkipRequestSnap.empty) {
        const staleSkipDeleteBatch = db.batch();
        for (const skipRequestDoc of staleSkipRequestSnap.docs) {
          staleSkipDeleteBatch.delete(skipRequestDoc.ref);
        }
        await staleSkipDeleteBatch.commit();
      }

      const dueDeleteRequestSnap = await db
        .collection('_delete_requests')
        .where('hardDeleteAfter', '<=', nowIso)
        .limit(cleanupStaleDataBatchLimit)
        .get();
      for (const deleteRequestDoc of dueDeleteRequestSnap.docs) {
        const deleteRequestData = asRecord(deleteRequestDoc.data()) ?? {};
        if (pickString(deleteRequestData, 'status') !== 'pending') {
          continue;
        }
        const targetUid = pickString(deleteRequestData, 'uid') ?? deleteRequestDoc.id;

        const deleteBatch = db.batch();
        deleteBatch.delete(db.collection('users').doc(targetUid));
        deleteBatch.delete(db.collection('drivers').doc(targetUid));
        deleteBatch.delete(db.collection('consents').doc(targetUid));
        deleteBatch.set(
          deleteRequestDoc.ref,
          {
            status: 'completed',
            completedAt: nowIso,
            updatedAt: nowIso,
          },
          { merge: true },
        );
        await deleteBatch.commit();

        await db.collection('_audit_privacy_events').add({
          eventType: 'user_delete_completed',
          uid: targetUid,
          deleteRequestId: deleteRequestDoc.id,
          completedAt: nowIso,
          createdAt: nowIso,
        });
      }
    },
  );

  const cleanupRouteWriters = onSchedule('every 5 minutes', async () => {
    const nowIso = new Date().toISOString();
    const pendingWriterRevokeTaskSnap = await db
      .collection('_writer_revoke_tasks')
      .where('status', '==', 'pending')
      .limit(cleanupRouteWriterTaskBatchLimit)
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
      cleanupRouteWritersScanLimit,
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

  return {
    guestSessionTtlEnforcer,
    cleanupStaleData,
    cleanupRouteWriters,
  };
}
