# Web to App Change Register (Master Queue)

Tarih: 2026-02-24
Durum: Aktif backlog

## 1. Kullanım

Bu dosya web implementasyon sirasinda app'e yansiyacak degisikliklerin ana kaydidir.
Detay gerekiyorsa `01_*` veya `02_*` dosyalarina not dusulur.

## 2. Kayit Formati (kisa)

- `ID`:
- `Status`:
- `Priority`:
- `Kategori`: (`contract`, `auth`, `rbac`, `live_ops`, `route_trip`, `ui_ux`, `copy`, `migration`)
- `Web Trigger`:
- `App Impact (ozet)`:
- `Planlanan App Degisiklikleri`:
- `Bloklayici mi?` (`web bootstrap`, `web mvp`, `cutover`, `none`)
- `Ilgili Web Docs`:
- `Ilgili App Dosyalari`:
- `Notlar`:

## 3. Baslangic Kayitlari (seed)

### W2A-001
- `Status`: `triaged`
- `Priority`: `P0`
- `Kategori`: `migration`
- `Web Trigger`: Aggressive force update + server-side version enforcement + `426` cutoff
- `App Impact (ozet)`: Eski clientlarin mutasyonlari reddedilecegi icin app tarafinda force-update UX/fallback davranisi kesin olmali.
- `Planlanan App Degisiklikleri`:
  - Remote Config min version kontrolunu dogrula/ekle
  - `426` durumunda user-facing fallback/upgrade ekrani
  - aktif sefer bitisinde legacy shim kullaniliyorsa handler davranisini netlestir
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`, `plan/71_mobile_force_update_and_client_version_enforcement_plan.md`
- `Ilgili App Dosyalari`: `lib/app/router/*`, auth/session/network error handling katmanlari
- `Notlar`: Web implementasyonu ilerledikce server error code mapping netlestikce guncellenecek.

### W2A-002
- `Status`: `triaged`
- `Priority`: `P0`
- `Kategori`: `live_ops`
- `Web Trigger`: Offline burst replay latest-only live node + drift guard + stale/offline semantigi
- `App Impact (ozet)`: App konum gonderim mantigi web live ops beklentilerine uygun olmalı.
- `Planlanan App Degisiklikleri`:
  - live path'e latest-only yazim davranisi
  - history/trail path ayrimi (MVP kapsaminda varsa)
  - sourceTimestamp drift guard ile uyumlu payload/clock davranisi
  - offline banner semantics (offline vs stale) UI tutarliligi
- `Bloklayici mi?`: `web mvp`
- `Ilgili Web Docs`: `plan/59_route_readers_lifecycle_live_read_grants_technical_spec.md`, `plan/72_mobile_offline_stale_location_tolerance_plan.md`
- `Ilgili App Dosyalari`: `lib/ui/screens/passenger_tracking_screen.dart`, driver trip/live konum gonderim akislari
- `Notlar`: App tarafinda performans/stability odakli uygulanacak, polish sonra.

### W2A-003
- `Status`: `triaged`
- `Priority`: `P1`
- `Kategori`: `route_trip`
- `Web Trigger`: Aktif seferde route yapisal degisiklikleri server-side soft-lock (stop delete/reorder deny)
- `App Impact (ozet)`: App tarafi yeni error reason/policy kodlarini anlamali; aktif seferde stale route cache ile patlamamali.
- `Planlanan App Degisiklikleri`:
  - server reason code mapping (uyari metni)
  - aktif sefer route cache invalidation/fallback
  - destructive route edit denemelerinde UX copy
- `Bloklayici mi?`: `web mvp`
- `Ilgili Web Docs`: `plan/62_route_trip_versioning_recurrence_timezone_dst_and_concurrent_editing_spec.md`, `plan/42_p0_endpoint_contracts_v1_draft.md`
- `Ilgili App Dosyalari`: driver active trip / route management ekranlari
- `Notlar`: Faz 3 bitisinde regression riskine dahil.

### W2A-004
- `Status`: `triaged`
- `Priority`: `P1`
- `Kategori`: `auth`
- `Web Trigger`: Company-of-1 lazy init + activeCompany context semantigi
- `App Impact (ozet)`: Role/mode secim ve passenger/driver entry routing akislari company context kurallariyla hizalanmali.
- `Planlanan App Degisiklikleri`:
  - mode selector / role corridor fallback state'leri
  - first-action lazy init bekleme durumu (gerekirse)
  - multi-company context secim kurallariyla uyum
- `Bloklayici mi?`: `cutover`
- `Ilgili Web Docs`: `plan/54_adr_006_company_of_one_tenant_standardization.md`, `plan/08_domain_model_company_rbac.md`
- `Ilgili App Dosyalari`: `lib/app/router/*`, `lib/ui/screens/role_select_screen.dart`
- `Notlar`: App/yolcu routing refresh sprintinde netlestirilecek.

## 4. Yazi Kurali

- Karar degismis ama app implementasyonu daha baslamamissa: mevcut kaydi guncelle, yeni duplicate kayit acma
- "Yapildi" oldugunda hangi commit/PR ile kapandigini not et

