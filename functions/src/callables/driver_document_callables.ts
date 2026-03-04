import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

import { apiOk } from '../common/api_response.js';
import { pickString } from '../common/runtime_value_helpers.js';
import { asRecord } from '../common/type_guards.js';
import { requireAuth, requireNonAnonymous } from '../middleware/auth_middleware.js';
import { validateInput } from '../middleware/input_validation_middleware.js';
import type {
  DriverDocType,
  DriverDocStatus,
  DriverDocumentItem,
  DriverDocumentSummary,
  ListDriverDocumentsOutput,
  UpsertDriverDocumentOutput,
  DeleteDriverDocumentOutput,
} from '../common/output_contract_types.js';

/* ------------------------------------------------------------------ */
/*  Types – matching input schemas                                    */
/* ------------------------------------------------------------------ */

type CompanyMemberRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';

interface UpsertDriverDocumentInput {
  companyId: string;
  driverId: string;
  docType: DriverDocType;
  issueDate?: string;
  expiryDate?: string;
  licenseClass?: string;
  note?: string;
}

interface ListDriverDocumentsInput {
  companyId: string;
  driverId?: string;
}

interface DeleteDriverDocumentInput {
  companyId: string;
  driverId: string;
  docType: DriverDocType;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const ALL_DOC_TYPES: DriverDocType[] = ['ehliyet', 'src', 'psikoteknik', 'saglik'];
const EXPIRY_WARNING_DAYS = 30;

function requireDocumentWriteRole(role: CompanyMemberRole): void {
  if (role !== 'owner' && role !== 'admin' && role !== 'dispatcher') {
    throw new HttpsError(
      'permission-denied',
      'Bu islem icin owner, admin veya dispatcher rolu gereklidir.',
    );
  }
}

function computeDocStatus(expiryDate: string | null | undefined): { status: DriverDocStatus; daysRemaining: number | null } {
  if (!expiryDate) {
    return { status: 'valid', daysRemaining: null };
  }
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) {
    return { status: 'valid', daysRemaining: null };
  }
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'expired', daysRemaining };
  }
  if (daysRemaining <= EXPIRY_WARNING_DAYS) {
    return { status: 'expiring_soon', daysRemaining };
  }
  return { status: 'valid', daysRemaining };
}

function computeOverallStatus(documents: DriverDocumentItem[]): 'ok' | 'warning' | 'blocked' | 'missing' {
  const uploaded = documents.filter((d) => d.status !== 'not_uploaded');
  if (uploaded.length === 0) {
    return 'missing';
  }
  const hasExpired = documents.some((d) => d.status === 'expired');
  if (hasExpired) {
    return 'blocked';
  }
  const hasExpiringSoon = documents.some((d) => d.status === 'expiring_soon');
  if (hasExpiringSoon) {
    return 'warning';
  }
  const hasNotUploaded = documents.some((d) => d.status === 'not_uploaded');
  if (hasNotUploaded) {
    return 'warning';
  }
  return 'ok';
}

function docCollectionPath(companyId: string): string {
  return `companies/${companyId}/driver_documents`;
}

function docId(driverId: string, docType: DriverDocType): string {
  return `${driverId}_${docType}`;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                           */
/* ------------------------------------------------------------------ */

export function createDriverDocumentCallables({
  db,
  upsertDriverDocumentInputSchema,
  listDriverDocumentsInputSchema,
  deleteDriverDocumentInputSchema,
  requireActiveCompanyMemberRole,
}: {
  db: Firestore;
  upsertDriverDocumentInputSchema: ZodType;
  listDriverDocumentsInputSchema: ZodType;
  deleteDriverDocumentInputSchema: ZodType;
  requireActiveCompanyMemberRole: (
    companyId: string,
    uid: string,
  ) => Promise<CompanyMemberRole>;
}) {

  /* ─── upsertDriverDocument ─── */
  const upsertDriverDocument = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      upsertDriverDocumentInputSchema,
      request.data,
    ) as UpsertDriverDocumentInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireDocumentWriteRole(memberRole);

    // Verify driver exists and belongs to this company
    const driverSnap = await db.collection('drivers').doc(input.driverId).get();
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Sofor bulunamadi.');
    }
    const driverData = asRecord(driverSnap.data()) ?? {};
    if (pickString(driverData, 'companyId') !== input.companyId) {
      throw new HttpsError('permission-denied', 'Sofor bu sirkete ait degil.');
    }

    const now = new Date().toISOString();
    const { status, daysRemaining } = computeDocStatus(input.expiryDate ?? null);

    const documentData: Record<string, unknown> = {
      driverId: input.driverId,
      docType: input.docType,
      status,
      daysRemaining: daysRemaining ?? null,
      updatedAt: now,
      uploadedBy: auth.uid,
    };

    // Only set uploadedAt on first creation
    const existingDoc = await db
      .collection(docCollectionPath(input.companyId))
      .doc(docId(input.driverId, input.docType))
      .get();
    if (!existingDoc.exists) {
      documentData.uploadedAt = now;
    }

    if (input.issueDate) documentData.issueDate = input.issueDate;
    if (input.expiryDate) documentData.expiryDate = input.expiryDate;
    if (input.licenseClass !== undefined) documentData.licenseClass = input.licenseClass || null;
    if (input.note !== undefined) documentData.note = input.note || null;

    await db
      .collection(docCollectionPath(input.companyId))
      .doc(docId(input.driverId, input.docType))
      .set(documentData, { merge: true });

    return apiOk<UpsertDriverDocumentOutput>({
      driverId: input.driverId,
      docType: input.docType,
      status,
      updatedAt: now,
    });
  });

  /* ─── listDriverDocuments ─── */
  const listDriverDocuments = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      listDriverDocumentsInputSchema,
      request.data,
    ) as ListDriverDocumentsInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    if (!memberRole) {
      throw new HttpsError('permission-denied', 'Bu sirkete erisim yetkiniz yok.');
    }

    // Determine which drivers to include + get names
    const driverNames = new Map<string, string>();
    let driverIds: string[];
    if (input.driverId) {
      // Single driver — verify belongs to company
      const driverSnap = await db.collection('drivers').doc(input.driverId).get();
      if (driverSnap.exists) {
        const data = asRecord(driverSnap.data()) ?? {};
        if (pickString(data, 'companyId') === input.companyId) {
          driverNames.set(input.driverId, pickString(data, 'name') ?? 'Isimsiz');
        }
      }
      driverIds = driverNames.has(input.driverId) ? [input.driverId] : [];
    } else {
      // All drivers in this company
      const driversSnap = await db
        .collection('drivers')
        .where('companyId', '==', input.companyId)
        .get();
      driverIds = [];
      for (const doc of driversSnap.docs) {
        const data = asRecord(doc.data()) ?? {};
        driverIds.push(doc.id);
        driverNames.set(doc.id, pickString(data, 'name') ?? 'Isimsiz');
      }
    }

    // Get all documents for this company
    const docsSnap = await db.collection(docCollectionPath(input.companyId)).get();
    const docsByDriver = new Map<string, Map<DriverDocType, Record<string, unknown>>>();
    for (const doc of docsSnap.docs) {
      const data = asRecord(doc.data()) ?? {};
      const dId = pickString(data, 'driverId');
      if (!dId) continue;
      if (!docsByDriver.has(dId)) {
        docsByDriver.set(dId, new Map());
      }
      const docType = pickString(data, 'docType') as DriverDocType | null;
      if (docType && ALL_DOC_TYPES.includes(docType)) {
        docsByDriver.get(dId)!.set(docType, data);
      }
    }

    // Build summaries
    const items: DriverDocumentSummary[] = [];
    for (const driverId of driverIds) {
      const driverName = driverNames.get(driverId) ?? 'Isimsiz';
      const driverDocs = docsByDriver.get(driverId) ?? new Map();

      const documents: DriverDocumentItem[] = ALL_DOC_TYPES.map((docType) => {
        const docData = driverDocs.get(docType);
        if (!docData) {
          return {
            driverId,
            docType,
            issueDate: null,
            expiryDate: null,
            licenseClass: null,
            note: null,
            status: 'not_uploaded' as DriverDocStatus,
            daysRemaining: null,
            uploadedAt: null,
            uploadedBy: null,
            updatedAt: null,
          };
        }

        const expiryDate = pickString(docData, 'expiryDate') ?? null;
        const { status, daysRemaining } = computeDocStatus(expiryDate);

        return {
          driverId,
          docType,
          issueDate: pickString(docData, 'issueDate') ?? null,
          expiryDate,
          licenseClass: pickString(docData, 'licenseClass') ?? null,
          note: pickString(docData, 'note') ?? null,
          status,
          daysRemaining,
          uploadedAt: pickString(docData, 'uploadedAt') ?? null,
          uploadedBy: pickString(docData, 'uploadedBy') ?? null,
          updatedAt: pickString(docData, 'updatedAt') ?? null,
        };
      });

      const overallStatus = computeOverallStatus(documents);
      items.push({ driverId, driverName, overallStatus, documents });
    }

    // Sort: blocked first, then warning, then missing, then ok
    const statusOrder: Record<string, number> = { blocked: 0, warning: 1, missing: 2, ok: 3 };
    items.sort((a, b) => (statusOrder[a.overallStatus] ?? 9) - (statusOrder[b.overallStatus] ?? 9));

    return apiOk<ListDriverDocumentsOutput>({ items });
  });

  /* ─── deleteDriverDocument ─── */
  const deleteDriverDocument = onCall(async (request: CallableRequest<unknown>) => {
    const auth = requireAuth(request);
    requireNonAnonymous(auth);
    const input = validateInput(
      deleteDriverDocumentInputSchema,
      request.data,
    ) as DeleteDriverDocumentInput;

    const memberRole = await requireActiveCompanyMemberRole(input.companyId, auth.uid);
    requireDocumentWriteRole(memberRole);

    // Verify driver belongs to this company
    const driverSnap = await db.collection('drivers').doc(input.driverId).get();
    if (!driverSnap.exists) {
      throw new HttpsError('not-found', 'Sofor bulunamadi.');
    }
    const driverData = asRecord(driverSnap.data()) ?? {};
    if (pickString(driverData, 'companyId') !== input.companyId) {
      throw new HttpsError('permission-denied', 'Sofor bu sirkete ait degil.');
    }

    const docRef = db
      .collection(docCollectionPath(input.companyId))
      .doc(docId(input.driverId, input.docType));

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new HttpsError('not-found', 'Belge kaydı bulunamadı.');
    }

    await docRef.delete();

    return apiOk<DeleteDriverDocumentOutput>({
      driverId: input.driverId,
      docType: input.docType,
      deletedAt: new Date().toISOString(),
    });
  });

  return {
    upsertDriverDocument,
    listDriverDocuments,
    deleteDriverDocument,
  };
}
