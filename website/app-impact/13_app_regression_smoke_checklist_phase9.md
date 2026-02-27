# App Regression Smoke Checklist (Phase 9 Cutover)

Tarih: 2026-02-27
Durum: Active

## 1) Company Context Smoke

- [ ] Login sonrasi company context dogru seciliyor.
- [ ] Mode switch sonrasi active company bozulmadan korunuyor.
- [ ] Logout/login dongusunde stale company secimi otomatik temizleniyor.

## 2) Route/Stop Mutation Smoke

- [ ] Route create/update parser crash-free.
- [ ] Stop add/delete/reorder conflict senaryosu (`UPDATE_TOKEN_MISMATCH`) dogru yakalaniyor.
- [ ] Active trip soft-lock reason-code (`ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`) dogru gosteriliyor.

## 3) Live Ops Smoke

- [ ] RTDB stream varken `live.source=rtdb` davranisi dogru.
- [ ] RTDB stream error/mismatch durumunda `trip_doc` fallback devreye giriyor.
- [ ] stale/offline copy semantigi web ile tutarli.

## 4) Membership/Permission Smoke

- [ ] invite accept/decline parser sonucu role-state tutarli.
- [ ] member remove guard (`OWNER_MEMBER_IMMUTABLE`, `SELF_MEMBER_REMOVE_FORBIDDEN`) dogru mesajlaniyor.
- [ ] route permission grant/revoke/list parser ciktilari tutarli.

## 5) Force Update / Cutoff Smoke

- [ ] 426 `Upgrade Required` UI fallback mesaji dogru.
- [ ] Legacy write-path reject senaryosunda app akisi kilitlenmeden recover ediyor.

## 6) Not

- Bu checklist "hazirlik" maddesi olarak acildi.
- Tum satirlar PASS olmadan final cutover onayi verilmez.
