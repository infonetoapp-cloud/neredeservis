import { HttpError } from "./http.js";

import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { asRecord } from "./runtime-value.js";

function readBearerToken(request) {
  const authorizationHeader = request.headers.authorization ?? "";
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new HttpError(401, "unauthenticated", "Oturum bulunamadi. Tekrar giris yap.");
  }
  return token;
}

export async function requireAuthenticatedUser(request) {
  const idToken = readBearerToken(request);

  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);
    const firebaseClaim = asRecord(decodedToken.firebase);
    if (firebaseClaim?.sign_in_provider === "anonymous") {
      throw new HttpError(
        412,
        "failed-precondition",
        "Anonim oturum bu islem icin desteklenmiyor.",
      );
    }
    return decodedToken;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "unauthenticated", "Oturum bulunamadi. Tekrar giris yap.");
  }
}
