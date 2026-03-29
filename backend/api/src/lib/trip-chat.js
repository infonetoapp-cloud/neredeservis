import { createHash } from "node:crypto";

import { readUserProfileByUid } from "./auth-user-store.js";
import { readCompanyDriverFromPostgres } from "./company-fleet-store.js";
import { readRouteFromPostgres } from "./company-route-store.js";
import { HttpError } from "./http.js";
import {
  readActiveGuestSessionForGuestFromPostgres,
  readRoutePassengerFromPostgres,
} from "./passenger-store.js";
import { pickString } from "./runtime-value.js";
import {
  listTripConversationMessagesFromPostgres,
  markTripConversationReadInPostgres,
  readTripConversationFromPostgres,
  shouldUsePostgresTripChatStore,
  upsertTripConversationMessageToPostgres,
  upsertTripConversationToPostgres,
} from "./trip-chat-store.js";

const MESSAGE_LIMIT_DEFAULT = 200;
const MESSAGE_LIMIT_MAX = 500;

function requireTripChatStorage(db) {
  if (shouldUsePostgresTripChatStore()) {
    return db ?? null;
  }

  throw new HttpError(412, "failed-precondition", "Trip chat depolamasi hazir degil.");
}

function normalizeRequiredString(rawValue, fieldLabel, maxLength = 128) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const normalized = rawValue.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return normalized;
}

function normalizeOptionalString(rawValue, fieldLabel, maxLength = 128) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }
  return normalizeRequiredString(rawValue, fieldLabel, maxLength);
}

function normalizeMessageText(rawValue) {
  return normalizeRequiredString(rawValue, "Mesaj", 600);
}

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function buildTripConversationId(routeId, driverUid, passengerUid) {
  const digest = createHash("sha256")
    .update(`${routeId}|${driverUid}|${passengerUid}`)
    .digest("hex");
  return `conv_${digest.slice(0, 40)}`;
}

async function readCallerRole(db, uid) {
  const userProfile = await readUserProfileByUid(db, uid);
  const role = pickString(userProfile, "role");
  if (role !== "driver" && role !== "passenger" && role !== "guest") {
    throw new HttpError(403, "permission-denied", "Trip chat erisim yetkin yok.");
  }
  return role;
}

async function findActiveGuestSession(_db, routeId, guestUid) {
  const session = await readActiveGuestSessionForGuestFromPostgres(routeId, guestUid).catch(
    () => null,
  );
  return session
    ? {
        sessionId: session.sessionId,
        guestDisplayName: session.guestDisplayName,
      }
    : null;
}

async function readRouteData(_db, routeId) {
  const postgresRoute = await readRouteFromPostgres(routeId).catch(() => null);
  if (!postgresRoute) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }
  if (postgresRoute.isArchived === true) {
    throw new HttpError(412, "failed-precondition", "Arsivlenmis route icin sohbet acilamaz.");
  }

  return {
    routeData: postgresRoute,
  };
}

async function requireRouteMember(db, routeId, uid) {
  const { routeData } = await readRouteData(db, routeId);
  const routeOwnerUid = pickString(routeData, "driverId");
  const authorizedDriverIds = pickStringArray(routeData, "authorizedDriverIds");
  const memberIds = pickStringArray(routeData, "memberIds");
  const isMember =
    routeOwnerUid === uid || authorizedDriverIds.includes(uid) || memberIds.includes(uid);

  if (!isMember) {
    throw new HttpError(403, "permission-denied", "Bu route icin erisim yetkin yok.");
  }

  return routeData;
}

async function requireConversationParticipant(db, uid, input) {
  const routeId = normalizeRequiredString(input?.routeId, "routeId");
  const conversationId = normalizeRequiredString(input?.conversationId, "conversationId");
  const role = await readCallerRole(db, uid);

  if (role === "guest") {
    const guestSession = await findActiveGuestSession(db, routeId, uid);
    if (guestSession == null) {
      throw new HttpError(403, "permission-denied", "Misafir oturumu aktif degil.");
    }
  } else {
    await requireRouteMember(db, routeId, uid);
  }

  const conversationData = await readTripConversationFromPostgres(conversationId).catch(() => null);
  if (!conversationData) {
    throw new HttpError(404, "not-found", "Sohbet bulunamadi.");
  }
  if (pickString(conversationData, "routeId") !== routeId) {
    throw new HttpError(412, "failed-precondition", "Sohbet route bilgisi uyusmuyor.");
  }

  const participantUids = pickStringArray(conversationData, "participantUids");
  if (!participantUids.includes(uid)) {
    throw new HttpError(403, "permission-denied", "Bu sohbete erisim yetkin yok.");
  }

  const driverUid = pickString(conversationData, "driverUid");
  const passengerUid = pickString(conversationData, "passengerUid");
  if (role === "driver" && driverUid !== uid) {
    throw new HttpError(403, "permission-denied", "Bu sohbet icin sofor yetkin yok.");
  }
  if ((role === "passenger" || role === "guest") && passengerUid !== uid) {
    throw new HttpError(403, "permission-denied", "Bu sohbet icin yolcu yetkin yok.");
  }

  return {
    role,
    routeId,
    conversationId,
    conversationData,
  };
}

async function readDriverDisplayContext(db, driverUid, companyId) {
  const normalizedCompanyId = normalizeOptionalString(companyId, "companyId");
  const postgresDriver = normalizedCompanyId
    ? await readCompanyDriverFromPostgres(normalizedCompanyId, driverUid).catch(() => null)
    : null;
  const driverUser = await readUserProfileByUid(db, driverUid).catch(() => null);
  if (!postgresDriver && !driverUser) {
    throw new HttpError(412, "failed-precondition", "Sofor profili bulunamadi.");
  }

  return {
    driverName:
      pickString(postgresDriver, "name") ??
      pickString(driverUser, "displayName") ??
      "Sofor",
    driverPlate: pickString(postgresDriver, "plateMasked"),
  };
}

async function readPassengerDisplayContext(db, routeId, passengerUid, guestSession) {
  const postgresPassenger = await readRoutePassengerFromPostgres(routeId, passengerUid).catch(() => null);
  const passengerUser = await readUserProfileByUid(db, passengerUid).catch(() => null);
  if (!postgresPassenger && guestSession == null) {
    throw new HttpError(403, "permission-denied", "Route passenger/misafir kaydi bulunamadi.");
  }

  return {
    passengerName:
      pickString(postgresPassenger, "name") ??
      guestSession?.guestDisplayName ??
      pickString(passengerUser, "displayName") ??
      (postgresPassenger ? "Yolcu" : "Misafir"),
  };
}

function normalizeMessageLimit(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return MESSAGE_LIMIT_DEFAULT;
  }

  const parsed =
    typeof rawValue === "number" ? rawValue : Number.parseInt(String(rawValue).trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return MESSAGE_LIMIT_DEFAULT;
  }
  return Math.min(parsed, MESSAGE_LIMIT_MAX);
}

export async function openTripConversation(dbInput, uid, input) {
  const db = requireTripChatStorage(dbInput);
  const callerRole = await readCallerRole(db, uid);
  const routeId = normalizeRequiredString(input?.routeId, "routeId");
  const requestedDriverUid = normalizeOptionalString(input?.driverUid, "driverUid");
  const requestedPassengerUid = normalizeOptionalString(input?.passengerUid, "passengerUid");

  const { routeData } = await readRouteData(db, routeId);
  const routeDriverUid = pickString(routeData, "driverId");
  if (!routeDriverUid) {
    throw new HttpError(412, "failed-precondition", "Route driver bilgisi eksik.");
  }

  const authorizedDriverIds = pickStringArray(routeData, "authorizedDriverIds");
  let driverUid;
  let passengerUid;
  let guestSession = null;

  if (callerRole === "driver") {
    const isRouteDriver = uid === routeDriverUid || authorizedDriverIds.includes(uid);
    if (!isRouteDriver) {
      throw new HttpError(403, "permission-denied", "Bu route icin sofor sohbet yetkin yok.");
    }
    if (!requestedPassengerUid) {
      throw new HttpError(400, "invalid-argument", "Passenger UID zorunludur.");
    }
    if (requestedPassengerUid === uid) {
      throw new HttpError(400, "invalid-argument", "Sofor kendiyle sohbet acamaz.");
    }
    driverUid = uid;
    passengerUid = requestedPassengerUid;
  } else if (callerRole === "passenger") {
    await requireRouteMember(db, routeId, uid);
    passengerUid = uid;
    driverUid = requestedDriverUid ?? routeDriverUid;
    if (driverUid !== routeDriverUid && !authorizedDriverIds.includes(driverUid)) {
      throw new HttpError(403, "permission-denied", "Hedef sofor bu route icin yetkili degil.");
    }
  } else {
    guestSession = await findActiveGuestSession(db, routeId, uid);
    if (guestSession == null) {
      throw new HttpError(403, "permission-denied", "Misafir oturumu aktif degil.");
    }
    passengerUid = uid;
    driverUid = requestedDriverUid ?? routeDriverUid;
    if (driverUid !== routeDriverUid && !authorizedDriverIds.includes(driverUid)) {
      throw new HttpError(403, "permission-denied", "Hedef sofor bu route icin yetkili degil.");
    }
  }

  const [{ driverName, driverPlate }, { passengerName }] = await Promise.all([
    readDriverDisplayContext(db, driverUid, pickString(routeData, "companyId")),
    readPassengerDisplayContext(db, routeId, passengerUid, guestSession),
  ]);

  const conversationId = buildTripConversationId(routeId, driverUid, passengerUid);
  const nowIso = new Date().toISOString();
  const postgresResult = await upsertTripConversationToPostgres({
    conversationId,
    routeId,
    companyId: pickString(routeData, "companyId"),
    driverUid,
    passengerUid,
    participantUids: [driverUid, passengerUid],
    driverName,
    passengerName,
    driverPlate: driverPlate ?? null,
    passengerRole: guestSession == null ? "passenger" : "guest",
    lastOpenedAt: nowIso,
    updatedAt: nowIso,
  });

  return {
    conversationId,
    routeId,
    driverUid,
    passengerUid,
    driverName,
    passengerName,
    driverPlate: driverPlate ?? null,
    created: postgresResult?.created === true,
    updatedAt: nowIso,
  };
}

export async function listTripConversationMessages(dbInput, uid, input) {
  const db = requireTripChatStorage(dbInput);
  const context = await requireConversationParticipant(db, uid, input);
  const limit = normalizeMessageLimit(input?.limit);
  const messages = await listTripConversationMessagesFromPostgres(context.conversationId, { limit });
  return {
    conversationId: context.conversationId,
    routeId: context.routeId,
    messages,
  };
}

export async function sendTripConversationMessage(dbInput, uid, input) {
  const db = requireTripChatStorage(dbInput);
  const context = await requireConversationParticipant(db, uid, input);
  const text = normalizeMessageText(input?.text);
  const clientMessageId = normalizeOptionalString(input?.clientMessageId, "clientMessageId");
  const nowIso = new Date().toISOString();

  const messageResult = await upsertTripConversationMessageToPostgres({
    messageId: clientMessageId,
    conversationId: context.conversationId,
    routeId: context.routeId,
    senderUid: uid,
    senderRole: context.role,
    text,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  if (!messageResult?.message) {
    throw new HttpError(412, "failed-precondition", "Mesaj depolamasi hazir degil.");
  }

  return {
    conversationId: context.conversationId,
    messageId: pickString(messageResult?.message, "messageId") ?? clientMessageId ?? "",
    senderUid: uid,
    createdAt: pickString(messageResult?.message, "createdAt") ?? nowIso,
  };
}

export async function markTripConversationRead(dbInput, uid, input) {
  const db = requireTripChatStorage(dbInput);
  const context = await requireConversationParticipant(db, uid, input);
  const nowIso = new Date().toISOString();

  await markTripConversationReadInPostgres(context.conversationId, uid, nowIso);
  return {
    conversationId: context.conversationId,
    readAt: nowIso,
  };
}
