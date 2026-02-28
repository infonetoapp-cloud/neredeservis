# ADR-009: Map Standardization Trigger + ETA Consistency Strategy (MVP-Cut Revision)

Tarih: 2026-02-24
Durum: Accepted (MVP simplification applied after critique)

## 1. Problem

Web tarafinda Mapbox, mobil tarafta Google Maps kullanimi kisa vadede maliyet avantajli olabilir; ancak:
- rota geometrisi
- snap-to-road davranisi
- ETA hesaplari
- adres metni farklari
operasyonel uyusmazlik yaratabilir.

Ilk versiyon plani backendi route/ETA icin hemen canonical SSOT yapmaya cok yakindi. Bu, solo-founder MVP icin teslim hizini dusurur.

## 2. Karar (revize)

MVP'de hibrit saglayici kabul edilir.

MVP'de:
- web panel canli koordinati oldugu gibi gosterir
- provider farklari "known limitation" olarak kabul edilir
- mismatch telemetry toplanir

Backend canonical route/ETA standardization:
- tamamen iptal edilmedi
- pilot sonrasi tetik/esik tabanli karar olarak korunur

## 3. MVP Uygulama Kurali (pragmatik)

1. Web map rendering = Mapbox (cost-optimized)
2. Mobil mevcut harita rendering (Google) korunabilir
3. Canli operasyon ekraninda ana dogruluk kaynagi = driverdan gelen koordinat + timestamp
4. Web ETA/rota preview hesaplari UI yardimcisi olarak sunulur; mutlak operasyon gercegi olarak iddia edilmez
5. Mismatch nedeniyle operasyon tartismasi cikarsa olay support/incident olarak etiketlenir

## 4. MVP Sonrasi Hedef (korunan vizyon)

Pilot verisi yeterli olursa su hedef tekrar acilir:
- backend canonical route geometry
- backend ETA hesaplari
- web/mobil ortak route preview snapshots
- standardization (tek provider / ortak engine / backend-first route logic)

Bu hedef "default implementasyon" degil, "triggered investment"tir.

## 5. Olculecek Sapma Metrikleri (Trigger Inputs)

Pilot oncesi ve pilot sirasinda takip edilecek:
- `eta_delta_seconds` (web vs mobil gorunum / kullanici raporu)
- `route_geometry_mismatch_incident_count`
- operator-reported route mismatch incident count
- driver/operator dispute count (eta/route kaynakli)
- `map_mismatch_support_minutes` (support yuk maliyeti)

## 6. Standardization Trigger (karar tetigi)

Asagidaki kosullardan biri saglanirsa backend canonical route/ETA + provider standardization isi Faz 6+ backlogunda yukseltilir:

1. 30 gunluk periyotta route/ETA mismatch incidentleri kabul esigini asar
2. Pilot firmada operasyonel tartisma kayitlari kritik seviyeye gelir
3. Support yukunde route/ETA mismatch ilk 5 issue kategorisine girer
4. Satisa/yenilemeye etkileyen musteri guven sorunu olusur

## 7. Adres / Geocoding Notu

Adres metin farklari operasyonel display tutarsizligi yaratabilir.

Kural:
- resmi operasyon ekranlarinda canonical stored address label kullan
- provider response texti source-of-truth yapma
- rota olusturma/aninda secilen adres label veritabanina immutable/canonical display alanı olarak yazilabilir
- mobil/web istemci kendi reverse-geocoding metnini canonical label yerine UI'da override etmez (ops display tutarliligi)

## 8. MVP'den Bilincli Ertelenenler

- backend canonical polyline zorunlulugu
- web/mobil ortak ETA engine
- route mismatch auto-detection/auto-reconciliation
- provider standardization migration

## 9. Etkilenen Dokumanlar

- `03_map_cost_strategy.md`
- `32_observability_and_cost_control_plan.md`
- `33_release_and_pilot_runbook_web.md`
- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`

## 10. Review Zamani

- Faz 5 pilot readiness review (telemetry hazir mi?)
- Faz 6 pilot midpoint review (triggerler asiliyor mu?)
- Faz 6 pilot closeout review (standardization investment acilsin mi?)
