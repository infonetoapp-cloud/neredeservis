import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { buildTripConversationId } from '../common/index_domain_helpers.js';
import type {
  MarkTripConversationReadOutput,
  OpenTripConversationOutput,
  SendTripMessageOutput,
} from '../common/output_contract_types.js';
import {
  findActiveGuestSession,
  requireRouteMember,
  type ActiveGuestSessionSnapshot,
} from '../common/route_membership_helpers.js';
import { pickString, pickStringArray } from '../common/runtime_value_helpers.js';
import { runTransactionVoid } from '../common/transaction_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import { requireRole } from '../middleware/role_middleware.js';

interface OpenTripConversationInput {
  routeId: string;
  driverUid?: string;
  passengerUid?: string;
}

interface SendTripMessageInput {
  routeId: string;
  conversationId: string;
  text: string;
  clientMessageId?: string;
}

interface MarkTripConversationReadInput {
  routeId: string;
  conversationId: string;
}

type ChatCallerRole = 'driver' | 'passenger' | 'guest';

export function createTripChatCallables({
  db,
  openTripConversationInputSchema,
  sendTripMessageInputSchema,
  markTripConversationReadInputSchema,
}: {
  db: Firestore;
  openTripConversationInputSchema: ZodType<unknown>;
  sendTripMessageInputSchema: ZodType<unknown>;
  markTripConversationReadInputSchema: ZodType<unknown>;
}) {
  const openTripConversation = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const callerRole = (await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver', 'passenger', 'guest'],
    })) as ChatCallerRole;

    const input = validateInput(
      openTripConversationInputSchema,
      request.data,
    ) as OpenTripConversationInput;
    const routeRef = db.collection('routes').doc(input.routeId);
    const routeSnap = await routeRef.get();
    if (!routeSnap.exists) {
      throw new HttpsError('not-found', 'Route bulunamadi.');
    }

    const routeData = asRecord(routeSnap.data()) ?? {};
    if (routeData.isArchived === true) {
      throw new HttpsError('failed-precondition', 'Arsivlenmis route icin sohbet acilamaz.');
    }

    const routeDriverUid = pickString(routeData, 'driverId');
    if (!routeDriverUid) {
      throw new HttpsError('failed-precondition', 'Route driver bilgisi eksik.');
    }
    const authorizedDriverIds = pickStringArray(routeData, 'authorizedDriverIds');
    const requestedDriverUid = input.driverUid?.trim();
    let callerGuestSession: ActiveGuestSessionSnapshot | null = null;

    let driverUid: string;
    let passengerUid: string;

    if (callerRole === 'driver') {
      const isRouteDriver = auth.uid === routeDriverUid || authorizedDriverIds.includes(auth.uid);
      if (!isRouteDriver) {
        throw new HttpsError('permission-denied', 'Bu route icin sofor sohbet yetkin yok.');
      }
      const requestedPassengerUid = input.passengerUid?.trim();
      if (!requestedPassengerUid) {
        throw new HttpsError('invalid-argument', 'Passenger UID zorunludur.');
      }
      if (requestedPassengerUid === auth.uid) {
        throw new HttpsError('invalid-argument', 'Sofor kendiyle sohbet acamaz.');
      }
      driverUid = auth.uid;
      passengerUid = requestedPassengerUid;
    } else if (callerRole === 'passenger') {
      await requireRouteMember(db, input.routeId, auth.uid);
      passengerUid = auth.uid;
      driverUid = requestedDriverUid ?? routeDriverUid;

      const isAllowedTargetDriver =
        driverUid === routeDriverUid || authorizedDriverIds.includes(driverUid);
      if (!isAllowedTargetDriver) {
        throw new HttpsError('permission-denied', 'Hedef sofor bu route icin yetkili degil.');
      }
    } else {
      callerGuestSession = await findActiveGuestSession(db, input.routeId, auth.uid);
      if (callerGuestSession == null) {
        throw new HttpsError('permission-denied', 'Misafir oturumu aktif degil.');
      }
      passengerUid = auth.uid;
      driverUid = requestedDriverUid ?? routeDriverUid;

      const isAllowedTargetDriver =
        driverUid === routeDriverUid || authorizedDriverIds.includes(driverUid);
      if (!isAllowedTargetDriver) {
        throw new HttpsError('permission-denied', 'Hedef sofor bu route icin yetkili degil.');
      }
    }

    const passengerRef = routeRef.collection('passengers').doc(passengerUid);
    const driverRef = db.collection('drivers').doc(driverUid);
    const driverUserRef = db.collection('users').doc(driverUid);
    const passengerUserRef = db.collection('users').doc(passengerUid);
    const [passengerSnap, driverSnap, driverUserSnap, passengerUserSnap] = await Promise.all([
      passengerRef.get(),
      driverRef.get(),
      driverUserRef.get(),
      passengerUserRef.get(),
    ]);

    if (!driverSnap.exists) {
      throw new HttpsError('failed-precondition', 'Sofor profili bulunamadi.');
    }

    let resolvedGuestSession = callerGuestSession;
    if (!passengerSnap.exists) {
      resolvedGuestSession ??= await findActiveGuestSession(db, input.routeId, passengerUid);
    }
    if (!passengerSnap.exists && resolvedGuestSession == null) {
      throw new HttpsError('permission-denied', 'Route passenger/misafir kaydi bulunamadi.');
    }

    const passengerData = asRecord(passengerSnap.data()) ?? {};
    const passengerUserData = asRecord(passengerUserSnap.data());
    const driverData = asRecord(driverSnap.data()) ?? {};
    const driverUserData = asRecord(driverUserSnap.data());
    const isGuestConversation = !passengerSnap.exists;

    const passengerName =
      pickString(passengerData, 'name') ??
      resolvedGuestSession?.guestDisplayName ??
      pickString(passengerUserData, 'displayName') ??
      (isGuestConversation ? 'Misafir' : 'Yolcu');
    const driverName =
      pickString(driverData, 'name') ?? pickString(driverUserData, 'displayName') ?? 'Sofor';
    const driverPlate = pickString(driverData, 'plate');

    const conversationId = buildTripConversationId(input.routeId, driverUid, passengerUid);
    const conversationRef = db.collection('trip_conversations').doc(conversationId);
    const nowIso = new Date().toISOString();
    let created = false;

    await runTransactionVoid(db, async (tx) => {
      const conversationSnap = await tx.get(conversationRef);
      const conversationData = asRecord(conversationSnap.data());
      const existingRouteId = pickString(conversationData, 'routeId');
      if (existingRouteId != null && existingRouteId !== input.routeId) {
        throw new HttpsError('failed-precondition', 'Sohbet kaydi route ile uyumsuz.');
      }
      if (!conversationSnap.exists) {
        created = true;
      }
      const createdAt = pickString(conversationData, 'createdAt') ?? nowIso;

      tx.set(
        conversationRef,
        {
          routeId: input.routeId,
          driverUid,
          passengerUid,
          participantUids: [driverUid, passengerUid],
          driverName,
          passengerName,
          driverPlate: driverPlate ?? null,
          passengerRole: isGuestConversation ? 'guest' : 'passenger',
          lastOpenedAt: nowIso,
          createdAt,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    });

    return apiOk<OpenTripConversationOutput>({
      conversationId,
      routeId: input.routeId,
      driverUid,
      passengerUid,
      driverName,
      passengerName,
      driverPlate: driverPlate ?? null,
      created,
      updatedAt: nowIso,
    });
  });

  const sendTripMessage = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const callerRole = (await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver', 'passenger', 'guest'],
    })) as ChatCallerRole;

    const input = validateInput(sendTripMessageInputSchema, request.data) as SendTripMessageInput;
    if (callerRole === 'guest') {
      const guestSession = await findActiveGuestSession(db, input.routeId, auth.uid);
      if (guestSession == null) {
        throw new HttpsError('permission-denied', 'Misafir oturumu aktif degil.');
      }
    } else {
      await requireRouteMember(db, input.routeId, auth.uid);
    }

    const conversationRef = db.collection('trip_conversations').doc(input.conversationId);
    const messageRef = input.clientMessageId
      ? conversationRef.collection('messages').doc(input.clientMessageId)
      : conversationRef.collection('messages').doc();
    const nowIso = new Date().toISOString();
    let createdAt = nowIso;

    await runTransactionVoid(db, async (tx) => {
      const conversationSnap = await tx.get(conversationRef);
      if (!conversationSnap.exists) {
        throw new HttpsError('not-found', 'Sohbet bulunamadi.');
      }
      const conversationData = asRecord(conversationSnap.data()) ?? {};
      if (pickString(conversationData, 'routeId') !== input.routeId) {
        throw new HttpsError('failed-precondition', 'Sohbet route bilgisi uyusmuyor.');
      }
      const participantUids = pickStringArray(conversationData, 'participantUids');
      if (!participantUids.includes(auth.uid)) {
        throw new HttpsError('permission-denied', 'Bu sohbete mesaj gonderme yetkin yok.');
      }

      const driverUid = pickString(conversationData, 'driverUid');
      const passengerUid = pickString(conversationData, 'passengerUid');
      if (callerRole === 'driver' && driverUid !== auth.uid) {
        throw new HttpsError('permission-denied', 'Sadece ilgili sofor mesaj gonderebilir.');
      }
      if (callerRole === 'passenger' && passengerUid !== auth.uid) {
        throw new HttpsError('permission-denied', 'Sadece ilgili yolcu mesaj gonderebilir.');
      }
      if (callerRole === 'guest' && passengerUid !== auth.uid) {
        throw new HttpsError('permission-denied', 'Sadece ilgili misafir mesaj gonderebilir.');
      }

      const existingMessageSnap = await tx.get(messageRef);
      if (existingMessageSnap.exists) {
        const existingMessageData = asRecord(existingMessageSnap.data());
        const existingSenderUid = pickString(existingMessageData, 'senderUid');
        if (existingSenderUid !== auth.uid) {
          throw new HttpsError('failed-precondition', 'Mesaj idempotency kaydi baska gondericiye ait.');
        }
        createdAt = pickString(existingMessageData, 'createdAt') ?? nowIso;
        return;
      }

      tx.set(messageRef, {
        routeId: input.routeId,
        conversationId: input.conversationId,
        senderUid: auth.uid,
        senderRole: callerRole,
        text: input.text,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      tx.set(
        conversationRef,
        {
          lastMessageText: input.text,
          lastMessageSenderUid: auth.uid,
          lastMessageAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true },
      );
      createdAt = nowIso;
    });

    return apiOk<SendTripMessageOutput>({
      conversationId: input.conversationId,
      messageId: messageRef.id,
      senderUid: auth.uid,
      createdAt,
    });
  });

  const markTripConversationRead = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);

    const role = (await requireRole({
      db,
      uid: auth.uid,
      allowedRoles: ['driver', 'passenger', 'guest'],
    })) as ChatCallerRole;

    const input = validateInput(
      markTripConversationReadInputSchema,
      request.data,
    ) as MarkTripConversationReadInput;
    if (role === 'guest') {
      const guestSession = await findActiveGuestSession(db, input.routeId, auth.uid);
      if (guestSession == null) {
        throw new HttpsError('permission-denied', 'Misafir oturumu aktif degil.');
      }
    } else {
      await requireRouteMember(db, input.routeId, auth.uid);
    }

    const conversationRef = db.collection('trip_conversations').doc(input.conversationId);
    const conversationSnap = await conversationRef.get();
    if (!conversationSnap.exists) {
      throw new HttpsError('not-found', 'Sohbet bulunamadi.');
    }
    const conversationData = asRecord(conversationSnap.data()) ?? {};
    if (pickString(conversationData, 'routeId') !== input.routeId) {
      throw new HttpsError('failed-precondition', 'Sohbet route bilgisi uyusmuyor.');
    }
    const participantUids = pickStringArray(conversationData, 'participantUids');
    if (!participantUids.includes(auth.uid)) {
      throw new HttpsError('permission-denied', 'Bu sohbete erisim yetkin yok.');
    }

    const nowIso = new Date().toISOString();
    const readAtField = `readAtByUid.${auth.uid}`;
    await conversationRef.set(
      {
        [readAtField]: nowIso,
        updatedAt: nowIso,
      },
      { merge: true },
    );

    return apiOk<MarkTripConversationReadOutput>({
      conversationId: input.conversationId,
      readAt: nowIso,
    });
  });

  return {
    openTripConversation,
    sendTripMessage,
    markTripConversationRead,
  };
}


