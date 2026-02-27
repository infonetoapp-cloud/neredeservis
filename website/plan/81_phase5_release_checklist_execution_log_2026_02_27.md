# Faz 5 Release Checklist Execution Log (2026-02-27)

Tarih: 2026-02-27  
Durum: Closed (Phase 5 complete, carry-over items moved to Phase 6)

## 1) Staging Candidate Checklist Durumu

Kaynak checklist: `website/plan/33_release_and_pilot_runbook_web.md`

1. Build/lint/typecheck yesil -> **DONE**
   - Kanit: `website/apps/web` lint+build yesil
2. Auth smoke (Email + Google) -> **DONE (entry smoke)**
   - Kanit: STG/PROD login page + Google UI PASS (`website/plan/87_phase5_manual_smoke_probe_2026_02_27_1548.md`)
3. Role/mode guard smoke -> **DONE (entry guard)**
   - Kanit: anon guard PASS (`dashboard->login`) (`website/plan/87_phase5_manual_smoke_probe_2026_02_27_1548.md`)
4. Route/stop core smoke -> **DEFERRED_TO_PHASE6**
   - Not: tam CRUD + stop mutasyon kabul smoke'u pilot tenant verisiyle Faz 6'da kosulacak
5. Live ops smoke -> **DEFERRED_TO_PHASE6**
   - Not: canli stream + triage operasyon smoke'u pilot tenant verisiyle Faz 6'da kosulacak
6. Audit log smoke -> **DEFERRED_TO_PHASE6**
7. Env badge dogru (STG) -> **DONE**
   - Kanit: `website/plan/87_phase5_manual_smoke_probe_2026_02_27_1548.md` (expected=STG; actual=STG)
8. Firebase stg'ye bagli oldugu dogrulandi -> **DEFERRED_TO_PHASE6**
   - Kanit: STG login/auth UI smoke PASS (`website/plan/87_phase5_manual_smoke_probe_2026_02_27_1548.md`)
   - Eksik: STG Firebase project mapping manuel veri-mutasyon smoke ile teyit edilecek

## 2) Production Release Checklist Durumu

1. Staging candidate onayli -> **DONE (conditional)**
   - Not: platform gate kapanisi tamamlandi; operasyonel smoke derinligi Faz 6 carry-over
2. Prod env vars dogru -> **DONE**
   - Kanit-1: `npm run audit:vercel-env` PASS (`website/plan/83_vercel_env_audit_2026_02_27_1431.md`)
   - Kanit-2: prod smoke probe env badge PASS (`website/plan/87_phase5_manual_smoke_probe_2026_02_27_1514.md`)
   - Kanit-3: `npm run redeploy:phase5:wait-retry` ile production redeploy PASS (`website/plan/88_phase5_redeploy_and_verify_2026_02_27_1512.md`)
3. CORS/origin allow-list prod domainlerle dogru -> **DEFERRED_TO_PHASE6**
4. Cost alerts aktif -> **DEFERRED_TO_PHASE6**
5. Monitoring dashboardlar erisilebilir -> **DEFERRED_TO_PHASE6**
6. Rollback plani hazir -> **DONE**
   - Kanit: `website/plan/33_release_and_pilot_runbook_web.md` bolum 8
7. Firebase prod mapping son kontrol -> **DEFERRED_TO_PHASE6**

## 3) Pilot Tenant Onboarding Checklist Durumu

Tum maddeler -> **PHASE6_SCOPE**

## 4) Bu Logu Ureten Kanit Komutlari

1. `npm run lint` (`website/apps/web`) -> PASS
2. `npm run build` (`website/apps/web`) -> PASS
3. `npm run lint` (`functions`) -> PASS
4. `npm run build` (`functions`) -> PASS
5. `npx firebase emulators:exec --only firestore,database "npm run test:rules:unit"` (`functions`) -> PASS (34/34)
6. Local route smoke:
   - `/login` 200
   - `/drivers` 200
   - `/routes` 200
   - `/vehicles` 200
   - `/live-ops` 200
   - `/admin` 200
7. Local gate automation:
   - `npm run gate:local` (`website/apps/web`) -> PASS
   - Kanit: `website/plan/82_phase5_local_gate_run_2026_02_27_1430.md`
8. Vercel env audit automation:
   - `npm run audit:vercel-env` (`website/apps/web`) -> PASS
   - Kanit: `website/plan/83_vercel_env_audit_2026_02_27_1431.md`
9. Domain probe automation:
   - `npm run probe:domains` (`website/apps/web`) -> PASS
   - Kanit: `website/plan/84_domain_probe_2026_02_27_1432.md`
10. Readiness orchestration automation:
   - `npm run readiness:phase5` (`website/apps/web`) -> PASS
   - Kanit: `website/plan/85_phase5_release_readiness_2026_02_27_1430.md`
11. Manual smoke probe automation:
   - `npm run smoke:manual:phase5` (`website/apps/web`) -> PASS
   - Kanit: `website/plan/87_phase5_manual_smoke_probe_2026_02_27_1548.md`
12. Production-only smoke probe:
   - `powershell -ExecutionPolicy Bypass -File ./scripts/phase5-manual-smoke-probe.ps1 -SkipStg` -> PASS
   - Kanit: `website/plan/87_phase5_manual_smoke_probe_2026_02_27_1513.md`
13. Redeploy + verify orchestration:
   - `npm run redeploy:phase5:wait-retry` -> PASS
   - Kanit: `website/plan/88_phase5_redeploy_and_verify_2026_02_27_1512.md`
14. STG domain DNS health check:
   - `npm run check:stg-domain:phase5` -> PASS
   - Kanit: `website/plan/89_phase5_stg_domain_dns_check_2026_02_27_1548.md`

## 5) Phase 6 Carry-Over Maddeleri

1. Route/stop tam CRUD acceptance smoke (pilot tenant verisiyle).
2. Live ops stream/triage acceptance smoke (pilot tenant verisiyle).
3. Audit log operasyon acceptance smoke.
4. Prod CORS/cost/monitoring/Firebase mapping son kontrolleri.
5. Pilot onboarding checklist adimlari.
