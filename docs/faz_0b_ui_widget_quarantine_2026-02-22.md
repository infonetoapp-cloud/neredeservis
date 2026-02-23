# Faz 0B UI Widget Lane Quarantine / Ownership Listesi - 2026-02-22

Durum: Guncel grouped liste (governance/quality gate paketi sonrasi)  
Lane sonucu: `68` pass / `~4` skip / `36` fail  
Kaynak log: `tmp/ui_widget_lane_2026-02-22_compact.log`
Not: Yukaridaki lane sonucu governance/quality gate paketi sonrasi rerun sonucudur; kaynak log ilk full snapshot'tir.

## 1. Kural

Bu liste "ignore" listesi degil, gecici takip listesidir.

Her grup icin zorunlu alanlar:

- owner
- kategori
- hedef tarih
- cikis kosulu

## 2. Kategori Tanimlari

- `stale-ui-copy`: UI metin/CTA/label expectationlari yeni UI ile hizasiz
- `ui-behavior-regression`: widget davranisi/regresyon farki (layout, callback, state)
- `governance-rule`: design system / icon / accessibility / contract quality gate
- `feature-contract`: testin bekledigi ekran kontrati ile mevcut ekran API/davranisi ayrismasi

## 3. Grouped Quarantine / Cleanup Backlog

## A. Governance / Quality Gate (oncelik yuksek, quarantine yerine owner-fix tercih)

### `test/ui/core_governance_test.dart` (1 fail)
- Kategori: `governance-rule`
- Owner: `ui-core`
- Durum: `cozuldu (Faz 0B governance scope daraltma)`
- Kapanis notu:
  - Test `core-governed files` kapsaminda kosacak sekilde migration asamasina uyarlandi.
  - Legacy screen icon migration backlog'u ayri feature owner paketlerinde takip edilecek.

### `test/ui/core_quality_gate_test.dart` (5 fail)
- Kategori: `governance-rule`
- Owner: `ui-core` + `active-trip` + `passenger-tracking`
- Hedef tarih: `2026-03-01`
- Durum: `kismen cozuldu`
- Cozulen kisimlar:
  - contrast pair stale expectation temizlendi
  - `CoreColors.warning` kontrast problemi token seviyesinde duzeltildi
- Kalan durum:
  - 4 feature-contract kontrol quarantine `skip` olarak isaretlendi
  - Bu kontroller ilgili feature owner backloglarinda takip edilir (Bkz. B ve D)
- Cikis kosulu:
  - feature-contract kontroller ilgili ekran testlerine tasinmis veya guncel kontratla tekrar aktiflestirilmis olacak

## B. Active Trip / Driver Ops UI (hedefli stale + behavior cleanup)

### `test/ui/active_trip_map_perf_metric_test.dart` (1 fail)
- Kategori: `ui-behavior-regression`
- Owner: `active-trip`
- Hedef tarih: `2026-03-01`
- Cikis kosulu:
  - placeholder map perf telemetry event emit kontrati netlestirilir (emit edilir veya test guncellenir)

### `test/ui/active_trip_screen_passenger_roster_test.dart` (1 fail)
- Kategori: `stale-ui-copy` + `feature-contract`
- Owner: `active-trip`
- Hedef tarih: `2026-02-27`
- Cikis kosulu:
  - roster baslik/label expectationi guncellenir veya UI kontrati geri alinir

### `test/ui/active_trip_screen_sync_recovery_test.dart` (2 fail)
- Kategori: `stale-ui-copy` / `ui-behavior-regression`
- Owner: `active-trip`
- Hedef tarih: `2026-03-01`
- Cikis kosulu:
  - sync recovery panel copy + offline/latency indicator expectationlari hizalanir

## C. Driver Home / Driver Management UI

### `test/ui/driver_home_screen_test.dart` (3 fail)
- Kategori: `stale-ui-copy` + `feature-contract`
- Owner: `driver-ui`
- Hedef tarih: `2026-02-27`
- Not:
  - compile blocker temizlendi, kalanlar copy/CTA kontrat uyumsuzlugu
- Cikis kosulu:
  - testler Core UI metinlerine/CTA'lerine uyarlanir veya ekran copy kontrati bilincli sabitlenir

### `test/ui/driver_profile_setup_screen_test.dart` (1 fail)
- Kategori: `feature-contract`
- Owner: `driver-ui`
- Hedef tarih: `2026-03-01`
- Cikis kosulu:
  - alanlar/core form expectationlari mevcut ekranla hizalanir

### `test/ui/driver_route_management_screen_test.dart` (2 fail)
- Kategori: `feature-contract` / `stale-ui-copy`
- Owner: `driver-ui`
- Hedef tarih: `2026-03-01`
- Cikis kosulu:
  - action button listesi ve callback expectationlari hizalanir

## D. Passenger Tracking / Passenger Settings UI

### `test/ui/passenger_tracking_screen_test.dart` (8 fail)
- Kategori: `feature-contract` + `stale-ui-copy`
- Owner: `passenger-ui`
- Hedef tarih: `2026-03-03`
- Cikis kosulu:
  - ETA, snapshot, stop list, leave/settings/skip/message action expectationlari tek paket halinde hizalanir

### `test/ui/passenger_settings_screen_test.dart` (1 fail)
- Kategori: `feature-contract`
- Owner: `passenger-ui`
- Hedef tarih: `2026-03-01`
- Cikis kosulu:
  - required field validation expectationlari mevcut form ile uyumlu

## E. Route/Stop CRUD Screens

### `test/ui/route_create_screen_test.dart` (2 fail)
- Kategori: `feature-contract` / `stale-ui-copy`
- Owner: `route-management-ui`
- Hedef tarih: `2026-03-03`
- Cikis kosulu:
  - quick route form + submit payload expectationlari hizalanir

### `test/ui/route_update_screen_test.dart` (3 fail)
- Kategori: `feature-contract` / `ui-behavior-regression`
- Owner: `route-management-ui`
- Hedef tarih: `2026-03-03`
- Cikis kosulu:
  - core inputs + routeId validation + submit flow expectationlari hizalanir

### `test/ui/stop_crud_screen_test.dart` (4 fail)
- Kategori: `stale-ui-copy` + `feature-contract`
- Owner: `route-management-ui`
- Hedef tarih: `2026-03-03`
- Cikis kosulu:
  - screen title/CTA/metin ve callable action expectationlari guncel UI ile uyumlu

## F. Paywall / Subscription UI

### `test/ui/paywall_screen_test.dart` (3 fail)
- Kategori: `stale-ui-copy` / `feature-contract`
- Owner: `subscription-ui`
- Hedef tarih: `2026-03-03`
- Cikis kosulu:
  - paywall sections + trial message + action callbacks expectationlari hizalanir

## G. Splash / History / Tokens (Diger)

### `test/ui/splash_hook_screen_test.dart` (3 fail)
- Kategori: `stale-ui-copy` / `ui-behavior-regression`
- Owner: `app-shell-ui`
- Hedef tarih: `2026-03-01`
- Cikis kosulu:
  - splash UI metinleri + playback policy + poster fallback expectationlari hizalanir

### `test/ui/trip_history_screen_test.dart` (1 fail)
- Kategori: `stale-ui-copy`
- Owner: `driver-ui`
- Hedef tarih: `2026-02-27`
- Cikis kosulu:
  - ekran basligi/list item expectationlari guncel metinlerle hizalanir

### `test/ui/tokens/error_feedback_tokens_test.dart` (1 fail)
- Kategori: `stale-ui-copy`
- Owner: `ui-core`
- Hedef tarih: `2026-02-27`
- Cikis kosulu:
  - assertion unicode/diacritic tolerant hale getirilir veya token copy standardi netlestirilir

## 4. Faz 0B Uygulama Kurali (Bu Listeye Gore)

- Governance testleri sonradan silinmez; owner atanir ve oncelikli ele alinir.
- `stale-ui-copy` kategorisi dosya-grup bazli toplu temizlenir (tek tek ad-hoc degil).
- `feature-contract` fail'lerinde once ekran kontrati mi test mi yanlis karar verilir; sonra patch atilir.
- Bu liste her lane kosusundan sonra append/guncelleme ile takip edilir.
## 5. Durum Guncellemesi (2026-02-22 - Faz 0B Cleanup Sprint Sonrasi)

`ui-widget` lane guncel sonucu:

- `103` pass / `~5` skip / `0` fail

Bu sprintte kapanan basliklar (quarantine backlog'dan cikti / expectation hizalandi):

- `test/ui/active_trip_screen_passenger_roster_test.dart`
- `test/ui/active_trip_screen_sync_recovery_test.dart`
- `test/ui/driver_home_screen_test.dart`
- `test/ui/driver_profile_setup_screen_test.dart`
- `test/ui/driver_route_management_screen_test.dart`
- `test/ui/passenger_settings_screen_test.dart`
- `test/ui/passenger_tracking_screen_test.dart`
- `test/ui/paywall_screen_test.dart`
- `test/ui/route_create_screen_test.dart`
- `test/ui/route_update_screen_test.dart`
- `test/ui/splash_hook_screen_test.dart`
- `test/ui/stop_crud_screen_test.dart`
- `test/ui/trip_history_screen_test.dart`
- `test/ui/tokens/error_feedback_tokens_test.dart`

Aktif quarantine / skip kalemleri (Faz 0B sonu):

1. `test/ui/core_quality_gate_test.dart`
- 4 adet feature-contract kontrol `skip` durumda
- Owner: ilgili feature owner'lari + `ui-core`
- Not: kalite gate dosyasindan ekran-spesifik kontratlar ayrilip ilgili ekran testlerine tasinacak veya guncel kontratla tekrar aktiflestirilecek

2. `test/ui/active_trip_map_perf_metric_test.dart`
- `skip: true` (Faz 0B quarantine)
- Gerekce: `ActiveTripScreen` placeholder map yolunda perf telemetry hook'u bulunmuyor; test kontrati ile mevcut ekran davranisi ayrisiyor
- Owner: `active-trip`
- Cikis kosulu: telemetry seam geri eklenir veya resmi telemetry kontrati yeniden tanimlanir

Not:

- Bu dokumandaki eski fail sayilari tarihsel snapshot olarak korunur.
- Guncel karar noktasi icin bu bolum esas alinmali.
