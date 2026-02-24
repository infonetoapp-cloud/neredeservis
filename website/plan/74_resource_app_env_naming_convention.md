# Resource, App, Env Naming Convention (Bootstrap Freeze)

Tarih: 2026-02-24
Durum: Faz 1 bootstrap naming freeze (MVP)

## 1. Amac

Faz 1'de isimlendirme daginikligini engellemek:
- Azure resource adlari
- app/package/workspace adlari
- environment etiketleri
- subdomain/env isimleri

Kural:
- Naming bir kere belirlenir, kodlama baslangicinda keyfi degistirilmez.

## 2. Environment Canonical Names

Tek canonical env seti:
- `dev`
- `stg`
- `prod`

Kural:
- `development`, `stage`, `staging`, `production` gibi varyantlar dokuman/konfigde karisik kullanilmaz
- UI badge / telemetry / env vars / resource tags bu canonical isimleri kullanir

## 3. Kisa Proje Kisaltmasi

Kisaltma:
- `nsv` = NeredeServis

Kullanim:
- Azure resource names
- tags
- ops notlari

Not:
- Kullaniciya gorunen marka/metin `NeredeServis` olarak kalir
- `nsv` teknik kisaltmadir

## 4. Azure Resource Naming (MVP)

Pattern:
- Resource Group: `rg-nsv-web-<env>`
- Static Web App: `swa-nsv-web-<env>`

Ornekler:
- `rg-nsv-web-dev`
- `swa-nsv-web-dev`
- `rg-nsv-web-prod`
- `swa-nsv-web-prod`

Post-pilot split (gerekiyorsa):
- `rg-nsv-landing-prod`
- `swa-nsv-landing-prod`
- `rg-nsv-panel-prod`
- `swa-nsv-panel-prod`

## 5. Domain/Subdomain Naming (MVP)

Primary:
- `neredeservis.app` (landing)
- `app.neredeservis.app` (panel)

Staging/Preview:
- Azure generated preview domains default
- `stg-app.neredeservis.app` sadece ihtiyac halinde

Kural:
- Faz 1'de hard-coded extra staging domain acilmaz

## 6. Web App / Workspace Naming

MVP repo yapisi:
- `website/apps/web`

Opsiyonel shared packages:
- `website/packages/contracts`
- `website/packages/ui`

Kural:
- `frontend`, `panel-app`, `webapp` gibi paralel klasor isimleri acilmaz
- Tek canonical app klasoru: `apps/web`

## 7. Next.js Route Group Naming

Canonical route groups:
- `(marketing)`
- `(dashboard)`
- `(auth)`

Kural:
- Ayni anlami tasiyan alternatifler (`(app)`, `(panel)`, `(public)`) keyfi karistirilmaz
- Degisecekse once ADR/karar notu dusulur

## 8. Env Variable Naming (MVP)

Public:
- `NEXT_PUBLIC_*`

Server-only:
- anlamli sabit isimler (secret degerleri dokumana yazilmaz)

Canonical examples:
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

Kural:
- env suffix (`_DEV`, `_PROD`) ayni dosyada karisik kullanilmaz; ortam bazli deger CI/Azure env panelinden verilir

## 9. Firebase/Azure/Cloudflare Tagging (Ops)

Resource tags (Azure):
- `project=neredeservis`
- `env=<dev|stg|prod>`
- `owner=<sen>`
- `cost-center=student` (dev icin)

Kural:
- Yeni resource acildiginda tags bos birakilmaz

## 10. Naming Freeze Kapsami (Faz 1)

Bu dokuman Faz 1 bootstrap icin su alanlari freeze eder:
- env isimleri
- Azure web resource naming
- app/workspace naming
- route group naming
- domain naming (MVP seviyesi)

Post-pilot degisebilecekler:
- landing/panel split resource naming
- ek subdomainler
- internal admin UI route naming

## 11. Referanslar

- `25_phase0_closeout_and_phase1_entry.md`
- `26_azure_swa_creation_steps.md`
- `27_web_env_variables_checklist.md`
- `11_web_repo_structure_and_stack.md`
