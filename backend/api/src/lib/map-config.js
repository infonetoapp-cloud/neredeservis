function readTrimmedEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readIntEnv(key, fallback) {
  const rawValue = process.env[key];
  const parsed = Number.parseInt(rawValue ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getMapRoutingConfig() {
  return {
    baseUrl: readTrimmedEnv("MAP_ROUTING_BASE_URL") ?? "https://routing.neredeservis.app",
    timeoutMs: readIntEnv("MAP_ROUTING_TIMEOUT_MS", 12000),
    maxWaypoints: readIntEnv("MAP_ROUTE_MAX_WAYPOINTS", 64),
  };
}

export function getMapSearchConfig() {
  return {
    provider: (readTrimmedEnv("MAP_SEARCH_PROVIDER") ?? "place-index").toLowerCase(),
    language: (readTrimmedEnv("MAP_SEARCH_LANGUAGE") ?? "tr").toLowerCase(),
    country: (readTrimmedEnv("MAP_SEARCH_COUNTRY") ?? "tr").toLowerCase(),
    bbox: readTrimmedEnv("MAP_SEARCH_BBOX") ?? "28.9500,40.7000,29.6800,41.1700",
    timeoutMs: readIntEnv("MAP_SEARCH_TIMEOUT_MS", 10000),
    limitMax: readIntEnv("MAP_SEARCH_LIMIT_MAX", 8),
  };
}

export function getMapReverseConfig() {
  return {
    provider: (readTrimmedEnv("MAP_REVERSE_PROVIDER") ?? "place-index").toLowerCase(),
    language: (readTrimmedEnv("MAP_REVERSE_LANGUAGE") ?? "tr").toLowerCase(),
    timeoutMs: readIntEnv("MAP_REVERSE_TIMEOUT_MS", 10000),
    bootstrapRadiusMeters: readIntEnv("MAP_REVERSE_BOOTSTRAP_RADIUS_METERS", 650),
  };
}
