# ADR-002: Web Auth Provider Seti (MVP: Email/Password + Google + Microsoft)

Tarih: 2026-02-24
Durum: Accepted

## 1. Problem

Web panelde farkli tip kullanicilar olacak:
- bireysel sofor
- firma owner/admin/dispatcher/viewer

Login deneyimi:
- kolay onboarding
- dusuk destek yuku
- guvenli ama MVP hizini bozmayan
olmalidir.

## 2. Karar

MVP auth provider seti:
- Email/Password
- Google Sign-In
- Microsoft Sign-In (`microsoft.com`; UI copy: `Microsoft ile Giris`)

Rollout kurali:
- Microsoft login feature-flag ile kontrol edilir (`NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN`)

## 3. Neden?

Email/Password:
- kurumsal hesap kontrolu
- fallback/kesin login metodu

Google:
- hizli onboarding
- sifre unutma destegi ihtiyacini azaltma
- bireysel kullanicilar icin friction azaltma

Kombinasyon:
- hem kurumsal hem bireysel onboardingi dengeler

Microsoft:
- B2B tarafta Microsoft 365 kullanan firmalar icin degerli
- Azure App Registration + redirect URI + secret yonetimi gerektirir
- bu nedenle flag-kapali acilis / kontrollu rollout uygulanir

## 4. Alternatifler

### A) Sadece Email/Password

Arti:
- daha basit ilk kurulum

Eksi:
- onboarding surtunmesi
- sifre operasyonu yuksek

### B) Sadece Google

Arti:
- kolay login

Eksi:
- kurumsal/kontrol gerektiren senaryolarda kisitli
- fallback zayif

### C) MVP'de Email/Password + Google + Microsoft

Arti:
- B2B login secenekleri genisler

Eksi:
- Faz 1 delivery hizini dusurur
- Microsoft provider setup/test yukunu erken getirir

## 5. Uygulama Notlari (MVP)

1. UI login ekrani uc secenek sunar:
- Email/Password
- Google ile giris
- Microsoft ile giris

2. Authorization provider'dan bagimsizdir:
- login olmak yetki vermez
- company membership + role check gerekir

3. Hesap birlestirme / identity linking:
- Faz 2 konusu (gerekirse)

## 6. Microsoft Uygulama Notlari

- Firebase Auth provider: `microsoft.com`
- UI copy: `Microsoft ile Giris`
- Redirect URI ve authorized domains:
  - `localhost`
  - Vercel dev domainleri
  - `app.neredeservis.app` (custom domain cutover sonrasi)
- Azure App Registration (tenant/app secret) gerekir
- Feature flag ile asamali acilir (`dev -> pilot -> prod`)

## 7. Faz 2+ Diger Genislemeler

- Zorunlu 2FA (firma policy)
- SSO/SAML/OIDC (kurumsal)
- Invite token + provider binding

## 8. Fazlama Notu (Execution)

Microsoft Sign-In delivery hizini bozmadan eklenmistir:
- UI ve client auth aksiyonu flag kontrollu calisir
- provider setup eksik ortamlarda `operation-not-allowed`/domain hatalari beklenen davranistir
- rollout sirasinda authorized domain + Azure app registration checklist'i zorunludur

## 9. Review Zamani

Pilot sonunda:
- destek talepleri
- login basari oranlari
- security gereksinimleri
incelenerek yeniden degerlendirilir.
