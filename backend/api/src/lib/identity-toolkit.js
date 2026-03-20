import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { HttpError } from "./http.js";

const IDENTITY_TOOLKIT_BASE_URL = "https://identitytoolkit.googleapis.com/v1";

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function readWebApiKey() {
  const webApiKey = (process.env.APP_WEB_API_KEY ?? "").trim();
  if (!webApiKey) {
    throw new HttpError(500, "internal", "APP_WEB_API_KEY sunucu degiskeni tanimlanmamis.");
  }
  return webApiKey;
}

function requireEmail(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "auth/invalid-email", "Gecerli bir e-posta gereklidir.");
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new HttpError(400, "auth/invalid-email", "Gecerli bir e-posta gereklidir.");
  }

  return normalized;
}

function requirePassword(rawValue, { minLength = 6 } = {}) {
  if (typeof rawValue !== "string" || rawValue.length < minLength) {
    throw new HttpError(
      400,
      "auth/weak-password",
      `Sifre en az ${minLength} karakter olmalidir.`,
    );
  }
  return rawValue;
}

function mapIdentityToolkitError(rawCode) {
  const normalized = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";

  if (normalized === "EMAIL_EXISTS") {
    return new HttpError(409, "auth/email-already-in-use", "Bu e-posta ile zaten bir hesap var.");
  }
  if (normalized === "INVALID_EMAIL") {
    return new HttpError(400, "auth/invalid-email", "E-posta formati gecersiz.");
  }
  if (
    normalized === "INVALID_PASSWORD" ||
    normalized === "EMAIL_NOT_FOUND" ||
    normalized === "INVALID_LOGIN_CREDENTIALS"
  ) {
    return new HttpError(401, "auth/invalid-credential", "E-posta veya sifre hatali.");
  }
  if (normalized === "USER_DISABLED") {
    return new HttpError(403, "auth/user-disabled", "Bu hesap devre disi birakilmis.");
  }
  if (normalized === "TOO_MANY_ATTEMPTS_TRY_LATER") {
    return new HttpError(
      429,
      "auth/too-many-requests",
      "Cok fazla deneme yapildi. Biraz sonra tekrar deneyin.",
    );
  }
  if (normalized.startsWith("WEAK_PASSWORD")) {
    return new HttpError(400, "auth/weak-password", "Sifre en az 6 karakter olmali.");
  }
  if (normalized === "EXPIRED_OOB_CODE") {
    return new HttpError(400, "auth/expired-action-code", "Bu linkin suresi dolmus.");
  }
  if (normalized === "INVALID_OOB_CODE") {
    return new HttpError(400, "auth/invalid-action-code", "Gecersiz veya kullanilmis link.");
  }
  if (normalized === "OPERATION_NOT_ALLOWED") {
    return new HttpError(403, "auth/operation-not-allowed", "Bu kimlik dogrulama yontemi aktif degil.");
  }

  return new HttpError(500, "internal", "Kimlik dogrulama servisi su anda cevap vermiyor.");
}

async function callIdentityToolkit(path, payload) {
  const webApiKey = readWebApiKey();
  const requestUrl = `${IDENTITY_TOOLKIT_BASE_URL}/${path}?key=${encodeURIComponent(webApiKey)}`;
  const response = await fetch(requestUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!response) {
    throw new HttpError(500, "internal", "Kimlik dogrulama servisine ulasilamadi.");
  }

  const responsePayload = asRecord(await response.json().catch(() => null));
  if (!response.ok) {
    const errorPayload = asRecord(responsePayload?.error);
    throw mapIdentityToolkitError(errorPayload?.message);
  }

  return responsePayload ?? {};
}

function parseStringField(record, fieldName) {
  return typeof record?.[fieldName] === "string" ? record[fieldName].trim() : "";
}

export async function signInWithEmailPasswordViaIdentityToolkit(input) {
  const email = requireEmail(input?.email);
  const password = requirePassword(input?.password);
  const payload = await callIdentityToolkit("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });

  return {
    email,
    localId: parseStringField(payload, "localId"),
    idToken: parseStringField(payload, "idToken"),
    refreshToken: parseStringField(payload, "refreshToken"),
  };
}

export async function registerWithEmailPasswordViaIdentityToolkit(input) {
  const email = requireEmail(input?.email);
  const password = requirePassword(input?.password);
  const displayName = typeof input?.displayName === "string" ? input.displayName.trim() : "";

  const payload = await callIdentityToolkit("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });

  const localId = parseStringField(payload, "localId");
  const idToken = parseStringField(payload, "idToken");
  if (!localId || !idToken) {
    throw new HttpError(500, "internal", "Kayit sonrasi oturum olusturulamadi.");
  }

  if (displayName) {
    await getFirebaseAdminAuth().updateUser(localId, { displayName }).catch(() => {
      throw new HttpError(500, "internal", "Kullanici profili guncellenemedi.");
    });
  }

  let verificationEmailSent = false;
  try {
    await sendEmailVerificationForIdToken(idToken);
    verificationEmailSent = true;
  } catch (error) {
    if (!(error instanceof HttpError) || error.code !== "auth/too-many-requests") {
      throw error;
    }
  }

  return {
    email,
    localId,
    idToken,
    verificationEmailSent,
  };
}

export async function sendEmailVerificationForIdToken(rawIdToken) {
  const idToken = typeof rawIdToken === "string" ? rawIdToken.trim() : "";
  if (!idToken) {
    throw new HttpError(400, "invalid-argument", "idToken zorunludur.");
  }

  await callIdentityToolkit("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken,
  });

  return { success: true };
}

export async function verifyPasswordResetCodeViaIdentityToolkit(rawOobCode) {
  const oobCode = typeof rawOobCode === "string" ? rawOobCode.trim() : "";
  if (!oobCode) {
    throw new HttpError(400, "invalid-argument", "Sifre sifirlama kodu zorunludur.");
  }

  const payload = await callIdentityToolkit("accounts:resetPassword", { oobCode });
  return {
    email: parseStringField(payload, "email") || null,
  };
}

export async function confirmPasswordResetViaIdentityToolkit(input) {
  const oobCode = typeof input?.oobCode === "string" ? input.oobCode.trim() : "";
  if (!oobCode) {
    throw new HttpError(400, "invalid-argument", "Sifre sifirlama kodu zorunludur.");
  }

  const newPassword = requirePassword(input?.password);
  const payload = await callIdentityToolkit("accounts:resetPassword", {
    oobCode,
    newPassword,
  });

  return {
    email: parseStringField(payload, "email") || null,
    success: true,
  };
}
