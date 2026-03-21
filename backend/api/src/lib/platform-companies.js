import {
  findUserProfileByEmail,
  readUserProfileByUid,
  upsertAuthUserProfile,
} from "./auth-user-store.js";
import {
  backfillCompanyFromFirestoreRecord,
  readCompanyFromPostgres,
  syncCompanyWithOwnerMembershipToPostgres,
} from "./company-membership-store.js";
import { HttpError } from "./http.js";
import { createManagedUserViaIdentityToolkit } from "./identity-toolkit.js";
import { getPostgresPool, isPostgresConfigured } from "./postgres.js";
import { asRecord, pickFiniteNumber, pickString } from "./runtime-value.js";

function assertCompanyStatus(value) {
  return value === "suspended" ? "suspended" : "active";
}

function normalizeCompanyId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyId zorunludur.");
  }
  const companyId = rawValue.trim();
  if (!companyId || companyId.length > 128) {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }
  return companyId;
}

function normalizeCompanyName(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyName zorunludur.");
  }
  const companyName = rawValue.trim();
  if (companyName.length < 2 || companyName.length > 120) {
    throw new HttpError(400, "invalid-argument", "companyName en az 2 karakter olmalidir.");
  }
  return companyName;
}

function normalizeOwnerEmail(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "ownerEmail zorunludur.");
  }
  const ownerEmail = rawValue.trim().toLowerCase();
  if (!ownerEmail || !ownerEmail.includes("@") || ownerEmail.length > 254) {
    throw new HttpError(400, "invalid-argument", "Gecerli bir ownerEmail girilmelidir.");
  }
  return ownerEmail;
}

function normalizeVehicleLimit(rawValue) {
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    throw new HttpError(400, "invalid-argument", "vehicleLimit sayisal olmalidir.");
  }
  const vehicleLimit = Math.trunc(rawValue);
  if (vehicleLimit < 0 || vehicleLimit > 9999) {
    throw new HttpError(400, "invalid-argument", "vehicleLimit gecersiz.");
  }
  return vehicleLimit;
}

function readAppBaseUrl() {
  return (process.env.APP_BASE_URL?.trim() || "https://app.neredeservis.app").replace(/\/+$/, "");
}

function generateBootstrapPassword() {
  return `Ns!${Math.floor(100000 + Math.random() * 900000)}`;
}

function buildOwnerLoginUrl() {
  return `${readAppBaseUrl()}/giris`;
}

async function sendPasswordSetupEmail(email) {
  const webApiKey = (process.env.APP_WEB_API_KEY ?? "").trim();
  if (!webApiKey) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "platform_password_setup_email_skipped",
        reason: "APP_WEB_API_KEY_MISSING",
      }),
    );
    return;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${webApiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    },
  ).catch(() => null);

  if (!response?.ok) {
    console.error(
      JSON.stringify({
        level: "warn",
        event: "platform_password_setup_email_failed",
        email,
        status: response?.status ?? null,
      }),
    );
  }
}

async function resolveCompanyOwnerIdentity(companyRef, companyData) {
  const ownerQuerySnapshot = await companyRef.collection("members").where("role", "==", "owner").limit(1).get();
  const ownerMemberSnapshot = ownerQuerySnapshot.docs[0] ?? null;
  if (!ownerMemberSnapshot) {
    return {
      ownerUid: null,
      ownerEmail: pickString(companyData, "contactEmail"),
    };
  }

  const ownerMemberData = asRecord(ownerMemberSnapshot.data()) ?? {};
  const ownerUid = ownerMemberSnapshot.id;
  const ownerAuthUser = await readUserProfileByUid(companyRef.firestore, ownerUid);
  return {
    ownerUid,
    ownerEmail:
      pickString(ownerMemberData, "email") ??
      ownerAuthUser?.email ??
      pickString(companyData, "contactEmail"),
  };
}

async function countQuery(query) {
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

function toCreatedAtIso(record) {
  return pickString(record, "createdAt") ?? new Date().toISOString();
}

function normalizeNullableText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeIsoString(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

async function listPlatformCompaniesFromPostgres() {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        c.company_id,
        c.name,
        c.status,
        c.vehicle_limit,
        c.created_at,
        owner.uid AS owner_uid,
        au.email AS owner_email,
        COUNT(DISTINCT cm.uid)::int AS member_count,
        COUNT(DISTINCT v.vehicle_id)::int AS vehicle_count,
        COUNT(DISTINCT r.route_id)::int AS route_count
      FROM companies c
      LEFT JOIN company_members owner
        ON owner.company_id = c.company_id
       AND owner.role = 'owner'
       AND owner.status = 'active'
      LEFT JOIN auth_users au ON au.uid = owner.uid
      LEFT JOIN company_members cm ON cm.company_id = c.company_id
      LEFT JOIN company_vehicles v ON v.company_id = c.company_id
      LEFT JOIN company_routes r ON r.company_id = c.company_id
      GROUP BY c.company_id, c.name, c.status, c.vehicle_limit, c.created_at, owner.uid, au.email
      ORDER BY c.created_at DESC, c.company_id ASC
    `,
  );

  return result.rows.map((row) => ({
    companyId: row.company_id,
    name: normalizeNullableText(row.name) ?? "(isimsiz)",
    status: assertCompanyStatus(normalizeNullableText(row.status)),
    ownerEmail: normalizeNullableText(row.owner_email),
    ownerUid: normalizeNullableText(row.owner_uid),
    vehicleLimit: pickFiniteNumber(row, "vehicle_limit") ?? 0,
    vehicleCount: pickFiniteNumber(row, "vehicle_count") ?? 0,
    memberCount: pickFiniteNumber(row, "member_count") ?? 0,
    routeCount: pickFiniteNumber(row, "route_count") ?? 0,
    createdAt: normalizeIsoString(row.created_at) ?? new Date().toISOString(),
  }));
}

async function getPlatformCompanyDetailFromPostgres(companyId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const company = await readCompanyFromPostgres(companyId);
  if (!company) {
    return null;
  }

  const [membersResult, vehiclesResult, routesResult] = await Promise.all([
    pool.query(
      `
        SELECT
          cm.uid,
          au.email,
          COALESCE(au.display_name, au.profile_data->>'name', au.email) AS display_name,
          cm.role,
          cm.status,
          COALESCE(cm.accepted_at, cm.created_at) AS joined_at
        FROM company_members cm
        LEFT JOIN auth_users au ON au.uid = cm.uid
        WHERE cm.company_id = $1
        ORDER BY COALESCE(cm.accepted_at, cm.created_at) ASC NULLS LAST, cm.uid ASC
      `,
      [companyId],
    ),
    pool.query(
      `
        SELECT
          vehicle_id,
          plate,
          brand,
          model,
          capacity,
          status
        FROM company_vehicles
        WHERE company_id = $1
        ORDER BY updated_at DESC, vehicle_id ASC
      `,
      [companyId],
    ),
    pool.query(
      `
        SELECT
          r.route_id,
          r.name,
          COALESCE(COUNT(s.stop_id), 0)::int AS stop_count,
          r.passenger_count,
          r.is_archived
        FROM company_routes r
        LEFT JOIN company_route_stops s ON s.route_id = r.route_id
        WHERE r.company_id = $1
        GROUP BY r.route_id, r.name, r.passenger_count, r.is_archived, r.updated_at
        ORDER BY r.updated_at DESC NULLS LAST, r.route_id ASC
      `,
      [companyId],
    ),
  ]);

  const members = membersResult.rows.map((row) => ({
    uid: row.uid,
    email: normalizeNullableText(row.email),
    displayName: normalizeNullableText(row.display_name),
    role: normalizeNullableText(row.role) ?? "member",
    status: normalizeNullableText(row.status) ?? "active",
    joinedAt: normalizeIsoString(row.joined_at) ?? new Date().toISOString(),
  }));

  const vehicles = vehiclesResult.rows.map((row) => ({
    vehicleId: row.vehicle_id,
    plate: normalizeNullableText(row.plate),
    brand: normalizeNullableText(row.brand),
    model: normalizeNullableText(row.model),
    capacity: pickFiniteNumber(row, "capacity"),
    status: normalizeNullableText(row.status) ?? "active",
  }));

  const routes = routesResult.rows.map((row) => ({
    routeId: row.route_id,
    name: normalizeNullableText(row.name) ?? "(isimsiz rota)",
    stopCount: pickFiniteNumber(row, "stop_count") ?? 0,
    passengerCount: pickFiniteNumber(row, "passenger_count") ?? 0,
    isArchived: row.is_archived === true,
  }));

  const ownerMember = members.find((member) => member.role === "owner") ?? null;
  return {
    companyId,
    name: company.name ?? "(isimsiz)",
    status: assertCompanyStatus(company.status),
    ownerEmail: ownerMember?.email ?? company.contactEmail ?? null,
    ownerUid: ownerMember?.uid ?? null,
    vehicleLimit: company.vehicleLimit ?? 0,
    createdAt: company.createdAt ?? new Date().toISOString(),
    members,
    vehicles,
    routes,
  };
}

async function deletePlatformCompanyFromPostgres(companyId) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM company_active_trips WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_audit_logs WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_invites WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_drivers WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_vehicles WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_members WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM company_routes WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM companies WHERE company_id = $1`, [companyId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function deleteDocumentRefs(db, documentRefs) {
  const batchSize = 400;
  for (let index = 0; index < documentRefs.length; index += batchSize) {
    const slice = documentRefs.slice(index, index + batchSize);
    const batch = db.batch();
    for (const ref of slice) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

async function deleteQueryByField(db, collectionName, fieldName, values) {
  const refs = [];
  for (const value of values) {
    const snapshot = await db.collection(collectionName).where(fieldName, "==", value).get();
    for (const documentSnapshot of snapshot.docs) {
      refs.push(documentSnapshot.ref);
    }
  }
  if (refs.length > 0) {
    await deleteDocumentRefs(db, refs);
  }
}

export async function listPlatformCompanies(db) {
  if (isPostgresConfigured()) {
    const items = await listPlatformCompaniesFromPostgres().catch(() => null);
    if (items) {
      return { items };
    }
  }

  const companiesSnapshot = await db.collection("companies").orderBy("createdAt", "desc").get();

  const items = await Promise.all(
    companiesSnapshot.docs.map(async (companySnapshot) => {
      const companyId = companySnapshot.id;
      const companyRef = db.collection("companies").doc(companyId);
      const companyData = asRecord(companySnapshot.data()) ?? {};
      const [memberCount, vehicleCount, routeCount, ownerIdentity] = await Promise.all([
        countQuery(companyRef.collection("members")),
        countQuery(companyRef.collection("vehicles")),
        countQuery(db.collection("routes").where("companyId", "==", companyId)),
        resolveCompanyOwnerIdentity(companyRef, companyData),
      ]);

      return {
        companyId,
        name: pickString(companyData, "name") ?? "(isimsiz)",
        status: assertCompanyStatus(pickString(companyData, "status")),
        ownerEmail: ownerIdentity.ownerEmail,
        ownerUid: ownerIdentity.ownerUid,
        vehicleLimit: pickFiniteNumber(companyData, "vehicleLimit") ?? 0,
        vehicleCount,
        memberCount,
        routeCount,
        createdAt: toCreatedAtIso(companyData),
      };
    }),
  );

  return { items };
}

export async function getPlatformCompanyDetail(db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  if (isPostgresConfigured()) {
    const detail = await getPlatformCompanyDetailFromPostgres(companyId).catch(() => null);
    if (detail) {
      return detail;
    }
  }

  const companyRef = db.collection("companies").doc(companyId);
  const [companySnapshot, membersSnapshot, vehiclesSnapshot, routesSnapshot] = await Promise.all([
    companyRef.get(),
    companyRef.collection("members").get(),
    companyRef.collection("vehicles").get(),
    db.collection("routes").where("companyId", "==", companyId).limit(100).get(),
  ]);

  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  const members = await Promise.all(
    membersSnapshot.docs.map(async (memberSnapshot) => {
      const memberData = asRecord(memberSnapshot.data()) ?? {};
      const authUser = await readUserProfileByUid(db, memberSnapshot.id);
      return {
        uid: memberSnapshot.id,
        email: pickString(memberData, "email") ?? authUser?.email ?? null,
        displayName: pickString(memberData, "displayName") ?? authUser?.displayName ?? null,
        role: pickString(memberData, "role") ?? "member",
        status: pickString(memberData, "status") ?? "active",
        joinedAt:
          pickString(memberData, "acceptedAt") ??
          pickString(memberData, "createdAt") ??
          new Date().toISOString(),
      };
    }),
  );

  const vehicles = vehiclesSnapshot.docs
    .map((vehicleSnapshot) => {
      const vehicleData = asRecord(vehicleSnapshot.data()) ?? {};
      const plate = pickString(vehicleData, "plate");
      if (!plate) {
        return null;
      }
      return {
        vehicleId: vehicleSnapshot.id,
        plate,
        brand: pickString(vehicleData, "brand"),
        model: pickString(vehicleData, "model"),
        capacity: pickFiniteNumber(vehicleData, "capacity"),
        status: pickString(vehicleData, "status") ?? "active",
      };
    })
    .filter((item) => item !== null);

  const routes = await Promise.all(
    routesSnapshot.docs.map(async (routeSnapshot) => {
      const routeData = asRecord(routeSnapshot.data()) ?? {};
      let stopCount = pickFiniteNumber(routeData, "stopCount");
      if (stopCount == null) {
        stopCount = await countQuery(routeSnapshot.ref.collection("stops"));
      }
      return {
        routeId: routeSnapshot.id,
        name: pickString(routeData, "name") ?? "(isimsiz rota)",
        stopCount: stopCount ?? 0,
        passengerCount: pickFiniteNumber(routeData, "passengerCount") ?? 0,
        isArchived: routeData.isArchived === true,
      };
    }),
  );

  const ownerMember = members.find((member) => member.role === "owner") ?? null;
  return {
    companyId,
    name: pickString(companyData, "name") ?? "(isimsiz)",
    status: assertCompanyStatus(pickString(companyData, "status")),
    ownerEmail: ownerMember?.email ?? pickString(companyData, "contactEmail"),
    ownerUid: ownerMember?.uid ?? null,
    vehicleLimit: pickFiniteNumber(companyData, "vehicleLimit") ?? 0,
    createdAt: toCreatedAtIso(companyData),
    members,
    vehicles,
    routes,
  };
}

export async function createPlatformCompany(db, actorUid, input) {
  const companyName = normalizeCompanyName(input?.companyName);
  const ownerEmail = normalizeOwnerEmail(input?.ownerEmail);
  const vehicleLimit = normalizeVehicleLimit(input?.vehicleLimit ?? 10);
  const nowIso = new Date().toISOString();

  let ownerUid = "";
  const existingOwnerProfile = await findUserProfileByEmail(db, ownerEmail).catch(() => null);
  if (existingOwnerProfile?.uid) {
    ownerUid = existingOwnerProfile.uid;
  } else {
    const createdUser = await createManagedUserViaIdentityToolkit({
      email: ownerEmail,
      password: generateBootstrapPassword(),
      sendVerificationEmail: false,
    });
    ownerUid = createdUser.localId;
    await upsertAuthUserProfile(db, {
      uid: ownerUid,
      email: ownerEmail,
      displayName: null,
      emailVerified: false,
      providerData: [{ providerId: "password" }],
      signInProvider: "password",
    });
  }

  let companyId = "";
  await db.runTransaction(async (transaction) => {
    const companyRef = db.collection("companies").doc();
    companyId = companyRef.id;
    const memberRef = companyRef.collection("members").doc(ownerUid);
    const userMembershipRef = db.collection("users").doc(ownerUid).collection("company_memberships").doc(companyId);

    transaction.set(companyRef, {
      name: companyName,
      legalName: null,
      status: "active",
      timezone: "Europe/Istanbul",
      countryCode: "TR",
      contactEmail: ownerEmail,
      contactPhone: null,
      vehicleLimit,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdByPlatform: actorUid,
    });

    transaction.set(memberRef, {
      companyId,
      uid: ownerUid,
      role: "owner",
      status: "active",
      email: ownerEmail,
      permissions: null,
      invitedBy: null,
      invitedAt: null,
      acceptedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    transaction.set(userMembershipRef, {
      companyId,
      role: "owner",
      status: "active",
      companyName,
      companyStatus: "active",
      joinedAt: nowIso,
      updatedAt: nowIso,
    });
  });

  await sendPasswordSetupEmail(ownerEmail);

  if (isPostgresConfigured()) {
    await syncCompanyWithOwnerMembershipToPostgres({
      companyId,
      uid: ownerUid,
      name: companyName,
      status: "active",
      billingStatus: "active",
      timezone: "Europe/Istanbul",
      countryCode: "TR",
      contactEmail: ownerEmail,
      contactPhone: null,
      vehicleLimit,
      createdAt: nowIso,
      updatedAt: nowIso,
    }).catch(() => false);
  }

  return {
    companyId,
    ownerUid,
    ownerEmail,
    notificationSent: true,
    loginUrl: buildOwnerLoginUrl(),
    createdAt: nowIso,
  };
}

export async function setPlatformCompanyVehicleLimit(db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const vehicleLimit = normalizeVehicleLimit(input?.vehicleLimit);
  const nowIso = new Date().toISOString();

  const companyRef = db.collection("companies").doc(companyId);
  const companySnapshot = await companyRef.get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  await companyRef.update({
    vehicleLimit,
    updatedAt: nowIso,
  });

  if (isPostgresConfigured()) {
    const companyData = asRecord(companySnapshot.data()) ?? {};
    await backfillCompanyFromFirestoreRecord({
      companyId,
      name: pickString(companyData, "name"),
      legalName: pickString(companyData, "legalName"),
      status: pickString(companyData, "status"),
      billingStatus: pickString(companyData, "billingStatus"),
      billingValidUntil: pickString(companyData, "billingValidUntil"),
      timezone: pickString(companyData, "timezone"),
      countryCode: pickString(companyData, "countryCode"),
      contactPhone: pickString(companyData, "contactPhone"),
      contactEmail: pickString(companyData, "contactEmail"),
      logoUrl: pickString(companyData, "logoUrl"),
      address: pickString(companyData, "address"),
      vehicleLimit,
      createdBy: pickString(companyData, "createdBy"),
      createdAt: pickString(companyData, "createdAt"),
      updatedAt: nowIso,
    }).catch(() => false);
  }

  return {
    companyId,
    vehicleLimit,
    updatedAt: nowIso,
  };
}

export async function setPlatformCompanyStatus(db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const rawStatus = pickString(asRecord(input) ?? {}, "status");
  if (rawStatus !== "active" && rawStatus !== "suspended") {
    throw new HttpError(400, "invalid-argument", "status active veya suspended olmalidir.");
  }

  const nowIso = new Date().toISOString();
  const companyRef = db.collection("companies").doc(companyId);
  const companySnapshot = await companyRef.get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  await companyRef.update({
    status: rawStatus,
    updatedAt: nowIso,
  });

  if (isPostgresConfigured()) {
    const companyData = asRecord(companySnapshot.data()) ?? {};
    await backfillCompanyFromFirestoreRecord({
      companyId,
      name: pickString(companyData, "name"),
      legalName: pickString(companyData, "legalName"),
      status: rawStatus,
      billingStatus: pickString(companyData, "billingStatus"),
      billingValidUntil: pickString(companyData, "billingValidUntil"),
      timezone: pickString(companyData, "timezone"),
      countryCode: pickString(companyData, "countryCode"),
      contactPhone: pickString(companyData, "contactPhone"),
      contactEmail: pickString(companyData, "contactEmail"),
      logoUrl: pickString(companyData, "logoUrl"),
      address: pickString(companyData, "address"),
      vehicleLimit: pickFiniteNumber(companyData, "vehicleLimit"),
      createdBy: pickString(companyData, "createdBy"),
      createdAt: pickString(companyData, "createdAt"),
      updatedAt: nowIso,
    }).catch(() => false);
  }

  return {
    companyId,
    status: rawStatus,
    updatedAt: nowIso,
  };
}

export async function resetPlatformCompanyOwnerPassword(db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const companyRef = db.collection("companies").doc(companyId);
  const companySnapshot = await companyRef.get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  const ownerIdentity = await resolveCompanyOwnerIdentity(companyRef, companyData);
  const ownerEmail = ownerIdentity.ownerEmail;
  if (!ownerEmail) {
    throw new HttpError(404, "not-found", "Sirket sahibinin e-postasi bulunamadi.");
  }

  await sendPasswordSetupEmail(ownerEmail);
  return {
    notificationSent: true,
    loginUrl: buildOwnerLoginUrl(),
  };
}

export async function deletePlatformCompany(db, rtdb, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const companyRef = db.collection("companies").doc(companyId);
  const companySnapshot = await companyRef.get();
  if (!companySnapshot.exists) {
    throw new HttpError(404, "not-found", "Sirket bulunamadi.");
  }

  const [membersSnapshot, routesSnapshot, auditLogsSnapshot] = await Promise.all([
    companyRef.collection("members").get(),
    db.collection("routes").where("companyId", "==", companyId).get(),
    db.collection("audit_logs").where("companyId", "==", companyId).get(),
  ]);
  const memberUids = membersSnapshot.docs.map((documentSnapshot) => documentSnapshot.id);
  const routeRefs = routesSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref);
  const routeIds = routesSnapshot.docs.map((documentSnapshot) => documentSnapshot.id);

  for (const routeRef of routeRefs) {
    await db.recursiveDelete(routeRef);
  }

  if (routeIds.length > 0) {
    await Promise.all([
      deleteQueryByField(db, "trips", "routeId", routeIds),
      deleteQueryByField(db, "_audit_route_events", "routeId", routeIds),
    ]);
  }

  if (!auditLogsSnapshot.empty) {
    await deleteDocumentRefs(
      db,
      auditLogsSnapshot.docs.map((documentSnapshot) => documentSnapshot.ref),
    );
  }

  await db.recursiveDelete(companyRef);

  if (memberUids.length > 0) {
    const membershipRefs = memberUids.map((uid) =>
      db.collection("users").doc(uid).collection("company_memberships").doc(companyId),
    );
    await deleteDocumentRefs(db, membershipRefs);
  }

  if (rtdb && routeIds.length > 0) {
    await Promise.all(
      routeIds.flatMap((routeId) => [
        rtdb.ref(`locations/${routeId}`).remove().catch(() => {}),
        rtdb.ref(`routeWriters/${routeId}`).remove().catch(() => {}),
        rtdb.ref(`guestReaders/${routeId}`).remove().catch(() => {}),
      ]),
    );
  }

  if (isPostgresConfigured()) {
    await deletePlatformCompanyFromPostgres(companyId).catch(() => false);
  }

  return {
    companyId,
    deletedAt: new Date().toISOString(),
  };
}
