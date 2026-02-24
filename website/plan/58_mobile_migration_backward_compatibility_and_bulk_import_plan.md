# Mobile Migration, Backward Compatibility + Bulk Import Plan (MVP-Cut Revision)

Tarih: 2026-02-24
Durum: V1 plan (kritik, Faz 2-6 etkiler)

## 1. Kapsam

Bu dokuman uc kritik alanı birlestirir:
1. Web-first mimariye mobil gecis/migration
2. Eski mobil surumlerle backward compatibility donemi
3. Kurumsal onboarding icin bulk import stratejisi (MVP white-glove, UI sonra)

## 2. Neden kritik?

- Mevcut app/backend aktif veri tasiyor olabilir
- Yeni tenant/policy modeli (Company of 1 + company RBAC) migration gerektirir
- Kurumsal musteri onboarding'i gerekecek
- Compatibility layer sonsuza kadar yasarsa data corruption ve delivery yuku artar

## 3. Revize MVP Karari (solo-founder hiz odakli)

1. Compatibility layer olacak, ama dar kapsamli, write-path odakli ve kesin sunset tarihli olacak
2. Bulk import ihtiyaci kabul, fakat self-serve Bulk Import UI pilot sonrasi ertelenecek
3. Pilot oncesi onboarding modeli = white-glove import (manuel + script)
4. Legacy path kapatmak icin Force Update + server-side min version enforcement agresif/erken devreye alinacak

## 4. Migration Stratejisi (Data + Contract)

### 4.1 Migration prensipleri

1. Big-bang migration yapma
2. Read compatibility once, write compatibility olabildigince hizli kapat
3. Eski clientlar icin compatibility adapter suresi tanimla
4. Her migration adimi audit/loggable olsun
5. Rollback/partial rollback plani olsun
6. Compatibility layer'a bitis tarihi koy (open-ended birikime izin verme)

### 4.2 Migration asamalari

Asama A - Hazirlik:
- yeni collections ve endpointler eklenir
- company-of-1 olusturma job'u planlanir
- route/policy schema extensionlari eklenir
- server-side client version logging baslatilir

Asama B - Backfill:
- mevcut bireysel driverlar icin `individual_operator` company tenant olustur
- mevcut routes/trips kayitlarina company context projection/backfill yap
- vehicle verisini company-scoped path'e tasima / write-through gecis planla

Asama C - Compatibility donemi:
- eski mobil write endpointleri sadece zorunlu kalan dar compatibility layer ile yeni policy'ye map edilir (istisna yol)
- yeni web panel yeni endpoint kontratlarini kullanir
- telemetry ile hangi client versiyonlar eski endpoint kullaniyor izlenir
- unsupported/tehlikeli legacy mutasyonlar deny edilir + auditlenir
- yeni endpointlere birebir esdeger olmayan eski davranislar "tasinmaya calisılmaz"; erken cutoff tercih edilir

Asama D - Cutover:
- warning period -> force update -> server-side reject zinciri uygulanir
- eski mutasyon yollarini asamali kapat
- eski owner-only policy akislari revoke et

## 5. Backward Compatibility Kurallari

### 5.1 API versioning

- `v1` (legacy mobile compatibility, gecici)
- `v2` (web-first tenant/policy aware)

Not:
- version naming HTTP path veya callable naming ile dokumante edilir
- timeline/retirement tarihi net olmalidir

### 5.2 Compatibility adapter sorumluluklari (daraltildi)

- legacy payload -> new domain command mapping (yalniz desteklenecek kritik mutasyon subset'i)
- default company context resolution (company-of-1 dahil)
- deprecation logging + endpoint bazli legacy call sayaci
- unsupported eski davranislari explicit deny

Kural:
- compatibility layer policy bypass katmani degil
- "eskiyi calistirsin" diye yeni authz kurallari gevsetilmez

### 5.3 Cutoff politikasi

Her legacy endpoint icin:
- deprecation date
- warning period
- shutdown date
- server-side reject davranisi
- rollback (gecici yeniden acma) kurali

## 6. Force Update + Client Version Enforcement (zorunlu ek)

MVP/pilot hizina uygun guvenli kapatma icin iki katman birlikte kullanilir:

1. Client-side UX lock:
- Firebase Remote Config ile `min_required_version`
- cutoff geldiginde uygulamada Force Update ekranı
- App Store / Play Store yonlendirmesi

2. Server-side guvenlik kilidi:
- `min_supported_client_version` kontrolu (ozellikle mutasyon endpointlerinde)
- cutoff sonrasi eski client mutasyonlari reject edilir (standart `426 Upgrade Required` veya esdeger structured error)
- read-only grace (opsiyonel) acikca tanimlanir
- aktif sefer/kritik operasyon guvenligi icin "trip-finish safe window" gerekiyorsa endpoint bazli whitelist ile tanimlanir (acik uclu degil)

Detay plan:
- `71_mobile_force_update_and_client_version_enforcement_plan.md`

## 7. Veri Cakismasi ve Eszamanli Donem Riskleri

Riskler:
- web yeni rota kuralina gore yazarken eski mobil eski semantik ile yazar
- permission modeli ile owner-only model catisir
- duplicate/inconsistent vehicle kayitlari

Azaltma:
- mutasyonlarda `schemaVersion` / `policyVersion` logla
- migration flags (`migratedToCompanyTenant`) kullan
- unsupported legacy mutasyonlari deny + audit et
- compatibility layer kapsamını dar tut
- compatibility layer write-path sunset tarihi kodlamadan once kayda gecir
- "legacy read-only mode" ile "legacy write mapping" ayrimi endpoint bazli kayitlanir

## 8. Bulk Import Stratejisi (revize)

### 8.1 MVP / Pilot oncesi (white-glove onboarding)

Self-serve Bulk Import UI yerine:
- musteriden Excel/CSV al
- template ile veri formatini standartlastir
- import scripti ile manuel/yarı-manuel veritabanina aktar
- sonuc raporunu insan destekli ver

Bu asamada urunde sadece sunlar olabilir (hafif yardimci araclar):
- template dosyalari
- onboarding checklisti
- ic operasyon import scriptleri

### 8.2 Post-pilot (self-serve Bulk Import UI)

Pilot sonrasinda ihtiyac dogrulanirsa gelistirilecek:
- CSV/XLSX yukleme UI
- validate-only preview
- row-level error raporlama
- import job status
- partial success/rollback kurallari

## 9. White-Glove Import Operasyon Kurallari (ilk 3-5 musteri)

- Importlar sadece `dev/stg` rehearsal sonrasi `prod` uygulanir
- Her import batch icin audit notu tutulur (`who`, `when`, `source file`, `script version`)
- Idempotent import scriptleri tercih edilir
- Hata durumunda geri alma / temizleme proseduru yazili olur

## 10. Fazlama Onerisi (revize)

- Faz 2-3: migration hazirlik + company-of-1 backfill tools + version logging
- Faz 4-5: compatibility telemetry + force update hazirligi + agresif cutoff rehearsal (warning -> force update -> 426)
- Faz 6 oncesi: white-glove onboarding SOP + import scripts production-ready
- Faz 6+ (ihtiyaca gore): self-serve bulk import UI backloga alinır

## 11. Test / Validation Gereksinimleri

- migration dry-run in dev/stg
- sample tenant migration rehearsal
- legacy + new endpoint parallel smoke tests
- compatibility deny-path tests (unsupported legacy mutasyonlar)
- force update cutoff rehearsal (client + server)
- white-glove import script happy path + malformed row test

## 12. Referans Dokumanlar

- `54_adr_006_company_of_one_tenant_standardization.md`
- `56_adr_008_vehicle_collection_security_revision.md`
- `42_p0_endpoint_contracts_v1_draft.md`
- `48_p0_endpoint_implementation_order_freeze.md`
- `71_mobile_force_update_and_client_version_enforcement_plan.md`
- `72_mobile_offline_stale_location_tolerance_plan.md`
