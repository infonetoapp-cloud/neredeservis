# Faz 9 Manual Acceptance Pack

Tarih: 2026-02-27 23:54:35
Durum: PASS

## Hedef
- App tarafi parser/mapping closure oncesi en kritik 3 acceptance akisini tek pakette standartlastirmak.

## Akis-1: Company Context Recoverability
1. Web panelde https://app.neredeservis.app/login uzerinden owner hesapla giris yap.
2. Dashboard -> mode seciminden company mode aktifken logout yap, tekrar login ol.
3. Beklenen: active company fallback deterministic olmali; mode secimi null-state'e dusmemeli.
4. Hata olursa not: parser katmani listMyCompanies + activeCompany resolver tarafi bloklaniyor.

## Akis-2: Route/Stop Conflict Recovery
1. Ayni route icin iki farkli oturum ac: A ve B.
2. A oturumunda stop sirasini degistir; B oturumunda stale token ile update dene.
3. Beklenen: UPDATE_TOKEN_MISMATCH mesaji gorunur; reload + retry ile islem toparlar.
4. Hata olursa not: reason-code -> mesaj mapping eksigi veya stale token retry akisi bozuk.

## Akis-3: Live Ops RTDB Fallback Semantigi
1. Live Ops ekraninda aktif sefer seciliyken RTDB stream baglantisini kes/simule et.
2. Beklenen: live.source 	rip_doc fallback'e gecmeli; online/stale semantigi korunmali.
3. Yeniden baglanmada durum tdb kaynagina sorunsuz donmeli; stale ghost state birikmemeli.
4. Hata olursa not: app stream parser + stale state machine closure gerektirir.

## Kanit Kayit Format
- Her akis icin tek satir: `PASS/FAIL | tarih-saat | ortam | not`
- Bu cikti app tarafi smoke raporuna aktarilir: `website/app-impact/13_app_regression_smoke_checklist_phase9.md`

## Kural
- Bu paket web davranisini degistirmez; yalniz acceptance standardini sabitler.
