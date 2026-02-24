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
