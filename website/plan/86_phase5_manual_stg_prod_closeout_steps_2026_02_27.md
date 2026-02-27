# Faz 5 Manual Closeout Steps (STG + PROD)

Tarih: 2026-02-27  
Durum: Action Required

Bu dosya, Faz 5 teknik otomasyonlar PASS olduktan sonra kalan manuel adimlari kapatmak icin kullanilir.

## 1) STG Candidate Kapatma

1. Vercel'de STG deployment ac:
   - Proje: `nsv-web-dev`
   - Kaynak: `main` branch son commit
   - Domain: varsa `stg-app.neredeservis.app` / yoksa preview URL
2. STG URL'de login smoke:
   - Email login calisiyor
   - Google login calisiyor
3. Role/mode guard smoke:
   - owner/admin/dispatcher/viewer gorunum ayrimi dogru
   - mode switch company/individual dogru
4. Route/stop smoke:
   - route create/update
   - stop add/remove/reorder
   - active trip soft-lock copy ve davranis dogru
5. Live ops smoke:
   - active trips listesi
   - map marker + secili sefer detayi
   - stale/offline semantik gorunurlugu
6. Audit smoke:
   - admin ekraninda son audit kayitlari listeleniyor
   - en az bir basarili ve bir denied kaydi gorunuyor
7. STG env badge kontrolu:
   - UI badge `STG` olmali
8. STG Firebase mapping kontrolu:
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` stg proje ile eslesmeli

### STG 525 (SSL Handshake) hizli cozum notu

Eger `stg-app.neredeservis.app` 525 donuyorsa:

1. Vercel domain dogrulamasi:
   - `stg-app.neredeservis.app` domaininin Vercel projede `Valid Configuration` oldugunu kontrol et.
2. DNS tipi:
   - Cloudflare kaydi `DNS only` olmali (proxy kapali).
3. Kayit tipi:
   - `CNAME stg-app -> cname.vercel-dns.com` tercih et.
   - A kaydi kullaniyorsan Vercel IP seti guncel olmali.
4. SSL propagation:
   - DNS degisikliginden sonra 5-20 dk bekleyip probe'u tekrar kos.

## 2) PROD Closeout

1. Prod domain login smoke (`app.neredeservis.app`):
   - email/google login
2. PROD env deger/domain kontrolu:
   - `NEXT_PUBLIC_APP_ENV=prod`
   - firebase/mapbox key varligi
   - `ROUTE_SHARE_BASE_URL=https://app.neredeservis.app/r`
3. CORS/origin allow-list:
   - prod originler allow-listte
4. Cost alerts:
   - Vercel/Firebase/Mapbox alarmlari aktif
5. Monitoring:
   - temel dashboard/metric erisimi var
6. Firebase prod mapping:
   - auth/firestore/rtdb dogru projeye bagli

## 3) Tamamlandiginda Guncellenecek Dosyalar

- `website/plan/81_phase5_release_checklist_execution_log_2026_02_27.md`
  - PENDING/PARTIAL -> DONE
- `website/plan/80_phase5_scope_and_closeout_execution_2026_02_27.md`
  - `Durum: Closed` olarak cekilir
- `website/plan/16_master_phase_plan_detailed.md`
  - Faz 5 -> tamam, Faz 6 -> basladi

## 4) Faz 5 Exit Kriteri

Asagidaki 4 madde tamamlaninca Faz 5 kapanir:

1. STG smoke maddeleri tamamlaniyor.
2. PROD kontrol maddeleri tamamlaniyor.
3. Checklist log dosyasi DONE duruma cekiliyor.
4. Master phase snapshot'ta Faz 6 girisi aciliyor.
