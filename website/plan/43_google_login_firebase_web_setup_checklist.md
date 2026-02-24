# Google Login + Firebase Web Auth Setup Checklist (Dev/Stg/Prod)

Tarih: 2026-02-24
Durum: Faz 1 hazirlik checklisti

## 1. Amac

Web panelde `Email/Password + Google` login kararini guvenli ve ortam ayrimli sekilde kurmak.

Bu dokuman:
- Firebase Console
- Google provider
- authorized domains
- web app config
- Azure env mapping
icin checklist verir.

## 2. Hedef Provider Seti (MVP)

- Email/Password
- Google Sign-In

Not:
- Bu karar ADR ile kilitli: `22_web_auth_provider_decision.md`

## 3. Firebase Proje Bazli Kurulum (ayri ayri)

Her proje icin ayri kontrol:
- `neredeservis-dev-01`
- `neredeservis-stg-01`
- `neredeservis-prod-01`

Kural:
- Bir projedeki auth ayari digerine otomatik gecmez.

## 4. Firebase Console Checklist (Her Ortam)

### 4.1 Authentication Providers

- [ ] Email/Password enabled
- [ ] Google provider enabled
- [ ] Support email dogru
- [ ] Project branding/basic metadata kontrol edildi

### 4.2 Authorized Domains

Dev:
- [ ] local dev domain(ler)i (gerekliyse)
- [ ] Azure preview/generated domain(ler)i (dev)

Staging:
- [ ] Azure generated staging/preview domain
- [ ] `stg-app.neredeservis.app` (acildiginda)

Prod:
- [ ] `app.neredeservis.app`
- [ ] gerekirse `neredeservis.app` (landing auth yonlendirme varsa)

Kural:
- Prod projeye dev/preview domainlerini gereksiz ekleme

### 4.3 Sign-in UX / Policy

- [ ] hesap olusturma akisi karari net (self-signup / invite-first)
- [ ] email verification policy karari (MVP/sonrasi)
- [ ] password reset akisi planli

## 5. Google Cloud / OAuth Konsent Ekrani Notu

Firebase Google Sign-In kullanilsa da su kontrol edilir:
- [ ] OAuth consent branding uygun
- [ ] uygulama adi/pro support email dogru
- [ ] test/production durumlari farkinda olunarak ilerlenir

Not:
- MVP'de internal/pilot kullanimda test mod kabul edilebilir
- Public rollout oncesi Google auth branding duzeni profesyonel olmalı

## 6. Firebase Web App Registrations (onerilen)

Her backend ortamina karsilik web app kaydi:
- [ ] web-dev app registration
- [ ] web-stg app registration
- [ ] web-prod app registration

Kaydedilecek alanlar:
- `apiKey`
- `authDomain`
- `projectId`
- `appId`
- `databaseURL`

Kural:
- Bu degerler `27_web_env_variables_checklist.md` formatinda Azure env'e girilir.

Operasyon notu (gercek dunya):
- Firebase CLI `apps:list` / `searchApps` icin IAM yetkisi olmayabilir (`PERMISSION_DENIED`)
- Bu durumda web app registration + sdk config degerleri Firebase Console'dan manuel alinip kaydedilir
- CLI yetkisi sonradan acilsa da Console fallback yolunu runbook'ta koru

Guncel execution notu (Faz 1):
- Mevcut Firebase CLI hesabi (`sinancnplt21@gmail.com`) `neredeservis-*` projelerini `projects:list` icinde gormuyor; `apps:list` `PERMISSION_DENIED`
- `canpolatmail0@gmail.com` gcloud hesabi proje sahibi olarak dogrulandi (`dev/stg/prod`)
- Firebase Management API cagrilarinda `x-goog-user-project` header zorunlu (quota project hatasi aksi halde `403`)
- 2026-02-24 tarihinde `dev/stg/prod` icin Firebase Web App registrations olusturuldu (bkz. `docs/firebase_app_registry.md`)
- `Email/Password` ve `Google` provider durumlari `dev/stg/prod` icin API uzerinden dogrulandi (enabled)
- Lokal auth smoke icin `dev` + `stg` authorized domains listesine `localhost` ve `127.0.0.1` eklendi
- Lokal web bootstrap su an gercek `dev` web sdk config ile ilerliyor (`NEXT_PUBLIC_FIREBASE_APP_ID` dahil)

## 7. Azure SWA Env Mapping Checklist (Panel)

Dev (`web-dev`):
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` = dev
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = dev
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = dev
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` = dev (web app registration varsa; yoksa bootstrap asamasinda gecici bos olabilir)
- [ ] `NEXT_PUBLIC_FIREBASE_DATABASE_URL` = dev
- [ ] `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true`
- [ ] `NEXT_PUBLIC_ENABLE_EMAIL_LOGIN=true`

Stg (`web-stg`):
- [ ] ayni set = stg degerleri

Prod (`web-prod`):
- [ ] ayni set = prod degerleri

## 8. Auth Smoke Tests (Her Ortam)

### Email/Password
- [ ] login success
- [ ] wrong password fail message
- [ ] password reset trigger

### Google
- [ ] popup/redirect flow success
- [ ] unauthorized-domain hatasi yok
- [ ] login sonrasi session bootstrap calisiyor

### Authz
- [ ] login oldum diye panelde her yere giremiyorum (role guard)

## 9. Sık Yapilan Hatalar (ve onleme)

1. Prod panelin dev Firebase'e baglanmasi
- Cozum: env badge + deploy checklist

2. Google login dev preview domaininde calismiyor
- Cozum: authorized domains listesi check

3. Prod projeye fazla preview domain eklemek
- Cozum: dev/stg/prod domain listelerini ayri tut

4. Firebase config degerlerini repo dosyasina sabitlemek
- Cozum: Azure env vars + dokuman checklist

## 10. Faz 1 Exit Kriteri (Auth)

- [ ] dev panelde Email login calisiyor
- [ ] dev panelde Google login calisiyor
- [ ] session bootstrap calisiyor
- [ ] mode selector / guard shell calisiyor
- [ ] env badge dogru
