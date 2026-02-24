# GitHub Epics + Issue Template Plan (Execution Hygiene)

Tarih: 2026-02-24
Durum: V0

## 1. Amac

Planin uygulamaya temiz gecmesi icin GitHub tarafini da standartlastirmak.

Hedef:
- backlog okunabilir olsun
- phase/workstream takibi net olsun
- PR'lar teknik borc yaratmadan ilerlesin

## 2. Epic Yapisi (onerilen)

Epic formatı:
- `EPIC: <phase/workstream> - <kisa ad>`

Onerilen epics:
- `EPIC: Phase 1 - Web Bootstrap`
- `EPIC: Phase 2 - Individual Driver Panel`
- `EPIC: Phase 3 - Company RBAC + Fleet Core`
- `EPIC: Phase 4 - Live Ops + Route Operations`
- `EPIC: Phase 5 - Security + Audit + Hardening`
- `EPIC: Phase 6 - Pilot Rollout`

Yatay epics (opsiyonel):
- `EPIC: DevOps - Azure/Firebase Web Delivery`
- `EPIC: Design System - Panel UI Foundation`

## 3. Issue Tipleri

- `feature`
- `backend-endpoint`
- `ui`
- `infra`
- `security`
- `refactor`
- `bug`
- `test`
- `docs`

## 4. Label Stratejisi (onerilen)

Faz:
- `phase:0`
- `phase:1`
- `phase:2`
- ...

Workstream:
- `ws:a-ia-ux`
- `ws:b-web-platform`
- `ws:c-auth-rbac-shell`
- `ws:d-company-rbac-backend`
- `ws:e-driver-vehicle`
- `ws:f-route-trip-ops`
- `ws:g-live-ops-map`
- `ws:h-security-observability`
- `ws:i-release-pilot`

Tip:
- `type:feature`
- `type:bug`
- `type:refactor`
- `type:docs`

Oncelik:
- `prio:p0`
- `prio:p1`
- `prio:p2`

Risk:
- `risk:high`
- `risk:medium`
- `risk:low`

## 5. Issue Template (standart)

Her issue su alanlari icermeli:

1. Problem
2. Scope
3. Non-scope
4. Dependencies
5. Acceptance criteria
6. Test plan
7. Risk / rollback note
8. Related docs (plan/ADR refs)

## 6. PR Template (standart)

Her PR su basliklari icermeli:

1. What changed
2. Why
3. Risk
4. Test
5. Screenshots (UI ise)
6. Docs updated? (yes/no + path)

## 7. Branch Naming (onerilen)

Format:
- `feat/<short-topic>`
- `fix/<short-topic>`
- `refactor/<short-topic>`
- `infra/<short-topic>`
- `docs/<short-topic>`

Ornek:
- `feat/panel-auth-shell`
- `infra/azure-swa-dev-setup`

## 8. Milestone Stratejisi

Milestone'lar faz bazli:
- `Phase 1 Bootstrap`
- `Phase 2 Individual Driver`
- `Phase 3 Company RBAC`
- ...

Kural:
- issue milestone'siz birikmesin (en azindan P0/P1 issue'lar)

## 9. "Docs-First" Baglantı Kuralı

Kritik issue'larda ilgili plan/ADR linki zorunlu:
- auth/rbac
- tenant policy
- live ops read modeli
- endpoint kontrat degisimi

Neden:
- "neden boyle?" sorusu PR'da kaybolmasin

## 10. First Batch Epic/Issue Seti (Faz 1 giris)

Epic:
- `EPIC: Phase 1 - Web Bootstrap`

Issue seti (ilk sprint):
- panel/landing repo bootstrap
- CI pipeline
- Azure SWA dev setup
- panel env wiring
- auth UI shell
- session bootstrap + guards placeholder
- mode selector placeholder

## 11. Mimar Karari

Backlog da kod kadar onemli.

Yazili ve etiketli backlog:
- delivery hizini arttirir
- kaliteyi korur
- tek kisilik ekipte bile baglam kaybini azaltir
