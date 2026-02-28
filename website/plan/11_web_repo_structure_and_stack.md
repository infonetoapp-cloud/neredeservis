# Web Repo Structure + Stack Karari (MVP-Cut Revision)

Tarih: 2026-02-24
Durum: Oneri / Faz 0 (review sonrasi revize)

## 1. Ana Karar (MVP)

Web tarafi:
- Dil: TypeScript
- Framework: Next.js (React)
- UI: component-first
- Hosting: Azure Static Web Apps
- **MVP repo/app modeli: tek Next.js app (marketing + panel route groups)**

## 2. Neden Next.js + TypeScript?

- Landing + panel ayni teknoloji ailesinde cozulur
- SSR/SEO (landing) + auth-protected panel ayni ekosistemde cozulur
- Type safety ile API kontrat uyumu artar
- Uzun vadede ekip buyurse onboarding daha kolay olur

## 3. Repo Yapisi Karari (revize)

### 3.1 MVP default (onerilen)

Su an:
- `website/plan/*`

Kod baslayinca hedef (MVP):
- `website/apps/web`
- `website/packages/contracts` (opsiyonel ama onerilen)
- `website/packages/ui` (opsiyonel, ortak UI)
- `website/docs/adr` (opsiyonel)

`website/apps/web` icinde route gruplari:
- `src/app/(marketing)` -> landing/pricing/public pages
- `src/app/(dashboard)` -> panel/auth-protected pages
- `src/app/(auth)` -> login/forgot-password vb.

### 3.2 Neden tek app? (solo-founder velocity)

- CI/CD ve env yonetimi sade olur
- dependency/version drift riski azalir
- build/deploy sayisi azalir
- ortak auth/session shell tekrar etmez
- landing + panel tasarim dili tek codebase'de daha tutarli kalir

### 3.3 Post-pilot split trigger (gerekiyorsa)

Asagidaki durumlarda split dusunulur:
- deploy hizlari/rollback ihtiyaci ayrisir
- marketing ekip/icerik akisi panel release cadence'ini bozuyor
- bundle/build complexity ciddi artis gosteriyor
- farkli runtime/caching ihtiyaclari doguyor

Bu durumda:
- `landing` ve `panel` ayri app/SWA'ya ayrilabilir
- Ama MVP default bu degildir
- Alternatif ara adim: tek repo + tek codebase korunup deploy target'lari ayrisir (landing/panel ayri SWA) [ihtiyaca gore]

## 4. Panel Tech Stack (onerilen)

Zorunlu:
- Next.js (App Router)
- TypeScript
- ESLint
- Prettier
- React Hook Form (form ergonomisi icin) veya ekip tercihi
- Zod (input schema validation)

Opsiyonel ama faydali:
- TanStack Query (server state)
- Zustand (sadece cok gerekirse local UI state icin)
- Mapbox GL JS / react-map-gl (web harita)

Not:
- Gereksiz state library yukleme. Once server-state + component local state ile basla.

## 5. UI/UX Mimari Ilkeleri

Panel:
- masaustu oncelikli ama responsive
- harita ekranlari performans odakli
- tablo + filtre + detay drawer modeli
- "muhasebe ekrani" hissi vermeyen modern premium UX (bkz. `37_visual_design_direction_apple_like_modern.md`)

Landing:
- SEO odakli
- hafif
- ayni app icinde route-level bundle discipline ile ayrik tutulur

## 6. Config / Env Yonetimi

Public env:
- `NEXT_PUBLIC_*` prefix

Server env:
- server-only vars (route handlers/server actions)

Kural:
- Firebase admin credential veya secretlar browser bundle'a girmeyecek

App Router boundary kuralı (Faz 1 icin kritik):
- Firebase Admin SDK yalniz server-side modullerde (`server-only`) kullanilir
- Firebase Web SDK yalniz client/runtime modullerinde kullanilir
- `use client` componente Admin SDK import etmek yasak
- server route/auth/session modullerinde Web SDK ile auth state cozulmez

## 7. Shared Contracts Stratejisi (onerilen)

Uzun vadede:
- `website/packages/contracts`
- request/response DTO tipleri
- error code enumlari
- permission key tipleri

Kisa vadede:
- dokuman + Zod schema + TS types ile basla

## 8. Testing Strategy (MVP)

Marketing:
- basic smoke + link checks

Panel:
- unit test (kritik util/policy)
- component smoke
- e2e smoke (login + dashboard + rota liste)

## 9. Kod Kalite Standartlari

- strict TypeScript (onerilen)
- path aliaslar (temiz importlar)
- feature bazli klasorleme
- server/client boundary net olsun
- Faz 1'de Tailwind token entegrasyonu minimum calisir seviyede tutulur (ileri plugin/refactor sonra)

## 10. Faz 1 Baslangic Dizin Taslagi (`website/apps/web`)

- `src/app/(marketing)`
- `src/app/(dashboard)`
- `src/app/(auth)`
- `src/features/auth`
- `src/features/dashboard`
- `src/features/drivers`
- `src/features/vehicles`
- `src/features/routes`
- `src/features/live-ops`
- `src/lib/firebase`
- `src/lib/api`
- `src/lib/authz`
- `src/lib/env`
- `src/components/ui`
- `src/components/marketing`
- `src/components/shared`
- `src/lib/seo`

## 11. Mimar Karari (net, revize)

MVP icin en saglikli/surdurulebilir yol:
- TypeScript + Next.js
- tek app (marketing + dashboard route groups)
- tek SWA deploy (preview/prod)
- shared contracts katmanina acik yapi

Post-pilotta split etmek kolay, ama MVP'de iki app ile baslamak delivery hizini gereksiz yavaslatir.

Not (review cevabi):
- Azure SWA deploy blast-radius riski pilotta gercek sorun olursa ilk revizyon "iki repo" degil, "tek repo + iki deploy target" secenegi olur
