# Environment Usage Policy (Dev / Stg / Prod)

Tarih: 2026-02-24
Durum: Oneri / operasyon kurali

## 1. Amac

"Asil app'i kirletmeyelim, test ortamini kirletelim" hedefini operasyon kuralina cevirmek.

Bu dokuman:
- hangi ortamin ne icin kullanilacagini
- hangi verinin nereye yazilacagini
- hangi testlerin prod'da yasak oldugunu
tanımlar.

## 2. Ortamlar

Backend (Firebase):
- `dev` -> `neredeservis-dev-01`
- `stg` -> `neredeservis-stg-01`
- `prod` -> `neredeservis-prod-01`

Web (Azure):
- `web-dev` (preview/development)
- `web-stg` (staging, prod-benzeri)
- `web-prod` (production)

## 3. Eslestirme (onerilen)

- `web-dev` -> Firebase `dev`
- `web-stg` -> Firebase `stg`
- `web-prod` -> Firebase `prod`

Kural:
- `web-dev` asla `prod` Firebase'e baglanmaz.
- `web-stg` sadece release dogrulama ve demo/stakeholder testleri icin kullanilir.

## 4. Hangi ortam ne icin?

### 4.1 Dev

Kullanim:
- gunluk gelistirme
- kaba testler
- UI denemeleri
- backend endpoint denemeleri
- demo data resetleri

Izin verilenler:
- test sirketleri
- fake/seed data
- agresif loglama
- migration denemeleri (kontrollu)

Yasak:
- gercek musteri verisi
- "production gibi" performans sonuclari cikarmak

### 4.2 Staging

Kullanim:
- release adayi testleri
- prod-benzeri smoke/regression
- stakeholder demo (temiz test veri setiyle)
- rol/yetki ve policy dogrulamasi

Izin verilenler:
- secili demo data
- release candidate buildleri
- entegrasyon smoke

Yasak:
- gunluk gelistirme denemeleri
- gelişi guzel test datasi yigma
- "bir sey denerim" turu kirletici kullanımlar

### 4.3 Production

Kullanim:
- gercek kullanici trafigi
- canli is akislari

Yasak:
- manuel test route/spam verisi
- test kullanici/deneme datasi (ayri whitelisted tenant haric)
- feature denemeleri (flag olmadan)

## 5. Demo Stratejisi (kirletmeden gostermek icin)

Demo yapacagin zaman:
- Oncelik `stg`
- Demo tenant/firma ac
- Demo soforler/demo rotalar kullan
- Demo bitince temizleme checklisti uygula

Neden `stg`?
- `dev` cok degisken olabilir
- `prod` kirletilmez

## 6. Veri Hijyeni Kurallari

1. Ortamlar arasi manuel veri kopyalama yapma (gerekirse scriptli/anonymized)
2. Prod verisini dev/stg'ye tasima (PII nedeniyle) default olarak yasak
3. Demo data naming standardi kullan:
   - `DEMO_...`
   - `TEST_...`
4. Demo sirketleri expiration etiketi tasisin

## 7. Feature Flag Kurali

Yeni ozellik acilisi sirasiyla:
1. dev
2. stg
3. prod (kademeli)

Feature flag olmadan:
- riskli mutasyon endpointi
- yeni role/policy davranisi
- yeni harita/directions optimizasyonu
prod'a acilmaz.

## 8. Build ve Deploy Kurali

Web:
- preview branch deploy -> `web-dev` veya preview env
- staging release branch -> `web-stg`
- `main` + onay -> `web-prod`

Mobil:
- dev flavor -> Firebase dev
- stg flavor -> Firebase stg
- prod flavor -> Firebase prod

## 9. "Prod'u kirletme" icin Operasyon Kisa Kurali

Gunluk kural:
- Gelistirme = `dev`
- Sunum/dogrulama = `stg`
- Musteri = `prod`

Bu kural bozulursa:
- telemetry anlamsizlasir
- hata takibi zorlasir
- audit temizligi bozulur
- veri guvenilirligi azalir

## 10. Faz 1 Uygulama Notu

Ilk kodlamada bile:
- env badge (DEV/STG/PROD) UI'da gorunsun
- prod'da test/mod uyarisi olmasin
- dev/stg'de belirgin ortam etiketi olsun
