# Web Environment Variables Checklist (Landing + Panel)

Tarih: 2026-02-24
Durum: Faz 1 hazirlik checklisti

## 1. Amac

Env karmaşasini ve secret leakage riskini azaltmak.

Kural:
- Public config ile secret config ayri tutulur.

## 2. Naming Standard

Next.js public:
- `NEXT_PUBLIC_*`

Server-only:
- `*` (prefix zorunlu degil ama isimlendirme tutarli olacak)

Ortam suffix kullanma:
- Ayni isim, farkli environment'a farkli deger ver
- Ornek: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

## 3. Panel Uygulamasi - Public Env Listesi (MVP)

Zorunlu:
- [ ] `NEXT_PUBLIC_APP_ENV` (`dev|stg|prod`)
- [ ] `NEXT_PUBLIC_APP_NAME`
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN`

Opsiyonel:
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` (Firebase Web App registration hazir oldugunda; auth+rtdb bootstrap icin gecici olarak bos olabilir)
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (client side gerekiyorsa)
- [ ] `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN`
- [ ] `NEXT_PUBLIC_ENABLE_EMAIL_LOGIN`
- [ ] `NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN`

## 4. Panel Uygulamasi - Server Env Listesi (MVP/Faz 2)

MVP'de gerekmeyebilir ama planli:
- [ ] `SENTRY_AUTH_TOKEN` (CI/source maps vb. gerekiyorsa)
- [ ] `INTERNAL_API_SIGNING_SECRET` (gerekirse)
- [ ] `WEBHOOK_SECRET_*` (ileride)
- [ ] `ROUTE_SHARE_BASE_URL` (Functions: misafir/share link canonical hostu; ornek `https://app.neredeservis.app/r`)

Kural:
- Firebase Admin service credential browser bundle'a asla girmez.

## 5. Landing Uygulamasi - Public Env Listesi

Asgari:
- [ ] `NEXT_PUBLIC_APP_ENV`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_PANEL_URL`

Opsiyonel:
- [ ] analytics/consent ayarlari

## 6. Environment Bazli Deger Matrisi

### Dev
- Firebase: dev
- Mapbox: dev token (dusuk risk)
- login provider flags: acik
- analytics: kapali veya test

### Staging
- Firebase: stg
- Mapbox: stg token
- analytics: test/sinirli

### Prod
- Firebase: prod
- Mapbox: prod token
- analytics: policy'e gore

## 7. Secret Yönetim Kurallari

1. `.env.local` repo'ya girmez
2. Azure env panelinden girilen secretlar dokumanlanir (isim bazinda)
3. Secret degerleri plan dokumanina yazilmaz
4. Secret rotate proseduru (faz 5) yazilacak

## 8. Validation Checklist (Deploy oncesi)

Her ortam icin:
- [ ] Firebase projectId dogru
- [ ] database URL dogru
- [ ] Mapbox token dogru ortam tokeni
- [ ] `NEXT_PUBLIC_APP_ENV` dogru
- [ ] prod bundle'da dev/stg config yok

## 9. İlk Faz pratik not

MVP baslangicinda:
- landing ve panel env listeleri ayri tutulacak
- "tek env dosyasi her seyi cozer" yaklasimi kullanilmayacak
