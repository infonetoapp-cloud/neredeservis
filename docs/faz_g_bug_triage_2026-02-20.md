# FAZ G Bug Triage (P0/P1/P2)

Tarih: 2026-02-20  
Kapsam: Runbook 374/375/376

## Ozet
- P0: 0 adet (acik kritik crash/data-loss yok)
- P1: 4 adet (manuel cihaz dogrulamasi bekleyen izin/perf maddeleri)
- P2: 2 adet (test otomasyonu ortamiyla ilgili non-blocking kisit)

## P0
- Yok.

## P1
1. `369D` - while-in-use red durumunda `Seferi Baslat` hard-block + net neden metni manuel teyidi eksik
   - Durum: Acik
   - Kanit: `tmp/faz_g_365_370/20260220-031321/manual_checklist.md`
   - Sonraki aksiyon: fiziksel cihazda checklist adimini tamamlayip `finalize` calistirmak

2. `369E` - arka plan/foreground-only fallback + stale risk metni manuel teyidi eksik
   - Durum: Acik
   - Kanit: `tmp/faz_g_365_370/20260220-031321/manual_checklist.md`
   - Sonraki aksiyon: fiziksel cihazda stale/fallback banner gorunurlugu notlanacak

3. `369F` - pil optimizasyon reddi degrade mode + settings CTA manuel teyidi eksik
   - Durum: Acik
   - Kanit: `tmp/faz_g_365_370/20260220-031321/manual_checklist.md`
   - Sonraki aksiyon: `Simdi Degil` senaryosu manuel kosulacak

4. `365/367/370` - 2 saat pil + low-end 30+ dk + KPI kapanisi manuel/operasyonel teyit eksik
   - Durum: Acik
   - Kanit: `tmp/faz_g_365_370/20260220-031321/manual_checklist.md`
   - Sonraki aksiyon: uzun tur + `finalize` raporu + backend KPI kontrolu

## P2
1. Fiziksel cihazda `adb shell monkey` input enjeksiyon kisiti (`INJECT_EVENTS`)
   - Durum: Acik (non-blocking)
   - Etki: otomatik stress coverage kisitli
   - Mitigasyon: `launch-loop` fallback (`tmp/faz_g_365_370/20260220-phys-launchloop-01`)

2. Fiziksel cihazda `adb shell input tap` kisiti (`INJECT_EVENTS`)
   - Durum: Acik (non-blocking)
   - Etki: screenshot set fizikselde tam otomatik alinmiyor
   - Mitigasyon: emulator screenshot set (`tmp/ui_regression_screens/20260220-034438`)

## 376 Plani (P1 icin)
- Session: `20260220-031321`
- Adimlar:
  1. `manual_checklist.md` adimlarini cihazda tamamla.
  2. `.\scripts\run_faz_g_365_370_android_validation.ps1 -Mode finalize -SessionId 20260220-031321 ...` calistir.
  3. Raporu `docs/proje_uygulama_iz_kaydi.md` icine append et.
  4. Sonuca gore 369D/369E/369F ve 365/367/370 checklist maddelerini kapat.
