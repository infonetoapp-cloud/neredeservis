# FAZ H Signing Audit (STEP-381 / STEP-382)

Tarih: 2026-02-20  
Durum: Tamamlandi (denetim cikti paketi hazir)  
Etiket: codex

## Kapsam
- STEP-381: Android signing yapisini kontrol et.
- STEP-382: iOS signing yapisini kontrol et.

## Android (381) - Bulgular
Denetlenen dosya: `android/app/build.gradle`

- `release` build tipi su an `signingConfigs.debug` kullaniyor.
- Repo icinde `android/key.properties` veya root `key.properties` dosyasi yok.
- Flavour/package yapisi dogru:
  - dev: `com.neredeservis.app.dev`
  - stg: `com.neredeservis.app.stg`
  - prod: `com.neredeservis.app`

### Android Sonuc
- Signing altyapisi gelistirme icin calisir durumda.
- Production release icin kesinlikle ozel keystore + `key.properties` gerektirir.

### Android Aksiyon (release oncesi zorunlu)
1. Play App Signing anahtari modelini netlestir.
2. `upload-keystore.jks` olustur ve guvenli sakla.
3. `key.properties` degerlerini yerel gizli dosyada doldur.
4. `android/app/build.gradle` icinde `release` sign config debug'dan ayrilacak sekilde baglanir.

## iOS (382) - Bulgular
Denetlenen dosyalar:
- `ios/Runner.xcodeproj/project.pbxproj`
- `ios/Flutter/Release-dev.xcconfig`
- `ios/Flutter/Release-stg.xcconfig`
- `ios/Flutter/Release-prod.xcconfig`

- `CODE_SIGN_STYLE = Automatic` tanimli.
- `DEVELOPMENT_TEAM` repo icinde sabitlenmis degil.
- Flavour bazli bundle id seti mevcut:
  - dev: `com.neredeservis.app.dev`
  - stg: `com.neredeservis.app.stg`
  - prod: `com.neredeservis.app`
- iOS signing/provisioning dosyalari (certificate/profile) repo disi ve henuz baglanmamis.

### iOS Sonuc
- Bundle ve target yapisi release'e uygun.
- Signing tarafi Apple Developer Team/provisioning baglantisi bekliyor.

### iOS Aksiyon (release oncesi zorunlu)
1. Apple Developer Team ID netlestir.
2. Her bundle id icin provisioning profile bagla.
3. Mac uzerinde archive + TestFlight upload dry-run yap.
4. App Store Connect capability/entitlement son kontrolunu tamamla.

## Gate Durumu
- 381: PASS (audit tamam, eksikler listelendi)
- 382: PASS (audit tamam, eksikler listelendi)
- Sonraki zorunlu adim: STEP-383 kullanici onayi
  - `Signing dosyalari hazir mi? (evet/hayir)`
