import { createHash } from 'node:crypto';

import type { Firestore } from 'firebase-admin/firestore';

export type RouteAuditStatus = 'success' | 'denied';

export interface WriteRouteAuditEventInput {
  eventType: string;
  actorUid: string | null;
  routeId?: string | null;
  srvCode?: string | null;
  status?: RouteAuditStatus;
  reason?: string | null;
  requestIp?: string | null;
  metadata?: Record<string, unknown>;
}

function buildAuditFingerprint(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function writeRouteAuditEvent(
  db: Firestore,
  collectionName: string,
  input: WriteRouteAuditEventInput,
): Promise<void> {
  await db.collection(collectionName).add({
    eventType: input.eventType,
    actorUid: input.actorUid ?? null,
    actorType: input.actorUid ? 'authenticated' : 'public',
    routeId: input.routeId ?? null,
    srvCode: input.srvCode ?? null,
    status: input.status ?? 'success',
    reason: input.reason ?? null,
    requestIpHash: buildAuditFingerprint(input.requestIp ?? null),
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });
}

export async function writeRouteAuditEventSafe({
  db,
  collectionName,
  input,
}: {
  db: Firestore;
  collectionName: string;
  input: WriteRouteAuditEventInput;
}): Promise<void> {
  try {
    await writeRouteAuditEvent(db, collectionName, input);
  } catch (error) {
    console.error('route audit write failed', {
      eventType: input.eventType,
      errorMessage: toErrorMessage(error),
    });
  }
}
