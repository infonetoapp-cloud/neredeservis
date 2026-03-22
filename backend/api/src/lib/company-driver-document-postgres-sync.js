import {
  replaceCompanyDriverDocumentsForCompany,
  shouldUsePostgresCompanyDriverDocumentStore,
} from "./company-driver-document-store.js";
import { backfillCompanyFromFirestoreRecord } from "./company-membership-store.js";
import { asRecord, pickString } from "./runtime-value.js";

function buildDriverDocumentProjection(companyId, documentData) {
  const driverId = pickString(documentData, "driverId");
  const docType = pickString(documentData, "docType");
  if (!companyId || !driverId || !docType) {
    return null;
  }

  return {
    companyId,
    driverId,
    docType,
    issueDate: pickString(documentData, "issueDate"),
    expiryDate: pickString(documentData, "expiryDate"),
    licenseClass: pickString(documentData, "licenseClass"),
    note: pickString(documentData, "note"),
    uploadedAt: pickString(documentData, "uploadedAt"),
    uploadedBy: pickString(documentData, "uploadedBy"),
    updatedAt: pickString(documentData, "updatedAt"),
  };
}

async function backfillCompanyRecordFromFirestore(db, companyId) {
  if (!db?.collection) {
    return false;
  }

  const companySnapshot = await db.collection("companies").doc(companyId).get();
  if (!companySnapshot.exists) {
    return false;
  }

  const companyData = asRecord(companySnapshot.data()) ?? {};
  return backfillCompanyFromFirestoreRecord({
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
    createdBy: pickString(companyData, "createdBy"),
    createdAt: pickString(companyData, "createdAt"),
    updatedAt: pickString(companyData, "updatedAt"),
  });
}

export async function syncCompanyDriverDocumentsFromFirestore(db, companyId, syncedAt) {
  if (!shouldUsePostgresCompanyDriverDocumentStore() || !db?.collection) {
    return false;
  }

  await backfillCompanyRecordFromFirestore(db, companyId).catch(() => false);
  const documentsSnapshot = await db.collection(`companies/${companyId}/driver_documents`).get();
  const items = documentsSnapshot.docs
    .map((documentSnapshot) =>
      buildDriverDocumentProjection(companyId, asRecord(documentSnapshot.data()) ?? {}),
    )
    .filter((item) => item !== null);

  return replaceCompanyDriverDocumentsForCompany(companyId, items, syncedAt ?? new Date().toISOString());
}
