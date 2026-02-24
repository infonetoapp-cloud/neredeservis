# Migration + Backward Compatibility + Bulk Import Implementation Readiness Checklist (MVP-Cut)

Tarih: 2026-02-24
Durum: Pre-implementation checklist (58 icin execution bridge)

## 1. Amac

`58_mobile_migration_backward_compatibility_and_bulk_import_plan.md` dokumanini kodlama oncesi uygulanabilir kontrol listesine cevirmek.

## 2. Baslangic Kriterleri (Start Gate)

Asagidakiler olmadan implementasyona girme:
- [ ] ADR-006 (`Company of 1`) kabul ve etkileri anlasildi
- [ ] ADR-008 (vehicle company-scoped) kabul ve migration etkisi notlandi
- [ ] Legacy API / yeni API adlandirma stratejisi secildi (`v1/v2` veya callable naming)
- [ ] `71` Force Update plani kabul edildi
- [ ] Pilot oncesi onboarding modeli `white-glove` olarak onaylandi

## 3. Migration Discovery Checklist

- [ ] Mevcut koleksiyonlarda company context gerektiren varliklar listelendi
- [ ] Legacy endpoint listesi cikarildi (write mutasyonlari oncelikli)
- [ ] Hangi mobil versiyonlar aktif (yaklasik) not edildi
- [ ] Data migration riskleri (duplicate/incomplete/orphan records) listelendi
- [ ] Backfill icin dry-run strategy yazildi

## 4. Company-of-1 Backfill Checklist

- [ ] `individual_operator` company schema final alanlari net
- [ ] Existing bireysel driver -> company-of-1 create rule tanimli
- [ ] Membership create rule (`owner`) tanimli
- [ ] Idempotent backfill command tasarlandi
- [ ] Backfill log/audit formati tanimli
- [ ] Dev ortaminda sample dry-run yapildi
- [ ] Stg rehearsal icin sample dataset hazirlandi

## 5. Compatibility Layer Checklist (dar kapsam, sunset-first)

- [ ] Legacy payload -> new command mapping subset'i yazildi (yalniz desteklenecek kritik mutasyonlar)
- [ ] Hangi legacy endpointlerin "read-only (write=426)" moduna alinacagi listelendi
- [ ] Default company context resolution kurali yazildi
- [ ] Unsupported legacy mutasyonlar icin deny/error codes tanimli
- [ ] Deprecation logging alanlari belirlendi (endpoint, client version, uid, requestId)
- [ ] Compatibility path test senaryolari listelendi
- [ ] Compatibility layer sunset tarihleri taslakta yazildi (write path icin kesin cutoff)

## 6. Force Update + Cutoff Checklist (kritik)

- [ ] Remote Config `min_warn_version` / `min_required_version` anahtarlari tanimlandi
- [ ] Server-side `min_supported_client_version` kontrol tasarlandi
- [ ] Legacy endpoint bazli deprecation/warning/shutdown takvimi yazildi
- [ ] `426 Upgrade Required` (veya structured esdeger) response davranisi standardi yazildi
- [ ] Force Update ekran UX akisi planlandi
- [ ] Aktif sefer/kritik operasyon aninda cutoff davranisi (trip-finish safe window varsa) yazildi
- [ ] Store deep-linkler hazir
- [ ] Cutoff rehearsal senaryosu (stg) planlandi
- [ ] Aggressive cutoff extension policy (max uzatma penceresi) yazildi

## 7. White-Glove Import Operations Checklist (MVP/Pilot)

### 7.1 Product/Onboarding
- [ ] Musteriye verilecek CSV/XLSX template formatlari hazir
- [ ] Onboarding veri talep checklisti hazir (zorunlu alanlar)
- [ ] Import sonucu geri bildirim formatı hazir (basarili/hatali satir ozeti)

### 7.2 Internal Scripts/Backend
- [ ] `drivers` import scripti (idempotent) hazir
- [ ] `vehicles` import scripti (idempotent) hazir
- [ ] `stops/routes` icin manuel/scripting yolu notlandi
- [ ] Duplicate kurallari (email/plate vs) dokumante edildi
- [ ] Dry-run / validate-only script modu (minimum) var veya planlandi

### 7.3 Operasyon
- [ ] Pilot firma icin sample import rehearsal yapildi
- [ ] Hata senaryosu (bozuk format) ic support SOP yazildi
- [ ] Import batch audit kayit formatı tanimli (`source file`, `script version`, `operator`)

## 8. Self-Serve Bulk Import UI (post-pilot backlog gate)

Implementasyona simdi girme. Sadece backlog readiness:
- [ ] Trigger kriterleri tanimli (5+ musteri / onboarding darboğazi / support suresi)
- [ ] Faz 6+ backlog itemlari olusturuldu

## 9. Test Minimum Paketi (implementation oncesi planlanmis olmali)

- [ ] Company-of-1 backfill idempotency test
- [ ] Legacy/new parallel mutation smoke test
- [ ] Compatibility deny-path test
- [ ] Force update cutoff rehearsal test (client + server)
- [ ] White-glove import script happy path test
- [ ] Malformed row / duplicate test

## 10. Fazlama Notu (revize)

- Faz 3-4: migration groundwork + compatibility telemetry + force update groundwork
- Faz 5: rehearsal + cutoff draft + pilot import runbooks
- Faz 6 oncesi: white-glove onboarding pilot-ready
- Faz 6+ (ihtiyaca gore): self-serve Bulk Import UI

## 11. Referanslar

- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `71_mobile_force_update_and_client_version_enforcement_plan.md`
- `54_adr_006_company_of_one_tenant_standardization.md`
- `56_adr_008_vehicle_collection_security_revision.md`
