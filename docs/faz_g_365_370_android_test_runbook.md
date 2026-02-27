# FAZ G 365-370 Android Test Runbook

Bu runbook, fiziksel Android cihazda kalan maddeler icin yarim otomatik dogrulama icindir.

## 1) Hazirlik
1. Cihaza dev build kurulu olsun:
   - `flutter run -d 99TSTCV4YTOJYXC6 --flavor dev -t lib/main_dev.dart --dart-define=APP_FLAVOR=dev --dart-define-from-file=.env.dev --no-resident`
2. Hazirlik scriptini calistir:
   - `.\scripts\run_faz_g_365_370_android_validation.ps1 -Mode prepare -DeviceId 99TSTCV4YTOJYXC6 -PackageName com.neredeservis.app.dev`

Script ciktisi:
- `tmp/faz_g_365_370/<SessionId>/manual_checklist.md`
- `tmp/faz_g_365_370/<SessionId>/session_metadata.json`

## 2) Manuel Akislar
`manual_checklist.md` dosyasindaki adimlari telefonda uygula:
- 369D: konum reddi -> `Seferi Baslat` hard-block + neden metni
- 369E: stale/foreground-only risk metni gorunurlugu
- 369F: pil optimizasyonu reddi -> degrade banner + settings CTA
- 367: min 30 dk low-end akis testi
- 365: 2 saat pil olcumu

## 3) Finalize ve Rapor
Manuel testten sonra:
- `.\scripts\run_faz_g_365_370_android_validation.ps1 -Mode finalize -SessionId <SessionId> -DeviceId 99TSTCV4YTOJYXC6 -PackageName com.neredeservis.app.dev`

Uretilen kanitlar:
- `tmp/faz_g_365_370/<SessionId>/session_report.md`
- `tmp/faz_g_365_370/<SessionId>/session_summary.json`
- `tmp/faz_g_365_370/<SessionId>/logcat_fatal_only.txt`
- `tmp/faz_g_365_370/<SessionId>/logcat_anr_only.txt`

## 4) Runbook Kapama Kriteri
- 365: `batteryDelta <= 8` (2 saat aktif sefer)
- 367: manuel akista kritik donma/crash yok
- 369D: hard-block metni teyit
- 369E: stale/foreground-only risk metni teyit
- 369F: degrade banner + ayarlar CTA teyit
- 370: lokal crash imzasi yok + backend KPI dogrulamasi yapildi
