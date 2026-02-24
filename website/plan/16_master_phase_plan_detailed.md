# Master Phase Plan (Detailed) - Web System

Tarih: 2026-02-24
Durum: V0 detayli plan

## 1. Amaç

Bu dokuman tum fazlari:
- sira
- kapsam
- bagimlilik
- cikti
- kabul kriteri
olarak netlestirir.

Hedef:
- ise baslarken ne yapacagimizi bilmek
- okuyan muhendisin tum sisteme hizla hakim olabilmesi

## 2. Faz Ozeti

- Faz 0: Planlama + karar kilidi + kalite kurallari
- Faz 1: Web altyapi bootstrap (landing + panel skeleton + auth)
- Faz 2: Bireysel sofor paneli (MVP cekirdek)
- Faz 3: Firma tenant + RBAC + arac/sofor yonetimi
- Faz 4: Rota/durak operasyon + canli operasyon paneli
- Faz 5: Audit, guvenlik, kalite sertlestirme, staging/production gate
- Faz 6: Pilot musteri rollout
- Faz 7: Billing/internal admin/advanced reporting
- Faz 8: Landing final marketing + olcekleme iyilestirmeleri

## 3. Faz 0 - Planlama ve Tasarim Kilidi

### Hedef
- Mimariyi ve kalite standartlarini netlestirmek

### Kapsam
- hosting/domain karari
- env matrix
- RBAC/yetki matrisi
- domain model taslagi
- API backlog
- coding standards
- quality gates
- risk register

### Ciktilar
- `website/plan/*` Faz 0 dokumanlari

### Kabul Kriteri
- Faz 1 baslatacak bir muhendis:
  - env/hosting karisini anlamis
  - hangi endpointlerin lazim oldugunu biliyor
  - yetki modelini goruyor

## 4. Faz 1 - Web Bootstrap (Landing + Panel Skeleton)

### Hedef
- Kod tabani kurulumu ve auth girisinin calismasi

### Kapsam
- `website/apps/web` (marketing + dashboard route groups)
- Next.js + TypeScript setup
- lint/typecheck/build pipeline
- Azure SWA deployment (dev)
- Firebase web auth temel entegrasyonu
- Email/Password + Google login
- Login/logout
- Session bootstrap
- Mode selector (individual/company placeholder)

### Bagimlilik
- Faz 0 tamam

### Ciktilar
- Azure dev ortaminda calisan tek web app (landing + panel shell)
- Giris yap akisi
- Ortam badge (DEV/STG/PROD)

### Kabul Kriteri
- `app.neredeservis.app` (veya dev domain) login ekrani aciliyor
- Kullanici giris/cikis yapabiliyor
- Panel shell role placeholder ile aciliyor

## 5. Faz 2 - Bireysel Sofor Paneli (MVP Cekirdek)

### Hedef
- Bireysel sofor webden temel operasyonu yonetsin

### Kapsam
- dashboard (bireysel)
- arac CRUD (kendi araci)
- rota liste/detay
- durak yonetimi
- aktif sefer ve gecmis sefer gorunumu
- mevcut endpoint reuse + gerekli web adaptasyonlari

### Bagimlilik
- Faz 1
- route/stop endpoint policy netligi

### Ciktilar
- kullanilabilir bireysel sofor paneli

### Kabul Kriteri
- bireysel sofor kendi rotasini olustur/guncelleyebiliyor
- durak ekle/sil/sirala yapabiliyor
- aktif sefer durumunu gorebiliyor

## 6. Faz 3 - Firma Tenant + RBAC + Varlik Yonetimi

### Hedef
- Firma bazli cok kullanicili paneli aktif etmek

### Kapsam
- `Company`, `CompanyMember`, `Vehicle`, `Assignment` backend model/endpointleri
- firma secimi
- role-based navigation
- sofor/araç yonetimi
- yetkili sofor atama
- route-level permission modeli (taslak -> MVP uygulama)

### Bagimlilik
- Faz 1
- Faz 2 (bircok UI pattern burada tekrar kullanilir)

### Ciktilar
- owner/admin/dispatcher/viewer akislari calisir

### Kabul Kriteri
- firma kullanicisi role'ine gore menuleri gorur
- dispatcher operasyon mutasyonu yapabilir
- viewer salt okuma gorur
- cross-tenant erisim denemesi engellenir

## 7. Faz 4 - Rota/Operasyon + Canli Harita

### Hedef
- Firma operasyonu icin canli takip ve rota operasyonu panelini olgunlastirmak

### Kapsam
- company-aware route CRUD
- stop editor gelistirme
- aktif sefer listesi
- canli harita (Mapbox)
- live ops panel
- route preview/share akislari (web etkisi)
- read model optimizasyonu (gerekiyorsa projection endpoint)

### Bagimlilik
- Faz 3 RBAC
- RTDB read strategy netligi (MVP company-level RTDB / projection)

### Ciktilar
- dispatcher operasyon ekrani

### Kabul Kriteri
- firma aktif seferleri haritada gorebiliyor
- rota/durak degisiklikleri policy'e gore calisiyor
- performans kabul edilebilir (basic smoke)

## 8. Faz 5 - Sertlestirme (Security / Audit / Quality)

### Hedef
- Pilot oncesi guvenilirlik ve izlenebilirlik

### Kapsam
- audit log endpoint/UI
- denied action logging (kritiklerde)
- quality gates CI
- staging smoke suite
- cost alerts (Azure/Firebase/Mapbox)
- CORS/origin allow-list finalize
- env var/secret hygiene

### Bagimlilik
- Faz 3-4 cekirdek akislari

### Ciktilar
- release gate checklist

### Kabul Kriteri
- audit log kritik mutasyonlari kaydediyor
- staging environment smoke testleri geciyor
- budget alerts aktif

## 9. Faz 6 - Pilot Rollout

### Hedef
- Gercek (veya yari-gercek) pilot musteri kullanimi

### Kapsam
- production deploy
- onboarding runbook
- demo/pilot tenant setup
- support/incident response mini runbook
- geri bildirim toplama dongusu

### Bagimlilik
- Faz 5

### Kabul Kriteri
- pilot musteri sistemi kullanabiliyor
- kritik issue triage sureci isliyor

## 10. Faz 7 - Ticari Operasyon Katmani

### Hedef
- Satin alma ve internal operasyon araclarini eklemek

### Kapsam
- billing/subscription UI
- paketler
- internal admin panel (ayri route/app olabilir)
- customer support ops ekranlari
- raporlama/exportlar

### Bagimlilik
- Pilot feedback

### Kabul Kriteri
- abonelik akisi calisiyor
- internal admin ile temel musteri operasyonu yonetiliyor

## 11. Faz 8 - Landing Final + Olcekleme Iyilestirmeleri

### Hedef
- Pazarlama sitesi polish ve performans/olcekleme iyilestirmeleri

### Kapsam
- landing final tasarim
- SEO iyilestirme
- conversion olcumu
- ileri seviye caching ve dashboard optimizasyonlari
- tech debt odakli refactor paketleri

### Kabul Kriteri
- landing production-ready
- panel performansi ve bakim kalitesi korunmus

## 12. Review Sonrasi Faz Guncelleme Overlay (2026-02-24)

Bu bolum, dis review sonrasi planin eksik kalan SaaS-operasyon alanlarini fazlara dagitir.

### Faz 0 ekleri
- critique integration karar kaydi + yeni ADR/spec dokumanlari
- company-of-1 / read model sadeleştirme / vehicle security revizyonu

### Faz 1 ekleri
- company-of-1 aware session bootstrap tasarimi
- auth UX'de password reset/email verification edge-state plan notlari

### Faz 2 ekleri
- bireysel UX backend'de company-of-1 tenant uzerinden calisir
- legacy mobile coexistence etkileri (compatibility notlari) izlenir

### Faz 3 ekleri
- company-scoped vehicle write model (ADR-008)
- company/member/policy modeli company-of-1 standardizasyonu ile ayni omurgada

### Faz 4 ekleri
- route/trip icin MVP minimum koruma (trip snapshot + warning + Firestore `updateTime`/token tabanli basic conflict guard)
- recurrence/timezone/DST baseline
- company-level RTDB live access + stale/degraded UX semantigi
- offline burst replay icin backend coalescing (latest-only live node) + UI throttling
- projection endpointler trigger/esik tabanli acilir

### Faz 5 ekleri
- security hardening paketi (2FA/session/CSP/secrets/password flows plan+uygulama)
- backup/restore rehearsal ve retention/deletion policy taslagi
- billing provider shortlist + MVP 3-state billing status/suspension policy freeze
- billing/account status banners + `past_due/locked` behavior (provider-agnostic core)
- internal admin operasyon altyapisi (policy/runbook/script yolu) hazirligi
- migration rehearsal + legacy cutoff takvimi taslagi
- mobile force update + server-side version enforcement rehearsal (`426` cutoff path dahil)

### Faz 6 ekleri
- white-glove onboarding + import scripts pilot-ready (self-serve bulk import UI ertelendi)
- map mismatch telemetry + standardization trigger takibi
- support severity SOP ve issue tagging baslangici
- stale/offline threshold tuning (live ops pilot kalibrasyonu)

### Faz 7 ekleri
- payment provider self-serve billing UI + internal admin web panel UI (uzaktan mudahale ekranlari)
- reporting/export V1
- advanced enterprise security readiness (SSO/SAML prep, tenant 2FA policy)

### Faz 8 ekleri
- landing SEO/analytics/consent olgunlastirma
- BI/reporting roadmap refinement
- unit economics ve cost optimization loop iyilestirmeleri

## 12. Fazlar Arasi Gecis Kurali

Bir faz kapanmadan bir sonraki faza davranis degistiren is alinmaz.

Faz kapanisinda zorunlu:
- dokuman guncel
- test/gate sonucu
- risk/borc notu
- bir sonraki faz giris kriteri

## 13. Plan Degistirme Kurali

Plan degisebilir ama kontrolsuz degismez:
- mini-ADR
- etkiledigi fazlar
- maliyet/zaman/risk etkisi
- onay notu
