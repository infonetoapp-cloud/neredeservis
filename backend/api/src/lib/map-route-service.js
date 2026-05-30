import { getMapRoutingConfig } from "./map-config.js";
import { fetchJsonOrThrow } from "./map-http.js";
import { HttpError } from "./http.js";

function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

function sanitizeCoordinates(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const coordinates = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const lat = Number.parseFloat(item.lat);
    const lng = Number.parseFloat(item.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }
    coordinates.push({ lat, lng });
  }
  return coordinates;
}

function sanitizeGeometryCoordinates(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => Array.isArray(item) && item.length >= 2)
    .map((item) => [Number(item[0]), Number(item[1])])
    .filter((item) => Number.isFinite(item[0]) && Number.isFinite(item[1]));
}

export async function previewMapRoute(input) {
  const config = getMapRoutingConfig();
  const waypoints = sanitizeCoordinates(input.waypoints ?? input.coordinates);

  if (waypoints.length < 2) {
    throw new HttpError(400, "invalid-argument", "Rota icin en az iki nokta gerekli.");
  }

  if (waypoints.length > config.maxWaypoints) {
    throw new HttpError(
      400,
      "invalid-argument",
      `Rota istegi en fazla ${config.maxWaypoints} nokta destekliyor.`,
    );
  }

  const profile = "driving";
  const coordinatePath = waypoints.map((item) => `${item.lng},${item.lat}`).join(";");
  const requestUrl = new URL(
    `route/v1/${profile}/${coordinatePath}`,
    ensureTrailingSlash(config.baseUrl),
  );
  requestUrl.searchParams.set("alternatives", "false");
  requestUrl.searchParams.set("overview", "full");
  requestUrl.searchParams.set("geometries", "geojson");
  requestUrl.searchParams.set("steps", "false");
  requestUrl.searchParams.set("annotations", "false");

  const payload = await fetchJsonOrThrow(requestUrl.toString(), {
    timeoutMs: config.timeoutMs,
  });

  const route = Array.isArray(payload?.routes) ? payload.routes[0] : null;
  const geometryCoordinates = sanitizeGeometryCoordinates(route?.geometry?.coordinates);
  if (!route || geometryCoordinates.length < 2) {
    throw new HttpError(502, "map-route-unavailable", "Rota servisi uygun geometri donmedi.");
  }

  return {
    provider: "osrm",
    profile,
    distanceMeters:
      typeof route.distance === "number" && Number.isFinite(route.distance) ? route.distance : null,
    durationSeconds:
      typeof route.duration === "number" && Number.isFinite(route.duration) ? route.duration : null,
    geometry: {
      type: "LineString",
      coordinates: geometryCoordinates,
    },
    legs: Array.isArray(route.legs)
      ? route.legs.map((leg) => ({
          distanceMeters:
            typeof leg?.distance === "number" && Number.isFinite(leg.distance) ? leg.distance : null,
          durationSeconds:
            typeof leg?.duration === "number" && Number.isFinite(leg.duration) ? leg.duration : null,
          summary: typeof leg?.summary === "string" ? leg.summary : "",
        }))
      : [],
  };
}
