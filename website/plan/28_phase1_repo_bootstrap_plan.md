# Phase 1 Repo Bootstrap Plan (Kodlama Baslangic Plani)

Tarih: 2026-02-24
Durum: Faz 1 giris plani

## 1. Amac

Kod yazmaya basladigimizda:
- plansiz klasor acma
- tool secimi daginikligi
- ilk haftada spagetti temel olusturma
riski olmasin.

## 2. Faz 1 Hedefi (Bootstrap)

Kurulacak:
- `website/apps/web` (marketing + dashboard route groups)

Cikacak:
- build alan
- lint/typecheck gecen
- Azure dev'e deploy edilebilir
- auth shell calisan

## 3. Bootstrap Sirası (onerilen)

### Adim 1 - Workspace iskeleti
- `website/apps/web`
- `website/packages/` (bos olabilir, future-proof)
- `website/docs/adr`

### Adim 2 - Tooling standardi
- package manager secimi (`pnpm` - secildi)
- lint/prettier config
- TypeScript strict config
- path alias standardi
- Tailwind token entegrasyonu Faz 1'de minimum tutulur (advanced plugin/refactor yok)

### Adim 3 - CI temel pipeline
- install
- lint
- typecheck
- build

### Adim 4 - Azure dev deployment wiring
- tek web SWA dev deploy
- App Router deep-link refresh/catch-all routing smoke ilk gun yapilir

### Adim 5 - Panel auth shell
- login screen
- Email/Password + Google buttons
- session bootstrap placeholder
- env badge
- global loading/skeleton shell (auth flicker'i azaltmak icin)

Execution notu (Faz 1):
- Firebase CLI/IAM erisimi `neredeservis-*` app registrations icin kapaliysa, lokal bootstrap gercek `stg` Hosting `__/firebase/init.json` config'i ile ilerleyebilir
- Google auth smoke ve final env freeze, Firebase Console web app registration sdk config + authorized domains ile tamamlanir

## 4. Klasor ve Dosya Kurallari (bootstrap asamasinda)

1. Feature klasorleri placeholdersiz asiri acilmayacak
2. `utils.ts` ve `helpers.ts` genel cop kutusuna donusturulmeyecek
3. Auth, env, api, authz ayrik tutulacak
4. Next.js server/client boundary net tutulacak (`use client` componentlere server-only/Firebase Admin import edilmez)
5. Firebase Web SDK tek canonical client init modulunden kullanilacak (`src/lib/firebase/client.*`)

## 5. Baslangic Konfig Dosyalari (taslak liste)

Web app:
- `package.json`
- `tsconfig.json`
- `next.config.*`
- `eslint config`
- `prettier config`

Ortak:
- workspace-level config (`pnpm`/workspace ihtiyacina gore)

## 6. Faz 1'de Bilerek Yapilmayacaklar

- tam landing tasarimi
- tum panel ekranlarini scaffolding
- billing paneli
- internal admin
- ileri seviye analytics
- auth edge-case UX mummellestirme (expired reset link, invalid token custom flows vb.)
- placeholder ekranlara gercek Firestore query baglama

## 7. Bootstrap Sonu Kabul Kriteri

- web app local calisiyor (marketing + panel route groups)
- build aliyor
- CI pipeline yesil
- Azure dev deploy en az bir kez basarili
- panel login shell render ediyor

## 8. Faz 1 Sonrasi Gecis

Bootstrap tamamlaninca:
- Faz 2 tasklari (individual driver panel)
- Faz 3 backend extension tasklari
paralel/planli baslatilabilir

## 9. Execution Hizi Notlari (review sonrasi)

- Faz 1 hedefi: bootstrap + auth shell + dev deploy; business data baglamak degil
- Placeholder akislarda hard-coded state kullanimi kabul edilir
- Premium his icin loading shell erken eklenir; auth edge-case polish ertelenir
