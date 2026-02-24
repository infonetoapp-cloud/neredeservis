# Billing, Payments, Internal Admin + Suspension Policy Plan (MVP-Cut Revision)

Tarih: 2026-02-24
Durum: V3 (Faz 4-7 detailed planning, MVP billing core simplified)

## 1. Amac

Satilabilir SaaS icin gerekli ticari operasyon omurgasini planlamak:
- paketler / abonelik
- odeme saglayicisi
- tenant billing state
- entitlement/access davranisi
- ic yonetim (internal admin)
- odeme basarisizlik / suspension senaryolari

Revize hedef (solo-founder MVP gercegi):
- Odeme UI'yi geciktirebiliriz
- Ama `entitlement/account status/suspension` omurgasini pilot oncesi netlestirmeliyiz

## 2. Kapsam Disi (simdilik)

- tam muhasebe ERP entegrasyonu
- detayli vergi/fatura mevzuat uygulamasi
- advanced revenue analytics

## 3. Karar Gerektiren Basliklar

### 3.1 Odeme provider secimi

TR odakli baslangic icin degerlendirilecek:
- `iyzico`
- `Stripe` (mevcudiyet / yerel ihtiyaclara gore)
- hibrit (global + TR)

Karar kriterleri:
- TR kart basari orani
- subscription destek seviyesi
- webhook ergonomisi
- test/staging kolayligi
- chargeback/failed payment operasyonu

## 4. Tenant Billing Modeli (onerilen)

### 4.1 Cekirdek varliklar

- `plans`
- `subscriptions`
- `subscription_items` (opsiyonel)
- `billing_events`
- `invoices` (provider mirror/cache)
- `payment_methods` (tokenized reference)

### 4.2 Tenant billing states (MVP/Pilot core)

`company.billingStatus` (veya projection):
- `active`
- `past_due`
- `suspended_locked`

Not (post-pilot/genisleme):
- `trialing`, `grace_period`, `suspended_limited`, `cancelled` gibi ek state'ler provider/self-serve billing acildiginda degerlendirilir

### 4.3 Entitlement / Access state (MVP-pilot icin erkene cekilen cekirdek)

Odeme UI olmasa bile sistemde tenant erisim davranisi net olmalidir.

MVP-pilot minimum ihtiyac:
- `company.billingStatus` bazli access policy
- feature entitlement projection (en az plan seviyesi / tenant flag düzeyi)
- warning banner / locked mode davranislari
- internal admin operasyonu tarafindan manuel durum guncelleme (pilot donemi icin; UI panel zorunlu degil)

Kural:
- Billing provider entegrasyonu gelmeden once de state machine yazili ve test edilebilir olmalidir
- "Bedava pilot" dahi olsa tenant status disiplini korunur

Pilot dry-run failsafe (review sonrasi ek):
- `company.billingValidUntil` (veya esdegeri) alanı tanimlanir
- Bu tarih gecince provider olmasa bile scheduled job ile `past_due`/`suspended_locked` gecisi kontrol edilir
- "manuel unutuldu, tenant sinirsiz acik kaldi" riski azaltilir

## 5. Suspension Policy (kritik, MVP sade)

Odeme basarisizliginda sistem davranisi bastan net olmali.

Onerilen MVP politika:
1. failed payment / manuel billing issue -> `past_due`
2. `past_due` durumunda warning banner + owner/admin bilgilendirme
3. policy timeout / internal admin karari -> `suspended_locked`
4. `suspended_locked` -> login sonrasinda billing resolve ekranina yonlendir

Kural:
- Veri silme yok (suspension = erisim kisiti)
- owner/admin billing resolve akisina ulasabilmeli
- pilotta provider entegre degilse bile bu state'ler internal admin operasyon araclariyla dry-run uygulanir
- `grace_period` / `suspended_limited` gibi ara state'ler MVP default degildir (post-pilot)

## 6. Internal Admin (Neredeservis ekibi) - Altyapi Simdi, UI Sonra

### 6.1 Amaç

Destek ve operasyon ekiplerinin tenantlari guvenli sekilde yonetmesi.

### 6.2 MVP/Pilot kapsam (UI panel yok, operasyon altyapisi var)

Pilot oncesi minimum (zorunlu):
- internal admin authz/policy modeli (rol tanimi, elevated action kurallari)
- tenant status/account state degistirme komutlari/servisleri (backend/script seviyesinde)
- import/migration job durumunu gorebilecek operasyon yolu (Firebase Console / script / hazir admin araci)
- emergency tenant flag operasyonlari (strict audit)
- runbook / SOP (kim hangi durumda ne yapar)
- billing failsafe job runbook'u (daily scheduler / retry / alert)

Acik kural:
- Bu asamada React tabanli internal admin panel UI yazilmaz
- Kontrol ve uzaktan mudahale ihtiyaci operasyon araclari + scriptler + runbook ile karsilanir

Faz 7+ (internal admin web panel UI):
- tenant list/search UI
- subscription overview (provider sync)
- support notes
- audit view (internal) genisletme
- ops tooling ekranlari

### 6.3 Guvenlik kurallari

- internal admin ayri authz policy
- elevated actions icin extra confirmation
- tum internal mutasyonlar audit zorunlu
- impersonation varsa ayrica banner + audit + timebox

## 7. Billing UX Basliklari (faza gore)

### Faz 4-5 (core prep, pilot oncesi zorunlu)
- tenant billing/account status banners
- `past_due` / `locked` state UI davranislari
- internal admin backend/script tabanli entitlement/status kontrolleri (minimum, UI panel yok)
- landing pricing section placeholder veya basit fiyat bilgisi

### Faz 6 (pilot)
- pilot tenantlar icin manuel/yarı-manuel billing operasyonu
- `past_due` / `locked` davranis rehearsal (gercek odeme olmasa bile dry-run)

### Faz 7 (provider + self-serve implementasyon)
- plan secimi
- odeme yontemi ekleme/guncelleme
- invoice listesi
- abonelik degistirme
- cancellation flow
- failed payment recovery flow

## 8. Webhook + Event Isleme Plani

Odeme provider eventleri icin:
- idempotent webhook handling
- event signature verification
- retry-safe processing
- billing_events logu
- out-of-order event handling kurali

Not:
- Bu bolum provider entegrasyonu acildiginda Faz 7 implementasyonuna girer
- Ama event modeli/isimlendirme Faz 5'te kabaca tasarlanabilir

## 9. Test Gereksinimleri

Pilot oncesi minimum:
- `billingStatus` state transition tests (manual/internal path)
- tenant lock/read-only policy tests
- internal admin elevated action audit tests (script/command path)
- `billingValidUntil` gecisinde scheduled auto-lock/past-due testi (provider yokken)

Provider entegre oldugunda ek:
- failed payment -> advanced grace/limited transitions (ek state'ler acilirse)
- webhook replay/idempotency
- failed payment recovery flow tests

## 10. Fazlama Notu (revize)

- Faz 4-5: provider evaluation + data model + MVP 3-state entitlement/suspension freeze
- Faz 5-6: internal admin operasyon altyapisi (script/runbook/policy) + banner/lock behavior + pilot rehearsal
- Faz 5-6: `billingValidUntil` failsafe scheduler + alert rehearsal
- Faz 6: pilot sonrasi fiyat/paket validasyonu
- Faz 7: payment provider self-serve billing UI + internal admin web panel UI + invoice/subscription V1 (gerekirse advanced billing states)

## 11. Referanslar

- `16_master_phase_plan_detailed.md`
- `31_security_kvkk_web_plan.md`
- `33_release_and_pilot_runbook_web.md`
- `54_adr_006_company_of_one_tenant_standardization.md`
