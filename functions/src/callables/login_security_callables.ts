import { createHash } from 'node:crypto';

import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

import { apiOk } from '../common/api_response.js';
import { pickString } from '../common/runtime_value_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';

const LOGIN_GUARD_COLLECTION = '_web_login_guard';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_SECRET_ENV = 'TURNSTILE_SECRET_KEY';
const LOCK_EXCEEDED_MESSAGE = 'Cok fazla basarisiz giris denemesi. Lutfen biraz sonra tekrar deneyin.';

interface CreateLoginSecurityCallablesInput {
  db: Firestore;
  failureWindowMs: number;
  captchaThreshold: number;
  hardLockThreshold: number;
  hardLockMs: number;
}

interface LoginGuardState {
  failedCount: number;
  firstFailureMs: number;
  lastFailureMs: number;
  lockUntilMs: number;
}

function readTurnstileSecret(): string {
  return (process.env[TURNSTILE_SECRET_ENV] ?? '').trim();
}

function isTurnstileEnabled(): boolean {
  return readTurnstileSecret().length > 0;
}

function normalizeEmail(rawValue: string | null): string | null {
  const normalized = (rawValue ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const isEmailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  return isEmailLike ? normalized : null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  return null;
}

function parseFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return 0;
}

function parseLoginGuardState(value: unknown): LoginGuardState {
  const record = asRecord(value);
  return {
    failedCount: parseFiniteNumber(record?.failedCount),
    firstFailureMs: parseFiniteNumber(record?.firstFailureMs),
    lastFailureMs: parseFiniteNumber(record?.lastFailureMs),
    lockUntilMs: parseFiniteNumber(record?.lockUntilMs),
  };
}

function resetIfWindowExpired(state: LoginGuardState, nowMs: number, failureWindowMs: number): LoginGuardState {
  if (state.firstFailureMs <= 0) {
    return state;
  }
  if (nowMs - state.firstFailureMs <= failureWindowMs) {
    return state;
  }
  return {
    failedCount: 0,
    firstFailureMs: 0,
    lastFailureMs: 0,
    lockUntilMs: 0,
  };
}

function resolveClientIp(request: CallableRequest<unknown>): string {
  const rawRequest = request.rawRequest;
  const forwardedHeader = rawRequest.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedHeader)
    ? forwardedHeader[0] ?? ''
    : forwardedHeader ?? '';
  const firstForwardedIp = forwardedValue.split(',')[0]?.trim() ?? '';
  if (firstForwardedIp) {
    return firstForwardedIp;
  }
  const directIp = (rawRequest.ip ?? '').trim();
  if (directIp) {
    return directIp;
  }
  return 'unknown';
}

function buildGuardDocId(email: string, ipAddress: string): string {
  const hash = createHash('sha256').update(`${email}|${ipAddress}`).digest('hex');
  return `corp_${hash.slice(0, 48)}`;
}

async function verifyTurnstileToken(input: {
  token: string;
  ipAddress: string;
}): Promise<void> {
  const secret = readTurnstileSecret();
  if (!secret) {
    throw new HttpsError(
      'failed-precondition',
      'Captcha secret tanimli degil. TURNSTILE_SECRET_KEY env ayarini yapin.',
    );
  }

  const formBody = new URLSearchParams({
    secret,
    response: input.token,
    remoteip: input.ipAddress,
  });

  const verifyResp = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  });

  if (!verifyResp.ok) {
    throw new HttpsError('internal', 'Captcha dogrulamasi su an tamamlanamadi.');
  }

  let payloadRecord: Record<string, unknown> | null = null;
  try {
    payloadRecord = asRecord(await verifyResp.json());
  } catch {
    payloadRecord = null;
  }

  if (payloadRecord?.success !== true) {
    throw new HttpsError('permission-denied', 'Captcha dogrulamasi basarisiz.');
  }
}

export function createLoginSecurityCallables({
  db,
  failureWindowMs,
  captchaThreshold,
  hardLockThreshold,
  hardLockMs,
}: CreateLoginSecurityCallablesInput) {
  const prepareCorporateLoginAttempt = onCall(async (request: CallableRequest<unknown>) => {
    const input = asRecord(request.data) ?? {};
    const email = normalizeEmail(pickString(input, 'email'));
    const captchaToken = (pickString(input, 'captchaToken') ?? '').trim();
    if (!email) {
      throw new HttpsError('invalid-argument', 'Gecerli bir e-posta gereklidir.');
    }

    const ipAddress = resolveClientIp(request);
    const docId = buildGuardDocId(email, ipAddress);
    const guardSnap = await db.collection(LOGIN_GUARD_COLLECTION).doc(docId).get();
    const nowMs = Date.now();
    const state = resetIfWindowExpired(
      parseLoginGuardState(guardSnap.data()),
      nowMs,
      failureWindowMs,
    );

    if (state.lockUntilMs > nowMs) {
      const retryAfterSeconds = Math.ceil((state.lockUntilMs - nowMs) / 1000);
      throw new HttpsError(
        'resource-exhausted',
        `${LOCK_EXCEEDED_MESSAGE} ${retryAfterSeconds} sn sonra tekrar deneyin.`,
      );
    }

    const captchaRequired = isTurnstileEnabled() && state.failedCount >= captchaThreshold;
    if (captchaRequired) {
      if (!captchaToken) {
        throw new HttpsError('failed-precondition', 'Captcha zorunlu. Lutfen dogrulamayi tamamlayin.');
      }
      await verifyTurnstileToken({ token: captchaToken, ipAddress });
    }

    return apiOk<{
      captchaRequired: boolean;
      failedCount: number;
      lockSecondsRemaining: number;
    }>({
      captchaRequired,
      failedCount: state.failedCount,
      lockSecondsRemaining: 0,
    });
  });

  const reportCorporateLoginResult = onCall(async (request: CallableRequest<unknown>) => {
    const input = asRecord(request.data) ?? {};
    const email = normalizeEmail(pickString(input, 'email'));
    const success = parseBoolean(input.success);
    if (!email || success === null) {
      throw new HttpsError('invalid-argument', 'email ve success alanlari zorunludur.');
    }

    const ipAddress = resolveClientIp(request);
    const docId = buildGuardDocId(email, ipAddress);
    const guardRef = db.collection(LOGIN_GUARD_COLLECTION).doc(docId);

    if (success) {
      await guardRef.delete();
      return apiOk<{
        failedCount: number;
        lockSecondsRemaining: number;
      }>({
        failedCount: 0,
        lockSecondsRemaining: 0,
      });
    }

    const nowMs = Date.now();
    let nextState: LoginGuardState = {
      failedCount: 1,
      firstFailureMs: nowMs,
      lastFailureMs: nowMs,
      lockUntilMs: 0,
    };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(guardRef);
      const previousState = resetIfWindowExpired(
        parseLoginGuardState(snap.data()),
        nowMs,
        failureWindowMs,
      );

      const nextFailedCount = previousState.failedCount + 1;
      const nextFirstFailureMs = previousState.firstFailureMs > 0 ? previousState.firstFailureMs : nowMs;
      let nextLockUntilMs = previousState.lockUntilMs > nowMs ? previousState.lockUntilMs : 0;

      if (nextFailedCount >= hardLockThreshold) {
        nextLockUntilMs = Math.max(nextLockUntilMs, nowMs + hardLockMs);
      } else if (nextFailedCount >= captchaThreshold) {
        const softLockStep = nextFailedCount - captchaThreshold + 1;
        const softLockMs = Math.min(softLockStep * 30_000, 5 * 60_000);
        nextLockUntilMs = Math.max(nextLockUntilMs, nowMs + softLockMs);
      }

      nextState = {
        failedCount: nextFailedCount,
        firstFailureMs: nextFirstFailureMs,
        lastFailureMs: nowMs,
        lockUntilMs: nextLockUntilMs,
      };

      tx.set(
        guardRef,
        {
          failedCount: nextState.failedCount,
          firstFailureMs: nextState.firstFailureMs,
          lastFailureMs: nextState.lastFailureMs,
          lockUntilMs: nextState.lockUntilMs,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    const lockSecondsRemaining =
      nextState.lockUntilMs > nowMs ? Math.ceil((nextState.lockUntilMs - nowMs) / 1000) : 0;

    return apiOk<{
      failedCount: number;
      lockSecondsRemaining: number;
    }>({
      failedCount: nextState.failedCount,
      lockSecondsRemaining,
    });
  });

  const resolveCorporateLoginContext = onCall((request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const ownerUid = (process.env.PLATFORM_OWNER_UID ?? '').trim();
    const isPlatformOwner = ownerUid.length > 0 && auth.uid === ownerUid;

    return apiOk<{
      isPlatformOwner: boolean;
      defaultPath: string;
    }>({
      isPlatformOwner,
      defaultPath: isPlatformOwner ? '/platform/companies' : '/dashboard',
    });
  });

  return {
    prepareCorporateLoginAttempt,
    reportCorporateLoginResult,
    resolveCorporateLoginContext,
  };
}
