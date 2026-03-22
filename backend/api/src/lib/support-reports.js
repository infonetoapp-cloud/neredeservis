import { readUserProfileByUid } from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { asRecord, pickString } from "./runtime-value.js";

function requireUid(subject) {
  if (typeof subject === "string" && subject.trim().length > 0) {
    return subject.trim();
  }

  if (
    subject &&
    typeof subject === "object" &&
    !Array.isArray(subject) &&
    typeof subject.uid === "string" &&
    subject.uid.trim().length > 0
  ) {
    return subject.uid.trim();
  }

  throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
}

function normalizeOptionalText(rawValue, fieldLabel, maxLength = 2048) {
  if (rawValue === undefined) {
    return undefined;
  }
  if (rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const normalized = rawValue.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > maxLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} cok uzun.`);
  }

  return normalized;
}

function normalizeRequiredText(rawValue, fieldLabel, minLength = 1, maxLength = 256) {
  const normalized = normalizeOptionalText(rawValue, fieldLabel, maxLength);
  if (normalized == null || normalized.length < minLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }
  return normalized;
}

function normalizeDiagnostics(rawValue) {
  const record = asRecord(rawValue);
  return record ? { ...record } : {};
}

async function readExistingSupportReport(reportId) {
  if (!isPostgresConfigured()) {
    return null;
  }

  const pool = getPostgresPool();
  const result = await pool.query(
    `
      SELECT report_id, support_email, slack_dispatch
      FROM support_reports
      WHERE report_id = $1
      LIMIT 1
    `,
    [reportId],
  );
  return result.rows[0] ?? null;
}

async function writeSupportReport(record) {
  if (!isPostgresConfigured()) {
    return false;
  }

  const pool = getPostgresPool();
  await pool.query(
    `
      INSERT INTO support_reports (
        report_id,
        uid,
        role,
        source,
        route_id,
        trip_id,
        user_note,
        diagnostics,
        idempotency_key,
        support_email,
        slack_dispatch,
        slack_dispatch_error,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::jsonb,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14::timestamptz,
        $15::timestamptz
      )
      ON CONFLICT (report_id) DO NOTHING
    `,
    [
      record.reportId,
      record.uid,
      record.role,
      record.source,
      record.routeId,
      record.tripId,
      record.userNote,
      JSON.stringify(record.diagnostics),
      record.idempotencyKey,
      record.supportEmail,
      record.slackDispatch,
      record.slackDispatchError,
      record.status,
      record.createdAt,
      record.updatedAt,
    ],
  );
  return true;
}

async function bestEffortMirrorSupportReport(db, record) {
  if (!db || typeof db.collection !== "function") {
    return;
  }

  await db
    .collection("support_reports")
    .doc(record.reportId)
    .set(
      {
        uid: record.uid,
        role: record.role,
        source: record.source,
        routeId: record.routeId,
        tripId: record.tripId,
        userNote: record.userNote,
        diagnostics: record.diagnostics,
        idempotencyKey: record.idempotencyKey,
        supportEmail: record.supportEmail,
        slackDispatch: record.slackDispatch,
        slackDispatchError: record.slackDispatchError,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      { merge: true },
    )
    .catch(() => null);
}

export async function submitSupportReport(db, subject, rawInput) {
  const uid = requireUid(subject);
  const input = asRecord(rawInput) ?? {};
  const nowIso = new Date().toISOString();
  const source = normalizeRequiredText(input.source, "Kaynak", 2, 64);
  const idempotencyKey = normalizeRequiredText(
    input.idempotencyKey,
    "Idempotency anahtari",
    8,
    128,
  );
  const reportId = `${uid}_${idempotencyKey}`;
  const supportEmail = (process.env.SUPPORT_EMAIL_DEFAULT ?? "").trim() || null;

  const existing = await readExistingSupportReport(reportId);
  if (existing) {
    return {
      reportId,
      queued: true,
      supportEmail: pickString(existing, "support_email") ?? supportEmail,
      slackDispatch: pickString(existing, "slack_dispatch") ?? "skipped",
    };
  }

  const profile = await readUserProfileByUid(db, uid);
  const record = {
    reportId,
    uid,
    role: pickString(profile, "role") ?? "guest",
    source,
    routeId: normalizeOptionalText(input.routeId, "Rota", 128) ?? null,
    tripId: normalizeOptionalText(input.tripId, "Sefer", 128) ?? null,
    userNote: normalizeOptionalText(input.userNote, "Not", 5000) ?? null,
    diagnostics: normalizeDiagnostics(input.diagnostics),
    idempotencyKey,
    supportEmail,
    slackDispatch: "skipped",
    slackDispatchError: null,
    status: "received",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await writeSupportReport(record);
  await bestEffortMirrorSupportReport(db, record);

  return {
    reportId,
    queued: true,
    supportEmail,
    slackDispatch: "skipped",
  };
}
