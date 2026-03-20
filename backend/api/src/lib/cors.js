const DEFAULT_ALLOWED_ORIGINS = [
  "https://neredeservis.app",
  "https://www.neredeservis.app",
  "https://app.neredeservis.app",
  "https://stg-app.neredeservis.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function readAllowedOrigins() {
  const rawValue = (process.env.WEB_CORS_ALLOWED_ORIGINS ?? "").trim();
  if (!rawValue) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const items = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return items.length > 0 ? items : DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(origin) {
  const allowedOrigins = readAllowedOrigins();
  return allowedOrigins.includes(origin);
}

export function applyCorsHeaders(request, response) {
  const origin = typeof request.headers.origin === "string" ? request.headers.origin.trim() : "";
  if (!origin || !isOriginAllowed(origin)) {
    return false;
  }

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "authorization, content-type, x-requested-with");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  response.setHeader("Vary", "Origin");
  return true;
}

export function handleCorsPreflight(request, response) {
  if (request.method !== "OPTIONS") {
    return false;
  }

  const allowed = applyCorsHeaders(request, response);
  if (!allowed && request.headers.origin) {
    response.writeHead(403, { "cache-control": "no-store" });
    response.end();
    return true;
  }

  response.writeHead(204, { "cache-control": "no-store" });
  response.end();
  return true;
}
