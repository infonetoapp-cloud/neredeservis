import type { Firestore, Transaction } from 'firebase-admin/firestore';

export async function runTransactionVoid(
  db: Firestore,
  worker: (tx: Transaction) => Promise<void>,
): Promise<void> {
  await db.runTransaction(async (tx) => {
    await worker(tx);
    return null;
  });
}

export async function runTransactionWithResult<T>(
  db: Firestore,
  worker: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.runTransaction(async (tx) => worker(tx));
}
