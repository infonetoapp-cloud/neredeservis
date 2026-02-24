# ADR-002: Web Auth Provider Seti (Email/Password + Google)

Tarih: 2026-02-24
Durum: Accepted

## 1. Problem

Web panelde farkli tip kullanicilar olacak:
- bireysel sofor
- firma owner/admin/dispatcher/viewer

Login deneyimi:
- kolay onboarding
- dusuk destek yukü
- guvenli ama MVP hizini bozmayan
olmalı.

## 2. Karar

MVP auth provider seti:
- Email/Password
- Google Sign-In

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

## 4. Alternatifler

### A) Sadece Email/Password

Artı:
- daha basit ilk kurulum

Eksi:
- onboarding surtunmesi
- sifre operasyonu yuksek

### B) Sadece Google

Artı:
- kolay login

Eksi:
- kurumsal/kontrol gerektiren senaryolarda kisitli
- fallback zayif

## 5. Uygulama Notlari (MVP)

1. UI login ekrani iki secenek sunar:
- Email/Password
- Google ile giris

2. Authorization provider'dan bagimsizdir:
- login olmak yetki vermez
- company membership + role check gerekir

3. Hesap birlestirme/identity linking:
- Faz 2 konusu (gerekirse)

## 6. Faz 2+ Genişleme

- Zorunlu 2FA (firma policy)
- SSO/SAML/OIDC (kurumsal)
- Invite token + provider binding

## 7. Review Zamanı

Pilot sonunda:
- destek talepleri
- login basari oranlari
- security gereksinimleri
incelenerek yeniden degerlendirilir
