# iOS APNs + FCM + Background Location Entitlement Gereksinimleri (STEP-086)

Tarih: 2026-02-17  
Durum: Aktif referans (release gate oncesi zorunlu kontrol listesi)

## 1) Kapsam
- iOS push bildirimlerinin Firebase Cloud Messaging (FCM) ile calismasi.
- iOS background location akisinin App Store policy ile uyumlu kurulmasi.

## 2) Firebase Tarafi Gereksinimler
- Her Firebase projesinde (`dev`, `stg`, `prod`) iOS app kaydi bulunmali.
- FCM aktif olmali (STEP-044 tamamlandi).
- APNs auth key baglantisi her ortamda dogrulanmali:
  - `.p8` dosyasi
  - `Key ID`
  - `Team ID`
- Not:
  - Ayni Apple Team altindaki projelerde ayni APNs key kullanilabilir.
  - Ancak her Firebase projesinde ayri baglama/dogrulama gerekir.

## 3) Xcode Capability / Entitlement Gereksinimi
- `Signing & Capabilities` altinda zorunlu:
  - `Push Notifications`
  - `Background Modes`
    - `Remote notifications`
    - `Location updates`

## 4) Info.plist Gereksinimi
- Zorunlu aciklama anahtarlari:
  - `NSLocationWhenInUseUsageDescription`
  - `NSLocationAlwaysAndWhenInUseUsageDescription`
- Arka plan davranisi icin:
  - `UIBackgroundModes` icinde `location` ve `remote-notification`

## 5) Izin Isteme Kontrati (Policy Uyumlu)
- Yolcu/guest rolde location izni istenmez.
- Sofor rolde sira zorunlu:
  1. `When In Use`
  2. Aktif seferde gerekceyle `Always`
- Red durumlari:
  - `When In Use` red -> aktif sefer baslatilmaz (hard-block)
  - `Always` red -> foreground-only fallback + acik uyari

## 6) Apple Review Notu (Terminoloji)
- "Tracking" yerine su dil kullanilir:
  - `Trip sharing`
  - `Route coordination`
  - `Driver guidance`
- Kanit senaryosu:
  - sofor aktif seferdeyken sonraki durak mesafesi gorur
  - yolcular bekleme suresini optimize etmek icin anlik konum gorur
  - sefer bitince background publish durur

## 7) Test Kapsami (Release Gate)
- Fiziksel iPhone zorunlu test:
  - Ekran kilitli 60 dk
  - Uygulama background/terminate senaryolari
  - Push teslimati (APNs -> FCM)
- Bu kanitlar olmadan iOS release alinmaz.

## 8) 087 Adimi Icin Kullanicidan Istenecek Bilgiler
- APNs `.p8` dosyasi
- `Key ID`
- `Team ID`
- Apple Developer Team adi
