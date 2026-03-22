import { HttpError } from "./http.js";

import { readAuthenticatedWebSession } from "./auth-session.js";
import { lookupIdentityToolkitUserByIdToken } from "./identity-toolkit.js";

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
      const decodedToken = await lookupIdentityToolkitUserByIdToken(idToken);
      return assertSupportedAuthToken(decodedToken, options);
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
