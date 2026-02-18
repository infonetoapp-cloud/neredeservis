import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { asRecord } from '../common/type_guards.js';

export interface AuthContext {
  uid: string;
  token: Record<string, unknown>;
}

export function requireAuth(request: CallableRequest<unknown>): AuthContext {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Auth zorunludur.');
  }

  const tokenRecord = asRecord(request.auth?.token) ?? {};
  return {
    uid,
    token: tokenRecord,
  };
}

export function requireNonAnonymous(context: AuthContext): void {
  const firebaseClaim = asRecord(context.token.firebase);
  const signInProvider = firebaseClaim?.sign_in_provider;
  if (signInProvider === 'anonymous') {
    throw new HttpsError('failed-precondition', 'Anonymous session bu islem icin desteklenmiyor.');
  }
}
