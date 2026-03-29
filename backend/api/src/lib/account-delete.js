import { readUserProfileByUid, upsertAuthUserProfile } from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { asRecord, pickString } from "./runtime-value.js";

function requireUid(subject) {
  if (typeof subject === "string" && subject.trim().length > 0) {
    return subject.trim();
  }

  if (
    subject &&
    typeof subject === "object" &&
    !Array.isArray(subject) &&
    typeof subject.uid === "string" &&
    subject.uid.trim().length > 0
  ) {
    return subject.uid.trim();
  }

  throw new HttpError(400, "invalid-argument", "Kullanici kimligi gecersiz.");
}

function readDeleteConfig() {
  return {
    graceDays: Number.parseInt(process.env.ACCOUNT_DELETE_GRACE_DAYS ?? "7", 10) || 7,
    interceptorMessage:
      (process.env.DELETE_INTERCEPTOR_MESSAGE ?? "").trim() || "Aktif abonelik bitmeden hesap silinemez.",
    manageSubscriptionLabel:
      (process.env.MANAGE_SUBSCRIPTION_LABEL ?? "").trim() || "Aboneligi yonet",
    iosManageSubscriptionUrl: (process.env.IOS_MANAGE_SUBSCRIPTION_URL ?? "").trim() || null,
    androidManageSubscriptionUrl:
      (process.env.ANDROID_MANAGE_SUBSCRIPTION_URL ?? "").trim() || null,
  };
}

async function upsertDeleteRequest(record) {
  if (!isPostgresConfigured()) {
    return false;
  }

  const pool = getPostgresPool();
  await pool.query(
    `
      INSERT INTO delete_requests (
        uid,
        role,
        requested_at,
        hard_delete_after,
        status,
        dry_run,
        subscription_status_at_request,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3::timestamptz,
        $4::timestamptz,
        $5,
        $6,
        $7,
        $8::timestamptz
      )
      ON CONFLICT (uid) DO UPDATE
      SET
        role = EXCLUDED.role,
        requested_at = EXCLUDED.requested_at,
        hard_delete_after = EXCLUDED.hard_delete_after,
        status = EXCLUDED.status,
        dry_run = EXCLUDED.dry_run,
        subscription_status_at_request = EXCLUDED.subscription_status_at_request,
        updated_at = EXCLUDED.updated_at
    `,
    [
      record.uid,
      record.role,
      record.requestedAt,
      record.hardDeleteAfter,
      record.status,
      record.dryRun,
      record.subscriptionStatusAtRequest,
      record.updatedAt,
    ],
  );
  return true;
}

async function bestEffortMirrorDeleteState(db, record) {
  if (isPostgresConfigured() || !db || typeof db.collection !== "function") {
    return;
  }

  await db
    .collection("_delete_requests")
    .doc(record.uid)
    .set(
      {
        uid: record.uid,
        role: record.role,
        requestedAt: record.requestedAt,
        hardDeleteAfter: record.hardDeleteAfter,
        status: record.status,
        dryRun: record.dryRun,
        subscriptionStatusAtRequest: record.subscriptionStatusAtRequest,
        updatedAt: record.updatedAt,
      },
      { merge: true },
    )
    .catch(() => null);

  await db
    .collection("users")
    .doc(record.uid)
    .set(
      {
        deletedAt: record.requestedAt,
        updatedAt: record.updatedAt,
        displayName: "Silinen Kullanici",
        phone: null,
      },
      { merge: true },
    )
    .catch(() => null);

  await db
    .collection("consents")
    .doc(record.uid)
    .set(
      {
        deleteRequestedAt: record.requestedAt,
        updatedAt: record.updatedAt,
      },
      { merge: true },
    )
    .catch(() => null);

  if (record.role === "driver") {
    await db
      .collection("drivers")
      .doc(record.uid)
      .set(
        {
          deletedAt: record.requestedAt,
          updatedAt: record.updatedAt,
          activeDeviceId: null,
          activeDeviceToken: null,
          phone: null,
        },
        { merge: true },
      )
      .catch(() => null);
  }
}

export async function scheduleCurrentAuthAccountDeletion(db, subject, rawInput) {
  const uid = requireUid(subject);
  const input = asRecord(rawInput) ?? {};
  const dryRun = input.dryRun === true;
  const now = new Date();
  const nowIso = now.toISOString();
  const config = readDeleteConfig();
  const hardDeleteAfterIso = new Date(
    now.getTime() + config.graceDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const profile = (await readUserProfileByUid(db, uid)) ?? { uid };
  const role = pickString(profile, "role") ?? "guest";
  const driverProfile = asRecord(profile?.driverProfile) ?? {};
  const subscriptionStatus = pickString(driverProfile, "subscriptionStatus");

  if (
    role === "driver" &&
    (subscriptionStatus === "active" || subscriptionStatus === "trial")
  ) {
    return {
      uid,
      status: "blocked_subscription",
      blockedBySubscription: true,
      dryRun,
      interceptorMessage: config.interceptorMessage,
      manageSubscriptionLabel: config.manageSubscriptionLabel,
      manageSubscriptionUrls: {
        ios: config.iosManageSubscriptionUrl,
        android: config.androidManageSubscriptionUrl,
      },
      requestedAt: null,
      hardDeleteAfter: null,
    };
  }

  if (!dryRun) {
    const nextDriverProfile =
      role === "driver"
        ? {
            ...driverProfile,
            phone: null,
            activeDeviceId: null,
            activeDeviceToken: null,
            deletedAt: nowIso,
            updatedAt: nowIso,
          }
        : undefined;

    await upsertAuthUserProfile(db, profile, {
      displayName: "Silinen Kullanici",
      phone: null,
      updatedAt: nowIso,
      deletedAt: nowIso,
      ...(nextDriverProfile ? { driverProfile: nextDriverProfile } : {}),
    });

    const deleteRequestRecord = {
      uid,
      role,
      requestedAt: nowIso,
      hardDeleteAfter: hardDeleteAfterIso,
      status: "pending",
      dryRun: false,
      subscriptionStatusAtRequest: subscriptionStatus ?? "none",
      updatedAt: nowIso,
    };
    await upsertDeleteRequest(deleteRequestRecord);
    await bestEffortMirrorDeleteState(db, deleteRequestRecord);
  }

  return {
    uid,
    status: "scheduled",
    blockedBySubscription: false,
    dryRun,
    interceptorMessage: null,
    manageSubscriptionLabel: null,
    manageSubscriptionUrls: null,
    requestedAt: nowIso,
    hardDeleteAfter: hardDeleteAfterIso,
  };
}
