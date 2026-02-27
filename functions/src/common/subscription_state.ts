import { parseIsoToMs } from './runtime_value_helpers.js';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'mock';

export function readSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (value === 'active' || value === 'expired' || value === 'mock' || value === 'trial') {
    return value;
  }
  return 'mock';
}

export function resolveEffectiveSubscriptionStatus(
  status: SubscriptionStatus,
  trialEndsAt: string | null,
  nowMs: number,
): SubscriptionStatus {
  if (status !== 'trial') {
    return status;
  }
  const trialEndsAtMs = parseIsoToMs(trialEndsAt);
  if (trialEndsAtMs != null && trialEndsAtMs <= nowMs) {
    return 'expired';
  }
  return 'trial';
}

