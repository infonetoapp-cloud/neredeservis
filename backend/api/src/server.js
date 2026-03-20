import { createServer } from "node:http";

import { listActiveTripsByCompany } from "./lib/company-active-trips.js";
import { requireAuthenticatedUser } from "./lib/auth.js";
import { readCurrentAuthProfile, updateCurrentAuthProfile } from "./lib/auth-profile.js";
import {
  clearWebSessionCookie,
  exchangeIdTokenForWebSession,
  readCurrentAuthSessionUser,
} from "./lib/auth-session.js";
import {
  getCurrentUserWebAccessPolicy,
  prepareCorporateLoginAttempt,
  reportCorporateLoginResult,
  resolveCorporateLoginContext,
  sendPasswordResetEmailForAddress,
} from "./lib/auth-support.js";
import {
  requireActiveCompanyMemberRole,
  requireCompanyDriverWriteRole,
  requireCompanyRouteWriteRole,
  requireCompanyVehicleWriteRole,
  requireCompanyOwnerOrAdmin,
} from "./lib/company-access.js";
import {
  getCompanyAdminTenantState,
  listCompanyAuditLogs,
  updateCompanyAdminTenantState,
} from "./lib/company-audit.js";
import {
  assignCompanyDriverToRoute,
  createCompanyDriverAccount,
  unassignCompanyDriverFromRoute,
  updateCompanyDriverStatus,
} from "./lib/company-driver-mutations.js";
import {
  deleteDriverDocument,
  listDriverDocuments,
  upsertDriverDocument,
} from "./lib/company-driver-documents.js";
import { listCompanyInvites } from "./lib/company-invites.js";
import { listCompanyDrivers } from "./lib/company-drivers.js";
import { listCompanyMembers } from "./lib/company-members.js";
import {
  inviteCompanyMember,
  removeCompanyMember,
  revokeCompanyInvite,
  updateCompanyMember,
} from "./lib/company-member-mutations.js";
import { getCompanyProfile, updateCompanyProfile } from "./lib/company-profile.js";
import {
  grantDriverRoutePermissions,
  listRouteDriverPermissions,
  revokeDriverRoutePermissions,
} from "./lib/company-route-driver-permissions.js";
import {
  createCompanyRoute,
  deleteCompanyRoute,
  deleteCompanyRouteStop,
  reorderCompanyRouteStops,
  upsertCompanyRouteStop,
  updateCompanyRoute,
} from "./lib/company-route-mutations.js";
import { listCompanyRoutes } from "./lib/company-routes.js";
import { listCompanyRouteStops } from "./lib/company-route-stops.js";
import {
  createCompanyVehicle,
  deleteCompanyVehicle,
  listCompanyVehicles,
  updateCompanyVehicle,
} from "./lib/company-vehicles.js";
import {
  cleanupStoredCompanyLogos,
  readCompanyLogoMedia,
  removeStoredCompanyLogo,
  removeStoredCompanyLogoFile,
  storeCompanyLogoFromRequest,
} from "./lib/company-logo-storage.js";
import { listCompanyLiveOpsSnapshot } from "./lib/company-live-ops.js";
import { applyCorsHeaders, handleCorsPreflight } from "./lib/cors.js";
import { getFirebaseAdminDb, getOptionalFirebaseAdminRtdb } from "./lib/firebase-admin.js";
import {
  confirmPasswordResetViaIdentityToolkit,
  registerWithEmailPasswordViaIdentityToolkit,
  signInWithEmailPasswordViaIdentityToolkit,
  verifyPasswordResetCodeViaIdentityToolkit,
} from "./lib/identity-toolkit.js";
import {
  generateRouteShareLink,
  getDynamicRoutePreview,
} from "./lib/route-share-preview.js";
import { requirePlatformOwner } from "./lib/platform-access.js";
import {
  getPlatformLandingConfig,
  getPublicLandingConfig,
  updatePlatformLandingConfig,
} from "./lib/platform-landing-config.js";
import {
  readPlatformMediaAsset,
  removePlatformMedia,
  storePlatformMediaFromRequest,
} from "./lib/platform-media-storage.js";
import {
  createPlatformCompany,
  deletePlatformCompany,
  getPlatformCompanyDetail,
  listPlatformCompanies,
  resetPlatformCompanyOwnerPassword,
  setPlatformCompanyStatus,
  setPlatformCompanyVehicleLimit,
} from "./lib/platform-companies.js";
import { asRecord } from "./lib/runtime-value.js";
import { createCompany, listMyCompanies } from "./lib/my-companies.js";
import {
  acceptMyCompanyInvite,
  declineMyCompanyInvite,
  listMyPendingCompanyInvites,
} from "./lib/my-company-invites.js";
import { HttpError, readJsonBody, sendApiError, sendApiOk, sendJson } from "./lib/http.js";

const serviceName = process.env.SERVICE_NAME?.trim() || "neredeservis-backend-api";
const host = process.env.HOST?.trim() || "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const startedAt = new Date();
const db = getFirebaseAdminDb();
const liveOpsOnlineThresholdMs = Number.parseInt(
  process.env.LIVE_OPS_ONLINE_THRESHOLD_MS ?? "60000",
  10,
);

function buildMeta() {
  return {
    service: serviceName,
    env: process.env.NODE_ENV?.trim() || "development",
    version: process.env.APP_VERSION?.trim() || "dev",
    backendMode: process.env.BACKEND_MODE?.trim() || "bootstrap",
    commitSha: process.env.COMMIT_SHA?.trim() || null,
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

function extractCompanyIdFromPath(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/profile$/);
  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function extractCompanyMembersPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/members$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyMemberItemPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/members\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]), memberUid: decodeURIComponent(match[2]) };
  } catch {
    return { companyId: match[1], memberUid: match[2] };
  }
}

function extractCompanyInvitesPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/invites$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyInviteItemPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/invites\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]), inviteId: decodeURIComponent(match[2]) };
  } catch {
    return { companyId: match[1], inviteId: match[2] };
  }
}

function extractCompanyAuditLogsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/audit-logs$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyAdminTenantStatePathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/admin-tenant-state$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyRoutesPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyVehiclesPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/vehicles$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyLiveOpsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/live-ops$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyRouteItemPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      routeId: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      routeId: match[2],
    };
  }
}

function extractCompanyVehicleItemPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/vehicles\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      vehicleId: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      vehicleId: match[2],
    };
  }
}

function extractCompanyActiveTripsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/active-trips$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyRouteStopsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes\/([^/]+)\/stops$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      routeId: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      routeId: match[2],
    };
  }
}

function extractCompanyRouteStopItemPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes\/([^/]+)\/stops\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      routeId: decodeURIComponent(match[2]),
      stopId: decodeURIComponent(match[3]),
    };
  } catch {
    return {
      companyId: match[1],
      routeId: match[2],
      stopId: match[3],
    };
  }
}

function extractCompanyRouteStopReorderPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes\/([^/]+)\/stops\/([^/]+)\/reorder$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      routeId: decodeURIComponent(match[2]),
      stopId: decodeURIComponent(match[3]),
    };
  } catch {
    return {
      companyId: match[1],
      routeId: match[2],
      stopId: match[3],
    };
  }
}

function extractCompanyRouteDriverPermissionsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/routes\/([^/]+)\/driver-permissions$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      routeId: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      routeId: match[2],
    };
  }
}

function extractCompanyRouteDriverPermissionItemPathParams(pathname) {
  const match = pathname.match(
    /^\/api\/companies\/([^/]+)\/routes\/([^/]+)\/driver-permissions\/([^/]+)$/,
  );
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      routeId: decodeURIComponent(match[2]),
      driverUid: decodeURIComponent(match[3]),
    };
  } catch {
    return {
      companyId: match[1],
      routeId: match[2],
      driverUid: match[3],
    };
  }
}

function extractCompanyDriversPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/drivers$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyDriverStatusPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/drivers\/([^/]+)\/status$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      driverId: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      driverId: match[2],
    };
  }
}

function extractCompanyDriverRoutePathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/drivers\/([^/]+)\/routes\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      driverId: decodeURIComponent(match[2]),
      routeId: decodeURIComponent(match[3]),
    };
  } catch {
    return {
      companyId: match[1],
      driverId: match[2],
      routeId: match[3],
    };
  }
}

function extractCompanyDriverDocumentsPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/driver-documents$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyDriverDocumentItemPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/drivers\/([^/]+)\/documents\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      driverId: decodeURIComponent(match[2]),
      docType: decodeURIComponent(match[3]),
    };
  } catch {
    return {
      companyId: match[1],
      driverId: match[2],
      docType: match[3],
    };
  }
}

function extractRouteShareLinkPathParams(pathname) {
  const match = pathname.match(/^\/api\/routes\/([^/]+)\/share-link$/);
  if (!match) {
    return null;
  }

  try {
    return { routeId: decodeURIComponent(match[1]) };
  } catch {
    return { routeId: match[1] };
  }
}

function extractPublicRoutePreviewPathParams(pathname) {
  const match = pathname.match(/^\/api\/public\/route-preview\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return { srvCode: decodeURIComponent(match[1]) };
  } catch {
    return { srvCode: match[1] };
  }
}

function extractCompanyLogoUploadPathParams(pathname) {
  const match = pathname.match(/^\/api\/companies\/([^/]+)\/logo$/);
  if (!match) {
    return null;
  }

  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractCompanyLogoMediaPathParams(pathname) {
  const match = pathname.match(/^\/media\/company-logos\/([^/]+)\/([^/]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      fileName: decodeURIComponent(match[2]),
    };
  } catch {
    return {
      companyId: match[1],
      fileName: match[2],
    };
  }
}

function isMyCompaniesPath(pathname) {
  return pathname === "/api/my/companies";
}

function isMyCompanyInvitesPath(pathname) {
  return pathname === "/api/my/company-invites";
}

function isPublicLandingConfigPath(pathname) {
  return pathname === "/api/public/landing-config";
}

function isAuthLoginAttemptPreparePath(pathname) {
  return pathname === "/api/auth/login-attempt/prepare";
}

function isAuthLoginAttemptReportPath(pathname) {
  return pathname === "/api/auth/login-attempt/report";
}

function isAuthLoginContextPath(pathname) {
  return pathname === "/api/auth/login-context";
}

function isAuthSessionPath(pathname) {
  return pathname === "/api/auth/session";
}

function isAuthLoginPath(pathname) {
  return pathname === "/api/auth/login";
}

function isAuthRegisterPath(pathname) {
  return pathname === "/api/auth/register";
}

function isAuthSessionExchangePath(pathname) {
  return pathname === "/api/auth/session/exchange";
}

function isAuthLogoutPath(pathname) {
  return pathname === "/api/auth/logout";
}

function isAuthPasswordResetPath(pathname) {
  return pathname === "/api/auth/password-reset";
}

function isAuthPasswordResetVerifyPath(pathname) {
  return pathname === "/api/auth/password-reset/verify";
}

function isAuthPasswordResetConfirmPath(pathname) {
  return pathname === "/api/auth/password-reset/confirm";
}

function isAuthWebAccessPolicyPath(pathname) {
  return pathname === "/api/auth/web-access-policy";
}

function isAuthProfilePath(pathname) {
  return pathname === "/api/auth/profile";
}

function isPlatformLandingConfigPath(pathname) {
  return pathname === "/api/platform/landing-config";
}

function isPlatformMediaPath(pathname) {
  return pathname === "/api/platform/media";
}

function isPlatformCompaniesPath(pathname) {
  return pathname === "/api/platform/companies";
}

function extractPlatformCompanyItemPath(pathname) {
  const match = pathname.match(/^\/api\/platform\/companies\/([^/]+)$/);
  if (!match) {
    return null;
  }
  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractPlatformCompanyVehicleLimitPath(pathname) {
  const match = pathname.match(/^\/api\/platform\/companies\/([^/]+)\/vehicle-limit$/);
  if (!match) {
    return null;
  }
  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractPlatformCompanyStatusPath(pathname) {
  const match = pathname.match(/^\/api\/platform\/companies\/([^/]+)\/status$/);
  if (!match) {
    return null;
  }
  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractPlatformCompanyResetOwnerPasswordPath(pathname) {
  const match = pathname.match(/^\/api\/platform\/companies\/([^/]+)\/reset-owner-password$/);
  if (!match) {
    return null;
  }
  try {
    return { companyId: decodeURIComponent(match[1]) };
  } catch {
    return { companyId: match[1] };
  }
}

function extractPlatformMediaAssetPath(pathname) {
  const match = pathname.match(/^\/media\/platform-assets\/(.+)$/);
  if (!match) {
    return null;
  }

  try {
    return { assetPath: decodeURIComponent(match[1]) };
  } catch {
    return { assetPath: match[1] };
  }
}

function extractMyCompanyInviteActionPathParams(pathname) {
  const match = pathname.match(/^\/api\/my\/company-invites\/([^/]+)\/(accept|decline)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      companyId: decodeURIComponent(match[1]),
      action: match[2],
    };
  } catch {
    return {
      companyId: match[1],
      action: match[2],
    };
  }
}

function buildProfileUpdateInput(companyId, body) {
  const rawBody = asRecord(body);
  if (!rawBody) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const input = { companyId };
  if (Object.prototype.hasOwnProperty.call(rawBody, "name")) {
    input.name = rawBody.name;
  }
  if (Object.prototype.hasOwnProperty.call(rawBody, "logoUrl")) {
    input.logoUrl = rawBody.logoUrl;
  }
  return input;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  try {
    if (handleCorsPreflight(request, response)) {
      return;
    }
    applyCorsHeaders(request, response);

    if (requestUrl.pathname === "/healthz" || requestUrl.pathname === "/readyz") {
      sendJson(response, 200, {
        ok: true,
        now: new Date().toISOString(),
        ...buildMeta(),
      });
      return;
    }

    if (requestUrl.pathname === "/version") {
      sendJson(response, 200, buildMeta());
      return;
    }

    const platformMediaAssetParams = extractPlatformMediaAssetPath(requestUrl.pathname);
    if (platformMediaAssetParams && request.method === "GET") {
      const mediaFile = await readPlatformMediaAsset(platformMediaAssetParams.assetPath);
      response.writeHead(200, {
        "content-type": mediaFile.contentType,
        "cache-control": mediaFile.cacheControl,
      });
      response.end(mediaFile.fileBuffer);
      return;
    }

    const companyLogoMediaParams = extractCompanyLogoMediaPathParams(requestUrl.pathname);
    if (companyLogoMediaParams && request.method === "GET") {
      const mediaFile = await readCompanyLogoMedia(
        companyLogoMediaParams.companyId,
        companyLogoMediaParams.fileName,
      );
      response.writeHead(200, {
        "content-type": mediaFile.contentType,
        "cache-control": mediaFile.cacheControl,
      });
      response.end(mediaFile.fileBuffer);
      return;
    }

    const publicRoutePreviewParams = extractPublicRoutePreviewPathParams(requestUrl.pathname);
    if (publicRoutePreviewParams && request.method === "GET") {
      const preview = await getDynamicRoutePreview(db, request, {
        srvCode: publicRoutePreviewParams.srvCode,
        token: requestUrl.searchParams.get("token"),
      });
      sendApiOk(response, 200, preview);
      return;
    }

    if (request.method === "POST" && isAuthLoginAttemptPreparePath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const result = await prepareCorporateLoginAttempt(db, request, asRecord(body) ?? {});
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "POST" && isAuthLoginAttemptReportPath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const result = await reportCorporateLoginResult(db, request, asRecord(body) ?? {});
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "POST" && isAuthPasswordResetPath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const result = await sendPasswordResetEmailForAddress(asRecord(body) ?? {});
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "POST" && isAuthPasswordResetVerifyPath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const result = await verifyPasswordResetCodeViaIdentityToolkit(asRecord(body)?.oobCode);
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "POST" && isAuthPasswordResetConfirmPath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const result = await confirmPasswordResetViaIdentityToolkit({
        oobCode: asRecord(body)?.oobCode,
        password: asRecord(body)?.password,
      });
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "GET" && isAuthLoginContextPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const result = resolveCorporateLoginContext(decodedToken);
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "POST" && isAuthLoginPath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const loginResult = await signInWithEmailPasswordViaIdentityToolkit(asRecord(body) ?? {});
      const decodedToken = await exchangeIdTokenForWebSession(response, loginResult.idToken);
      const user = await readCurrentAuthSessionUser(decodedToken);
      sendApiOk(response, 200, { user });
      return;
    }

    if (request.method === "POST" && isAuthRegisterPath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const registerResult = await registerWithEmailPasswordViaIdentityToolkit(asRecord(body) ?? {});
      const decodedToken = await exchangeIdTokenForWebSession(response, registerResult.idToken);
      const user = await readCurrentAuthSessionUser(decodedToken);
      sendApiOk(response, 201, {
        user,
        verificationEmailSent: registerResult.verificationEmailSent,
      });
      return;
    }

    if (request.method === "POST" && isAuthSessionExchangePath(requestUrl.pathname)) {
      const body = await readJsonBody(request);
      const decodedToken = await exchangeIdTokenForWebSession(response, asRecord(body)?.idToken);
      const user = await readCurrentAuthSessionUser(decodedToken);
      sendApiOk(response, 200, { user });
      return;
    }

    if (request.method === "GET" && isAuthSessionPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const user = await readCurrentAuthSessionUser(decodedToken);
      const webAccessPolicy = await getCurrentUserWebAccessPolicy(db, decodedToken.uid);
      sendApiOk(response, 200, {
        user,
        webAccessPolicy,
      });
      return;
    }

    if (request.method === "GET" && isAuthProfilePath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const user = await readCurrentAuthProfile(decodedToken.uid);
      sendApiOk(response, 200, { user });
      return;
    }

    if (request.method === "PATCH" && isAuthProfilePath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const body = await readJsonBody(request);
      const result = await updateCurrentAuthProfile(decodedToken.uid, asRecord(body) ?? {});
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "POST" && isAuthLogoutPath(requestUrl.pathname)) {
      clearWebSessionCookie(response);
      sendApiOk(response, 200, { success: true });
      return;
    }

    if (request.method === "GET" && isAuthWebAccessPolicyPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const result = await getCurrentUserWebAccessPolicy(db, decodedToken.uid);
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "GET" && isPublicLandingConfigPath(requestUrl.pathname)) {
      const landingConfig = await getPublicLandingConfig(db);
      sendApiOk(response, 200, landingConfig);
      return;
    }

    if (request.method === "GET" && isPlatformLandingConfigPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const landingConfig = await getPlatformLandingConfig(db);
      sendApiOk(response, 200, landingConfig);
      return;
    }

    if (request.method === "PATCH" && isPlatformLandingConfigPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const body = await readJsonBody(request);
      const result = await updatePlatformLandingConfig(db, decodedToken.uid, asRecord(body) ?? {});
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "GET" && isPlatformCompaniesPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const result = await listPlatformCompanies(db);
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "POST" && isPlatformCompaniesPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const body = await readJsonBody(request);
      const result = await createPlatformCompany(db, decodedToken.uid, asRecord(body) ?? {});
      sendApiOk(response, 201, result);
      return;
    }

    const platformCompanyItemPath = extractPlatformCompanyItemPath(requestUrl.pathname);
    if (request.method === "GET" && platformCompanyItemPath) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const result = await getPlatformCompanyDetail(db, platformCompanyItemPath);
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "DELETE" && platformCompanyItemPath) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const rtdb = getOptionalFirebaseAdminRtdb();
      const result = await deletePlatformCompany(db, rtdb, platformCompanyItemPath);
      sendApiOk(response, 200, result);
      return;
    }

    const platformCompanyVehicleLimitPath = extractPlatformCompanyVehicleLimitPath(
      requestUrl.pathname,
    );
    if (request.method === "PATCH" && platformCompanyVehicleLimitPath) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const body = await readJsonBody(request);
      const result = await setPlatformCompanyVehicleLimit(db, {
        companyId: platformCompanyVehicleLimitPath.companyId,
        vehicleLimit: asRecord(body)?.vehicleLimit,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const platformCompanyStatusPath = extractPlatformCompanyStatusPath(requestUrl.pathname);
    if (request.method === "PATCH" && platformCompanyStatusPath) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const body = await readJsonBody(request);
      const result = await setPlatformCompanyStatus(db, {
        companyId: platformCompanyStatusPath.companyId,
        status: asRecord(body)?.status,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const platformCompanyResetOwnerPasswordPath = extractPlatformCompanyResetOwnerPasswordPath(
      requestUrl.pathname,
    );
    if (request.method === "POST" && platformCompanyResetOwnerPasswordPath) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const result = await resetPlatformCompanyOwnerPassword(
        db,
        platformCompanyResetOwnerPasswordPath,
      );
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "PUT" && isPlatformMediaPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const storagePath = requestUrl.searchParams.get("storagePath");
      const result = await storePlatformMediaFromRequest(request, storagePath);
      sendApiOk(response, 200, result);
      return;
    }

    if (request.method === "DELETE" && isPlatformMediaPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      requirePlatformOwner(decodedToken);
      const storagePath = requestUrl.searchParams.get("storagePath");
      await removePlatformMedia(storagePath);
      sendApiOk(response, 200, { success: true });
      return;
    }

    if (request.method === "GET" && isMyCompaniesPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberships = await listMyCompanies(db, decodedToken.uid);
      sendApiOk(response, 200, memberships);
      return;
    }

    if (request.method === "POST" && isMyCompaniesPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const body = await readJsonBody(request);
      const company = await createCompany(db, decodedToken.uid, asRecord(body) ?? {});
      sendApiOk(response, 201, company);
      return;
    }

    if (request.method === "GET" && isMyCompanyInvitesPath(requestUrl.pathname)) {
      const decodedToken = await requireAuthenticatedUser(request);
      const invites = await listMyPendingCompanyInvites(db, decodedToken.uid);
      sendApiOk(response, 200, invites);
      return;
    }

    const myCompanyInviteActionParams = extractMyCompanyInviteActionPathParams(requestUrl.pathname);
    if (myCompanyInviteActionParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const actionInput = {
        companyId: myCompanyInviteActionParams.companyId,
      };
      const result =
        myCompanyInviteActionParams.action === "accept"
          ? await acceptMyCompanyInvite(db, decodedToken.uid, actionInput)
          : await declineMyCompanyInvite(db, decodedToken.uid, actionInput);
      sendApiOk(response, 200, result);
      return;
    }

    const companyMembersParams = extractCompanyMembersPathParams(requestUrl.pathname);
    if (companyMembersParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyMembersParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const members = await listCompanyMembers(db, {
        companyId: companyMembersParams.companyId,
        limit,
      });
      sendApiOk(response, 200, members);
      return;
    }

    if (companyMembersParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyMembersParams.companyId,
        decodedToken.uid,
      );

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await inviteCompanyMember(db, decodedToken.uid, memberRole, {
        companyId: companyMembersParams.companyId,
        email: rawBody.email,
        role: rawBody.role,
      });
      sendApiOk(response, 201, result);
      return;
    }

    const companyMemberItemParams = extractCompanyMemberItemPathParams(requestUrl.pathname);
    if (companyMemberItemParams && request.method === "PATCH") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyMemberItemParams.companyId,
        decodedToken.uid,
      );

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await updateCompanyMember(db, decodedToken.uid, memberRole, {
        companyId: companyMemberItemParams.companyId,
        memberUid: companyMemberItemParams.memberUid,
        patch: asRecord(rawBody.patch) ?? rawBody,
      });
      sendApiOk(response, 200, result);
      return;
    }

    if (companyMemberItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyMemberItemParams.companyId,
        decodedToken.uid,
      );

      const result = await removeCompanyMember(db, decodedToken.uid, memberRole, {
        companyId: companyMemberItemParams.companyId,
        memberUid: companyMemberItemParams.memberUid,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyInvitesParams = extractCompanyInvitesPathParams(requestUrl.pathname);
    if (companyInvitesParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyInvitesParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const invites = await listCompanyInvites(db, {
        companyId: companyInvitesParams.companyId,
        limit,
      });
      sendApiOk(response, 200, invites);
      return;
    }

    const companyInviteItemParams = extractCompanyInviteItemPathParams(requestUrl.pathname);
    if (companyInviteItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyInviteItemParams.companyId,
        decodedToken.uid,
      );

      const result = await revokeCompanyInvite(db, decodedToken.uid, memberRole, {
        companyId: companyInviteItemParams.companyId,
        inviteId: companyInviteItemParams.inviteId,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyAuditLogsParams = extractCompanyAuditLogsPathParams(requestUrl.pathname);
    if (companyAuditLogsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyAuditLogsParams.companyId,
        decodedToken.uid,
      );
      requireCompanyOwnerOrAdmin(memberRole);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const auditLogs = await listCompanyAuditLogs(db, {
        companyId: companyAuditLogsParams.companyId,
        limit,
      });
      sendApiOk(response, 200, auditLogs);
      return;
    }

    const companyAdminTenantStateParams = extractCompanyAdminTenantStatePathParams(
      requestUrl.pathname,
    );
    if (companyAdminTenantStateParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyAdminTenantStateParams.companyId,
        decodedToken.uid,
      );
      requireCompanyOwnerOrAdmin(memberRole);

      const tenantState = await getCompanyAdminTenantState(
        db,
        companyAdminTenantStateParams.companyId,
      );
      sendApiOk(response, 200, tenantState);
      return;
    }

    if (companyAdminTenantStateParams && request.method === "PATCH") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyAdminTenantStateParams.companyId,
        decodedToken.uid,
      );
      requireCompanyOwnerOrAdmin(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await updateCompanyAdminTenantState(db, decodedToken.uid, memberRole, {
        companyId: companyAdminTenantStateParams.companyId,
        patch: asRecord(rawBody.patch) ?? rawBody,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyRoutesParams = extractCompanyRoutesPathParams(requestUrl.pathname);
    if (companyRoutesParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyRoutesParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const includeArchived = requestUrl.searchParams.get("includeArchived") === "true";
      const routes = await listCompanyRoutes(db, {
        companyId: companyRoutesParams.companyId,
        limit,
        includeArchived,
      });
      sendApiOk(response, 200, routes);
      return;
    }

    const companyLiveOpsParams = extractCompanyLiveOpsPathParams(requestUrl.pathname);
    if (companyLiveOpsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyLiveOpsParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const rtdb = getOptionalFirebaseAdminRtdb();
      const snapshot = await listCompanyLiveOpsSnapshot(db, rtdb, {
        companyId: companyLiveOpsParams.companyId,
        limit,
        liveOpsOnlineThresholdMs,
      });
      sendApiOk(response, 200, snapshot);
      return;
    }

    if (companyRoutesParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRoutesParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const body = await readJsonBody(request);
      const result = await createCompanyRoute(db, decodedToken.uid, memberRole, {
        ...(asRecord(body) ?? {}),
        companyId: companyRoutesParams.companyId,
      });
      sendApiOk(response, 201, result);
      return;
    }

    const companyVehiclesParams = extractCompanyVehiclesPathParams(requestUrl.pathname);
    if (companyVehiclesParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyVehiclesParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const vehicles = await listCompanyVehicles(db, {
        companyId: companyVehiclesParams.companyId,
        limit,
      });
      sendApiOk(response, 200, vehicles);
      return;
    }

    if (companyVehiclesParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyVehiclesParams.companyId,
        decodedToken.uid,
      );
      requireCompanyVehicleWriteRole(memberRole);

      const body = await readJsonBody(request);
      const result = await createCompanyVehicle(db, decodedToken.uid, memberRole, {
        ...(asRecord(body) ?? {}),
        companyId: companyVehiclesParams.companyId,
      });
      sendApiOk(response, 201, result);
      return;
    }

    const companyVehicleItemParams = extractCompanyVehicleItemPathParams(requestUrl.pathname);
    if (companyVehicleItemParams && request.method === "PATCH") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyVehicleItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyVehicleWriteRole(memberRole);

      const body = await readJsonBody(request);
      const result = await updateCompanyVehicle(db, decodedToken.uid, memberRole, {
        companyId: companyVehicleItemParams.companyId,
        vehicleId: companyVehicleItemParams.vehicleId,
        patch: body,
      });
      sendApiOk(response, 200, result);
      return;
    }

    if (companyVehicleItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyVehicleItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyVehicleWriteRole(memberRole);

      const result = await deleteCompanyVehicle(db, decodedToken.uid, memberRole, {
        companyId: companyVehicleItemParams.companyId,
        vehicleId: companyVehicleItemParams.vehicleId,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyRouteItemParams = extractCompanyRouteItemPathParams(requestUrl.pathname);
    if (companyRouteItemParams && request.method === "PATCH") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRouteItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await updateCompanyRoute(db, decodedToken.uid, memberRole, {
        companyId: companyRouteItemParams.companyId,
        routeId: companyRouteItemParams.routeId,
        ...(hasOwn(rawBody, "lastKnownUpdateToken")
          ? { lastKnownUpdateToken: rawBody.lastKnownUpdateToken }
          : {}),
        patch: asRecord(rawBody.patch) ?? rawBody,
      });
      sendApiOk(response, 200, result);
      return;
    }

    if (companyRouteItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRouteItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const result = await deleteCompanyRoute(db, decodedToken.uid, memberRole, {
        companyId: companyRouteItemParams.companyId,
        routeId: companyRouteItemParams.routeId,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyActiveTripsParams = extractCompanyActiveTripsPathParams(requestUrl.pathname);
    if (companyActiveTripsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyActiveTripsParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const routeId = requestUrl.searchParams.get("routeId")?.trim() || null;
      const driverUid = requestUrl.searchParams.get("driverUid")?.trim() || null;
      const rtdb = getOptionalFirebaseAdminRtdb();
      const activeTrips = await listActiveTripsByCompany(db, rtdb, {
        companyId: companyActiveTripsParams.companyId,
        routeId,
        driverUid,
        limit,
        liveOpsOnlineThresholdMs,
      });
      sendApiOk(response, 200, activeTrips);
      return;
    }

    const companyRouteStopsParams = extractCompanyRouteStopsPathParams(requestUrl.pathname);
    if (companyRouteStopsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyRouteStopsParams.companyId, decodedToken.uid);

      const routeStops = await listCompanyRouteStops(db, {
        companyId: companyRouteStopsParams.companyId,
        routeId: companyRouteStopsParams.routeId,
      });
      sendApiOk(response, 200, routeStops);
      return;
    }

    if (companyRouteStopsParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRouteStopsParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const body = await readJsonBody(request);
      const result = await upsertCompanyRouteStop(db, decodedToken.uid, memberRole, {
        ...(asRecord(body) ?? {}),
        companyId: companyRouteStopsParams.companyId,
        routeId: companyRouteStopsParams.routeId,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyRouteStopItemParams = extractCompanyRouteStopItemPathParams(requestUrl.pathname);
    if (companyRouteStopItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRouteStopItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await deleteCompanyRouteStop(db, decodedToken.uid, memberRole, {
        companyId: companyRouteStopItemParams.companyId,
        routeId: companyRouteStopItemParams.routeId,
        stopId: companyRouteStopItemParams.stopId,
        ...(hasOwn(rawBody, "lastKnownUpdateToken")
          ? { lastKnownUpdateToken: rawBody.lastKnownUpdateToken }
          : {}),
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyRouteStopReorderParams = extractCompanyRouteStopReorderPathParams(
      requestUrl.pathname,
    );
    if (companyRouteStopReorderParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRouteStopReorderParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await reorderCompanyRouteStops(db, decodedToken.uid, memberRole, {
        companyId: companyRouteStopReorderParams.companyId,
        routeId: companyRouteStopReorderParams.routeId,
        stopId: companyRouteStopReorderParams.stopId,
        direction: rawBody.direction,
        ...(hasOwn(rawBody, "lastKnownUpdateToken")
          ? { lastKnownUpdateToken: rawBody.lastKnownUpdateToken }
          : {}),
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyRouteDriverPermissionsParams = extractCompanyRouteDriverPermissionsPathParams(
      requestUrl.pathname,
    );
    if (companyRouteDriverPermissionsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(
        db,
        companyRouteDriverPermissionsParams.companyId,
        decodedToken.uid,
      );

      const result = await listRouteDriverPermissions(db, {
        companyId: companyRouteDriverPermissionsParams.companyId,
        routeId: companyRouteDriverPermissionsParams.routeId,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyRouteDriverPermissionItemParams =
      extractCompanyRouteDriverPermissionItemPathParams(requestUrl.pathname);
    if (companyRouteDriverPermissionItemParams && request.method === "PUT") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRouteDriverPermissionItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await grantDriverRoutePermissions(db, decodedToken.uid, memberRole, {
        companyId: companyRouteDriverPermissionItemParams.companyId,
        routeId: companyRouteDriverPermissionItemParams.routeId,
        driverUid: companyRouteDriverPermissionItemParams.driverUid,
        permissions: rawBody.permissions,
      });
      sendApiOk(response, 200, result);
      return;
    }

    if (companyRouteDriverPermissionItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyRouteDriverPermissionItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyRouteWriteRole(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await revokeDriverRoutePermissions(db, decodedToken.uid, memberRole, {
        companyId: companyRouteDriverPermissionItemParams.companyId,
        routeId: companyRouteDriverPermissionItemParams.routeId,
        driverUid: companyRouteDriverPermissionItemParams.driverUid,
        permissionKeys: rawBody.permissionKeys,
        resetToDefault: rawBody.resetToDefault,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyDriversParams = extractCompanyDriversPathParams(requestUrl.pathname);
    if (companyDriversParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyDriversParams.companyId, decodedToken.uid);

      const rawLimit = requestUrl.searchParams.get("limit");
      const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
      const drivers = await listCompanyDrivers(db, {
        companyId: companyDriversParams.companyId,
        limit,
      });
      sendApiOk(response, 200, drivers);
      return;
    }

    if (companyDriversParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyDriversParams.companyId,
        decodedToken.uid,
      );
      requireCompanyDriverWriteRole(memberRole);

      const body = await readJsonBody(request);
      const result = await createCompanyDriverAccount(db, decodedToken.uid, {
        ...(asRecord(body) ?? {}),
        companyId: companyDriversParams.companyId,
      });
      sendApiOk(response, 201, result);
      return;
    }

    const companyDriverRouteParams = extractCompanyDriverRoutePathParams(requestUrl.pathname);
    if (companyDriverRouteParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyDriverRouteParams.companyId,
        decodedToken.uid,
      );
      requireCompanyDriverWriteRole(memberRole);

      const result = await assignCompanyDriverToRoute(db, decodedToken.uid, companyDriverRouteParams);
      sendApiOk(response, 200, result);
      return;
    }

    if (companyDriverRouteParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyDriverRouteParams.companyId,
        decodedToken.uid,
      );
      requireCompanyDriverWriteRole(memberRole);

      const result = await unassignCompanyDriverFromRoute(
        db,
        decodedToken.uid,
        companyDriverRouteParams,
      );
      sendApiOk(response, 200, result);
      return;
    }

    const companyDriverStatusParams = extractCompanyDriverStatusPathParams(requestUrl.pathname);
    if (companyDriverStatusParams && request.method === "PATCH") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyDriverStatusParams.companyId,
        decodedToken.uid,
      );
      requireCompanyDriverWriteRole(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await updateCompanyDriverStatus(db, decodedToken.uid, {
        ...companyDriverStatusParams,
        status: rawBody.status,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyDriverDocumentsParams = extractCompanyDriverDocumentsPathParams(requestUrl.pathname);
    if (companyDriverDocumentsParams && request.method === "GET") {
      const decodedToken = await requireAuthenticatedUser(request);
      await requireActiveCompanyMemberRole(db, companyDriverDocumentsParams.companyId, decodedToken.uid);

      const driverId = requestUrl.searchParams.get("driverId") ?? undefined;
      const result = await listDriverDocuments(db, {
        companyId: companyDriverDocumentsParams.companyId,
        driverId,
      });
      sendApiOk(response, 200, result);
      return;
    }

    const companyDriverDocumentItemParams = extractCompanyDriverDocumentItemPathParams(
      requestUrl.pathname,
    );
    if (companyDriverDocumentItemParams && request.method === "PUT") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyDriverDocumentItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyDriverWriteRole(memberRole);

      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await upsertDriverDocument(db, decodedToken.uid, {
        ...companyDriverDocumentItemParams,
        issueDate: rawBody.issueDate,
        expiryDate: rawBody.expiryDate,
        licenseClass: rawBody.licenseClass,
        note: rawBody.note,
      });
      sendApiOk(response, 200, result);
      return;
    }

    if (companyDriverDocumentItemParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyDriverDocumentItemParams.companyId,
        decodedToken.uid,
      );
      requireCompanyDriverWriteRole(memberRole);

      const result = await deleteDriverDocument(db, companyDriverDocumentItemParams);
      sendApiOk(response, 200, result);
      return;
    }

    const companyLogoUploadParams = extractCompanyLogoUploadPathParams(requestUrl.pathname);
    if (companyLogoUploadParams && request.method === "PUT") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyLogoUploadParams.companyId,
        decodedToken.uid,
      );
      requireCompanyOwnerOrAdmin(memberRole);

      const uploadedLogo = await storeCompanyLogoFromRequest(request, companyLogoUploadParams.companyId);

      try {
        const result = await updateCompanyProfile(db, {
          companyId: companyLogoUploadParams.companyId,
          logoUrl: uploadedLogo.publicUrl,
        });
        await cleanupStoredCompanyLogos(companyLogoUploadParams.companyId, uploadedLogo.fileName);
        sendApiOk(response, 200, {
          ...result,
          logoUrl: uploadedLogo.publicUrl,
        });
      } catch (error) {
        await removeStoredCompanyLogoFile(uploadedLogo.relativePath);
        throw error;
      }
      return;
    }

    if (companyLogoUploadParams && request.method === "DELETE") {
      const decodedToken = await requireAuthenticatedUser(request);
      const memberRole = await requireActiveCompanyMemberRole(
        db,
        companyLogoUploadParams.companyId,
        decodedToken.uid,
      );
      requireCompanyOwnerOrAdmin(memberRole);

      const result = await updateCompanyProfile(db, {
        companyId: companyLogoUploadParams.companyId,
        logoUrl: "",
      });
      await removeStoredCompanyLogo(companyLogoUploadParams.companyId);
      sendApiOk(response, 200, result);
      return;
    }

    const companyId = extractCompanyIdFromPath(requestUrl.pathname);
    if (companyId) {
      if (request.method === "GET") {
        const decodedToken = await requireAuthenticatedUser(request);
        await requireActiveCompanyMemberRole(db, companyId, decodedToken.uid);
        const profile = await getCompanyProfile(db, companyId);
        sendApiOk(response, 200, profile);
        return;
      }

      if (request.method === "PATCH") {
        const decodedToken = await requireAuthenticatedUser(request);
        const memberRole = await requireActiveCompanyMemberRole(db, companyId, decodedToken.uid);
        requireCompanyOwnerOrAdmin(memberRole);

        const body = await readJsonBody(request);
        const input = buildProfileUpdateInput(companyId, body);
        const result = await updateCompanyProfile(db, input);
        sendApiOk(response, 200, result);
        return;
      }
    }

    const routeShareLinkParams = extractRouteShareLinkPathParams(requestUrl.pathname);
    if (routeShareLinkParams && request.method === "POST") {
      const decodedToken = await requireAuthenticatedUser(request);
      const body = await readJsonBody(request);
      const rawBody = asRecord(body) ?? {};
      const result = await generateRouteShareLink(db, decodedToken.uid, {
        routeId: routeShareLinkParams.routeId,
        customText: rawBody.customText,
      });
      sendApiOk(response, 200, result);
      return;
    }

    sendJson(response, 200, {
      ok: true,
      message: "Self-hosted backend bootstrap is running.",
      nextStep: "Add HTTP endpoints here before replacing Firebase callables.",
      ...buildMeta(),
    });
  } catch (error) {
    sendApiError(response, error);
  }
});

server.listen(port, host, () => {
  // Keep this log single-line for container log scanning.
  console.log(
    JSON.stringify({
      level: "info",
      event: "server_started",
      service: serviceName,
      host,
      port,
      startedAt: startedAt.toISOString(),
    }),
  );
});
