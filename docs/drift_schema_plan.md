# NeredeServis Drift Schema Plan

## Baseline
- `schemaVersion = 1`
- Migration strategy zorunlu: `onCreate`, `onUpgrade`, `beforeOpen`

## Core Tables (V1)
- `location_queue`
  - `id` (pk)
  - `owner_uid`
  - `route_id`
  - `trip_id`
  - `lat`, `lng`, `speed`, `heading`, `accuracy`
  - `sampled_at_ms`
  - `created_at_ms`
  - `retry_count`
  - `next_retry_at_ms`
- `trip_action_queue`
  - `id` (pk)
  - `owner_uid`
  - `action_type` (`start_trip|finish_trip|announcement|support_report`)
  - `status` (`pending|in_flight|failed_permanent`)
  - `payload_json`
  - `idempotency_key`
  - `created_at_ms`
  - `failed_retry_count`
  - `retry_count`
  - `next_retry_at_ms`
  - `last_error_code`
  - `last_error_at_ms`
  - `max_retry_reached_at_ms`
- `local_meta`
  - `key` (pk)
  - `value`
- `migration_state`
  - `id` (pk=1)
  - `migration_lock` (bool)
  - `migration_version` (int)
  - `updated_at_ms`

## Owner Transfer Rule
- Guest -> registered gecisinde tum `owner_uid` alanlari tek SQLite transaction icinde devredilir.
- Transaction fail olursa rollback; yarim migration kalmaz.

## Queue State Machine (trip_action_queue)
- Baslangic: `pending`
- Gonderim basladi: `in_flight`
- Basarili: kayit kuyruktan silinir
- Gecici hata: `in_flight -> pending`, `failed_retry_count +1`, `next_retry_at_ms` ileri alinir
- Kalici hata veya 3 deneme limiti: `failed_permanent`, `max_retry_reached_at_ms` yazilir
- `failed_permanent` kayitlari otomatik tekrar denenmez; manuel mudahale gerekir

## local_meta Keys (zorunlu ornekler)
- `last_flush_at_ms`: son basarili queue flush zamani
- `pending_migration_version`: yarim kalan migration versiyonu
- `guest_owner_uid`: link oncesi owner uid
- `registered_owner_uid`: link sonrasi hedef uid
- `kalman_last_lat`: son filtreli lat cache
- `kalman_last_lng`: son filtreli lng cache
- `map_cache_last_prune_at_ms`: son tile/style cache budama zamani

## Migration Policy
- Her sema degisikliginde:
  - `schemaVersion++`
  - explicit `onUpgrade` adimi
  - regression test: old DB fixture -> new schema
- Breaking migration yok; data loss kabul edilmez.

## Test Requirements
- Queue data retention testi
- Owner transfer atomicity testi
- Downgrade unsupported ise clear failure message
