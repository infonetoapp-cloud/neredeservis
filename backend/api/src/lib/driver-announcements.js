import { readUserProfileByUid } from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { generateRouteShareLink } from "./route-share-preview.js";
import {
  shouldUsePostgresRouteAnnouncementStore,
  upsertRouteAnnouncementToPostgres,
} from "./route-announcement-store.js";
import {
  readRouteShareContextFromPostgresByRouteId,
  shouldUsePostgresRouteShareStore,
} from "./route-share-store.js";
import { asRecord, pickString, pickStringArray } from "./runtime-value.js";

function normalizeRouteId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "routeId gecersiz.");
  }

  const routeId = rawValue.trim();
  if (!routeId) {
    throw new HttpError(400, "invalid-argument", "routeId gecersiz.");
  }

  return routeId;
}

function normalizeTemplateKey(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "templateKey gecersiz.");
  }

  const templateKey = rawValue.trim();
  if (!templateKey) {
    throw new HttpError(400, "invalid-argument", "templateKey gecersiz.");
  }

  return templateKey;
}

function normalizeIdempotencyKey(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "idempotencyKey gecersiz.");
  }

  const idempotencyKey = rawValue.trim();
  if (!idempotencyKey) {
    throw new HttpError(400, "invalid-argument", "idempotencyKey gecersiz.");
  }

  return idempotencyKey;
}

function normalizeCustomText(rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "customText gecersiz.");
  }

  const customText = rawValue.trim();
  if (!customText) {
    return null;
  }
  if (customText.length > 500) {
    throw new HttpError(400, "invalid-argument", "customText maksimum 500 karakter olabilir.");
  }

  return customText;
}

function buildAnnouncementId(routeId, uid, idempotencyKey) {
  return `${routeId}_${uid}_${idempotencyKey}`;
}

async function readRouteAccessContext(db, routeId) {
  if (shouldUsePostgresRouteShareStore()) {
    const postgresRoute = await readRouteShareContextFromPostgresByRouteId(routeId).catch(() => null);
    if (postgresRoute) {
      return postgresRoute;
    }
  }

  if (!db || typeof db.collection !== "function") {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  const routeSnapshot = await db.collection("routes").doc(routeId).get().catch(() => null);
  if (!routeSnapshot?.exists) {
    throw new HttpError(404, "not-found", "Route bulunamadi.");
  }

  return asRecord(routeSnapshot.data()) ?? {};
}

function assertDriverAnnouncementAccess(routeData, uid) {
  if (routeData?.isArchived === true) {
    throw new HttpError(412, "failed-precondition", "Arsivlenmis route icin duyuru gonderilemez.");
  }

  const routeOwnerUid = pickString(routeData, "driverId");
  const authorizedDriverIds = pickStringArray(routeData, "authorizedDriverIds");
  if (routeOwnerUid === uid || authorizedDriverIds.includes(uid)) {
    return;
  }

  throw new HttpError(403, "permission-denied", "Duyuru gonderme yetkiniz yok.");
}

function assertPremiumDriverProfile(profile) {
  const role = pickString(profile, "role");
  if (role !== "driver") {
    throw new HttpError(403, "permission-denied", "Duyuru gonderme yetkiniz yok.");
  }

  const driverProfile = asRecord(profile?.driverProfile) ?? {};
  const subscriptionStatus = pickString(driverProfile, "subscriptionStatus") ?? "none";
  if (subscriptionStatus !== "active" && subscriptionStatus !== "trial") {
    throw new HttpError(
      403,
      "permission-denied",
      `premium entitlement required (subscriptionStatus=${subscriptionStatus})`,
    );
  }
}

async function bestEffortMirrorAnnouncement(db, input) {
  if (!db || typeof db.collection !== "function") {
    return false;
  }

  await db
    .collection("announcements")
    .doc(input.announcementId)
    .set(
      {
        routeId: input.routeId,
        driverId: input.driverId,
        templateKey: input.templateKey,
        customText: input.customText ?? null,
        channels: ["fcm", "whatsapp_link"],
        shareUrl: input.shareUrl,
        idempotencyKey: input.idempotencyKey,
        createdAt: input.createdAt,
      },
      { merge: true },
    )
    .catch(() => null);

  return true;
}

export async function sendDriverAnnouncement(db, uid, rawInput) {
  const input = asRecord(rawInput) ?? {};
  const routeId = normalizeRouteId(input.routeId);
  const templateKey = normalizeTemplateKey(input.templateKey);
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  const customText = normalizeCustomText(input.customText);

  const profile = (await readUserProfileByUid(db, uid)) ?? {};
  assertPremiumDriverProfile(profile);

  const routeData = await readRouteAccessContext(db, routeId);
  assertDriverAnnouncementAccess(routeData, uid);

  const shareLink = await generateRouteShareLink(db, uid, {
    routeId,
    customText,
  });
  const shareUrl =
    pickString(shareLink, "signedLandingUrl") ??
    pickString(shareLink, "landingUrl") ??
    null;
  if (!shareUrl) {
    throw new HttpError(412, "failed-precondition", "Route paylasim baglantisi olusturulamadi.");
  }

  const announcementId = buildAnnouncementId(routeId, uid, idempotencyKey);
  const createdAt = new Date().toISOString();
  const companyId = pickString(routeData, "companyId");
  if (shouldUsePostgresRouteAnnouncementStore()) {
    await upsertRouteAnnouncementToPostgres({
      announcementId,
      routeId,
      companyId,
      driverId: uid,
      templateKey,
      customText,
      channels: ["fcm", "whatsapp_link"],
      shareUrl,
      idempotencyKey,
      createdAt,
      updatedAt: createdAt,
    }).catch(() => null);
  }
  await bestEffortMirrorAnnouncement(db, {
    announcementId,
    routeId,
    companyId,
    driverId: uid,
    templateKey,
    customText,
    shareUrl,
    idempotencyKey,
    createdAt,
  });

  return {
    announcementId,
    fcmCount: 0,
    shareUrl,
  };
}
