# Billing Lock (099E)

Tarih: 2026-02-17  
Durum: V1.0 icin kilitlendi

## Flutter IAP Stack (Exact)
- `in_app_purchase: 3.2.3`
- Transitive:
  - `in_app_purchase_android: 0.4.0`
  - `in_app_purchase_storekit: 0.4.0`
  - `in_app_purchase_platform_interface: 1.4.0`

## Android Billing Library Kaniti
- Kaynak dosya:
  - `%LOCALAPPDATA%/Pub/Cache/hosted/pub.dev/in_app_purchase_android-0.4.0/android/build.gradle`
- Tespit edilen satir:
  - `implementation 'com.android.billingclient:billing:7.1.1'`

## 6.x Uyum Notu
- Runbook maddesi `6.x` kontrolu istiyordu.
- Mevcut resmi Flutter plugin stack'i `7.1.1` kullaniyor.
- Sonuc:
  - `7.1.1`, `6.x` gereksinimini supersede eder (daha yeni).
  - Bu nedenle V1.0 lock karari `7.1.1` ile kabul edildi.

## V1.0 / V1.1 Ayrimi
- V1.0: paywall + mock/subscription-state akisi (gercek tahsilat yok).
- V1.1: production billing acilisi + store review metinleri + canli tahsilat.

## Release Gate
- IAP paket surumu degistiginde zorunlu:
  1. `flutter pub get`
  2. `flutter analyze`
  3. `flutter test`
  4. `billing_lock.md` guncellemesi (transitive billingclient satiri tekrar kanitlanacak)
