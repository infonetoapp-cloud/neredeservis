import { randomUUID } from "node:crypto";

export class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function readJsonBody(request, options = {}) {
  const maxBytes = Number.isFinite(options.maxBytes) ? options.maxBytes : 64 * 1024;
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw new HttpError(413, "payload-too-large", "Istek govdesi cok buyuk.");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }
}

export function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(body);
}

export function buildApiOk(data) {
  return {
    requestId: randomUUID(),
    serverTime: new Date().toISOString(),
    data,
  };
}

export function sendApiOk(response, statusCode, data) {
  sendJson(response, statusCode, buildApiOk(data));
}

export function sendApiError(response, error) {
  if (error instanceof HttpError) {
    sendJson(response, error.statusCode, {
      requestId: randomUUID(),
      serverTime: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  console.error(
    JSON.stringify({
      level: "error",
      event: "unhandled_request_error",
      message: error instanceof Error ? error.message : "unknown_error",
    }),
  );

  sendJson(response, 500, {
    requestId: randomUUID(),
    serverTime: new Date().toISOString(),
    error: {
      code: "internal",
      message: "Beklenmeyen bir sunucu hatasi olustu.",
    },
  });
}
