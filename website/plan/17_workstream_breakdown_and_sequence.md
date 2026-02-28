# Workstream Breakdown + Sequence (Implementation Program)

Tarih: 2026-02-24
Durum: Oneri / detay program

## 1. Amac

Fazlari yatay is akislari halinde ayirmak:
- frontend
- backend/API
- data model
- infra/devops
- security/ops
- QA

Bu sayede "ne once gelir?" daha net olur.

## 2. Workstreamler

### WS-A: Product/IA/UX Frame
- panel bilgi mimarisi
- navigation
- role-based menu
- landing content skeleton

### WS-B: Web Platform Bootstrap
- Next.js setup
- TS/lint/build
- CI
- Azure SWA deploy

### WS-C: Auth + Session + RBAC Shell
- login/logout
- session bootstrap
- mode selector
- company selector
- route guards

### WS-D: Company/RBAC Backend Extension
- company/member models
- membership endpoints
- role policy

### WS-E: Driver/Vehicle/Assignment Backend + UI
- company drivers
- vehicles
- assignments

### WS-F: Route/Stop/Trip Operations
- company-aware route CRUD
- stop editor
- trip/ops integration

### WS-G: Live Ops / Map
- map rendering
- live subscriptions/projections
- performance throttling

### WS-H: Audit / Observability / Security
- audit logs
- denied actions
- metrics/alerts
- CORS/origin policy

### WS-I: Release / Pilot Ops
- staging gate
- prod deploy
- pilot onboarding

### WS-J: Migration + Compatibility
- company-of-1 backfill
- legacy mobile compatibility layer
- cutoff/deprecation planning

### WS-K: Data Import + Onboarding Tooling
- white-glove onboarding scripts/process
- template/validation discipline
- import observability + support SOP
- self-serve import UI (post-pilot trigger)

### WS-L: Billing + Internal Admin + Commercial Ops
- billing state model
- entitlement/suspension behavior
- provider/webhook integration (later)
- internal admin operations layer (policy/runbook/scripts now, panel UI later)
- MVP 3-state suspension policy (advanced grace/limited states later)

### WS-M: Quality Platform + DR + Data Lifecycle
- test strategy/rules tests/E2E/load
- feature flags/rollout controls
- backup/restore/DR
- retention/deletion policies

### WS-N: Growth / Reporting / Analytics
- reporting/export roadmap
- landing SEO/analytics/consent
- unit economics metrics
- support SOP instrumentation

## 3. Oncelik Sirasi (Saglikli Sequence)

Sira:
1. WS-B (bootstrap)
2. WS-C (auth shell)
3. WS-D (company/rbac backend)
4. WS-E (driver/vehicle)
5. WS-F (route/stop ops)
6. WS-G (live ops map)
7. WS-H (sertlestirme)
8. WS-I (pilot)

Review sonrasi kritik ek workstreamler (fazlara dagitilarak):
9. WS-J (migration + compatibility)
10. WS-K (bulk import + onboarding tooling)
11. WS-M (quality platform + DR + retention)
12. WS-L (billing core + internal admin ops altyapisi pilot oncesi; provider/self-serve ve admin UI kismi sonra)
13. WS-N (reporting/growth/analytics, pilot sonrasi olgunlasir)

WS-A (IA/UX frame) tum surece paralel ama hafif akista ilerler.

## 4. Neden Bu Sira?

- Auth/RBAC shell olmadan panel screens dogru olgunlasmaz
- Company model olmadan firma paneli sonradan yamalanir (spagetti riski)
- Live map erken gelirse "demo etkisi" olur ama omurga eksik kalir
- Audit/security gecikirse pilotta operasyon riski artar

## 5. Faz-Workstream Matrisi (Ozet)

Faz 1:
- WS-B, WS-C, WS-A (min)

Faz 2:
- WS-F (individual path), WS-A

Faz 3:
- WS-D, WS-E, WS-C (company mode extension)

Faz 4:
- WS-F, WS-G

Faz 5:
- WS-H, WS-M (baseline), WS-J planning freeze, WS-L core (billing status/entitlement)

Faz 6:
- WS-I, WS-K (white-glove pilot onboarding), WS-N baseline metrics, WS-L pilot rehearsal

Faz 7:
- WS-L provider/self-serve billing + internal admin web UI + WS-H/WS-M extension + reporting/export stream

Faz 8:
- WS-A polish + performance refactor + WS-N growth/analytics optimization

## 6. Paralel Calisma Kurallari (spagettiyi onlemek icin)

1. UI ve backend endpoint tasarimi ayni issue'da ama ayri tasklarda olsun
2. Contract degismeden UI implementation merge edilmez
3. Refactor tasklari feature tasklarindan ayri tutulur
4. Map/perf optimizasyonlari business policy tasklarini bloke etmez

## 7. Haftalik Ritim (onerilen)

Her hafta:
- 1x architecture checkpoint
- 1x backlog grooming (faz hedefi odakli)
- 1x release/staging health check (aktif faza gore)

## 8. Cikti Takip Formati (her workstream task'i icin)

- Problem
- Scope
- Dependencies
- Acceptance criteria
- Risk
- Test plan
- Rollback notu (gerekirse)
