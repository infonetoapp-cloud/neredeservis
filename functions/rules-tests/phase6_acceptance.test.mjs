import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RTDB_RULES = readFileSync(resolve(__dirname, "../../database.rules.json"), "utf8");

const PROJECT_ID = "demo-neredeservis-phase6-acceptance";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: PROJECT_ID,
  databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com`,
});
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_DATABASE_EMULATOR_HOST ??= "127.0.0.1:9000";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

const {
  createCompany,
  createVehicle,
  createCompanyRoute,
  updateCompanyRoute,
  upsertCompanyRouteStop,
  deleteCompanyRouteStop,
  reorderCompanyRouteStops,
  listCompanyRoutes,
  listCompanyRouteStops,
  listActiveTripsByCompany,
  listCompanyAuditLogs,
} = await import("../lib/index.js");

const firestore = getFirestore();
const database = getDatabase();

function callableRequest(data, auth) {
  return { data, auth, rawRequest: {} };
}

function authContext(uid, provider = "password") {
  return {
    uid,
    token: { firebase: { sign_in_provider: provider } },
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

async function seedOwnerUser(uid, email = "owner.phase6@example.com") {
  const nowIso = new Date().toISOString();
  await firestore.collection("users").doc(uid).set({
    uid,
    email,
    displayName: "Phase6 Owner",
    role: "driver",
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
  });
  await firestore.collection("drivers").doc(uid).set({
    name: "Phase6 Owner",
    phone: "+905550000000",
    plate: "34P6OWN34",
    showPhoneToPassengers: true,
    subscriptionStatus: "active",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

function assertFailedPrecondition(error, expectedReason) {
  const code = error?.code;
  const message = String(error?.message ?? "");
  const isFailedPrecondition = code === "failed-precondition" || code === 9 || code === 3;
  assert.equal(isFailedPrecondition, true);
  assert.equal(message.includes(expectedReason), true);
}

test.beforeEach(async () => {
  await clearFirestoreEmulator();
  await clearRtdbEmulator();
});

test.after(async () => {
  await Promise.all(getApps().map(async (app) => app.delete()));
});

test("PHASE6-ACC-01 route/stop CRUD + soft-lock + archive acceptance", async () => {
  const ownerUid = "phase6-owner-route";
  await seedOwnerUser(ownerUid, "route.owner@example.com");

  const createCompanyResult = await createCompany.run(
    callableRequest(
      {
        name: "Phase6 Route Ops Co",
        contactEmail: "ops@example.com",
      },
      authContext(ownerUid),
    ),
  );
  const companyId = createCompanyResult.data.companyId;
  assert.equal(typeof companyId, "string");
  assert.equal(companyId.length > 0, true);

  const routeCreateResult = await createCompanyRoute.run(
    callableRequest(
      {
        companyId,
        name: "Sabah Servisi",
        startPoint: { lat: 41.015, lng: 28.979 },
        startAddress: "Mecidiyekoy",
        endPoint: { lat: 41.008, lng: 28.978 },
        endAddress: "Karakoy",
        scheduledTime: "08:30",
        timeSlot: "morning",
        allowGuestTracking: true,
      },
      authContext(ownerUid),
    ),
  );
  const routeId = routeCreateResult.data.routeId;
  assert.equal(typeof routeId, "string");
  assert.equal(routeId.length > 0, true);

  const listRoutesResult = await listCompanyRoutes.run(
    callableRequest({ companyId, includeArchived: false, limit: 50 }, authContext(ownerUid)),
  );
  assert.equal(listRoutesResult.data.items.some((item) => item.routeId === routeId), true);

  const updateRouteResult = await updateCompanyRoute.run(
    callableRequest(
      {
        companyId,
        routeId,
        patch: { name: "Sabah Servisi Guncel" },
      },
      authContext(ownerUid),
    ),
  );
  assert.equal(updateRouteResult.data.routeId, routeId);

  const stop1 = await upsertCompanyRouteStop.run(
    callableRequest(
      {
        companyId,
        routeId,
        name: "Durak A",
        location: { lat: 41.016, lng: 28.98 },
        order: 0,
      },
      authContext(ownerUid),
    ),
  );
  const stop2 = await upsertCompanyRouteStop.run(
    callableRequest(
      {
        companyId,
        routeId,
        name: "Durak B",
        location: { lat: 41.017, lng: 28.981 },
        order: 1,
      },
      authContext(ownerUid),
    ),
  );

  const listStopsResult = await listCompanyRouteStops.run(
    callableRequest({ companyId, routeId }, authContext(ownerUid)),
  );
  assert.equal(listStopsResult.data.items.length, 2);

  const reorderResult = await reorderCompanyRouteStops.run(
    callableRequest(
      {
        companyId,
        routeId,
        stopId: stop2.data.stopId,
        direction: "up",
      },
      authContext(ownerUid),
    ),
  );
  assert.equal(reorderResult.data.changed, true);

  const deleteResult = await deleteCompanyRouteStop.run(
    callableRequest(
      {
        companyId,
        routeId,
        stopId: stop1.data.stopId,
      },
      authContext(ownerUid),
    ),
  );
  assert.equal(deleteResult.data.deleted, true);

  const nowIso = new Date().toISOString();
  await firestore.collection("trips").doc("phase6-active-trip-soft-lock").set({
    routeId,
    driverId: ownerUid,
    status: "active",
    startedAt: nowIso,
    endedAt: null,
    lastLocationAt: nowIso,
    transitionVersion: 1,
    updatedAt: nowIso,
    driverSnapshot: {
      name: "Phase6 Owner",
      plate: "34P6OWN34",
    },
  });

  await assert.rejects(
    async () =>
      upsertCompanyRouteStop.run(
        callableRequest(
          {
            companyId,
            routeId,
            name: "Durak Soft Lock",
            location: { lat: 41.018, lng: 28.982 },
            order: 1,
          },
          authContext(ownerUid),
        ),
      ),
    (error) => {
      assertFailedPrecondition(error, "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
      return true;
    },
  );

  await firestore.collection("trips").doc("phase6-active-trip-soft-lock").set({ status: "finished" }, { merge: true });
  await updateCompanyRoute.run(
    callableRequest(
      {
        companyId,
        routeId,
        patch: { isArchived: true },
      },
      authContext(ownerUid),
    ),
  );

  const activeListAfterArchive = await listCompanyRoutes.run(
    callableRequest({ companyId, includeArchived: false, limit: 50 }, authContext(ownerUid)),
  );
  assert.equal(activeListAfterArchive.data.items.some((item) => item.routeId === routeId), false);

  const archivedList = await listCompanyRoutes.run(
    callableRequest({ companyId, includeArchived: true, limit: 50 }, authContext(ownerUid)),
  );
  const archivedRoute = archivedList.data.items.find((item) => item.routeId === routeId);
  assert.equal(Boolean(archivedRoute), true);
  assert.equal(archivedRoute?.isArchived, true);
});

test("PHASE6-ACC-02 live ops active trips + RTDB source acceptance", async () => {
  const ownerUid = "phase6-owner-live";
  await seedOwnerUser(ownerUid, "live.owner@example.com");

  const companyResult = await createCompany.run(
    callableRequest({ name: "Phase6 Live Ops Co" }, authContext(ownerUid)),
  );
  const companyId = companyResult.data.companyId;

  const routeResult = await createCompanyRoute.run(
    callableRequest(
      {
        companyId,
        name: "Aksam Servisi",
        startPoint: { lat: 41.02, lng: 28.99 },
        startAddress: "Levent",
        endPoint: { lat: 41.01, lng: 28.97 },
        endAddress: "Besiktas",
        scheduledTime: "18:00",
        timeSlot: "evening",
        allowGuestTracking: true,
      },
      authContext(ownerUid),
    ),
  );
  const routeId = routeResult.data.routeId;
  const tripId = "phase6-live-trip-1";
  const nowIso = new Date().toISOString();

  await firestore.collection("trips").doc(tripId).set({
    routeId,
    driverId: ownerUid,
    status: "active",
    startedAt: nowIso,
    endedAt: null,
    lastLocationAt: nowIso,
    transitionVersion: 1,
    updatedAt: nowIso,
    driverSnapshot: {
      name: "Phase6 Owner",
      plate: "34P6OWN34",
    },
  });

  await database.ref(`locations/${routeId}`).set({
    tripId,
    lat: 41.019,
    lng: 28.991,
    recordedAt: nowIso,
  });

  const liveResult = await listActiveTripsByCompany.run(
    callableRequest({ companyId, pageSize: 20 }, authContext(ownerUid)),
  );

  assert.equal(liveResult.data.items.length >= 1, true);
  const trip = liveResult.data.items.find((item) => item.tripId === tripId);
  assert.equal(Boolean(trip), true);
  assert.equal(trip?.routeId, routeId);
  assert.equal(trip?.live.source, "rtdb");
  assert.equal(typeof trip?.driverName, "string");
});

test("PHASE6-ACC-03 audit listing acceptance after critical mutations", async () => {
  const ownerUid = "phase6-owner-audit";
  await seedOwnerUser(ownerUid, "audit.owner@example.com");

  const companyResult = await createCompany.run(
    callableRequest({ name: "Phase6 Audit Co" }, authContext(ownerUid)),
  );
  const companyId = companyResult.data.companyId;

  await createVehicle.run(
    callableRequest(
      {
        companyId,
        ownerType: "company",
        plate: "34P6AUD34",
        brand: "Ford",
        model: "Transit",
        status: "active",
      },
      authContext(ownerUid),
    ),
  );

  const auditResult = await listCompanyAuditLogs.run(
    callableRequest({ companyId }, authContext(ownerUid)),
  );

  assert.equal(auditResult.data.items.length >= 2, true);
  const eventTypes = new Set(auditResult.data.items.map((item) => item.eventType));
  assert.equal(eventTypes.has("company_created"), true);
  assert.equal(eventTypes.has("vehicle_created"), true);
});
