# Firebase STEP-040..045 Kanit Ozeti

Tarih: 2026-02-17

## STEP-040 - RTDB instance (region uyumlu)

Durum: Tamamlandi (dev/stg/prod)

- `neredeservis-dev-01-default-rtdb` -> `europe-west1`
- `neredeservis-stg-01-default-rtdb` -> `europe-west1`
- `neredeservis-prod-01-default-rtdb` -> `europe-west1`

Not:
- RTDB `europe-west3` desteklemedigi icin kontrollu istisna ile `europe-west1` kullaniliyor.
- Bu istisna teknik plan ve platform blueprint ile senkronlandi.

## STEP-041 - Cloud Functions region = europe-west3

Durum: Tamamlandi

- Region lock kod seviyesinde sabitlendi:
  - `lib/config/firebase_regions.dart` -> `firebaseFunctionsRegion = 'europe-west3'`
- Callable clientlar bu merkezi sabiti kullaniyor:
  - `lib/features/auth/data/bootstrap_user_profile_client.dart`
  - `lib/features/auth/data/update_user_profile_client.dart`
- GCP servis aktivasyon dogrulamasi:
  - `cloudfunctions.googleapis.com` (dev/stg/prod enabled)
  - `run.googleapis.com` (dev/stg/prod enabled)

## STEP-042 - Auth providerlari (Email + Google)

Durum: Tamamlandi (dev/stg/prod)

- Auth initialize:
  - `identityPlatform:initializeAuth` cagrisi uygulandi (idempotent)
- Email/Password:
  - `signIn.email.enabled = true`
  - `signIn.email.passwordRequired = true`
- Google:
  - `defaultSupportedIdpConfigs/google.com enabled = true`
  - OAuth client + credential IAM uzerinden uretilip providera baglandi

## STEP-043 - Anonymous Auth (guest flow)

Durum: Tamamlandi (dev/stg/prod)

- `signIn.anonymous.enabled = true`

## STEP-044 - FCM aktif

Durum: Tamamlandi (dev/stg/prod)

- `fcm.googleapis.com` enabled
- `fcmregistrations.googleapis.com` enabled

## STEP-045 - App Check konfigurasyon taslagi

Durum: Tamamlandi

- Taslak dokuman eklendi:
  - `docs/app_check_konfig_taslagi.md`
- App Check API dogrulamasi:
  - `firebaseappcheck.googleapis.com` dev/stg/prod enabled
