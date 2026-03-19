import { randomUUID } from "node:crypto";

export class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
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
