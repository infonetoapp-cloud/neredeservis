import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { get, ref, set } from "firebase/database";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { buildLocationWritePayload, RULE_FIXTURE, seedRulesFixtures } from "./fixtures.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIRESTORE_RULES = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");
const RTDB_RULES = readFileSync(resolve(__dirname, "../../database.rules.json"), "utf8");
const PROJECT_ID = "demo-neredeservis-rules";

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { rules: FIRESTORE_RULES },
  database: { rules: RTDB_RULES },
});

test.after(async () => {
  await testEnv.cleanup();
});

test("STEP-076 driver non-member read testi: routes read 403", async () => {
  await seedRulesFixtures(testEnv);

  const context = testEnv.authenticatedContext(RULE_FIXTURE.nonMemberDriverUid);
  const firestore = context.firestore();

  await assertFails(getDoc(doc(firestore, "routes", RULE_FIXTURE.routeId)));
});

test("STEP-077 passenger non-member read testi: routes read 403", async () => {
  await seedRulesFixtures(testEnv);

  const context = testEnv.authenticatedContext(RULE_FIXTURE.nonMemberPassengerUid);
  const firestore = context.firestore();

  await assertFails(getDoc(doc(firestore, "routes", RULE_FIXTURE.routeId)));
});

test("STEP-078 guest expiry testi: suresi dolmus guest RTDB read edemez", async () => {
  await seedRulesFixtures(testEnv, { guestExpiresAtMs: Date.now() - 1_000 });

  const context = testEnv.authenticatedContext(RULE_FIXTURE.guestUid);
  const database = context.database();

  await assertFails(get(ref(database, `locations/${RULE_FIXTURE.routeId}`)));
});

test("STEP-079 direct write denial + stale routeWriter denial", async () => {
  await seedRulesFixtures(testEnv, { includeRouteWriter: false });

  const driverContext = testEnv.authenticatedContext(RULE_FIXTURE.memberDriverUid);
  const firestore = driverContext.firestore();

  await assertFails(
    setDoc(
      doc(firestore, "routes", RULE_FIXTURE.routeId),
      {
        title: "Mutasyon Denemesi",
      },
      { merge: true },
    ),
  );

  const staleWriterContext = testEnv.authenticatedContext(RULE_FIXTURE.activeWriterUid);
  const database = staleWriterContext.database();

  await assertFails(
    set(
      ref(database, `locations/${RULE_FIXTURE.routeId}`),
      buildLocationWritePayload(RULE_FIXTURE.activeWriterUid, Date.now()),
    ),
  );
});

test("STEP-079A driver_directory toplu read denemesi 403", async () => {
  await seedRulesFixtures(testEnv);

  const context = testEnv.authenticatedContext(RULE_FIXTURE.memberDriverUid);
  const firestore = context.firestore();

  await assertFails(getDocs(collection(firestore, "driver_directory")));
});

test("STEP-079B RTDB timestamp penceresi disi write deny", async () => {
  await seedRulesFixtures(testEnv, {
    includeRouteWriter: true,
    routeWriterUid: RULE_FIXTURE.activeWriterUid,
  });

  const context = testEnv.authenticatedContext(RULE_FIXTURE.activeWriterUid);
  const database = context.database();

  await assertFails(
    set(
      ref(database, `locations/${RULE_FIXTURE.routeId}`),
      buildLocationWritePayload(RULE_FIXTURE.activeWriterUid, Date.now() - 30_001),
    ),
  );

  await assertSucceeds(
    set(
      ref(database, `locations/${RULE_FIXTURE.routeId}`),
      buildLocationWritePayload(RULE_FIXTURE.activeWriterUid, Date.now()),
    ),
  );
});
