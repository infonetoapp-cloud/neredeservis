import { getFirebaseAdminAuth } from "./firebase-admin.js";
import {
  findUserProfileByEmail,
  readUserProfileByUid,
  upsertAuthUserProfile,
} from "./auth-user-store.js";
import { HttpError } from "./http.js";
import { createManagedUserViaIdentityToolkit } from "./identity-toolkit.js";
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

async function buildPasswordResetLink(email) {
  const auth = getFirebaseAdminAuth();
  try {
    const rawFirebaseLink = await auth.generatePasswordResetLink(email, {
      url: `${readAppBaseUrl()}/login`,
    });
    try {
      const linkUrl = new URL(rawFirebaseLink);
      const oobCode = linkUrl.searchParams.get("oobCode") ?? "";
      if (oobCode) {
        return `${readAppBaseUrl()}/set-password?oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(email)}`;
      }
      return rawFirebaseLink;
    } catch {
      return rawFirebaseLink;
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "warn",
        event: "platform_password_reset_link_failed",
        email,
        message: error instanceof Error ? error.message : "unknown_error",
      }),
    );
    return "";
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

  const passwordResetLink = await buildPasswordResetLink(ownerEmail);
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

  return {
    companyId,
    ownerUid,
    ownerEmail,
    passwordResetLink,
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

  const loginLink = await buildPasswordResetLink(ownerEmail);
  if (!loginLink) {
    throw new HttpError(500, "internal", "Sifre sifirlama linki olusturulamadi.");
  }

  await sendPasswordSetupEmail(ownerEmail);
  return { loginLink };
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

  return {
    companyId,
    deletedAt: new Date().toISOString(),
  };
}
