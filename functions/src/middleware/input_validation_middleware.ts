import { HttpsError } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

function describeValidationShape(value: unknown, depth = 0): unknown {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return `string(${value.trim().length})`;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `number(${value})` : 'number(non-finite)';
  }
  if (typeof value === 'boolean') {
    return `boolean(${value})`;
  }
  if (Array.isArray(value)) {
    if (depth >= 1) {
      return `array(${value.length})`;
    }
    return value.slice(0, 10).map((item) => describeValidationShape(item, depth + 1));
  }
  if (typeof value === 'object') {
    if (depth >= 1) {
      return `object(${Object.keys(value as Record<string, unknown>).length})`;
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 20)
        .map(([key, nestedValue]) => [key, describeValidationShape(nestedValue, depth + 1)]),
    );
  }
  return typeof value;
}

export function validateInput<T>(schema: ZodType<T>, rawData: unknown): T {
  const parsed = schema.safeParse(rawData);
  if (parsed.success) {
    return parsed.data;
  }

  const firstIssue = parsed.error.issues[0];
  const issuePath = firstIssue?.path.join('.') ?? 'input';
  const issueMessage = firstIssue?.message ?? 'Gecersiz istek verisi.';
  console.error('Input validation failed', {
    issuePath,
    issueMessage,
    payloadShape: describeValidationShape(rawData),
  });
  throw new HttpsError('invalid-argument', `${issuePath}: ${issueMessage}`);
}
