# Live Ops RTDB Access Strategy (MVP Simplified, Revocation-Hardened)

Tarih: 2026-02-24
Durum: V4 technical spec (MVP simplification + revoke hardening + mirror failsafes)

## 1. Problem

Ilk planda RTDB canli takip icin `routeReaders` benzeri read grant modeli (grant create/refresh/revoke + TTL cleanup) dusunuldu.

Bu modelin riski:
- grant lifecycle karmasikligi
- stale grant cleanup bagimliligi
- cron/TTL kaynakli auth leak riski
- solo-founder MVP teslim hizinda ciddi yavaslama

MVP-cut revizyonunda company-level coarse access'e gecildi; ancak sadece custom claims'e dayanmak da yeni bir risk yaratir:
- membership/rol revoke oldugunda token refresh gecikmesi
- aktif dispatcher'in yetkisi alinsa bile canli veriyi bir sure daha gorebilmesi

## 2. Revize Karar (MVP)

MVP'de route/trip bazli `routeReaders` grant lifecycle default olmayacak.

MVP live ops read modeli:
- company-level live access (tenant-scoped)
- RTDB path company bazli
- rules + auth token claims + RTDB access mirror ile coarse read gate
- UI tarafinda sayfa/route filtreleme (authz degil UX)
- "stale location" ve "stale token/access deny" UI semantigi ayrik tutulur
- role bazli ekran yetkisi ayri konudur; vehicle/route subset-level live visibility authz MVP disidir

`routeReaders` lifecycle modeli:
- tamamen silinmedi
- post-pilot / daha ince-grained ihtiyac cikarsa tekrar acilacak

## 3. MVP RTDB Data Shape (onerilen)

Ornek path:
- `company_live_ops/{companyId}/vehicles/{vehicleId}`
- opsiyonel: `company_live_ops/{companyId}/trips/{tripId}` (summary/projection)

Konum kaydinda minimum alanlar:
- `lat`
- `lng`
- `speed` (opsiyonel)
- `heading` (opsiyonel)
- `accuracyM` (opsiyonel)
- `sourceTimestamp`
- `serverTimestamp`
- `driverId`
- `vehicleId`
- `tripId` (varsa)
- `routeId` (varsa)
- `status` (online, stale, offline_assumed gibi UI hesaplamasina yardimci olabilir)

## 4. Yetkilendirme Stratejisi (MVP)

### 4.1 Rule seviyesinde coarse gate (2+ sinyal)

RTDB read rule hedefi:
- kullanici sadece secili company baglamindaki live path'i okuyabilsin
- membership revoke oldugunda claims refresh beklenmeden access kesilebilsin

Bu nedenle RTDB rule temel olarak 2 sinyal kullanir:
1. `auth.token.activeCompanyId == $companyId` (UI/company context)
2. RTDB access mirror kaydi (server-maintained membership mirror)

Ornek mantik (pseudo):
- `auth != null`
- `auth.token.activeCompanyId == $companyId`
- `root.child('live_access_mirrors').child($companyId).child(auth.uid).child('active').val() == true`

Opsiyonel/onerilen company-level kill switch (write amplification azaltma):
- `root.child('live_access_company_flags').child($companyId).child('isActive').val() == true`
- Sirket suspension durumunda tum user mirrorlarini fan-out update etmek yerine tek company flag ile deny baslatilabilir

### 4.2 Access mirror neden var? (claims-only yerine ama minimal)

Custom claims tek basina yeterli degildir:
- multi-company membership senaryosu
- token refresh gecikmesi
- stale token riski

Access mirror faydasi:
- membership/rol revoke oldugunda server RTDB mirror kaydini aninda kapatabilir
- rule mirror'a baktigi icin claims stale olsa bile read deny baslayabilir
- routeReaders kadar ince taneli degil ama revoke latency riskini azaltir

### 4.3 Mirror scope siniri (MVP kalite/hiz dengesi)

Access mirror MVP'de bilincli olarak dar tutulur:
- company-level coarse read access icin kullanilir
- route/trip granular grant tutmaz
- membership projection'dan turetilen minimum alanlari tasir
- TTL/grant refresh/lease mekanigi yoktur

### 4.4 Claims'in rolü (daraltildi)

MVP kurali:
- claims = company context + coarse gate sinyali
- RTDB mirror = hızlı revoke sinyali
- kritik mutasyonlar = server-side membership/policy check

Not (review netlestirmesi):
- Firebase Auth token TTL'ini uygulama tarafindan keyfi sekilde kisaltmak beklenmez
- Gecikme azaltma araci: mirror revoke + `revokeRefreshTokens` + kritik ekranlarda force refresh/re-auth

## 5. Access Mirror Lifecycle (MVP minimal)

Mirror path (onerilen):
- `live_access_mirrors/{companyId}/{uid}`

Alanlar (minimum):
- `active: true|false`
- `role`
- `updatedAt`
- `source` (`membership_sync` / `manual_internal`)

Create/update triggerleri (minimal):
- company member active olur
- role degisir
- company suspension state degisir
- company-of-1 tenant activation

Revoke triggerleri (minimal):
- member suspended/removed
- company suspended_locked (policy'e gore)
- user account disabled

Not:
- Bu lifecycle routeReaders-grant lifecycle kadar karmasik degildir
- TTL/cleanup gerektirmez; membership projection mantigiyla calisir
- Implementasyon hedefi: tek membership kaynak semantigi + deterministic mirror projection
- Company suspension gibi toplu aksiyonlarda fan-out RTDB write patlamasi olursa company-level `isActive` flag tercih edilir

## 6. Revocation Latency Hardening (review sonrasi ek)

### 6.1 Hedef

Canli live ops verisinde yetki iptali gecikmesini "1 saat token expiry" seviyesine birakmamak.

### 6.2 MVP katmanlari

1. RTDB access mirror update (primary revoke path)
- member revoke/suspend oldugunda mirror `active=false` veya remove
- company-wide suspend durumunda (opsiyonel optimizasyon) `live_access_company_flags/{companyId}/isActive=false`

2. Firebase auth refresh token revoke (secondary)
- kritik yetki degisikliklerinde `revokeRefreshTokens(uid)`
- yeni token alinmasini zorlastirir / session reseti hizlandirir

3. Client UX/session refresh sinyali (opsiyonel ama onerilen)
- kullaniciya "oturumunuz/erişiminiz guncellendi" refresh/re-auth akisi
- sonraki API/RTDB retry'da net mesaj

Not:
- Server tarafinda TCP soketi "sert kapatma" garanti edilmez
- Ama mirror + token revoke + UI refresh ile pratik revoke latency ciddi azaltilir

### 6.3 Mirror sync failure failsafeleri (MVP zorunlu)

Access mirror kullaniminin riski:
- membership -> mirror sync asenkron ve hataya acik olabilir

Bu nedenle MVP'de asgari failsafe seti:
1. Firestore membership degisiminden RTDB mirror'a giden primary trigger (tek sorumluluk)
2. `access_mirror_sync_failed` alert/log metriği
3. Periyodik reconcile job (membership source ile mirror drift kontrolu)
4. Maksimum oturum yeniden dogrulama politikasi (ornegin kritik ekranlarda periyodik re-auth/refresh)
5. Company suspension write amplification guard (fan-out yerine company-level kill switch)

Kural:
- Claims stale / mirror stale ayrimi operasyon loglarinda ve UI hata durumunda ayri sinyallenir
- Failsafe yoksa mirror modeli "hazir" sayilmaz

## 7. Company Switch / activeCompanyId Kurali

MVP'de web panel company context switch yaptiginda:
1. aktif company secilir
2. gerekiyorsa token refresh tetiklenir
3. RTDB subscribe yeni company path'e acilir
4. onceki company subscription kapatilir

Kural:
- UI filtreleme ve RTDB path auth ayri kavramlar olarak ele alinir
- activeCompanyId claims semantigi dokumante edilir

## 8. routeReaders Modeli Ne Zaman Geri Acilir?

Asagidaki durumlarda ince taneli grant modeli yeniden degerlendirilir:
- company-level live access veri hacmi / maliyeti sorun olur
- kurumsal musteri route/trip bazli canli goruntu kisiti ister
- compliance / contractual requirement granular live access gerektirir
- live ops ekraninda company-level stream performans bottlenecki olusur

## 9. Observability / Audit (MVP)

Loglanacak / izlenecekler:
- live_subscribe_company_success
- live_subscribe_company_denied
- company_switch_live_resubscribe
- token_refresh_for_company_context
- access_mirror_revoke_event
- access_mirror_write_amplification_warning
- company_live_access_flag_toggle
- stale_location_count (UI/ops metric)

Alanlar:
- actorUid
- activeCompanyId
- role
- sourceScreen
- requestId/sessionId

Not:
- routeReaders grant lifecycle eventleri MVP'de yoktur

## 10. Failure / Fallback Davranisi

Senaryo: RTDB read deny veya token stale/mirror revoke.

UI davranisi:
- snapshot/list data (Firestore/projection) goster
- live unavailable banner goster
- nedeni semantik olarak ayir:
  - `location_stale/offline_assumed` (veri tazeligi)
  - `session_refresh_required/access_denied` (yetki/oturum)
- re-auth / company refresh CTA sun
- tam ekran crash yerine degraded mode kullan

## 11. Guvenlik Notlari

- Company-level read access coarse bir modeldir; route-level gizlilik gereksinimi olan musteri icin yeterli olmayabilir
- MVP kapsaminda kabul edilir, pilot review'da tekrar degerlendirilir
- PII tasima RTDB pathlerinde minimum tutulur (gereksiz isim/telefon alanlari yok)
- Claims-only auth yerine mirror+claims kullanmak revoke riskini azaltir ama tum enterprise revoke garanti gereksinimlerini karsilamayabilir

## 12. Fazlama

MVP (Faz 4'e kadar):
- company-level RTDB live access
- claims + RTDB access mirror coarse gate
- degraded mode + telemetry

Pilot review (Faz 6):
- granularity ihtiyaci var mi?
- routeReaders/tripReaders gerekli mi?
- revoke latency olculeri kabul edilebilir mi?

Post-pilot (gerekiyorsa):
- route/trip scoped grants
- lifecycle + revoke semantics
- cleanup/TTL stratejisi

## 13. Test Gereksinimleri (MVP)

- RTDB rule allow (same company, mirror active)
- RTDB rule deny (cross-company)
- mirror revoke -> live read deny test
- activeCompanyId switch -> resubscribe smoke test
- stale token / no refresh -> deny + UI fallback test
- membership revoke -> mirror update + next RTDB event deny davranisi
- degraded mode UI smoke test

## 14. Open Technical Notes (post-pilot)

- route/trip scoped grants geri acilacaksa yeni ADR/spec gerekir
- claims schema (single active vs multi membership summary) buyume noktasinda tekrar gozden gecirilecek
- access mirror write pipeline (Firestore membership -> RTDB projection) implementasyonu sade tutulmali

## 15. Referanslar

- `21_live_ops_read_model_adr.md`
- `55_adr_007_mvp_read_model_simplification_and_projection_triggers.md`
- `54_adr_006_company_of_one_tenant_standardization.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
- `72_mobile_offline_stale_location_tolerance_plan.md`
- `71_mobile_force_update_and_client_version_enforcement_plan.md`
