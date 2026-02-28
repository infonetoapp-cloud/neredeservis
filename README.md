# NeredeServis

Flutter 3.24.5 (FVM) tabanli cok-ortam (dev/stg/prod) iskeleti.

## Kilit Paket ve Kimlikler
- Android base package: `com.neredeservis.app`
- Android flavors:
  - `dev`: `com.neredeservis.app.dev`
  - `stg`: `com.neredeservis.app.stg`
  - `prod`: `com.neredeservis.app`
- iOS base bundle id: `com.neredeservis.app`

## On Kosul
- FVM ile kilitli Flutter: `3.24.5`
- Android build icin JDK 17
  - Lokal terminalde `JAVA_HOME` JDK17'yi isaret etmelidir.
- Android `minSdk` degeri Firebase Auth uyumu icin `23` olarak sabittir.
- iOS deployment target Firebase Auth uyumu icin `13.0` olarak sabittir.

## Calistirma
Windows'ta FVM PATH'te degilse:
```powershell
$fvm = "$env:LOCALAPPDATA\Pub\Cache\bin\fvm.bat"
```

### Dev
```powershell
& $fvm flutter run --flavor dev -t lib/main_dev.dart --dart-define=APP_FLAVOR=dev --dart-define-from-file=.env.dev
```

### Staging
```powershell
& $fvm flutter run --flavor stg -t lib/main_stg.dart --dart-define=APP_FLAVOR=stg --dart-define-from-file=.env.staging
```

### Prod
```powershell
& $fvm flutter run --flavor prod -t lib/main_prod.dart --dart-define=APP_FLAVOR=prod --dart-define-from-file=.env.prod
```

## APK Build
```powershell
& $fvm flutter build apk --debug --flavor dev -t lib/main_dev.dart --dart-define=APP_FLAVOR=dev --dart-define-from-file=.env.dev
& $fvm flutter build apk --debug --flavor stg -t lib/main_stg.dart --dart-define=APP_FLAVOR=stg --dart-define-from-file=.env.staging
& $fvm flutter build apk --debug --flavor prod -t lib/main_prod.dart --dart-define=APP_FLAVOR=prod --dart-define-from-file=.env.prod
```

## Script Kullanimlari
Windows:
```powershell
.\scripts\run_flavor.ps1 dev
.\scripts\build_flavor.ps1 stg apk-debug
```
Not: PowerShell scriptleri varsa yerel JDK17'yi otomatik baglar (`GRADLE_OPTS`).

macOS/Linux:
```bash
./scripts/run_flavor.sh prod
./scripts/build_flavor.sh dev apk-release
```

## Firebase Konfig Kaynagi
- V1.0 mobil kapsaminda Firebase init native dosyalardan okunur:
  - Android: `android/app/src/<flavor>/google-services.json`
  - iOS: `ios/Runner/GoogleService-Info.plist`
- `lib/firebase/firebase_options_*.dart` dosyalari repoda tutulmaz.

## Harita Anahtari Notu
- Google Maps entegrasyonunda Android icin `GOOGLE_MAPS_API_KEY` gerekir.
- Adres onerileri (Rota Olustur / Rota Guncelle) icin Google Cloud tarafinda `Places API` etkin olmalidir.
- `Places API` kapaliysa veya anahtar yetkisizse ekranlar yerel fallback onerileriyle calismaya devam eder.
- Anahtari `.env.*` dosyasina ekleyebilirsin (dart-define ile Gradle'a aktarilir):
```dotenv
GOOGLE_MAPS_API_KEY=AIzaSy...
```
- Flavor bazli native override istersen `android/gradle.properties` icine su anahtarlari ekleyebilirsin:
```properties
GOOGLE_MAPS_API_KEY_DEV=AIzaSy...
GOOGLE_MAPS_API_KEY_STG=AIzaSy...
GOOGLE_MAPS_API_KEY_PROD=AIzaSy...
```

## Not
- iOS icin dev/stg/prod scheme/flavor ayrimi bir sonraki adimda (Mac + Xcode) tamamlanacaktir.
- Mac/iPhone yoksa CI'da `ios no-codesign` derleme kontrolu calistirilir; App Store yayini icin finalde fiziksel iOS gate zorunludur.
