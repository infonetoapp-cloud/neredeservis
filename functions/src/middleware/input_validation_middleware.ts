import { HttpsError } from 'firebase-functions/v2/https';
import type { ZodType } from 'zod';

export function validateInput<T>(schema: ZodType<T>, rawData: unknown): T {
  const parsed = schema.safeParse(rawData);
  if (parsed.success) {
    return parsed.data;
  }

  const firstIssue = parsed.error.issues[0];
  const issuePath = firstIssue?.path.join('.') ?? 'input';
  const issueMessage = firstIssue?.message ?? 'Gecersiz istek verisi.';
  throw new HttpsError('invalid-argument', `${issuePath}: ${issueMessage}`);
}
