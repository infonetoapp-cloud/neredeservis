import { createHash } from 'node:crypto';

import { HttpsError } from 'firebase-functions/v2/https';

import type { GhostTraceValidationError } from '../ghost_drive/trace_processing.js';
import { asRecord } from './type_guards.js';

export type WritableRole = 'driver' | 'passenger' | 'guest';

export interface InferredStopOutput {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number;
}

export interface SupportReportSlackPayload {
  reportId: string;
  uid: string;
  source: string;
  supportEmail: string;
  note: string | null;
}

export function readRole(value: unknown): WritableRole | null {
  if (value === 'driver' || value === 'passenger' || value === 'guest') {
    return value;
  }
  return null;
}

export function resolvePreferredRole({
  existingRole,
  preferredRole,
  anonymous,
}: {
  existingRole: WritableRole | null;
  preferredRole: 'driver' | 'passenger' | undefined;
  anonymous: boolean;
}): WritableRole {
  if (anonymous) {
    return 'guest';
  }
  if (preferredRole === 'driver') {
    return 'driver';
  }
  if (preferredRole === 'passenger') {
    return 'passenger';
  }
  return existingRole ?? 'passenger';
}

export function isAnonymousProvider(token: Record<string, unknown>): boolean {
  const firebaseClaim = asRecord(token.firebase);
  return firebaseClaim?.sign_in_provider === 'anonymous';
}

export function buildTripConversationId(routeId: string, driverUid: string, passengerUid: string): string {
  const digest = createHash('sha256')
    .update(`${routeId}|${driverUid}|${passengerUid}`)
    .digest('hex');
  return `conv_${digest.slice(0, 40)}`;
}

export function inferStopsFromTrace(tracePoints: readonly { lat: number; lng: number }[]): InferredStopOutput[] {
  if (tracePoints.length === 0) {
    return [];
  }

  const first = tracePoints[0];
  const last = tracePoints[tracePoints.length - 1];
  if (!first || !last) {
    return [];
  }

  if (tracePoints.length < 5) {
    return [
      { name: 'Baslangic', location: { lat: first.lat, lng: first.lng }, order: 1 },
      { name: 'Bitis', location: { lat: last.lat, lng: last.lng }, order: 2 },
    ];
  }

  const middle = tracePoints[Math.floor(tracePoints.length / 2)] ?? first;
  return [
    { name: 'Baslangic', location: { lat: first.lat, lng: first.lng }, order: 1 },
    { name: 'Ara Durak', location: { lat: middle.lat, lng: middle.lng }, order: 2 },
    { name: 'Bitis', location: { lat: last.lat, lng: last.lng }, order: 3 },
  ];
}

export function mapGhostTraceValidationError(error: GhostTraceValidationError): HttpsError {
  return new HttpsError('invalid-argument', `${error.code}: ${error.message}`);
}

export async function dispatchSupportReportToSlack(
  webhookUrl: string,
  payload: SupportReportSlackPayload,
): Promise<'sent'> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text: [
        '*NeredeServis Support Report*',
        `reportId: ${payload.reportId}`,
        `uid: ${payload.uid}`,
        `source: ${payload.source}`,
        `supportEmail: ${payload.supportEmail}`,
        payload.note ? `note: ${payload.note}` : 'note: (empty)',
      ].join('\n'),
    }),
  });
  if (!response.ok) {
    throw new Error(`SUPPORT_SLACK_DISPATCH_FAILED:${response.status}`);
  }
  return 'sent';
}

export function buildWriterRevokeTaskId(routeId: string, driverId: string, tripId: string): string {
  return `${tripId}_${routeId}_${driverId}`;
}
