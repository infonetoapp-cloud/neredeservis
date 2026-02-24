# Test Strategy, Feature Flags, Rollout Controls + Backup/Retention/Notifications Plan

Tarih: 2026-02-24
Durum: V1 integrated quality+ops plan

## 1. Amac

MVP'den pilot'a giderken eksik kalan kalite ve operasyon kontrollerini netlestirmek:
- test strategy (rules/functions/web/e2e/load)
- feature flag + rollout
- backup/restore/DR
- data retention/deletion policy
- notification altyapisi stratejisi

## 2. Test Strategy (detay)

### 2.1 Test katmanlari

1. Unit tests
- web UI helpers
- backend command validators
- policy helpers

2. Integration tests (Firebase Emulator)
- Functions + Firestore/RTDB interactions
- membership/policy flows
- company-level live access rules/claims/degraded-mode tests (routeReaders granular grants post-pilot backlog)

3. Security Rules tests
- allow/deny matrix
- cross-tenant negative tests
- company-scoped vehicle access rules
- resourceId/companyId mismatch negatif testleri (mutasyon endpointleri)

4. Web E2E tests
- auth login/logout
- mode selector
- company switch
- RBAC guarded pages
- route basic flows

5. Load / performance tests (targeted)
- live ops snapshot endpoint
- RTDB subscription behavior (simulated)
- dashboard critical reads

### 2.2 Fazlara gore minimum test paketleri

Faz 1:
- auth smoke E2E
- basic rules deny tests

Faz 3:
- RBAC matrix integration tests
- cross-tenant vehicle/member deny tests

Faz 4:
- live ops lifecycle tests
- route versioning conflict tests
- sourceTimestamp clock-skew/drift guard tests

Faz 5:
- staging smoke suite + security suite + backup restore rehearsal

## 3. Feature Flags + Rollout Strategy

### 3.1 Neden gerekli?

Yeni policy / live ops / route editor degisikliklerini tum tenantlara ayni anda acmak risklidir.

### 3.2 Flag tipleri

- global feature flags
- tenant-scoped flags
- role-scoped flags (sinirli kullanim)
- kill switch flags (kritik)

### 3.3 Rollout kurali

1. dev -> stg internal
2. test tenant
3. pilot tenant subset
4. broader rollout
5. default-on

Kural:
- rollout metric + rollback kriteri bastan yazilir

## 4. Backup / Restore / Disaster Recovery (DR)

### 4.1 Planlanacak basliklar

- hangi veriler yedeklenir
- yedek sikligi
- yedek dogrulama
- restore proseduru
- RPO / RTO hedefleri (fazlara gore)

### 4.2 MVP/Pilot pratik hedef

- otomatik export/backup mekanizmasi (desteklenen servislerde)
- en az bir stg restore provasi
- runbook dokumani

## 5. Data Retention / Archive / Deletion

### 5.1 Sorular (planlanacak)

- audit log retention suresi
- trip history retention suresi
- archived route/vehicle saklama suresi
- tenant cancellation sonrasi data hold policy
- KVKK silme talebi isleme akisi

### 5.2 Kurallar

- soft delete ile hard delete ayrimi net olacak
- deletion jobs auditlenir
- backup retention ile delete policy cakismasi dokumante edilir

## 6. Notification Infrastructure Strategy

### 6.1 Kapsam

- email
- SMS
- WhatsApp (opsiyonel / provider durumuna gore)
- push (ileride)

### 6.2 Teknik plan basliklari

- provider secimi + fallback
- template versioning
- retry policy
- delivery log
- user preferences / opt-in
- tenant-specific sender settings (ileri faz)

### 6.3 MVP notu

MVP'de full notification hub gerekmeyebilir; ama provider abstraction ve log modeli bastan planlanmali.

## 7. Referanslar

- `18_quality_gates_and_definition_of_done.md`
- `19_risk_register_and_mitigation.md`
- `31_security_kvkk_web_plan.md`
- `33_release_and_pilot_runbook_web.md`
- `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
