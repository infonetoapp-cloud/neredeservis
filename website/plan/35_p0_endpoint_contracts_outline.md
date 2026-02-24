# P0 Endpoint Contracts Outline (Web Backend Extension)

Tarih: 2026-02-24
Durum: V0 / Faz 1-3 taslak kontrat

## 1. Amac

Kod yazmadan once P0 endpointlerin:
- request/response
- authz
- audit
- error code
beklentisini netlestirmek.

Bu dokuman final API spec degil; implementation-oncesi kontrat taslagi.

## 2. Genel Kontrat Kurallari (tum endpointler)

### 2.1 Response envelope

Standard:
- `requestId`
- `serverTime`
- `data`

Hata:
- `code`
- `message` (user-safe)
- `requestId`
- `details` (opsiyonel, safe)

### 2.2 Authz

Her mutasyonda:
- auth session
- mode/tenant context
- role/permission policy

### 2.3 Audit

Kritik mutasyon endpointleri audit log uretir.

### 2.4 Idempotency

Aday endpointlerde desteklenecek:
- invite/member mutasyonlari
- route permission grant/revoke
- force-finish benzeri operator mutasyonlari

## 3. P0 Endpoint Kumesi (Phase ordering)

## 3.1 Company / Membership (P0)

### `createCompany`

Auth:
- signed-in user

Request (taslak):
- `name`
- `contactEmail?`
- `contactPhone?`

Response:
- `companyId`
- `ownerMember`
- `createdAt`

Audit:
- `company_created`

Errors:
- `invalid-argument`
- `already-exists` (uygunsa)

### `inviteCompanyMember`

Auth:
- `owner | admin`

Request:
- `companyId`
- `email`
- `role`

Response:
- `inviteId`
- `status` (`pending`)
- `expiresAt?`

Audit:
- `company_member_invited`

Errors:
- `permission-denied`
- `failed-precondition` (owner/admin kuralı)
- `already-exists`

### `setCompanyMemberRole`

Auth:
- `owner` (veya policy ile `admin` kisitli)

Request:
- `companyId`
- `targetUid`
- `role`

Response:
- `targetUid`
- `role`
- `updatedAt`

Audit:
- `company_member_role_changed`

### `listCompanyMembers`

Auth:
- `owner|admin|dispatcher|viewer` (read policy)

Request:
- `companyId`
- `pageToken?`
- `pageSize?`

Response:
- `items[]`
- `nextPageToken?`

## 3.2 Driver / Vehicle (P0)

### `listCompanyDrivers`

Auth:
- `owner|admin|dispatcher|viewer`

Request:
- `companyId`
- filters? (`status`, `query`)

Response:
- `items[]`

### `createVehicle`

Auth:
- `owner|admin|dispatcher`

Request:
- `companyId?`
- `ownerType`
- `driverUid?`
- `plate`
- `brand?`
- `model?`
- `year?`
- `capacity?`

Response:
- `vehicleId`
- `createdAt`

Audit:
- `vehicle_created`

### `updateVehicle`

Auth:
- `owner|admin|dispatcher`

Request:
- `vehicleId`
- patch fields

Response:
- `vehicleId`
- `updatedAt`

Audit:
- `vehicle_updated`

## 3.3 Company-Aware Routes/Stops (P0/P1)

### `createCompanyRoute`

Auth:
- `owner|admin|dispatcher`

Request:
- `companyId`
- route fields (name, schedule, points, allowGuestTracking, ...)
- `authorizedDriverIds[]?`

Response:
- `routeId`
- `srvCode`

Audit:
- `route_created`

### `updateCompanyRoute`

Auth:
- `owner|admin|dispatcher` + route tenant ownership

Request:
- `companyId`
- `routeId`
- patch fields

Response:
- `routeId`
- `updatedAt`

Audit:
- `route_updated`

### `upsertCompanyRouteStop`

Auth:
- role + route policy

Request:
- `companyId`
- `routeId`
- `stopId?`
- `name`
- `location`
- `order`

Response:
- `routeId`
- `stopId`
- `updatedAt`

Audit:
- `route_stop_upserted`

### `deleteCompanyRouteStop`

Auth:
- role + route policy

Request:
- `companyId`
- `routeId`
- `stopId`

Response:
- `deleted: true`

Audit:
- `route_stop_deleted`

## 3.4 Route-Level Driver Permissions (P0/P1)

### `grantDriverRoutePermissions`

Auth:
- `owner|admin|dispatcher`

Request:
- `companyId`
- `routeId`
- `driverUid`
- `permissions`

Response:
- `routeId`
- `driverUid`
- `permissions`
- `updatedAt`

Audit:
- `route_driver_permissions_granted`

### `revokeDriverRoutePermissions`

Auth:
- `owner|admin|dispatcher`

Request:
- `companyId`
- `routeId`
- `driverUid`
- `permissionKeys[]` or full revoke

Response:
- `routeId`
- `driverUid`
- `updatedAt`

Audit:
- `route_driver_permissions_revoked`

## 3.5 Live Ops / Audit (P1)

### `listActiveTripsByCompany`

Auth:
- `owner|admin|dispatcher|viewer`

Request:
- `companyId`
- filters? (`routeId`, `driverUid`)

Response:
- `items[]`
- minimal trip/live summary

### `getLiveOpsSnapshot` (opsiyonel P1, kesin P2)

Auth:
- `owner|admin|dispatcher|viewer`

Request:
- `companyId`

Response:
- aggregate counts
- active trips summary
- stale flags

### `listAuditLogs`

Auth:
- `owner|admin|dispatcher|viewer` (role bazli alan/filtre kisitli)

Request:
- `companyId`
- filters (`eventType`, `actor`, `dateRange`)
- paging

Response:
- `items[]`
- `nextPageToken?`

## 4. Error Code Taxonomy (taslak)

Common:
- `invalid-argument`
- `unauthenticated`
- `permission-denied`
- `not-found`
- `already-exists`
- `failed-precondition`
- `resource-exhausted`
- `internal`

Policy-specific (message/detail alaninda):
- `TENANT_MISMATCH`
- `ROLE_NOT_ALLOWED`
- `PERMISSION_FLAG_MISSING`
- `SELF_ESCALATION_FORBIDDEN`

## 5. Versionlama Stratejisi (MVP)

MVP:
- mevcut callable stiline uyumlu ilerlenebilir
- ama endpoint ad/kontratlari versionlanabilir dusunulmeli

Oneri:
- dokuman seviyesinde `v1` etiketi kullan
- breaking change durumunda ADR + migration plani

## 6. P0 Contract Freeze Kuralı

Faz 1/2 implementation baslamadan once su endpointler en az V1 taslakta dondurulur:
- `createCompany`
- `inviteCompanyMember`
- `setCompanyMemberRole`
- `createVehicle`
- `updateVehicle`
- `createCompanyRoute`
- `updateCompanyRoute`
- `upsertCompanyRouteStop`
- `grantDriverRoutePermissions`
