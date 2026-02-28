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

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Transaction icinde `companies/*`, `companies/{companyId}/members/{uid}`, `audit_logs/*` ile birlikte MVP read hizini korumak icin `users/{uid}/company_memberships/{companyId}` mirror kaydi da yaziliyor

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

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- MVP implementasyonda Firestore `collectionGroup('members')` yerine `users/{uid}/company_memberships` user-scoped read path kullaniliyor
- Bu bir implementation/read-path karari; public response contract degisikligi degil

### `listCompanyMembers`

Amac:
- Company panelinde firma uyeleri/sofor listesi ekranini beslemek (Faz 2 ilk gercek operasyon listesi)

Auth:
- signed-in user
- aktif company'de `owner | admin | dispatcher | viewer` uyeligi (read)

Request:
```json
{
  "companyId": "cmp_..."
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "items": [
    {
      "uid": "uid_1",
      "role": "owner",
      "memberStatus": "active",
      "displayName": "Sinan",
      "email": "owner@example.com",
      "phone": "+90..."
    }
  ]
}
```

Errors:
- `unauthenticated`
- `invalid-argument` (`companyId` eksik/gecersiz)
- `permission-denied` (aktif company uyeligi yok veya read yetkisi yok)
- `failed-precondition` (member record durumu/role uyumsuz)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Read path: `companies/{companyId}/members/*`
- Profil zenginlesmesi icin `users/{uid}` dokumani okunur; `displayName/email/phone` alanlari opsiyoneldir
- Faz 2 MVP implementasyonda `drivers` ekrani bu endpoint'i "company members listesi" olarak kullanir (driver-only filtre/Faz 2 sonrasi)
- Mevcut response `items[]` + item-level `companyId` dondurur; top-level `memberCount` alani yoktur (web count'u `items.length` uzerinden hesaplar)

### `listCompanyRoutes`

Amac:
- Company panelinde route summary listesi ekranini beslemek (`/routes` Faz 2 read-side vertical slice)

Auth:
- signed-in user
- aktif company'de `owner | admin | dispatcher | viewer` uyeligi (read)

Request:
```json
{
  "companyId": "cmp_...",
  "includeArchived": false,
  "limit": 50
}
```

Response:
```json
{
  "items": [
    {
      "routeId": "route_...",
      "companyId": "cmp_...",
      "name": "Fabrika A - Merkez",
      "srvCode": "AB12CD",
      "driverId": "uid_...",
      "scheduledTime": "08:00",
      "timeSlot": "morning",
      "isArchived": false,
      "allowGuestTracking": true,
      "authorizedDriverIds": ["uid_driver_1", "uid_driver_2"],
      "passengerCount": 14,
      "updatedAt": "2026-02-25T08:40:00.000Z"
    }
  ]
}
```

Errors:
- `unauthenticated`
- `invalid-argument` (`companyId` eksik/gecersiz)
- `permission-denied` (firma uyeligi/yetki yok)
- `failed-precondition` (firma uyeligi aktif degil)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Read path: `routes` koleksiyonu `where('companyId', '==', companyId)` (opsiyonel `isArchived == false`)
- MVP'de in-memory `updatedAt` descending siralama uygulanir (query-side order/index zorlugu acilmadan)
- Faz 2 `/routes` ekrani bu endpoint'i route summary read-side olarak kullanir; `authorizedDriverIds[]` route drawer patch UX'i icin response shape'ina eklendi
- Stop editor v1 sonraki dilimde ayri callables (`listCompanyRouteStops`, `upsertCompanyRouteStop`) ile acildi; summary response intentionally compact tutulur

### `listCompanyVehicles`

Amac:
- Company panelinde vehicle summary listesi ekranini beslemek (`/vehicles` Faz 2 read-side vertical slice)

Auth:
- signed-in user
- aktif company'de `owner | admin | dispatcher | viewer` uyeligi (read)

Request:
```json
{
  "companyId": "cmp_...",
  "limit": 50
}
```

Response:
```json
{
  "items": [
    {
      "vehicleId": "veh_...",
      "companyId": "cmp_...",
      "plate": "34ABC123",
      "status": "active",
      "brand": "Ford",
      "model": "Transit",
      "year": 2021,
      "capacity": 16,
      "updatedAt": "2026-02-25T09:00:00.000Z"
    }
  ]
}
```

Errors:
- `unauthenticated`
- `invalid-argument` (`companyId` eksik/gecersiz)
- `permission-denied` (firma uyeligi/yetki yok)
- `failed-precondition` (firma uyeligi aktif degil)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Read path: `companies/{companyId}/vehicles/*`
- MVP'de in-memory `updatedAt` descending siralama uygulanir
- Faz 2 `/vehicles` ekrani bu endpoint'i vehicle summary read-side olarak kullanir; create/update mutasyonlari sonraki dilim

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
  "role": "dispatcher"
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "inviteId": "inv_...",
  "memberUid": "uid_...",
  "invitedEmail": "user@example.com",
  "role": "dispatcher",
  "status": "pending",
  "expiresAt": "2026-03-03T12:00:00.000Z",
  "createdAt": "2026-02-26T10:00:00.000Z"
}
```

Audit:
- `company_member_invited`

Errors:
- `permission-denied`
- `invalid-argument`
- `already-exists` (aktif uye)
- `failed-precondition` (role policy)

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi.
- V1 davranisi mevcut hesap e-postasi icindir: e-posta Auth'ta yoksa `failed-precondition` + `INVITE_EMAIL_NOT_FOUND` doner.
- Basarili davette `companies/{companyId}/members/{uid}` kaydi `status=invited` olarak yazilir/yenilenir, `users/{uid}/company_memberships/{companyId}` mirror parity korunur ve `member_invites` kaydi acilir.
- Policy lock: yalniz `owner|admin` actor davet acabilir; `admin` actor `admin` daveti acamaz.

### `acceptCompanyInvite`

Amac:
- Davet edilmis kullanicinin company uyeligini aktif etmesi

Auth:
- signed-in user (invite hedefindeki uye)

Request:
```json
{
  "companyId": "cmp_..."
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "memberUid": "uid_...",
  "role": "dispatcher",
  "memberStatus": "active",
  "acceptedAt": "2026-02-26T10:30:00.000Z"
}
```

Audit:
- `company_member_invite_accepted`

Errors:
- `unauthenticated`
- `invalid-argument`
- `not-found` (member kaydi/davet baglami yok)
- `failed-precondition` (`INVITE_NOT_ACCEPTABLE`)

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi.
- Kabulde `companies/{companyId}/members/{uid}` durumu `invited -> active` guncellenir ve `users/{uid}/company_memberships/{companyId}` mirror ayni transaction'da aktiflenir.
- Company icindeki `member_invites` kayitlarinda hedef uid icin `pending` davetler `accepted` olarak kapatilir.
- `/mode-select` ekraninda `memberStatus=invited` satiri bu endpoint'e baglandi; kabul sonrasi company context secilip dashboard'a gecis yapilir.

### `declineCompanyInvite`

Amac:
- Davet edilmis kullanicinin company davetini reddetmesi

Auth:
- signed-in user (invite hedefindeki uye)

Request:
```json
{
  "companyId": "cmp_..."
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "memberUid": "uid_...",
  "role": "dispatcher",
  "memberStatus": "suspended",
  "declinedAt": "2026-02-26T10:35:00.000Z"
}
```

Audit:
- `company_member_invite_declined`

Errors:
- `unauthenticated`
- `invalid-argument`
- `not-found` (member kaydi/davet baglami yok)
- `failed-precondition` (`INVITE_NOT_DECLINABLE`)

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi.
- Redde `companies/{companyId}/members/{uid}` durumu `invited -> suspended` guncellenir ve `users/{uid}/company_memberships/{companyId}` mirror ayni transaction'da askiya cekilir.
- Company icindeki `member_invites` kayitlarinda hedef uid icin `pending` davetler `declined` olarak kapatilir.
- `/mode-select` ekraninda `memberStatus=invited` satiri bu endpoint'e baglandi; red sonrasi satir askida gorunur.

### `updateCompanyMember`

Amac:
- Uye rolu ve durumunu tek mutasyonla guncellemek

Auth:
- `owner | admin`

Request:
```json
{
  "companyId": "cmp_...",
  "memberUid": "uid_...",
  "patch": {
    "role": "viewer",
    "memberStatus": "active"
  }
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "memberUid": "uid_...",
  "role": "viewer",
  "memberStatus": "active",
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `company_member_updated`

Errors:
- `permission-denied` (actor role yetkisiz veya admin->owner promote denemesi)
- `invalid-argument` (bos patch)
- `failed-precondition`
  - `OWNER_MEMBER_IMMUTABLE`
  - `COMPANY_MEMBER_ROLE_INVALID`
  - `COMPANY_MEMBER_STATUS_INVALID`
  - self-suspend denemesi
- `not-found`

MVP policy lock:
- `owner` hedef bu endpointten degistirilemez
- `admin` kullanicisi `owner` rolune atama yapamaz
- actor kendi hesabini `suspended` yapamaz

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi
- Write path transaction: `companies/{companyId}/members/{memberUid}` + `users/{memberUid}/company_memberships/{companyId}` mirror update
- `/drivers` side panel role/durum update karti bu endpoint'e baglandi

### `removeCompanyMember`

Amac:
- Company uyeligini tenantten cikarmak

Auth:
- `owner | admin`

Request:
```json
{
  "companyId": "cmp_...",
  "memberUid": "uid_..."
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "memberUid": "uid_...",
  "removedRole": "viewer",
  "removedMemberStatus": "active",
  "removed": true,
  "removedAt": "2026-02-26T11:00:00.000Z"
}
```

Audit:
- `company_member_removed`

Errors:
- `permission-denied` (yetkisiz actor veya admin->admin remove denemesi)
- `failed-precondition`
  - `OWNER_MEMBER_IMMUTABLE`
  - `SELF_MEMBER_REMOVE_FORBIDDEN`
- `not-found`

MVP policy lock:
- `owner` hedef bu endpointten kaldirilamaz
- `admin` actor baska `admin` uyeyi kaldiramaz
- actor kendi uyeligini kaldiramaz

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi
- Transaction path: `companies/{companyId}/members/{memberUid}` ve `users/{memberUid}/company_memberships/{companyId}` delete edilir
- Hedef uye icin `member_invites` icindeki `pending` davetler `revoked` olarak kapatilir
- `/drivers` side panel "Uyeyi Sirketten Cikar" aksiyonu bu endpoint'e baglandi

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
- `failed-precondition` (`ownerType=individual_driver` pathi MVP web implementasyonunda acik degil)
- `already-exists` (plate policy varsa)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Web Faz 2 implementasyonu company-scoped subset ile acildi (`ownerType=company`)
- Write path: `companies/{companyId}/vehicles/{vehicleId}`
- Company icinde `plateNormalized` uzerinden duplicate plate kontrolu uygulanir (transaction icinde best-effort)
- Audit log event: `vehicle_created`

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
- `already-exists` (patch.plate company icinde duplicate ise)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Web Faz 2'de backend callable acik, UI tarafinda detail drawer edit akisi sonraki dilime birakildi
- Patch alanlari: `plate`, `brand`, `model`, `year`, `capacity`, `status`
- Company icinde plate degisimi duplicate kontrolunden gecer (`plateNormalized`)
- Audit log event: `vehicle_updated`

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

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Web Faz 2'de `/routes` ekraninda minimal company-scoped create formu acildi (inline)
- `authorizedDriverIds` verildiginde active company membership dogrulamasi yapilir; tenant mismatch `failed-precondition` doner
- Mevcut Faz 2 UI sadece create + route summary reload akisini aciyor; stop editor / detail drawer sonraki dilimde
- Audit log event: `route_created`

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

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- MVP patch subset implementasyonu: `name`, `scheduledTime`, `timeSlot`, `allowGuestTracking`, `isArchived`, `authorizedDriverIds?`
- Web Faz 2'de drawer uzerinden ozet patch UI aktif; `authorizedDriverIds` patchi kontrat uyumlulugu icin korunur ancak authorized uye toggle aksiyonu yuz otuz dokuzuncu dilimde `grant/revokeDriverRoutePermissions` endpointlerine tasinmistir
- `lastKnownUpdateToken` verildiginde route `updatedAt` alanina karsi optimistic precondition uygulanir (`UPDATE_TOKEN_MISMATCH`)
- Route tenant/company cross-check zorunlu; mismatch `ROUTE_TENANT_MISMATCH` -> `failed-precondition`
- Audit log event: `route_updated`

### `listCompanyRouteStops`

Amac:
- Company panelinde secili route icin stop listesi (read-side) (`/routes` drawer stop editor v1)

Auth:
- `owner | admin | dispatcher | viewer` (aktif company uyeligi ile read)

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_..."
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "items": [
    {
      "stopId": "stop_...",
      "routeId": "route_...",
      "companyId": "cmp_...",
      "name": "Durak 1",
      "order": 0,
      "location": { "lat": 40.01, "lng": 29.01 },
      "createdAt": "2026-02-24T12:00:00.000Z",
      "updatedAt": "2026-02-24T12:00:00.000Z"
    }
  ]
}
```

Errors:
- `unauthenticated`
- `invalid-argument`
- `permission-denied`
- `not-found` (route yok)
- `failed-precondition` (`ROUTE_TENANT_MISMATCH`, `ROUTE_NOT_COMPANY_SCOPED`)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Read path: `routes/{routeId}/stops/*` + route tenant/visibility cross-check
- Faz 2 `/routes` side panel stop editor v1 bu endpoint'i kullanir

### `upsertCompanyRouteStop`

Auth:
- `owner | admin | dispatcher`
- veya route permission ile izinli operator (faz 3 genisleme)

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "stopId": null,
  "name": "Durak 1",
  "location": { "lat": 40.01, "lng": 29.01 },
  "order": 0
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "stopId": "stop_...",
  "updatedAt": "2026-02-24T12:00:00.000Z"
}
```

Audit:
- `route_stop_upserted`

Policy notu:
- aktif trip varsa yapisal degisiklik (order/insert/delete) MVP'de server-side soft-lock ile deny edilir (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Company tenant/visibility cross-check zorunlu (`ROUTE_TENANT_MISMATCH`, `ROUTE_NOT_COMPANY_SCOPED`)
- Opsiyonel `lastKnownUpdateToken` verildiginde route `updatedAt` alanina karsi optimistic precondition uygulanir (`UPDATE_TOKEN_MISMATCH`)
- Active trip varsa `failed-precondition` ile deny edilir (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`)
- Stop write sonrasi route `updatedAt/updatedBy` alanlari da guncellenir
- Web Faz 2 stop editor v1 liste + ekle/guncelle (upsert) akisini acti; delete UI on ikinci dilimde, `Yukari/Asagi` reorder UI on ucuncu dilimde, drag-drop reorder UI on dorduncu dilimde eklendi

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

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Company tenant/visibility cross-check zorunlu (`ROUTE_TENANT_MISMATCH`, `ROUTE_NOT_COMPANY_SCOPED`)
- Opsiyonel `lastKnownUpdateToken` verildiginde route `updatedAt` alanina karsi optimistic precondition uygulanir (`UPDATE_TOKEN_MISMATCH`)
- Active trip varsa `failed-precondition` ile deny edilir (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`)
- Stop delete sonrasi route `updatedAt/updatedBy` alanlari guncellenir
- Web Faz 2 stop editor v1 on ikinci dilimde durak silme UI acildi (confirm + reload); stop reorder sonrasi route summary reload ile optimistic token tazelenir

### `reorderCompanyRouteStops`

Auth:
- `owner | admin | dispatcher`

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_...",
  "stopId": "stop_...",
  "direction": "up",
  "lastKnownUpdateToken": "2026-02-24T12:00:00.000Z"
}
```

Response:
```json
{
  "routeId": "route_...",
  "updatedAt": "2026-02-24T12:05:00.000Z",
  "changed": true
}
```

Audit:
- `route_stops_reordered` (yalniz `changed=true` ise)

Policy notu:
- aktif trip varsa reorder MVP'de server-side soft-lock ile deny edilir (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`)

Implementation note (2026-02-25 / dev):
- Firebase callable (`europe-west3`) implement edildi ve smoke test edildi
- Reorder backend transaction icinde atomik swap (`order`) olarak uygulanir; web tarafinda iki ayri upsert ile reorder yapilmaz
- Company tenant/visibility cross-check zorunlu (`ROUTE_TENANT_MISMATCH`, `ROUTE_NOT_COMPANY_SCOPED`)
- Opsiyonel `lastKnownUpdateToken` verildiginde route `updatedAt` alanina karsi optimistic precondition uygulanir (`UPDATE_TOKEN_MISMATCH`)
- Sinir durumunda (`ilk duragi up`, `son duragi down`) `changed=false` ile no-op donebilir
- Web Faz 2 stop editor v1 on ucuncu dilimde `Yukari / Asagi` butonlariyla, on dorduncu dilimde drag-drop UI ile bu endpoint'e baglandi (endpoint contract degismedi)

## 4.4 Route-Level Driver Permissions

### `listRouteDriverPermissions`

Auth:
- `owner | admin | dispatcher | viewer`

Request:
```json
{
  "companyId": "cmp_...",
  "routeId": "route_..."
}
```

Response:
```json
{
  "items": [
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
      "updatedAt": "2026-02-26T11:15:00.000Z"
    }
  ]
}
```

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi.
- Route tenant/visibility cross-check sonrasinda `routes/{routeId}/driver_permissions/*` koleksiyonu okunur.
- Web `/routes` side paneli yetkili uye listesinde her uye icin permission ozetini bu endpoint'ten besler.

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

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi.
- Grant islemi route tenant/visibility cross-checkinden sonra hedef `driverUid` icin route-level permission dokumani yazar (`routes/{routeId}/driver_permissions/{driverUid}`) ve `authorizedDriverIds` + `memberIds` alanlarini tenant-safe sekilde gunceller.
- `/routes` update drawer authorized uye toggle diff'i icinde "eklenen uid" adimlari bu endpoint ile calisir.
- Faz 2 iki yuz kirk birinci dilimde `/routes` side paneldeki detayli permission editoru da bu endpointi full permission object save icin reuse eder (yeni endpoint acilmadan).

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

Implementation note (2026-02-26 / dev):
- Firebase callable (`europe-west3`) implement edildi.
- `resetToDefault=true` durumunda hedef uye route authorized listesinden cikarilir ve override permission dokumani silinir.
- `permissionKeys[]` ile partial revoke durumunda permission dokumani merge edilir (yalniz secili anahtarlar false'a cekilir).
- Rota ana surucusu icin `resetToDefault=true` deny edilir (`ROUTE_PRIMARY_DRIVER_IMMUTABLE`).
- `/routes` update drawer authorized uye toggle diff'i icinde "cikarilan uid" adimlari bu endpoint ile calisir.

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
      "driverPlate": "34ABC123",
      "status": "active",
      "startedAt": "2026-02-24T11:10:00.000Z",
      "lastLocationAt": "2026-02-24T11:58:00.000Z",
      "updatedAt": "2026-02-24T11:58:05.000Z",
      "liveState": "online",
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
- `live.source` alani MVP'de `rtdb | trip_doc` olabilir
- stale hesaplama standardi backend tarafinda yapilmali (UI'da duplicate kural yok)

Implementasyon Notu (Faz 2 on besinci dilim):
- Firebase callable (`europe-west3`) web panel Faz 2 live-ops read-side dilimi icin implement edildi
- V1 implementasyon Firestore `trips(status=active)` read + route tenant join + opsiyonel RTDB (`locations/{routeId}`) overlay kullanir
- RTDB payload `tripId` secili aktif seferle eslesmiyorsa koordinat fallback'i `trip_doc` olarak doner (`lat/lng` null olabilir)
- V1 stale semantigi sade tutulur: `liveState=online|stale` (backend threshold), UI duplicate stale kurali yazmaz
- Web `/live-ops` ekrani bu endpoint'i aktif sefer listesi + secili sefer detail paneli icin kullanir; harita paneli placeholder shell olarak kalir (Faz 2 sonrasi geometri/live map slice)

### `listCompanyAuditLogs`

Auth:
- `owner | admin` (company-level read-only audit visibility)

Request:
```json
{
  "companyId": "cmp_..."
}
```

Response:
```json
{
  "items": [
    {
      "auditId": "audit_...",
      "companyId": "cmp_...",
      "eventType": "company_member_updated",
      "targetType": "company_member",
      "targetId": "uid_...",
      "actorUid": "uid_...",
      "status": "success",
      "reason": null,
      "createdAt": "2026-02-24T12:00:00.000Z"
    }
  ]
}
```

Implementasyon Notu (Faz 3 ucuncu dilim):
- Firebase callable (`europe-west3`) owner/admin read-only audit listesi icin acildi.
- V1 modelde server-side field filter yok; backend `companyId` ile sinirlar, max 60 kayit dondurur.
- Pagination/filter sonraki dilime ertelendi (MVP sade model).

### `getCompanyAdminTenantState`

Auth:
- `owner | admin` (company-level read-only tenant status visibility)

Request:
```json
{
  "companyId": "cmp_..."
}
```

Response:
```json
{
  "companyId": "cmp_...",
  "companyStatus": "active",
  "billingStatus": "unknown",
  "billingValidUntil": null,
  "updatedAt": "2026-02-24T12:00:00.000Z",
  "createdAt": "2026-02-24T10:00:00.000Z"
}
```

Implementasyon Notu (Faz 3 altinci dilim):
- Firebase callable (`europe-west3`) admin panelde suspension/lock read-only baseline icin acildi.
- `companyStatus` (`active|suspended|archived|unknown`) ve `billingStatus` (`active|past_due|suspended_locked|unknown`) doner.
- Mutation yoktur; bu endpoint salt operasyon gorunurlugu icindir.

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
- `OWNER_MEMBER_IMMUTABLE`
- `SELF_MEMBER_REMOVE_FORBIDDEN`
- `INVITE_NOT_ACCEPTABLE`
- `INVITE_NOT_DECLINABLE`
- `ROUTE_NOT_IN_COMPANY`
- `DRIVER_NOT_IN_COMPANY`
- `ROUTE_PRIMARY_DRIVER_IMMUTABLE`
- `LAST_OWNER_PROTECTION`
- `IDEMPOTENCY_REPLAY`
- `UPDATE_TOKEN_MISMATCH`
- `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`

## 6. Contract Freeze Scope (Faz 1 kod oncesi)

Asagidaki endpointler "V1 draft frozen" olmalı:
- `createCompany`
- `listMyCompanies`
- `listCompanyMembers`
- `listCompanyRoutes`
- `listCompanyRouteStops`
- `listCompanyVehicles`
- `inviteCompanyMember`
- `acceptCompanyInvite`
- `declineCompanyInvite`
- `updateCompanyMember`
- `removeCompanyMember`
- `createVehicle`
- `updateVehicle`
- `createCompanyRoute`
- `updateCompanyRoute`
- `upsertCompanyRouteStop`
- `deleteCompanyRouteStop`
- `reorderCompanyRouteStops`
- `listRouteDriverPermissions`
- `grantDriverRoutePermissions`
- `revokeDriverRoutePermissions`
- `listCompanyAuditLogs`
- `getCompanyAdminTenantState`

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
