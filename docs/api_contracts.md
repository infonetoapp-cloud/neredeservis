# NeredeServis API Contracts (V1.0)

## Global Rules
- All timestamps stored in UTC.
- `scheduledTime` and `notificationTime` are interpreted in `Europe/Istanbul` timezone.
- No callable uses `any` for input/output.
- `requestId` and `serverTime` exist on every success response.

## Shared Types
```ts
export type Role = "driver" | "passenger" | "guest";

export interface ApiOk<T> {
  requestId: string;
  serverTime: string; // ISO-8601 UTC
  data: T;
}

export interface GeoPointDto {
  lat: number;
  lng: number;
}
```

## Route and Trip
```ts
export interface CreateRouteInput {
  name: string;
  startPoint: GeoPointDto;
  startAddress: string;
  endPoint: GeoPointDto;
  endAddress: string;
  scheduledTime: string; // HH:mm, Europe/Istanbul
  timeSlot: "morning" | "evening" | "midday" | "custom";
  allowGuestTracking: boolean;
  authorizedDriverIds?: string[];
}

export interface CreateRouteOutput {
  routeId: string;
  srvCode: string; // server-generated, see srvCode contract
}

export interface StartTripInput {
  routeId: string;
  deviceId: string;
  idempotencyKey: string;
  expectedTransitionVersion: number;
}

export interface StartTripOutput {
  tripId: string;
  status: "active";
  transitionVersion: number;
}

export interface FinishTripInput {
  tripId: string;
  deviceId: string;
  idempotencyKey: string;
  expectedTransitionVersion: number;
}

export interface FinishTripOutput {
  tripId: string;
  status: "completed" | "abandoned";
  endedAt: string; // ISO-8601 UTC
  transitionVersion: number;
}
```

## Passenger and Guest
```ts
export interface UpdatePassengerSettingsInput {
  routeId: string;
  showPhoneToDriver: boolean;
  phone?: string;
  boardingArea: string;
  virtualStop?: GeoPointDto;
  virtualStopLabel?: string;
  notificationTime: string; // HH:mm, Europe/Istanbul
}

export interface UpdatePassengerSettingsOutput {
  routeId: string;
  updatedAt: string; // ISO-8601 UTC
}

export interface CreateGuestSessionInput {
  srvCode: string;
  ttlMinutes?: number; // 5..60
}

export interface CreateGuestSessionOutput {
  sessionId: string;
  routeId: string;
  expiresAt: string; // ISO-8601 UTC
  rtdbReadPath: string;
}
```

## Ghost Drive and Maps
```ts
export interface TracePointDto {
  lat: number;
  lng: number;
  accuracy: number;
  sampledAtMs: number;
}

export interface CreateRouteFromGhostDriveInput {
  name: string;
  tracePoints: TracePointDto[];
  scheduledTime: string; // HH:mm, Europe/Istanbul
  timeSlot: "morning" | "evening" | "midday" | "custom";
  allowGuestTracking: boolean;
  authorizedDriverIds?: string[];
}

export interface CreateRouteFromGhostDriveOutput {
  routeId: string;
  srvCode: string;
  inferredStops: Array<{ name: string; location: GeoPointDto; order: number }>;
}

export interface MapboxDirectionsProxyInput {
  routeId: string;
  origin: GeoPointDto;
  destination: GeoPointDto;
}

export interface MapboxDirectionsProxyOutput {
  etaSeconds: number;
  distanceMeters: number;
  source: "directions" | "fallback";
}

export interface MapboxMapMatchingProxyInput {
  tracePoints: TracePointDto[];
  profile: "driving";
}

export interface MapboxMapMatchingProxyOutput {
  snappedPolyline: string;
  confidence: number;
  fallbackUsed: boolean;
}
```

## Device and Support
```ts
export interface RegisterDeviceInput {
  deviceId: string;
  activeDeviceToken: string;
  lastSeenAtMs: number;
}

export interface RegisterDeviceOutput {
  activeDeviceId: string;
  previousDeviceRevoked: boolean;
}

export interface CreateSupportReportInput {
  routeId?: string;
  tripId?: string;
  trigger: "manual" | "shake";
  note?: string; // max 500
  diagnostics: {
    notificationPermission: string;
    locationPermission: string;
    backgroundPermission: string;
    batteryOptimization: string;
    networkType: string;
    batteryLevel: number;
    queueDepth: { tripAction: number; location: number };
  };
}

export interface CreateSupportReportOutput {
  reportId: string;
  createdAt: string; // ISO-8601 UTC
}
```

## Billing and Directory
```ts
export interface GetSubscriptionStateInput {}

export interface GetSubscriptionStateOutput {
  subscriptionStatus: "trial" | "active" | "expired" | "mock";
  trialEndsAt?: string; // ISO-8601 UTC
  products: Array<{ id: string; price: string }>;
}

export interface SearchDriverDirectoryInput {
  queryHash: string;
  limit?: number; // 1..10
}

export interface SearchDriverDirectoryOutput {
  results: Array<{
    driverId: string;
    displayName: string;
    plateMasked: string;
  }>;
}
```

## Guardrail Summary
- Premium access is enforced server-side.
- `expectedTransitionVersion` is mandatory for trip transitions.
- `srvCode` generation is server-side and collision-safe.

## Subscription Enforcement Contract (server-side, V1.0)
- `getSubscriptionState` is the only authority for subscription state.
- Client-side paywall state never unlocks premium behavior by itself.
- `startTrip` and `finishTrip` are never blocked only because of subscription.
- Soft-lock behavior for `subscriptionStatus in {"expired","mock"}`:
  - live publish cadence is forced to low-priority mode on server policies.
  - paid optional services (for example high-cost directions path) can be downgraded to fallback.
- Any endpoint that requires premium-only behavior must return `PERMISSION_DENIED` when server entitlement check fails.

## Device Ownership Contract (finishTrip)
- `finishTrip.deviceId` must match trip `startedByDeviceId`.
- Mismatch result: `PERMISSION_DENIED`.
- Emergency override is not part of public callable input; it is server-admin only and must create an audit log.

## morningReminderDispatcher Contract
- Scheduler runs every minute in UTC runtime.
- Comparison is made in `Europe/Istanbul` timezone:
  - parse each route `scheduledTime` as Istanbul local `HH:mm`.
  - compute `target = scheduledTime - 5 minutes`.
  - send reminder only if `now_istanbul` is inside `[target, target+1m)` window.
- Dedup key is mandatory: `routeId + dateKey(YYYY-MM-DD, Europe/Istanbul) + reminder_type`.

## srvCode Generation Contract
- Alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (ambiguous chars yok).
- Length: `6`.
- Generation: `nanoid(6, alphabet)`.
- Uniqueness check is server transaction ile yapilir.
- Collision retry: max `5`.
- If still collides, request fails with deterministic error (`RESOURCE_EXHAUSTED` + `SRVCODE_COLLISION_LIMIT`).
