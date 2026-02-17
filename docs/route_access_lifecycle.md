# Route Access Lifecycle (memberIds + routeWriters)

Tarih: 2026-02-17  
Kapsam: Runbook STEP-072

## Amac
- `memberIds` (Firestore) ve `routeWriters` (RTDB) yasam dongusunu tek yerde tanimlamak.
- Grant/revoke/ttl kurallarini netlestirmek.

## Sozlesme Ozeti

### 1) `memberIds` (Firestore, `routes/{routeId}`)
- Kaynak: server-side callable/functions.
- Client direct write: yasak.
- Hesaplama:
  - `memberIds = [driverId] U authorizedDriverIds U passengerIds`
- Guncelleyen akislar:
  - `createRoute`
  - `joinRouteBySrvCode`
  - `leaveRoute`
  - `updateRoute` (authorized driver degisikligi)
  - `syncRouteMembership` (scheduled reconciliation)

### 2) `routeReaders` (RTDB)
- Path: `/routeReaders/{routeId}/{uid} = true|false`
- Amac: canli konum okuma yetkisi.
- Server tarafinda `memberIds` ile senkron tutulur.
- Guest okuyucular `guestReaders` altinda ayri tutulur.

### 3) `routeWriters` (RTDB)
- Path: `/routeWriters/{routeId}/{uid} = true|false`
- Amac: canli konuma yazma yetkisi.
- Kural: yalniz aktif trip soforu yazabilir.
- Grant:
  - `startTrip` basarili oldugunda ilgili sofor icin `true`.
- Revoke:
  - `finishTrip` (completed/abandoned) sonrasinda `false` veya node silme.
  - `abandonedTripGuard` sonlandirma akisi.
  - `activeDeviceToken` degisimi kaynakli zorunlu cihaz devri.

## TTL ve Temizlik Kurali
- `routeWriters` stale kalirsa eski sofor yazma riski olusur.
- Bu nedenle `cleanupStaleRouteWriters` (scheduled function) zorunlu:
  - Periyot: 5 dk
  - Kontrol:
    - aktif trip yoksa writer sil
    - writer uid route driver/authorized driver setinde degilse sil
    - stale writer lease suresi asildiyse sil
- Temizlik islemi idempotent olmalidir.

## Race ve Tutarlilik
- `startTrip` / `finishTrip` transaction + `expectedTransitionVersion` zorunlu.
- Writer grant/revoke, trip state ile ayni request flow'unda yapilir.
- Terminal state tekrar cagrilarinda no-op + idempotency sonucu dondurulur.

## Gozlenebilirlik
- Her grant/revoke islemi structured log ile kaydedilir:
  - `routeId`
  - `tripId`
  - `uid`
  - `action=grant|revoke|cleanup_revoke`
  - `reason`

## Done Kriteri
- Rules testleri:
  - stale writer denial
  - member olmayan kullanici read denial
- Scheduled cleanup smoke:
  - stale writer'lar temizleniyor
  - aktif writer etkilenmiyor
