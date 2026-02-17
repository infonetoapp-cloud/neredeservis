# Firebase Google Sign-In Repair Playbook

Tarih: 2026-02-17  
Durum: Aktif (kritik)

## Problem Ozeti
- Firebase Auth `google.com` provider acik olsa da mobil config dosyalarinda gerekli OAuth alanlari dolmuyor:
  - Android `google-services.json` -> `oauth_client` bos
  - iOS `GoogleService-Info.plist` -> `CLIENT_ID` ve `REVERSED_CLIENT_ID` yok
- Bu durumda mobil Google Sign-In sahada kirilabilir (`DEVELOPER_ERROR`, token akis hatasi, iOS URL scheme eksigi).

## Koken Neden
- `defaultSupportedIdpConfigs/google.com` provider, standart Google OAuth istemcileri yerine IAM OAuth istemcisine baglanmis durumda.
- IAM OAuth istemcileri bu use-case icin yanlistir.
- Beklenen format:
  - `*.apps.googleusercontent.com` (standart OAuth Client ID)

## Kritik Kural
- `gcloud iam oauth-clients` ile uretilen istemciler Firebase mobil Google Sign-In icin kullanilmaz.
- Google Sign-In provider sadece standart OAuth Client ID seti ile baglanir.

## Duzeltme Akisi (Manual, Console)

Her proje icin ayri uygulayin:
- `neredeservis-dev-01`
- `neredeservis-stg-01`
- `neredeservis-prod-01`

1. Firebase Console -> ilgili proje -> `Authentication` -> `Sign-in method`.
2. `Google` provider'i ac.
3. Eger gorunuyorsa mevcut custom/yanlis OAuth bagini kaldir:
   - disable/save
   - tekrar enable/save
4. Google Cloud Console -> `APIs & Services` -> `Credentials`:
   - OAuth client listesinde standart istemcileri dogrula:
     - Android (package + SHA)
     - iOS (bundle id)
     - Web client (gerekli akislarda)
   - Client ID formati `*.apps.googleusercontent.com` olmali.
5. Firebase app config dosyalarini yeniden indir:
   - Android: `google-services.json`
   - iOS: `GoogleService-Info.plist`

## CLI Dogrulama (Zorunlu)

PowerShell:

```powershell
.\scripts\check_google_signin_readiness.ps1
```

Beklenen:
- Tum projelerde `status = PASS`
- `providerClientIdStandard = True`
- `androidOauthClientPresent = True`
- `iosClientIdPresent = True`

## Dogrulama Sonrasi Uygulanacaklar
1. Yeni config dosyalarini yerel flavor pathlerine kopyala.
2. `flutter analyze`
3. `flutter test`
4. Android debug cihazda Google giris smoke testi.
5. iOS (CI compile + daha sonra fiziksel cihaz) smoke testi.
6. `docs/proje_uygulama_iz_kaydi.md` append-only kayit ekle.

## Notlar
- Bu playbook tamamlanmadan Google Sign-In production-ready kabul edilmez.
- Bu adim policy gereksinimi degil, calisan auth akisi icin teknik zorunluluktur.

