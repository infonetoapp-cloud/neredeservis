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

## Firestore Collection Schemas (STEP-063..065)
```ts
export interface UserDoc {
  role: Role; // server authority
  displayName: string;
  phone: string | null;
  email: string | null;
  createdAt: string; // server timestamp (UTC)
  updatedAt: string; // server timestamp (UTC)
  deletedAt: string | null; // server timestamp (UTC)
}

export interface DriverDoc {
  name: string;
  phone: string;
  plate: string;
  showPhoneToPassengers: boolean;
  companyId: string | null;
  subscriptionStatus: "trial" | "active" | "expired";
  trialStartDate: string | null; // UTC timestamp
  trialEndsAt: string | null; // UTC timestamp
  lastPaywallShownAt: string | null; // UTC timestamp
  activeDeviceId: string | null;
  activeDeviceToken: string | null;
  lastSeenAt: string | null; // UTC timestamp
  createdAt: string; // UTC timestamp
  updatedAt: string; // UTC timestamp
}

export interface RouteDoc {
  name: string;
  driverId: string;
  authorizedDriverIds: string[];
  memberIds: string[]; // server-managed
  companyId: string | null;
  srvCode: string; // server-generated unique code
  visibility: "private"; // V1.0 fixed
  allowGuestTracking: boolean;
  creationMode: "manual_pin" | "ghost_drive";
  routePolyline: string | null; // encoded polyline
  startPoint: GeoPointDto;
  startAddress: string;
  endPoint: GeoPointDto;
  endAddress: string;
  scheduledTime: string; // HH:mm (Europe/Istanbul)
  timeSlot: "morning" | "evening" | "midday" | "custom";
  isArchived: boolean;
  vacationUntil: string | null; // UTC timestamp
  passengerCount: number; // server-managed
  lastTripStartedNotificationAt: string | null; // UTC timestamp
  createdAt: string; // UTC timestamp
  updatedAt: string; // UTC timestamp
}

export interface TripDoc {
  routeId: string;
  driverId: string;
  driverSnapshot: {
    name: string;
    plate: string;
    phone: string | null; // masked snapshot, raw phone yok
  };
  status: "active" | "completed" | "abandoned";
  startedAt: string; // UTC timestamp
  endedAt: string | null; // UTC timestamp
  lastLocationAt: string; // UTC timestamp
  endReason: "driver_finished" | "auto_abandoned" | null;
  startedByDeviceId: string;
  transitionVersion: number;
  updatedAt: string; // UTC timestamp
}

export interface AnnouncementDoc {
  routeId: string;
  driverId: string;
  templateKey: string;
  customText: string | null;
  channels: Array<"fcm" | "whatsapp_link">;
  createdAt: string; // UTC timestamp
}

export interface ConsentDoc {
  privacyVersion: string;
  kvkkTextVersion: string;
  locationConsent: boolean;
  acceptedAt: string; // UTC timestamp
  platform: "android" | "ios";
}

export interface GuestSessionDoc {
  routeId: string;
  guestUid: string;
  expiresAt: string; // UTC timestamp
  status: "active" | "expired" | "revoked";
  createdAt: string; // UTC timestamp
  // optional local ownership linkage snapshot (guest -> account migration)
  ownerUid?: string;
  previousOwnerUid?: string | null;
  migratedAt?: string | null; // UTC timestamp
}

export interface TripRequestDoc {
  requestType: "start_trip" | "finish_trip";
  uid: string;
  resultRef: string;
  createdAt: string; // UTC timestamp
  expiresAt: string; // UTC timestamp
}
```

Schema guardrails:
- Direct client writes to `users`, `drivers`, `routes` are forbidden.
- Only callable/server paths may mutate these collections.
- `memberIds` is server-derived: `driverId U authorizedDriverIds U passengerIds`.
- Direct client writes to `trips`, `announcements`, `consents`, `guest_sessions`, `trip_requests` are forbidden.
- `trip_requests` document id contract: `{uid}_{idempotencyKey}`.

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

export interface UpdateRouteInput {
  routeId: string;
  name?: string;
  startPoint?: GeoPointDto;
  startAddress?: string;
  endPoint?: GeoPointDto;
  endAddress?: string;
  scheduledTime?: string; // HH:mm, Europe/Istanbul
  timeSlot?: "morning" | "evening" | "midday" | "custom";
  allowGuestTracking?: boolean;
  authorizedDriverIds?: string[];
  isArchived?: boolean;
  vacationUntil?: string | null; // ISO-8601 UTC
}

export interface UpdateRouteOutput {
  routeId: string;
  updatedAt: string; // ISO-8601 UTC
}

export interface UpsertStopInput {
  routeId: string;
  stopId?: string;
  name: string;
  location: GeoPointDto;
  order: number;
}

export interface UpsertStopOutput {
  routeId: string;
  stopId: string;
  updatedAt: string; // ISO-8601 UTC
}

export interface DeleteStopInput {
  routeId: string;
  stopId: string;
}

export interface DeleteStopOutput {
  routeId: string;
  stopId: string;
  deleted: boolean;
}

export interface JoinRouteBySrvCodeInput {
  srvCode: string; // 6 chars, server alphabet
  name: string;
  phone?: string;
  showPhoneToDriver: boolean;
  boardingArea: string;
  notificationTime: string; // HH:mm, Europe/Istanbul
}

export interface JoinRouteBySrvCodeOutput {
  routeId: string;
  routeName: string;
  role: "passenger";
}

export interface LeaveRouteInput {
  routeId: string;
}

export interface LeaveRouteOutput {
  routeId: string;
  left: boolean;
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

## Auth Profile and Consent
```ts
export interface BootstrapUserProfileInput {
  displayName: string;
  phone?: string;
}

export interface BootstrapUserProfileOutput {
  uid: string;
  role: Role;
  createdOrUpdated: boolean;
}

export interface UpdateUserProfileInput {
  displayName: string;
  phone?: string;
}

export interface UpdateUserProfileOutput {
  uid: string;
  updatedAt: string; // ISO-8601 UTC
}

export interface UpsertConsentInput {
  privacyVersion: string;
  kvkkTextVersion: string;
  locationConsent: boolean;
  platform: "android" | "ios";
}

export interface UpsertConsentOutput {
  uid: string;
  acceptedAt: string; // ISO-8601 UTC
}

export interface UpsertDriverProfileInput {
  name: string;
  phone: string;
  plate: string;
  showPhoneToPassengers: boolean;
  companyId?: string | null;
}

export interface UpsertDriverProfileOutput {
  driverId: string;
  updatedAt: string; // ISO-8601 UTC
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

export interface SubmitSkipTodayInput {
  routeId: string;
  dateKey: string; // YYYY-MM-DD (Europe/Istanbul today)
  idempotencyKey: string;
}

export interface SubmitSkipTodayOutput {
  routeId: string;
  dateKey: string;
  status: "skip_today";
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

Guest session guardrails:
- `createGuestSession` can run with anonymous auth; other callables require non-anonymous auth.
- If `users/{uid}` is missing, server bootstraps `role="guest"` profile atomically.
- `allowGuestTracking != true` routes are rejected.
- Successful create writes RTDB grant under `guestReaders/{routeId}/{guestUid}` with TTL.

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
  waypoints?: GeoPointDto[]; // max 10
  profile?: "driving" | "driving-traffic";
}

export interface MapboxDirectionsProxyOutput {
  routeId: string;
  profile: "driving" | "driving-traffic";
  geometry: string; // mapbox polyline6
  distanceMeters: number;
  durationSeconds: number;
  source: "mapbox";
  requestSignature: string | null; // HMAC signature if signing secret present
}

export interface MapboxMapMatchingProxyInput {
  tracePoints: TracePointDto[];
}

export interface MapboxMapMatchingProxyOutput {
  tracePoints: TracePointDto[];
  confidence: number;
  source: "map_matching" | "fallback";
  fallbackUsed: boolean;
}
```

Mapbox proxy guardrails:
- `mapboxDirectionsProxy` default-state kapali calisir (`MAPBOX_DIRECTIONS_DISABLED`) ve runtime flag ile acilir.
- Directions cagrilarinda route-level rate limit (`_rate_limits`) ve aylik hard cap (`_usage_counters`) zorunludur.
- Directions istegi server tarafinda imzalanir (`MAPBOX_PROXY_SIGNING_SECRET` varsa `requestSignature` uretir).
- `mapboxMapMatchingProxy` path'i `applyMapMatchingWithGuard` kullanir: budget dolu/timeout/upstream hata durumunda graceful fallback doner.

## Device and Support
```ts
export interface RegisterDeviceInput {
  deviceId: string;
  activeDeviceToken: string;
  lastSeenAt?: string; // optional client timestamp, server still writes canonical now
}

export interface RegisterDeviceOutput {
  activeDeviceId: string;
  previousDeviceRevoked: boolean;
  updatedAt: string; // ISO-8601 UTC
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

export interface SendDriverAnnouncementInput {
  routeId: string;
  templateKey: string;
  customText?: string; // max 240
  idempotencyKey: string;
}

export interface SendDriverAnnouncementOutput {
  announcementId: string;
  fcmCount: number;
  shareUrl: string;
}

export interface SearchDriverDirectoryInput {
  queryHash: string; // normalized hash string (min 8 chars)
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

Directory callable guardrails:
- Caller must be authenticated with `users/{uid}.role == "driver"`.
- Rate limit: max `30` request / `60s` per uid.
- Query strategy: exact hash lookup on `searchPhoneHash` + `searchPlateHash`.
- Returned fields are strictly masked: `driverId`, `displayName`, `plateMasked`.

## Guardrail Summary
- Premium access is enforced server-side.
- `expectedTransitionVersion` is mandatory for trip transitions.
- `srvCode` generation is server-side and collision-safe.

## Transaction Helper Contract
- Tum Firestore state-transition yazimlari ortak helper katmani ile calisir:
  - `runTransactionVoid(...)`
  - `runTransactionWithResult<T>(...)`
- Islem kurallari endpointten bagimsiz, helper seviyesinde tek bir transaction semantigiyle korunur.

## Idempotency Repository Contract
- Trip lifecycle idempotency repository kurali:
  - doc id: `trip_requests/{uid}_{idempotencyKey}`
  - `requestType`: `start_trip | finish_trip`
  - `resultRef`: `trips/{tripId}`
- Repository API:
  - `createTripRequestRef(...)`
  - `readTripRequestReplay(...)`
  - `setTripRequestRecord(...)`
- Replay kaydi mevcutsa ayni `requestType` zorunludur; farkli tipte kullanim `FAILED_PRECONDITION` dondurur.

## startTrip Contract
- `startTrip` is invoked after client-side `10s` undo window closes.
- Input must include `idempotencyKey` + `expectedTransitionVersion`.
- Optimistic lock rule: if `expectedTransitionVersion != currentTransitionVersion`, server returns `FAILED_PRECONDITION`.
- Idempotent replay key: `trip_requests/{uid}_{idempotencyKey}`.
- Success path grants RTDB writer access: `routeWriters/{routeId}/{uid} = true`.
- Trip-start notification cooldown key lives on route doc: `lastTripStartedNotificationAt` (`15dk`).

## finishTrip Contract
- Input must include `idempotencyKey` + `expectedTransitionVersion`.
- Device ownership rule: `finishTrip.deviceId` must match trip `startedByDeviceId` (public endpointte override yok).
- Optimistic lock rule: if `expectedTransitionVersion != currentTransitionVersion`, server returns `FAILED_PRECONDITION`.
- Idempotent replay key: `trip_requests/{uid}_{idempotencyKey}`.
- Success path writes terminal state (`completed` or no-op terminal replay) and revokes writer access:
  - transaction icinde `_writer_revoke_tasks/{tripId_routeId_uid}` kaydi zorunlu olarak `pending` durumunda olusturulur.
  - `routeWriters/{routeId}/{uid} = false`.
  - callable anlik revoke'u best-effort uygular; basarisiz olursa task `pending` kalir ve scheduler retry eder.

## Reconciliation Triggers
- `syncPassengerCount`:
  - source: `routes/{routeId}/passengers/*` writes
  - effect: `routes/{routeId}.passengerCount` is recomputed from actual passenger docs.
- `syncRouteMembership`:
  - source: `routes/{routeId}` writes
  - effect: `memberIds = [driverId] U authorizedDriverIds U passengerIds` is rebuilt deterministically.
  - `memberIds` path'i callables tarafinda dogrudan turetilmez; tek kaynak trigger'dir.
- `syncTripHeartbeatFromLocation`:
  - source: RTDB `/locations/{routeId}` writes
  - effect: active trip `lastLocationAt` is refreshed from live location payload.
  - freshness window: `timestamp in [now-30000, now+5000]` ise `live`; aksi halde `offline_replay`.
  - stale payloads always go to `trips/{tripId}/location_history/*` and never move live heartbeat backwards.

## abandonedTripGuard Contract
- Schedule: every `10 minutes` (fallback guard).
- Query contract:
  - `trips.where(status == "active").where(lastLocationAt <= cutoffIso).limit(200)`.
  - required index: `status ASC, lastLocationAt ASC`.
- Transition contract:
  - stale active trip -> `status="abandoned"`, `endReason="auto_abandoned"`, `transitionVersion +1`.
  - writer revoke: `routeWriters/{routeId}/{driverId}=false`.
- Emulator query-plan evidence (smoke):
  - `node --input-type=module ... where('status','==','active').where('lastLocationAt','<=',cutoff)...` query succeeded.

## Subscription Enforcement Contract (server-side, V1.0)
- `getSubscriptionState` is the only authority for subscription state.
- Client-side paywall state never unlocks premium behavior by itself.
- `startTrip` and `finishTrip` are never blocked only because of subscription.
- Soft-lock behavior for `subscriptionStatus in {"expired","mock"}`:
  - live publish cadence is forced to low-priority mode on server policies.
  - paid optional services (for example high-cost directions path) can be downgraded to fallback.
- Any endpoint that requires premium-only behavior must return `PERMISSION_DENIED` when server entitlement check fails.
- `sendDriverAnnouncement` is premium-gated (allowed: `active` or `trial`; denied: `expired` or `mock`).

## Device Ownership Contract (finishTrip)
- `finishTrip.deviceId` must match trip `startedByDeviceId`.
- Mismatch result: `PERMISSION_DENIED`.
- Emergency override is not part of public callable input; it is server-admin only and must create an audit log.

## Single Active Device Contract (registerDevice)
- `registerDevice` authority: `drivers/{uid}` doc.
- On every successful call:
  - `drivers/{uid}.activeDeviceId` and `activeDeviceToken` are replaced with request values.
  - canonical `lastSeenAt` is server timestamp (UTC).
- If `deviceId` changes:
  - previous device is marked inactive under `drivers/{uid}/devices/{previousDeviceId}`.
  - audit event is written to `_audit_device_switches`.
  - notification task is enqueued in `_notification_outbox`.
- `previousDeviceRevoked` is `true` only when active device id changes.

## morningReminderDispatcher Contract
- Scheduler runs every minute in UTC runtime.
- Comparison is made in `Europe/Istanbul` timezone:
  - parse each route `scheduledTime` as Istanbul local `HH:mm`.
  - compute `target = scheduledTime - 5 minutes`.
  - send reminder only if `now_istanbul` is inside `[target, target+1m)` window.
- Dedup key is mandatory: `routeId + dateKey(YYYY-MM-DD, Europe/Istanbul) + reminder_type`.
- Dedup state is persisted at `_notification_dedup/{dedupeKey}`.
- Dispatch payload is enqueued to `_notification_outbox` with type `morning_reminder`.

## Duplicate Push Prevention Contract
- Ortak dedupe mekanizmasi: `enqueueOutboxWithDedupe(...)`.
- Isleyis:
  - `_notification_dedup/{dedupeKey}` varsa yeni outbox olusmaz.
  - Yoksa dedupe ve `_notification_outbox` atomik olarak ayni transaction'da yazilir.
- Aktif dedupe kullanimlari:
  - `morning_reminder`
  - `device_switch_notice`
  - `driver_announcement_dispatch`

## cleanupStaleData Contract
- Schedule: `03:00` (`Europe/Istanbul`).
- Batch cleanup limit: `200` doc/run/collection.
- Expired delete scope (`expiresAt <= now`):
  - `trip_requests`
  - `_notification_dedup`
  - `_writer_revoke_tasks`
- Expired `guest_sessions` scope:
  - `expiresAt <= now` ve `status == "active"` kayitlari `status="expired"` olarak isaretlenir.
- `support_reports` retention policy (252C):
  - `createdAt <= now-30d` kayitlari silinir.
- `skip_requests` retention policy (259A):
  - collection-group `skip_requests` icinde `dateKey < today(Europe/Istanbul)` kayitlari temizlenir.

## cleanupRouteWriters Contract
- Schedule: every `5 minutes`.
- Phase-1 retry queue:
  - `_writer_revoke_tasks.where(status == "pending").limit(200)` taranir.
  - revoke basariliysa task `applied`, hata varsa `pending` + `lastError`.
- Phase-2 stale writer sweep:
  - RTDB `routeWriters/*/* == true` kayitlari (limit `200`) kontrol edilir.
  - Ilgili `trips` kaydinda aktif (`status="active"`) sefer yoksa writer flag `false` yapilir.

## guestSessionTtlEnforcer Contract
- Schedule: every `5 minutes`.
- `guest_sessions` icinde `expiresAt <= now` ve `status == "active"` kayitlari:
  - `status = "expired"` olarak isaretlenir.
  - `guestReaders/{routeId}/{guestUid}` RTDB erisimi aktif olarak revoke edilir (`active=false`).

## skip_requests Single-Day Contract
- Tek-gun tek-kayit anahtari: `routes/{routeId}/skip_requests/{uid}_{dateKey}`.
- Callable sadece `dateKey == today(Europe/Istanbul)` kabul eder.
- Ayni gun tekrar cagrilarinda yeni kayit acilmaz; mevcut dokuman yeniden kullanilir.
- `idempotencyKey` ilk olusan deger olarak sabitlenir (tekrar cagrida degistirilmez).

## srvCode Generation Contract
- Alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (ambiguous chars yok).
- Length: `6`.
- Generation: `nanoid(6, alphabet)`.
- Uniqueness check is server transaction ile yapilir.
- Collision retry: max `5`.
- If still collides, request fails with deterministic error (`RESOURCE_EXHAUSTED` + `SRVCODE_COLLISION_LIMIT`).
