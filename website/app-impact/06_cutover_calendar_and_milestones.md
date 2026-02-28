# Cutover Calendar + Milestones (Web/App Alignment)

Tarih: 2026-02-24
Durum: Taslak (web implementasyonu ilerledikce kesinlesecek)

## 1. Amac

Web backend kontratlari olgunlastikca app tarafinda:
- force update
- legacy read-only
- full cutoff
- app sprint entegrasyon

gibi adimlari takvimsel olarak netlestirmek.

## 2. Milestone Tipleri

- `M1` Web backend contract freeze (P0 endpointler)
- `M2` App integration sprint baslangici
- `M3` Legacy write-path read-only (`426`)
- `M4` Force update min version rollout
- `M5` Legacy cutoff (read da kapanir veya sunset edilir)
- `M6` Web+App cutover validation

## 3. Baslangic Taslak (tarih yok, event bazli)

### M1 - Contract Freeze (event-driven)
- Trigger: `42_p0_endpoint_contracts_v1_draft.md` Faz 1/2 endpointleri freeze edildi
- Gerekenler:
  - `04_api_contract_diff_register.md` guncel
  - `00_web_to_app_change_register.md` P0/P1 kayitlar triaged

### M2 - App Integration Sprint Start
- Trigger: Web MVP backend pathleri stabil
- Gerekenler:
  - app cleanup/freeze lane tamam
  - W2A backlog siralandi

### M3 - Legacy Write Read-Only
- Trigger: Force update rollout oncesi emniyet asamasi
- Gerekenler:
  - App `426` UX fallback hazir
  - critical write path reason mapping hazir

### M4 - Force Update Rollout
- Trigger: Remote Config + server enforcement hazir
- Gerekenler:
  - support/runbook notlari hazir
  - safe window / legacy shim (varsa) tanimli

### M5 - Legacy Cutoff / Sunset
- Trigger: adoption threshold + tarih
- Gerekenler:
  - migration monitoring tamam
  - rollback plani net

### M6 - Web+App Cutover Validation
- Trigger: `03_app_integration_cutover_checklist.md` P0 maddeleri yesil
- Gerekenler:
  - regression smoke gecildi
  - known limitations register guncel

## 4. Not

Bu dosya tarihleri simdiden uydurmak icin degil, takvim kararlarini sonradan
tek yerde toplamak icin var.
