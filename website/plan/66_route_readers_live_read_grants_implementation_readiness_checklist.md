# Live Ops RTDB Access (Company-Level MVP) Implementation Readiness Checklist

Tarih: 2026-02-24
Durum: Pre-implementation checklist (59 icin execution bridge)

## 1. Amac

`59_route_readers_lifecycle_live_read_grants_technical_spec.md` dokumanini kodlama oncesi teknik bariyer checklistine cevirmek.

Not:
- MVP defaultu routeReaders TTL/grant lifecycle degil
- MVP defaultu company-level RTDB live access

## 2. Baslangic Kriterleri (Start Gate)

- [ ] Company-level RTDB path shape karari alindi (`company_live_ops/{companyId}/...`)
- [ ] RTDB rules mevcut pathleri yeniden dogrulandi
- [ ] Claims strategy (`activeCompanyId`, role seti) dokumante edildi
- [ ] RTDB access mirror path/shape karari alindi (`live_access_mirrors/{companyId}/{uid}`)
- [ ] Company-level live access flag path'i (opsiyonel optimizasyon) karari alindi (`live_access_company_flags/{companyId}/isActive`)
- [ ] Live ops UI'nin degraded mode davranisi kabul edildi

## 3. Data Shape Checklist (Company Live Ops)

- [ ] `vehicles/{vehicleId}` path payload alanlari net
- [ ] `sourceTimestamp` / `serverTimestamp` semantigi net
- [ ] `tripId` / `routeId` opsiyonel alan kurallari net
- [ ] PII minimum alan prensibi kontrol edildi
- [ ] Stale-state hesaplamasi icin gerekli alanlar mevcut

## 4. Rules + Claims + Access Mirror Checklist

- [ ] RTDB read rule same-company allow mantigi tanimli
- [ ] Cross-company deny senaryosu yazildi
- [ ] RTDB rule icinde access mirror kontrolu tanimli
- [ ] Company suspension icin fan-out yerine company-level kill-switch rule opsiyonu degerlendirildi
- [ ] `activeCompanyId` claim refresh akisi notlandi
- [ ] Membership/role revoke -> mirror update pipeline notu var
- [ ] Kritik revoke icin refresh token revoke akisi notu var
- [ ] Mirror sync failure alert/metric (`access_mirror_sync_failed`) tanimli
- [ ] Mirror reconcile job notu var (drift kontrolu)
- [ ] Max session refresh/re-auth failsafe kurali notlu (kritik live ops ekranlari)
- [ ] Token stale durumunda UI fallback kurali yazildi
- [ ] Claims'in coarse gate oldugu, server-side mutasyon authz'nin ayrica oldugu dokumante edildi

## 5. Company Switch / Subscription Checklist

- [ ] Company switch -> token refresh/re-auth davranisi net
- [ ] Eski company subscription unsubscribe kurali checklistte var
- [ ] Yeni company subscribe success/fail UX state'leri tanimli
- [ ] Multi-tab/session edge-case notu dusuldu (MVP kabul/sinir)

## 6. UI / UX Checklist (Live Ops)

- [ ] RTDB deny/stale token durumunda degraded mode state tasarlandi
- [ ] Retry CTA davranisi tanimli
- [ ] "Live unavailable" mesaj dili user-safe
- [ ] Stale/offline state semantigi `72` ile uyumlu
- [ ] Yetki/oturum kaynakli deny state ile `stale location` UI semantigi ayrik

## 7. Test Minimum Paketi

- [ ] RTDB allow (same company) test
- [ ] RTDB deny (cross-company) test
- [ ] mirror revoke -> read deny test
- [ ] activeCompanyId switch -> resubscribe smoke test
- [ ] stale token -> deny + UI fallback test
- [ ] membership revoke -> mirror update + deny davranisi test
- [ ] company suspension -> company-level kill-switch deny testi (opsiyonel optimizasyon varsa)
- [ ] mirror sync fail -> alert + reconcile senaryosu smoke test
- [ ] degraded mode UI smoke test

## 8. Observability Checklist

- [ ] `live_subscribe_company_success` metric/log tanimli
- [ ] `live_subscribe_company_denied` metric/log tanimli
- [ ] `company_switch_live_resubscribe` event tanimli
- [ ] `access_mirror_revoke_event` log/metric tanimli
- [ ] `access_mirror_sync_failed` log/metric tanimli
- [ ] `company_live_access_flag_toggle` log/metric tanimli (opsiyonel optimizasyon varsa)
- [ ] Stale location metriği `72` ile uyumlu tanimli

## 9. Post-Pilot Granular Grants (routeReaders) Re-entry Gate

Simdi implement etme. Sadece tetik/karar hazirligi:
- [ ] Hangi musteri/contract route-level live access istiyor?
- [ ] Company-level stream maliyet/perf sorunu var mi?
- [ ] Yeni ADR acma kriterleri tanimli

## 10. Referanslar

- `59_route_readers_lifecycle_live_read_grants_technical_spec.md`
- `21_live_ops_read_model_adr.md`
- `55_adr_007_mvp_read_model_simplification_and_projection_triggers.md`
- `72_mobile_offline_stale_location_tolerance_plan.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
