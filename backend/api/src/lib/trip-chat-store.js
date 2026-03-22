import { randomUUID } from "node:crypto";

import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { asRecord } from "./runtime-value.js";

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeIsoString(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim()),
    ),
  );
}

function formatReadAtByUid(rawValue) {
  const record = asRecord(rawValue) ?? {};
  return Object.fromEntries(
    Object.entries(record).filter(
      ([key, value]) => normalizeNullableText(key) && normalizeIsoString(value),
    ),
  );
}

function formatConversationRow(row) {
  const conversationId = normalizeNullableText(row?.conversation_id);
  const routeId = normalizeNullableText(row?.route_id);
  const companyId = normalizeNullableText(row?.company_id);
  const driverUid = normalizeNullableText(row?.driver_uid);
  const passengerUid = normalizeNullableText(row?.passenger_uid);
  if (!conversationId || !routeId || !companyId || !driverUid || !passengerUid) {
    return null;
  }

  return {
    conversationId,
    routeId,
    companyId,
    driverUid,
    passengerUid,
    participantUids: normalizeStringArray(row?.participant_uids),
    driverName: normalizeNullableText(row?.driver_name) ?? "Sofor",
    passengerName: normalizeNullableText(row?.passenger_name) ?? "Yolcu",
    driverPlate: normalizeNullableText(row?.driver_plate),
    passengerRole: normalizeNullableText(row?.passenger_role) ?? "passenger",
    lastOpenedAt: normalizeIsoString(row?.last_opened_at),
    lastMessageText: normalizeNullableText(row?.last_message_text),
    lastMessageSenderUid: normalizeNullableText(row?.last_message_sender_uid),
    lastMessageAt: normalizeIsoString(row?.last_message_at),
    readAtByUid: formatReadAtByUid(row?.read_at_by_uid),
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

function formatMessageRow(row) {
  const messageId = normalizeNullableText(row?.message_id);
  const conversationId = normalizeNullableText(row?.conversation_id);
  const routeId = normalizeNullableText(row?.route_id);
  const senderUid = normalizeNullableText(row?.sender_uid);
  const text = normalizeNullableText(row?.message_text);
  if (!messageId || !conversationId || !routeId || !senderUid || !text) {
    return null;
  }

  return {
    messageId,
    conversationId,
    routeId,
    senderUid,
    senderRole: normalizeNullableText(row?.sender_role),
    text,
    createdAt: normalizeIsoString(row?.created_at),
    updatedAt: normalizeIsoString(row?.updated_at),
  };
}

export function shouldUsePostgresTripChatStore() {
  return isPostgresConfigured();
}

export async function readTripConversationFromPostgres(conversationId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedConversationId = normalizeNullableText(conversationId);
  if (!normalizedConversationId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        conversation_id,
        route_id,
        company_id,
        driver_uid,
        passenger_uid,
        participant_uids,
        driver_name,
        passenger_name,
        driver_plate,
        passenger_role,
        last_opened_at,
        last_message_text,
        last_message_sender_uid,
        last_message_at,
        read_at_by_uid,
        created_at,
        updated_at
      FROM trip_conversations
      WHERE conversation_id = $1
      LIMIT 1
    `,
    [normalizedConversationId],
  );

  return formatConversationRow(result.rows[0] ?? null);
}

export async function upsertTripConversationToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const conversationId = normalizeNullableText(input?.conversationId);
  const routeId = normalizeNullableText(input?.routeId);
  const companyId = normalizeNullableText(input?.companyId);
  const driverUid = normalizeNullableText(input?.driverUid);
  const passengerUid = normalizeNullableText(input?.passengerUid);
  const driverName = normalizeNullableText(input?.driverName);
  const passengerName = normalizeNullableText(input?.passengerName);
  if (
    !conversationId ||
    !routeId ||
    !companyId ||
    !driverUid ||
    !passengerUid ||
    !driverName ||
    !passengerName
  ) {
    return null;
  }

  const participantUids = normalizeStringArray(input?.participantUids ?? [driverUid, passengerUid]);
  const lastOpenedAt = normalizeIsoString(input?.lastOpenedAt) ?? new Date().toISOString();
  const createdAt = normalizeIsoString(input?.createdAt) ?? lastOpenedAt;
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? lastOpenedAt;
  const passengerRole = normalizeNullableText(input?.passengerRole) ?? "passenger";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `
        SELECT route_id, created_at
        FROM trip_conversations
        WHERE conversation_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [conversationId],
    );
    const currentRow = currentResult.rows[0] ?? null;
    if (normalizeNullableText(currentRow?.route_id) != null && currentRow.route_id !== routeId) {
      throw new HttpError(412, "failed-precondition", "Sohbet kaydi route ile uyumsuz.");
    }

    const persistedCreatedAt = normalizeIsoString(currentRow?.created_at) ?? createdAt;
    const result = await client.query(
      `
        INSERT INTO trip_conversations (
          conversation_id,
          route_id,
          company_id,
          driver_uid,
          passenger_uid,
          participant_uids,
          driver_name,
          passenger_name,
          driver_plate,
          passenger_role,
          last_opened_at,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11::timestamptz, $12::timestamptz, $13::timestamptz
        )
        ON CONFLICT (conversation_id) DO UPDATE
        SET
          route_id = EXCLUDED.route_id,
          company_id = EXCLUDED.company_id,
          driver_uid = EXCLUDED.driver_uid,
          passenger_uid = EXCLUDED.passenger_uid,
          participant_uids = EXCLUDED.participant_uids,
          driver_name = EXCLUDED.driver_name,
          passenger_name = EXCLUDED.passenger_name,
          driver_plate = EXCLUDED.driver_plate,
          passenger_role = EXCLUDED.passenger_role,
          last_opened_at = EXCLUDED.last_opened_at,
          updated_at = EXCLUDED.updated_at
        RETURNING
          conversation_id,
          route_id,
          company_id,
          driver_uid,
          passenger_uid,
          participant_uids,
          driver_name,
          passenger_name,
          driver_plate,
          passenger_role,
          last_opened_at,
          last_message_text,
          last_message_sender_uid,
          last_message_at,
          read_at_by_uid,
          created_at,
          updated_at
      `,
      [
        conversationId,
        routeId,
        companyId,
        driverUid,
        passengerUid,
        JSON.stringify(participantUids),
        driverName,
        passengerName,
        normalizeNullableText(input?.driverPlate),
        passengerRole,
        lastOpenedAt,
        persistedCreatedAt,
        updatedAt,
      ],
    );
    await client.query("COMMIT");
    return {
      created: currentRow == null,
      conversation: formatConversationRow(result.rows[0] ?? null),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function listTripConversationMessagesFromPostgres(conversationId, options = {}) {
  const pool = getPostgresPool();
  if (!pool) {
    return [];
  }

  const normalizedConversationId = normalizeNullableText(conversationId);
  if (!normalizedConversationId) {
    return [];
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.trunc(options.limit)) : 200;
  const result = await pool.query(
    `
      SELECT
        message_id,
        conversation_id,
        route_id,
        sender_uid,
        sender_role,
        message_text,
        created_at,
        updated_at
      FROM trip_conversation_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC, message_id ASC
      LIMIT $2
    `,
    [normalizedConversationId, limit],
  );

  return result.rows.map(formatMessageRow).filter((item) => item !== null);
}

export async function upsertTripConversationMessageToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const conversationId = normalizeNullableText(input?.conversationId);
  const routeId = normalizeNullableText(input?.routeId);
  const senderUid = normalizeNullableText(input?.senderUid);
  const senderRole = normalizeNullableText(input?.senderRole);
  const text = normalizeNullableText(input?.text);
  if (!conversationId || !routeId || !senderUid || !text) {
    return null;
  }

  const messageId = normalizeNullableText(input?.messageId) ?? randomUUID();
  const createdAt = normalizeIsoString(input?.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? createdAt;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const conversationResult = await client.query(
      `
        SELECT participant_uids
        FROM trip_conversations
        WHERE conversation_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [conversationId],
    );
    if (conversationResult.rowCount === 0) {
      throw new HttpError(404, "not-found", "Sohbet bulunamadi.");
    }

    const currentMessageResult = await client.query(
      `
        SELECT
          message_id,
          sender_uid,
          sender_role,
          message_text,
          created_at,
          updated_at,
          conversation_id,
          route_id
        FROM trip_conversation_messages
        WHERE message_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [messageId],
    );
    const currentMessage = formatMessageRow(currentMessageResult.rows[0] ?? null);
    if (currentMessage) {
      if (currentMessage.senderUid !== senderUid) {
        throw new HttpError(
          412,
          "failed-precondition",
          "Mesaj idempotency kaydi baska gondericiye ait.",
        );
      }

      await client.query("COMMIT");
      return {
        created: false,
        message: currentMessage,
      };
    }

    const insertResult = await client.query(
      `
        INSERT INTO trip_conversation_messages (
          message_id,
          conversation_id,
          route_id,
          sender_uid,
          sender_role,
          message_text,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz
        )
        RETURNING
          message_id,
          conversation_id,
          route_id,
          sender_uid,
          sender_role,
          message_text,
          created_at,
          updated_at
      `,
      [messageId, conversationId, routeId, senderUid, senderRole, text, createdAt, updatedAt],
    );
    await client.query(
      `
        UPDATE trip_conversations
        SET
          last_message_text = $2,
          last_message_sender_uid = $3,
          last_message_at = $4::timestamptz,
          updated_at = $4::timestamptz
        WHERE conversation_id = $1
      `,
      [conversationId, text, senderUid, updatedAt],
    );
    await client.query("COMMIT");
    return {
      created: true,
      message: formatMessageRow(insertResult.rows[0] ?? null),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function markTripConversationReadInPostgres(conversationId, uid, readAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedConversationId = normalizeNullableText(conversationId);
  const normalizedUid = normalizeNullableText(uid);
  const normalizedReadAt = normalizeIsoString(readAt) ?? new Date().toISOString();
  if (!normalizedConversationId || !normalizedUid) {
    return false;
  }

  const result = await pool.query(
    `
      UPDATE trip_conversations
      SET
        read_at_by_uid = COALESCE(read_at_by_uid, '{}'::jsonb) || $2::jsonb,
        updated_at = $3::timestamptz
      WHERE conversation_id = $1
    `,
    [
      normalizedConversationId,
      JSON.stringify({ [normalizedUid]: normalizedReadAt }),
      normalizedReadAt,
    ],
  );
  return result.rowCount > 0;
}
