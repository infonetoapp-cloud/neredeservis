import pg from "pg";

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

function readBooleanEnv(key, fallback = false) {
  const rawValue = process.env[key];
  if (typeof rawValue !== "string") {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

let pool = null;

function buildPool() {
  const connectionString = readTrimmedEnv("DATABASE_URL", "POSTGRES_URL");
  if (!connectionString) {
    return null;
  }

  const sslEnabled = readBooleanEnv("DATABASE_SSL", false);
  return new pg.Pool({
    connectionString,
    max: readIntEnv("POSTGRES_POOL_MAX", 4),
    idleTimeoutMillis: readIntEnv("POSTGRES_IDLE_TIMEOUT_MS", 30000),
    connectionTimeoutMillis: readIntEnv("POSTGRES_CONNECT_TIMEOUT_MS", 5000),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  });
}

export function getMapDbPool() {
  if (!pool) {
    pool = buildPool();
  }
  return pool;
}

export async function withMapDbClient(callback) {
  const dbPool = getMapDbPool();
  if (!dbPool) {
    throw new Error("database-unconfigured");
  }

  const client = await dbPool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function closeMapDbPool() {
  if (pool) {
    const currentPool = pool;
    pool = null;
    await currentPool.end();
  }
}
