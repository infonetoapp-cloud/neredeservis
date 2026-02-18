import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { asRecord } from './type_guards.js';

export type TripRequestType = 'start_trip' | 'finish_trip';

interface ReadTripRequestReplayParams {
  tx: Transaction;
  requestRef: DocumentReference;
  expectedRequestType: TripRequestType;
}

interface SetTripRequestRecordParams {
  tx: Transaction;
  requestRef: DocumentReference;
  requestType: TripRequestType;
  uid: string;
  tripId: string;
  createdAt: string;
  expiresAt: string;
}

function pickString(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) {
    return null;
  }
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function parseTripIdFromResultRef(resultRef: string | null): string | null {
  if (!resultRef) {
    return null;
  }
  const prefix = 'trips/';
  if (!resultRef.startsWith(prefix)) {
    return null;
  }
  const tripId = resultRef.slice(prefix.length).trim();
  return tripId.length > 0 ? tripId : null;
}

export function buildTripRequestId(uid: string, idempotencyKey: string): string {
  return `${uid}_${idempotencyKey}`;
}

export function createTripRequestRef(
  db: Firestore,
  uid: string,
  idempotencyKey: string,
): DocumentReference {
  return db.collection('trip_requests').doc(buildTripRequestId(uid, idempotencyKey));
}

export async function readTripRequestReplay({
  tx,
  requestRef,
  expectedRequestType,
}: ReadTripRequestReplayParams): Promise<string | null> {
  const requestSnap = await tx.get(requestRef);
  if (!requestSnap.exists) {
    return null;
  }

  const requestData = asRecord(requestSnap.data());
  if (pickString(requestData, 'requestType') !== expectedRequestType) {
    throw new HttpsError('failed-precondition', 'Idempotency key farkli islem tipiyle kullanildi.');
  }

  const tripId = parseTripIdFromResultRef(pickString(requestData, 'resultRef'));
  if (!tripId) {
    throw new HttpsError('failed-precondition', 'Idempotency kaydi gecersiz resultRef iceriyor.');
  }
  return tripId;
}

export function setTripRequestRecord({
  tx,
  requestRef,
  requestType,
  uid,
  tripId,
  createdAt,
  expiresAt,
}: SetTripRequestRecordParams): void {
  tx.set(requestRef, {
    requestType,
    uid,
    resultRef: `trips/${tripId}`,
    createdAt,
    expiresAt,
  });
}
