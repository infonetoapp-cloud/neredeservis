# Faz 9 App Workcards

Tarih: 2026-02-27 22:11:45
Durum: PARTIAL

## Ozet
| Paket | Toplam | Tamam | Acik |
| --- | --- | --- | --- |
| Company Context (Secim 1) | 4 | 0 | 4 |
| Route/Stop (Secim 2) | 6 | 0 | 6 |
| Vehicle (Secim 3) | 3 | 0 | 3 |
| Live Ops (Secim 4) | 4 | 0 | 4 |
| Membership (Secim 5) | 8 | 0 | 8 |
| Error Mapping (Secim 6) | 11 | 0 | 11 |
| Acceptance (Secim 7) | 5 | 0 | 5 |
| Toplam | 41 | 0 | 41 |

## Kritik Gate
- W2A-001 durum: web_done_app_pending
- Bu kalem app tarafinda kapanmadan final cutover onayi verilmez.

## Workcard-1: Company + Vehicle Parser
- Kapsam: W2A-004, W2A-006..010
- `createCompany` response parser (`companyId`, `ownerMember`, `createdAt`)
- `listMyCompanies` parser (`companyId`, `name`, `role`, `memberStatus`)
- `listCompanyMembers` parser (`uid`, `role`, `memberStatus`, `displayName/email/phone`)
- Active company resolver (login -> mode -> company fallback)
- `listCompanyVehicles` parser
- `createVehicle` parser
- `updateVehicle` parser

## Workcard-2: Route + Stop Parser
- Kapsam: W2A-011..015
- `createCompanyRoute` parser (`routeId`, `srvCode`)
- `updateCompanyRoute` parser + `lastKnownUpdateToken` parity
- `listCompanyRouteStops` parser
- `upsertCompanyRouteStop` parser
- `deleteCompanyRouteStop` parser
- `reorderCompanyRouteStops` parser (`changed`, `updatedAt`)

## Workcard-3: Live Ops + Error Mapping
- Kapsam: W2A-001, W2A-002, W2A-016, W2A-017
- `listActiveTripsByCompany` parser
- `liveState` (`online|stale`) UI mapping
- `live.source` (`rtdb|trip_doc`) fallback mapping
- RTDB stream state mapping (`live`, `mismatch`, `error`, `access_denied`)
- `426 Upgrade Required`
- `UPDATE_TOKEN_MISMATCH`
- `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`
- `ROUTE_STOP_INVALID_STATE`
- `ROUTE_STOP_REORDER_STATE_INVALID`
- `OWNER_MEMBER_IMMUTABLE`
- `SELF_MEMBER_REMOVE_FORBIDDEN`
- `INVITE_EMAIL_NOT_FOUND`
- `INVITE_NOT_ACCEPTABLE`
- `INVITE_NOT_DECLINABLE`
- `ROUTE_PRIMARY_DRIVER_IMMUTABLE`

## Workcard-4: Membership + Acceptance Smoke
- Kapsam: W2A-100..106
- `updateCompanyMember` parser + guard copy mapping
- `inviteCompanyMember` parser + pending state mapping
- `acceptCompanyInvite` parser + invited->active transition
- `declineCompanyInvite` parser + invited->suspended transition
- `removeCompanyMember` parser + owner/self deny mapping
- `grantDriverRoutePermissions` parser
- `revokeDriverRoutePermissions` parser
- `listRouteDriverPermissions` parser
- Parser crash-free smoke (all listed callables)
- Error message mapping smoke (all listed codes)
- Company context recoverability (logout/login + mode switch)
- Route/stop conflict recovery (token mismatch -> reload -> retry)
- Live ops fallback correctness (RTDB yoksa trip_doc, stale semantigi korunur)
