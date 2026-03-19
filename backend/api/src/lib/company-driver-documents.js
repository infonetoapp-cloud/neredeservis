import { HttpError } from "./http.js";
import { asRecord, pickString } from "./runtime-value.js";

const ALL_DOC_TYPES = ["ehliyet", "src", "psikoteknik", "saglik"];
const EXPIRY_WARNING_DAYS = 30;

function normalizeCompanyId(rawValue) {
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  const companyId = rawValue.trim();
  if (!companyId || companyId.length > 128) {
    throw new HttpError(400, "invalid-argument", "companyId gecersiz.");
  }

  return companyId;
}

function normalizeDriverId(rawValue, opts = {}) {
  if (rawValue === undefined && opts.optional) {
    return undefined;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", "driverId gecersiz.");
  }

  const driverId = rawValue.trim();
  if (!driverId || driverId.length > 128) {
    throw new HttpError(400, "invalid-argument", "driverId gecersiz.");
  }

  return driverId;
}

function normalizeDocType(rawValue) {
  if (ALL_DOC_TYPES.includes(rawValue ?? "")) {
    return rawValue;
  }
  throw new HttpError(400, "invalid-argument", "docType gecersiz.");
}

function normalizeOptionalDate(rawValue, fieldLabel) {
  if (rawValue === undefined) {
    return undefined;
  }
  if (rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  return value;
}

function normalizeOptionalText(rawValue, fieldLabel, maxLength = 240) {
  if (rawValue === undefined) {
    return undefined;
  }
  if (rawValue === null) {
    return null;
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} gecersiz.`);
  }

  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  if (value.length > maxLength) {
    throw new HttpError(400, "invalid-argument", `${fieldLabel} maksimum ${maxLength} karakter.`);
  }

  return value;
}

function computeDocStatus(expiryDate) {
  if (!expiryDate) {
    return { status: "valid", daysRemaining: null };
  }

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return { status: "valid", daysRemaining: null };
  }

  const diffMs = expiry.getTime() - Date.now();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) {
    return { status: "expired", daysRemaining };
  }
  if (daysRemaining <= EXPIRY_WARNING_DAYS) {
    return { status: "expiring_soon", daysRemaining };
  }
  return { status: "valid", daysRemaining };
}

function computeOverallStatus(documents) {
  const uploaded = documents.filter((documentItem) => documentItem.status !== "not_uploaded");
  if (uploaded.length === 0) {
    return "missing";
  }
  if (documents.some((documentItem) => documentItem.status === "expired")) {
    return "blocked";
  }
  if (
    documents.some(
      (documentItem) =>
        documentItem.status === "expiring_soon" || documentItem.status === "not_uploaded",
    )
  ) {
    return "warning";
  }
  return "ok";
}

function docCollectionPath(companyId) {
  return `companies/${companyId}/driver_documents`;
}

function docId(driverId, docType) {
  return `${driverId}_${docType}`;
}

async function requireDriverBelongsToCompany(db, companyId, driverId) {
  const driverSnapshot = await db.collection("drivers").doc(driverId).get();
  if (!driverSnapshot.exists) {
    throw new HttpError(404, "not-found", "Sofor bulunamadi.");
  }

  const driverData = asRecord(driverSnapshot.data()) ?? {};
  if (pickString(driverData, "companyId") !== companyId) {
    throw new HttpError(403, "permission-denied", "Sofor bu sirkete ait degil.");
  }

  return driverData;
}

export async function listDriverDocuments(db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const filterDriverId = normalizeDriverId(input?.driverId, { optional: true });

  const driverNames = new Map();
  let driverIds = [];
  if (filterDriverId) {
    const driverData = await requireDriverBelongsToCompany(db, companyId, filterDriverId);
    driverNames.set(filterDriverId, pickString(driverData, "name") ?? "Isimsiz");
    driverIds = [filterDriverId];
  } else {
    const driversSnapshot = await db.collection("drivers").where("companyId", "==", companyId).get();
    driverIds = driversSnapshot.docs.map((documentSnapshot) => documentSnapshot.id);
    for (const documentSnapshot of driversSnapshot.docs) {
      const driverData = asRecord(documentSnapshot.data()) ?? {};
      driverNames.set(documentSnapshot.id, pickString(driverData, "name") ?? "Isimsiz");
    }
  }

  const documentsSnapshot = await db.collection(docCollectionPath(companyId)).get();
  const documentsByDriverId = new Map();
  for (const documentSnapshot of documentsSnapshot.docs) {
    const documentData = asRecord(documentSnapshot.data()) ?? {};
    const driverId = pickString(documentData, "driverId");
    const docType = pickString(documentData, "docType");
    if (!driverId || !ALL_DOC_TYPES.includes(docType ?? "")) {
      continue;
    }

    if (!documentsByDriverId.has(driverId)) {
      documentsByDriverId.set(driverId, new Map());
    }
    documentsByDriverId.get(driverId).set(docType, documentData);
  }

  const items = driverIds.map((driverId) => {
    const documentsForDriver = documentsByDriverId.get(driverId) ?? new Map();
    const documents = ALL_DOC_TYPES.map((docType) => {
      const documentData = documentsForDriver.get(docType);
      if (!documentData) {
        return {
          driverId,
          docType,
          issueDate: null,
          expiryDate: null,
          licenseClass: null,
          note: null,
          status: "not_uploaded",
          daysRemaining: null,
          uploadedAt: null,
          uploadedBy: null,
          updatedAt: null,
        };
      }

      const expiryDate = pickString(documentData, "expiryDate") ?? null;
      const { status, daysRemaining } = computeDocStatus(expiryDate);
      return {
        driverId,
        docType,
        issueDate: pickString(documentData, "issueDate") ?? null,
        expiryDate,
        licenseClass: pickString(documentData, "licenseClass") ?? null,
        note: pickString(documentData, "note") ?? null,
        status,
        daysRemaining,
        uploadedAt: pickString(documentData, "uploadedAt") ?? null,
        uploadedBy: pickString(documentData, "uploadedBy") ?? null,
        updatedAt: pickString(documentData, "updatedAt") ?? null,
      };
    });

    return {
      driverId,
      driverName: driverNames.get(driverId) ?? "Isimsiz",
      overallStatus: computeOverallStatus(documents),
      documents,
    };
  });

  const statusOrder = { blocked: 0, warning: 1, missing: 2, ok: 3 };
  items.sort(
    (left, right) => (statusOrder[left.overallStatus] ?? 9) - (statusOrder[right.overallStatus] ?? 9),
  );

  return { items };
}

export async function upsertDriverDocument(db, actorUid, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const docType = normalizeDocType(input?.docType);
  const issueDate = normalizeOptionalDate(input?.issueDate, "issueDate");
  const expiryDate = normalizeOptionalDate(input?.expiryDate, "expiryDate");
  const licenseClass = normalizeOptionalText(input?.licenseClass, "licenseClass", 80);
  const note = normalizeOptionalText(input?.note, "note", 500);

  await requireDriverBelongsToCompany(db, companyId, driverId);

  const nowIso = new Date().toISOString();
  const documentRef = db.collection(docCollectionPath(companyId)).doc(docId(driverId, docType));
  const existingSnapshot = await documentRef.get();
  const { status, daysRemaining } = computeDocStatus(expiryDate ?? null);

  const documentPatch = {
    driverId,
    docType,
    status,
    daysRemaining: daysRemaining ?? null,
    updatedAt: nowIso,
    uploadedBy: actorUid,
    ...(existingSnapshot.exists ? {} : { uploadedAt: nowIso }),
    ...(issueDate !== undefined ? { issueDate } : {}),
    ...(expiryDate !== undefined ? { expiryDate } : {}),
    ...(licenseClass !== undefined ? { licenseClass } : {}),
    ...(note !== undefined ? { note } : {}),
  };

  await documentRef.set(documentPatch, { merge: true });
  return {
    driverId,
    docType,
    status,
    updatedAt: nowIso,
  };
}

export async function deleteDriverDocument(db, input) {
  const companyId = normalizeCompanyId(input?.companyId);
  const driverId = normalizeDriverId(input?.driverId);
  const docType = normalizeDocType(input?.docType);

  await requireDriverBelongsToCompany(db, companyId, driverId);

  const documentRef = db.collection(docCollectionPath(companyId)).doc(docId(driverId, docType));
  const existingSnapshot = await documentRef.get();
  if (!existingSnapshot.exists) {
    throw new HttpError(404, "not-found", "Belge kaydi bulunamadi.");
  }

  await documentRef.delete();
  return {
    driverId,
    docType,
    deletedAt: new Date().toISOString(),
  };
}
