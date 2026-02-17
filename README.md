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
& $fvm flutter run --flavor dev -t lib/main_dev.dart
```

### Staging
```powershell
& $fvm flutter run --flavor stg -t lib/main_stg.dart
```

### Prod
```powershell
& $fvm flutter run --flavor prod -t lib/main_prod.dart
```

## APK Build
```powershell
& $fvm flutter build apk --debug --flavor dev -t lib/main_dev.dart
& $fvm flutter build apk --debug --flavor stg -t lib/main_stg.dart
& $fvm flutter build apk --debug --flavor prod -t lib/main_prod.dart
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

## Not
- iOS icin dev/stg/prod scheme/flavor ayrimi bir sonraki adimda (Mac + Xcode) tamamlanacaktir.
- Mac/iPhone yoksa CI'da `ios no-codesign` derleme kontrolu calistirilir; App Store yayini icin finalde fiziksel iOS gate zorunludur.
