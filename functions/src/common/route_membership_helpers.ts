import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { parseIsoToMs, pickString, pickStringArray } from './runtime_value_helpers.js';
import { asRecord } from './type_guards.js';

export interface ActiveGuestSessionSnapshot {
  sessionId: string;
  guestDisplayName: string | null;
}

export async function requireOwnedRoute(
  db: Firestore,
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

export async function requireRouteMember(
  db: Firestore,
  routeId: string,
  uid: string,
): Promise<Record<string, unknown>> {
  const routeSnap = await db.collection('routes').doc(routeId).get();
  if (!routeSnap.exists) {
    throw new HttpsError('not-found', 'Route bulunamadi.');
  }

  const routeData = asRecord(routeSnap.data()) ?? {};
  const routeOwnerUid = pickString(routeData, 'driverId');
  const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
  const memberIds = pickStringArray(routeData, 'memberIds');
  const isMember = routeOwnerUid === uid || authorizedDriverIds.includes(uid) || memberIds.includes(uid);
  if (!isMember) {
    throw new HttpsError('permission-denied', 'Bu route icin erisim yetkin yok.');
  }

  return routeData;
}

export async function findActiveGuestSession(
  db: Firestore,
  routeId: string,
  guestUid: string,
): Promise<ActiveGuestSessionSnapshot | null> {
  const sessionsSnap = await db.collection('guest_sessions').where('guestUid', '==', guestUid).limit(30).get();

  const nowMs = Date.now();
  let selected: ActiveGuestSessionSnapshot | null = null;
  let selectedExpiresAtMs = 0;

  for (const doc of sessionsSnap.docs) {
    const data = asRecord(doc.data()) ?? {};
    if (pickString(data, 'routeId') !== routeId) {
      continue;
    }
    if (pickString(data, 'status') !== 'active') {
      continue;
    }
    const expiresAtMs = parseIsoToMs(pickString(data, 'expiresAt'));
    if (expiresAtMs == null || expiresAtMs <= nowMs) {
      continue;
    }
    if (selected == null || expiresAtMs > selectedExpiresAtMs) {
      selected = {
        sessionId: doc.id,
        guestDisplayName: pickString(data, 'guestDisplayName'),
      };
      selectedExpiresAtMs = expiresAtMs;
    }
  }

  return selected;
}
