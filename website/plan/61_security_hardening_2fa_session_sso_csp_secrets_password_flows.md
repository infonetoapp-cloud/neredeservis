# Security Hardening Plan (2FA, Session, SSO, CSP, Secrets, Password Flows)

Tarih: 2026-02-24
Durum: V1 (Faz 5+ hardening detail)

## 1. Amac

Temel authz disinda eksik kalan guvenlik ve kimlik yonetimi detaylarini planlamak.

## 2. Kapsam

- 2FA politikasi
- session timeout / idle timeout
- SSO/SAML readiness
- secret key rotation
- password reset + email verification UX
- CSP hardening (Next.js + Mapbox)

## 3. 2FA Politikasi

### 3.1 Fazlama

- Faz 1-4: opsiyonel / hazirlik
- Faz 5: owner/admin icin optional 2FA
- Faz 6-7: kurumsal tenant policy ile zorunlu hale getirilebilir

### 3.2 Zorunlu 2FA tetikleyicileri

- enterprise paket
- elevated internal admin role
- hassas mutasyonlar (opsiyonel step-up auth)

## 4. Session / Timeout Politikasi

Planlanacak davranislar:
- idle timeout
- absolute session max age
- remember me davranisi
- hassas islemlerde re-auth requirement

UI gereksinimi:
- session expiring warning banner/modal
- safe draft preservation (formlarda)

## 5. SSO / SAML Readiness (ileri faz)

MVP'de implementasyon zorunlu degil; fakat plan hazir olmalı:
- tenant-level auth provider config modeli
- domain verification ihtiyaci
- role mapping strategy (IdP group -> app role)
- fallback local owner account policy

## 6. Secret Management + Rotation

Kapsam:
- Mapbox key
- Firebase service credentials
- provider webhook secrets
- internal admin secrets

Kurallar:
1. Secretlar source control'a girmez
2. Ortam bazli secret inventory tutulur
3. Rotation playbook olur (kim, ne zaman, nasil)
4. Rotation smoke checklist uygulanir

## 7. Password Reset / Email Verification UX

Eksik birakilmamasi gereken ekran/akislar:
- password reset request success/failure mesajlari
- expired reset link handling
- invalid token handling
- email verification required state (gerekiyorsa tenant policy)
- resend verification flow

Kural:
- hata mesajlari user-safe olmali, account enumeration yapmamalı

## 8. CSP / Security Headers Hardening Plan (Next.js + Mapbox)

Aşamali yaklasim:

Asama 1 (Faz 1):
- temel security headers baseline (clickjacking ve temel exfiltration risklerini azalt)
- CSP report-only (dar ama gercekci allowlist baslangici)
- gerekli domain allowlistleri (auth/map/fonts)
- `frame-ancestors`, `base-uri`, `object-src`, `form-action` gibi dusuk-risk, yuksek fayda kurallari once gelir
- Mapbox kullanimi acilmadan once CSP template'inde Mapbox worker/WebGL gereksinimleri notlanir (`worker-src blob:`, gerekli `connect-src` hostlari)

Asama 2 (Faz 4-5):
- script/style/img/connect kaynaklarini daralt
- Mapbox + Firebase + analytics domainleri netlestir
- nonce/hash stratejisi (uygunsa, Next.js App Router uyumu test edilerek)
- Mapbox worker/WebGL gereksinimleri (`worker-src blob:` vb.) test edilmeden production enforce'a gecilmez
- Next.js App Router/inline runtime davranislari icin CSP compatibility smoke checklisti zorunlu
- staging/prod siyah ekran (map render fail) senaryosu icin rollback header policy hazir olur

Asama 3 (Pilot oncesi):
- enforce mode (kademeli, report-only metrikleriyle)
- CSP violation report monitoring

Not (MVP gercekligi):
- Next.js App Router + Mapbox ile "strict CSP" ilk gunden zorunlu hedef degildir
- Faz 1-5'te amac: gercekci, kirilmayan, koruyucu baseline + kademeli sertlestirme
- "Strict CSP" post-pilot hardening backlog'u olabilir

## 9. Security Test Basliklari

- authz deny tests
- session expiry UX tests
- password reset token invalid/expired tests
- CSP violation smoke tests
- secret rotation rehearsal (stg)

## 10. Sahiplik / Fazlama

- Faz 1-2: baseline auth UX
- Faz 3-4: route/company policy security tests
- Faz 5: hardening package (2FA/session/CSP/secrets)
- Faz 6: pilot feedback ve enterprise talepleriyle update

## 11. Referanslar

- `31_security_kvkk_web_plan.md`
- `43_google_login_firebase_web_setup_checklist.md`
- `18_quality_gates_and_definition_of_done.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
