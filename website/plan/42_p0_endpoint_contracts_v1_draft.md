# P0 Endpoint Contracts V1 Draft (Web-Focused)

Tarih: 2026-02-24
Durum: V1 freeze candidate (Faz 1-3 implementation baseline)

## 1. Amac

`35_p0_endpoint_contracts_outline.md` dokumanini daha somut kontrat taslagina cevirmek.

Bu dokuman:
- endpoint isimleri
- request/response alanlari
- authz beklentisi
- audit zorunlulugu
- hata kodu davranisi
icin implementation oncesi netlik saglar.

Not:
- Final schema kod tarafinda Zod/TS ile yazilacak.
- Burasi "contract freeze" taslagidir.

Referanslar:
- `07_permissions_matrix.md`
- `08_domain_model_company_rbac.md`
- `21_live_ops_read_model_adr.md`

## 2. Ortak Response Standardi

### Success Envelope

```json
{
  "requestId": "req_...",
  "serverTime": "2026-02-24T12:00:00.000Z",
  "data": {}
}
```

### Error Envelope (user-safe)

```json
{
  "requestId": "req_...",
  "code": "permission-denied",
  "message": "Bu islem icin yetkin yok.",
  "details": {
    "reason": "ROLE_NOT_ALLOWED"
  }
}
```

Kurallar:
- `message` kullaniciya gosterilebilir olacak
- `details.reason` geliştirici/policy tanı amacli, Ingilizce/sabit enum mantiginda tutulacak
- PII `details` icinde donulmez

## 2.1 Ortak Data Semantikleri (Locked)

### Zaman formatı

- Tum timestamp alanlari UTC ISO-8601 string
- Ornek: `2026-02-24T12:00:00.000Z`

### Kimlik (ID) formatı

Kural:
- Gercek ID formatı server tarafinda opaque olabilir
- Dokumandaki `cmp_...`, `veh_...`, `route_...` sadece semantik ornek prefix'tir

### Pagination standardı (MVP)

Read endpointlerinde (listeleme):
- `pageSize` opsiyonel
- `pageToken` opsiyonel
- response `nextPageToken`

MVP limits:
- varsayilan `pageSize = 20`
- max `pageSize = 100`

### Patch semantiği (mutasyon endpointleri)

`patch` objesi kullanilan endpointlerde:
- alan yoksa = degismez
- `null` verilirse = field clear (yalniz nullable alanlarda)
- bos string = validation policy'ye gore ya hata ya da normalize

Bu kural kodda Zod + mutasyon helper ile korunacak.

## 3. Ortak Authz Standardi

Tum mutasyon endpointlerinde asgari kontrol:
1. authenticated user
2. tenant/company context (gerekliyse)
3. role/permission policy
4. resource ownership/tenant match

Kural:
- UI route guard yetmez
- server-side authz zorunlu
- tenant uyumu "actor company member mi?" ve "target resource ayni tenantta mi?" diye iki ayri kontroldur

Ek kural:
- Company endpointlerinde `companyId` request alanı ile resource tenant'i match etmeli
- `TENANT_MISMATCH` reason kodu kullanilir
- `resourceId belongs to companyId` çapraz dogrulama zorunludur (ornegin `routeId_B` + `companyId_A` payloadi reject)

## 3.1 Audit Standardi (Locked)

Kritik mutasyonlarda audit zorunlu.

Audit minimum alanlari:
- `companyId` (varsa)
- `actorUid`
- `eventType`
- `targetType`
- `targetId`
- `status`
- `requestId`
- `createdAt`

## 3.2 Idempotency Standardi (MVP)

Asagidaki mutasyonlarda `idempotencyKey` desteklenmesi onerilir (ve P0 implementation'da hedeflenir):
- `inviteCompanyMember`
- `grantDriverRoutePermissions`
- `revokeDriverRoutePermissions`
- (opsiyonel) `createCompanyRoute` / `createVehicle` form double-submit korumasi icin

Kural:
- UI retry/double-click durumlarinda duplicate kayit riskini azaltir

## 3.3 Versioning / Concurrency Notu (Review sonrasi ek, MVP-cut revize)

MVP'de route/stop/trip mutasyonlari icin minimum koruma:
- `lastKnownUpdateToken` (Firestore `updateTime` esdegeri/version token) -> backend tarafinda enforce edilen conflict guard
- trip create/start -> route snapshot referansi veya snapshot payload

Post-pilot/full model adaylari:
- `expectedVersion` (genis optimistic concurrency)
- `routeVersionId` (publish/versioning semantigi acildiginda)

Detay plan:
- `62_route_trip_versioning_recurrence_timezone_dst_and_concurrent_editing_spec.md`

## 4. P0 Endpoint Seti (V1 Draft)

## 4.1 Company + Membership

### `createCompany`

Amac:
- Ilk firma tenant kaydini olusturur
- Olusturan kullanici `owner` olur

Auth:
- signed-in user

Request:
```json
{
  "name": "Acme Servis",
  "contactEmail": "ops@acme.com",
  "contactPhone": "+90555..."
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "ownerMember": {
    "uid": "uid_...",
    "role": "owner",
    "status": "active"
  },
  "createdAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `company_created`
- `company_member_created` (owner bootstrap)

Errors:
- `invalid-argument`
- `failed-precondition` (policy/restriction)
- `resource-exhausted` (rate-limit)

### `listMyCompanies`

Amac:
- Login sonrasi company mode selector'u beslemek

Auth:
- signed-in user

Request:
```json
{}
```

Response:
```json
{
  "items": [
    {
      "companyId": "cmp_...",
      "name": "Acme Servis",
      "role": "dispatcher",
      "memberStatus": "active"
    }
  ]
}
```

Errors:
- `unauthenticated`

### `inviteCompanyMember`

Amac:
- Firma panel kullanicisi davet etmek

Auth:
- `owner | admin`

Request:
```json
{
  "companyId": "cmp_...",
  "email": "user@example.com",
  "role": "dispatcher",
  "idempotencyKey": "uuid-or-client-key"
}
```

Response:
```json
{
  "inviteId": "inv_...",
  "status": "pending",
  "role": "dispatcher",
  "expiresAt": "2026-03-03T12:00:00.000Z"
}
```

Audit:
- `company_member_invited`

Errors:
- `permission-denied`
- `invalid-argument`
- `already-exists` (aktif uye)
- `failed-precondition` (role policy)

### `setCompanyMemberRole`

Amac:
- Uye rolunu degistirmek

Auth:
- `owner` (MVP)
- `admin` kisitli destek Faz 2 degerlendirme

Request:
```json
{
  "companyId": "cmp_...",
  "targetUid": "uid_...",
  "role": "viewer"
}
```

Response:
```json
{
  "targetUid": "uid_...",
  "role": "viewer",
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `company_member_role_changed`

Errors:
- `permission-denied`
- `failed-precondition`
  - `SELF_ESCALATION_FORBIDDEN`
  - `OWNER_ROLE_CHANGE_FORBIDDEN`
- `not-found`

MVP policy lock:
- `admin` kullanicisi `owner` rolune atama yapamaz
- son owner'in role dusurulmesi/silinmesi engellenir (faz 1/2 implementation)

## 4.2 Driver + Vehicle

### `listCompanyDrivers`

Auth:
- `owner | admin | dispatcher | viewer`

Request:
```json
{
  "companyId": "cmp_...",
  "query": "ali",
  "status": "active",
  "pageSize": 20,
  "pageToken": null
}
```

Response:
```json
{
  "items": [
    {
      "driverUid": "uid_...",
      "name": "Ali Veli",
      "phoneMasked": "+90***",
      "status": "active",
      "assignedVehicleCount": 1
    }
  ],
  "nextPageToken": null
}
```

### `createVehicle`

Auth:
- `owner | admin | dispatcher`

Request (company vehicle):
```json
{
  "ownerType": "company",
  "companyId": "cmp_...",
  "plate": "34ABC123",
  "brand": "Ford",
  "model": "Transit",
  "year": 2021,
  "capacity": 16
}
```

Request (individual vehicle, MVP optional path):
```json
{
  "ownerType": "individual_driver",
  "driverUid": "uid_...",
  "plate": "34ABC123"
}
```

Response:
```json
{
  "vehicleId": "veh_...",
  "createdAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `vehicle_created`

Errors:
- `invalid-argument`
- `permission-denied`
- `already-exists` (plate policy varsa)

### `updateVehicle`

Auth:
- `owner | admin | dispatcher` (tenant match)

Request:
```json
{
  "vehicleId": "veh_...",
  "companyId": "cmp_...",
  "patch": {
    "status": "maintenance",
    "capacity": 14
  }
}
```

Response:
```json
{
  "vehicleId": "veh_...",
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `vehicle_updated`

Errors:
- `not-found`
- `permission-denied`
- `invalid-argument`

## 4.3 Company-Aware Route + Stop Mutations

### `createCompanyRoute`

Auth:
- `owner | admin | dispatcher`

Request:
```json
{
  "companyId": "cmp_...",
  "name": "Sabah Vardiya A",
  "startPoint": { "lat": 40.0, "lng": 29.0 },
  "startAddress": "Baslangic",
  "endPoint": { "lat": 40.1, "lng": 29.1 },
  "endAddress": "Bitis",
  "scheduledTime": "08:00",
  "timeSlot": "morning",
  "allowGuestTracking": true,
  "authorizedDriverIds": ["uid_driver_1"],
  "idempotencyKey": "uuid-or-client-key"
}
```

Response:
```json
{
  "routeId": "route_...",
  "srvCode": "ABC123"
}
```

Audit:
- `route_created`

Errors:
- `permission-denied`
- `invalid-argument`
- `failed-precondition` (tenant/driver mismatch)

### `updateCompanyRoute`

Auth:
- `owner | admin | dispatcher` + tenant match

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "lastKnownUpdateToken": "2026-02-24T12:00:00.000Z",
  "patch": {
    "name": "Sabah Vardiya A-1",
    "scheduledTime": "08:15",
    "authorizedDriverIds": ["uid_driver_1", "uid_driver_2"]
  }
}
```

Response:
```json
{
  "routeId": "route_...",
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `route_updated`

Policy notu:
- `routeId` ilgili `companyId` tenant'i icinde degilse `TENANT_MISMATCH`
- aktif trip varsa yapisal route degisiklikleri (stop delete/reorder vb.) `failed-precondition` ile deny edilebilir (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`)

### `upsertCompanyRouteStop`

Auth:
- `owner | admin | dispatcher`
- veya route permission ile izinli operator (faz 3 genisleme)

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "lastKnownUpdateToken": "2026-02-24T12:00:00.000Z",
  "stopId": null,
  "name": "Durak 1",
  "location": { "lat": 40.01, "lng": 29.01 },
  "order": 0
}
```

Response:
```json
{
  "routeId": "route_...",
  "stopId": "stop_...",
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `route_stop_upserted`

Policy notu:
- aktif trip varsa yapisal degisiklik (order/insert/delete) endpoint policy'sine gore deny edilebilir (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`)

### `deleteCompanyRouteStop`

Auth:
- `owner | admin | dispatcher`

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "lastKnownUpdateToken": "2026-02-24T12:00:00.000Z",
  "stopId": "stop_..."
}
```

Response:
```json
{
  "routeId": "route_...",
  "stopId": "stop_...",
  "deleted": true
}
```

Audit:
- `route_stop_deleted`

Policy notu:
- aktif trip varsa stop delete MVP'de server-side soft-lock ile deny edilebilir

## 4.4 Route-Level Driver Permissions

### `grantDriverRoutePermissions`

Auth:
- `owner | admin | dispatcher`

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "driverUid": "uid_driver_1",
  "idempotencyKey": "uuid-or-client-key",
  "permissions": {
    "canStartFinishTrip": true,
    "canSendAnnouncements": true,
    "canViewPassengerList": true,
    "canEditAssignedRouteMeta": false,
    "canEditStops": false,
    "canManageRouteSchedule": false
  }
}
```

Response:
```json
{
  "routeId": "route_...",
  "driverUid": "uid_driver_1",
  "permissions": {
    "canStartFinishTrip": true,
    "canSendAnnouncements": true,
    "canViewPassengerList": true,
    "canEditAssignedRouteMeta": false,
    "canEditStops": false,
    "canManageRouteSchedule": false
  },
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `route_driver_permissions_granted`

### `revokeDriverRoutePermissions`

Auth:
- `owner | admin | dispatcher`

Request (partial revoke):
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "driverUid": "uid_driver_1",
  "idempotencyKey": "uuid-or-client-key",
  "permissionKeys": ["canSendAnnouncements"]
}
```

Request (full reset):
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "driverUid": "uid_driver_1",
  "resetToDefault": true
}
```

Response:
```json
{
  "routeId": "route_...",
  "driverUid": "uid_driver_1",
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `route_driver_permissions_revoked`

## 4.5 Live Ops + Audit Reads (P1/P2)

### `listActiveTripsByCompany`

Auth:
- `owner | admin | dispatcher | viewer`

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": null,
  "driverUid": null,
  "pageSize": 50
}
```

Response:
```json
{
  "items": [
    {
      "tripId": "trip_...",
      "routeId": "route_...",
      "routeName": "Sabah Vardiya A",
      "driverUid": "uid_driver_1",
      "driverName": "Ali Veli",
      "status": "active",
      "lastLocationAt": "2026-02-24T11:58:00.000Z",
      "live": {
        "lat": 40.0,
        "lng": 29.0,
        "source": "rtdb",
        "stale": false
      }
    }
  ]
}
```

Kural:
- `live.source` alanı MVP'de `rtdb | projection` olabilir
- stale hesaplama standardi backend tarafinda yapilmali (UI'da duplicate kural yok)

### `listAuditLogs`

Auth:
- `owner | admin | dispatcher | viewer` (field/filter policy role'e gore)

Request:
```json
{
  "companyId": "cmp_...",
  "eventType": null,
  "actorUid": null,
  "dateFrom": "2026-02-01T00:00:00.000Z",
  "dateTo": "2026-02-24T23:59:59.999Z",
  "pageSize": 50,
  "pageToken": null
}
```

Response:
```json
{
  "items": [
    {
      "auditId": "audit_...",
      "eventType": "route_updated",
      "actorUid": "uid_...",
      "targetType": "route",
      "targetId": "route_...",
      "status": "success",
      "createdAt": "2026-02-24T12:00:00.000Z"
    }
  ],
  "nextPageToken": null
}
```

## 5. Error Code / Detail Standard (P0)

Common `code` values:
- `invalid-argument`
- `unauthenticated`
- `permission-denied`
- `not-found`
- `already-exists`
- `failed-precondition`
- `resource-exhausted`
- `conflict`
- `internal`

Suggested `details.reason` values:
- `TENANT_MISMATCH`
- `ROLE_NOT_ALLOWED`
- `PERMISSION_FLAG_MISSING`
- `SELF_ESCALATION_FORBIDDEN`
- `OWNER_ROLE_CHANGE_FORBIDDEN`
- `ROUTE_NOT_IN_COMPANY`
- `DRIVER_NOT_IN_COMPANY`
- `LAST_OWNER_PROTECTION`
- `IDEMPOTENCY_REPLAY`
- `UPDATE_TOKEN_MISMATCH`
- `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`

## 6. Contract Freeze Scope (Faz 1 kod oncesi)

Asagidaki endpointler "V1 draft frozen" olmalı:
- `createCompany`
- `listMyCompanies`
- `inviteCompanyMember`
- `setCompanyMemberRole`
- `createVehicle`
- `updateVehicle`
- `createCompanyRoute`
- `updateCompanyRoute`
- `upsertCompanyRouteStop`
- `grantDriverRoutePermissions`

Kural:
- Breaking degisiklik olursa ADR + migration notu zorunlu.

## 7. Fazlara Gore Freeze Seviyesi

Faz 1 freeze:
- auth shell'i etkileyen company/member temel read/write endpointleri

Faz 2 freeze:
- individual/company route-stop mutasyon endpointleri

Faz 3 freeze:
- route permission + live ops read endpointleri

Not:
- "V1 freeze candidate" implementation sirasinda minör alan/isim iyilestirmesi alabilir.
- Breaking degisiklikler karar kaydina islenir.
