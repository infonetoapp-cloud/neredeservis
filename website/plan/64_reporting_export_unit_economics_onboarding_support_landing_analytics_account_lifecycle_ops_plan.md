# Reporting/Export, Unit Economics, Onboarding/Support, Landing SEO/Analytics + Account Lifecycle Ops Plan

Tarih: 2026-02-24
Durum: V1 business-ops expansion plan

## 1. Amac

Teknik MVP'den satilabilir SaaS'a gecerken eksik kalan ticari/operasyonel konulari tek pakette planlamak.

Kapsam:
- reporting/export roadmap
- unit economics / cost triggerler
- onboarding/support SOP
- landing SEO/analytics/consent
- owner transfer / account lifecycle ops

## 2. Reporting / Export Roadmap

### 2.1 MVP sonrasi minimum kurumsal beklentiler

- aylik operasyon ozet exportu
- gecikme/rotar analizi ozetleri
- aktif/tamamlanan sefer ozetleri
- audit log exportu (yetkiye bagli)

### 2.2 Fazlama

Faz 5-6:
- basic CSV exports (UI + backend generated)

Faz 7:
- scheduled exports (opsiyonel)
- daha gelismis rapor setleri

Faz 8+:
- BI/data warehouse entegrasyon yol haritasi

### 2.3 Teknik not

Reporting sayilari ile dashboard sayilari ayni semantik olmayabilir.
Kural:
- "official export" server-side hesaplanmis olmalidir.

## 3. Unit Economics + Cost Triggerler

### 3.1 Neden gerekli?

Teknik maliyet optimizasyonu var; fakat tenant bazli karlilik gorunurlugu de gerekli.

### 3.2 Izlenecek metrikler (ornek)

- tenant basina aylik map cost estimate
- active trip basina cost estimate
- realtime read cost trend
- support time per tenant
- import/migration operasyon maliyeti

### 3.3 Trigger ornekleri

- bir tenant cost threshold'u asarsa package review
- route/eta mismatch support cost'u artarsa map standardization review
- import support burden yukselirse bulk import UX iyilestirme onceligi

## 4. Onboarding / Support SOP (Standard Operating Procedure)

### 4.1 Onboarding akisi (kurumsal)

1. discovery/demo
2. tenant acilisi
3. data import (drivers/vehicles/stops)
4. role setup
5. pilot route setup
6. acceptance checklist

### 4.2 Support operasyonu

- severity tanimlari (S1/S2/S3)
- response hedefleri (MVP icin mini SLA benzeri)
- incident escalation yolu
- issue tagging (route mismatch, authz, import, billing vb.)

### 4.3 Internal notes

- support notlari internal admin panelde veya issue sistemiyle baglantili tutulmali

## 5. Landing SEO / Analytics / Consent

### 5.1 SEO plan basliklari

- title/meta/OG standardlari
- landing page information architecture ve semantic HTML
- page performance / CWV hedefleri (fazlara gore)
- TR-first keyword yapisi

### 5.2 Analytics plan basliklari

- page view / CTA click / demo form submit
- auth entry clicks (landing -> login)
- pricing interest events
- UTM capture

### 5.3 Consent / privacy

- cookie/consent banner ihtiyaci
- analytics consent mode
- privacy policy / KVKK aydinlatma linkleri

## 6. Ownership Transfer + Account Lifecycle Ops

Kurumsal musteri operasyonu icin planlanmasi gereken akislar:
- owner account degistirme / devir
- owner silinmek isterse transfer zorunlulugu
- invite resend / revoke
- dormant tenant handling
- account closure request flow

Kural:
- ownership degisiklikleri auditlenir
- tek owner kaybinin tenanti kilitlememesi icin acil durum proseduru olmalı

## 7. Fazlama Onerisi

- Faz 5: support severity, SEO/analytics baseline, account lifecycle policy draft
- Faz 6: pilot support SOP aktif, export ihtiyaclari validate
- Faz 7: billing + reporting + internal admin entegrasyonu
- Faz 8: landing growth optimization + BI roadmap refinement

## 8. Referanslar

- `16_master_phase_plan_detailed.md`
- `33_release_and_pilot_runbook_web.md`
- `60_billing_internal_admin_and_suspension_policy_plan.md`
- `61_security_hardening_2fa_session_sso_csp_secrets_password_flows.md`
