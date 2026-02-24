# Phase 1 First Sprint Backlog (Tactical)

Tarih: 2026-02-24
Durum: In progress / Faz 1 sprint-0/1

## 1. Amac

Kodlamaya baslandiginda ilk sprintte ne yapacagimizi netlestirmek.

## 2. Sprint Hedefi

Landing + panel teknik iskeletinin kurulmasi ve panel auth shell'inin calismasi.

Faz 1 hedefi bilincli olarak dardir:
- bootstrap
- auth shell
- dev deploy

Bu sprintte business data query/CRUD yazmak hedef degildir.

Progress notu (guncel):
- `P0-1` tamam (web scaffold + route groups)
- `P0-2` lokal tamam (`lint`/`build`)
- `P0-4` temel env wiring + Firebase client init tamam (gercek `dev` Firebase Web SDK config ile lokal bootstrap)
- `P0-5` auth UI shell + trigger iskeleti tamam (email/google login trigger, sign-out action, auth session smoke karti, basic password reset email trigger)
- `P0-6` session bootstrap placeholder + dashboard auth gate skeleton tamam
- `P0-7` mode selector placeholder (hard-coded) tamam
- `P0-3` Azure SWA dev deploy smoke, Azure/generated domain authorized domains ekleri ile Google auth smoke
- SWA tarafi icin `staticwebapp.config.json` baseline stub eklendi (headers; routing smoke deploy gunu dogrulanacak)

## 3. Sprint Itemlari (onerilen sirayla)

### P0-1 Workspace/Repo Bootstrap
- `website/apps/web` olustur (marketing + dashboard route groups)
- workspace config kur
- basic scripts tanimla

Acceptance:
- tek web app local basliyor (marketing + panel route gruplari)

### P0-2 Lint/Typecheck/Build Pipeline
- eslint/prettier
- ts strict
- CI pipeline
- package manager freeze (`pnpm`/`yarn`) + lockfile disiplini

Acceptance:
- PR pipeline minimum gates yesil
- package manager secimi karar logunda kapatildi

### P0-3 Azure SWA Dev Resources + Deploy Wiring
- tek web SWA dev
- generated domain smoke
- App Router route refresh/catch-all smoke (SWA fallback/cakisma kontrolu)
- ilk deploy gununde routing smoke sonucu notlanir

Acceptance:
- tek web app Azure dev URL'de aciliyor (landing + panel route'lari calisiyor)
- refresh/deep-link senaryolarinda routing bozulmuyor (basic smoke)

### P0-4 Panel Env Wiring (Firebase dev)
- web firebase config wiring
- env badge
- config validation guard
- `src/lib/firebase/client.*` canonical init modulunu olustur

Acceptance:
- panel dev env dogru konfig ile aciliyor
- Firebase Web SDK bu canonical moduldun disinda init edilmiyor

### P0-5 Auth UI Shell (Email/Password + Google)
- login page
- provider buttons
- loading/error states (basic)
- dev-only hizlandirici login helper (opsiyonel, yalniz `dev`)

Acceptance:
- login UI render + trigger akislari bagli
- `dev` ortaminda hizli test girisi (opsiyonelse hidden helper) calisiyor

### P0-6 Session Bootstrap Placeholder + Route Guard Skeleton
- auth session bootstrap
- protected route shell
- unauthorized redirect skeleton
- root/global loading shell (flicker azaltma)

Acceptance:
- giris yoksa login
- giris varsa panel shell
- auth gecisinde belirgin beyaz ekran/flicker yok (basic skeleton ile)

### P0-7 Mode Selector Placeholder
- individual/company mode secim placeholder
- hard-coded state ile (gercek `listMyCompanies` query yok)

Acceptance:
- role resolution sonrasi placeholder mode switch akisi calisir
- Firestore query baglanmadan demo akisi ilerler

## 4. Sprintte Bilerek Ertelenecekler

- gercek company/member backend akislari
- gercek `listMyCompanies` / Firestore query baglama
- route CRUD
- vehicle CRUD
- live map
- auth edge-case UX mummellestirme (password reset invalid/expired link custom ekranlari)
- advanced Tailwind/design token abstraction (plugin/refactor seviyesi)

## 5. Sprint Riskleri

- tool secimi uzarsa bootstrap gecikir
- Azure deploy config karmasasi ilk sprinti uzatir
- auth provider setup (Google) konfigurasyon detayi bloklayabilir
- Next.js App Router server/client boundary + Firebase SDK import karisimi build hatalari uretir
- placeholder ekranlara erken gercek query baglanirsa scope creep olur

## 6. Sprint Exit Criteria

- Panel auth shell Azure dev'de gorunur
- CI temel gate calisir
- Env karisiklgi yok
- Faz 2/Faz 3 backlog baslamaya hazir
