# Function Telemetry Dashboard Notes (STEP-296/297)

Tarih: 2026-02-18  
Durum: Active

## 1) Dashboard Scope

Panel hedefi: callable/scheduler sagligini tek ekranda izlemek.

Zorunlu fonksiyon gruplari:
- Auth/Profile: `bootstrapUserProfile`, `updateUserProfile`, `upsertConsent`, `upsertDriverProfile`
- Route/Trip: `createRoute`, `joinRouteBySrvCode`, `startTrip`, `finishTrip`
- Share/Preview: `generateRouteShareLink`, `getDynamicRoutePreview`
- KVKK: `deleteUserData`, `cleanupStaleData`
- Ops: `abandonedTripGuard`, `guestSessionTtlEnforcer`, `cleanupRouteWriters`

## 2) Minimum Metrics

Her fonksiyon icin:
- Request count (5m/1h)
- Error rate (%)
- P95 latency (ms)
- Cold start ratio (varsa)

KVKK/delete ozel:
- `_delete_requests` pending count
- `_delete_requests` completed count (24h)
- `_audit_privacy_events` event dagilimi:
  - `user_delete_blocked_subscription`
  - `user_delete_requested`
  - `user_delete_dry_run`
  - `user_delete_completed`

Share/preview ozel:
- `_audit_route_events` denied/success oranlari
- `route_preview_denied` reason dagilimi

## 3) Alert Thresholds (STEP-297)

P1 (anlik oncelik):
- Error rate `>= 5%` (10 dk pencerede, min 100 cagrı)
- P95 latency `>= 2500ms` (10 dk)
- `cleanupStaleData` son 24 saatte hic basarili kosmadi

P2 (izleme/gun ici mudahale):
- Error rate `>= 2%` (30 dk pencerede)
- P95 latency `>= 1500ms` (30 dk)
- `_delete_requests` pending backlog `>= 50`

P3 (optimizasyon):
- `route_preview_denied/resource-exhausted` oraninda haftalik artis `>= %30`
- `joinRouteBySrvCode` rate-limit hit oraninda haftalik artis `>= %30`

## 4) Incident Routing

- P1: On-call + urun sahibi anlik bildirim.
- P2: On-call backlog + ayni gun icinde triage.
- P3: Haftalik teknik borc/optimizasyon backlog'una tasinir.

## 5) Review Cadence

- Gunluk: P1/P2 alarm ozeti.
- Haftalik: error budget + latency trend + KVKK delete backlog.
- Sprint sonu: threshold tuning ve false-positive azaltimi.
