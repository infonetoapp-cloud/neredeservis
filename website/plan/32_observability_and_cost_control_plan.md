# Observability + Cost Control Plan (Web + Firebase + Mapbox)

Tarih: 2026-02-24
Durum: V0

## 1. Amac

Sistemin:
- gorulebilir
- olculebilir
- maliyet kontrollu
olmasini saglamak.

## 2. Gozlemlenebilirlik Katmanlari

1. Frontend (landing/panel)
2. Backend API (Firebase Functions)
3. Data services (Firestore/RTDB)
4. Map provider (Mapbox)
5. Infra (Azure SWA)

## 3. MVP Minimum Metrikler

### Web Panel
- page load errors
- auth login success/fail count
- route navigation error count
- critical action error rate

### Backend (Functions)
- request count
- error rate
- p95 latency
- endpoint bazli hata dagilimi

### Firebase/Data
- Firestore read/write trend
- RTDB bandwidth/read trend (takip ekranlari)

### Mapbox
- map loads
- directions requests
- map matching requests
- search/autocomplete kullanim trendi (kullaniliyorsa)

### Azure SWA
- deployment status
- availability basic checks
- bandwidth trend (plan seviyesine gore)

## 4. Alerting (MVP)

### P1 (anlik)
- web panel login tamamen bozuk
- kritik endpoint error rate spike
- production site erişilemez

### P2 (gun ici)
- error rate artis trendi
- cost budget %80
- Mapbox usage trend anomalisi

### P3 (haftalik iyilestirme)
- yavas endpoint trendleri
- gereksiz map/directions traffic

## 5. Cost Control Stratejisi

## 5.1 Azure
- Budget alerts: 50/80/100%
- Student ortamda daha dusuk limitler
- Resource tagging zorunlu

## 5.2 Firebase
- Billing budget alerts
- Functions/RTDB/Firestore kullanim trend izleme
- dev/stg/prod ayrik takip

## 5.3 Mapbox
- server-side cap/rate-limit (backend)
- token ayrimi (dev/stg/prod)
- gereksiz autocomplete/directions azaltma

## 6. Telemetry Olaylari (Web MVP taslak)

Panel:
- `web_login_attempt`
- `web_login_success`
- `web_login_failed`
- `web_mode_selected`
- `web_company_selected`
- `web_route_create_submitted`
- `web_route_create_failed`
- `web_stop_mutation_submitted`
- `web_live_ops_opened`

Landing:
- `landing_cta_login_click`
- `landing_cta_demo_click` (ileride)

Not:
- PII icermeyecek

## 7. Dashboard Planı (MVP)

### Dashboard A - Product/Ops
- login success/fail
- active companies/users (ileride)
- route/trip operation error count

### Dashboard B - Engineering
- endpoint error rate/p95
- deploy status
- frontend errors

### Dashboard C - Cost
- Azure spend/budget
- Firebase billing trend
- Mapbox usage trend

## 8. Review Ritmi

Gunluk:
- P1/P2 alert kontrolu

Haftalik:
- maliyet trendi
- error budget/trend
- live ops performans notlari

Faz kapanisi:
- metrikler plan hedefleriyle karsilastirilir

## 9. MVP'de Bilerek Basit Tutulacaklar

- advanced analytics warehouse
- full BI pipeline
- long-term custom telemetry platform

Ama ertelenmeyecekler:
- budget alerts
- temel error monitoring
- endpoint metric gorunurlugu

## 10. Review Sonrasi Ek Observability Basliklari (2026-02-24)

Yeni izleme alanlari:
- map mismatch / ETA delta telemetry (ADR-009 triggerleri icin)
- legacy vs new API compatibility usage telemetry
- company-level live subscribe/deny + stale token/company switch telemetry
- force update / old client reject telemetry
- tenant-level unit economics metricleri (cost review icin)

Detay dokumanlar:
- `57_adr_009_map_standardization_and_eta_consistency.md`
- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
- `71_mobile_force_update_and_client_version_enforcement_plan.md`
- `72_mobile_offline_stale_location_tolerance_plan.md`
- `64_reporting_export_unit_economics_onboarding_support_landing_analytics_account_lifecycle_ops_plan.md`
