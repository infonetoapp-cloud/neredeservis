# Release + Pilot Runbook (Web MVP)

Tarih: 2026-02-24
Durum: V0 / operasyon runbook taslagi

## 1. Amac

Web MVP'yi "kod deploy ettik oldu" seviyesinden cikarip kontrollu release ve pilot operasyonuna tasimak.

## 2. Kapsam

- staging release validation
- production deploy
- pilot tenant onboarding
- issue triage
- rollback mantigi

## 3. Release Tipleri

### R1 - Internal Dev Release
- web-dev / preview
- ekip ici dogrulama

### R2 - Staging Candidate
- web-stg
- release adayi test
- dis paydas demo (gerekirse)

### R3 - Production Release
- web-prod
- pilot/musteri kullanimi

## 4. Staging Candidate Checklist

- [ ] Build/lint/typecheck yesil
- [ ] Auth smoke (Email + Google)
- [ ] Role/mode guard smoke
- [ ] Route/stop core smoke (ilgili faza gore)
- [ ] Live ops smoke (ilgili faza gore)
- [ ] Audit log smoke (ilgili faza gore)
- [ ] Env badge dogru (STG)
- [ ] Firebase stg'ye bagli oldugu dogrulandi

## 5. Production Release Checklist

- [ ] Staging candidate onayli
- [ ] Prod env vars dogru
- [ ] CORS/origin allow-list prod domainlerle dogru
- [ ] Cost alerts aktif
- [ ] Monitoring dashboardlar erisilebilir
- [ ] Rollback planı hazir
- [ ] Firebase prod mapping son kontrol

## 6. Pilot Tenant Onboarding Checklist

- [ ] Pilot sirket kaydi olustur
- [ ] owner kullanici atanir
- [ ] demo/test data ayrimi net
- [ ] role dagilimi yapilir (owner/admin/dispatcher/viewer)
- [ ] en az 1 sofor + 1 arac + 1 rota setup
- [ ] canli ops ekrani smoke
- [ ] audit kaydi smoke

## 7. Issue Triage Seviyeleri (Pilot)

P0:
- login yok
- tenant data leak
- canli operasyon kritik bozuk

P1:
- ana operasyon akisi bloklu ama workaround var

P2:
- UI/UX hata
- minor bug

## 8. Rollback Stratejisi (Web)

Landing/panel ayri deploy oldugu icin:
- panel rollback landing'i bozmaz
- landing rollback paneli bozmaz

Kural:
- rollback karari icin son iyi release referansi tutulur

## 9. Pilot Sonrasi Kapanis Notu

Pilot sonu raporlanacak:
- hangi akıslar kullanildi
- en cok hata nerede
- hangi role policy sorun cikardi
- hangi endpointler optimize edilmeli
- billing/internal admin fazina ne zaman gecilmeli

## 10. Review Sonrasi Pilot Zorunluluklari (Ek)

Pilot oncesi / pilot sirasinda ek olarak izlenecekler:
- white-glove onboarding/import script readiness + hata raporlari
- map mismatch / ETA dispute telemetry (ADR-009 trigger review)
- force update cutoff rehearsal readiness (client + server)
- stale/offline threshold calibration notlari (live ops)
- support severity tagging (S1/S2/S3) disiplinli kullanimi
- migration/legacy client compatibility loglari
- billing/suspension policy hazirlik notlari (pilot sonrasi ticari gecis)

Detay planlar:
- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `57_adr_009_map_standardization_and_eta_consistency.md`
- `71_mobile_force_update_and_client_version_enforcement_plan.md`
- `72_mobile_offline_stale_location_tolerance_plan.md`
- `60_billing_internal_admin_and_suspension_policy_plan.md`
- `64_reporting_export_unit_economics_onboarding_support_landing_analytics_account_lifecycle_ops_plan.md`

## 11. Vercel Deploy Budget Policy (Zorunlu)

Gunluk Vercel deploy limiti nedeniyle release akisinda asagidaki kural zorunludur:

- `79_vercel_deploy_budget_policy.md`

Bu runbooktaki R1/R2/R3 release adimlari, ilgili policy dosyasindaki deploy butcesi ve release penceresi kurallarina uyar.

## 12. Execution Log (2026-02-27)

Bu runbook checklistinin kanitli uygulama kaydi:

- `81_phase5_release_checklist_execution_log_2026_02_27.md`

## 13. Local Gate Automation (Faz 5)

Tek komut local gate calistir:

- `npm run gate:local` (`website/apps/web`)

Script:
- `website/apps/web/scripts/phase5-local-gate.ps1`

Urettigi kanit raporu:
- `website/plan/82_phase5_local_gate_run_*.md`

Kapsam:
- web lint/build
- functions lint/build
- emulatorlu rules test
- kritik route smoke (`/login`, `/drivers`, `/routes`, `/vehicles`, `/live-ops`, `/admin`)

Not:
- STG/PROD environment, CORS, cost alert ve monitoring adimlari manuel checklist olarak devam eder.

Ek otomasyon:
- `npm run audit:vercel-env` (`website/apps/web`)
- Script: `website/apps/web/scripts/vercel-env-audit.ps1`
- Kanit raporu: `website/plan/83_vercel_env_audit_*.md`
- `npm run probe:domains` (`website/apps/web`)
- Script: `website/apps/web/scripts/domain-probe.ps1`
- Kanit raporu: `website/plan/84_domain_probe_*.md`
- `npm run readiness:phase5` (`website/apps/web`)
- Script: `website/apps/web/scripts/phase5-release-readiness.ps1`
- Kanit raporu: `website/plan/85_phase5_release_readiness_*.md`
- `npm run smoke:manual:phase5` (`website/apps/web`)
- Script: `website/apps/web/scripts/phase5-manual-smoke-probe.ps1`
- Kanit raporu: `website/plan/87_phase5_manual_smoke_probe_*.md`
- `npm run redeploy:phase5:verify` (`website/apps/web`)
- Script: `website/apps/web/scripts/phase5-redeploy-and-verify.ps1`
- Kanit raporu: `website/plan/88_phase5_redeploy_and_verify_*.md`
- `npm run redeploy:phase5:wait-retry` (`website/apps/web`)
- Script: `website/apps/web/scripts/phase5-wait-and-retry-redeploy.ps1`
- Not: `402 api-deployments-free-per-day` durumunda rapordaki bekleme suresini okuyup otomatik tekrar dener.

Kritik env notu:
- Functions tarafinda paylasim linkleri `ROUTE_SHARE_BASE_URL` env degiskeninden uretilir (ornek: `https://app.neredeservis.app/r`).

STG DNS/SSL notu:
- `npx vercel domains inspect stg-app.neredeservis.app --scope infonetoapp-clouds-projects`
- Eger `Domain is not configured properly` uyarisi varsa Cloudflare'de su kayit dogrulanir:
- `A stg-app.neredeservis.app 76.76.21.21` (DNS only)
- Otomasyonlu kontrol komutu: `npm run check:stg-domain:phase5`
- Kanit raporu: `website/plan/89_phase5_stg_domain_dns_check_*.md`
- STG domain production deploy'e degil preview deploy'e bagli olmali:
- `npx vercel alias set <preview-deployment>.vercel.app stg-app.neredeservis.app --scope infonetoapp-clouds-projects`

## 14. Faz 5 Closeout Karari

Faz 5 kapanis karari ve Faz 6'ya devreden maddeler:

- `website/plan/90_phase5_closeout_decision_2026_02_27.md`

## 15. Faz 6 Pilot Acceptance Baslangici

Faz 6 pilot acceptance checklist:

- `website/plan/91_phase6_pilot_acceptance_checklist_2026_02_27.md`
- `website/plan/92_phase6_execution_log_2026_02_27.md`

Yeni komutlar:

- `npm run smoke:manual:phase6` (`website/apps/web`)
- `npm run readiness:phase6` (`website/apps/web`)
- `npm run onboarding:pilot:phase6` (`website/apps/web`)
- `npm run acceptance:close:phase6` (`website/apps/web`)
- `npm run closeout:prod-ops:phase6` (`website/apps/web`)

Scriptler:

- `website/apps/web/scripts/phase6-manual-ops-smoke.ps1`
- `website/apps/web/scripts/phase6-readiness.ps1`
- `website/apps/web/scripts/phase6-pilot-onboarding-check.ps1`
- `website/apps/web/scripts/phase6-close-acceptance.ps1`
- `website/apps/web/scripts/phase6-prod-ops-closeout.ps1`

Strict gate notu:

- `readiness:phase6` akisi `vercel-env-audit.ps1 -FailOnWarn` ile calisir.
- Yani preview/development/production required public env key eksigi varsa gate fail olur.

Ilk Faz 6 kanitlari:

- `website/plan/93_phase6_manual_ops_smoke_2026_02_27_1613.md`
- `website/plan/94_phase6_readiness_2026_02_27_1625.md`
- `website/plan/96_phase6_acceptance_closeout_2026_02_27_1651.md`
- `website/plan/97_phase6_prod_ops_closeout_2026_02_27_1707.md`
- `website/plan/95_phase6_pilot_onboarding_check_2026_02_27_1707.md`
