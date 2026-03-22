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
      billing_valid_until TIMESTAMPTZ NULL,
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
      ADD COLUMN IF NOT EXISTS drivers_synced_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS driver_documents_synced_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS routes_synced_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS member_invites_synced_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS audit_logs_synced_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS active_trips_synced_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS billing_valid_until TIMESTAMPTZ NULL;
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_driver_documents (
      company_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      issue_date TEXT NULL,
      expiry_date TEXT NULL,
      license_class TEXT NULL,
      note TEXT NULL,
      uploaded_at TIMESTAMPTZ NULL,
      uploaded_by TEXT NULL,
      updated_at TIMESTAMPTZ NULL,
      PRIMARY KEY (company_id, driver_id, doc_type)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_driver_documents_company_driver_idx
      ON company_driver_documents (company_id, driver_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_routes (
      route_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      srv_code TEXT NULL,
      driver_id TEXT NULL,
      authorized_driver_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      scheduled_time TEXT NULL,
      time_slot TEXT NULL,
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      allow_guest_tracking BOOLEAN NOT NULL DEFAULT FALSE,
      start_address TEXT NULL,
      end_address TEXT NULL,
      start_point JSONB NULL,
      end_point JSONB NULL,
      vehicle_id TEXT NULL,
      vehicle_plate TEXT NULL,
      passenger_count INTEGER NOT NULL DEFAULT 0,
      visibility TEXT NULL,
      creation_mode TEXT NULL,
      route_polyline JSONB NULL,
      vacation_until TIMESTAMPTZ NULL,
      last_trip_started_notification_at TIMESTAMPTZ NULL,
      created_by TEXT NULL,
      updated_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      stops_synced_at TIMESTAMPTZ NULL,
      driver_permissions_synced_at TIMESTAMPTZ NULL
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_routes_company_id_idx
      ON company_routes (company_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_routes_company_updated_idx
      ON company_routes (company_id, updated_at DESC);
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS company_routes_srv_code_upper_unique_idx
      ON company_routes ((UPPER(srv_code)))
      WHERE srv_code IS NOT NULL;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_route_stops (
      stop_id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES company_routes(route_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      stop_order INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NULL,
      updated_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_route_stops_route_id_idx
      ON company_route_stops (route_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_route_stops_route_order_idx
      ON company_route_stops (route_id, stop_order);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_route_driver_permissions (
      company_id TEXT NOT NULL,
      route_id TEXT NOT NULL REFERENCES company_routes(route_id) ON DELETE CASCADE,
      driver_uid TEXT NOT NULL,
      permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by TEXT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by TEXT NULL,
      PRIMARY KEY (route_id, driver_uid)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_route_driver_permissions_company_route_idx
      ON company_route_driver_permissions (company_id, route_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_invites (
      invite_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      invited_uid TEXT NULL,
      invited_email TEXT NOT NULL,
      invited_email_lowercase TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      invited_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NULL,
      accepted_at TIMESTAMPTZ NULL,
      declined_at TIMESTAMPTZ NULL,
      revoked_at TIMESTAMPTZ NULL
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_invites_company_id_idx
      ON company_invites (company_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_invites_company_status_idx
      ON company_invites (company_id, status, updated_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_invites_invited_uid_idx
      ON company_invites (invited_uid);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_audit_logs (
      audit_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      target_type TEXT NULL,
      target_id TEXT NULL,
      actor_uid TEXT NULL,
      status TEXT NOT NULL DEFAULT 'unknown',
      reason TEXT NULL,
      metadata JSONB NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_audit_logs_company_created_idx
      ON company_audit_logs (company_id, created_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_active_trips (
      trip_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      route_name TEXT NOT NULL,
      route_updated_at TIMESTAMPTZ NULL,
      driver_uid TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      driver_plate TEXT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TIMESTAMPTZ NULL,
      last_location_at TIMESTAMPTZ NULL,
      updated_at TIMESTAMPTZ NULL,
      live_state TEXT NOT NULL DEFAULT 'stale',
      live_source TEXT NULL,
      live_stale BOOLEAN NOT NULL DEFAULT TRUE,
      lat DOUBLE PRECISION NULL,
      lng DOUBLE PRECISION NULL,
      speed DOUBLE PRECISION NULL,
      heading DOUBLE PRECISION NULL,
      accuracy DOUBLE PRECISION NULL,
      location_timestamp_ms BIGINT NULL,
      vehicle_id TEXT NULL,
      scheduled_time TEXT NULL,
      time_slot TEXT NULL,
      passenger_count INTEGER NOT NULL DEFAULT 0,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE company_active_trips
      ADD COLUMN IF NOT EXISTS started_by_device_id TEXT NULL,
      ADD COLUMN IF NOT EXISTS transition_version INTEGER NOT NULL DEFAULT 0;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_active_trips_company_synced_idx
      ON company_active_trips (company_id, synced_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_active_trips_company_route_idx
      ON company_active_trips (company_id, route_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS company_active_trips_company_driver_idx
      ON company_active_trips (company_id, driver_uid);
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS company_active_trips_route_unique_idx
      ON company_active_trips (route_id);
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS company_active_trips_driver_unique_idx
      ON company_active_trips (driver_uid);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS driver_trip_requests (
      request_id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      request_type TEXT NOT NULL,
      trip_id TEXT NOT NULL,
      response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      expires_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS driver_trip_requests_uid_type_idx
      ON driver_trip_requests (uid, request_type, updated_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS driver_location_history (
      sample_id BIGSERIAL PRIMARY KEY,
      route_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      driver_uid TEXT NOT NULL,
      trip_id TEXT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      accuracy DOUBLE PRECISION NOT NULL,
      speed DOUBLE PRECISION NULL,
      heading DOUBLE PRECISION NULL,
      sampled_at_ms BIGINT NOT NULL,
      sampled_at TIMESTAMPTZ NOT NULL,
      recorded_at_ms BIGINT NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL,
      source TEXT NOT NULL DEFAULT 'offline_replay'
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS driver_location_history_route_sampled_idx
      ON driver_location_history (route_id, sampled_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS driver_location_history_company_driver_idx
      ON driver_location_history (company_id, driver_uid, sampled_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS route_passengers (
      route_id TEXT NOT NULL REFERENCES company_routes(route_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL,
      passenger_uid TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NULL,
      show_phone_to_driver BOOLEAN NOT NULL DEFAULT FALSE,
      boarding_area TEXT NOT NULL DEFAULT '',
      virtual_stop JSONB NULL,
      virtual_stop_label TEXT NULL,
      notification_time TEXT NOT NULL DEFAULT '',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (route_id, passenger_uid)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS route_passengers_route_joined_idx
      ON route_passengers (route_id, joined_at ASC, passenger_uid ASC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS route_passengers_passenger_uid_idx
      ON route_passengers (passenger_uid);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS route_skip_requests (
      route_id TEXT NOT NULL REFERENCES company_routes(route_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL,
      passenger_uid TEXT NOT NULL,
      date_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'skip_today',
      idempotency_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (route_id, passenger_uid, date_key)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS route_skip_requests_route_date_idx
      ON route_skip_requests (route_id, date_key, updated_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_tracking_sessions (
      session_id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES company_routes(route_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL,
      route_name TEXT NULL,
      guest_uid TEXT NOT NULL,
      guest_display_name TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      revoke_reason TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS guest_tracking_sessions_route_status_idx
      ON guest_tracking_sessions (route_id, status, expires_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS guest_tracking_sessions_guest_status_idx
      ON guest_tracking_sessions (guest_uid, status, expires_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trip_conversations (
      conversation_id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL REFERENCES company_routes(route_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL,
      driver_uid TEXT NOT NULL,
      passenger_uid TEXT NOT NULL,
      participant_uids JSONB NOT NULL DEFAULT '[]'::jsonb,
      driver_name TEXT NOT NULL,
      passenger_name TEXT NOT NULL,
      driver_plate TEXT NULL,
      passenger_role TEXT NOT NULL DEFAULT 'passenger',
      last_opened_at TIMESTAMPTZ NULL,
      last_message_text TEXT NULL,
      last_message_sender_uid TEXT NULL,
      last_message_at TIMESTAMPTZ NULL,
      read_at_by_uid JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS trip_conversations_route_updated_idx
      ON trip_conversations (route_id, updated_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS trip_conversations_driver_uid_idx
      ON trip_conversations (driver_uid, updated_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS trip_conversations_passenger_uid_idx
      ON trip_conversations (passenger_uid, updated_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trip_conversation_messages (
      message_id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES trip_conversations(conversation_id) ON DELETE CASCADE,
      route_id TEXT NOT NULL REFERENCES company_routes(route_id) ON DELETE CASCADE,
      sender_uid TEXT NOT NULL,
      sender_role TEXT NULL,
      message_text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS trip_conversation_messages_conversation_created_idx
      ON trip_conversation_messages (conversation_id, created_at ASC, message_id ASC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS route_preview_rate_limits (
      rate_key TEXT PRIMARY KEY,
      window_start_ms BIGINT NOT NULL,
      call_count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS route_share_audit_events (
      event_id BIGSERIAL PRIMARY KEY,
      company_id TEXT NULL,
      event_type TEXT NOT NULL,
      actor_uid TEXT NULL,
      actor_type TEXT NOT NULL DEFAULT 'public',
      route_id TEXT NULL,
      srv_code TEXT NULL,
      status TEXT NOT NULL DEFAULT 'success',
      reason TEXT NULL,
      request_ip_hash TEXT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS route_share_audit_events_route_created_idx
      ON route_share_audit_events (route_id, created_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS route_share_audit_events_srv_created_idx
      ON route_share_audit_events (srv_code, created_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS route_srv_code_reservations (
      srv_code TEXT PRIMARY KEY,
      route_id TEXT NULL,
      reserved_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS route_srv_code_reservations_route_id_idx
      ON route_srv_code_reservations (route_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_reports (
      report_id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'guest',
      source TEXT NOT NULL,
      route_id TEXT NULL,
      trip_id TEXT NULL,
      user_note TEXT NULL,
      diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
      idempotency_key TEXT NOT NULL,
      support_email TEXT NULL,
      slack_dispatch TEXT NOT NULL DEFAULT 'skipped',
      slack_dispatch_error TEXT NULL,
      status TEXT NOT NULL DEFAULT 'received',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS support_reports_uid_created_idx
      ON support_reports (uid, created_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS delete_requests (
      uid TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'guest',
      requested_at TIMESTAMPTZ NOT NULL,
      hard_delete_after TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      dry_run BOOLEAN NOT NULL DEFAULT FALSE,
      subscription_status_at_request TEXT NOT NULL DEFAULT 'none',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  return true;
}
