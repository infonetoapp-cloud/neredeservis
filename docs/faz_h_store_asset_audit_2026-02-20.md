# FAZ H Store Asset Audit (STEP-389 / STEP-390)

Tarih: 2026-02-20  
Durum: Tamamlandi  
Etiket: codex

## STEP-389 App ikon/splash varliklari

### Android
- Launcher icon set mevcut:
  - `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- Splash background mevcut:
  - `android/app/src/main/res/drawable/launch_background.xml`
  - `android/app/src/main/res/drawable-v21/launch_background.xml`

### iOS
- AppIcon set mevcut:
  - `ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json`
  - `Icon-App-1024x1024@1x.png` dahil tum temel boyutlar mevcut.
- Launch image/storyboard mevcut:
  - `ios/Runner/Assets.xcassets/LaunchImage.imageset/*`
  - `ios/Runner/Base.lproj/LaunchScreen.storyboard`

### Sonuc
- V1.0 store publish icin icon/splash varlik seti repoda tam.

## STEP-390 Store screenshot set (Amber UI)

### Kaynak set
- `tmp/ui_regression_screens/20260220-034438`
- Icerik:
  - `01_launch.png`
  - `02_driver_path.png`
  - `03_passenger_path.png`
  - `04_guest_path.png`
  - `manifest.md`

### Sonuc
- Amber UI temsili role bazli store screenshot paketi hazir.
