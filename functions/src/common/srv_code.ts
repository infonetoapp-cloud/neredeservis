import { customAlphabet } from 'nanoid';

export const SRV_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SRV_CODE_LENGTH = 6;
export const SRV_CODE_COLLISION_MAX_RETRY = 5;
export const SRV_CODE_COLLISION_LIMIT_ERROR = 'SRVCODE_COLLISION_LIMIT';

const generateSrvCode = customAlphabet(SRV_CODE_ALPHABET, SRV_CODE_LENGTH);

export function generateSrvCodeCandidate(): string {
  return generateSrvCode();
}
