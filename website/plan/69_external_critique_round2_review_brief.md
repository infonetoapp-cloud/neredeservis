# External Critique Round 2 Review Brief (Send Packet)

Tarih: 2026-02-24
Durum: Ready-to-send brief

## 1. Amaç

Bu dokuman, planin ikinci elestiri turuna gonderilmesi icin kisa ama hedefli bir review paketi sunar.

Amaç:
- reviewer'i tum dokuman denizinde bogmamak
- kritik karar degisiklikleri ve yeni risk alanlarini odakli inceletmek

## 2. Bu Turda Neler Degisti? (Kisa)

Review sonrasi kabul edilen ana degisiklikler:
1. `Company of 1` tenant standardizasyonu kabul edildi
2. MVP read model sadeleştirildi (projection endpoint trigger/esik tabanli)
3. Vehicle modeli security nedeniyle company-scoped write path'e revize edildi
4. Map mismatch telemetry + pilot-sonrasi standardization trigger stratejisi netlestirildi (MVP-cut)
5. Migration + backward compatibility + bulk import plani white-glove onboarding odakli revize edildi
6. routeReaders lifecycle yerine MVP company-level RTDB live access stratejisi netlestirildi
7. Billing/internal admin/suspension planı eklendi
8. Security hardening (2FA/session/CSP/secrets/password flows) detaylandi
9. Route/trip davranisi + recurrence/DST spec MVP-cut revize edildi (full versioning post-pilot)
10. Mobile Force Update + server-side client version enforcement plani eklendi
11. Mobile offline/stale location tolerance plani eklendi
12. Test/rollout/DR/retention/notifications + reporting/support/unit economics detaylandi
13. Live ops RTDB access revoke latency icin access mirror + revoke hardening eklendi (mirror sync failsafe/reconcile gereksinimiyle)
14. Cross-tenant vehicle kullanim senaryosu MVP kapsamindan cikarildi (tenant-local vehicle strict; post-pilot model aday notu korundu)
15. Billing entitlement/suspension core davranisi pilot oncesine cekildi (payment UI sonra) ve MVP billing core 3-state'e sadeleştirildi
16. Internal admin zorunlulugu korundu; operasyon altyapisi/policy/runbook simdi, web panel UI sonra
17. MVP repo/deploy modeli tek Next.js app + tek SWA olarak sadeleştirildi
18. Tasarim tooling `UI kit-first`, Stitch opsiyonel ideation olarak revize edildi
19. Kod sagligi kurali revize edildi (`500` soft cap korunup UI vs logic dosya limiti ayrıştırıldı)
20. Compatibility layer write-path sunset + agresif force update/`426` cutoff yaklaşımı sertleştirildi
21. Route conflict guard Firestore `updateTime`/version token semantiğine çekildi
22. Offline burst replay icin backend coalescing (latest-only live node) kuralı netleştirildi
23. Company-of-1 lazy initialization karari eklendi (signup aninda zorunlu tenant olusturma yok)
24. RBAC vs coarse RTDB live access semantigi MVP icin acikca ayrildi (subset-level live authz MVP disi)
25. Aktif seferde route yapisal degisiklikleri icin server-side soft-lock (MVP kalite korumasi) notu eklendi
26. Billing `billingValidUntil` + scheduled failsafe job (provider yokken) notu eklendi
27. RTDB company suspension write amplification icin company-level kill-switch optimizasyonu notu eklendi
28. Force Update legacy client fallback/shim (time-boxed, endpoint bazli) notu eklendi

## 3. Review Edilmesini Ozellikle Istedigimiz Dokumanlar (oncelik sirasi)

### Kritik Mimari (Once bunlar)
- `54_adr_006_company_of_one_tenant_standardization.md`
- `55_adr_007_mvp_read_model_simplification_and_projection_triggers.md`
- `56_adr_008_vehicle_collection_security_revision.md`
- `57_adr_009_map_standardization_and_eta_consistency.md`

### Teknik Bariyerler / Uygulanabilirlik
- `08_domain_model_company_rbac.md`
- `11_web_repo_structure_and_stack.md`
- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
- `60_billing_internal_admin_and_suspension_policy_plan.md`
- `62_route_trip_versioning_recurrence_timezone_dst_and_concurrent_editing_spec.md`
- `46_design_tooling_decision_figma_vs_google_stitch.md`
- `71_mobile_force_update_and_client_version_enforcement_plan.md`
- `72_mobile_offline_stale_location_tolerance_plan.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`

### Ticari + Operasyonel Tamamlayicilar
- `60_billing_internal_admin_and_suspension_policy_plan.md`
- `61_security_hardening_2fa_session_sso_csp_secrets_password_flows.md`
- `64_reporting_export_unit_economics_onboarding_support_landing_analytics_account_lifecycle_ops_plan.md`

## 4. Reviewer'dan Ozellikle Istenecek Geri Bildirim Tipi

Lutfen su lenslerle yorumlayin:
- solo-founder delivery hızı acisindan fazla karmaşık yerler
- MVP/Pilot siralama hatalari
- mantik hatalari / birbiriyle celisen urun akis varsayimlari
- cross-tenant / authz / data leakage riskleri
- migration/backward compatibility gercekciligi
- operasyon sahasi acisindan rota/ETA/live ops tutarlilik riskleri
- satilabilir SaaS icin eksik ticari/operasyonel noktalar
- app ici ve website tarafi icin kullanici dostu, isi kolaylastiran oneriler (operator/driver/admin deneyimi)

## 5. Hala Acik Kararlar (Reviewer yorumu degerli)

- odeme provider shortlist (TR odakli)
- legacy mobile compatibility cutoff sure/takvimi
- activeCompanyId claims semantigi (MVP), access mirror sync/failsafe ve token refresh UX detaylari
- full route/trip versioning yatirimi icin pilot trigger esikleri

## 6. “Yanlis yoldayiz mi?” Kontrol Sorusu

Reviewer'a sorulacak ana soru:
- "Bu plan artik satilabilir bir SaaS'a giderken teknik borcu ve operasyon riskini yonetebilir mi, yoksa hala temel mimaride yanlis bir eksen var mi?"

## 7. Hızlı Ozet Referansları

- `00_master_plan.md` (ust seviye yon)
- `16_master_phase_plan_detailed.md` (faz overlay ile)
- `17_workstream_breakdown_and_sequence.md` (program akisi)
- `19_risk_register_and_mitigation.md` (genisletilmis risk seti)
- `20_decision_log_and_open_questions.md` (yeni kararlar + acik kalanlar)
