import { createServer } from "node:http";

import { requireAuthenticatedUser } from "./lib/auth.js";
import { requireActiveCompanyMemberRole } from "./lib/company-access.js";
import { getCompanyProfile } from "./lib/company-profile.js";
import { getFirebaseAdminDb } from "./lib/firebase-admin.js";
import { sendApiError, sendApiOk, sendJson } from "./lib/http.js";

const serviceName = process.env.SERVICE_NAME?.trim() || "neredeservis-backend-api";
const host = process.env.HOST?.trim() || "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const startedAt = new Date();
const db = getFirebaseAdminDb();

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

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  try {
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

    if (request.method === "GET") {
      const companyId = extractCompanyIdFromPath(requestUrl.pathname);
      if (companyId) {
        const decodedToken = await requireAuthenticatedUser(request);
        await requireActiveCompanyMemberRole(db, companyId, decodedToken.uid);
        const profile = await getCompanyProfile(db, companyId);
        sendApiOk(response, 200, profile);
        return;
      }
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
