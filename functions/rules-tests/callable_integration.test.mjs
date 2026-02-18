import assert from "node:assert/strict";
import test from "node:test";

import { getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "demo-neredeservis-functions-it";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: PROJECT_ID,
  databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com`,
});
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_DATABASE_EMULATOR_HOST ??= "127.0.0.1:9000";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

const { createGuestSession, finishTrip, getSubscriptionState, searchDriverDirectory, startTrip } =
  await import("../lib/index.js");

const firestore = getFirestore();
const database = getDatabase();

function callableRequest(data, auth) {
  return {
    data,
    auth,
    rawRequest: /** @type {any} */ ({}),
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

async function clearFirestoreEmulator() {
  const response = await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  assert.equal(response.status, 200);
}

async function clearRtdbEmulator() {
  const response = await fetch(
    `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}/.json?ns=${PROJECT_ID}-default-rtdb`,
    { method: "DELETE" },
  );
  assert.equal(response.status, 200);
}

async function seedDriverRoute({ driverUid, routeId, srvCode }) {
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
  assert.equal(rejected[0].reason?.code, "failed-precondition");

  const activeTripsSnap = await firestore
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .get();
  assert.equal(activeTripsSnap.size, 1);
});
