import type { Firestore, Transaction } from 'firebase-admin/firestore';

interface EnqueueOutboxWithDedupeParams {
  tx: Transaction;
  db: Firestore;
  dedupeKey: string;
  dedupeData: Record<string, unknown>;
  outboxData: Record<string, unknown>;
}

export async function enqueueOutboxWithDedupe({
  tx,
  db,
  dedupeKey,
  dedupeData,
  outboxData,
}: EnqueueOutboxWithDedupeParams): Promise<boolean> {
  const dedupeRef = db.collection('_notification_dedup').doc(dedupeKey);
  const dedupeSnap = await tx.get(dedupeRef);
  if (dedupeSnap.exists) {
    return false;
  }

  const outboxRef = db.collection('_notification_outbox').doc();
  tx.set(dedupeRef, dedupeData);
  tx.set(outboxRef, outboxData);
  return true;
}
