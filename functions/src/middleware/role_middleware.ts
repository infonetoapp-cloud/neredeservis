import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { asRecord } from '../common/type_guards.js';

export type UserRole = 'driver' | 'passenger' | 'guest';

interface RequireRoleInput {
  db: Firestore;
  uid: string;
  allowedRoles: readonly UserRole[];
}

export async function requireRole({ db, uid, allowedRoles }: RequireRoleInput): Promise<UserRole> {
  const userSnap = await db.collection('users').doc(uid).get();
  const userData = asRecord(userSnap.data());
  const role = userData?.role;

  if (role !== 'driver' && role !== 'passenger' && role !== 'guest') {
    throw new HttpsError('permission-denied', 'Gecerli rol bulunamadi.');
  }

  if (!allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Bu islem icin yetkin bulunmuyor.');
  }

  return role;
}
