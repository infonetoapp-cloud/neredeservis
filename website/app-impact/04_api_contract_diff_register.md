# API Contract Diff Register (Web -> App)

Tarih: 2026-02-24
Durum: Aktif (web implementasyonu sirasinda doldurulur)

## 1. Amac

Web implementasyonu ilerlerken backend kontratlarinda app'i etkileyen farklari
tek tabloda tutmak.

Bu dosya:
- endpoint bazli degisiklikleri toplar
- app entegrasyon sprintinde "ne degisti?" sorusunu hizli cevaplar
- accidental breaking change riskini azaltir

## 2. Ne Buraya Yazilir?

- request field eklendi/kaldirildi/rename edildi
- response field semantigi degisti
- yeni reason/error code eklendi
- authz/policy red reason'lari degisti
- version/cutoff davranisi degisti (`426`, read-only vb.)

## 3. Kayit Formati

- `ID`:
- `Endpoint/Action`:
- `Degisiklik Tipi`: (`request`, `response`, `error_code`, `authz`, `versioning`)
- `Web Degisikligi (ozet)`:
- `App Etkisi`:
- `Backward Compatible mi?` (`yes/no/partial`)
- `Cutoff Gerekli mi?` (`yes/no`)
- `Ilgili Web Docs`:
- `Ilgili App Layer`:
- `Durum`:

## 4. Baslangic Seed Kayitlari

### API-DIFF-001
- `Endpoint/Action`: Legacy mobile mutasyon endpointleri (`v1` yollar)
- `Degisiklik Tipi`: `versioning`
- `Web Degisikligi (ozet)`: Aggressive force update + server-side version enforcement + `426 Upgrade Required`
- `App Etkisi`: App error handling / force update fallback / shim davranisi gerekir
- `Backward Compatible mi?`: `partial`
- `Cutoff Gerekli mi?`: `yes`
- `Ilgili Web Docs`: `plan/58_*.md`, `plan/71_*.md`
- `Ilgili App Layer`: network error mapping / router / session
- `Durum`: `triaged`

### API-DIFF-002
- `Endpoint/Action`: Route/trip mutasyon reason codes
- `Degisiklik Tipi`: `error_code`
- `Web Degisikligi (ozet)`: active-trip route structure soft-lock reason code'lari (stop delete/reorder deny)
- `App Etkisi`: Driver app warning/error copy map etmesi gerekir
- `Backward Compatible mi?`: `yes` (genel hata fallback ile), ama UX bozulur
- `Cutoff Gerekli mi?`: `no`
- `Ilgili Web Docs`: `plan/42_*.md`, `plan/62_*.md`
- `Ilgili App Layer`: driver route management / active trip actions
- `Durum`: `triaged`

