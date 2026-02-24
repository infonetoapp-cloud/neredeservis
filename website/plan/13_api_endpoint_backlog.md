# Web API Endpoint Backlog (MVP -> Faz 2)

Tarih: 2026-02-24
Durum: Oneri / backlog taslagi

## 1. Amac

Web panelin ihtiyac duyacagi backend endpointlerini netlestirmek.

Kural:
- Kritik yazma operasyonlari browser -> direct Firestore write ile yapilmaz
- Server-side endpoint (Firebase Functions) kullanilir

## 2. Mevcut Kullanilabilir Endpointler (repo okumasi)

Mevcut backendde webin tekrar kullanabilecegi temel endpointler var:
- `createRoute`
- `createRouteFromGhostDrive`
- `updateRoute`
- `upsertStop`
- `deleteStop`
- `startTrip`
- `finishTrip`
- `sendDriverAnnouncement`
- `searchDriverDirectory`
- `generateRouteShareLink`
- `getDynamicRoutePreview`

Not:
- Bunlar su an mobil role/policy varsayimlariyla calisiyor.
- Web panel icin tenant/RBAC genisletmesi gerekecek.

## 3. MVP Icın Yeni Endpointler (Zorunlu)

### 3.1 Company / Membership
- `createCompany`
- `getCompany`
- `listMyCompanies`
- `inviteCompanyMember`
- `acceptCompanyInvite`
- `listCompanyMembers`
- `setCompanyMemberRole`
- `suspendCompanyMember`
- `removeCompanyMember`

### 3.2 Driver Management (Company)
- `listCompanyDrivers`
- `addDriverToCompany` (existing driver bagla)
- `createCompanyDriverProfile` (opsiyonel, onboarding modeli secimine gore)
- `updateCompanyDriverProfile`
- `suspendCompanyDriver`
- `assignDriverVehicle`
- `unassignDriverVehicle`
- `bindOperationalVehicleToCompanyDriver` (cross-tenant vehicle usage, snapshot/binding model)
- `unbindOperationalVehicleFromCompanyDriver`

### 3.3 Vehicle Management
- `createVehicle`
- `updateVehicle`
- `listVehicles`
- `archiveVehicle`
- `getVehicle`

### 3.4 Route/Stop Management (Company-aware)
- `createCompanyRoute`
- `updateCompanyRoute`
- `archiveCompanyRoute`
- `listCompanyRoutes`
- `getCompanyRouteDetail`
- `upsertCompanyRouteStop`
- `deleteCompanyRouteStop`
- `grantDriverRoutePermissions`
- `revokeDriverRoutePermissions`

### 3.5 Operations / Live
- `listActiveTripsByCompany`
- `getLiveOpsSnapshot` (opsiyonel projection endpoint)
- `forceFinishTrip` (owner/admin/dispatcher policy ile)

### 3.6 Audit / Logs
- `listAuditLogs`
- `getAuditLogDetail` (opsiyonel)

## 4. Faz 2 Endpointler (Gelistirme)

- `bulkImportDrivers`
- `bulkImportStops`
- `duplicateRoute`
- `publishRouteTemplate`
- `applyRouteTemplate`
- `exportOpsReport`
- `setCompanyPolicies` (2FA/IP rules vs.)

## 5. Endpoint Tasarim Kurallari

1. `requestId` ve `serverTime` standard response
2. Input validation (Zod)
3. Server-side authorization (company + role + permission)
4. Audit log (kritik mutasyonlarda)
5. Idempotency (uygun mutasyonlarda)
6. Typed error codes

## 6. Read Model Stratejisi (web performansi icin)

Iki secenek:

### Secenek A - Dogrudan Firestore reads + strict rules
- hizli baslangic
- client query kurallari dikkat ister

### Secenek B - Projection/snapshot endpointleri
- dashboard/live-ops performansi daha kontrollu
- backend isi artar

MVP onerisi:
- CRUD list/detail icin Firestore read + server mutasyon
- live ops ve dashboard icin secili projection endpointler

## 7. Mevcut Endpointlerin Refactor/Genişletme Ihtiyaci

Ozellikle gozden gecirilecekler:
- `createRoute` / `updateRoute` (owner-only yerine company RBAC)
- `upsertStop` / `deleteStop` (route permission support)
- `startTrip` / `finishTrip` (company policy + audit enrich)
- `sendDriverAnnouncement` (role policy + audit)

## 8. Backlog Onceliklendirme (MVP)

P0 (kod baslangici oncesi tasarim):
- company/member
- vehicle
- company-aware route/stop mutasyonlari
- driver route permissions

P1 (ilk panel kullanilabilirlik):
- active trips list
- audit log list

P2 (iyilestirme):
- live ops snapshot endpoint
- force finish trip
- bulk actions
