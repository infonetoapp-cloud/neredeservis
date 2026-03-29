import { randomBytes, randomUUID } from "node:crypto";

import { assertCompanyMembersExistAndActive } from "./company-access.js";
import { listCompanyActiveTripsFromPostgres } from "./company-active-trip-store.js";
import {
  readCompanyDriverFromPostgres,
  readCompanyVehicleFromPostgres,
} from "./company-fleet-store.js";
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
import { getPostgresPool } from "./postgres.js";
import { writeRouteShareAuditEventToPostgres } from "./route-share-store.js";
import { asRecord, pickString } from "./runtime-value.js";

const ROUTE_TIME_SLOTS = new Set(["morning", "evening", "midday", "custom"]);
const SRV_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SRV_CODE_LENGTH = 6;
const SRV_CODE_COLLISION_MAX_RETRY = 5;

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

function requireCompanyRouteStore() {
  if (!shouldUsePostgresCompanyRouteStore()) {
    throw new HttpError(412, "failed-precondition", "Rota depolamasi hazir degil.");
  }
}

async function createRouteWithSrvCode(actorUid, nowIso, routeData) {
  requireCompanyRouteStore();

  for (let attempt = 1; attempt <= SRV_CODE_COLLISION_MAX_RETRY; attempt += 1) {
    const srvCode = generateSrvCodeCandidate();
    const routeId = randomUUID();
    const reserved = await tryReserveCompanyRouteSrvCode(srvCode, routeId, actorUid).catch(() => false);
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

      return {
        routeId,
        srvCode,
      };
    } catch (error) {
      await releaseReservedCompanyRouteSrvCode(srvCode, routeId).catch(() => false);
      throw error;
    }
  }

  throw new HttpError(429, "resource-exhausted", "SRVCODE_COLLISION_LIMIT");
}

async function assertPrimaryDriverValid(companyId, driverId) {
  if (!driverId) {
    return;
  }

  const driver = await readCompanyDriverFromPostgres(companyId, driverId).catch(() => null);
  if (!driver) {
    throw new HttpError(404, "not-found", "Sofor bulunamadi.");
  }
  if (driver.status === "passive") {
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

async function assertNoActiveRouteTrips(companyId, routeId) {
  const activeTrips = await listCompanyActiveTripsFromPostgres(companyId, { routeId, limit: 1 }).catch(
    () => [],
  );
  if (Array.isArray(activeTrips) && activeTrips.length > 0) {
    throw new HttpError(412, "failed-precondition", "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED");
  }
}

async function assertNoRouteTripHistory(routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return;
  }

  const result = await pool.query(
    `
      SELECT 1
      FROM company_trip_history
      WHERE route_id = $1
      LIMIT 1
    `,
    [routeId],
  );
  if (result.rowCount > 0) {
    throw new HttpError(412, "failed-precondition", "ROUTE_HAS_TRIP_HISTORY_DELETE_FORBIDDEN");
  }
}

async function deleteRouteScopedRecords(companyId, routeId) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  await Promise.all([
    pool.query(`DELETE FROM company_route_driver_permissions WHERE company_id = $1 AND route_id = $2`, [companyId, routeId]),
    pool.query(`DELETE FROM route_announcements WHERE company_id = $1 AND route_id = $2`, [companyId, routeId]),
    pool.query(`DELETE FROM trip_chat_messages WHERE company_id = $1 AND route_id = $2`, [companyId, routeId]),
    pool.query(`DELETE FROM trip_chats WHERE company_id = $1 AND route_id = $2`, [companyId, routeId]),
    pool.query(`DELETE FROM company_route_stops WHERE company_id = $1 AND route_id = $2`, [companyId, routeId]),
  ]).catch(() => null);

  return true;
}

async function writeRouteAuditEventSafe(_db, input) {
  try {
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
  requireCompanyRouteStore();

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
  await assertPrimaryDriverValid(companyId, driverId);

  const memberIds = Array.from(
    new Set([actorUid, ...(driverId ? [driverId] : []), ...authorizedDriverIds]),
  );
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

  const created = await createRouteWithSrvCode(actorUid, nowIso, routeSeed);
  const route = buildRouteItem(created.routeId, companyId, {
    ...routeSeed,
    srvCode: created.srvCode,
  });

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
  requireCompanyRouteStore();

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

  const nowIso = new Date().toISOString();
  const route = await readCompanyRouteFromPostgres(companyId, routeId).catch(() => null);
  if (!route) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const currentUpdatedAt = pickString(route, "updatedAt");
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
    patchPayload.allowGuestTracking = normalizeBoolean(rawPatch.allowGuestTracking, "allowGuestTracking");
    changedFields.push("allowGuestTracking");
  }

  if (hasOwn(rawPatch, "isArchived")) {
    patchPayload.isArchived = normalizeBoolean(rawPatch.isArchived, "isArchived");
    changedFields.push("isArchived");
  }

  if (hasOwn(rawPatch, "vehicleId")) {
    const vehicleId = normalizeOptionalId(rawPatch.vehicleId, "vehicleId");
    if (vehicleId) {
      const vehicle = await readCompanyVehicleFromPostgres(companyId, vehicleId).catch(() => null);
      if (!vehicle) {
        throw new HttpError(404, "not-found", "Arac bulunamadi.");
      }
      patchPayload.vehicleId = vehicleId;
      patchPayload.vehiclePlate = vehicle.plate;
    } else {
      patchPayload.vehicleId = null;
      patchPayload.vehiclePlate = null;
    }
    changedFields.push("vehicleId");
  }

  if (hasOwn(rawPatch, "authorizedDriverIds")) {
    const nextAuthorizedDriverIds = normalizedAuthorizedDriverIdsForPatch ?? [];
    const existingAuthorized = pickStringArray(route, "authorizedDriverIds");
    const existingMemberIds = pickStringArray(route, "memberIds");
    const primaryDriverId = pickString(route, "driverId");
    const passengerMembers = existingMemberIds.filter(
      (memberUid) =>
        memberUid !== actorUid &&
        memberUid !== primaryDriverId &&
        !existingAuthorized.includes(memberUid),
    );
    const nextMemberIds = Array.from(
      new Set([
        actorUid,
        ...(primaryDriverId ? [primaryDriverId] : []),
        ...nextAuthorizedDriverIds,
        ...passengerMembers,
      ]),
    );

    patchPayload.authorizedDriverIds = nextAuthorizedDriverIds;
    patchPayload.memberIds = nextMemberIds;
    changedFields.push("authorizedDriverIds");
  }

  if (changedFields.length === 0) {
    throw new HttpError(400, "invalid-argument", "En az bir gecerli patch alani gonderilmelidir.");
  }

  const nextRouteData = {
    ...route,
    ...patchPayload,
    routeId,
    companyId,
  };
  await syncCompanyRouteToPostgres({
    ...nextRouteData,
    createdAt: route.createdAt ?? nowIso,
    updatedAt: nowIso,
    stopsSyncedAt: route.stopsSyncedAt ?? null,
  });

  const updated = {
    routeId,
    updatedAt: nowIso,
    changedFields,
    srvCode: route.srvCode,
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

export async function deleteCompanyRoute(db, actorUid, actorRole, input) {
  requireCompanyRouteStore();

  const rawInput = asRecord(input);
  if (!rawInput) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir JSON govdesi bekleniyor.");
  }

  const companyId = normalizeId(rawInput.companyId, "companyId");
  const routeId = normalizeId(rawInput.routeId, "routeId");
  const route = await readCompanyRouteFromPostgres(companyId, routeId).catch(() => null);
  if (!route) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  await assertNoActiveRouteTrips(companyId, routeId);
  await assertNoRouteTripHistory(routeId);
  await deleteRouteScopedRecords(companyId, routeId);
  await deleteCompanyRouteFromPostgres(companyId, routeId);
  await releaseReservedCompanyRouteSrvCode(pickString(route, "srvCode"), routeId).catch(() => false);

  await writeRouteAuditEventSafe(db, {
    companyId,
    eventType: "route_deleted",
    actorUid,
    routeId,
    srvCode: pickString(route, "srvCode"),
    metadata: {
      companyId,
      role: actorRole,
      routeMutationScope: "company_route_delete",
    },
  });

  return {
    routeId,
    deleted: true,
    deletedAt: new Date().toISOString(),
  };
}

export async function upsertCompanyRouteStop(db, actorUid, actorRole, input) {
  requireCompanyRouteStore();

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
  const nowIso = new Date().toISOString();

  await assertNoActiveRouteTrips(companyId, routeId);
  const routeStopsState = await listCompanyRouteStopsFromPostgres(companyId, routeId).catch(() => null);
  if (!routeStopsState?.routeExists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const routeData = routeStopsState.route ?? null;
  if (!routeData) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const currentUpdatedAt = pickString(routeData, "updatedAt");
  if (lastKnownUpdateToken && currentUpdatedAt && currentUpdatedAt !== lastKnownUpdateToken) {
    throw new HttpError(412, "failed-precondition", "UPDATE_TOKEN_MISMATCH");
  }

  const existingStop = stopId ? routeStopsState.items.find((item) => item.stopId === stopId) ?? null : null;
  if (stopId && !existingStop) {
    throw new HttpError(404, "not-found", "Durak bulunamadi.");
  }

  const nextStopId = existingStop?.stopId ?? stopId ?? randomUUID();
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

export async function deleteCompanyRouteStop(db, actorUid, actorRole, input) {
  requireCompanyRouteStore();

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
  const nowIso = new Date().toISOString();

  await assertNoActiveRouteTrips(companyId, routeId);
  const routeStopsState = await listCompanyRouteStopsFromPostgres(companyId, routeId).catch(() => null);
  if (!routeStopsState?.routeExists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

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

  await writeRouteAuditEventSafe(db, {
    companyId,
    eventType: "route_stop_deleted",
    actorUid,
    routeId,
    srvCode: pickString(routeData, "srvCode"),
    metadata: {
      companyId,
      role: actorRole,
      stopId,
      routeMutationScope: "company_stop_delete",
    },
  });

  return {
    routeId,
    stopId,
    deleted: true,
  };
}

export async function reorderCompanyRouteStops(db, actorUid, actorRole, input) {
  requireCompanyRouteStore();

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
  const nowIso = new Date().toISOString();

  await assertNoActiveRouteTrips(companyId, routeId);
  const routeStopsState = await listCompanyRouteStopsFromPostgres(companyId, routeId).catch(() => null);
  if (!routeStopsState?.routeExists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

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
