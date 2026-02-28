# Route/Trip Behavior + Schedule (MVP-Cut) Implementation Readiness Checklist

Tarih: 2026-02-24
Durum: Pre-implementation checklist (62 icin execution bridge)

## 1. Amac

`62_route_trip_versioning_recurrence_timezone_dst_and_concurrent_editing_spec.md` dokumanini Faz 4 oncesi implementasyon checklistine cevirmek.

Not:
- MVP'de full publish/versioning yok
- MVP'de minimum koruma + timezone/recurrence temeli var

## 2. Baslangic Kriterleri (Start Gate)

- [ ] MVP route/trip davranis semantigi kabul edildi (mutable route + trip snapshot)
- [ ] Active trip varken route edit warning kuralı kabul edildi
- [ ] Tenant timezone default kuralı net (`Europe/Istanbul` + override)
- [ ] Minimal conflict guard yaklaşımı onaylandi (`lastKnownUpdateToken`/Firestore `updateTime` esdegeri, server-side enforced)

## 3. Trip Snapshot Checklist (MVP zorunlu)

- [ ] Trip start aninda snapshotlanacak alanlar listesi net
- [ ] Snapshot payload vs hash/reference karari net
- [ ] Audit/event kaydi semantigi yazildi
- [ ] Eski tripler icin migration davranisi notlandi

## 4. Route Edit During Active Trip Checklist (MVP)

- [ ] UI warning banner metni tanimli
- [ ] Hard block olmadan devam etme davranisi kabul edildi
- [ ] Aktif seferde hangi route mutasyonlarinin "metadata-safe" oldugu listelendi
- [ ] Aktif seferde stop delete/reorder soft-lock server-side deny kurali net
- [ ] Audit event (`route_edited_while_active_trip_exists`) tanimli
- [ ] Dispatcher UX notu (sorumluluk/uyari) yazildi

## 5. Minimal Conflict Guard Checklist (server-side enforced)

- [ ] Hangi endpointlerde `lastKnownUpdateToken` kullanilacagi listelendi
- [ ] Backend transaction/precondition enforcement yaklaşımı net
- [ ] Firestore `updateTime`/version token normalizasyonu (request/response) net
- [ ] Conflict error response envelope standardi net (`code=conflict`)
- [ ] UI refresh/retry davranisi tanimli
- [ ] Silent overwrite riskinin MVP kabul siniri dokumante edildi

## 6. Recurrence / Timezone / DST Checklist

- [ ] Schedule alan listesi freeze (`daysOfWeek`, `startLocalTime`, `timezone`, `effectiveFrom/To`)
- [ ] Tekrarlı schedule local semantik + runtime UTC hesap kuralı dokumante edildi
- [ ] Gerceklesen olay timestamp'leri icin UTC storage / local display kuralı dokumante edildi
- [ ] DST policy temel notu yazildi
- [ ] Post-pilot `holidayPolicy` / `exceptionDates` backlog notu dusuldu

## 7. Test Minimum Paketi

- [ ] Trip start -> snapshot capture test
- [ ] Active trip exists + route edit warning/audit test
- [ ] Active trip exists + stop delete/reorder deny test
- [ ] Minimal conflict response test
- [ ] Timezone conversion test
- [ ] DST boundary smoke test (temel)

## 8. Post-Pilot Full Versioning Re-entry Gate

Simdi implement etme. Sadece tetik/karar hazirligi:
- [ ] Pilotta route edit kaynakli incident sayisi izleniyor
- [ ] "hangi rota ile sefer yapildi" tartismasi metrikleniyor
- [ ] Full versioning ADR acma kriterleri tanimli

## 9. Referanslar

- `62_route_trip_versioning_recurrence_timezone_dst_and_concurrent_editing_spec.md`
- `42_p0_endpoint_contracts_v1_draft.md`
- `48_p0_endpoint_implementation_order_freeze.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
