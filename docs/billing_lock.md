# Billing Lock (099E)

Tarih: 2026-02-18
Durum: V1.0 icin kilitlendi

## Adapty Stack (Exact)
- `adapty_flutter: 3.15.3`

## Android Native Dependency Kaniti
- Kaynak dosya:
  - `%LOCALAPPDATA%/Pub/Cache/hosted/pub.dev/adapty_flutter-3.15.3/android/build.gradle`
- Tespit edilen satirlar:
  - `implementation platform('io.adapty:adapty-bom:3.15.2')`
  - `implementation 'io.adapty:android-sdk'`
  - `implementation 'io.adapty:android-ui'`
  - `implementation 'io.adapty:android-ui-video'`
  - `implementation 'io.adapty.internal:crossplatform:3.15.3'`

## NDK Uyumluluk Notu
- Android app modulu `ndkVersion = "25.1.8937393"` olarak sabitlendi.
- Plugin NDK uyari zinciri kalici olarak bu surume cekildi.

## V1.0 / V1.1 Ayrimi
- V1.0: paywall + mock/read-only subscription-state akisi (gercek tahsilat yok).
- V1.1: production Adapty billing acilisi + store review metinleri + canli tahsilat.

## Release Gate
- Billing/provider paket surumu degistiginde zorunlu:
  1. `flutter pub get`
  2. `flutter analyze`
  3. `flutter test`
  4. `docs/billing_lock.md` guncellemesi (native dependency kaniti yeniden yazilacak)
