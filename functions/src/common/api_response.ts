import { randomUUID } from 'node:crypto';

export interface ApiOk<T> {
  requestId: string;
  serverTime: string;
  data: T;
}

export function apiOk<T>(data: T): ApiOk<T> {
  return {
    requestId: randomUUID(),
    serverTime: new Date().toISOString(),
    data,
  };
}
