"use client";

const ROUTE_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidRouteTime(value: string): boolean {
  return ROUTE_TIME_PATTERN.test(value.trim());
}

