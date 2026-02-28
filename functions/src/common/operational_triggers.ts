import type { Database } from 'firebase-admin/database';
import type { Firestore } from 'firebase-admin/firestore';
import { onValueWritten } from 'firebase-functions/v2/database';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { enqueueOutboxWithDedupe } from './notification_dedupe.js';
import {
  getIstanbulClockInfo,
  normalizeAuthorizedDriverIds,
  parseHourMinuteToMinuteOfDay,
  parseIsoToMs,
  pickFiniteNumber,
  pickString,
  pickStringArray,
  readTransitionVersion,
  sameStringArray,
} from './runtime_value_helpers.js';
import { runTransactionVoid } from './transaction_helpers.js';
import { asRecord } from './type_guards.js';

export function createOperationalTriggers({
  db,
  rtdb,
  liveLocationMaxAgeMs,
  liveLocationFutureToleranceMs,
  abandonedTripStaleWindowMs,
  morningReminderLeadMinutes,
}: {
  db: Firestore;
  rtdb: Database;
  liveLocationMaxAgeMs: number;
  liveLocationFutureToleranceMs: number;
  abandonedTripStaleWindowMs: number;
  morningReminderLeadMinutes: number;
}) {
  const syncPassengerCount = onDocumentWritten(
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

  const syncRouteMembership = onDocumentWritten('routes/{routeId}', async (event) => {
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
    const passengerIds = (await db.collection('routes').doc(routeId).collection('passengers').get()).docs
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

  const syncTripHeartbeatFromLocation = onValueWritten(
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
        timestampMs >= nowMs - liveLocationMaxAgeMs &&
        timestampMs <= nowMs + liveLocationFutureToleranceMs;
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

  const abandonedTripGuard = onSchedule('every 10 minutes', async () => {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const staleCutoffIso = new Date(nowMs - abandonedTripStaleWindowMs).toISOString();
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
        if (lastLocationAtMs == null || lastLocationAtMs > nowMs - abandonedTripStaleWindowMs) {
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

  const morningReminderDispatcher = onSchedule('every 1 minutes', async () => {
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
        (scheduledMinuteOfDay - morningReminderLeadMinutes + 24 * 60) % (24 * 60);
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

  return {
    syncPassengerCount,
    syncRouteMembership,
    syncTripHeartbeatFromLocation,
    abandonedTripGuard,
    morningReminderDispatcher,
  };
}
