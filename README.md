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
  - Bu repoda `android/gradle.properties` icinde `org.gradle.java.home` pinlenmistir.
- Android `minSdk` degeri Firebase Auth uyumu icin `23` olarak sabittir.

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

macOS/Linux:
```bash
./scripts/run_flavor.sh prod
./scripts/build_flavor.sh dev apk-release
```

## Firebase Opsiyon Dosyalari
- `lib/firebase/firebase_options_dev.dart`
- `lib/firebase/firebase_options_stg.dart`
- `lib/firebase/firebase_options_prod.dart`

## Not
- iOS icin dev/stg/prod scheme/flavor ayrimi bir sonraki adimda (Mac + Xcode) tamamlanacaktir.
- Mac/iPhone yoksa CI'da `ios no-codesign` derleme kontrolu calistirilir; App Store yayini icin finalde fiziksel iOS gate zorunludur.
