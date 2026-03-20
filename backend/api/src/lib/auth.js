import { HttpError } from "./http.js";

import { readWebSessionCookie } from "./auth-session.js";
import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { asRecord } from "./runtime-value.js";

function readBearerToken(request) {
  const authorizationHeader = request.headers.authorization ?? "";
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

function assertSupportedAuthToken(decodedToken) {
  const firebaseClaim = asRecord(decodedToken.firebase);
  if (firebaseClaim?.sign_in_provider === "anonymous") {
    throw new HttpError(
      412,
      "failed-precondition",
      "Anonim oturum bu islem icin desteklenmiyor.",
    );
  }
  return decodedToken;
}

export async function requireAuthenticatedUser(request) {
  const adminAuth = getFirebaseAdminAuth();
  const idToken = readBearerToken(request);
  const sessionCookie = readWebSessionCookie(request);
  let lastError = null;

  if (idToken) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return assertSupportedAuthToken(decodedToken);
    } catch (error) {
      lastError = error;
    }
  }

  if (sessionCookie) {
    try {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
      return assertSupportedAuthToken(decodedToken);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof HttpError) {
    throw lastError;
  }
  throw new HttpError(401, "unauthenticated", "Oturum bulunamadi. Tekrar giris yap.");
}
