import { createServer } from "node:http";

const serviceName = process.env.SERVICE_NAME?.trim() || "neredeservis-backend-api";
const host = process.env.HOST?.trim() || "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const startedAt = new Date();

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(body);
}

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

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

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

  sendJson(response, 200, {
    ok: true,
    message: "Self-hosted backend bootstrap is running.",
    nextStep: "Add HTTP endpoints here before replacing Firebase callables.",
    ...buildMeta(),
  });
});

server.listen(port, host, () => {
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
