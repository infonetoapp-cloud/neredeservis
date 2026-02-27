# Mobile Event Schema V1

## 1) Scope
- Bu dokuman, mobil tarafta uretilen flow/perf event adlarini ve payload semasini sabitler.
- V1.0 kapsaminda eventler sadece uygulama ici tanilama + Sentry breadcrumb amaciyla kullanilir.

## 2) Collection Gate
- `ANALYTICS_COLLECTION_ENABLED` yalnizca `dev/stg` icin aktif edilebilir.
- `prod` flavor'da analytics collection zorunlu olarak kapali tutulur.
- Data Safety beyaninda amac: `App functionality` (analytics/ads secimi yok).

## 3) Ortak Payload Sema
- `eventName` (string): sabit event anahtari.
- `category` (string): `trip`, `join`, `share`, `permission`, `perf`.
- `timestampUtc` (ISO8601 UTC).
- `environment` (string): `dev`, `stg`, `prod`.
- `attributes` (map): evente ozel alanlar.

## 4) Event Listesi
- `trip_start`
  - `result`: `success|error`
  - `routeId` (opsiyonel), `tripId` (opsiyonel), `code` (opsiyonel)
- `trip_finish`
  - `result`: `success|pending_sync|error|queue_error`
  - `tripId` (opsiyonel), `code` (opsiyonel)
- `route_join`
  - `result`: `success|error`
  - `routeId` (opsiyonel), `role` (opsiyonel), `code` (opsiyonel)
- `route_leave`
  - `result`: `success|noop|error`
  - `routeId` (opsiyonel)
- `announcement_share`
  - `result`: `success|error`
  - `channel`: `whatsapp|whatsapp_business|system_sheet|none`
- `permission_denied`
  - `trigger`
  - `platform`: `ios|android`
  - `reason`: `user_denied|request_error|read_error`

## 5) Perf Event Listesi
- `perf_app_startup`
- `perf_map_render`
- `perf_route_list_load`
- `perf_background_publish_interval`
- `perf_join_callable_latency`
- `perf_leave_callable_latency`
- `perf_start_trip_callable_latency`
- `perf_finish_trip_callable_latency`
- `perf_share_callable_latency`

Tum perf eventlerinde:
- `durationMs` (int)
- `outcome` (uygunsa: `success|error`)

## 6) PII Kurali
- Tum payloadlar `PiiRedactor` katmanindan gecirilir.
- Hassas keyler (`phone`, `email`, `token`, `password`, `idempotency`, `uid`) `[REDACTED]` olur.
- Serbest metin icinde email/telefon/srv code/idempotency paterni redakte edilir.
