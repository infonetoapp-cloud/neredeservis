import { FieldPath } from "firebase-admin/firestore";

function requireFirestoreDb(db) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("Driver read model storage is not available.");
  }
  return db;
}

function parseIsoDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value.trim();
  }

  if (value && typeof value === "object" && typeof value.toDate === "function") {
    try {
      const parsed = value.toDate();
      if (parsed instanceof Date && Number.isFinite(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      return null;
    }
  }

  return null;
}

function serializeFirestoreValue(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  const isoDate = parseIsoDate(value);
  if (isoDate) {
    return isoDate;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (value && typeof value === "object") {
    const result = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = serializeFirestoreValue(nestedValue);
    }
    return result;
  }

  return null;
}

function readTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function fetchCollectionDocumentsByIds(db, { collectionPath, documentIds }) {
  const firestoreDb = requireFirestoreDb(db);
  const uniqueIds = Array.from(
    new Set(documentIds.filter((item) => typeof item === "string" && item.trim().length > 0)),
  );
  if (uniqueIds.length === 0) {
    return {};
  }

  const result = {};
  for (let index = 0; index < uniqueIds.length; index += 10) {
    const batch = uniqueIds.slice(index, index + 10);
    const snapshot = await firestoreDb
      .collection(collectionPath)
      .where(FieldPath.documentId(), "in", batch)
      .get();
    for (const documentSnapshot of snapshot.docs) {
      result[documentSnapshot.id] = serializeFirestoreValue(documentSnapshot.data());
    }
  }

  return result;
}

export async function loadDriverTripHistory(db, uid) {
  const firestoreDb = requireFirestoreDb(db);
  const normalizedUid = readTrimmedString(uid);
  if (!normalizedUid) {
    return {
      tripRows: [],
      routesById: {},
    };
  }

  const tripsSnapshot = await firestoreDb
    .collection("trips")
    .where("driverId", "==", normalizedUid)
    .limit(180)
    .get();
  if (tripsSnapshot.empty) {
    return {
      tripRows: [],
      routesById: {},
    };
  }

  const tripRows = [];
  const routeIds = new Set();
  for (const doc of tripsSnapshot.docs) {
    const tripData = serializeFirestoreValue(doc.data());
    tripRows.push({
      tripId: doc.id,
      tripData,
    });

    const routeId = readTrimmedString(tripData?.routeId);
    if (routeId) {
      routeIds.add(routeId);
    }
  }

  const routesById = await fetchCollectionDocumentsByIds(firestoreDb, {
    collectionPath: "routes",
    documentIds: Array.from(routeIds),
  }).catch(() => ({}));

  return {
    tripRows,
    routesById,
  };
}
