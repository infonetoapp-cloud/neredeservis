import { HttpError } from "./http.js";

export async function fetchJsonOrThrow(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    const rawText = await response.text();
    let payload = null;
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      throw new HttpError(
        502,
        "map-upstream-failed",
        "Harita servisinden gecerli bir yanit alinamadi.",
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpError(504, "map-upstream-timeout", "Harita servisi zaman asimina ugradi.");
    }
    throw new HttpError(502, "map-upstream-failed", "Harita servisine ulasilamadi.");
  } finally {
    clearTimeout(timeoutId);
  }
}
