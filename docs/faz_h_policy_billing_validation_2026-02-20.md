# FAZ H Policy + Billing Validation (STEP-387E / 387F / 401C / 401E / 401F)

Tarih: 2026-02-20  
Durum: Tamamlandi  
Etiket: codex

## STEP-387E - Play kategori secimi kilidi
- Karar: `Travel & Local`
- Gerekce:
  - Uygulama personel servis rota koordinasyonu, ETA ve yolculuk paylasimi use-case'ine odakli.
  - Ulasim/rota kullanimi kategorik olarak `Travel & Local` ile uyumlu.

## STEP-387F - Store billing uyum kaniti
- Adapty SDK kilidi:
  - `pubspec.yaml`: `adapty_flutter: ^3.15.3`
  - `docs/billing_lock.md`: exact bagimlilik ve native dependency kaniti mevcut.
- V1.0 billing politikasi:
  - Gercek tahsilat acik degil, mock/read-only subscription state.
  - Kaynaklar:
    - `docs/billing_lock.md`
    - `docs/faz_h_store_policy_pack_tr_2026-02-20.md`

## STEP-401C - Hesap silme interceptor + manage yonlendirme dogrulamasi
- Uygulama davranisi:
  - `deleteUserData` sonucu `blocked_subscription` ise dialog acilir.
  - Dialogda `Manage Subscription` CTA bulunur.
  - CTA, platform URL'ine (payload veya fallback) yonlendirme dener.
- Kod:
  - `lib/app/router/app_router.dart`
    - `_handleDeleteAccount(...)`
    - `_resolveDeleteInterceptorManageUri(...)`

## STEP-401E - Apple review terminoloji uyumu
- Hazir metinlerde kilit terminoloji:
  - `Route Coordination`
  - `Trip Sharing`
- Kaynaklar:
  - `docs/faz_h_store_policy_pack_tr_2026-02-20.md`
  - `docs/faz_h_store_listing_copy_tr_2026-02-20.md`

## STEP-401F - V1.0 purchase API cagrisi yok dogrulamasi
- Paywall satin alma aksiyonu V1.0'da mock/read-only mesaji verir.
- Gercek purchase callable/SDK purchase flow app icinde tetiklenmiyor.
- Kod:
  - `lib/app/router/app_router.dart` -> `_handlePaywallPurchaseTap(...)`
- Ek test kaniti:
  - `flutter test test/ui/settings_screen_test.dart test/ui/paywall_screen_test.dart` -> pass
  - `flutter analyze` -> pass
