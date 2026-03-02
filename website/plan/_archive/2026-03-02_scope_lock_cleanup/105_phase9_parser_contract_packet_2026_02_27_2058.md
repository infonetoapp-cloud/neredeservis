# Faz 9 Parser Contract Packet

Tarih: 2026-02-27 20:58:37
Durum: PASS

## Ozet
- Kontrat kaynagi: website/app-impact/04_api_contract_diff_register.md
- Paket kapsami: API-DIFF-001..024 (admin-only endpointler disarida)
- Cikarilan endpoint sayisi: 24
- App pending endpoint sayisi: 24
- Error-code cekirdek seti: 11

## Endpoint Paketi (App Parser Referansi)
| API-DIFF | Endpoint | Tip | Durum | App Layer |
| --- | --- | --- | --- | --- |
| API-DIFF-001 | Legacy mobile mutasyon endpointleri (`v1` yollar) | versioning | web-partial-app-pending | network error mapping / router / session |
| API-DIFF-002 | Route/trip mutasyon reason codes | error_code | implemented-web-app-pending | driver route management / active trip actions |
| API-DIFF-003 | `createCompany` (Firebase callable, `europe-west3`) | request | implemented-web-runtime-validated-app-pending | future company onboarding / company setup flow |
| API-DIFF-004 | `listMyCompanies` (Firebase callable, `europe-west3`) | response | implemented-web-runtime-validated-app-pending | role/mode/company resolver, auth sonrasi routing |
| API-DIFF-005 | `listCompanyMembers` (Firebase callable, `europe-west3`) | response | implemented-web-runtime-validated-app-pending | company member list flows, company context secimi sonrasi operasyon ekranlari |
| API-DIFF-006 | `listCompanyRoutes` (Firebase callable, `europe-west3`) | response | implemented-web-runtime-validated-app-pending` (response expanded; app parser parity pending) | route list/read flows, company context secimi sonrasi route screens |
| API-DIFF-007 | `listCompanyVehicles` (Firebase callable, `europe-west3`) | response | implemented-web-runtime-validated-app-pending | vehicle list/read flows, company context secimi sonrasi vehicle screens |
| API-DIFF-008 | `createVehicle` (Firebase callable, `europe-west3`) | request | implemented-web-runtime-validated-app-pending | future vehicle create forms, error mapping, company context guards |
| API-DIFF-009 | `updateVehicle` (Firebase callable, `europe-west3`) | request | implemented-web-runtime-validated-app-pending | future vehicle edit drawer/forms, assignment/maintenance status flows, error mapping |
| API-DIFF-010 | `createCompanyRoute` (Firebase callable, `europe-west3`) | request+response | implemented-web-runtime-validated-app-pending | future route create forms, company route onboarding, error mapping / route create feedback katmani |
| API-DIFF-011 | `updateCompanyRoute` (Firebase callable, `europe-west3`) | request | implemented-web-runtime-validated-app-pending` (authorizedDriverIds patch UI aktif) | future route edit forms, route detail drawer, error mapping / conflict feedback |
| API-DIFF-012 | `listCompanyRouteStops` (Firebase callable, `europe-west3`) | response | implemented-web-runtime-validated-app-pending | future route stop list/read flows, route detail drawer stop panels |
| API-DIFF-013 | `upsertCompanyRouteStop` (Firebase callable, `europe-west3`) | request+response | implemented-web-runtime-validated-app-pending | future route stop add/edit forms, route mutation error mapping / conflict feedback |
| API-DIFF-014 | `deleteCompanyRouteStop` (Firebase callable, `europe-west3`) | request+response | implemented-web-runtime-validated-app-pending | future route stop delete actions, route stop editor shell state, mutation error mapping/conflict feedback |
| API-DIFF-015 | `reorderCompanyRouteStops` (Firebase callable, `europe-west3`) | request+response | implemented-web-runtime-validated-app-pending | future route stop reorder actions, route detail shell state refresh, mutation error mapping/conflict feedback |
| API-DIFF-016 | `listActiveTripsByCompany` (Firebase callable, `europe-west3`) | response | implemented-web-runtime-validated-app-pending | future company live-ops trip feed/list, live status chips, RTDB/Firestore live read adapters |
| API-DIFF-017 | `updateCompanyMember` (Firebase callable, `europe-west3`) | request+response+authz | implemented-web-runtime-validated-app-pending | future company member role/status mutation forms, authz guard feedback mapping, company member list refresh orchestrasyonu |
| API-DIFF-018 | `inviteCompanyMember` (Firebase callable, `europe-west3`) | request+response+authz | implemented-web-runtime-validated-app-pending | future company member invite forms, invited-state rendering, authz/error feedback mapping |
| API-DIFF-019 | `acceptCompanyInvite` (Firebase callable, `europe-west3`) | request+response+authz | implemented-web-runtime-validated-app-pending | future invite acceptance flow, company chooser state/cache refresh, onboarding feedback mapping |
| API-DIFF-020 | `declineCompanyInvite` (Firebase callable, `europe-west3`) | request+response+authz | implemented-web-runtime-validated-app-pending | future invite decline flow, company chooser membership state/copy mapping, onboarding action guards |
| API-DIFF-021 | `removeCompanyMember` (Firebase callable, `europe-west3`) | request+response+authz | implemented-web-runtime-validated-app-pending | future member remove actions, member list cache/selection fallback, policy/error feedback mapping |
| API-DIFF-022 | `grantDriverRoutePermissions` (Firebase callable, `europe-west3`) | request+response+authz | implemented-web-runtime-validated-app-pending | future route permission grant actions, permission object parser, route membership sync UX |
| API-DIFF-023 | `revokeDriverRoutePermissions` (Firebase callable, `europe-west3`) | request+response+authz | implemented-web-runtime-validated-app-pending | future route permission revoke actions, primary-driver guard UX, mutation error feedback mapping |
| API-DIFF-024 | `listRouteDriverPermissions` (Firebase callable, `europe-west3`) | response+authz | implemented-web-runtime-validated-app-pending | future route permission list/read hooks, permission summary cards, cache refresh orchestration |

## Error Code Paketi (App Mapping Referansi)
- 426 Upgrade Required
- UPDATE_TOKEN_MISMATCH
- ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED
- ROUTE_STOP_INVALID_STATE
- ROUTE_STOP_REORDER_STATE_INVALID
- OWNER_MEMBER_IMMUTABLE
- SELF_MEMBER_REMOVE_FORBIDDEN
- INVITE_EMAIL_NOT_FOUND
- INVITE_NOT_ACCEPTABLE
- INVITE_NOT_DECLINABLE
- ROUTE_PRIMARY_DRIVER_IMMUTABLE

## Notlar
- Bu rapor app parser/mapping sprintine kopyalanabilir endpoint paketidir.
- Durum FAIL ise API-DIFF veya checklist kaynaklarinda yapisal eksik vardir.
