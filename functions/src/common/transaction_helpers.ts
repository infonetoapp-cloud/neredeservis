import type { Firestore, Transaction } from 'firebase-admin/firestore';

type Awaitable<T> = T | Promise<T>;

export async function runTransactionVoid(
  db: Firestore,
  worker: (tx: Transaction) => Awaitable<void>,
): Promise<void> {
  await db.runTransaction(async (tx) => {
    await worker(tx);
    return null;
  });
}

export async function runTransactionWithResult<T>(
  db: Firestore,
  worker: (tx: Transaction) => Awaitable<T>,
): Promise<T> {
  return db.runTransaction(async (tx) => await worker(tx));
}
