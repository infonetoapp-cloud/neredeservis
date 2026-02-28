# Test, Rollout, DR, Retention + Notifications Implementation Readiness Checklist

Tarih: 2026-02-24
Durum: Pre-implementation checklist (63 icin execution bridge)

## 1. Amac

`63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md` icin fazlara dagitilabilir uygulama checklisti sunmak.

## 2. Baslangic Kriterleri (Start Gate)

- [ ] Faz bazli test minimumlari kabul edildi (F1/F3/F4/F5)
- [ ] Feature flag storage modeli (remote config/db/other) secim adayi listelendi
- [ ] Backup/restore capability limits (Firebase/Azure context) not edildi
- [ ] Retention/deletion policy ownership (kim karar verir?) belirlendi

## 3. Test Strategy Execution Checklist

### 3.1 Rules/Policy Tests
- [ ] Cross-tenant deny matrix hazir
- [ ] Company-scoped vehicle access tests hazir
- [ ] Membership role matrix allow/deny tests hazir

### 3.2 Functions / Integration
- [ ] Emulator test harness kuruldu
- [ ] company-level live access tests backloga girildi (routeReaders granular grants post-pilot notu var)
- [ ] migration compatibility smoke tests backloga girildi

### 3.3 Web E2E
- [ ] Auth flows (email/password + Google mock/strategy) tanimli
- [ ] Mode selector flow
- [ ] Company selector flow
- [ ] RBAC guard flows

### 3.4 Performance / Load (targeted)
- [ ] Hangi endpointler load test edilecek listesi net
- [ ] P95 hedefleri tanimli
- [ ] Test ortamı / data volumes not edildi

## 4. Feature Flags / Rollout Checklist

- [ ] Flag naming convention tanimli
- [ ] Global vs tenant-scoped flag ayrimi tanimli
- [ ] Kill-switch mekanizmasi planlandi
- [ ] Rollout steps template hazir (stg -> test tenant -> pilot subset -> all)
- [ ] Rollback kriteri her feature icin checklistte zorunlu

## 5. Backup / Restore / DR Checklist

- [ ] Hangi veriler backup scope icinde listelendi
- [ ] Backup sikligi (minimum) tanimlandi
- [ ] Restore rehearsal (stg) tarihi planlandi
- [ ] RPO/RTO baslangic hedefleri yazildi
- [ ] Restore runbook taslagi olusturuldu

## 6. Retention / Deletion Checklist

- [ ] Audit retention policy draft
- [ ] Trip history retention draft
- [ ] Soft delete vs hard delete matrix
- [ ] KVKK delete request handling flow draft
- [ ] Deletion audit event tipleri tanimli

## 7. Notification Strategy Checklist

- [ ] MVP notification provider shortlist
- [ ] Template versioning strategy
- [ ] Delivery log model (minimum alanlar)
- [ ] Retry/failure policy
- [ ] Opt-in/preferences fazlama notu

## 8. Pilot Readiness Minimum (related to 63)

Pilot oncesi en az su maddeler tamam:
- [ ] Rules deny tests (critical)
- [ ] Auth smoke E2E
- [ ] Feature flag basic infra
- [ ] Backup/restore rehearsal (en az 1)
- [ ] Retention/deletion policy draft approved

## 9. Referanslar

- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
- `19_risk_register_and_mitigation.md`
- `33_release_and_pilot_runbook_web.md`
- `61_security_hardening_2fa_session_sso_csp_secrets_password_flows.md`
