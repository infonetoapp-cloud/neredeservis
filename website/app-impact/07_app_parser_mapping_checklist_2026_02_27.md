# App Parser & Error Mapping Checklist (Cutover Core)

Tarih: 2026-02-27  
Durum: Active

## 1) Company Context Core

- [x] `createCompany` response parser (`companyId`, `ownerMember`, `createdAt`)
- [x] `listMyCompanies` parser (`companyId`, `name`, `role`, `memberStatus`)
- [x] `listCompanyMembers` parser (`uid`, `role`, `memberStatus`, `displayName/email/phone`)
- [x] Active company resolver (login -> mode -> company fallback)

## 2) Route/Stop Core

- [x] `createCompanyRoute` parser (`routeId`, `srvCode`)
- [x] `updateCompanyRoute` parser + `lastKnownUpdateToken` parity
- [x] `listCompanyRouteStops` parser
- [x] `upsertCompanyRouteStop` parser
- [x] `deleteCompanyRouteStop` parser
- [x] `reorderCompanyRouteStops` parser (`changed`, `updatedAt`)

## 3) Vehicle Core

- [x] `listCompanyVehicles` parser
- [x] `createVehicle` parser
- [x] `updateVehicle` parser

## 4) Live Ops Core

- [x] `listActiveTripsByCompany` parser
- [x] `liveState` (`online|stale`) UI mapping
- [x] `live.source` (`rtdb|trip_doc`) fallback mapping
- [x] RTDB stream state mapping (`live`, `mismatch`, `error`, `access_denied`)

## 5) Membership & Permissions

- [x] `updateCompanyMember` parser + guard copy mapping
- [x] `inviteCompanyMember` parser + pending state mapping
- [x] `acceptCompanyInvite` parser + invited->active transition
- [x] `declineCompanyInvite` parser + invited->suspended transition
- [x] `removeCompanyMember` parser + owner/self deny mapping
- [x] `grantDriverRoutePermissions` parser
- [x] `revokeDriverRoutePermissions` parser
- [x] `listRouteDriverPermissions` parser

## 6) Error-Code Mapping (Zorunlu)

- [x] `426 Upgrade Required`
- [x] `UPDATE_TOKEN_MISMATCH`
- [x] `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`
- [x] `ROUTE_STOP_INVALID_STATE`
- [x] `ROUTE_STOP_REORDER_STATE_INVALID`
- [x] `OWNER_MEMBER_IMMUTABLE`
- [x] `SELF_MEMBER_REMOVE_FORBIDDEN`
- [x] `INVITE_EMAIL_NOT_FOUND`
- [x] `INVITE_NOT_ACCEPTABLE`
- [x] `INVITE_NOT_DECLINABLE`
- [x] `ROUTE_PRIMARY_DRIVER_IMMUTABLE`

## 7) Acceptance (App Parity)

- [x] Parser crash-free smoke (all listed callables)
- [x] Error message mapping smoke (all listed codes)
- [x] Company context recoverability (logout/login + mode switch)
- [x] Route/stop conflict recovery (token mismatch -> reload -> retry)
- [x] Live ops fallback correctness (RTDB yoksa trip_doc, stale semantigi korunur)

## 8) Blokaj Notu (2026-02-27)

- Pub solve blokaji drift/build_runner upgrade ile cozuldu (`drift 2.29.0`, `drift_dev 2.29.0`, `build_runner 2.6.1`).
- Hedef test seti PASS: company parser/mapping + route mutation feedback suite (`flutter test ...`).
- Secim 7 maddeleri unit smoke ile kapatildi:
  - `test/features/company/data/company_contract_parser_smoke_test.dart`
  - `test/features/company/application/company_phase9_acceptance_smoke_test.dart`
  - `test/features/company/application/map_company_live_ops_state_use_case_test.dart`
  - `test/features/company/application/resolve_company_contract_error_message_use_case_test.dart`
  - `test/features/company/data/company_active_context_resolver_test.dart`
  - `test/features/driver/application/plan_route_mutation_write_feedback_use_case_test.dart`
  - `test/features/driver/application/plan_route_mutation_write_failure_handling_use_case_test.dart`
  - `test/features/driver/application/resolve_route_mutation_write_feedback_message_use_case_test.dart`
