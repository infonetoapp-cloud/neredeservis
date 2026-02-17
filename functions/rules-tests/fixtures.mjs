import { ref, set } from "firebase/database";
import { doc, setDoc } from "firebase/firestore";

export const RULE_FIXTURE = Object.freeze({
  routeId: "route-alpha",
  routeOwnerUid: "driver_owner",
  memberDriverUid: "driver_member",
  memberPassengerUid: "passenger_member",
  nonMemberDriverUid: "driver_non_member",
  nonMemberPassengerUid: "passenger_non_member",
  guestUid: "guest_user",
  activeWriterUid: "driver_writer",
});

function buildLiveLocation(driverUid, timestamp) {
  return {
    lat: 40.7702,
    lng: 29.9401,
    speed: 12.0,
    heading: 180.0,
    accuracy: 8.0,
    tripId: "trip-alpha",
    driverId: driverUid,
    timestamp,
  };
}

export async function seedRulesFixtures(testEnv, options = {}) {
  const {
    guestExpiresAtMs = Date.now() + 60_000,
    includeRouteWriter = true,
    routeWriterUid = RULE_FIXTURE.activeWriterUid,
  } = options;

  await testEnv.clearFirestore();
  await testEnv.clearDatabase();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    const database = context.database();

    await setDoc(doc(firestore, "routes", RULE_FIXTURE.routeId), {
      driverId: RULE_FIXTURE.routeOwnerUid,
      authorizedDriverIds: [RULE_FIXTURE.memberDriverUid],
      memberIds: [
        RULE_FIXTURE.routeOwnerUid,
        RULE_FIXTURE.memberDriverUid,
        RULE_FIXTURE.memberPassengerUid,
      ],
      srvCode: "SRV4821",
      title: "Darica Sabah",
    });

    await setDoc(doc(firestore, "routes", RULE_FIXTURE.routeId, "skip_requests", "skip-001"), {
      passengerId: RULE_FIXTURE.memberPassengerUid,
      dateKey: "2026-02-17",
      status: "active",
    });

    await setDoc(doc(firestore, "driver_directory", "dd-001"), {
      displayName: "A. Yildiz",
      plateMasked: "34 *** 4821",
      searchPhoneHash: "phonehash0001",
      searchPlateHash: "platehash0001",
      isActive: true,
    });

    await set(ref(database, `locations/${RULE_FIXTURE.routeId}`), buildLiveLocation(RULE_FIXTURE.routeOwnerUid, Date.now()));
    await set(ref(database, `routeReaders/${RULE_FIXTURE.routeId}/${RULE_FIXTURE.memberPassengerUid}`), true);
    await set(ref(database, `guestReaders/${RULE_FIXTURE.routeId}/${RULE_FIXTURE.guestUid}`), {
      active: true,
      expiresAtMs: guestExpiresAtMs,
    });

    if (includeRouteWriter) {
      await set(ref(database, `routeWriters/${RULE_FIXTURE.routeId}/${routeWriterUid}`), true);
    }
  });
}

export function buildLocationWritePayload(driverUid, timestamp) {
  return buildLiveLocation(driverUid, timestamp);
}
