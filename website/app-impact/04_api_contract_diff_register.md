# API Contract Diff Register (Web -> App)

Tarih: 2026-02-24
Durum: Aktif (web implementasyonu sirasinda doldurulur)

## 1. Amac

Web implementasyonu ilerlerken backend kontratlarinda app'i etkileyen farklari
tek tabloda tutmak.

Bu dosya:
- endpoint bazli degisiklikleri toplar
- app entegrasyon sprintinde "ne degisti?" sorusunu hizli cevaplar
- accidental breaking change riskini azaltir

## 2. Ne Buraya Yazilir?

- request field eklendi/kaldirildi/rename edildi
- response field semantigi degisti
- yeni reason/error code eklendi
- authz/policy red reason'lari degisti
- version/cutoff davranisi degisti (`426`, read-only vb.)

## 3. Kayit Formati

- `ID`:
- `Endpoint/Action`:
- `Degisiklik Tipi`: (`request`, `response`, `error_code`, `authz`, `versioning`)
- `Web Degisikligi (ozet)`:
- `App Etkisi`:
- `Backward Compatible mi?` (`yes/no/partial`)
- `Cutoff Gerekli mi?` (`yes/no`)
- `Ilgili Web Docs`:
- `Ilgili App Layer`:
- `Durum`:

## 4. Baslangic Seed Kayitlari

### API-DIFF-001
- `Endpoint/Action`: Legacy mobile mutasyon endpointleri (`v1` yollar)
- `Degisiklik Tipi`: `versioning`
- `Web Degisikligi (ozet)`: Aggressive force update + server-side version enforcement + `426 Upgrade Required`
- `App Etkisi`: App error handling / force update fallback / shim davranisi gerekir
- `Backward Compatible mi?`: `partial`
- `Cutoff Gerekli mi?`: `yes`
- `Ilgili Web Docs`: `plan/58_*.md`, `plan/71_*.md`
- `Ilgili App Layer`: network error mapping / router / session
- `Durum`: `web-partial-app-pending`

### API-DIFF-002
- `Endpoint/Action`: Route/trip mutasyon reason codes
- `Degisiklik Tipi`: `error_code`
- `Web Degisikligi (ozet)`: active-trip route structure soft-lock reason code'lari (stop delete/reorder deny)
- `App Etkisi`: Driver app warning/error copy map etmesi gerekir
- `Backward Compatible mi?`: `yes` (genel hata fallback ile), ama UX bozulur
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_*.md`, `plan/62_*.md`
- `Ilgili App Layer`: driver route management / active trip actions
- `Durum`: `implemented-web-app-pending`

### API-DIFF-003
- `Endpoint/Action`: `createCompany` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request`
- `Web Degisikligi (ozet)`: Web Faz 2 company bootstrap icin yeni company olusturma callable eklendi (`name`, `contactEmail?`, `contactPhone?`)
- `App Etkisi`: App tarafinda gelecekte company bootstrap/company onboarding eklenecekse ayni payload semantigini kullanmali; validation ve copy parity gerekecek
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future company onboarding / company setup flow
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-004
- `Endpoint/Action`: `listMyCompanies` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response`
- `Web Degisikligi (ozet)`: Web Faz 2 mode/company resolver icin kullanicinin company uyeliklerini donduren callable eklendi (`items[]: companyId, name, role, memberStatus`)
- `App Etkisi`: App tarafi multi-company / company context secim ekranlarinda ayni response shape ve role/memberStatus semantigine hizalanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/08_domain_model_company_rbac.md`
- `Ilgili App Layer`: role/mode/company resolver, auth sonrasi routing
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-005
- `Endpoint/Action`: `listCompanyMembers` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response`
- `Web Degisikligi (ozet)`: Faz 2 `drivers` ekrani icin company uyelerini donduren callable eklendi (`items[]: uid, role, memberStatus, displayName?, email?, phone?`, `companyId`)
- `App Etkisi`: App tarafi gelecekte firma uyeleri / sofor listesi / operasyon yetki gorunumlerinde ayni role-memberStatus semantiklerini kullanmali; "uye listesi" ve "sofor listesi" copy/filtreleme ayrimi dikkatle tasarlanmalı
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/08_domain_model_company_rbac.md`
- `Ilgili App Layer`: company member list flows, company context secimi sonrasi operasyon ekranlari
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-006
- `Endpoint/Action`: `listCompanyRoutes` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response`
- `Web Degisikligi (ozet)`: Faz 2 `routes` ekrani icin company route summary listesi donduren callable eklendi; response shape Faz 2 onuncu dilimde `authorizedDriverIds[]` ile genisletildi (`items[]: routeId, companyId, name, srvCode?, driverId?, scheduledTime?, timeSlot?, isArchived, allowGuestTracking, authorizedDriverIds?, passengerCount, updatedAt?`)
- `App Etkisi`: App tarafi future company route listesi / route selector ekranlarinda ayni summary shape ve company-context read semantigine hizalanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/08_domain_model_company_rbac.md`
- `Ilgili App Layer`: route list/read flows, company context secimi sonrasi route screens
- `Durum`: `implemented-web-runtime-validated-app-pending` (response expanded; app parser parity pending)

### API-DIFF-007
- `Endpoint/Action`: `listCompanyVehicles` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response`
- `Web Degisikligi (ozet)`: Faz 2 `vehicles` ekrani icin company-scoped vehicle summary listesi donduren callable eklendi (`items[]: vehicleId, companyId, plate, status, brand?, model?, year?, capacity?, updatedAt?`)
- `App Etkisi`: App tarafi future company vehicle listesi / assignment flows'da ayni summary shape ve company-context read semantigine hizalanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/08_domain_model_company_rbac.md`
- `Ilgili App Layer`: vehicle list/read flows, company context secimi sonrasi vehicle screens
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-008
- `Endpoint/Action`: `createVehicle` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request`
- `Web Degisikligi (ozet)`: Faz 2 `/vehicles` ekrani icin company-scoped vehicle create mutasyonu acildi (`ownerType=company`, `companyId`, `plate`, `brand?`, `model?`, `year?`, `capacity?`, `status?`)
- `App Etkisi`: App tarafi future vehicle create / onboarding / assignment akislarinda ayni request semantigini kullanmali; duplicate plate (`already-exists`) ve company-only mutation policy copy'si hizalanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future vehicle create forms, error mapping, company context guards
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-009
- `Endpoint/Action`: `updateVehicle` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request`
- `Web Degisikligi (ozet)`: Faz 2 vehicle detail/edit sonrasi icin backend patch mutasyonu acildi (`companyId`, `vehicleId`, `patch.{plate|brand|model|year|capacity|status}`)
- `App Etkisi`: App tarafi future vehicle edit/status degisikligi ekranlarinda patch semantigini, `already-exists` duplicate plate ve `not-found` / `permission-denied` hata kodlarini ayni sekilde map etmeli
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future vehicle edit drawer/forms, assignment/maintenance status flows, error mapping
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-010
- `Endpoint/Action`: `createCompanyRoute` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response`
- `Web Degisikligi (ozet)`: Faz 2 `/routes` ekrani icin company-scoped route create mutasyonu acildi (`companyId`, route temel alanlari + opsiyonel `authorizedDriverIds`); basarili response `routeId` + `srvCode` donduruyor ve route summary listesi reload ediliyor
- `App Etkisi`: App tarafi future company route create / onboarding akislari ayni request semantigini kullanmali; `authorizedDriverIds` icin company active membership dogrulamasi ve `failed-precondition` hata copy'si hizalanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future route create forms, company route onboarding, error mapping / route create feedback katmani
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-011
- `Endpoint/Action`: `updateCompanyRoute` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request`
- `Web Degisikligi (ozet)`: Faz 2 `/routes` side panelinde route ozet patch mutasyonu acildi (`companyId`, `routeId`, `lastKnownUpdateToken?`, `patch.{name|scheduledTime|timeSlot|allowGuestTracking|isArchived|authorizedDriverIds?}`)
- `App Etkisi`: App tarafi future company route detail/edit ekranlarinda ayni patch semantigini, `updatedAt` optimistic token davranisini, `authorizedDriverIds` member-selection patch UX'ini ve `failed-precondition` icindeki `UPDATE_TOKEN_MISMATCH` / tenant mismatch hata mapping'ini kullanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future route edit forms, route detail drawer, error mapping / conflict feedback
- `Durum`: `implemented-web-runtime-validated-app-pending` (authorizedDriverIds patch UI aktif)

### API-DIFF-012
- `Endpoint/Action`: `listCompanyRouteStops` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response`
- `Web Degisikligi (ozet)`: Faz 2 `/routes` side panel stop editor v1 icin company-scoped route stop listesi donduren callable eklendi (`companyId`, `routeId`, `items[]: stopId, routeId, companyId, name, order, location{lat,lng}, createdAt?, updatedAt?`)
- `App Etkisi`: App tarafi future company route detail/stop editor ekranlarinda ayni stop summary shape ve route-tenant read semantigine hizalanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future route stop list/read flows, route detail drawer stop panels
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-013
- `Endpoint/Action`: `upsertCompanyRouteStop` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response`
- `Web Degisikligi (ozet)`: Faz 2 `/routes` side panel stop editor v1 icin company-scoped route stop add/update mutasyonu acildi (`companyId`, `routeId`, `stopId?`, `name`, `location`, `order`, `lastKnownUpdateToken?`) ve response `companyId+routeId+stopId+updatedAt` donduruyor
- `App Etkisi`: App tarafi future company route stop editor akislari ayni upsert semantigini, opsiyonel route token precondition davranisini (`UPDATE_TOKEN_MISMATCH`) ve active trip soft-lock (`failed-precondition` / `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`) hata davranisini kullanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future route stop add/edit forms, route mutation error mapping / conflict feedback
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-014
- `Endpoint/Action`: `deleteCompanyRouteStop` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response`
- `Web Degisikligi (ozet)`: Faz 2 route stop editor v1 icin company-scoped durak silme mutasyonu acildi (`companyId`, `routeId`, `stopId`, `lastKnownUpdateToken?`) ve response `routeId`, `stopId`, `deleted` donduruyor
- `App Etkisi`: App tarafi future company route stop editor akislari ayni delete semantigini, optimistic route token precondition davranisini ve active trip soft-lock hata mapping'ini kullanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future route stop delete actions, route stop editor shell state, mutation error mapping/conflict feedback
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-015
- `Endpoint/Action`: `reorderCompanyRouteStops` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response`
- `Web Degisikligi (ozet)`: Faz 2 route stop editor v1 icin company-scoped durak siralama mutasyonu acildi (`companyId`, `routeId`, `stopId`, `direction`, `lastKnownUpdateToken?`) ve response `routeId`, `updatedAt`, `changed` donduruyor; web UI `Yukari/Asagi` butonlari bu endpoint'e baglandi
- `App Etkisi`: App tarafi future company route stop editor akislari ayni reorder semantigini (transactional swap), no-op `changed=false`, optimistic route token davranisini ve active trip soft-lock hata mapping'ini kullanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future route stop reorder actions, route detail shell state refresh, mutation error mapping/conflict feedback
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-016
- `Endpoint/Action`: `listActiveTripsByCompany` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response`
- `Web Degisikligi (ozet)`: Faz 2 `/live-ops` ekrani icin company-scoped aktif sefer listesi endpoint'i eklendi (`companyId`, `routeId?`, `driverUid?`, `pageSize?` -> `items[]: tripId, routeId, routeName, driverUid, driverName, driverPlate?, status, startedAt?, lastLocationAt?, updatedAt?, liveState, live{lat,lng,source,stale}`); V1 implementasyon Firestore active trips + route tenant join + opsiyonel RTDB lokasyon overlay kullanir
- `App Etkisi`: App tarafi future company live-ops ekranlarinda ayni aktif sefer summary shape'i, `liveState` semantigi ve `live.source` (`rtdb|trip_doc`) fallback davranisini parity ile kullanmali
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/20_decision_log_and_open_questions.md`
- `Ilgili App Layer`: future company live-ops trip feed/list, live status chips, RTDB/Firestore live read adapters
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-017
- `Endpoint/Action`: `updateCompanyMember` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/drivers` side panel role/durum update karti icin yeni company member mutasyon endpoint'i acildi (`companyId`, `memberUid`, `patch.{role?,memberStatus?}` -> `companyId`, `memberUid`, `role`, `memberStatus`, `updatedAt`).
- `App Etkisi`: App tarafi future company member management akislarinda ayni patch semantigini ve authz guardlarini map etmeli; owner hedef immutable, self-suspend deny ve owner/admin actor gereksinimi UI copy/state davranisina yansitilmali.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future company member role/status mutation forms, authz guard feedback mapping, company member list refresh orchestrasyonu
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-018
- `Endpoint/Action`: `inviteCompanyMember` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/drivers` side panel uye davet karti icin yeni company member invite endpoint'i acildi (`companyId`, `email`, `role`) ve response olarak `inviteId`, `memberUid`, `invitedEmail`, `status=pending`, `expiresAt`, `createdAt` donuluyor.
- `App Etkisi`: App tarafi future company member invite akislarinda ayni request/response semantigini ve policy guardlarini map etmeli; owner/admin actor zorunlulugu, admin->admin invite deny ve `INVITE_EMAIL_NOT_FOUND` hata semantigi copy/state davranisina yansitilmali.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future company member invite forms, invited-state rendering, authz/error feedback mapping
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-019
- `Endpoint/Action`: `acceptCompanyInvite` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/mode-select` invited company satirlari icin yeni davet kabul endpoint'i acildi (`companyId`) ve response `memberStatus=active`, `role`, `acceptedAt` ile membership aktivasyonu donecek sekilde baglandi.
- `App Etkisi`: App tarafi future mode selector/company onboarding akisinda invited->active gecisini ayni kontratla map etmeli; kabul sonrasi active company context secimi ve dashboard gecis davranisi parity olmalı.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future invite acceptance flow, company chooser state/cache refresh, onboarding feedback mapping
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-020
- `Endpoint/Action`: `declineCompanyInvite` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/mode-select` invited company satirlari icin yeni davet red endpoint'i acildi (`companyId`) ve response `memberStatus=suspended`, `role`, `declinedAt` ile membership red/suspend akisi baglandi.
- `App Etkisi`: App tarafi future mode selector/company onboarding akisinda invited->suspended gecisini ayni kontratla map etmeli; red sonrasi company satiri askida semantigiyle render edilmeli ve tekrar kabul/red aksiyonlari kapatilmalidir.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future invite decline flow, company chooser membership state/copy mapping, onboarding action guards
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-021
- `Endpoint/Action`: `removeCompanyMember` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/drivers` side panelinde secili uye icin company member kaldirma endpoint'i acildi (`companyId`, `memberUid`) ve response `removedRole`, `removedMemberStatus`, `removed=true`, `removedAt` donecek sekilde baglandi.
- `App Etkisi`: App tarafi future company member management akisinda ayni kaldirma semantigini map etmeli; owner/self kaldirma deny ve admin->admin kaldirma deny policy davranisi parity korunmali.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future member remove actions, member list cache/selection fallback, policy/error feedback mapping
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-022
- `Endpoint/Action`: `grantDriverRoutePermissions` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/routes` drawer authorized uye togglesi icin route-level grant endpoint'i acildi (`companyId`, `routeId`, `driverUid`, `permissions`) ve response `permissions` + `updatedAt` ile donuyor.
- `App Etkisi`: App tarafi future route permission panelinde ayni permission object semantigini kullanmali; grant sonrasi route authorized listesi ve memberIds parity refresh davranisi korunmali.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future route permission grant actions, permission object parser, route membership sync UX
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-023
- `Endpoint/Action`: `revokeDriverRoutePermissions` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/routes` drawer authorized uye togglesi icin route-level revoke endpoint'i acildi (`companyId`, `routeId`, `driverUid`, `permissionKeys?`, `resetToDefault?`) ve response `updatedAt` ile donuyor.
- `App Etkisi`: App tarafi future route permission panelinde reset revoke (`resetToDefault=true`) ve partial revoke (`permissionKeys[]`) semantigini map etmeli; `ROUTE_PRIMARY_DRIVER_IMMUTABLE` guard copy/state parity korunmali.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future route permission revoke actions, primary-driver guard UX, mutation error feedback mapping
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-024
- `Endpoint/Action`: `listRouteDriverPermissions` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response+authz`
- `Web Degisikligi (ozet)`: Faz 2 `/routes` side panel yetkili uye bolumu icin route-level permission read endpoint'i acildi (`companyId`, `routeId` -> `items[].driverUid`, `items[].permissions`, `items[].updatedAt`).
- `App Etkisi`: App tarafi future route detail/permission panelinde ayni read modeli kullanmali; grant/revoke sonrasi list refresh akisi ve query hata fallback semantigi parity korunmali.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: future route permission list/read hooks, permission summary cards, cache refresh orchestration
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-025
- `Endpoint/Action`: `listCompanyAuditLogs` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response+authz`
- `Web Degisikligi (ozet)`: Faz 3 `/admin` ekraninda read-only audit gorunurlugu icin yeni endpoint acildi (`companyId` -> `items[].auditId/eventType/targetType/targetId/actorUid/status/reason/createdAt`).
- `App Etkisi`: Mobil app icin zorunlu degil; admin web paneline ozel bir okuma endpoint'i. App tarafinda internal-admin gorunumu acilana kadar aksiyon gerekmez.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: `none (simdilik)`
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-026
- `Endpoint/Action`: `getCompanyAdminTenantState` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `response+authz`
- `Web Degisikligi (ozet)`: Faz 3 `/admin` ekraninda suspension/lock read-only gorunurluk icin yeni endpoint acildi (`companyId` -> `companyStatus`, `billingStatus`, `billingValidUntil`, `updatedAt`, `createdAt`).
- `App Etkisi`: Mobil app icin zorunlu degil; bu endpoint admin web operasyon gorunurlugu icindir.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: `none (simdilik)`
- `Durum`: `implemented-web-runtime-validated-app-pending`

### API-DIFF-027
- `Endpoint/Action`: `updateCompanyAdminTenantState` (Firebase callable, `europe-west3`)
- `Degisiklik Tipi`: `request+response+authz`
- `Web Degisikligi (ozet)`: Faz 7 admin tenant-state mutation akisi icin patch endpoint'i acildi (`companyStatus`, `billingStatus`, `billingValidUntil`, `reason`) ve response tarafinda `changedFields` + guncel tenant state donulur.
- `App Etkisi`: Mobil app icin zorunlu degil; endpoint yalnizca web admin operasyon yuzeyi icindir.
- `Backward Compatible mi?`: `yes` (yeni endpoint)
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_p0_endpoint_contracts_v1_draft.md`, `plan/29_phase1_first_sprint_backlog.md`
- `Ilgili App Layer`: `none (simdilik)`
- `Durum`: `implemented-web-runtime-validated-app-n/a`

## 6. Adminsiz Cutover Core Matrix (2026-02-27)

Bu bolum, current cycle icin app parity kapanisinda referans alinacak zorunlu semantik setidir.

### C-01 Force Update / Version Cutoff
- Kapsam: Legacy mutasyon yollari + server-side version gate
- Zorunlu:
  - `426 Upgrade Required` davranisi
  - write-path kilidi + read-only fallback penceresi
- Kaynak: `API-DIFF-001`, `W2A-001`

### C-02 Live Ops Stream + Fallback
- Kapsam: `listActiveTripsByCompany` + RTDB `locations/{routeId}`
- Zorunlu:
  - `liveState`: `online|stale`
  - `live.source`: `rtdb|trip_doc`
  - stream issue semantigi: `mismatch|error|access_denied`
- Kaynak: `API-DIFF-016`, `W2A-002`, `W2A-016`, `W2A-017`

### C-03 Route/Stop Soft-Lock ve Conflict
- Kapsam: `updateCompanyRoute`, `upsertCompanyRouteStop`, `deleteCompanyRouteStop`, `reorderCompanyRouteStops`
- Zorunlu hata kodlari:
  - `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`
  - `UPDATE_TOKEN_MISMATCH`
  - `ROUTE_STOP_INVALID_STATE`
  - `ROUTE_STOP_REORDER_STATE_INVALID`
- Kaynak: `API-DIFF-011..015`, `W2A-003`, `W2A-012..015`

### C-04 Company Context + Membership Core
- Kapsam: `createCompany`, `listMyCompanies`, `listCompanyMembers`
- Zorunlu:
  - active company context secimi
  - `role` + `memberStatus` (`active|invited|suspended`)
  - no-company/no-permission guard copy parity
- Kaynak: `API-DIFF-003..005`, `W2A-004`, `W2A-006`, `W2A-007`

### C-05 Membership + Invite + Route Permission
- Kapsam:
  - `updateCompanyMember`, `inviteCompanyMember`, `acceptCompanyInvite`, `declineCompanyInvite`, `removeCompanyMember`
  - `grantDriverRoutePermissions`, `revokeDriverRoutePermissions`, `listRouteDriverPermissions`
- Zorunlu hata kodlari:
  - `OWNER_MEMBER_IMMUTABLE`
  - `SELF_MEMBER_REMOVE_FORBIDDEN`
  - `INVITE_EMAIL_NOT_FOUND`
  - `INVITE_NOT_ACCEPTABLE`
  - `INVITE_NOT_DECLINABLE`
  - `ROUTE_PRIMARY_DRIVER_IMMUTABLE`
- Kaynak: `API-DIFF-017..024`, `W2A-100..106`
