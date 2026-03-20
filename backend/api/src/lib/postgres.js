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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      company_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      legal_name TEXT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      billing_status TEXT NOT NULL DEFAULT 'active',
      timezone TEXT NULL,
      country_code TEXT NULL,
      contact_phone TEXT NULL,
      contact_email TEXT NULL,
      logo_url TEXT NULL,
      address TEXT NULL,
      vehicle_limit INTEGER NULL,
      created_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS vehicles_synced_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS drivers_synced_at TIMESTAMPTZ NULL;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_members (
      company_id TEXT NOT NULL,
      uid TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      permissions JSONB NULL,
      invited_by TEXT NULL,
      invited_at TIMESTAMPTZ NULL,
      accepted_at TIMESTAMPTZ NULL,
      company_name_snapshot TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (company_id, uid)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_members_uid_idx
      ON company_members (uid);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_members_company_id_idx
      ON company_members (company_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_vehicles (
      vehicle_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      owner_type TEXT NOT NULL DEFAULT 'company',
      plate TEXT NOT NULL,
      plate_normalized TEXT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      brand TEXT NULL,
      model TEXT NULL,
      year INTEGER NULL,
      capacity INTEGER NULL,
      created_by TEXT NULL,
      updated_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_vehicles_company_id_idx
      ON company_vehicles (company_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_vehicles_company_plate_idx
      ON company_vehicles (company_id, plate_normalized);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_drivers (
      driver_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      phone TEXT NULL,
      plate TEXT NULL,
      login_email TEXT NULL,
      temporary_password TEXT NULL,
      mobile_only BOOLEAN NOT NULL DEFAULT FALSE,
      created_by TEXT NULL,
      updated_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_drivers_company_id_idx
      ON company_drivers (company_id);
  `);

  return true;
}
