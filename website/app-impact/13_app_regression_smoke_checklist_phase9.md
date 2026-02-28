# App Regression Smoke Checklist (Phase 9 Cutover)

Tarih: 2026-02-28
Durum: Active (Quality Closure Verified)

## 1) Company Context Smoke

- [x] Login sonrasi company context dogru seciliyor.
- [x] Mode switch sonrasi active company bozulmadan korunuyor.
- [x] Logout/login dongusunde stale company secimi otomatik temizleniyor.

## 2) Route/Stop Mutation Smoke

- [x] Route create/update parser crash-free.
- [x] Stop add/delete/reorder conflict senaryosu (`UPDATE_TOKEN_MISMATCH`) dogru yakalaniyor.
- [x] Active trip soft-lock reason-code (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`) dogru gosteriliyor.

## 3) Live Ops Smoke

- [x] RTDB stream varken `live.source=rtdb` davranisi dogru.
- [x] RTDB stream error/mismatch durumunda `trip_doc` fallback devreye giriyor.
- [x] stale/offline copy semantigi web ile tutarli.

## 4) Membership/Permission Smoke

- [x] invite accept/decline parser sonucu role-state tutarli.
- [x] member remove guard (`OWNER_MEMBER_IMMUTABLE`, `SELF_MEMBER_REMOVE_FORBIDDEN`) dogru mesajlaniyor.
- [x] route permission grant/revoke/list parser ciktilari tutarli.

## 5) Force Update / Cutoff Smoke

- [x] 426 `Upgrade Required` UI fallback mesaji dogru.
- [x] Legacy write-path reject senaryosunda app akisi kilitlenmeden recover ediyor.

## 6) Not

- Bu checklist "hazirlik" maddesi olarak acildi.
- Tum satirlar PASS olmadan final cutover onayi verilmez.
- Kapanis kaniti: `test/features/company/data/company_contract_parser_smoke_test.dart` + `test/features/company/application/company_phase9_acceptance_smoke_test.dart` + route mutation feedback testleri.

## 7) Phase 11 Quality Closure (2026-02-28)

- [x] App deprecation temizligi tamamlandi (`withOpacity`, dropdown `value` deprecationsi).
- [x] `flutter analyze` temiz: `No issues found`.
- [x] Regression odakli hedef testler PASS:
  - `test/features/driver/application/compose_driver_trip_completed_bootstrap_use_case_test.dart`
  - `test/features/driver/application/compose_driver_trip_history_item_seeds_use_case_test.dart`
  - `test/features/passenger/application/compose_passenger_trip_history_item_seeds_use_case_test.dart`
  - `test/ui/route_update_screen_test.dart`
