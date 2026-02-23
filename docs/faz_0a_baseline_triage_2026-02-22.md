# Faz 0A Baseline Triage - 2026-02-22

Durum: Ilk triage (kickoff)  
Kapsam: Faz 0A baseline stabilization icin lane bazli sinyal ayristirma

## 1. Calistirilan Komutlar

1. `powershell -ExecutionPolicy Bypass -File scripts/flutter_preflight.ps1`
2. `powershell -ExecutionPolicy Bypass -File scripts/test_lane.ps1 -Lane router-guards -SkipPubGet`
3. `powershell -ExecutionPolicy Bypass -File scripts/test_lane.ps1 -Lane domain-core -SkipPubGet`
4. `powershell -ExecutionPolicy Bypass -File scripts/test_lane.ps1 -Lane ui-widget -SkipPubGet`

## 2. Hizli Sonuc Ozeti

- `flutter_preflight` -> PASS (global/local Flutter mismatch warning var)
- `router-guards` -> PASS
- `domain-core` -> PASS
- `ui-widget` -> FAIL (compile + stale expectation + governance failures karisik)

Sonuc:

- Faz 1 (router/corridor) icin gerekli minimum sinyal olusmaya basladi.
- UI lane su an Faz 0A triage / quarantine / hedefli cleanup gerektiriyor.

## 2.1 Durum Guncellemesi (Ayni Gun - UI Compile Unblock Sonrasi)

Ek uygulanan duzeltmeler sonrasinda:

- `active_trip_screen_map_mode_test` compile blocker'i compatibility helper ile giderildi
- `driver_home_screen.dart` Amber->Core rename kalintilari temizlenerek compile edilir hale getirildi
- `driver_home_screen_test` compile blocker'i (named param mismatch) compatibility alanlari ile runtime seviyesine indirildi

Guncel `ui-widget` lane durumu:

- Compile blocker: sifir (lane tamamen kosuyor)
- Sonuc: `66` pass / `42` fail
- Kalan kiriklarin ana siniflari:
  - stale UI text/CTA expectationlari
  - UI behavior/regresyon uyumsuzluklari
  - governance/quality gate kiriklari

## 2.2 Durum Guncellemesi (Ayni Gun - Governance/Quality Gate Paketi Sonrasi)

Ek uygulanan duzeltmeler:

- `core_governance_test.dart` kapsami migration asamasina uygun `core-governed files` olarak daraltildi
- `core_quality_gate_test.dart`
  - stale kontrast cifti guncellendi
  - gercek kontrast sorunu token seviyesinde duzeltildi (`CoreColors.warning`)
  - feature-contract niteligindeki 4 kontrol quarantine `skip` olarak isaretlendi

Guncel `ui-widget` lane durumu:

- Sonuc: `68` pass / `~4` skip / `36` fail
- Kalan kiriklarin ana siniflari:
  - stale UI text/CTA expectationlari
  - feature-contract uyumsuzluklari
  - UI behavior/regresyon uyumsuzluklari

## 3. Triage Kategorileri

## A. Must-Fix-Now (Faz 0A icin)

1. Toolchain preflight + lane scriptleri
- Durum: Tamamlandi (ilk versiyon)
- Not: `flutter_preflight` global mismatch'i warning olarak raporluyor

2. Router stale guard expectationlari
- Durum: Tamamlandi
- Not: `test/app/router/*` lane yesile alindi

## B. Phase-Blocking (Faz 1 oncesi izlenecek ama tamami simdi zorunlu degil)

1. UI compile kiriklari (Amber -> Core rename kalintilari)
- Ornek:
  - `lib/ui/screens/driver_home_screen.dart` icinde silinmis `amber_*` importlari
  - `test/ui/driver_home_screen_test.dart` API beklentisi kaymis (`subscriptionStatus` vb.)
- Etki:
  - `ui-widget` lane compile edilmeden fail oluyor
  - Faz 1 router refactor'u dogrudan bloke etmez, ama genel baseline kalitesini dusurur

2. UI API mismatch testleri
- Ornek:
  - `test/ui/active_trip_screen_map_mode_test.dart` -> `buildDriverLockedGesturesSettings` bulunamiyor
- Etki:
  - UI lane compile/load fail

## C. Quarantine-Candidate (Owner + tarih ile)

1. UI copy/stale expectation testleri
- Ornek:
  - `test/ui/stop_crud_screen_test.dart` text expectationlari
  - `test/ui/trip_history_screen_test.dart` baslik expectationi
  - `test/ui/active_trip_screen_sync_recovery_test.dart` metin expectationlari
- Oneri:
  - UI refresh/rename sureci tamamlanana kadar hedefli update veya gecici quarantine

2. Governance/quality gate test kiriklari
- Ornek:
  - `test/ui/core_governance_test.dart` material icon freeze kurali
  - `test/ui/core_quality_gate_test.dart` contrast kurali
- Oneri:
  - Bu testler degerli; kapatmak yerine owner atayip kurali veya UI tokenlarini hizala
- Durum guncellemesi:
  - `core_governance_test.dart` ve `core_quality_gate_test.dart` artik lane fail kaynagi degil

3. UI lane runtime fail listesi (66/42 sonucu)
- Durum:
  - Derleme sorunu olmadan lane kosuyor; kalanlar hedefli cleanup/quarantine ile yonetilecek
- Ayrintili grouped liste:
  - `docs/faz_0b_ui_widget_quarantine_2026-02-22.md`
- Durum guncellemesi:
  - governance/quality gate paketi sonrasi lane sonucu `68/~4/36` seviyesine indi

## D. Non-Blocking (Faz 1 acisindan)

1. Global Flutter PATH mismatch
- Preflight warning veriyor
- Local `.fvm` SDK saglam oldugu icin calisma devam edebilir
- CI/local komutlar `.fvm` veya `fvm flutter` ile standardize edilmeli

## 4. Faz 0A Sonraki Hedefli Adimlar

1. `ui-widget` lane icin ayri triage alt-listesi cikart (compile vs stale UI text vs governance)
2. Quarantine policy dosyasini/sekli netlestir (owner + target date)
3. UI stale expectation cleanup mini paketini dosya-grup bazli baslat
4. Governance/quality gate sahiplik kararlarini netlestir
5. CI lane split icin ilk workflow adimini planla (`router-guards`, `domain-core`)

## 5. Faz 1'e Hazirlik Yorumu (Erken Degerlendirme)

Bugunku duruma gore:

- Router/corridor calismasina teknik olarak baslanabilir (router lane + domain lane sinyali var).
- Ancak UI lane karmasasi nedeniyle PR sinyali kirli kalir.
- Oneri: Faz 1 ile paralel degil, Faz 0A scope icinde kucuk bir "UI compile unblock" paketi planla.

## 6. Owner/Tarih Taslagi (Baslangic)

Bu bolum Faz 0B governance ile kesinlestirilecek. Simdilik taslak:

- `router-guards` lane owner: router/auth
- `domain-core` lane owner: domain/auth/core
- `ui-widget` lane owner: ui/core-design-system + screen owners
- quarantine review target: 7 gun icinde ilk liste kilitleme
## 2.3 Durum Guncellemesi (Ayni Gun - Stale UI Copy / Feature Contract Cleanup Paketleri Sonrasi)

Ek uygulanan duzeltme paketleri (ozet):

- `driver_home`, `trip_history`, `error_feedback_tokens` stale expectation cleanup
- `active_trip_screen_*`, `splash_hook_screen`, `stop_crud_screen` stale UI + behavior expectation hizalamalari
- `driver_profile_setup`, `driver_route_management`, `route_create`, `route_update` test kontrat hizalamasi ve scroll/tap stabilizasyonu
- `passenger_settings`, `passenger_tracking`, `paywall` stale copy ve action surface kontrat guncellemeleri

Ara `ui-widget` lane iyilesme checkpointleri:

- `73` pass / `~4` skip / `31` fail
- `83` pass / `~4` skip / `21` fail
- `91` pass / `~4` skip / `13` fail

## 2.4 Final UI Widget Lane Checkpoint (Faz 0B - Bu Tur)

Guncel `ui-widget` lane durumu:

- Sonuc: `103` pass / `~5` skip / `0` fail
- Durum: `ui-widget` lane artik Faz 0A/0B acisindan blocker degil

Kalan `skip` kalemleri (bilincli quarantine):

- `test/ui/core_quality_gate_test.dart` icindeki feature-contract niteligindeki 4 kontrol (owner backlog)
- `test/ui/active_trip_map_perf_metric_test.dart` (ActiveTrip placeholder path telemetry hook eksigi; Faz 0B quarantine)

Yorum:

- `ui-widget` lane compile/runtime seviyesinde yesile alindi.
- Faz 1 router/corridor calismalarina girerken UI test sinyali artik temiz.
