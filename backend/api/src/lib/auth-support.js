import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { HttpError } from "./http.js";
import { asRecord } from "./runtime-value.js";

const LOGIN_GUARD_COLLECTION = "_web_login_guard";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const LOCK_EXCEEDED_MESSAGE = "Cok fazla basarisiz giris denemesi. Lutfen biraz sonra tekrar deneyin.";
const DEFAULT_WEB_LOGIN_FAILURE_WINDOW_MS = 15 * 60_000;
const DEFAULT_WEB_LOGIN_CAPTCHA_THRESHOLD = 3;
const DEFAULT_WEB_LOGIN_HARD_LOCK_THRESHOLD = 8;
const DEFAULT_WEB_LOGIN_HARD_LOCK_MS = 15 * 60_000;

function readPositiveIntegerEnv(envName, fallbackValue) {
  const rawValue = process.env[envName]?.trim();
  if (!rawValue) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function readLoginSecurityConfig() {
  return {
    failureWindowMs: readPositiveIntegerEnv(
      "WEB_LOGIN_FAILURE_WINDOW_MS",
      DEFAULT_WEB_LOGIN_FAILURE_WINDOW_MS,
    ),
    captchaThreshold: readPositiveIntegerEnv(
      "WEB_LOGIN_CAPTCHA_THRESHOLD",
      DEFAULT_WEB_LOGIN_CAPTCHA_THRESHOLD,
    ),
    hardLockThreshold: readPositiveIntegerEnv(
      "WEB_LOGIN_HARD_LOCK_THRESHOLD",
      DEFAULT_WEB_LOGIN_HARD_LOCK_THRESHOLD,
    ),
    hardLockMs: readPositiveIntegerEnv("WEB_LOGIN_HARD_LOCK_MS", DEFAULT_WEB_LOGIN_HARD_LOCK_MS),
  };
}

function readTurnstileSecret() {
  return (process.env.TURNSTILE_SECRET_KEY ?? "").trim();
}

function isTurnstileEnabled() {
  return readTurnstileSecret().length > 0;
}

function normalizeEmail(rawValue) {
  const normalized = (rawValue ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const isEmailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  return isEmailLike ? normalized : null;
}

function requireNormalizedEmail(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    throw new HttpError(400, "auth/missing-email", "Gecerli bir e-posta gereklidir.");
  }

  const normalized = normalizeEmail(rawValue);
  if (!normalized) {
    throw new HttpError(400, "auth/invalid-email", "Gecerli bir e-posta gereklidir.");
  }

  return normalized;
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  return null;
}

function parseFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return 0;
}

function parseLoginGuardState(value) {
  const record = asRecord(value);
  return {
    failedCount: parseFiniteNumber(record?.failedCount),
    firstFailureMs: parseFiniteNumber(record?.firstFailureMs),
    lastFailureMs: parseFiniteNumber(record?.lastFailureMs),
    lockUntilMs: parseFiniteNumber(record?.lockUntilMs),
  };
}

function resetIfWindowExpired(state, nowMs, failureWindowMs) {
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

function readHeaderValue(headers, headerName) {
  const rawValue = headers[headerName];
  if (Array.isArray(rawValue)) {
    return rawValue[0]?.trim() ?? "";
  }
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

function resolveClientIp(request) {
  const forwardedValue = readHeaderValue(request.headers, "x-forwarded-for");
  const candidates = [
    readHeaderValue(request.headers, "cf-connecting-ip"),
    readHeaderValue(request.headers, "x-real-ip"),
    forwardedValue.split(",")[0]?.trim() ?? "",
    typeof request.socket?.remoteAddress === "string" ? request.socket.remoteAddress.trim() : "",
  ];

  return candidates.find((value) => value.length > 0) ?? "unknown";
}

function buildGuardDocId(email, ipAddress) {
  const hash = createHash("sha256").update(`${email}|${ipAddress}`).digest("hex");
  return `corp_${hash.slice(0, 48)}`;
}

async function verifyTurnstileToken(input) {
  const secret = readTurnstileSecret();
  if (!secret) {
    throw new HttpError(
      412,
      "failed-precondition",
      "Captcha secret tanimli degil. TURNSTILE_SECRET_KEY env ayarini yapin.",
    );
  }

  const formBody = new URLSearchParams({
    secret,
    response: input.token,
    remoteip: input.ipAddress,
  });

  const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  }).catch(() => null);

  if (!verifyResponse?.ok) {
    throw new HttpError(500, "internal", "Captcha dogrulamasi su an tamamlanamadi.");
  }

  let payload = null;
  try {
    payload = asRecord(await verifyResponse.json());
  } catch {
    payload = null;
  }

  if (payload?.success !== true) {
    throw new HttpError(403, "permission-denied", "Captcha dogrulamasi basarisiz.");
  }
}

async function sendPasswordResetEmailViaIdentityToolkit(email) {
  const webApiKey = (process.env.APP_WEB_API_KEY ?? "").trim();
  if (!webApiKey) {
    throw new HttpError(500, "internal", "APP_WEB_API_KEY sunucu degiskeni tanimlanmamis.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${webApiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    },
  ).catch(() => null);

  if (!response) {
    throw new HttpError(500, "internal", "Sifre sifirlama servisine ulasilamadi.");
  }

  let payload = null;
  try {
    payload = asRecord(await response.json());
  } catch {
    payload = null;
  }

  if (response.ok) {
    return;
  }

  const errorRecord = asRecord(payload?.error);
  const providerCode =
    typeof errorRecord?.message === "string" ? errorRecord.message.trim().toUpperCase() : "";

  if (providerCode === "EMAIL_NOT_FOUND") {
    throw new HttpError(404, "auth/user-not-found", "Bu e-posta ile kayitli hesap bulunamadi.");
  }
  if (providerCode === "INVALID_EMAIL") {
    throw new HttpError(400, "auth/invalid-email", "E-posta formati gecersiz.");
  }
  if (providerCode === "TOO_MANY_ATTEMPTS_TRY_LATER") {
    throw new HttpError(
      429,
      "auth/too-many-requests",
      "Cok fazla deneme yapildi. Biraz sonra tekrar dene.",
    );
  }

  throw new HttpError(500, "internal", "Sifre sifirlama e-postasi gonderilemedi.");
}

export async function prepareCorporateLoginAttempt(db, request, input) {
  const config = readLoginSecurityConfig();
  const email = requireNormalizedEmail(input?.email);
  const captchaToken = typeof input?.captchaToken === "string" ? input.captchaToken.trim() : "";
  const ipAddress = resolveClientIp(request);
  const docId = buildGuardDocId(email, ipAddress);
  const guardSnapshot = await db.collection(LOGIN_GUARD_COLLECTION).doc(docId).get();
  const nowMs = Date.now();
  const state = resetIfWindowExpired(
    parseLoginGuardState(guardSnapshot.data()),
    nowMs,
    config.failureWindowMs,
  );

  if (state.lockUntilMs > nowMs) {
    const retryAfterSeconds = Math.ceil((state.lockUntilMs - nowMs) / 1000);
    throw new HttpError(
      429,
      "resource-exhausted",
      `${LOCK_EXCEEDED_MESSAGE} ${retryAfterSeconds} sn sonra tekrar deneyin.`,
    );
  }

  const captchaRequired = isTurnstileEnabled() && state.failedCount >= config.captchaThreshold;
  if (captchaRequired) {
    if (!captchaToken) {
      throw new HttpError(
        412,
        "failed-precondition",
        "Captcha zorunlu. Lutfen dogrulamayi tamamlayin.",
      );
    }
    await verifyTurnstileToken({ token: captchaToken, ipAddress });
  }

  return {
    captchaRequired,
    failedCount: state.failedCount,
    lockSecondsRemaining: 0,
  };
}

export async function reportCorporateLoginResult(db, request, input) {
  const config = readLoginSecurityConfig();
  const email = requireNormalizedEmail(input?.email);
  const success = parseBoolean(input?.success);
  if (success === null) {
    throw new HttpError(400, "invalid-argument", "email ve success alanlari zorunludur.");
  }

  const ipAddress = resolveClientIp(request);
  const docId = buildGuardDocId(email, ipAddress);
  const guardRef = db.collection(LOGIN_GUARD_COLLECTION).doc(docId);

  if (success) {
    await guardRef.delete();
    return {
      failedCount: 0,
      lockSecondsRemaining: 0,
    };
  }

  const nowMs = Date.now();
  let nextState = {
    failedCount: 1,
    firstFailureMs: nowMs,
    lastFailureMs: nowMs,
    lockUntilMs: 0,
  };

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(guardRef);
    const previousState = resetIfWindowExpired(
      parseLoginGuardState(snapshot.data()),
      nowMs,
      config.failureWindowMs,
    );

    const nextFailedCount = previousState.failedCount + 1;
    const nextFirstFailureMs =
      previousState.firstFailureMs > 0 ? previousState.firstFailureMs : nowMs;
    let nextLockUntilMs = previousState.lockUntilMs > nowMs ? previousState.lockUntilMs : 0;

    if (nextFailedCount >= config.hardLockThreshold) {
      nextLockUntilMs = Math.max(nextLockUntilMs, nowMs + config.hardLockMs);
    } else if (nextFailedCount >= config.captchaThreshold) {
      const softLockStep = nextFailedCount - config.captchaThreshold + 1;
      const softLockMs = Math.min(softLockStep * 30_000, 5 * 60_000);
      nextLockUntilMs = Math.max(nextLockUntilMs, nowMs + softLockMs);
    }

    nextState = {
      failedCount: nextFailedCount,
      firstFailureMs: nextFirstFailureMs,
      lastFailureMs: nowMs,
      lockUntilMs: nextLockUntilMs,
    };

    transaction.set(
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

  return {
    failedCount: nextState.failedCount,
    lockSecondsRemaining:
      nextState.lockUntilMs > nowMs ? Math.ceil((nextState.lockUntilMs - nowMs) / 1000) : 0,
  };
}

export function resolveCorporateLoginContext(decodedToken) {
  const ownerUid = (process.env.PLATFORM_OWNER_UID ?? "").trim();
  const isPlatformOwner = ownerUid.length > 0 && decodedToken?.uid === ownerUid;

  return {
    isPlatformOwner,
    defaultPath: isPlatformOwner ? "/platform/companies" : "/dashboard",
  };
}

export async function getCurrentUserWebAccessPolicy(db, uid) {
  if (!uid) {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }

  try {
    const userSnapshot = await db.collection("users").doc(uid).get();
    const userData = asRecord(userSnapshot.data()) ?? {};
    const rawRole = typeof userData.role === "string" ? userData.role.trim().toLowerCase() : null;
    const forceMobileOnly = userData.mobileOnlyAuth === true || userData.webPanelAccess === false;

    if (rawRole === "driver" && forceMobileOnly) {
      return {
        role: rawRole,
        allowWebPanel: false,
        reason: "DRIVER_MOBILE_ONLY_WEB_BLOCK",
      };
    }

    if (rawRole === "driver") {
      return {
        role: rawRole,
        allowWebPanel: false,
        reason: "DRIVER_MOBILE_ONLY_WEB_BLOCK",
      };
    }

    return {
      role: rawRole,
      allowWebPanel: true,
      reason: null,
    };
  } catch {
    return {
      role: null,
      allowWebPanel: true,
      reason: null,
    };
  }
}

export async function sendPasswordResetEmailForAddress(input) {
  const email = requireNormalizedEmail(input?.email);

  try {
    await getFirebaseAdminAuth().getUserByEmail(email);
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : null;
    if (code === "auth/user-not-found") {
      throw new HttpError(404, "auth/user-not-found", "Bu e-posta ile kayitli hesap bulunamadi.");
    }
    throw new HttpError(500, "internal", "Kullanici hesabina ulasilamadi.");
  }

  await sendPasswordResetEmailViaIdentityToolkit(email);
  return { success: true };
}
