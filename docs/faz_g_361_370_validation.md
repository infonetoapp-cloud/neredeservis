# FAZ G 361-370 Validation Notlari

Tarih: 2026-02-19

## Kapatilan maddeler (otomasyon + telemetry)
- 361: `perf_app_startup`
- 362: `perf_map_render` (driver/passenger)
- 363: `perf_route_list_load`
- 364: `perf_background_publish_interval`
- 366: Network failover testleri
- 368: iOS permission orchestrator testleri
- 369 / 369A / 369B / 369C: permission/fallback testleri

## Kanit test komutlari
```bash
flutter test test/ui/passenger_tracking_map_perf_metric_test.dart test/ui/active_trip_map_perf_metric_test.dart
flutter test test/domain/queue_resilience_test.dart test/ui/active_trip_screen_sync_recovery_test.dart
flutter test test/features/permissions/application/location_permission_gate_test.dart test/features/permissions/application/ios_location_permission_orchestrator_test.dart test/features/permissions/application/notification_permission_fallback_service_test.dart test/features/permissions/application/android_battery_optimization_orchestrator_test.dart test/features/permissions/application/battery_optimization_fallback_service_test.dart
flutter analyze
flutter test
flutter test integration_test/smoke_startup_test.dart -d emulator-5554 --flavor dev --dart-define=APP_FLAVOR=dev --dart-define-from-file=.env.dev
```

## Emulator ayrintili test kaniti (2026-02-19)
- Cihaz: `emulator-5554` (`sdk_gphone64_x86_64`, Android 16)
- Build tipi: `dev debug`
- Cold start benchmark (10 tekrar, `am start -W TotalTime`):
  - Ham degerler (ms): `7489, 5925, 5737, 5793, 5884, 6190, 5691, 7399, 6093, 6027`
  - Ortalama: `6222.8 ms`
  - P95: `7489 ms`
  - Min/Max: `5691 / 7489 ms`
- Stress turu:
  - `monkey -p com.neredeservis.app.dev ... -v 3000` -> tamamlandi (`Monkey finished`)
  - `logcat` taramasinda `FATAL EXCEPTION/ANR` imzasi bulunmadi.
- Runtime snapshot:
  - `meminfo`: `TOTAL PSS 319594 KB`, `TOTAL RSS 273692 KB`, `TOTAL SWAP PSS 122557 KB`
  - `gfxinfo`: `Janky frames 90/115 (%78.26)`; 90p/95p/99p `85ms/150ms/300ms`
  - `battery`: level `100`, unplugged; `batterystats` discharge `0 mAh`
- Ham log dosyalari:
  - `tmp/emulator_monkey_2026-02-19.log`
  - `tmp/emulator_logcat_2026-02-19.log`
  - `tmp/emulator_logcat_fatal_2026-02-19.log`
  - `tmp/emulator_meminfo_2026-02-19.log`
  - `tmp/emulator_batterystats_pkg_2026-02-19.log`
  - `tmp/emulator_battery_state_2026-02-19.log`
- Not:
  - `gfxinfo` ve pil degerleri debug+emulator oldugu icin release KPI kapatma kaniti degildir.
  - 365/367/369D-E-F/370 maddeleri fiziksel cihaz ve tercihen release/profile build ile tekrar olculmelidir.

## Android fiziksel cihaz yarim otomatik test otomasyonu (2026-02-20)
- Script: `scripts/run_faz_g_365_370_android_validation.ps1`
- Runbook: `docs/faz_g_365_370_android_test_runbook.md`
- Kullanim:
  - Hazirlik:
    - `.\scripts\run_faz_g_365_370_android_validation.ps1 -Mode prepare -DeviceId 99TSTCV4YTOJYXC6 -PackageName com.neredeservis.app.dev`
  - Final rapor:
    - `.\scripts\run_faz_g_365_370_android_validation.ps1 -Mode finalize -SessionId <SessionId> -DeviceId 99TSTCV4YTOJYXC6 -PackageName com.neredeservis.app.dev`
- Otomasyon ne toplar:
  - battery start/end
  - package/appops dump
  - logcat dump + fatal/anr filtre
  - meminfo/gfxinfo/cpuinfo snapshot
  - session report + summary json + manuel checklist
- Son smoke session:
  - `SessionId: 20260220-031204`
  - `batteryStart=99`, `batteryEnd=99`, `batteryDelta=0`
  - `fatalCount=0`, `anrCount=0`
  - rapor: `tmp/faz_g_365_370/20260220-031204/session_report.md`
- Aktif manuel test session hazirligi:
  - `SessionId: 20260220-031321`
  - checklist: `tmp/faz_g_365_370/20260220-031321/manual_checklist.md`

## Fiziksel cihaz ek otomatik kanit (2026-02-20)
- Monkey denemesi:
  - komut: `adb shell monkey -p com.neredeservis.app.dev ... -v 6000`
  - sonuc: OEM guvenlik nedeniyle `INJECT_EVENTS` izni yok, event-1'de durdu.
- Fallback launch-loop (25 tekrar):
  - `am force-stop` + `am start -W` dongusu
  - sonuc: `count=25 fail=0 avg=3391.4ms p95=3557ms min=3291ms max=3568ms`
  - crash/anr: `FATAL=0`, `ANR=0`
  - kanit dizini: `tmp/faz_g_365_370/20260220-phys-launchloop-01`
- Fiziksel cihaz integration smoke:
  - `flutter test integration_test/smoke_startup_test.dart -d 99TSTCV4YTOJYXC6 ...` -> pass

## Manuel cihaz dogrulamasi gereken acik maddeler
- 365: Batarya tuketim olcumu
  - Teknik hedef: 2 saat aktif seferde ek tuketim `<= %8`.
  - Olcum: sefer baslangic/yaris/bitis pil yuzdesi + sefer suresi kayit.
- 367: Low-end cihaz testi
  - En az Samsung A24 sinifinda 30+ dk aktif sefer + rota/join/ayarlar gecis akisi.
- 369D: `while-in-use` red -> `Seferi Baslat` hard-block + neden metni.
- 369E: `background/always` red -> foreground-only + stale risk uyari metni.
- 369F: Pil optimizasyon reddi -> degrade mod + heartbeat uyari + ayarlar yonlendirmesi.
- 370: Kritik performans hedefleri
  - Crash-free `>= 99.5%`
  - Aktif seferde tazelik `%90 <= 15 sn`
  - Push teslimat `>= 95%`

## Cihaz notu
- 2026-02-19 turunda fiziksel Android cihaz `offline` oldugu icin manuel adimlar bu turda kosulamadi.
