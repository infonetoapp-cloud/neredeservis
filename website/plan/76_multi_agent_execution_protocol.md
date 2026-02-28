# Multi Agent Execution Protocol (Phase 3 -> Phase 8)

Tarih: 2026-02-25  
Durum: Active

## 1) Agent Seti

Toplam 6 agent:

1. A1 - Contract and RBAC Owner
2. A2 - Web Dashboard UI/UX
3. A3 - Functions Business Endpoints
4. A4 - Live Ops and RTDB
5. A5 - QA, CI, Release Gates
6. A6 - Admin Surface and Docs Sync

## 2) Contract-First Rule (Hard Lock)

Sadece A1 su dosyalari degistirebilir:

- `functions/src/common/input_schemas.ts`
- `functions/src/common/output_contract_types.ts`
- `functions/src/common/company-types.ts` (varsa)
- `firestore.rules`
- `database.rules.json`

Diger agent bu dosyalara dokunmaz. Ihtiyac olursa A1'e request acar.

## 3) File Whitelist by Agent

### A1
- `functions/src/common/**`
- `firestore.rules`
- `database.rules.json`
- `website/app-impact/04_api_contract_diff_register.md`

### A2
- `website/apps/web/src/app/(dashboard)/**`
- `website/apps/web/src/components/dashboard/**`
- `website/apps/web/src/features/**`
- `website/apps/web/src/lib/**` (contract disi)

### A3
- `functions/src/callables/**`
- `functions/src/common/**` (contract disi helperlar)
- `functions/src/index.ts` (sadece wiring/export)

### A4
- `website/apps/web/src/components/dashboard/live-ops*`
- `website/apps/web/src/components/dashboard/use-live-ops*`
- `functions/src/callables/*live*`
- `functions/src/common/*live*`

### A5
- `.github/workflows/**`
- `website/apps/web/package.json`
- `functions/package.json`
- `website/plan/18_quality_gates_and_definition_of_done.md`

### A6
- `website/apps/web/src/app/(dashboard)/admin/**`
- `website/apps/web/src/components/admin/**`
- `website/plan/**`
- `website/app-impact/**`

## 4) Branch and PR Standard

- Branch format: `aX/phaseY-short-topic`
  - Ornek: `a2/phase3-dashboard-drivers-toolbar`
- Commit format: `type(scope): summary`
  - Ornek: `feat(web-dashboard): add member status chips`
- PR title format: `[A2][Phase3] Drivers status filter chips`

PR hard kurallari:

1. Tek amacli PR
2. 300-500 satir ustu ise bol
3. Whitelist disi dosya degisikligi varsa PR reject
4. App impact sorusu zorunlu:
   - "Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?"

## 5) Merge Order

Her gun sabit merge sirası:

1. A1
2. A3
3. A4
4. A2
5. A6
6. A5

Not:
- A1 merged olmadan contract bekleyen PR merge edilmez.
- A5 en sonda gate/CI stabilizasyonu icin merge edilir.

## 6) Daily Sync Ritual

Gunluk 3 checkpoint:

1. 10:00 - Scope lock
2. 15:00 - Conflict check
3. 19:00 - Merge window

Her agent gun sonunda tek paragraf rapor birakir:

- Yapilan is
- Acik risk
- Ertesi gun ilk is
- Contract request var/yok

## 7) Phase Distribution

### Phase 3
- A1: RBAC policy contract kilidi
- A2: drivers/routes/vehicles role UX hardening
- A3: member invite/update/remove endpoint hardening
- A4: live-ops role visibility guard
- A5: phase3 quality gates
- A6: `/admin` shell v1 + plan sync

### Phase 4
- A1: route/trip mutation contract freeze
- A2: route/stop operations UX polish
- A3: route-stop mutation robustness
- A4: RTDB stream/stale/offline behavior
- A5: load/smoke tests and CI gates
- A6: operational docs and runbook updates

### Phase 5
- A1: security contract and rules pass
- A2: audit read screens (minimal)
- A3: audit write and deny-action logs
- A4: live ops security tightening
- A5: gate hardening and release checklist
- A6: hardening docs and phase closeout

### Phase 6
- A1: pilot contract freeze
- A2: pilot UX hotfix lane
- A3: pilot backend fixes
- A4: pilot live tracking fixes
- A5: pilot smoke and rollback checklist
- A6: onboarding/support docs

### Phase 7
- A1: billing status contract
- A2: billing UI
- A3: billing endpoints and suspension
- A4: live ops billing-state behavior checks
- A5: billing test matrix
- A6: internal admin panel rollout docs

### Phase 8
- A1: final API contract freeze
- A2: landing polish and conversion UX
- A3: perf-oriented backend cleanup
- A4: live ops perf and map tuning
- A5: final regression and release gates
- A6: final docs and handover pack

## 8) Stop Conditions

Asagidaki durumlarda merge durdurulur:

1. Required checks red
2. Contract drift
3. App-impact kaydi eksik
4. Whitelist ihlali
5. Ayni dosyada birden fazla agent cakismasi

