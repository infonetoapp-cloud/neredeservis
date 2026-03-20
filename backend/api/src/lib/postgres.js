import { Pool } from "pg";

let postgresPool = null;

function readDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

function shouldUseSsl() {
  const rawValue = (process.env.DATABASE_SSL ?? process.env.PGSSLMODE ?? "").trim().toLowerCase();
  return rawValue === "require" || rawValue === "true" || rawValue === "1" || rawValue === "yes";
}

export function isPostgresConfigured() {
  return Boolean(readDatabaseUrl());
}

export function getPostgresPool() {
  const connectionString = readDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  if (!postgresPool) {
    postgresPool = new Pool({
      connectionString,
      max: Number.parseInt(process.env.POSTGRES_POOL_MAX ?? "6", 10) || 6,
      ssl: shouldUseSsl() ? { rejectUnauthorized: false } : undefined,
    });
  }

  return postgresPool;
}

export async function ensurePostgresAuthSchema() {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      uid TEXT PRIMARY KEY,
      email TEXT NULL,
      email_lowercase TEXT NULL,
      display_name TEXT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      provider_data JSONB NOT NULL DEFAULT '[]'::jsonb,
      sign_in_provider TEXT NULL,
      profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS auth_users_email_lowercase_idx
      ON auth_users (email_lowercase);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS web_login_guard (
      doc_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      failed_count INTEGER NOT NULL DEFAULT 0,
      first_failure_ms BIGINT NOT NULL DEFAULT 0,
      last_failure_ms BIGINT NOT NULL DEFAULT 0,
      lock_until_ms BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS web_login_guard_email_ip_idx
      ON web_login_guard (email, ip_address);
  `);

  return true;
}
