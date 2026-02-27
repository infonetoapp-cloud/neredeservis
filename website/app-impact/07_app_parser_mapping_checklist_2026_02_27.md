# App Parser & Error Mapping Checklist (Cutover Core)

Tarih: 2026-02-27  
Durum: Active

## 1) Company Context Core

- [ ] `createCompany` response parser (`companyId`, `ownerMember`, `createdAt`)
- [ ] `listMyCompanies` parser (`companyId`, `name`, `role`, `memberStatus`)
- [ ] `listCompanyMembers` parser (`uid`, `role`, `memberStatus`, `displayName/email/phone`)
- [ ] Active company resolver (login -> mode -> company fallback)

## 2) Route/Stop Core

- [ ] `createCompanyRoute` parser (`routeId`, `srvCode`)
- [ ] `updateCompanyRoute` parser + `lastKnownUpdateToken` parity
- [ ] `listCompanyRouteStops` parser
- [ ] `upsertCompanyRouteStop` parser
- [ ] `deleteCompanyRouteStop` parser
- [ ] `reorderCompanyRouteStops` parser (`changed`, `updatedAt`)

## 3) Vehicle Core

- [ ] `listCompanyVehicles` parser
- [ ] `createVehicle` parser
- [ ] `updateVehicle` parser

## 4) Live Ops Core

- [ ] `listActiveTripsByCompany` parser
- [ ] `liveState` (`online|stale`) UI mapping
- [ ] `live.source` (`rtdb|trip_doc`) fallback mapping
- [ ] RTDB stream state mapping (`live`, `mismatch`, `error`, `access_denied`)

## 5) Membership & Permissions

- [ ] `updateCompanyMember` parser + guard copy mapping
- [ ] `inviteCompanyMember` parser + pending state mapping
- [ ] `acceptCompanyInvite` parser + invited->active transition
- [ ] `declineCompanyInvite` parser + invited->suspended transition
- [ ] `removeCompanyMember` parser + owner/self deny mapping
- [ ] `grantDriverRoutePermissions` parser
- [ ] `revokeDriverRoutePermissions` parser
- [ ] `listRouteDriverPermissions` parser

## 6) Error-Code Mapping (Zorunlu)

- [ ] `426 Upgrade Required`
- [ ] `UPDATE_TOKEN_MISMATCH`
- [ ] `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`
- [ ] `ROUTE_STOP_INVALID_STATE`
- [ ] `ROUTE_STOP_REORDER_STATE_INVALID`
- [ ] `OWNER_MEMBER_IMMUTABLE`
- [ ] `SELF_MEMBER_REMOVE_FORBIDDEN`
- [ ] `INVITE_EMAIL_NOT_FOUND`
- [ ] `INVITE_NOT_ACCEPTABLE`
- [ ] `INVITE_NOT_DECLINABLE`
- [ ] `ROUTE_PRIMARY_DRIVER_IMMUTABLE`

## 7) Acceptance (App Parity)

- [ ] Parser crash-free smoke (all listed callables)
- [ ] Error message mapping smoke (all listed codes)
- [ ] Company context recoverability (logout/login + mode switch)
- [ ] Route/stop conflict recovery (token mismatch -> reload -> retry)
- [ ] Live ops fallback correctness (RTDB yoksa trip_doc, stale semantigi korunur)
