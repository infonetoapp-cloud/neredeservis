# Domain Model (Company + RBAC + Vehicle) - V0

Tarih: 2026-02-24
Durum: Oneri / Faz 0 baseline (ADR-006 ve ADR-008 ile kismen guncellendi)

## 1. Amac

Web-first ilerlemek icin tenant ve yetki modelini bastan netlestirmek.

Hedef:
- Bireysel soforu desteklemek
- Firma bazli operasyonu desteklemek
- Mobil app'i sonradan ayni kontrata hizalayabilmek

## 2. Tasarim Prensipleri

1. Tenant-first: firma verileri `companyId` sinirinda izole edilir (`Company of 1` dahil)
2. Role ve permission ayri kavramdir
3. Mutasyonlar server-side API uzerinden olur
4. Mevcut `drivers/routes/trips` koleksiyonlari korunur, uzerine policy/tenant katmani eklenir
5. Geriye donuk migration mumkun olmalidir

## 3. Cekirdek Varliklar (MVP)

### 3.1 Company

Amac:
- Firma/servis sirketi tenant kaydi

Onerilen alanlar:
- `id`
- `name`
- `legalName` (opsiyonel)
- `taxId` (opsiyonel, faz 2)
- `status` = `active | suspended | archived`
- `timezone` (varsayilan `Europe/Istanbul`)
- `countryCode` (varsayilan `TR`)
- `contactPhone`
- `contactEmail`
- `createdAt`
- `updatedAt`
- `createdBy`

### 3.2 CompanyMember

Amac:
- Kullanici ile firma arasindaki uye/yetki baglantisi

Anahtar:
- `companyId + uid`

Alanlar:
- `companyId`
- `uid`
- `role` = `owner | admin | dispatcher | viewer`
- `status` = `active | invited | suspended`
- `permissions` (opsiyonel override listesi)
- `invitedBy`
- `invitedAt`
- `acceptedAt`
- `createdAt`
- `updatedAt`

Not:
- MVP'de role-first yeterli; `permissions` override faz 2'de genisletilir.

### 3.3 Vehicle (Owned Asset, tenant-local)

Amac:
- Bir tenant'in (firma veya `Company of 1`) sahip oldugu arac kaydi

MVP notu (ADR-006 + ADR-008 uyumu):
- `Company of 1` nedeniyle bireysel soforun araci da bir company tenant altinda tutulur
- Bu nedenle `Vehicle` dokumani owner olarak her zaman tenant/company scope'unda dusunulur
- Cross-tenant operasyon kullanimi MVP'de desteklenmez; post-pilot ihtiyac cikarsa ayri model/projection ile ele alinir

Alanlar:
- `id`
- `companyId` (zorunlu, owner tenant)
- `plate`
- `brand`
- `model`
- `year`
- `capacity`
- `status` = `active | maintenance | inactive`
- `inspectionDueAt` (opsiyonel)
- `insuranceDueAt` (opsiyonel)
- `createdAt`
- `updatedAt`

### 3.4 DriverCompanyAssignment

Amac:
- Bir soforun hangi firmaya bagli oldugunu ve durumunu takip etmek

Alanlar:
- `id`
- `companyId`
- `driverUid`
- `employmentType` = `employee | contractor`
- `status` = `active | suspended | ended`
- `assignedVehicleIds` (opsiyonel cache/projection)
- `effectiveFrom`
- `effectiveTo` (opsiyonel)
- `createdAt`
- `updatedAt`

Not:
- `drivers/{uid}.companyId` tek alan olarak kalabilir ama assignment modeli daha esnektir.
- MVP'de tek aktif firma kisiti uygulanabilir.

ADR guncelleme notu (2026-02-24):
- `54_adr_006_company_of_one_tenant_standardization.md` ile bireysel soforler `individual_operator` company tenant olarak modellenir
- `56_adr_008_vehicle_collection_security_revision.md` ile vehicle write modeli MVP'de company-scoped path'e cekilir

### 3.4A CompanyVehicleOperationalBinding (Post-pilot aday model - cross-tenant usage)

Amac (MVP default degil):
- Bir driver'in kendi tenant'indaki (ornegin Company of 1) aracinin, baska bir tenant operasyonunda kullanilmasini cross-tenant vehicle read yapmadan temsil etmek

Neden:
- `companies/{companyId}/vehicles/*` strict tenant scope korunur
- Firestore rules sade kalir
- Firma B, Firma A'nin vehicle dokumanini dogrudan okumak zorunda kalmaz

Alanlar (post-pilot aday model):
- `id`
- `companyId` (operasyonu yurutten tenant, or. Firma B)
- `driverUid`
- `sourceVehicleOwnerCompanyId` (aracin sahibi tenant, or. driver'in Company of 1 tenant'i)
- `sourceVehicleId` (opsiyonel referans; server-side validation icin)
- `operationalVehicleSnapshot`
  - `plate`
  - `brand` (opsiyonel)
  - `model` (opsiyonel)
  - `capacity` (opsiyonel)
- `status` = `active | inactive | ended`
- `effectiveFrom`
- `effectiveTo` (opsiyonel)
- `createdAt`
- `updatedAt`

Post-pilot kurali (ihtiyac cikarsa):
- Firma B operasyon ekranlari `operationalVehicleSnapshot` veya company B local binding uzerinden calisir
- Firma B'nin rules'u Firma A vehicle dokumanina dogrudan erisim gerektirmez
- `sourceVehicleId` sadece server-side policy/validation icin kullanilabilir

MVP default:
- bir arac bir tenant'a aittir ve sadece o tenant operasyonunda kullanilir
- cross-tenant araç kullanim talebi gelirse product/policy karari olarak backloga alinir (ad-hoc veri modeli acilmaz)

### 3.5 DriverRoutePermission (Route-level policy)

Amac:
- Firma bagli soforun rota bazli hangi islemleri yapabilecegini tanimlamak

Anahtar:
- `routeId + driverUid`

Alanlar:
- `routeId`
- `driverUid`
- `companyId`
- `permissions`
  - `canStartFinishTrip`
  - `canSendAnnouncements`
  - `canViewPassengerList`
  - `canEditAssignedRouteMeta`
  - `canEditStops`
  - `canManageRouteSchedule`
- `grantedBy`
- `grantedAt`
- `updatedAt`

Not:
- Mevcut `authorizedDriverIds` alanini koruruz.
- Bu model daha ince taneli yetkiyi ekler.

### 3.6 AuditLog

Amac:
- Kurumsal mutasyonlarin izlenebilirligi

Alanlar:
- `id`
- `companyId` (opsiyonel; bireysel islemde null olabilir)
- `actorUid`
- `actorType` = `company_member | individual_driver | system`
- `eventType`
- `targetType`
- `targetId`
- `status` = `success | denied | failed`
- `reason` (opsiyonel)
- `metadata` (redacted)
- `requestId`
- `createdAt`

## 4. Mevcut Modellerle Iliski (repo ile uyum)

Mevcut:
- `users/{uid}`
- `drivers/{uid}`
- `routes/{routeId}`
- `routes/{routeId}/stops/*`
- `trips/{tripId}`

MVP ekleri (onerilen, ADR guncelleme notlariyla):
- `companies/{companyId}`
- `companies/{companyId}/members/{uid}`
- `companies/{companyId}/vehicles/{vehicleId}` (ADR-008, MVP default)
- `driver_company_assignments/{assignmentId}`
- `company_vehicle_operational_bindings/{bindingId}` (post-pilot aday, cross-tenant vehicle usage icin)
- `route_driver_permissions/{routeId_driverUid}`
- `audit_logs/{auditId}` (veya company bazli partition)

## 5. Tenant Kurallari (Non-negotiable)

1. Firma verisi default olarak cross-tenant okunamaz/yazilamaz
2. `owner/admin/dispatcher/viewer` check server-side yapilir
3. "Super admin" (ileride) sadece backend internal policy ile calisir
4. `companyId` projection alanlari source-of-truth degilse dokumante edilir
5. MVP'de cross-tenant arac kullanimi desteklenmez; post-pilot gerekirse `Vehicle` cross-read yerine binding/projection modeli degerlendirilir

## 6. Bireysel Sofor ile Firma Soforu Birlikte Yasama Kurali

Bir `driver` kaydi UX olarak su modlardan birinde olabilir:
- bireysel (no active assignment)
- firma bagli (active assignment var)

Faz 2 notu:
- Ayni soforun birden cok firma ile iliski modeli gerekirse `assignment` tabani bunu destekler.
- Ayni soforun kendi araciyla baska firmada operasyon yapmasi MVP kapsam disidir; post-pilot gereksinim cikarsa `CompanyVehicleOperationalBinding` benzeri model acilir

MVP company context kuralı (review netlestirmesi):
- `activeCompanyId` oturum/sayfa baglamidir ve tek aktiftir
- Sofor firma operasyonunda calisiyorsa app/web o firma context'inde hareket eder
- Soforun Company-of-1 verileri ayri tenant baglamindadir; ayni anda tek requestte iki tenant context birlestirilmez
- Bu nedenle "firma rotasi + company-of-1 araci" cross-tenant kombinasyonu MVP'de desteklenmez

ADR-006 notu:
- \"Bireysel\" durum backend'de `Company of 1` tenant uzerinden de temsil edilir.

## 7. API/Use Case Liste Taslagi (Web-first)

Yeni endpoint adaylari (MVP):
- `createCompany`
- `inviteCompanyMember`
- `acceptCompanyInvite`
- `declineCompanyInvite`
- `updateCompanyMember` (role ve memberStatus patch)
- `removeCompanyMember`
- `createVehicle`
- `updateVehicle`
- `assignDriverToCompany`
- `bindOperationalVehicleToCompanyDriver` (post-pilot aday, ihtiyaca gore)
- `listRouteDriverPermissions`
- `grantDriverRoutePermissions`
- `revokeDriverRoutePermissions`
- `createCompanyRoute`
- `updateCompanyRoute`
- `upsertCompanyRouteStop`
- `archiveCompanyRoute`

## 8. Migration Stratejisi (App sonra uyarlanacak)

Asama 1:
- Web backend endpointleri + yeni collections

Asama 2:
- Mobil app kritik akislari yeni policy katmanina baglanir

Asama 3:
- Eski owner-only route mutasyonlari, route-level permission mantigina genisletilir

Bu sayede mobil rewrite gerektirmeden kademeli gecis olur.
