# Google Play Background Location Justification (TR) - STEP-086A

Tarih: 2026-02-17  
Durum: Onayli taslak (release gate'te Play formuna birebir girilecek metin)

## 1) Kisa Gerekce Metni
`Sofor aktif sefer baslattiginda yolcularin guvenli ve dogru takip edebilmesi icin uygulama arka planda konum paylasir. Sefer bitince takip durur.`

## 2) Uzun Aciklama (Form Icin)
`NeredeServis bir personel servis koordinasyon uygulamasidir. Sofor aktif seferi baslattiginda uygulama, yolcularin bekleme suresini azaltmak ve guvenli sekilde servisin yaklasma bilgisini gostermek icin arka planda konum guncellemesi gonderir. Konum erisimi sadece sofor rolunde ve aktif sefer boyunca kullanilir. Sefer sonlandirildiginda arka plan konum yayini otomatik olarak durur. Yolcu ve misafir rolde kullanici konumu alinmaz.`

## 3) Formda Tutarli Olmasi Gereken Cevaplar
- Kimden konum aliniyor?
  - Sadece `sofor` rolu
- Ne zaman?
  - Yalniz aktif sefer sirasinda
- Ne zaman duruyor?
  - `Sefer Bitir` ile aninda
- Yolcu konumu aliniyor mu?
  - Hayir

## 4) Kanit Ekranlari (Play Review Eki)
- Sofor aktif sefer ekrani:
  - `YAYINDASIN` durumu
  - `Seferi Bitir` kontrolu
- Izin red fallback ekrani:
  - `background izin yok -> foreground-only` uyari metni
- Rol ayrimi:
  - Yolcu/guest icin konum izni prompt'u olmadigini gosteren akis

## 5) Uyum Notlari
- Data Safety formu ile birebir tutarli olmalidir:
  - `Driver-only location`
  - `No passenger location collection`
- Play declaration metni ile uygulama ici izin metinleri celismemelidir.
