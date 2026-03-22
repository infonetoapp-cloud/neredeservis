import { randomBytes } from "node:crypto";

import { assertCompanyMembersExistAndActive } from "./company-access.js";
import {
  readCompanyDriverFromPostgres,
  readCompanyVehicleFromPostgres,
} from "./company-fleet-store.js";
import { syncCompanyRouteAndStopsFromFirestore } from "./company-route-postgres-sync.js";
import {
  deleteCompanyRouteFromPostgres,
  listCompanyRouteStopsFromPostgres,
  readCompanyRouteFromPostgres,
  releaseReservedCompanyRouteSrvCode,
  replaceCompanyRouteStopsForRoute,
  shouldUsePostgresCompanyRouteStore,
  syncCompanyRouteToPostgres,
  tryReserveCompanyRouteSrvCode,
} from "./company-route-store.js";
import { HttpError } from "./http.js";
import { writeRouteShareAuditEventToPostgres } from "./route-share-store.js";
import { asRecord, pickString } from "./runtime-value.js";

const ROUTE_TIME_SLOTS = new Set(["morning", "evening", "midday", "custom"]);
const SRV_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SRV_CODE_LENGTH = 6;
const SRV_CODE_COLLISION_MAX_RETRY = 5;
const ROUTE_AUDIT_COLLECTION = "_audit_route_events";

function pickStringArray(record, key) {
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function pickFiniteNumber(record, key) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRouteTimeSlot(value) {
  if (value === "morning" || value === "evening" || value === "midday" || value === "custom") {
    return value;
  }
  return null;
}

function buildRouteItem(routeId, companyId, routeData) {
  return {
    routeId,
    companyId,
    name: pickString(routeData, "name") ?? `Route (${routeId.slice(0, 6)})`,
    srvCode: pickString(routeData, "srvCode"),
    driverId: pickString(routeData, "driverId"),
    authorizedDriverIds: pickStringArray(routeData, "authorizedDriverIds"),
    scheduledTime: pickString(routeData, "scheduledTime"),
    timeSlot: readRouteTimeSlot(routeData.timeSlot),
    isArchived: routeData.isArchived === true,
    allowGuestTracking: routeData.allowGuestTracking === true,
    startAddress: pickString(routeData, "startAddress"),
    endAddress: pickString(routeData, "endAddress"),
    vehicleId: pickString(routeData, "vehicleId"),
    vehiclePlate: pickString(routeData, "vehiclePlate"),
    passengerCount: pickFiniteNumber(routeData, "passengerCount") ?? 0,
    updatedAt: pickString(routeData, "updatedAt"),
  };
}

function buildRouteStopItem(stopId, routeId, companyId, stopData) {
  return {
    stopId,
    routeId,
    companyId,
    name: pickString(stopData, "name") ?? `Stop (${stopId.slice(0, 6)})`,
    location: {
      lat: pickFiniteNumber(asRecord(stopData.location), "lat") ?? 0,
      lng: pickFiniteNumber(asRecord(stopData.location), "lng") ?? 0,
    },
    order: pickFiniteNumber(stopData, "order") ?? 0,
    createdAt: pickString(stopData, "createdAt"),
    updatedAt: pickString(stopData, "updatedAt"),
  };
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeId(rawValue, fieldLabel) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value || value.length > 128) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return value;
}

function normalizeOptionalId(rawValue, fieldLabel) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }

  return normalizeId(rawValue, fieldLabel);
}

function normalizeRequiredText(rawValue, fieldLabel, options = {}) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const value = rawValue.trim();
  const minLength = Number.isFinite(options.minLength) ? options.minLength : 1;
  const maxLength = Number.isFinite(options.maxLength) ? options.maxLength : 256;
  if (value.length < minLength || value.length > maxLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return value;
}

function parseIsoToMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeScheduledTime(rawValue, options = {}) {
  if (rawValue === undefined) {
    if (options.allowMissing === true) {
      return undefined;
    }
    throw new HttpError(400, "invalid-argument", "scheduledTime");
  }

  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "scheduledTime");
  }

  const value = rawValue.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new HttpError(400, "invalid-argument", "scheduledTime");
  }

  return value;
}

function normalizeRouteTimeSlot(rawValue, options = {}) {
  if (rawValue === undefined) {
    if (options.allowMissing === true) {
      return undefined;
    }
    throw new HttpError(400, "invalid-argument", "timeSlot");
  }

  if (!ROUTE_TIME_SLOTS.has(rawValue)) {
    throw new HttpError(400, "invalid-argument", "timeSlot");
  }

  return rawValue;
}

function normalizeBoolean(rawValue, fieldLabel, options = {}) {
  if (rawValue === undefined) {
    if (options.allowMissing === true) {
      return undefined;
    }
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  if (typeof rawValue !== "boolean") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return rawValue;
}

function normalizeLatLng(rawValue, fieldLabel) {
  const value = asRecord(rawValue);
  if (!value) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const lat = value.lat;
  const lng = value.lng;
  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    typeof lng !== "number" ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  return { lat, lng };
}

function normalizeAuthorizedDriverIds(rawValue, ownerUid, options = {}) {
  if (rawValue === undefined) {
    if (options.allowMissing === true) {
      return undefined;
    }
    return [];
  }

  if (!Array.isArray(rawValue)) {
    throw new HttpError(400, "invalid-argument", "authorizedDriverIds");
  }

  const uniqueIds = new Set();
  for (const item of rawValue) {
    if (typeof item !== "string") {
      throw new HttpError(400, "invalid-argument", "authorizedDriverIds");
    }

    const normalized = item.trim();
    if (!normalized || normalized.length > 128) {
      throw new HttpError(400, "invalid-argument", "authorizedDriverIds");
    }
    if (normalized === ownerUid) {
      continue;
    }

    uniqueIds.add(normalized);
  }

  return Array.from(uniqueIds.values());
}

function generateSrvCodeCandidate() {
  const bytes = randomBytes(SRV_CODE_LENGTH);
  let value = "";
  for (let index = 0; index < SRV_CODE_LENGTH; index += 1) {
    value += SRV_CODE_ALPHABET[bytes[index] % SRV_CODE_ALPHABET.length];
  }
  return value;
}

async function createRouteWithSrvCode(db, actorUid, nowIso, routeData) {
  for (let attempt = 1; attempt <= SRV_CODE_COLLISION_MAX_RETRY; attempt += 1) {
    const srvCode = generateSrvCodeCandidate();
    const routeId = db.collection("routes").doc().id;

    if (shouldUsePostgresCompanyRouteStore()) {
      const reserved = await tryReserveCompanyRouteSrvCode(srvCode, routeId, actorUid).catch(
        () => false,
      );
      if (!reserved) {
        continue;
      }

      try {
        await syncCompanyRouteToPostgres({
          routeId,
          ...routeData,
          srvCode,
          createdAt: routeData.createdAt ?? nowIso,
          updatedAt: routeData.updatedAt ?? nowIso,
        });
        await mirrorCreatedRouteToFirestore(db, routeId, srvCode, actorUid, nowIso, routeData);

        return {
          routeId,
          srvCode,
          srvCodeReservedInPostgres: true,
          createdInPostgres: true,
        };
      } catch (error) {
        await releaseReservedCompanyRouteSrvCode(srvCode, routeId).catch(() => false);
        throw error;
      }
    }

    const routeRef = db.collection("routes").doc(routeId);
    const srvCodeRef = db.collection("_srv_codes").doc(srvCode);

    try {
      await db.runTransaction(async (transaction) => {
        const srvCodeSnapshot = await transaction.get(srvCodeRef);
        if (srvCodeSnapshot.exists) {
          throw new HttpError(429, "resource-exhausted", "SRVCODE_COLLISION_LIMIT");
        }

        transaction.set(routeRef, {
          ...routeData,
          srvCode,
        });
        transaction.set(srvCodeRef, {
          routeId: routeRef.id,
          createdBy: actorUid,
          createdAt: nowIso,
        });
      });

      return {
        routeId: routeRef.id,
        srvCode,
      };
    } catch (error) {
      if (
        error instanceof HttpError &&
        error.message === "SRVCODE_COLLISION_LIMIT" &&
        attempt < SRV_CODE_COLLISION_MAX_RETRY
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new HttpError(429, "resource-exhausted", "SRVCODE_COLLISION_LIMIT");
}

async function assertPrimaryDriverValid(db, companyId, driverId) {
  if (!driverId) {
    return;
  }

  if (shouldUsePostgresCompanyRouteStore()) {
    const postgresDriver = await readCompanyDriverFromPostgres(companyId, driverId).catch(() => null);
    if (postgresDriver) {
      if (postgresDriver.status === "passive") {
        throw new HttpError(412, "failed-precondition", "Pasif sofor rotaya atanamaz.");
      }
      return;
    }
  }

  const driverSnapshot = await db.collection("drivers").doc(driverId).get();
  if (!driverSnapshot.exists) {
    throw new HttpError(404, "not-found", "Sofor bulunamadi.");
  }

  const driverData = asRecord(driverSnapshot.data()) ?? {};
  if (pickString(driverData, "companyId") !== companyId) {
    throw new HttpError(403, "permission-denied", "Sofor bu sirkete ait degil.");
  }
  if (pickString(driverData, "status") === "passive") {
    throw new HttpError(412, "failed-precondition", "Pasif sofor rotaya atanamaz.");
  }
}

function assertCompanyRoute(routeData, companyId) {
  const routeCompanyId = pickString(routeData, "companyId");
  if (!routeCompanyId || routeCompanyId !== companyId) {
    throw new HttpError(412, "failed-precondition", "ROUTE_TENANT_MISMATCH");
  }

  const visibility = pickString(routeData, "visibility");
  if (visibility && visibility !== "company") {
    throw new HttpError(412, "failed-precondition", "ROUTE_NOT_COMPANY_SCOPED");
  }
}

async function mirrorCreatedRouteToFirestore(db, routeId, srvCode, actorUid, nowIso, routeData) {
  if (!db?.batch) {
    return false;
  }

  try {
    const batch = db.batch();
    batch.set(
      db.collection("routes").doc(routeId),
      {
        ...routeData,
        srvCode,
      },
      { merge: true },
    );
    batch.set(
      db.collection("_srv_codes").doc(srvCode),
      {
        routeId,
        createdBy: actorUid,
        createdAt: nowIso,
      },
      { merge: true },
    );
    await batch.commit();
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_route_create_mirror_failed",
        routeId,
        srvCode,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorRoutePatchToFirestore(db, routeId, patchPayload) {
  if (!db?.collection) {
    return false;
  }

  try {
    await db.collection("routes").doc(routeId).set(patchPayload, { merge: true });
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_route_patch_mirror_failed",
        routeId,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorRouteStopUpsertToFirestore(db, routeId, stopId, stopData, routePatch) {
  if (!db?.batch) {
    return false;
  }

  try {
    const batch = db.batch();
    batch.set(db.collection("routes").doc(routeId), routePatch, { merge: true });
    batch.set(db.collection("routes").doc(routeId).collection("stops").doc(stopId), stopData, {
      merge: true,
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_route_stop_upsert_mirror_failed",
        routeId,
        stopId,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorRouteStopDeleteToFirestore(db, routeId, stopId, routePatch) {
  if (!db?.batch) {
    return false;
  }

  try {
    const batch = db.batch();
    batch.set(db.collection("routes").doc(routeId), routePatch, { merge: true });
    batch.delete(db.collection("routes").doc(routeId).collection("stops").doc(stopId));
    await batch.commit();
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_route_stop_delete_mirror_failed",
        routeId,
        stopId,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function mirrorRouteStopReorderToFirestore(db, routeId, stopUpdates, routePatch) {
  if (!db?.batch) {
    return false;
  }

  try {
    const batch = db.batch();
    batch.set(db.collection("routes").doc(routeId), routePatch, { merge: true });
    for (const stop of stopUpdates) {
      batch.set(
        db.collection("routes").doc(routeId).collection("stops").doc(stop.stopId),
        {
          order: stop.order,
          updatedAt: stop.updatedAt,
          updatedBy: stop.updatedBy,
        },
        { merge: true },
      );
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "firestore_route_stop_reorder_mirror_failed",
        routeId,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return false;
  }
}

async function deleteFirestoreRouteRefsBestEffort(db, refs, routeId) {
  if (!db?.batch) {
    return;
  }

  for (let index = 0; index < refs.length; index += 400) {
    const batch = db.batch();
    for (const ref of refs.slice(index, index + 400)) {
      batch.delete(ref);
    }
    try {
      await batch.commit();
    } catch (error) {
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "firestore_route_delete_mirror_failed",
          routeId,
          message: error instanceof Error ? error.message : "unknown_error",
        }),
      );
      return false;
    }
  }

  return true;
}

async function writeRouteAuditEventSafe(db, input) {
  try {
    if (shouldUsePostgresCompanyRouteStore()) {
      await writeRouteShareAuditEventToPostgres({
        companyId: input.companyId ?? input.metadata?.companyId ?? null,
        eventType: input.eventType,
        actorUid: input.actorUid ?? null,
        actorType: input.actorUid ? "authenticated" : "public",
        routeId: input.routeId ?? null,
        srvCode: input.srvCode ?? null,
        status: input.status ?? "success",
        reason: input.reason ?? null,
        requestIpHash: null,
        metadata: input.metadata ?? {},
        createdAt: new Date().toISOString(),
      });
      return;
    }

    await db.collection(ROUTE_AUDIT_COLLECTION).add({
      eventType: input.eventType,
      actorUid: input.actorUid ?? null,
      actorType: input.actorUid ? "authenticated" : "public",
      routeId: input.routeId ?? null,
      srvCode: input.srvCode ?? null,
      status: "success",
      reason: null,
      requestIpHash: null,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "route_audit_write_failed",
        eventType: input.eventType,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export async function createCompanyRoute(db, actorUid, actorRole, input) {
  const rawInput = asRecord(input);
  if (!rawInput) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const companyId = normalizeId(rawInput.companyId, "companyId");
  const name = normalizeRequiredText(rawInput.name, "Rota adi", { minLength: 2, maxLength: 80 });
  const driverId = normalizeOptionalId(rawInput.driverId, "driverId");
  const startPoint = normalizeLatLng(rawInput.startPoint, "startPoint");
  const startAddress = normalizeRequiredText(rawInput.startAddress, "Baslangic adresi", {
    minLength: 3,
    maxLength: 256,
  });
  const endPoint = normalizeLatLng(rawInput.endPoint, "endPoint");
  const endAddress = normalizeRequiredText(rawInput.endAddress, "Bitis adresi", {
    minLength: 3,
    maxLength: 256,
  });
  const scheduledTime = normalizeScheduledTime(rawInput.scheduledTime);
  const timeSlot = normalizeRouteTimeSlot(rawInput.timeSlot);
  const allowGuestTracking = normalizeBoolean(rawInput.allowGuestTracking, "allowGuestTracking");
  const authorizedDriverIds = normalizeAuthorizedDriverIds(rawInput.authorizedDriverIds, actorUid) ?? [];
  const nowIso = new Date().toISOString();

  await assertCompanyMembersExistAndActive(db, companyId, authorizedDriverIds);
  await assertPrimaryDriverValid(db, companyId, driverId);

  const memberIds = Array.from(new Set([actorUid, ...authorizedDriverIds]));
  const routeSeed = {
    name,
    driverId,
    authorizedDriverIds,
    memberIds,
    companyId,
    visibility: "company",
    allowGuestTracking,
    creationMode: "manual_pin",
    routePolyline: null,
    startPoint,
    startAddress,
    endPoint,
    endAddress,
    scheduledTime,
    timeSlot,
    isArchived: false,
    vacationUntil: null,
    passengerCount: 0,
    lastTripStartedNotificationAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: actorUid,
    updatedBy: actorUid,
    routeOwnerType: "company_member",
    routeOwnerRole: actorRole,
    vehicleId: null,
    vehiclePlate: null,
  };

  const created = await createRouteWithSrvCode(db, actorUid, nowIso, routeSeed);
  const route = buildRouteItem(created.routeId, companyId, {
    ...routeSeed,
    srvCode: created.srvCode,
  });

  if (shouldUsePostgresCompanyRouteStore()) {
    const syncSucceeded = created.createdInPostgres
      ? true
      : await syncCompanyRouteAndStopsFromFirestore(db, companyId, created.routeId, nowIso).catch(
          () => false,
        );
    if (syncSucceeded && created.srvCodeReservedInPostgres === true) {
      await releaseReservedCompanyRouteSrvCode(created.srvCode, created.routeId).catch(() => false);
    }
  }

  await writeRouteAuditEventSafe(db, {
    companyId,
    eventType: "route_created",
    actorUid,
    routeId: created.routeId,
    srvCode: created.srvCode,
    metadata: {
      companyId,
      role: actorRole,
      routeMutationScope: "company_route_create",
    },
  });

  return {
    routeId: created.routeId,
    srvCode: created.srvCode,
    route,
  };
}

export async function updateCompanyRoute(db, actorUid, actorRole, input) {
  const rawInput = asRecord(input);
  if (!rawInput) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const companyId = normalizeId(rawInput.companyId, "companyId");
  const routeId = normalizeId(rawInput.routeId, "routeId");
  const rawPatch = asRecord(rawInput.patch) ?? rawInput;
  const lastKnownUpdateToken =
    typeof rawInput.lastKnownUpdateToken === "string" && rawInput.lastKnownUpdateToken.trim().length > 0
      ? rawInput.lastKnownUpdateToken.trim()
      : undefined;

  let normalizedAuthorizedDriverIdsForPatch = null;
  if (hasOwn(rawPatch, "authorizedDriverIds")) {
    normalizedAuthorizedDriverIdsForPatch =
      normalizeAuthorizedDriverIds(rawPatch.authorizedDriverIds, actorUid, { allowMissing: true }) ?? [];
    await assertCompanyMembersExistAndActive(db, companyId, normalizedAuthorizedDriverIdsForPatch);
  }

  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const nowIso = new Date().toISOString();

  if (shouldUsePostgresCompanyRouteStore()) {
    const postgresRoute = await readCompanyRouteFromPostgres(companyId, routeId).catch(() => null);
    if (postgresRoute) {
      const currentUpdatedAt = pickString(postgresRoute, "updatedAt");
      if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
        throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
      }

      const patchPayload = {
        updatedAt: nowIso,
        updatedBy: actorUid,
      };
      const changedFields = [];

      if (hasOwn(rawPatch, "name")) {
        patchPayload.name = normalizeRequiredText(rawPatch.name, "Rota adi", {
          minLength: 2,
          maxLength: 80,
        });
        changedFields.push("name");
      }

      if (hasOwn(rawPatch, "scheduledTime")) {
        patchPayload.scheduledTime = normalizeScheduledTime(rawPatch.scheduledTime);
        changedFields.push("scheduledTime");
      }

      if (hasOwn(rawPatch, "timeSlot")) {
        patchPayload.timeSlot = normalizeRouteTimeSlot(rawPatch.timeSlot);
        changedFields.push("timeSlot");
      }

      if (hasOwn(rawPatch, "allowGuestTracking")) {
        patchPayload.allowGuestTracking = normalizeBoolean(
          rawPatch.allowGuestTracking,
          "allowGuestTracking",
        );
        changedFields.push("allowGuestTracking");
      }

      if (hasOwn(rawPatch, "isArchived")) {
        patchPayload.isArchived = normalizeBoolean(rawPatch.isArchived, "isArchived");
        changedFields.push("isArchived");
      }

      if (hasOwn(rawPatch, "vehicleId")) {
        const vehicleId = normalizeOptionalId(rawPatch.vehicleId, "vehicleId");
        if (vehicleId) {
          const postgresVehicle = await readCompanyVehicleFromPostgres(companyId, vehicleId).catch(
            () => null,
          );
          if (postgresVehicle) {
            patchPayload.vehicleId = vehicleId;
            patchPayload.vehiclePlate = postgresVehicle.plate;
          } else {
            const vehicleSnapshot = await companyRef.collection("vehicles").doc(vehicleId).get();
            if (!vehicleSnapshot.exists) {
              throw new HttpError(404, "not-found", "Arac bulunamadi.");
            }

            const vehicleData = asRecord(vehicleSnapshot.data()) ?? {};
            patchPayload.vehicleId = vehicleId;
            patchPayload.vehiclePlate = pickString(vehicleData, "plate");
          }
        } else {
          patchPayload.vehicleId = null;
          patchPayload.vehiclePlate = null;
        }
        changedFields.push("vehicleId");
      }

      if (hasOwn(rawPatch, "authorizedDriverIds")) {
        const nextAuthorizedDriverIds = normalizedAuthorizedDriverIdsForPatch ?? [];
        const existingAuthorized = pickStringArray(postgresRoute, "authorizedDriverIds");
        const existingMemberIds = pickStringArray(postgresRoute, "memberIds");
        const passengerMembers = existingMemberIds.filter(
          (memberUid) => memberUid !== actorUid && !existingAuthorized.includes(memberUid),
        );
        const nextMemberIds = Array.from(
          new Set([actorUid, ...nextAuthorizedDriverIds, ...passengerMembers]),
        );

        patchPayload.authorizedDriverIds = nextAuthorizedDriverIds;
        patchPayload.memberIds = nextMemberIds;
        changedFields.push("authorizedDriverIds");
      }

      if (changedFields.length === 0) {
        throw new HttpError(400, "invalid-argument", "En az bir gecerli patch alani gonderilmelidir.");
      }

      const nextRouteData = {
        ...postgresRoute,
        ...patchPayload,
        routeId,
        companyId,
      };
      await syncCompanyRouteToPostgres({
        ...nextRouteData,
        createdAt: postgresRoute.createdAt ?? nowIso,
        updatedAt: nowIso,
        stopsSyncedAt: postgresRoute.stopsSyncedAt ?? null,
      });
      await mirrorRoutePatchToFirestore(db, routeId, patchPayload);

      const updated = {
        routeId,
        updatedAt: nowIso,
        changedFields,
        srvCode: postgresRoute.srvCode,
        route: buildRouteItem(routeId, companyId, nextRouteData),
      };

      await writeRouteAuditEventSafe(db, {
        companyId,
        eventType: "route_updated",
        actorUid,
        routeId: updated.routeId,
        srvCode: updated.srvCode ?? null,
        metadata: {
          companyId,
          role: actorRole,
          changedFields: updated.changedFields,
          routeMutationScope: "company_summary_patch",
        },
      });

      return updated;
    }
  }

  const updated = await db.runTransaction(async (transaction) => {
    const [companySnapshot, routeSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(routeRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!routeSnapshot.exists) {
      throw new HttpError(404, "not-found", "Route bulunamadi.");
    }

    const routeData = asRecord(routeSnapshot.data()) ?? {};
    assertCompanyRoute(routeData, companyId);

    const currentUpdatedAt = pickString(routeData, "updatedAt");
    if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
      throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
    }

    const patchPayload = {
      updatedAt: nowIso,
      updatedBy: actorUid,
    };
    const changedFields = [];

    if (hasOwn(rawPatch, "name")) {
      patchPayload.name = normalizeRequiredText(rawPatch.name, "Rota adi", {
        minLength: 2,
        maxLength: 80,
      });
      changedFields.push("name");
    }

    if (hasOwn(rawPatch, "scheduledTime")) {
      patchPayload.scheduledTime = normalizeScheduledTime(rawPatch.scheduledTime);
      changedFields.push("scheduledTime");
    }

    if (hasOwn(rawPatch, "timeSlot")) {
      patchPayload.timeSlot = normalizeRouteTimeSlot(rawPatch.timeSlot);
      changedFields.push("timeSlot");
    }

    if (hasOwn(rawPatch, "allowGuestTracking")) {
      patchPayload.allowGuestTracking = normalizeBoolean(
        rawPatch.allowGuestTracking,
        "allowGuestTracking",
      );
      changedFields.push("allowGuestTracking");
    }

    if (hasOwn(rawPatch, "isArchived")) {
      patchPayload.isArchived = normalizeBoolean(rawPatch.isArchived, "isArchived");
      changedFields.push("isArchived");
    }

    if (hasOwn(rawPatch, "vehicleId")) {
      const vehicleId = normalizeOptionalId(rawPatch.vehicleId, "vehicleId");
      if (vehicleId) {
        const vehicleRef = companyRef.collection("vehicles").doc(vehicleId);
        const vehicleSnapshot = await transaction.get(vehicleRef);
        if (!vehicleSnapshot.exists) {
          throw new HttpError(404, "not-found", "Arac bulunamadi.");
        }

        const vehicleData = asRecord(vehicleSnapshot.data()) ?? {};
        patchPayload.vehicleId = vehicleId;
        patchPayload.vehiclePlate = pickString(vehicleData, "plate");
      } else {
        patchPayload.vehicleId = null;
        patchPayload.vehiclePlate = null;
      }
      changedFields.push("vehicleId");
    }

    if (hasOwn(rawPatch, "authorizedDriverIds")) {
      const nextAuthorizedDriverIds = normalizedAuthorizedDriverIdsForPatch ?? [];
      const existingAuthorized = pickStringArray(routeData, "authorizedDriverIds");
      const existingMemberIds = pickStringArray(routeData, "memberIds");
      const passengerMembers = existingMemberIds.filter(
        (memberUid) => memberUid !== actorUid && !existingAuthorized.includes(memberUid),
      );
      const nextMemberIds = Array.from(
        new Set([actorUid, ...nextAuthorizedDriverIds, ...passengerMembers]),
      );

      patchPayload.authorizedDriverIds = nextAuthorizedDriverIds;
      patchPayload.memberIds = nextMemberIds;
      changedFields.push("authorizedDriverIds");
    }

    if (changedFields.length === 0) {
      throw new HttpError(400, "invalid-argument", "En az bir gecerli patch alani gonderilmelidir.");
    }

    transaction.update(routeRef, patchPayload);

    const nextRouteData = {
      ...routeData,
      ...patchPayload,
    };
    return {
      routeId,
      updatedAt: nowIso,
      changedFields,
      srvCode: pickString(routeData, "srvCode"),
      route: buildRouteItem(routeId, companyId, nextRouteData),
    };
  });

  await writeRouteAuditEventSafe(db, {
    companyId,
    eventType: "route_updated",
    actorUid,
    routeId: updated.routeId,
    srvCode: updated.srvCode ?? null,
    metadata: {
      companyId,
      role: actorRole,
      changedFields: updated.changedFields,
      routeMutationScope: "company_summary_patch",
    },
  });

  if (shouldUsePostgresCompanyRouteStore()) {
    await syncCompanyRouteAndStopsFromFirestore(
      db,
      companyId,
      updated.routeId,
      updated.updatedAt ?? nowIso,
    ).catch(() => false);
  }

  return updated;
}

export async function deleteCompanyRoute(db, actorUid, actorRole, input) {
  const rawInput = asRecord(input);
  if (!rawInput) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const companyId = normalizeId(rawInput.companyId, "companyId");
  const routeId = normalizeId(rawInput.routeId, "routeId");
  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const postgresRoute = shouldUsePostgresCompanyRouteStore()
    ? await readCompanyRouteFromPostgres(companyId, routeId).catch(() => null)
    : null;
  const activeTripQuery = db
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .limit(1);
  const anyTripQuery = db.collection("trips").where("routeId", "==", routeId).limit(1);

  const [companySnapshot, routeSnapshot, activeTripSnapshot, anyTripSnapshot] = await Promise.all([
    companyRef.get(),
    routeRef.get(),
    activeTripQuery.get(),
    anyTripQuery.get(),
  ]);

  if (!postgresRoute && !companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Firma bulunamadi.");
  }
  if (!postgresRoute && !routeSnapshot.exists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }
  if (!activeTripSnapshot.empty) {
    throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
  }
  if (!anyTripSnapshot.empty) {
    throw new HttpError(412, "failed-precondition", "ROUTE_HAS_TRIP_HISTORY_DELETE_FORBIDDEN");
  }

  const routeData = postgresRoute ?? (asRecord(routeSnapshot.data()) ?? {});
  if (!postgresRoute) {
    assertCompanyRoute(routeData, companyId);
  }

  const [
    stopsSnapshot,
    passengersSnapshot,
    skipRequestsSnapshot,
    driverPermissionsSnapshot,
    announcementsSnapshot,
    guestSessionsSnapshot,
    conversationsSnapshot,
  ] = await Promise.all([
    routeRef.collection("stops").get(),
    routeRef.collection("passengers").get(),
    routeRef.collection("skip_requests").get(),
    routeRef.collection("driver_permissions").get(),
    db.collection("announcements").where("routeId", "==", routeId).get(),
    db.collection("guest_sessions").where("routeId", "==", routeId).get(),
    db.collection("trip_conversations").where("routeId", "==", routeId).get(),
  ]);

  const conversationMessageSnapshots = await Promise.all(
    conversationsSnapshot.docs.map((documentSnapshot) =>
      documentSnapshot.ref.collection("messages").get(),
    ),
  );

  const refsToDelete = [
    ...stopsSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ...passengersSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ...skipRequestsSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ...driverPermissionsSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ...announcementsSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ...guestSessionsSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ...conversationsSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ...conversationMessageSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    ),
    ...(pickString(routeData, "srvCode")
      ? [db.collection("_srv_codes").doc(pickString(routeData, "srvCode"))]
      : []),
    routeRef,
  ];

  if (postgresRoute) {
    await deleteCompanyRouteFromPostgres(companyId, routeId);
    await releaseReservedCompanyRouteSrvCode(pickString(routeData, "srvCode"), routeId).catch(
      () => false,
    );
    await deleteFirestoreRouteRefsBestEffort(db, refsToDelete, routeId);
  } else {
    for (let index = 0; index < refsToDelete.length; index += 400) {
      const batch = db.batch();
      for (const ref of refsToDelete.slice(index, index + 400)) {
        batch.delete(ref);
      }
      await batch.commit();
    }
  }

  await writeRouteAuditEventSafe(db, {
    companyId,
    eventType: "route_deleted",
    actorUid,
    routeId,
    srvCode: pickString(routeData, "srvCode"),
    metadata: {
      companyId,
      role: actorRole,
      routeMutationScope: "company_route_delete",
    },
  });

  if (shouldUsePostgresCompanyRouteStore() && !postgresRoute) {
    await deleteCompanyRouteFromPostgres(companyId, routeId).catch(() => false);
    await releaseReservedCompanyRouteSrvCode(pickString(routeData, "srvCode"), routeId).catch(
      () => false,
    );
  }

  return {
    routeId,
    deleted: true,
    deletedAt: new Date().toISOString(),
  };
}

export async function upsertCompanyRouteStop(db, actorUid, actorRole, input) {
  const rawInput = asRecord(input);
  if (!rawInput) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const companyId = normalizeId(rawInput.companyId, "companyId");
  const routeId = normalizeId(rawInput.routeId, "routeId");
  const stopId = normalizeOptionalId(rawInput.stopId, "stopId");
  const name = normalizeRequiredText(rawInput.name, "Durak adi", { minLength: 2, maxLength: 80 });
  const location = normalizeLatLng(rawInput.location, "location");
  const orderRaw =
    typeof rawInput.order === "string" ? Number.parseInt(rawInput.order.trim(), 10) : rawInput.order;
  if (!Number.isInteger(orderRaw) || orderRaw < 0) {
    throw new HttpError(400, "invalid-argument", "order");
  }
  const lastKnownUpdateToken =
    typeof rawInput.lastKnownUpdateToken === "string" && rawInput.lastKnownUpdateToken.trim().length > 0
      ? rawInput.lastKnownUpdateToken.trim()
      : undefined;
  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const nowIso = new Date().toISOString();
  const activeTripQuery = db
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .limit(1);

  if (shouldUsePostgresCompanyRouteStore()) {
    const [activeTripSnapshot, routeStopsState] = await Promise.all([
      activeTripQuery.get(),
      listCompanyRouteStopsFromPostgres(companyId, routeId).catch(() => null),
    ]);

    if (!activeTripSnapshot.empty) {
      throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
    }

    if (routeStopsState?.routeExists) {
      const routeData = routeStopsState.route ?? null;
      if (!routeData) {
        throw new HttpError(404, "not-found", "Route bulunamadi.");
      }

      const currentUpdatedAt = pickString(routeData, "updatedAt");
      if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
        throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
      }

      const existingStop = stopId
        ? routeStopsState.items.find((item) => item.stopId === stopId) ?? null
        : null;
      if (stopId && !existingStop) {
        throw new HttpError(404, "not-found", "Durak bulunamadi.");
      }

      const nextStopId =
        existingStop?.stopId ??
        stopId ??
        db.collection("routes").doc(routeId).collection("stops").doc().id;
      const stopData = {
        name,
        location,
        order: orderRaw,
        createdAt: existingStop?.createdAt ?? nowIso,
        updatedAt: nowIso,
        createdBy: existingStop?.createdBy ?? actorUid,
        updatedBy: actorUid,
      };
      const nextItems = stopId
        ? routeStopsState.items.map((item) =>
            item.stopId === nextStopId ? { ...item, ...stopData, stopId: nextStopId } : item,
          )
        : [...routeStopsState.items, { stopId: nextStopId, routeId, companyId, ...stopData }];

      await replaceCompanyRouteStopsForRoute(companyId, routeId, nextItems, nowIso);
      await mirrorRouteStopUpsertToFirestore(db, routeId, nextStopId, stopData, {
        updatedAt: nowIso,
        updatedBy: actorUid,
      });

      const updated = {
        companyId,
        routeId,
        stopId: nextStopId,
        updatedAt: nowIso,
        srvCode: pickString(routeData, "srvCode"),
        operation: existingStop ? "updated" : "created",
        stop: buildRouteStopItem(nextStopId, routeId, companyId, stopData),
      };

      await writeRouteAuditEventSafe(db, {
        companyId,
        eventType: "route_stop_upserted",
        actorUid,
        routeId: updated.routeId,
        srvCode: updated.srvCode ?? null,
        metadata: {
          companyId,
          role: actorRole,
          stopId: updated.stopId,
          stopOperation: updated.operation,
          routeMutationScope: "company_stop_upsert",
        },
      });

      return updated;
    }
  }

  const updated = await db.runTransaction(async (transaction) => {
    const [companySnapshot, routeSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(routeRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!routeSnapshot.exists) {
      throw new HttpError(404, "not-found", "Route bulunamadi.");
    }

    const routeData = asRecord(routeSnapshot.data()) ?? {};
    assertCompanyRoute(routeData, companyId);

    const currentUpdatedAt = pickString(routeData, "updatedAt");
    if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
      throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
    }

    const activeTripSnapshot = await transaction.get(activeTripQuery);
    if (!activeTripSnapshot.empty) {
      throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
    }

    const stopsRef = routeRef.collection("stops");
    const stopRef = stopId ? stopsRef.doc(stopId) : stopsRef.doc();
    const stopSnapshot = await transaction.get(stopRef);
    const existingStopData = asRecord(stopSnapshot.data()) ?? {};
    const createdAt = pickString(existingStopData, "createdAt") ?? nowIso;
    const createdBy = pickString(existingStopData, "createdBy") ?? actorUid;
    const stopData = {
      name,
      location,
      order: orderRaw,
      createdAt,
      updatedAt: nowIso,
      createdBy,
      updatedBy: actorUid,
    };

    transaction.set(stopRef, stopData, { merge: true });
    transaction.update(routeRef, {
      updatedAt: nowIso,
      updatedBy: actorUid,
    });

    return {
      companyId,
      routeId,
      stopId: stopRef.id,
      updatedAt: nowIso,
      srvCode: pickString(routeData, "srvCode"),
      operation: stopSnapshot.exists ? "updated" : "created",
      stop: buildRouteStopItem(stopRef.id, routeId, companyId, stopData),
    };
  });

  await writeRouteAuditEventSafe(db, {
    companyId,
    eventType: "route_stop_upserted",
    actorUid,
    routeId: updated.routeId,
    srvCode: updated.srvCode ?? null,
    metadata: {
      companyId,
      role: actorRole,
      stopId: updated.stopId,
      stopOperation: updated.operation,
      routeMutationScope: "company_stop_upsert",
    },
  });

  if (shouldUsePostgresCompanyRouteStore()) {
    await syncCompanyRouteAndStopsFromFirestore(
      db,
      companyId,
      updated.routeId,
      updated.updatedAt ?? nowIso,
    ).catch(() => false);
  }

  return updated;
}

export async function deleteCompanyRouteStop(db, actorUid, actorRole, input) {
  const rawInput = asRecord(input);
  if (!rawInput) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const companyId = normalizeId(rawInput.companyId, "companyId");
  const routeId = normalizeId(rawInput.routeId, "routeId");
  const stopId = normalizeId(rawInput.stopId, "stopId");
  const lastKnownUpdateToken =
    typeof rawInput.lastKnownUpdateToken === "string" && rawInput.lastKnownUpdateToken.trim().length > 0
      ? rawInput.lastKnownUpdateToken.trim()
      : undefined;
  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const stopRef = routeRef.collection("stops").doc(stopId);
  const nowIso = new Date().toISOString();
  const activeTripQuery = db
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .limit(1);

  if (shouldUsePostgresCompanyRouteStore()) {
    const [activeTripSnapshot, routeStopsState] = await Promise.all([
      activeTripQuery.get(),
      listCompanyRouteStopsFromPostgres(companyId, routeId).catch(() => null),
    ]);

    if (!activeTripSnapshot.empty) {
      throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
    }

    if (routeStopsState?.routeExists) {
      const routeData = routeStopsState.route ?? null;
      if (!routeData) {
        throw new HttpError(404, "not-found", "Route bulunamadi.");
      }

      const currentUpdatedAt = pickString(routeData, "updatedAt");
      if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
        throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
      }

      const existingStop = routeStopsState.items.find((item) => item.stopId === stopId) ?? null;
      if (!existingStop) {
        throw new HttpError(404, "not-found", "Durak bulunamadi.");
      }

      const nextItems = routeStopsState.items.filter((item) => item.stopId !== stopId);
      await replaceCompanyRouteStopsForRoute(companyId, routeId, nextItems, nowIso);
      await mirrorRouteStopDeleteToFirestore(db, routeId, stopId, {
        updatedAt: nowIso,
        updatedBy: actorUid,
      });

      const deleted = {
        routeId,
        stopId,
        srvCode: pickString(routeData, "srvCode"),
      };

      await writeRouteAuditEventSafe(db, {
        companyId,
        eventType: "route_stop_deleted",
        actorUid,
        routeId: deleted.routeId,
        srvCode: deleted.srvCode ?? null,
        metadata: {
          companyId,
          role: actorRole,
          stopId: deleted.stopId,
          routeMutationScope: "company_stop_delete",
        },
      });

      return {
        routeId: deleted.routeId,
        stopId: deleted.stopId,
        deleted: true,
      };
    }
  }

  const deleted = await db.runTransaction(async (transaction) => {
    const [companySnapshot, routeSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(routeRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!routeSnapshot.exists) {
      throw new HttpError(404, "not-found", "Route bulunamadi.");
    }

    const routeData = asRecord(routeSnapshot.data()) ?? {};
    assertCompanyRoute(routeData, companyId);

    const currentUpdatedAt = pickString(routeData, "updatedAt");
    if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
      throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
    }

    const activeTripSnapshot = await transaction.get(activeTripQuery);
    if (!activeTripSnapshot.empty) {
      throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
    }

    const stopSnapshot = await transaction.get(stopRef);
    if (!stopSnapshot.exists) {
      throw new HttpError(404, "not-found", "Durak bulunamadi.");
    }

    transaction.delete(stopRef);
    transaction.update(routeRef, {
      updatedAt: nowIso,
      updatedBy: actorUid,
    });

    return {
      routeId,
      stopId,
      srvCode: pickString(routeData, "srvCode"),
    };
  });

  await writeRouteAuditEventSafe(db, {
    companyId,
    eventType: "route_stop_deleted",
    actorUid,
    routeId: deleted.routeId,
    srvCode: deleted.srvCode ?? null,
    metadata: {
      companyId,
      role: actorRole,
      stopId: deleted.stopId,
      routeMutationScope: "company_stop_delete",
    },
  });

  if (shouldUsePostgresCompanyRouteStore()) {
    await syncCompanyRouteAndStopsFromFirestore(
      db,
      companyId,
      deleted.routeId,
      nowIso,
    ).catch(() => false);
  }

  return {
    routeId: deleted.routeId,
    stopId: deleted.stopId,
    deleted: true,
  };
}

export async function reorderCompanyRouteStops(db, actorUid, actorRole, input) {
  const rawInput = asRecord(input);
  if (!rawInput) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const companyId = normalizeId(rawInput.companyId, "companyId");
  const routeId = normalizeId(rawInput.routeId, "routeId");
  const stopId = normalizeId(rawInput.stopId, "stopId");
  const direction = rawInput.direction;
  if (direction !== "up" && direction !== "down") {
    throw new HttpError(400, "invalid-argument", "direction");
  }
  const lastKnownUpdateToken =
    typeof rawInput.lastKnownUpdateToken === "string" && rawInput.lastKnownUpdateToken.trim().length > 0
      ? rawInput.lastKnownUpdateToken.trim()
      : undefined;
  const companyRef = db.collection("companies").doc(companyId);
  const routeRef = db.collection("routes").doc(routeId);
  const stopsRef = routeRef.collection("stops");
  const targetStopRef = stopsRef.doc(stopId);
  const nowIso = new Date().toISOString();
  const activeTripQuery = db
    .collection("trips")
    .where("routeId", "==", routeId)
    .where("status", "==", "active")
    .limit(1);

  if (shouldUsePostgresCompanyRouteStore()) {
    const [activeTripSnapshot, routeStopsState] = await Promise.all([
      activeTripQuery.get(),
      listCompanyRouteStopsFromPostgres(companyId, routeId).catch(() => null),
    ]);

    if (!activeTripSnapshot.empty) {
      throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
    }

    if (routeStopsState?.routeExists) {
      const routeData = routeStopsState.route ?? null;
      if (!routeData) {
        throw new HttpError(404, "not-found", "Route bulunamadi.");
      }

      const currentUpdatedAt = pickString(routeData, "updatedAt");
      if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
        throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
      }

      const stopItems = [...routeStopsState.items].sort((left, right) => {
        if (left.order !== right.order) {
          return left.order - right.order;
        }
        return (parseIsoToMs(right.updatedAt) ?? 0) - (parseIsoToMs(left.updatedAt) ?? 0);
      });

      const currentIndex = stopItems.findIndex((item) => item.stopId === stopId);
      if (currentIndex < 0) {
        throw new HttpError(404, "not-found", "Durak bulunamadi.");
      }

      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= stopItems.length) {
        return {
          routeId,
          updatedAt: currentUpdatedAt ?? nowIso,
          changed: false,
        };
      }

      const currentItem = stopItems[currentIndex];
      const swapItem = stopItems[swapIndex];
      if (!currentItem || !swapItem) {
        throw new HttpError(500, "internal", "ROUTE_STOP_REORDER_STATE_INVALID");
      }

      const currentOrder = currentItem.order;
      const swapOrder = swapItem.order;
      currentItem.order = swapOrder;
      currentItem.updatedAt = nowIso;
      currentItem.updatedBy = actorUid;
      swapItem.order = currentOrder;
      swapItem.updatedAt = nowIso;
      swapItem.updatedBy = actorUid;

      await replaceCompanyRouteStopsForRoute(companyId, routeId, stopItems, nowIso);
      await mirrorRouteStopReorderToFirestore(
        db,
        routeId,
        [
          {
            stopId: currentItem.stopId,
            order: currentItem.order,
            updatedAt: nowIso,
            updatedBy: actorUid,
          },
          {
            stopId: swapItem.stopId,
            order: swapItem.order,
            updatedAt: nowIso,
            updatedBy: actorUid,
          },
        ],
        {
          updatedAt: nowIso,
          updatedBy: actorUid,
        },
      );

      await writeRouteAuditEventSafe(db, {
        companyId,
        eventType: "route_stops_reordered",
        actorUid,
        routeId,
        srvCode: pickString(routeData, "srvCode"),
        metadata: {
          companyId,
          role: actorRole,
          movedStopId: currentItem.stopId,
          swappedWithStopId: swapItem.stopId,
          direction,
          routeMutationScope: "company_stop_reorder",
        },
      });

      return {
        routeId,
        updatedAt: nowIso,
        changed: true,
      };
    }
  }

  const reordered = await db.runTransaction(async (transaction) => {
    const [companySnapshot, routeSnapshot] = await Promise.all([
      transaction.get(companyRef),
      transaction.get(routeRef),
    ]);
    if (!companySnapshot.exists) {
      throw new HttpError(404, "not-found", "Firma bulunamadi.");
    }
    if (!routeSnapshot.exists) {
      throw new HttpError(404, "not-found", "Route bulunamadi.");
    }

    const routeData = asRecord(routeSnapshot.data()) ?? {};
    assertCompanyRoute(routeData, companyId);

    const currentUpdatedAt = pickString(routeData, "updatedAt");
    if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
      throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
    }

    const activeTripSnapshot = await transaction.get(activeTripQuery);
    if (!activeTripSnapshot.empty) {
      throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
    }

    const [targetStopSnapshot, stopsSnapshot] = await Promise.all([
      transaction.get(targetStopRef),
      transaction.get(stopsRef),
    ]);
    if (!targetStopSnapshot.exists) {
      throw new HttpError(404, "not-found", "Durak bulunamadi.");
    }

    const stopItems = stopsSnapshot.docs
      .map((documentSnapshot) => {
        const stopData = asRecord(documentSnapshot.data()) ?? {};
        const order = pickFiniteNumber(stopData, "order");
        if (order == null) {
          return null;
        }

        return {
          ref: documentSnapshot.ref,
          id: documentSnapshot.id,
          order: Math.trunc(order),
          updatedAt: pickString(stopData, "updatedAt"),
        };
      })
      .filter((item) => item !== null)
      .sort((left, right) => {
        if (left.order !== right.order) {
          return left.order - right.order;
        }
        return (parseIsoToMs(right.updatedAt) ?? 0) - (parseIsoToMs(left.updatedAt) ?? 0);
      });

    const currentIndex = stopItems.findIndex((item) => item.id === stopId);
    if (currentIndex < 0) {
      throw new HttpError(412, "failed-precondition", "ROUTE_STOP_INVALID_STATE");
    }

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= stopItems.length) {
      return {
        routeId,
        updatedAt: currentUpdatedAt ?? nowIso,
        changed: false,
        movedStopId: stopId,
        swappedWithStopId: null,
        srvCode: pickString(routeData, "srvCode"),
      };
    }

    const currentItem = stopItems[currentIndex];
    const swapItem = stopItems[swapIndex];
    if (!currentItem || !swapItem) {
      throw new HttpError(500, "internal", "ROUTE_STOP_REORDER_STATE_INVALID");
    }

    transaction.update(currentItem.ref, {
      order: swapItem.order,
      updatedAt: nowIso,
      updatedBy: actorUid,
    });
    transaction.update(swapItem.ref, {
      order: currentItem.order,
      updatedAt: nowIso,
      updatedBy: actorUid,
    });
    transaction.update(routeRef, {
      updatedAt: nowIso,
      updatedBy: actorUid,
    });

    return {
      routeId,
      updatedAt: nowIso,
      changed: true,
      movedStopId: currentItem.id,
      swappedWithStopId: swapItem.id,
      srvCode: pickString(routeData, "srvCode"),
    };
  });

  if (reordered.changed) {
    await writeRouteAuditEventSafe(db, {
      companyId,
      eventType: "route_stops_reordered",
      actorUid,
      routeId: reordered.routeId,
      srvCode: reordered.srvCode ?? null,
      metadata: {
        companyId,
        role: actorRole,
        movedStopId: reordered.movedStopId,
        swappedWithStopId: reordered.swappedWithStopId,
        direction,
        routeMutationScope: "company_stop_reorder",
      },
    });
  }

  if (shouldUsePostgresCompanyRouteStore()) {
    await syncCompanyRouteAndStopsFromFirestore(
      db,
      companyId,
      reordered.routeId,
      reordered.updatedAt ?? nowIso,
    ).catch(() => false);
  }

  return {
    routeId: reordered.routeId,
    updatedAt: reordered.updatedAt,
    changed: reordered.changed,
  };
}
