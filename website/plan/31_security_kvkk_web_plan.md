# Security + KVKK Web Plan (MVP -> Pilot)

Tarih: 2026-02-24
Durum: V0

## 1. Amac

Web panelde guvenlik ve KVKK gerekliliklerini MVP hizini bozmadan ama taviz vermeden planlamak.

## 2. Guvenlik Prensipleri

1. Server-side authorization zorunlu
2. Tenant isolation non-negotiable
3. Least privilege
4. PII minimization
5. Auditability
6. Secrets hygiene

## 3. Auth / Session Guvenligi (MVP)

- Firebase Auth kullanimi
- Email/Password + Google login
- Protected routes guard
- Session bootstrap server/client uyumlu

MVP not:
- 2FA firma policy zorunlu degil (Faz 2/3 aday)

## 4. Authorization Guvenligi

Zorunlu kontroller:
- user signed in mi?
- mode (`individual` / `company`) dogru mu?
- `companyId` erisimi var mi?
- role/permission yeterli mi?

Yasak:
- Sadece menu gizleyerek yetki vermeme

## 5. Tenant Isolation Kurallari

1. Tum company endpointlerinde `companyId` context kontrolu
2. Cross-tenant query default deny
3. Global koleksiyonlarda (`vehicles`) server-side `companyId` filtre enforcement
4. Loglarda tenant context kaydi

## 6. KVKK / PII Kapsami (MVP)

PII ornekleri:
- ad/soyad
- telefon
- email
- plaka (operasyonel veri ama hassas olabilir)
- konum verisi (ozellikle canli/gecmis)

MVP kurallari:
- minimum gerekli veri goster
- role bazli maskeleme (gereken alanlarda)
- export/isleme siniri
- prod verisini dev/stg'ye tasima default yasak

## 7. Audit Log Kapsami (Guvenlik + Uyum)

Kritik mutasyonlar audit'e girer:
- role degisiklikleri
- company membership degisiklikleri
- sofor/arac rota mutasyonlari
- route permission degisiklikleri
- seferi etkileyen operator mutasyonlari

Opsiyonel ama onemli:
- denied action audit (kritik endpointlerde)

## 8. Secrets and Config Hygiene

Kural:
- Secretlar repo'ya girmez
- Azure env/secret store uzerinden tanimlanir
- Dokumanlarda sadece secret isimleri tutulur

Riskli alanlar:
- Firebase config karmasasi
- Mapbox token ortam karisikligi
- preview env'lerin prod config'e baglanmasi

## 9. CORS / Origin Policy

Allow-list (MVP):
- `https://neredeservis.app`
- `https://app.neredeservis.app`
- gerekli staging/preview domainleri (dev/stg ile sinirli)

Kural:
- wildcard origin kullanma (ozellikle prod)

## 10. Client Security Headers / Web Hardening (MVP)

Hedef:
- temel guvenlik header seti

Planlanacak:
- HSTS (prod)
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy (ihtiyaca gore)
- CSP (fazli rollout ile, cunku Next/Mapbox entegrasyonu etkileyebilir)

## 11. KVKK Operasyon Kurallari (MVP)

1. Demo verisi gercek kisi verisi olmayacak
2. Support ekran goruntulerinde PII kontrolu
3. Loglarda ham telefon/email tutulmayacak (redaction)
4. Prod incident debug icin veriye erisimler auditlenmeli

## 12. Faz Bazli Security Roadmap

Faz 1:
- auth shell + basic route guards
- env/secrets hygiene

Faz 2/3:
- tenant/RBAC full enforcement
- audit log kritik mutasyonlar

Faz 4/5:
- denied action audit
- 2FA policy (opsiyonel ama guclu aday)
- IP allow-list (kurumsal talep olursa)
- CSP sertlestirme

## 13. Security Review Checklist (Pilot oncesi)

- [ ] authz endpoint bazinda dogrulandi
- [ ] cross-tenant deny smoke yapildi
- [ ] prod origin allow-list dogru
- [ ] secret leakage kontrolu yapildi
- [ ] audit log kapsami kritik mutasyonlari kapsiyor
- [ ] PII maskeleme kurallari dogrulandi

## 14. Review Sonrasi Detay Dokumanlari (2026-02-24)

Bu dokumanin detaylandirilmis alt planlari:
- `61_security_hardening_2fa_session_sso_csp_secrets_password_flows.md`
- `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
