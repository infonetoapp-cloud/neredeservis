# Phase 9 APP-SPRINT-2 Execution Runbook

Generated At: 2026-02-27 23:54:35
Source: website/app-impact/12_phase9_app_sprint_packages_latest.json
Package: APP-SPRINT-2

## Scope
- W2A: W2A-001, W2A-002, W2A-003, W2A-013, W2A-014, W2A-015, W2A-016, W2A-017
- Open Items: 0/13
- Goal: Route stop parser + live ops state + critical error mapping closure.

## Step-by-Step
1. Route stop parser setini kapat (`list/upsert/delete/reorder`).
2. Live ops parser setini kapat (`listActiveTrips`, `liveState`, `live.source`, RTDB state).
3. Critical error mapping setini kapat (`426`, token mismatch, soft-lock reason codes).
4. Her alt adimdan sonra `07_*` checklist satirini `[x]` olarak isaretle.
5. Smoke template sonucunu `pass|fail|blocked` olarak doldur.

## Tasks
- [x] `listCompanyRouteStops` parser
- [x] `upsertCompanyRouteStop` parser
- [x] `deleteCompanyRouteStop` parser
- [x] `reorderCompanyRouteStops` parser (`changed`, `updatedAt`)
- [x] `listActiveTripsByCompany` parser
- [x] `liveState` (`online|stale`) UI mapping
- [x] `live.source` (`rtdb|trip_doc`) fallback mapping
- [x] RTDB stream state mapping (`live`, `mismatch`, `error`, `access_denied`)
- [x] `426 Upgrade Required`
- [x] `UPDATE_TOKEN_MISMATCH`
- [x] `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`
- [x] `ROUTE_STOP_INVALID_STATE`
- [x] `ROUTE_STOP_REORDER_STATE_INVALID`

## Acceptance
- Durak ekle/sil/sirala akislarinda soft-lock senaryolari dogru reason-code ile geri donuyor.
- RTDB stream kopma/yeniden baglanma sonrasi fallback semantigi korunuyor.
- 426 ve conflict kodlari kullaniciya eyleme donuk mesajla gosteriliyor.

## Smoke Evidence Protocol
- Evidence file: `website/app-impact/15_phase9_app_sprint2_smoke_template_latest.json`
- Her test satirinda `pass|fail|blocked` ve kisa not zorunlu.
- Block durumunda endpoint + code + sample payload eklenmeli.
