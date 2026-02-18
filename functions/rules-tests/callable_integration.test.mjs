import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { ref, set } from "firebase/database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIRESTORE_RULES = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");
const RTDB_RULES = readFileSync(resolve(__dirname, "../../database.rules.json"), "utf8");

const PROJECT_ID = "demo-neredeservis-functions-it";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: PROJECT_ID,
  databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com`,
});
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_DATABASE_EMULATOR_HOST ??= "127.0.0.1:9000";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.ROUTE_PREVIEW_SIGNING_SECRET ??= "test-route-preview-signing-secret";

const {
  createRouteFromGhostDrive,
  createGuestSession,
  deleteUserData,
  generateRouteShareLink,
  getDynamicRoutePreview,
  joinRouteBySrvCode,
  registerDevice,
  sendDriverAnnouncement,
  finishTrip,
  getSubscriptionState,
  mapboxDirectionsProxy,
  mapboxMapMatchingProxy,
  morningReminderDispatcher,
  cleanupStaleData,
  searchDriverDirectory,
  startTrip,
  abandonedTripGuard,
  syncTripHeartbeatFromLocation,
} = await import("../lib/index.js");

const firestore = getFirestore();
const database = getDatabase();

function callableRequest(data, auth, rawRequest = /** @type {any} */ ({})) {
  return {
    data,
    auth,
    rawRequest,
  };
}

function authContext(uid, provider = "password") {
  return {
    uid,
    token: {
      firebase: {
        sign_in_provider: provider,
      },
    },
  };
}

function assertFailedPreconditionLike(error) {
  const code = error?.code;
  const message = String(error?.message ?? "");
  const codeMatch = code === "failed-precondition" || code === 9 || code === 3;
  const messageMatch =
    message.includes("TRANSITION_VERSION_MISMATCH") ||
    message.toLowerCase().includes("failed-precondition");
  assert.equal(codeMatch || messageMatch, true);
}

function buildIstanbulSchedulePlusFiveMinutes(baseDate = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(baseDate);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hourText = parts.find((part) => part.type === "hour")?.value;
  const minuteText = parts.find((part) => part.type === "minute")?.value;

  assert.equal(Boolean(year && month && day && hourText && minuteText), true);
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  const minuteOfDay = hour * 60 + minute;
  const scheduledMinute = (minuteOfDay + 5) % (24 * 60);
  const scheduledHourText = String(Math.floor(scheduledMinute / 60)).padStart(2, "0");
  const scheduledMinuteText = String(scheduledMinute % 60).padStart(2, "0");

  return {
    dateKey: `${year}-${month}-${day}`,
    scheduledTime: `${scheduledHourText}:${scheduledMinuteText}`,
  };
}

async function clearFirestoreEmulator() {
  const response = await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  assert.equal(response.status, 200);
}

async function clearRtdbEmulator() {
  const clearEnv = await initializeTestEnvironment({
    projectId: `${PROJECT_ID}-default-rtdb`,
    database: { rules: RTDB_RULES },
  });

  try {
    await clearEnv.clearDatabase();
  } finally {
    await clearEnv.cleanup();
  }
}

async function seedDriverRoute({ driverUid, routeId, srvCode, subscriptionStatus = "active" }) {
  const nowIso = new Date().toISOString();

  await firestore.collection("users").doc(driverUid).set({
    role: "driver",
    displayName: "Driver User",
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
  });

  await firestore.collection("drivers").doc(driverUid).set({
    name: "Driver User",
    phone: "+905551112233",
    plate: "34ABC34",
    showPhoneToPassengers: true,
    subscriptionStatus,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await firestore.collection("routes").doc(routeId).set({
    driverId: driverUid,
    authorizedDriverIds: [],
    memberIds: [driverUid],
    srvCode,
    isArchived: false,
    allowGuestTracking: true,
    lastTripStartedNotificationAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

async function seedDriverIdentity({ driverUid, subscriptionStatus = "active" }) {
  const nowIso = new Date().toISOString();

  await firestore.collection("users").doc(driverUid).set({
    role: "driver",
    displayName: "Driver User",
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
  });

  await firestore.collection("drivers").doc(driverUid).set({
    name: "Driver User",
    phone: "+905551112233",
    plate: "34ABC34",
    showPhoneToPassengers: true,
    subscriptionStatus,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

async function seedActiveTrip({ tripId, routeId, driverUid, lastLocationAt, transitionVersion = 1 }) {
  const nowIso = new Date().toISOString();
  await firestore.collection("trips").doc(tripId).set({
    routeId,
    driverId: driverUid,
    driverSnapshot: {
      name: "Driver User",
      plate: "34ABC34",
      phone: "55******33",
    },
    status: "active",
    startedAt: nowIso,
    endedAt: null,
    lastLocationAt,
    endReason: null,
    startedByDeviceId: "seed-device",
    transitionVersion,
    updatedAt: nowIso,
  });
}

test.beforeEach(async () => {
  await clearFirestoreEmulator();
  await clearRtdbEmulator();
});

test.after(async () => {
  await Promise.all(getApps().map(async (app) => app.delete()));
});

test("STEP-261 callable integration: createGuestSession success", async () => {
  const routeId = "route-integration-1";
  await firestore.collection("routes").doc(routeId).set({
    srvCode: "ABCD23",
    isArchived: false,
    allowGuestTracking: true,
    driverId: "driver-alpha",
    memberIds: ["driver-alpha"],
  });

  const result = await createGuestSession.run(
    callableRequest(
      {
        srvCode: "ABCD23",
      },
      authContext("guest-user-1", "anonymous"),
    ),
  );

  assert.equal(result.data.routeId, routeId);
  assert.equal(result.data.rtdbReadPath, `/locations/${routeId}`);

  const guestSessionSnap = await firestore
    .collection("guest_sessions")
    .where("guestUid", "==", "guest-user-1")
    .limit(1)
    .get();
  assert.equal(guestSessionSnap.empty, false);

  const guestReaderSnap = await database.ref(`guestReaders/${routeId}/guest-user-1`).get();
  assert.equal(guestReaderSnap.child("active").val(), true);
});

test("STEP-262 auth yokken callable red", async () => {
  await assert.rejects(
    async () => getSubscriptionState.run(callableRequest({}, undefined)),
    (error) => {
      assert.equal(error.code, "unauthenticated");
      return true;
    },
  );
});

test("STEP-263 anonymous callable red (createGuestSession haric)", async () => {
  await assert.rejects(
    async () => getSubscriptionState.run(callableRequest({}, authContext("anon-user", "anonymous"))),
    (error) => {
      assert.equal(error.code, "failed-precondition");
      return true;
    },
  );
});

test("STEP-264 role mismatch red", async () => {
  await firestore.collection("users").doc("passenger-user-1").set({
    role: "passenger",
  });

  await assert.rejects(
    async () =>
      searchDriverDirectory.run(
        callableRequest(
          {
            queryHash: "abcd1234",
          },
          authContext("passenger-user-1"),
        ),
      ),
    (error) => {
      assert.equal(error.code, "permission-denied");
      return true;
    },
  );
});

test("STEP-265 invalid payload red", async () => {
  await assert.rejects(
    async () =>
      searchDriverDirectory.run(
        callableRequest(
          {
            queryHash: "short",
          },
          authContext("driver-user-1"),
        ),
      ),
    (error) => {
      assert.equal(error.code, "invalid-argument");
      return true;
    },
  );
});

test("STEP-266 idempotency replay: startTrip + finishTrip", async () => {
  const driverUid = "driver-idem-1";
  const routeId = "route-idem-1";
  const deviceId = "device-idem-1";
  const startKey = "start-idem-key-0001";
  const finishKey = "finish-idem-key-0001";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "ZXCV56",
  });

  const firstStart = await startTrip.run(
    callableRequest(
      {
        routeId,
        deviceId,
        idempotencyKey: startKey,
        expectedTransitionVersion: 0,
      },
      authContext(driverUid),
    ),
  );
  const replayStart = await startTrip.run(
    callableRequest(
      {
        routeId,
        deviceId,
        idempotencyKey: startKey,
        expectedTransitionVersion: 0,
      },
      authContext(driverUid),
    ),
  );

  assert.equal(firstStart.data.tripId, replayStart.data.tripId);
  assert.equal(firstStart.data.status, "active");
  assert.equal(replayStart.data.status, "active");

  const routeTripSnap = await firestore.collection("trips").where("routeId", "==", routeId).get();
  assert.equal(routeTripSnap.size, 1);

  const firstFinish = await finishTrip.run(
    callableRequest(
      {
        tripId: firstStart.data.tripId,
        deviceId,
        idempotencyKey: finishKey,
        expectedTransitionVersion: firstStart.data.transitionVersion,
      },
      authContext(driverUid),
    ),
  );
  const replayFinish = await finishTrip.run(
    callableRequest(
      {
        tripId: firstStart.data.tripId,
        deviceId,
        idempotencyKey: finishKey,
        expectedTransitionVersion: firstStart.data.transitionVersion,
      },
      authContext(driverUid),
    ),
  );

  assert.equal(firstFinish.data.tripId, replayFinish.data.tripId);
  assert.equal(firstFinish.data.status, "completed");
  assert.equal(replayFinish.data.status, "completed");

  const tripSnap = await firestore.collection("trips").doc(firstStart.data.tripId).get();
  assert.equal(tripSnap.exists, true);
  assert.equal(tripSnap.get("status"), "completed");

  const startRequestSnap = await firestore.collection("trip_requests").doc(`${driverUid}_${startKey}`).get();
  const finishRequestSnap = await firestore
    .collection("trip_requests")
    .doc(`${driverUid}_${finishKey}`)
    .get();
  assert.equal(startRequestSnap.exists, true);
  assert.equal(finishRequestSnap.exists, true);
});

test("STEP-267 concurrency race: cift startTrip denemesinde tek aktif transition", async () => {
  const driverUid = "driver-race-1";
  const routeId = "route-race-1";
  const deviceId = "device-race-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "QWER45",
  });

  const requestA = callableRequest(
    {
      routeId,
      deviceId,
      idempotencyKey: "race-start-key-a",
      expectedTransitionVersion: 0,
    },
    authContext(driverUid),
  );
  const requestB = callableRequest(
    {
      routeId,
      deviceId,
      idempotencyKey: "race-start-key-b",
      expectedTransitionVersion: 0,
    },
    authContext(driverUid),
  );

  const raceResults = await Promise.allSettled([startTrip.run(requestA), startTrip.run(requestB)]);
  const fulfilled = raceResults.filter((result) => result.status === "fulfilled");
  const rejected = raceResults.filter((result) => result.status === "rejected");

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assertFailedPreconditionLike(rejected[0].reason);

  const activeTripsSnap = await firestore
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .get();
  assert.equal(activeTripsSnap.size, 1);
});

test("STEP-268 RTDB heartbeat -> Firestore lastLocationAt guncellenir", async () => {
  const routeId = "route-heartbeat-live";
  const tripId = "trip-heartbeat-live";
  const nowMs = Date.now();
  const liveTimestampMs = nowMs - 2_000;
  await seedActiveTrip({
    tripId,
    routeId,
    driverUid: "driver-heartbeat-live",
    lastLocationAt: new Date(nowMs - 60_000).toISOString(),
  });

  await syncTripHeartbeatFromLocation.run({
    params: { routeId },
    data: {
      after: {
        val: () => ({
          tripId,
          driverId: "driver-heartbeat-live",
          lat: 40.1,
          lng: 29.9,
          accuracy: 5,
          speed: 10,
          heading: 90,
          timestamp: liveTimestampMs,
        }),
      },
    },
  });

  const tripSnap = await firestore.collection("trips").doc(tripId).get();
  assert.equal(tripSnap.exists, true);
  assert.equal(tripSnap.get("lastLocationAt"), new Date(liveTimestampMs).toISOString());

  const historySnap = await firestore
    .collection("trips")
    .doc(tripId)
    .collection("location_history")
    .where("source", "==", "live")
    .limit(1)
    .get();
  assert.equal(historySnap.empty, false);
});

test("STEP-268B stale replay canli marker'i guncellemez", async () => {
  const routeId = "route-heartbeat-stale";
  const tripId = "trip-heartbeat-stale";
  const nowMs = Date.now();
  const originalLastLocationAt = new Date(nowMs - 3_000).toISOString();
  await seedActiveTrip({
    tripId,
    routeId,
    driverUid: "driver-heartbeat-stale",
    lastLocationAt: originalLastLocationAt,
  });

  await syncTripHeartbeatFromLocation.run({
    params: { routeId },
    data: {
      after: {
        val: () => ({
          tripId,
          driverId: "driver-heartbeat-stale",
          lat: 40.2,
          lng: 29.8,
          accuracy: 12,
          speed: 8,
          heading: 70,
          timestamp: nowMs - 120_000,
        }),
      },
    },
  });

  const tripSnap = await firestore.collection("trips").doc(tripId).get();
  assert.equal(tripSnap.exists, true);
  assert.equal(tripSnap.get("lastLocationAt"), originalLastLocationAt);

  const historySnap = await firestore
    .collection("trips")
    .doc(tripId)
    .collection("location_history")
    .where("source", "==", "offline_replay")
    .limit(1)
    .get();
  assert.equal(historySnap.empty, false);
});

test("STEP-268A finishTrip sonrasi routeWriter write deny", async () => {
  const driverUid = "driver-revoke-1";
  const routeId = "route-revoke-1";
  const deviceId = "device-revoke-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "TYUI67",
  });

  const started = await startTrip.run(
    callableRequest(
      {
        routeId,
        deviceId,
        idempotencyKey: "revoke-start-key-1",
        expectedTransitionVersion: 0,
      },
      authContext(driverUid),
    ),
  );

  const testEnv = await initializeTestEnvironment({
    projectId: `${PROJECT_ID}-default-rtdb`,
    database: { rules: RTDB_RULES },
  });

  try {
    const writerContext = testEnv.authenticatedContext(driverUid);
    const writerDb = writerContext.database();
    const livePayload = {
      lat: 40.77,
      lng: 29.94,
      speed: 10,
      heading: 90,
      accuracy: 5,
      tripId: started.data.tripId,
      driverId: driverUid,
      timestamp: Date.now(),
    };

    await assertSucceeds(set(ref(writerDb, `locations/${routeId}`), livePayload));

    await finishTrip.run(
      callableRequest(
        {
          tripId: started.data.tripId,
          deviceId,
          idempotencyKey: "revoke-finish-key-1",
          expectedTransitionVersion: started.data.transitionVersion,
        },
        authContext(driverUid),
      ),
    );

    await assertFails(
      set(ref(writerDb, `locations/${routeId}`), {
        ...livePayload,
        timestamp: Date.now(),
      }),
    );
  } finally {
    await testEnv.cleanup();
  }
});

test("STEP-268D transitionVersion race: cift startTrip/finishTrip", async () => {
  const driverUid = "driver-transition-race-1";
  const routeId = "route-transition-race-1";
  const deviceId = "device-transition-race-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "ASDF78",
  });

  const startRace = await Promise.allSettled([
    startTrip.run(
      callableRequest(
        {
          routeId,
          deviceId,
          idempotencyKey: "transition-start-a",
          expectedTransitionVersion: 0,
        },
        authContext(driverUid),
      ),
    ),
    startTrip.run(
      callableRequest(
        {
          routeId,
          deviceId,
          idempotencyKey: "transition-start-b",
          expectedTransitionVersion: 0,
        },
        authContext(driverUid),
      ),
    ),
  ]);

  const startFulfilled = startRace.filter((result) => result.status === "fulfilled");
  const startRejected = startRace.filter((result) => result.status === "rejected");
  assert.equal(startFulfilled.length, 1);
  assert.equal(startRejected.length, 1);
  assertFailedPreconditionLike(startRejected[0].reason);

  const startedTrip = startFulfilled[0].value.data;
  const finishRace = await Promise.allSettled([
    finishTrip.run(
      callableRequest(
        {
          tripId: startedTrip.tripId,
          deviceId,
          idempotencyKey: "transition-finish-a",
          expectedTransitionVersion: startedTrip.transitionVersion,
        },
        authContext(driverUid),
      ),
    ),
    finishTrip.run(
      callableRequest(
        {
          tripId: startedTrip.tripId,
          deviceId,
          idempotencyKey: "transition-finish-b",
          expectedTransitionVersion: startedTrip.transitionVersion,
        },
        authContext(driverUid),
      ),
    ),
  ]);

  const finishFulfilled = finishRace.filter((result) => result.status === "fulfilled");
  const finishRejected = finishRace.filter((result) => result.status === "rejected");
  assert.equal(finishFulfilled.length, 1);
  assert.equal(finishRejected.length, 1);
  assertFailedPreconditionLike(finishRejected[0].reason);

  const tripSnap = await firestore.collection("trips").doc(startedTrip.tripId).get();
  assert.equal(tripSnap.exists, true);
  assert.equal(tripSnap.get("status"), "completed");
  assert.equal(tripSnap.get("transitionVersion"), 2);
});

test("STEP-268C ghost drive map matching kalite: urban canyon trace stabil + fallback veri kaybi yok", async () => {
  const driverUid = "driver-ghost-mapmatch-1";
  await seedDriverIdentity({ driverUid });

  const baseTs = Date.now();
  const urbanCanyonTrace = [
    { lat: 41.0098, lng: 28.9736, accuracy: 8, sampledAtMs: baseTs + 0 },
    { lat: 41.0101, lng: 28.9741, accuracy: 7, sampledAtMs: baseTs + 1_000 },
    { lat: 41.0104, lng: 28.9747, accuracy: 9, sampledAtMs: baseTs + 2_000 },
    { lat: 41.0108, lng: 28.9752, accuracy: 10, sampledAtMs: baseTs + 3_000 },
    { lat: 41.0112, lng: 28.9758, accuracy: 6, sampledAtMs: baseTs + 4_000 },
    { lat: 41.0116, lng: 28.9763, accuracy: 11, sampledAtMs: baseTs + 5_000 },
    { lat: 41.0119, lng: 28.9768, accuracy: 7, sampledAtMs: baseTs + 6_000 },
    { lat: 41.0123, lng: 28.9772, accuracy: 6, sampledAtMs: baseTs + 7_000 },
    { lat: 41.0127, lng: 28.9777, accuracy: 10, sampledAtMs: baseTs + 8_000 },
    { lat: 41.0131, lng: 28.9781, accuracy: 9, sampledAtMs: baseTs + 9_000 },
    { lat: 41.0135, lng: 28.9787, accuracy: 8, sampledAtMs: baseTs + 10_000 },
    { lat: 41.0138, lng: 28.9792, accuracy: 7, sampledAtMs: baseTs + 11_000 },
  ];

  await firestore.collection("_runtime_flags").doc("map_matching").set({
    enabled: true,
    monthlyRequestMax: 1,
    timeoutMs: 1_500,
  });

  const firstResult = await createRouteFromGhostDrive.run(
    callableRequest(
      {
        name: "Ghost Urban A",
        tracePoints: urbanCanyonTrace,
        scheduledTime: "08:15",
        timeSlot: "morning",
        allowGuestTracking: true,
      },
      authContext(driverUid),
    ),
  );

  const firstRouteSnap = await firestore.collection("routes").doc(firstResult.data.routeId).get();
  assert.equal(firstRouteSnap.exists, true);
  assert.equal(firstRouteSnap.get("ghostTraceMeta.mapMatchingSource"), "map_matching");
  assert.equal(firstRouteSnap.get("ghostTraceMeta.mapMatchingFallbackUsed"), false);
  assert.equal(firstRouteSnap.get("ghostTraceMeta.mapMatchingConfidence"), 0.5);
  assert.equal(firstRouteSnap.get("ghostTraceMeta.finalCount") >= 2, true);
  assert.equal(firstResult.data.inferredStops.length >= 2, true);

  const secondResult = await createRouteFromGhostDrive.run(
    callableRequest(
      {
        name: "Ghost Urban B",
        tracePoints: urbanCanyonTrace,
        scheduledTime: "08:30",
        timeSlot: "morning",
        allowGuestTracking: true,
      },
      authContext(driverUid),
    ),
  );

  const secondRouteSnap = await firestore.collection("routes").doc(secondResult.data.routeId).get();
  assert.equal(secondRouteSnap.exists, true);
  assert.equal(secondRouteSnap.get("ghostTraceMeta.mapMatchingSource"), "fallback");
  assert.equal(secondRouteSnap.get("ghostTraceMeta.mapMatchingFallbackUsed"), true);
  assert.equal(secondRouteSnap.get("ghostTraceMeta.mapMatchingConfidence"), 0);
  assert.equal(
    secondRouteSnap.get("ghostTraceMeta.finalCount"),
    secondRouteSnap.get("ghostTraceMeta.simplifiedCount"),
  );
  assert.equal(typeof secondRouteSnap.get("routePolyline"), "string");
  assert.equal(secondRouteSnap.get("routePolyline").length > 0, true);
});

test("STEP-269 abandonedTripGuard stale kosul testleri", async () => {
  const nowMs = Date.now();
  const staleTripId = "trip-guard-stale-1";
  const freshTripId = "trip-guard-fresh-1";
  const staleRouteId = "route-guard-stale-1";
  const freshRouteId = "route-guard-fresh-1";
  const staleDriverId = "driver-guard-stale-1";
  const freshDriverId = "driver-guard-fresh-1";
  const staleLastLocationAt = new Date(nowMs - 20 * 60 * 1000).toISOString();
  const freshLastLocationAt = new Date(nowMs - 60 * 1000).toISOString();

  await seedActiveTrip({
    tripId: staleTripId,
    routeId: staleRouteId,
    driverUid: staleDriverId,
    lastLocationAt: staleLastLocationAt,
    transitionVersion: 3,
  });
  await seedActiveTrip({
    tripId: freshTripId,
    routeId: freshRouteId,
    driverUid: freshDriverId,
    lastLocationAt: freshLastLocationAt,
    transitionVersion: 5,
  });

  await database.ref(`routeWriters/${staleRouteId}/${staleDriverId}`).set(true);
  await database.ref(`routeWriters/${freshRouteId}/${freshDriverId}`).set(true);

  await abandonedTripGuard.run({});

  const staleTripSnap = await firestore.collection("trips").doc(staleTripId).get();
  assert.equal(staleTripSnap.exists, true);
  assert.equal(staleTripSnap.get("status"), "abandoned");
  assert.equal(staleTripSnap.get("endReason"), "auto_abandoned");
  assert.equal(staleTripSnap.get("transitionVersion"), 4);

  const freshTripSnap = await firestore.collection("trips").doc(freshTripId).get();
  assert.equal(freshTripSnap.exists, true);
  assert.equal(freshTripSnap.get("status"), "active");
  assert.equal(freshTripSnap.get("transitionVersion"), 5);

  const staleWriterSnap = await database.ref(`routeWriters/${staleRouteId}/${staleDriverId}`).get();
  const freshWriterSnap = await database.ref(`routeWriters/${freshRouteId}/${freshDriverId}`).get();
  assert.equal(staleWriterSnap.val(), false);
  assert.equal(freshWriterSnap.val(), true);
});

test("STEP-270 sendDriverAnnouncement dedupe", async () => {
  const driverUid = "driver-announcement-1";
  const routeId = "route-announcement-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "GHJK89",
  });

  const first = await sendDriverAnnouncement.run(
    callableRequest(
      {
        routeId,
        templateKey: "delay_notice",
        customText: "Servis 10 dakika gecikmeli.",
        idempotencyKey: "announcement-idem-1",
      },
      authContext(driverUid),
    ),
  );
  const second = await sendDriverAnnouncement.run(
    callableRequest(
      {
        routeId,
        templateKey: "delay_notice",
        customText: "Servis 10 dakika gecikmeli.",
        idempotencyKey: "announcement-idem-1",
      },
      authContext(driverUid),
    ),
  );

  assert.equal(first.data.announcementId, second.data.announcementId);

  const announcementsSnap = await firestore
    .collection("announcements")
    .where("routeId", "==", routeId)
    .where("driverId", "==", driverUid)
    .get();
  assert.equal(announcementsSnap.size, 1);

  const dedupeSnap = await firestore
    .collection("_notification_dedup")
    .doc(`announcement_dispatch_${first.data.announcementId}`)
    .get();
  assert.equal(dedupeSnap.exists, true);

  const outboxSnap = await firestore
    .collection("_notification_outbox")
    .where("type", "==", "driver_announcement_dispatch")
    .where("announcementId", "==", first.data.announcementId)
    .get();
  assert.equal(outboxSnap.size, 1);
});

test("STEP-270A trip_started cooldown: kisa aralikta ikinci start'ta bildirim zamanı degismez", async () => {
  const driverUid = "driver-cooldown-1";
  const routeId = "route-cooldown-1";
  const deviceId = "device-cooldown-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "ZXNM12",
  });

  const firstStart = await startTrip.run(
    callableRequest(
      {
        routeId,
        deviceId,
        idempotencyKey: "cooldown-start-1",
        expectedTransitionVersion: 0,
      },
      authContext(driverUid),
    ),
  );
  const firstRouteSnap = await firestore.collection("routes").doc(routeId).get();
  const firstTripNotificationAt = firstRouteSnap.get("lastTripStartedNotificationAt");
  assert.equal(typeof firstTripNotificationAt, "string");

  const firstFinish = await finishTrip.run(
    callableRequest(
      {
        tripId: firstStart.data.tripId,
        deviceId,
        idempotencyKey: "cooldown-finish-1",
        expectedTransitionVersion: firstStart.data.transitionVersion,
      },
      authContext(driverUid),
    ),
  );

  await startTrip.run(
    callableRequest(
      {
        routeId,
        deviceId,
        idempotencyKey: "cooldown-start-2",
        expectedTransitionVersion: 0,
      },
      authContext(driverUid),
    ),
  );
  const secondRouteSnap = await firestore.collection("routes").doc(routeId).get();
  const secondTripNotificationAt = secondRouteSnap.get("lastTripStartedNotificationAt");

  assert.equal(secondTripNotificationAt, firstTripNotificationAt);
});

test("STEP-270B startTrip undo window: hizli iptalde server'da aktif trip kalmaz", async () => {
  const driverUid = "driver-undo-window-1";
  const routeId = "route-undo-window-1";
  const deviceId = "device-undo-window-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "UNDO10",
  });

  const started = await startTrip.run(
    callableRequest(
      {
        routeId,
        deviceId,
        idempotencyKey: "undo-start-1",
        expectedTransitionVersion: 0,
      },
      authContext(driverUid),
    ),
  );

  await finishTrip.run(
    callableRequest(
      {
        tripId: started.data.tripId,
        deviceId,
        idempotencyKey: "undo-finish-1",
        expectedTransitionVersion: started.data.transitionVersion,
      },
      authContext(driverUid),
    ),
  );

  const activeTripsSnap = await firestore
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .get();
  assert.equal(activeTripsSnap.size, 0);

  const completedTripSnap = await firestore.collection("trips").doc(started.data.tripId).get();
  assert.equal(completedTripSnap.exists, true);
  assert.equal(completedTripSnap.get("status"), "completed");

  const writerSnap = await database.ref(`routeWriters/${routeId}/${driverUid}`).get();
  assert.equal(writerSnap.val(), false);
});

test("STEP-270C registerDevice policy: eski cihaz revoke + finishTrip device kurali", async () => {
  const driverUid = "driver-device-policy-1";
  const routeId = "route-device-policy-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "BNMV34",
  });

  const registerA = await registerDevice.run(
    callableRequest(
      {
        deviceId: "device-policy-a",
        activeDeviceToken: "token-alpha-1",
      },
      authContext(driverUid),
    ),
  );
  assert.equal(registerA.data.previousDeviceRevoked, false);

  const registerB = await registerDevice.run(
    callableRequest(
      {
        deviceId: "device-policy-b",
        activeDeviceToken: "token-bravo-1",
      },
      authContext(driverUid),
    ),
  );
  assert.equal(registerB.data.previousDeviceRevoked, true);

  const oldDeviceSnap = await firestore
    .collection("drivers")
    .doc(driverUid)
    .collection("devices")
    .doc("device-policy-a")
    .get();
  const newDeviceSnap = await firestore
    .collection("drivers")
    .doc(driverUid)
    .collection("devices")
    .doc("device-policy-b")
    .get();
  assert.equal(oldDeviceSnap.get("isActive"), false);
  assert.equal(newDeviceSnap.get("isActive"), true);

  const started = await startTrip.run(
    callableRequest(
      {
        routeId,
        deviceId: "device-policy-b",
        idempotencyKey: "device-policy-start-1",
        expectedTransitionVersion: 0,
      },
      authContext(driverUid),
    ),
  );

  await assert.rejects(
    async () =>
      finishTrip.run(
        callableRequest(
          {
            tripId: started.data.tripId,
            deviceId: "device-policy-a",
            idempotencyKey: "device-policy-finish-invalid",
            expectedTransitionVersion: started.data.transitionVersion,
          },
          authContext(driverUid),
        ),
      ),
    (error) => {
      assert.equal(error.code, "permission-denied");
      return true;
    },
  );
});

test("STEP-270D morningReminderDispatcher timezone testi", async () => {
  const driverUid = "driver-reminder-1";
  const routeId = "route-reminder-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "LKJH56",
  });

  const scheduleInfo = buildIstanbulSchedulePlusFiveMinutes(new Date());
  await firestore.collection("routes").doc(routeId).set(
    {
      scheduledTime: scheduleInfo.scheduledTime,
    },
    { merge: true },
  );

  await morningReminderDispatcher.run({});

  const dedupeKey = `${routeId}_${scheduleInfo.dateKey}_morning_reminder`;
  const dedupeSnap = await firestore.collection("_notification_dedup").doc(dedupeKey).get();
  assert.equal(dedupeSnap.exists, true);

  const outboxSnap = await firestore
    .collection("_notification_outbox")
    .where("type", "==", "morning_reminder")
    .where("routeId", "==", routeId)
    .where("dateKey", "==", scheduleInfo.dateKey)
    .get();
  assert.equal(outboxSnap.empty, false);
});

test("STEP-270E subscription tamper testi: premium guard server-side", async () => {
  const driverUid = "driver-subscription-mock-1";
  const routeId = "route-subscription-mock-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "POIU78",
    subscriptionStatus: "mock",
  });

  await assert.rejects(
    async () =>
      sendDriverAnnouncement.run(
        callableRequest(
          {
            routeId,
            templateKey: "info_notice",
            customText: "Kontrol mesaji",
            idempotencyKey: "subscription-tamper-1",
          },
          authContext(driverUid),
        ),
      ),
    (error) => {
      assert.equal(error.code, "permission-denied");
      return true;
    },
  );
});

test("STEP-281 mapboxDirectionsProxy: varsayilan kapali mod fail-fast", async () => {
  const driverUid = "driver-mapbox-dir-1";
  const routeId = "route-mapbox-dir-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "MAP281",
  });

  await assert.rejects(
    async () =>
      mapboxDirectionsProxy.run(
        callableRequest(
          {
            routeId,
            origin: { lat: 41.01, lng: 28.97 },
            destination: { lat: 41.02, lng: 28.99 },
          },
          authContext(driverUid),
        ),
      ),
    (error) => {
      assert.equal(error.code, "failed-precondition");
      return true;
    },
  );
});

test("STEP-281A mapboxMapMatchingProxy: graceful fallback sonucu doner", async () => {
  const driverUid = "driver-mapbox-match-1";
  await seedDriverIdentity({ driverUid });

  const baseTs = Date.now();
  const tracePoints = [
    { lat: 41.001, lng: 28.971, accuracy: 8, sampledAtMs: baseTs + 0 },
    { lat: 41.0012, lng: 28.9713, accuracy: 9, sampledAtMs: baseTs + 1_000 },
    { lat: 41.0014, lng: 28.9716, accuracy: 7, sampledAtMs: baseTs + 2_000 },
    { lat: 41.0017, lng: 28.9719, accuracy: 8, sampledAtMs: baseTs + 3_000 },
    { lat: 41.002, lng: 28.9722, accuracy: 9, sampledAtMs: baseTs + 4_000 },
    { lat: 41.0023, lng: 28.9726, accuracy: 7, sampledAtMs: baseTs + 5_000 },
    { lat: 41.0026, lng: 28.9729, accuracy: 8, sampledAtMs: baseTs + 6_000 },
    { lat: 41.0029, lng: 28.9733, accuracy: 10, sampledAtMs: baseTs + 7_000 },
    { lat: 41.0032, lng: 28.9737, accuracy: 7, sampledAtMs: baseTs + 8_000 },
    { lat: 41.0035, lng: 28.974, accuracy: 9, sampledAtMs: baseTs + 9_000 },
  ];

  const result = await mapboxMapMatchingProxy.run(
    callableRequest(
      {
        tracePoints,
      },
      authContext(driverUid),
    ),
  );

  assert.equal(Array.isArray(result.data.tracePoints), true);
  assert.equal(result.data.tracePoints.length >= 2, true);
  assert.equal(result.data.fallbackUsed, true);
  assert.equal(result.data.source, "fallback");
  assert.equal(result.data.confidence, 0);
});

test("STEP-287 generateRouteShareLink: whatsapp url + system fallback text", async () => {
  const driverUid = "driver-share-link-1";
  const routeId = "route-share-link-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "WAPP87",
  });

  const result = await generateRouteShareLink.run(
    callableRequest(
      {
        routeId,
        customText: "Servis baglantisini buradan takip edebilirsin:",
      },
      authContext(driverUid),
    ),
  );

  assert.equal(result.data.routeId, routeId);
  assert.equal(result.data.srvCode, "WAPP87");
  assert.equal(result.data.landingUrl, "https://nerede.servis/r/WAPP87");
  assert.equal(typeof result.data.previewToken, "string");
  assert.equal(result.data.previewToken.length > 16, true);
  assert.equal(result.data.signedLandingUrl.startsWith("https://nerede.servis/r/WAPP87?t="), true);
  assert.equal(typeof result.data.previewTokenExpiresAt, "string");
  assert.equal(result.data.systemShareText.includes("https://nerede.servis/r/WAPP87"), true);
  assert.equal(result.data.whatsappUrl.startsWith("https://wa.me/?text="), true);
  assert.equal(decodeURIComponent(result.data.whatsappUrl.split("text=")[1]).includes("WAPP87"), true);

  const auditSnap = await firestore
    .collection("_audit_route_events")
    .where("eventType", "==", "route_share_link_generated")
    .limit(1)
    .get();
  assert.equal(auditSnap.empty, false);
  const auditData = auditSnap.docs[0]?.data();
  assert.equal(auditData?.actorUid, driverUid);
  assert.equal(auditData?.routeId, routeId);
  assert.equal(auditData?.srvCode, "WAPP87");
  assert.equal(auditData?.status, "success");
});

test("STEP-288 getDynamicRoutePreview: signed token ile route preview doner", async () => {
  const driverUid = "driver-preview-1";
  const routeId = "route-preview-1";
  await seedDriverRoute({
    driverUid,
    routeId,
    srvCode: "PRVW88",
  });
  await firestore.collection("routes").doc(routeId).set(
    {
      name: "Darica Sabah Hatti",
      scheduledTime: "07:30",
      timeSlot: "morning",
      allowGuestTracking: true,
    },
    { merge: true },
  );

  const share = await generateRouteShareLink.run(
    callableRequest(
      {
        routeId,
      },
      authContext(driverUid),
    ),
  );

  const preview = await getDynamicRoutePreview.run(
    callableRequest(
      {
        srvCode: "PRVW88",
        token: share.data.previewToken,
      },
      undefined,
      { ip: "198.51.100.20" },
    ),
  );

  assert.equal(preview.data.routeId, routeId);
  assert.equal(preview.data.srvCode, "PRVW88");
  assert.equal(preview.data.routeName, "Darica Sabah Hatti");
  assert.equal(preview.data.driverDisplayName, "Driver User");
  assert.equal(preview.data.scheduledTime, "07:30");
  assert.equal(preview.data.timeSlot, "morning");
  assert.equal(preview.data.allowGuestTracking, true);
  assert.equal(preview.data.deepLinkUrl, "neredeservis://route-preview?srvCode=PRVW88");

  const auditSnap = await firestore
    .collection("_audit_route_events")
    .where("eventType", "==", "route_preview_accessed")
    .limit(1)
    .get();
  assert.equal(auditSnap.empty, false);
  const auditData = auditSnap.docs[0]?.data();
  assert.equal(auditData?.routeId, routeId);
  assert.equal(auditData?.srvCode, "PRVW88");
  assert.equal(auditData?.status, "success");
  assert.equal(typeof auditData?.requestIpHash, "string");
  assert.equal(auditData?.requestIpHash.length, 24);
});

test("STEP-288 getDynamicRoutePreview: rate limit asiminda RESOURCE_EXHAUSTED", async () => {
  const previousMax = process.env.ROUTE_PREVIEW_RATE_MAX_CALLS;
  process.env.ROUTE_PREVIEW_RATE_MAX_CALLS = "1";

  try {
    const driverUid = "driver-preview-rate-1";
    const routeId = "route-preview-rate-1";
    await seedDriverRoute({
      driverUid,
      routeId,
      srvCode: "PRW9A2",
    });
    await firestore.collection("routes").doc(routeId).set(
      {
        name: "Gebze Aksam Hatti",
      },
      { merge: true },
    );

    const share = await generateRouteShareLink.run(
      callableRequest(
        {
          routeId,
        },
        authContext(driverUid),
      ),
    );

    const requestData = {
      srvCode: "PRW9A2",
      token: share.data.previewToken,
    };
    const requestIp = { ip: "203.0.113.45" };

    await getDynamicRoutePreview.run(callableRequest(requestData, undefined, requestIp));
    await assert.rejects(
      async () => getDynamicRoutePreview.run(callableRequest(requestData, undefined, requestIp)),
      (error) => {
        assert.equal(error.code, "resource-exhausted");
        return true;
      },
    );

    const deniedAuditSnap = await firestore
      .collection("_audit_route_events")
      .where("eventType", "==", "route_preview_denied")
      .limit(1)
      .get();
    assert.equal(deniedAuditSnap.empty, false);
    const deniedAudit = deniedAuditSnap.docs[0]?.data();
    assert.equal(deniedAudit?.srvCode, "PRW9A2");
    assert.equal(deniedAudit?.status, "denied");
    assert.equal(deniedAudit?.reason, "resource-exhausted");
  } finally {
    if (previousMax === undefined) {
      delete process.env.ROUTE_PREVIEW_RATE_MAX_CALLS;
    } else {
      process.env.ROUTE_PREVIEW_RATE_MAX_CALLS = previousMax;
    }
  }
});

test("STEP-289 joinRouteBySrvCode: abuse prevention rate limit", async () => {
  const previousMax = process.env.JOIN_ROUTE_RATE_MAX_CALLS;
  process.env.JOIN_ROUTE_RATE_MAX_CALLS = "1";

  try {
    const driverUid = "driver-join-limit-1";
    const passengerUid = "passenger-join-limit-1";
    const routeId = "route-join-limit-1";
    await seedDriverRoute({
      driverUid,
      routeId,
      srvCode: "JNRA82",
    });

    const nowIso = new Date().toISOString();
    await firestore.collection("users").doc(passengerUid).set({
      role: "passenger",
      displayName: "Passenger User",
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    });

    const joinPayload = {
      srvCode: "JNRA82",
      name: "Passenger User",
      phone: "+905551234567",
      showPhoneToDriver: false,
      boardingArea: "Durak A",
      notificationTime: "07:40",
    };

    await joinRouteBySrvCode.run(callableRequest(joinPayload, authContext(passengerUid)));
    await assert.rejects(
      async () => joinRouteBySrvCode.run(callableRequest(joinPayload, authContext(passengerUid))),
      (error) => {
        assert.equal(error.code, "resource-exhausted");
        return true;
      },
    );

    const joinAuditSnap = await firestore
      .collection("_audit_route_events")
      .where("eventType", "==", "route_joined_by_srv")
      .limit(1)
      .get();
    assert.equal(joinAuditSnap.empty, false);
    const joinAudit = joinAuditSnap.docs[0]?.data();
    assert.equal(joinAudit?.actorUid, passengerUid);
    assert.equal(joinAudit?.routeId, routeId);
    assert.equal(joinAudit?.srvCode, "JNRA82");
    assert.equal(joinAudit?.status, "success");
  } finally {
    if (previousMax === undefined) {
      delete process.env.JOIN_ROUTE_RATE_MAX_CALLS;
    } else {
      process.env.JOIN_ROUTE_RATE_MAX_CALLS = previousMax;
    }
  }
});

test("STEP-292 deleteUserData dry-run: veri mutasyonu yapmaz", async () => {
  const driverUid = "driver-delete-dryrun-1";
  await seedDriverIdentity({ driverUid, subscriptionStatus: "expired" });

  const dryRunResult = await deleteUserData.run(
    callableRequest(
      {
        dryRun: true,
      },
      authContext(driverUid),
    ),
  );

  assert.equal(dryRunResult.data.status, "scheduled");
  assert.equal(dryRunResult.data.blockedBySubscription, false);
  assert.equal(dryRunResult.data.dryRun, true);
  assert.equal(typeof dryRunResult.data.hardDeleteAfter, "string");

  const deleteRequestSnap = await firestore.collection("_delete_requests").doc(driverUid).get();
  assert.equal(deleteRequestSnap.exists, false);

  const userSnap = await firestore.collection("users").doc(driverUid).get();
  const userData = userSnap.data() ?? {};
  assert.equal(userData.deletedAt ?? null, null);
});

test(
  "STEP-292A deleteUserData interceptor: aktif abonelik blok, aktif olmayan abonelikte delete request",
  async () => {
    const blockedUid = "driver-delete-active-1";
    await seedDriverIdentity({ driverUid: blockedUid, subscriptionStatus: "active" });

    const blockedResult = await deleteUserData.run(callableRequest({}, authContext(blockedUid)));
    assert.equal(blockedResult.data.status, "blocked_subscription");
    assert.equal(blockedResult.data.blockedBySubscription, true);
    assert.equal(
      blockedResult.data.interceptorMessage,
      "Hesabi silmek odemeyi durdurmaz, once store aboneligini iptal et.",
    );
    assert.equal(blockedResult.data.manageSubscriptionLabel, "Manage Subscription");
    assert.equal(
      blockedResult.data.manageSubscriptionUrls.android,
      "https://play.google.com/store/account/subscriptions",
    );
    assert.equal(
      blockedResult.data.manageSubscriptionUrls.ios,
      "https://apps.apple.com/account/subscriptions",
    );

    const blockedDeleteRequestSnap = await firestore
      .collection("_delete_requests")
      .doc(blockedUid)
      .get();
    assert.equal(blockedDeleteRequestSnap.exists, false);

    const allowedUid = "driver-delete-expired-1";
    await seedDriverIdentity({ driverUid: allowedUid, subscriptionStatus: "expired" });
    const allowedResult = await deleteUserData.run(callableRequest({}, authContext(allowedUid)));

    assert.equal(allowedResult.data.status, "scheduled");
    assert.equal(allowedResult.data.blockedBySubscription, false);
    assert.equal(allowedResult.data.dryRun, false);
    assert.equal(typeof allowedResult.data.hardDeleteAfter, "string");

    const allowedDeleteRequestSnap = await firestore
      .collection("_delete_requests")
      .doc(allowedUid)
      .get();
    assert.equal(allowedDeleteRequestSnap.exists, true);
    const allowedDeleteRequestData = allowedDeleteRequestSnap.data() ?? {};
    assert.equal(allowedDeleteRequestData.status, "pending");

    const allowedUserSnap = await firestore.collection("users").doc(allowedUid).get();
    const allowedUserData = allowedUserSnap.data() ?? {};
    assert.equal(typeof allowedUserData.deletedAt, "string");
  },
);

test("STEP-293 cleanupStaleData: due _delete_requests icin hard-delete uygular", async () => {
  const uid = "driver-delete-hard-1";
  const nowIso = new Date().toISOString();
  const dueIso = new Date(Date.now() - 60_000).toISOString();

  await firestore.collection("users").doc(uid).set({
    role: "driver",
    displayName: "Delete Candidate",
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: nowIso,
  });
  await firestore.collection("drivers").doc(uid).set({
    name: "Delete Candidate",
    phone: "+905550000001",
    plate: "34DEL34",
    showPhoneToPassengers: false,
    subscriptionStatus: "expired",
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: nowIso,
  });
  await firestore.collection("consents").doc(uid).set({
    privacyVersion: "v1",
    kvkkTextVersion: "v1",
    locationConsent: false,
    acceptedAt: nowIso,
    platform: "android",
    deleteRequestedAt: nowIso,
    updatedAt: nowIso,
  });
  await firestore.collection("_delete_requests").doc(uid).set({
    uid,
    role: "driver",
    requestedAt: nowIso,
    hardDeleteAfter: dueIso,
    status: "pending",
    updatedAt: nowIso,
  });

  await cleanupStaleData.run();

  const userSnap = await firestore.collection("users").doc(uid).get();
  const driverSnap = await firestore.collection("drivers").doc(uid).get();
  const consentSnap = await firestore.collection("consents").doc(uid).get();
  assert.equal(userSnap.exists, false);
  assert.equal(driverSnap.exists, false);
  assert.equal(consentSnap.exists, false);

  const deleteRequestSnap = await firestore.collection("_delete_requests").doc(uid).get();
  assert.equal(deleteRequestSnap.exists, true);
  const deleteRequestData = deleteRequestSnap.data() ?? {};
  assert.equal(deleteRequestData.status, "completed");
  assert.equal(typeof deleteRequestData.completedAt, "string");

  const auditSnap = await firestore
    .collection("_audit_privacy_events")
    .where("eventType", "==", "user_delete_completed")
    .limit(1)
    .get();
  assert.equal(auditSnap.empty, false);
  const auditData = auditSnap.docs[0]?.data();
  assert.equal(auditData?.uid, uid);
});
