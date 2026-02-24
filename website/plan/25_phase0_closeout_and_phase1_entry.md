# Faz 0 Closeout + Faz 1 Entry Criteria

Tarih: 2026-02-24
Durum: Faz 0 closeout guncel / Faz 1 bootstrap GO

## 1. Amac

Planlama fazini ne zaman "yeterince olgun" sayacagimizi tanimlamak.

Bu sayede:
- plansiz kodlamaya atlanmaz
- eksik mimari kararlarla teknik borc baslatilmaz

## 2. Faz 0 Kapanis Kriterleri (must)

Asagidakiler tamam olmadan Faz 1 kod baslamaz:

### 2.1 Mimari ve Domain
- [x] Master plan
- [x] Hosting/domain/ops plani
- [x] Product architecture MVP plani
- [x] Yetki matrisi
- [x] Company/RBAC domain model V0
- [x] Auth + RBAC flow V0

### 2.2 Ortam ve Operasyon
- [x] Env usage policy (dev/stg/prod)
- [x] Web<->Firebase env matrix
- [x] DNS + Azure + Firebase deploy checklist
- [x] Azure student full setup strategy

### 2.3 Uygulama Programi
- [x] Detailed phase plan
- [x] Workstream breakdown/sequence
- [x] API endpoint backlog

### 2.4 Kalite ve Risk
- [x] Engineering standards / code health rules
- [x] Quality gates / Definition of Done
- [x] Risk register
- [x] Decision log

### 2.5 Acik kritik kararlar
- [x] Live ops read model
- [x] Web auth provider seti
- [x] Vehicle collection shape
- [x] Staging domain strategy

## 3. Faz 1 Entry Criteria (uygulama baslangici)

Plan hazir olmasi tek basina yeterli degil. Asagidakiler de gerekli:

- [x] Azure SWA resource olusturma adimlari checklisti hazir
- [x] Web env variable checklisti hazir
- [x] Repo bootstrap plani hazir
- [x] Ilk sprint/faz task listesi issue-ready/tactical backlog olarak hazir
- [x] Naming convention dokumani (resource/app/env) finalize

Referanslar:
- `26_azure_swa_creation_steps.md`
- `27_web_env_variables_checklist.md`
- `28_phase1_repo_bootstrap_plan.md`
- `29_phase1_first_sprint_backlog.md`
- `74_resource_app_env_naming_convention.md`

## 4. Faz 1 Baslarken Yapilacak Ilk 5 Is

1. `website/apps/web` repo bootstrap (marketing + dashboard route groups)
2. Lint/typecheck/build CI pipeline
3. Azure SWA dev deployment
4. Firebase web auth config wiring (dev)
5. Login + session bootstrap shell

## 5. Faz 0 Kapanis Notu (current status)

Durum:
- Faz 0 plan seti kodlamaya baslamak icin yeterli olgunlukta
- Faz 1 bootstrap/auth shell icin `GO`
- Faz 2+ uygulama detaylari faz kapilarinda tekrar kontrol edilecek

Not:
- Bu GO karari "tum sistem production-ready" anlamina gelmez
- Kapsam: `website/apps/web` bootstrap + auth shell + dev deploy

Bu dokuman guncellenerek Faz 0 resmi kapanis kaydi tutulacak.
