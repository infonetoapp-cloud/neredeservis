# Decision Change Propagation Checklist (MD Sync Rule)

Tarih: 2026-02-24
Durum: V1 (process guard)

## 1. Amac

Bir mimari/urun/operasyon karari degistiginde plan dokumanlarinda eski karar izinin kalmamasini saglamak.

Bu checklist, "karar degisti ama raporlar eski kaldi" riskini azaltir.

## 2. Ne Zaman Kullanilir?

- Yeni ADR/karar alindiginda
- Reviewer elestirisi sonrasi karar revize edildiginde
- Fazlama/MVP kapsam daraltma-genisletme yapildiginda
- Guvenlik/policy davranisi degistiginde

## 3. Zorunlu Guncelleme Zinciri (Minimum)

Her karar degisiminde en az su dosyalar kontrol edilir:

1. `20_decision_log_and_open_questions.md`
2. Ilgili ADR/spec/planning dokumani (`58`, `59`, `60`, `62` vb.)
3. `16_master_phase_plan_detailed.md`
4. `19_risk_register_and_mitigation.md`
5. `69_external_critique_round2_review_brief.md` (dis review'e gidecekse)

## 4. Duruma Gore Ek Kontrol Edilecek Dosyalar

### 4.1 API / contract etkisi varsa
- `42_p0_endpoint_contracts_v1_draft.md`
- ilgili implementation checklist (`65`, `66`, `67` vb.)

### 4.2 Security / authz / live ops etkisi varsa
- `61_security_hardening_2fa_session_sso_csp_secrets_password_flows.md`
- `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
- `72_mobile_offline_stale_location_tolerance_plan.md`

### 4.3 Billing / internal admin etkisi varsa
- `60_billing_internal_admin_and_suspension_policy_plan.md`
- `17_workstream_breakdown_and_sequence.md`
- `33_release_and_pilot_runbook_web.md` (gerekirse)

### 4.4 Migration / mobile compatibility etkisi varsa
- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `71_mobile_force_update_and_client_version_enforcement_plan.md`
- `65_migration_backward_compatibility_bulk_import_implementation_readiness_checklist.md`
- `../app-impact/00_web_to_app_change_register.md` (app etkisi backlog kaydi ac)

### 4.5 Domain model / tenant etkisi varsa
- `08_domain_model_company_rbac.md`
- `56_adr_008_vehicle_collection_security_revision.md` (ilgiliyse)

## 5. Guncelleme Kurali

- Eski karar ifadesi dosyada kalmamalidir (sadece "revize edildi" notu olarak kalabilir)
- Yeni karar net ve tek anlamli yazilmalidir
- Fazlama etkisi varsa hangi faza kaydigi acikca yazilmalidir
- "MVP default" ve "post-pilot aday" ayrimi acik belirtilmelidir
- Web degisikligi app implementasyonuna etki ediyorsa `app-impact` klasorunde en az bir W2A kaydi acilmalidir

## 6. Kapanis Kontrolu (Done)

Asagidakiler saglanmadan "guncellendi" denmez:
- [ ] Karar `20_*` dosyasina islenmis
- [ ] Ilgili ana spec/ADR revize edilmis
- [ ] Risk kaydi guncellenmis
- [ ] Faz plani etkisi guncellenmis
- [ ] Reviewer brief (gerekiyorsa) guncellenmis
- [ ] App etkisi varsa `app-impact/00_*` kaydi acilmis/guncellenmis
- [ ] Celisen eski ifade kalmamis (rg/grep ile kontrol)

## 7. Pratik Komut Notu

Karar anahtar kelimeleri icin toplu arama yap:
- ornek: `rg -n "cross-tenant|grace_period|lastKnownUpdatedAt|compatibility layer" website/plan`

Bu, eski karar izlerini hizli yakalar.

## 8. Agent Oz-Kontrol Sorusu (Web implementasyonu boyunca)

Her anlamli web degisikliginden sonra agent su soruyu sorar:
- **"Bu degisiklik app tarafinda davranis/kontrat/mesaj degistiriyor mu?"**

Eger cevap `evet` veya `muhtemelen` ise:
- `website/app-impact/00_web_to_app_change_register.md` guncellenir
- gerekiyorsa `01_*`, `02_*`, `04_*`, `05_*`, `06_*` dosyalarina not dusulur
