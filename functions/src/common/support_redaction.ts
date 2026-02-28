import { asRecord } from './type_guards.js';

const SUPPORT_PII_EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const SUPPORT_PII_PHONE_REGEX = /\+?\d[\d\s()-]{6,}\d/g;
const SUPPORT_PII_SRV_REGEX = /\b[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}\b/g;
const SUPPORT_PII_IDEMPOTENCY_REGEX = /\b[a-z0-9_]{16,}\b/gi;
const SUPPORT_SENSITIVE_KEY_REGEX =
  /(phone|email|token|password|uid|idempotency|authorization|cookie)/i;

export function redactSupportText(input: string): string {
  let output = input;
  output = output.replace(SUPPORT_PII_EMAIL_REGEX, '[EMAIL]');
  output = output.replace(SUPPORT_PII_PHONE_REGEX, '[PHONE]');
  output = output.replace(SUPPORT_PII_SRV_REGEX, '[SRV_CODE]');
  output = output.replace(SUPPORT_PII_IDEMPOTENCY_REGEX, '[TOKEN]');
  return output;
}

export function redactSupportValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSupportText(value);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => redactSupportValue(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const input = asRecord(value);
  if (!input) {
    return '[UNSUPPORTED]';
  }
  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (SUPPORT_SENSITIVE_KEY_REGEX.test(key)) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = redactSupportValue(raw);
  }
  return output;
}

export function truncateSupportText(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength)}...`;
}

