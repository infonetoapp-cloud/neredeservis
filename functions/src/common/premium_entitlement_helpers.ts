import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { pickString } from './runtime_value_helpers.js';
import {
  readSubscriptionStatus,
  resolveEffectiveSubscriptionStatus,
  type SubscriptionStatus,
} from './subscription_state.js';
import { asRecord } from './type_guards.js';

export interface GetSubscriptionStateOutput {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  products: {
    id: string;
    price: string;
  }[];
}

export async function resolveDriverSubscriptionState(
  db: Firestore,
  uid: string,
): Promise<GetSubscriptionStateOutput> {
  const nowMs = Date.now();
  const driverSnap = await db.collection('drivers').doc(uid).get();
  const driverData = asRecord(driverSnap.data());

  const rawStatus = readSubscriptionStatus(driverData?.subscriptionStatus);
  const trialEndsAt = pickString(driverData, 'trialEndsAt');
  const effectiveStatus = resolveEffectiveSubscriptionStatus(rawStatus, trialEndsAt, nowMs);

  const output: GetSubscriptionStateOutput = {
    subscriptionStatus: effectiveStatus,
    products: [],
  };
  if (trialEndsAt) {
    output.trialEndsAt = trialEndsAt;
  }
  return output;
}

export async function requirePremiumEntitlement(
  db: Firestore,
  uid: string,
  feature: string,
): Promise<void> {
  const state = await resolveDriverSubscriptionState(db, uid);
  if (state.subscriptionStatus === 'active' || state.subscriptionStatus === 'trial') {
    return;
  }
  throw new HttpsError(
    'permission-denied',
    `${feature} icin premium entitlement gerekli. subscriptionStatus=${state.subscriptionStatus}`,
  );
}
