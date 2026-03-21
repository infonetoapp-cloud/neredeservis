import { getPostgresPool, isPostgresConfigured } from "./postgres.js";

const ALL_DOC_TYPES = ["ehliyet", "src", "psikoteknik", "saglik"];
const EXPIRY_WARNING_DAYS = 30;

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

function normalizeDocType(value) {
  return ALL_DOC_TYPES.includes(value ?? "") ? value : null;
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

async function readCompanyDriverDocumentSyncState(companyId) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT driver_documents_synced_at
      FROM companies
      WHERE company_id = $1
      LIMIT 1
    `,
    [normalizedCompanyId],
  );

  return result.rows[0] ?? null;
}

async function markCompanyDriverDocumentSyncState(queryable, companyId, syncedAt) {
  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedSyncedAt = normalizeIsoString(syncedAt) ?? new Date().toISOString();
  if (!normalizedCompanyId) {
    return false;
  }

  const result = await queryable.query(
    `
      UPDATE companies
      SET driver_documents_synced_at = $2::timestamptz,
          updated_at = GREATEST(updated_at, $2::timestamptz)
      WHERE company_id = $1
    `,
    [normalizedCompanyId, normalizedSyncedAt],
  );

  return result.rowCount > 0;
}

async function upsertCompanyDriverDocumentRow(queryable, input) {
  const companyId = normalizeNullableText(input?.companyId);
  const driverId = normalizeNullableText(input?.driverId);
  const docType = normalizeDocType(input?.docType);
  if (!companyId || !driverId || !docType) {
    return false;
  }

  const uploadedAt =
    normalizeIsoString(input?.uploadedAt) ??
    normalizeIsoString(input?.createdAt) ??
    normalizeIsoString(input?.updatedAt) ??
    new Date().toISOString();
  const updatedAt = normalizeIsoString(input?.updatedAt) ?? uploadedAt;

  await queryable.query(
    `
      INSERT INTO company_driver_documents (
        company_id,
        driver_id,
        doc_type,
        issue_date,
        expiry_date,
        license_class,
        note,
        uploaded_at,
        uploaded_by,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9, $10::timestamptz
      )
      ON CONFLICT (company_id, driver_id, doc_type) DO UPDATE
      SET
        issue_date = EXCLUDED.issue_date,
        expiry_date = EXCLUDED.expiry_date,
        license_class = EXCLUDED.license_class,
        note = EXCLUDED.note,
        uploaded_at = COALESCE(company_driver_documents.uploaded_at, EXCLUDED.uploaded_at),
        uploaded_by = EXCLUDED.uploaded_by,
        updated_at = EXCLUDED.updated_at
    `,
    [
      companyId,
      driverId,
      docType,
      normalizeNullableText(input?.issueDate),
      normalizeNullableText(input?.expiryDate),
      normalizeNullableText(input?.licenseClass),
      normalizeNullableText(input?.note),
      uploadedAt,
      normalizeNullableText(input?.uploadedBy),
      updatedAt,
    ],
  );

  return true;
}

export function shouldUsePostgresCompanyDriverDocumentStore() {
  return isPostgresConfigured();
}

export async function isCompanyDriverDocumentsSyncedInPostgres(companyId) {
  const row = await readCompanyDriverDocumentSyncState(companyId);
  return Boolean(normalizeIsoString(row?.driver_documents_synced_at));
}

export async function listCompanyDriverDocumentsFromPostgres(companyId, options = {}) {
  const pool = getPostgresPool();
  if (!pool) {
    return null;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const filterDriverId = normalizeNullableText(options.driverId);
  if (!normalizedCompanyId) {
    return null;
  }

  const driverParams = [normalizedCompanyId];
  let driverFilterClause = "";
  if (filterDriverId) {
    driverFilterClause = "AND driver_id = $2";
    driverParams.push(filterDriverId);
  }

  const [driversResult, documentsResult] = await Promise.all([
    pool.query(
      `
        SELECT driver_id, name
        FROM company_drivers
        WHERE company_id = $1
          ${driverFilterClause}
        ORDER BY name ASC, driver_id ASC
      `,
      driverParams,
    ),
    pool.query(
      `
        SELECT
          company_id,
          driver_id,
          doc_type,
          issue_date,
          expiry_date,
          license_class,
          note,
          uploaded_at,
          uploaded_by,
          updated_at
        FROM company_driver_documents
        WHERE company_id = $1
          ${driverFilterClause}
      `,
      driverParams,
    ),
  ]);

  if (filterDriverId && driversResult.rows.length === 0) {
    return { driverExists: false, items: [] };
  }

  const documentsByDriverId = new Map();
  for (const row of documentsResult.rows) {
    const driverId = normalizeNullableText(row.driver_id);
    const docType = normalizeDocType(row.doc_type);
    if (!driverId || !docType) {
      continue;
    }

    if (!documentsByDriverId.has(driverId)) {
      documentsByDriverId.set(driverId, new Map());
    }
    documentsByDriverId.get(driverId).set(docType, row);
  }

  const items = driversResult.rows.map((row) => {
    const driverId = normalizeNullableText(row.driver_id);
    if (!driverId) {
      return null;
    }

    const driverDocuments = documentsByDriverId.get(driverId) ?? new Map();
    const documents = ALL_DOC_TYPES.map((docType) => {
      const documentRow = driverDocuments.get(docType);
      if (!documentRow) {
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

      const expiryDate = normalizeNullableText(documentRow.expiry_date);
      const { status, daysRemaining } = computeDocStatus(expiryDate);
      return {
        driverId,
        docType,
        issueDate: normalizeNullableText(documentRow.issue_date),
        expiryDate,
        licenseClass: normalizeNullableText(documentRow.license_class),
        note: normalizeNullableText(documentRow.note),
        status,
        daysRemaining,
        uploadedAt: normalizeIsoString(documentRow.uploaded_at),
        uploadedBy: normalizeNullableText(documentRow.uploaded_by),
        updatedAt: normalizeIsoString(documentRow.updated_at),
      };
    });

    return {
      driverId,
      driverName: normalizeNullableText(row.name) ?? "Isimsiz",
      overallStatus: computeOverallStatus(documents),
      documents,
    };
  });

  const statusOrder = { blocked: 0, warning: 1, missing: 2, ok: 3 };
  const normalizedItems = items
    .filter((item) => item !== null)
    .sort(
      (left, right) =>
        (statusOrder[left.overallStatus] ?? 9) - (statusOrder[right.overallStatus] ?? 9),
    );

  return {
    driverExists: true,
    items: normalizedItems,
  };
}

export async function replaceCompanyDriverDocumentsForCompany(companyId, items, syncedAt) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  if (!normalizedCompanyId) {
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM company_driver_documents WHERE company_id = $1`, [
      normalizedCompanyId,
    ]);
    for (const item of Array.isArray(items) ? items : []) {
      await upsertCompanyDriverDocumentRow(client, item);
    }
    await markCompanyDriverDocumentSyncState(client, normalizedCompanyId, syncedAt);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

export async function syncCompanyDriverDocumentToPostgres(input) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  return upsertCompanyDriverDocumentRow(pool, input);
}

export async function deleteCompanyDriverDocumentFromPostgres(companyId, driverId, docType) {
  const pool = getPostgresPool();
  if (!pool) {
    return false;
  }

  const normalizedCompanyId = normalizeNullableText(companyId);
  const normalizedDriverId = normalizeNullableText(driverId);
  const normalizedDocType = normalizeDocType(docType);
  if (!normalizedCompanyId || !normalizedDriverId || !normalizedDocType) {
    return false;
  }

  await pool.query(
    `
      DELETE FROM company_driver_documents
      WHERE company_id = $1
        AND driver_id = $2
        AND doc_type = $3
    `,
    [normalizedCompanyId, normalizedDriverId, normalizedDocType],
  );
  return true;
}
