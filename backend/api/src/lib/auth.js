import { HttpError } from "./http.js";
import { readAuthenticatedMobileAccessToken } from "./auth-mobile-tokens.js";

import { readAuthenticatedWebSession } from "./auth-session.js";

function readBearerToken(request) {
  const authorizationHeader = request.headers.authorization ?? "";
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

function assertSupportedAuthToken(decodedToken, options = {}) {
  const signInProvider =
    typeof decodedToken?.signInProvider === "string" ? decodedToken.signInProvider : null;
  if (signInProvider === "anonymous" && options.allowAnonymous !== true) {
    throw new HttpError(
      412,
      "failed-precondition",
      "Anonim oturum bu islem icin desteklenmiyor.",
    );
  }
  return decodedToken;
}

export async function requireAuthenticatedUser(request, options = {}) {
  const idToken = readBearerToken(request);
  const sessionUser = readAuthenticatedWebSession(request);
  let lastError = null;

  if (idToken) {
    try {
      const mobileSessionUser = readAuthenticatedMobileAccessToken(idToken);
      if (mobileSessionUser) {
        return assertSupportedAuthToken(mobileSessionUser, options);
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (sessionUser) {
    try {
      return assertSupportedAuthToken(sessionUser, options);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof HttpError) {
    throw lastError;
  }
  throw new HttpError(401, "unauthenticated", "Oturum bulunamadi. Tekrar giris yap.");
}
