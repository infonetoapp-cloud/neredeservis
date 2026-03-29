import { createHash } from "node:crypto";

import { readUserProfileByUid } from "./auth-user-store.js";
import { readCompanyDriverFromPostgres } from "./company-fleet-store.js";
import { readRouteFromPostgres } from "./company-route-store.js";
import { HttpError } from "./http.js";
import {
  readActiveGuestSessionForGuestFromPostgres,
  readRoutePassengerFromPostgres,
  shouldUsePostgresPassengerStore,
} from "./passenger-store.js";
import { asRecord, pickString } from "./runtime-value.js";
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

function hasFirestoreDb(db) {
  return Boolean(
    db && typeof db.collection === "function" && typeof db.runTransaction === "function",
  );
}

function requireTripChatStorage(db) {
  if (shouldUsePostgresTripChatStore()) {
    return db ?? null;
  }
  if (hasFirestoreDb(db)) {
    return db;
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

function parseIsoToMs(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return null;
  }

  const parsed = Date.parse(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
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

async function findActiveGuestSession(db, routeId, guestUid) {
  if (shouldUsePostgresPassengerStore()) {
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

  if (!hasFirestoreDb(db)) {
    return null;
  }

  const sessionsSnapshot = await db
    .collection("guest_sessions")
    .where("guestUid", "==", guestUid)
    .limit(30)
    .get();

  const nowMs = Date.now();
  let selected = null;
  let selectedExpiresAtMs = 0;

  for (const documentSnapshot of sessionsSnapshot.docs) {
    const data = asRecord(documentSnapshot.data()) ?? {};
    if (pickString(data, "routeId") !== routeId) {
      continue;
    }
    if (pickString(data, "status") !== "active") {
      continue;
    }

    const expiresAtMs = parseIsoToMs(pickString(data, "expiresAt"));
    if (expiresAtMs == null || expiresAtMs <= nowMs) {
      continue;
    }

    if (selected == null || expiresAtMs > selectedExpiresAtMs) {
      selected = {
        sessionId: documentSnapshot.id,
        guestDisplayName: pickString(data, "guestDisplayName"),
      };
      selectedExpiresAtMs = expiresAtMs;
    }
  }

  return selected;
}

async function readRouteData(db, routeId) {
  if (shouldUsePostgresPassengerStore()) {
    const postgresRoute = await readRouteFromPostgres(routeId).catch(() => null);
    if (!postgresRoute) {
      throw new HttpError(404, "not-found", "Route bulunamadi.");
    }
    if (postgresRoute.isArchived === true) {
      throw new HttpError(412, "failed-precondition", "Arsivlenmis route icin sohbet acilamaz.");
    }

    return {
      routeRef: null,
      routeData: postgresRoute,
    };
  }

  const routeSnapshot = await db.collection("routes").doc(routeId).get();
  if (!routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const routeData = asRecord(routeSnapshot.data()) ?? {};
  if (routeData.isArchived === true) {
    throw new HttpError(412, "failed-precondition", "Arsivlenmis route icin sohbet acilamaz.");
  }

  return {
    routeRef: routeSnapshot.ref,
    routeData,
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

  const postgresConversation = shouldUsePostgresTripChatStore()
    ? await readTripConversationFromPostgres(conversationId).catch(() => null)
    : null;
  if (shouldUsePostgresTripChatStore() && postgresConversation == null) {
    throw new HttpError(404, "not-found", "Sohbet bulunamadi.");
  }
  const conversationRef =
    postgresConversation == null && hasFirestoreDb(db)
      ? db.collection("trip_conversations").doc(conversationId)
      : null;
  const conversationSnapshot = conversationRef ? await conversationRef.get() : null;
  if (postgresConversation == null && !conversationSnapshot?.exists) {
    throw new HttpError(404, "not-found", "Sohbet bulunamadi.");
  }

  const conversationData = postgresConversation ?? (asRecord(conversationSnapshot?.data()) ?? {});
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
    conversationRef,
    conversationData,
  };
}

async function readDriverDisplayContext(db, driverUid, companyId) {
  const normalizedCompanyId = normalizeOptionalString(companyId, "companyId");
  const postgresDriver = normalizedCompanyId
    ? await readCompanyDriverFromPostgres(normalizedCompanyId, driverUid).catch(() => null)
    : null;
  if (shouldUsePostgresPassengerStore()) {
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

  const [driverSnapshot, driverUser] = await Promise.all([
    postgresDriver || !hasFirestoreDb(db)
      ? Promise.resolve(null)
      : db.collection("drivers").doc(driverUid).get(),
    readUserProfileByUid(db, driverUid).catch(() => null),
  ]);

  const driverData = asRecord(driverSnapshot?.data()) ?? {};
  if (!postgresDriver && !driverSnapshot?.exists) {
    throw new HttpError(412, "failed-precondition", "Sofor profili bulunamadi.");
  }

  return {
    driverName:
      pickString(postgresDriver, "name") ??
      pickString(driverData, "name") ??
      pickString(driverUser, "displayName") ??
      "Sofor",
    driverPlate: pickString(postgresDriver, "plateMasked") ?? pickString(driverData, "plate"),
  };
}

async function readPassengerDisplayContext(db, routeRef, routeId, passengerUid, guestSession) {
  const postgresPassenger = shouldUsePostgresPassengerStore()
    ? await readRoutePassengerFromPostgres(routeId, passengerUid).catch(() => null)
    : null;
  if (shouldUsePostgresPassengerStore()) {
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

  const [passengerSnapshot, passengerUser] = await Promise.all([
    postgresPassenger || !routeRef?.collection
      ? Promise.resolve(null)
      : routeRef.collection("passengers").doc(passengerUid).get(),
    readUserProfileByUid(db, passengerUid).catch(() => null),
  ]);

  if (!passengerSnapshot?.exists && !postgresPassenger && guestSession == null) {
    throw new HttpError(403, "permission-denied", "Route passenger/misafir kaydi bulunamadi.");
  }

  const passengerData = asRecord(passengerSnapshot?.data()) ?? {};
  return {
    passengerName:
      pickString(postgresPassenger, "name") ??
      pickString(passengerData, "name") ??
      guestSession?.guestDisplayName ??
      pickString(passengerUser, "displayName") ??
      (passengerSnapshot?.exists || postgresPassenger ? "Yolcu" : "Misafir"),
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

  const { routeRef, routeData } = await readRouteData(db, routeId);
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
    readPassengerDisplayContext(db, routeRef, routeId, passengerUid, guestSession),
  ]);

  const conversationId = buildTripConversationId(routeId, driverUid, passengerUid);
  const nowIso = new Date().toISOString();
  let created = false;

  if (shouldUsePostgresTripChatStore()) {
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
    created = postgresResult?.created === true;
  } else {
    const conversationRef = db.collection("trip_conversations").doc(conversationId);
    await db.runTransaction(async (transaction) => {
      const conversationSnapshot = await transaction.get(conversationRef);
      const conversationData = asRecord(conversationSnapshot.data()) ?? {};
      const existingRouteId = pickString(conversationData, "routeId");
      if (existingRouteId != null && existingRouteId !== routeId) {
        throw new HttpError(412, "failed-precondition", "Sohbet kaydi route ile uyumsuz.");
      }

      if (!conversationSnapshot.exists) {
        created = true;
      }

      const createdAt = pickString(conversationData, "createdAt") ?? nowIso;
      transaction.set(
        conversationRef,
        {
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
          createdAt,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });
  }

  return {
    conversationId,
    routeId,
    driverUid,
    passengerUid,
    driverName,
    passengerName,
    driverPlate: driverPlate ?? null,
    created,
    updatedAt: nowIso,
  };
}

export async function listTripConversationMessages(dbInput, uid, input) {
  const db = requireTripChatStorage(dbInput);
  const context = await requireConversationParticipant(db, uid, input);
  const limit = normalizeMessageLimit(input?.limit);

  if (shouldUsePostgresTripChatStore()) {
    const messages = await listTripConversationMessagesFromPostgres(context.conversationId, { limit });
    return {
      conversationId: context.conversationId,
      routeId: context.routeId,
      messages,
    };
  }

  const messagesSnapshot = await context.conversationRef
    .collection("messages")
    .orderBy("createdAt")
    .limit(limit)
    .get();

  return {
    conversationId: context.conversationId,
    routeId: context.routeId,
    messages: messagesSnapshot.docs.map((documentSnapshot) => {
      const data = asRecord(documentSnapshot.data()) ?? {};
      return {
        messageId: documentSnapshot.id,
        senderUid: pickString(data, "senderUid") ?? "",
        senderRole: pickString(data, "senderRole"),
        text: pickString(data, "text") ?? "",
        createdAt: pickString(data, "createdAt"),
        updatedAt: pickString(data, "updatedAt"),
      };
    }),
  };
}

export async function sendTripConversationMessage(dbInput, uid, input) {
  const db = requireTripChatStorage(dbInput);
  const context = await requireConversationParticipant(db, uid, input);
  const text = normalizeMessageText(input?.text);
  const clientMessageId = normalizeOptionalString(input?.clientMessageId, "clientMessageId");
  const nowIso = new Date().toISOString();
  let createdAt = nowIso;

  if (shouldUsePostgresTripChatStore()) {
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
    createdAt = pickString(messageResult?.message, "createdAt") ?? nowIso;
    return {
      conversationId: context.conversationId,
      messageId: pickString(messageResult?.message, "messageId") ?? clientMessageId ?? "",
      senderUid: uid,
      createdAt,
    };
  }

  const messageRef = clientMessageId
    ? context.conversationRef.collection("messages").doc(clientMessageId)
    : context.conversationRef.collection("messages").doc();

  await db.runTransaction(async (transaction) => {
    const conversationSnapshot = await transaction.get(context.conversationRef);
    if (!conversationSnapshot.exists) {
      throw new HttpError(404, "not-found", "Sohbet bulunamadi.");
    }

    const conversationData = asRecord(conversationSnapshot.data()) ?? {};
    const participantUids = pickStringArray(conversationData, "participantUids");
    if (!participantUids.includes(uid)) {
      throw new HttpError(403, "permission-denied", "Bu sohbete mesaj gonderme yetkin yok.");
    }

    const existingMessageSnapshot = await transaction.get(messageRef);
    if (existingMessageSnapshot.exists) {
      const existingMessageData = asRecord(existingMessageSnapshot.data()) ?? {};
      const existingSenderUid = pickString(existingMessageData, "senderUid");
      if (existingSenderUid !== uid) {
        throw new HttpError(
          412,
          "failed-precondition",
          "Mesaj idempotency kaydi baska gondericiye ait.",
        );
      }

      createdAt = pickString(existingMessageData, "createdAt") ?? nowIso;
      return;
    }

    transaction.set(messageRef, {
      routeId: context.routeId,
      conversationId: context.conversationId,
      senderUid: uid,
      senderRole: context.role,
      text,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    transaction.set(
      context.conversationRef,
      {
        lastMessageText: text,
        lastMessageSenderUid: uid,
        lastMessageAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );
    createdAt = nowIso;
  });

  return {
    conversationId: context.conversationId,
    messageId: messageRef.id,
    senderUid: uid,
    createdAt,
  };
}

export async function markTripConversationRead(dbInput, uid, input) {
  const db = requireTripChatStorage(dbInput);
  const context = await requireConversationParticipant(db, uid, input);
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresTripChatStore()) {
    await markTripConversationReadInPostgres(context.conversationId, uid, nowIso);
    return {
      conversationId: context.conversationId,
      readAt: nowIso,
    };
  }

  await context.conversationRef.set(
    {
      [`readAtByUid.${uid}`]: nowIso,
      updatedAt: nowIso,
    },
    { merge: true },
  );

  return {
    conversationId: context.conversationId,
    readAt: nowIso,
  };
}
