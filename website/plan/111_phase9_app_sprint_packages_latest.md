# Faz 9 App Sprint Packages

Tarih: 2026-02-28 01:47:12
Durum: PASS

## Ozet
| Paket | Oncelik | Toplam | Tamam | Acik |
| --- | --- | --- | --- | --- |
| APP-SPRINT-1 | P0 | 9 | 9 | 0 |
| APP-SPRINT-2 | P0 | 13 | 13 | 0 |
| APP-SPRINT-3 | P1 | 14 | 14 | 0 |
| APP-SPRINT-4 | P0 | 12 | 12 | 0 |
| Toplam | - | 48 | 48 | 0 |

## APP-SPRINT-1 - Company Context + Vehicle + Route Base Parser
- Oncelik: P0
- W2A kapsami: W2A-004, W2A-006, W2A-007, W2A-008, W2A-009, W2A-010, W2A-011, W2A-012
- Acik kalem: 0/9
- Yapilacaklar:
  - [x] `createCompany` response parser (`companyId`, `ownerMember`, `createdAt`)
  - [x] `listMyCompanies` parser (`companyId`, `name`, `role`, `memberStatus`)
  - [x] `listCompanyMembers` parser (`uid`, `role`, `memberStatus`, `displayName/email/phone`)
  - [x] Active company resolver (login -> mode -> company fallback)
  - [x] `listCompanyVehicles` parser
  - [x] `createVehicle` parser
  - [x] `updateVehicle` parser
  - [x] `createCompanyRoute` parser (`routeId`, `srvCode`)
  - [x] `updateCompanyRoute` parser + `lastKnownUpdateToken` parity
- Kabul Kriterleri:
  - Company secimi login sonrasi deterministic fallback ile aciliyor.
  - Vehicle/Route create-update parser katmaninda crash olmadan isleniyor.
  - Token mismatch mesaji UI'da anlasilir gosteriliyor.

## APP-SPRINT-2 - Route Stops + Live Ops + Critical Error Mapping
- Oncelik: P0
- W2A kapsami: W2A-001, W2A-002, W2A-003, W2A-013, W2A-014, W2A-015, W2A-016, W2A-017
- Acik kalem: 0/13
- Yapilacaklar:
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
- Kabul Kriterleri:
  - Durak ekle/sil/sirala akislarinda soft-lock senaryolari dogru reason-code ile geri donuyor.
  - RTDB stream kopma/yeniden baglanma sonrasi fallback semantigi korunuyor.
  - 426 ve conflict kodlari kullaniciya eyleme donuk mesajla gosteriliyor.

## APP-SPRINT-3 - Membership/Permission Parser + Guard Error Mapping
- Oncelik: P1
- W2A kapsami: W2A-100, W2A-101, W2A-102, W2A-103, W2A-104, W2A-105, W2A-106
- Acik kalem: 0/14
- Yapilacaklar:
  - [x] `updateCompanyMember` parser + guard copy mapping
  - [x] `inviteCompanyMember` parser + pending state mapping
  - [x] `acceptCompanyInvite` parser + invited->active transition
  - [x] `declineCompanyInvite` parser + invited->suspended transition
  - [x] `removeCompanyMember` parser + owner/self deny mapping
  - [x] `grantDriverRoutePermissions` parser
  - [x] `revokeDriverRoutePermissions` parser
  - [x] `listRouteDriverPermissions` parser
  - [x] `OWNER_MEMBER_IMMUTABLE`
  - [x] `SELF_MEMBER_REMOVE_FORBIDDEN`
  - [x] `INVITE_EMAIL_NOT_FOUND`
  - [x] `INVITE_NOT_ACCEPTABLE`
  - [x] `INVITE_NOT_DECLINABLE`
  - [x] `ROUTE_PRIMARY_DRIVER_IMMUTABLE`
- Kabul Kriterleri:
  - Invite accept/decline ve member update/remove akislari parser seviyesinde deterministik.
  - Owner/self guard reason-code'lari dogru UI mesajina mapleniyor.
  - Route permission grant/revoke/list sonuclari role-state tutarli.

## APP-SPRINT-4 - Acceptance Smoke + Cutover Checklist Closure
- Oncelik: P0
- W2A kapsami: W2A-001, W2A-002, W2A-003, W2A-004
- Acik kalem: 0/12
- Yapilacaklar:
  - [x] Parser crash-free smoke (all listed callables)
  - [x] Error message mapping smoke (all listed codes)
  - [x] Company context recoverability (logout/login + mode switch)
  - [x] Route/stop conflict recovery (token mismatch -> reload -> retry)
  - [x] Live ops fallback correctness (RTDB yoksa trip_doc, stale semantigi korunur)
  - [x] `00_web_to_app_change_register.md` icindeki `P0` kayitlar triaged/planned
  - [x] `contract` kategorisindeki kayitlar icin app error mapping karari net
  - [x] force update / `426` fallback davranisi app tarafinda tanimli (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
  - [x] live ops stale/offline semantigi app + web tutarli (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
  - [x] route/trip mutasyon lock reason code'lari app tarafinda ele aliniyor (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
  - [x] cutover oncesi app regression smoke checklist hazir (`website/app-impact/13_app_regression_smoke_checklist_phase9.md`)
  - [x] "wont_do_mvp" kararlar reviewer/plan notlarinda acik
- Kabul Kriterleri:
  - Parser crash-free smoke tum listedeki callable setinde PASS.
  - Error mapping smoke listedeki tum zorunlu reason-code'larda PASS.
  - 03 app integration cutover checklist maddeleri eksiksiz kapali.

## Sonraki 4 Adim
1. APP-SPRINT-1'i parser stabilitesi icin once kapat.
2. APP-SPRINT-2 ile live-ops + soft-lock reason-code semantigini netlestir.
3. APP-SPRINT-3 ile membership/permission guard mapping'i tamamla.
4. APP-SPRINT-4 acceptance smoke + cutover checklist closure ile final gate'e gec.
