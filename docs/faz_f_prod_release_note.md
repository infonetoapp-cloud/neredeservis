# Faz F - Functions Prod Release Note (Hazirlik)

Tarih: 2026-02-18
Durum: Prod onay bekliyor
Surum Kapsami: Faz F / STEP-253 ... STEP-275

## Ozet
- Functions katmani transaction/idempotency/dedupe altyapisi ile sertlestirildi.
- Emulator test paketi tam gecti (`25/25`).
- Staging deploy tamamlandi ve smoke test green.
- Prod deploy henuz yapilmadi; kullanici onayi (STEP-277) bekleniyor.

## Dahil Edilen Teknik Degisiklikler
- Transaction helper katmani eklendi.
- Idempotency repository eklendi.
- Notification dedupe/outbox mekanizmasi eklendi.
- Driver snapshot phone masking uygulandi.
- Guest session TTL enforcement scheduler eklendi.
- Skip request retention ve tek-gun/tek-kayit kurali netlestirildi.
- Callable race/idempotency davranislari testle guvenceye alindi.
- RTDB heartbeat trigger stale replay filtresi dogrulandi.
- Announcement dedupe + cooldown + cihaz politikasi testleri eklendi.
- Subscription tamper (server-side premium guard) testleri eklendi.
- RTDB trigger bolge uyumsuzlugu giderildi:
  - `syncTripHeartbeatFromLocation` -> `europe-west1` (RTDB instance lokasyonu ile uyumlu).

## Staging Kaniti
- Dry-run: `firebase deploy --only functions --project stg --dry-run` -> basarili.
- Deploy: `firebase deploy --only functions --project stg` -> basarili.
- Smoke:
  - `firebase functions:list --project stg --json` -> tum function'lar `ACTIVE`.
  - `healthCheck` callable canli cagrisi -> `ok=true` (2026-02-18T20:34:02.005Z).

## Bilinen Uyarilar
- Node.js 20 runtime lifecycle uyarisi:
  - deprecation: 2026-04-30
  - decommission: 2026-10-30
- `firebase-functions` paketinin guncellenmesi oneriliyor (breaking degisiklik notu var).

## Risk Degerlendirmesi
- Dusuk/Orta:
  - Prod deploy oncesi runtime/paket upgrade yapilmadigi icin ileri tarihli teknik borc var.
  - RTDB trigger region ayrik (europe-west1) tasarimi bilerek secildi; monitoring izlenmeli.

## Rollback Plani (Prod)
1. Gerekirse hemen onceki stable commit'e don.
2. `firebase deploy --only functions --project prod` ile rollback deploy uygula.
3. `healthCheck` + temel callable kontrolleriyle dogrula.
4. Incident notunu `docs/proje_uygulama_iz_kaydi.md` dosyasina append et.

## Prod Gate Checklist
- [x] Build/Lint/Format green
- [x] Emulator unit/integration green (`25/25`)
- [x] Staging deploy green
- [x] Staging smoke green
- [ ] Prod deploy onayi (STEP-277)
- [ ] Prod deploy (STEP-278)
- [ ] Post-deploy health check (STEP-279)
