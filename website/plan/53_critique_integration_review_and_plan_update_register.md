# Critique Integration Review + Plan Update Register

Tarih: 2026-02-24
Durum: Accepted review integration pack

## 1. Amac

Bu dokuman, dis geri bildirimleri (arkadas review'u) resmi plan kararlarina ve yeni is paketlerine donusturur.

Hedef:
- iyi elestirileri kaybetmemek
- plani "teknik demo" seviyesinden "satilabilir SaaS operasyonu" seviyesine cikarmak
- kabul / kismi kabul / red durumlarini netlestirmek

## 2. Elestiri Sonuclari (Kisa Karar Matrisi)

### C-01 - Hybrid read model MVP icin fazla karmasik

Durum: `Kismi kabul`

Karar:
- Uzun vadede hibrit model korunur
- MVP Faz 1-2'de projection endpoint kullanimi sinirlanir
- Basit dashboard KPI'lar client-side hesaplanabilir
- Projection endpoint acilisi tetik/esik tabanli olacak

Plan dokumani:
- `55_adr_007_mvp_read_model_simplification_and_projection_triggers.md`

### C-02 - Global vehicles koleksiyonu tenant leakage riski yaratir

Durum: `Kabul`

Karar:
- MVP default: `companies/{companyId}/vehicles/*`
- Global query ihtiyaci icin sonradan projection/index stratejisi
- `vehicles/*` global model karari ADR-003 uzerinden revize edildi

Plan dokumani:
- `56_adr_008_vehicle_collection_security_revision.md`

### C-03 - Web Mapbox / Mobil Google farklari operasyon tartismasi cikarir

Durum: `Kabul`

Karar:
- Kisa vadede mismatch reality kabul edilir (MVP koordinat odakli gorunum)
- Map mismatch telemetry + standardization trigger metricleri tanimlanacak
- Backend canonical route/ETA yatirimi pilot sonrasi tetiklenirse acilacak

Plan dokumani:
- `57_adr_009_map_standardization_and_eta_consistency.md`

### C-04 - Stitch tasarim sureci tasarim borcu dogurabilir

Durum: `Kabul`

Karar:
- Stitch founder velocity araci olarak kalir
- Figma UI kit / component kit fallback stratejisi resmi olarak eklenir
- HTML prototype line'ı korunur (kalite odakli)

Plan etkisi:
- `46_*`, `47_*`, `50_*` dokumanlarina fallback notu eklenecek

### C-05 - Bireysel + kurumsal mod dallanmasi policy kodunu siserir

Durum: `Guculu kabul`

Karar:
- `Company of 1` tenant standardizasyonu kabul
- Bireysel sofor UX ayri kalabilir ama domain/policy katmani company-temelli ortak olur

Plan dokumani:
- `54_adr_006_company_of_one_tenant_standardization.md`

## 3. Eksik Bulunan Alanlarin Durumu (Backlog -> Plan)

Asagidaki alanlar yeni plan dokumanlarina detaylandirildi:
- Billing + internal admin
- Mobile migration + backward compatibility
- Bulk import UX/API
- routeReaders lifecycle
- Security hardening (2FA/session/CSP/secrets)
- Reporting/export roadmap
- Route/trip versioning
- Recurrence/timezone/DST
- Concurrent editing conflict policy
- Test strategy
- Feature flags + rollout
- Backup/restore + retention + deletion
- Notifications strategy
- Onboarding/support ops
- Unit economics triggers
- Landing SEO/analytics/consent
- Ownership transfer/account lifecycle ops

## 3A. Round 2 Sonrasi Sadelestirme Revizyonlari (solo-founder MVP cut)

Dis review turu sonrasi ek kabul edilen sadelestirmeler:
- Bulk Import UI MVP'den cikarildi, white-glove onboarding resmi strateji oldu
- routeReaders TTL/grant lifecycle MVP default olmaktan cikarildi; company-level RTDB live access kabul edildi
- Full route/trip versioning + publish modeli MVP'den cikarildi; minimum koruma modeli kabul edildi
- Force Update + server-side min client version enforcement planlara eklendi
- Mobile offline/stale location tolerance semantigi ayri planda detaylandirildi

## 3B. Round 2 Ek Revizyon Turundan Alinan Kararlar (kaliteyi bozmayan sadeleştirme)

- Compatibility layer write-path kapsamı daha da daraltildi; aggressive force update + `426` cutoff stratejisi sertlestirildi
- RTDB access mirror korunup claims-only'e donulmedi; sync failure icin failsafe/reconcile gereksinimi eklendi
- Cross-tenant vehicle operasyon kullanimi MVP kapsamindan cikarildi (tenant-local vehicle strict kaldı)
- Route conflict guard semantigi Firestore `updateTime`/version token tarafina cekildi
- Billing core MVP'de 3-state (`active`, `past_due`, `suspended_locked`) seviyesine indirildi
- Offline burst replay icin backend latest-only coalescing kuralı netlestirildi

## 4. Program Seviyesi Sonuc

Plan artik:
- sadece "MVP ekranlari" degil
- migration, security, billing, pilot, support ve data lifecycle
konularini da kapsayan daha tam bir SaaS programina donustu.

## 5. Uygulama Kurali

Bu review dokumani tek basina yeterli degildir.

Her kabul edilen madde:
- ADR veya teknik spec dokumanina baglanmali
- Faz plani / risk register / decision log icinde izlenmelidir
