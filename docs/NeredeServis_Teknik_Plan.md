# NeredeServis - Teknik Uygulama Plani (v2.4)

**Durum:** Locked Draft (Security + Sync Hardened)  
**Tarih:** 16 Subat 2026  
**Hedef:** V1.0'i 30 gun icinde guvenli, tutarli ve operasyona hazir sekilde canliya almak

---

## 0) Kapsam ve Basari Tanimi

Bu dokuman V1.0 teknik kaynak dokumanidir. Urun stratejisiyle hizali, belirsizliksiz ve testlenebilir kurallari icerir.

### V1.0 kapsaminda olanlar
- Sofor + Yolcu mobil uygulamasi
- Firestore + RTDB + Cloud Functions Gen2 altyapisi
- SRV/QR ile katilim
- Misafir takip modu (anonim auth + TTL guest session)
- Guest -> kayitli hesap gecisinde lokal veri sahiplik transferi (Drift owner migration, veri kaybi yok)
- Coklu guzergah kaydi
- Ghost Drive rota olusturma modu (iz kaydet -> rota/durak adayi cikarimi)
- Ghost Drive kalite hatti (sanitize + DP + Map Matching post-process)
- Bugun Binmiyorum akisi
- Sofor duyuru + WhatsApp share koprusu
- ETA (Mapbox Directions + fallback)
- Offline location queue + offline trip action queue
- Terminated app senaryosunda periyodik queue flush (Android WorkManager / iOS BGTask)
- Sofor aktif seferde sade harita + Driver Guidance Lite + Connection Heartbeat
- Heartbeat red state periferik alarm (kirmizi flash cerceve + ayri haptic pattern)
- Heartbeat durumlari icin sesli geri bildirim (ac/kapa)
- Gec baslama icin delay inference karti (`scheduled + 10 dk`, aktif trip yok)
- `Seferi Bitir` yikici aksiyon korumasi (`slide` veya `uzun bas`, tek-tap yok)
- Sync truth UI (`pending_sync`, `synced`, `failed`) + kritik aksiyonlarda kapanis korumasi
- Yolcu `Sanal Durak` (virtual stop) secimi + ETA kisisellestirme
- `Sorun Bildir` / `Shake to Report` tanilama paketi
- Paywall UI + subscription state mock/read-only (production billing kapali)
- KVKK riza, retention, veri silme

### V1.0 kapsaminda olmayanlar
- Sirket web paneli UI (V1.2)
- RevenueCat production monetization acilisi (V1.1)
- Trafik tahmini tabanli ileri ETA modeli (V1.2)
- iOS App Clip + Android Instant App dagitimi (V1.1 kesif + POC)

### SLO / SLI hedefleri
- Crash-free session: `>= 99.5%`
- Aktif seferde konum tazeligi: noktalarin `%90'i <= 15 sn`
- Push teslimat basarisi: `>= 95%`
- Kritik incident ilk yanit: `< 30 dk`

### Risk
- Scope kaymasi nedeniyle 30 gun hedefinin kacirilmasi.

### Onlem
- P0/P1/P2 backlog ve haftalik scope freeze.

### Done kriteri
- V1.0 P0 checklist maddelerinin tamami production benzeri testte green.

---

## 1) Mimari Kararlar

### 1.1 Stack
- Flutter lock: `3.24.5` (FVM ile sabitlenmis, `docs/flutter_lock.md` referansi zorunlu)
- Flutter + Riverpod + GoRouter
- Firebase Auth, Firestore, RTDB, Functions Gen2, FCM
- Drift (offline queue)
- Mapbox (harita + ETA API)
- Arka plan gorevleri: Android WorkManager + iOS BGTask/BackgroundFetch
- In-app billing: App Store IAP + Google Play Billing Library `6.x` uyumlu plugin seti

### 1.2 Veri dagilimi
- Firestore: yapisal veri, state, yetki baglantilari
- RTDB: canli konum noktasi
- Functions: server-authoritative write path

### 1.3 Ortamlar
- `dev`, `staging`, `prod` ayri Firebase projeleri
- Build flavor zorunlu (`applicationId`/`bundleId` suffix)
- Debug App Check token yalnizca dev/staging

### 1.4 Kimlik ve yetki kaynagi
- Role source of truth: `users/{uid}.role`
- Rol degerleri: `driver | passenger | guest`
- Callable endpointler role'i server tarafinda `users` dokumanindan okur
- Client tarafi role claim'ine tek basina guvenmez

### 1.5 Region standardi
- Functions/RTDB/Storage: `europe-west3`
- Firestore: `europe-west3`
- Tum ortamlarda ayni region kullanilir

### 1.6 Zaman standardi
- Tum server timestamp alanlari UTC saklanir.
- `scheduledTime` ve `notificationTime` alanlari `Europe/Istanbul` timezone'unda `HH:mm` olarak yorumlanir.
- Schedule function karsilastirmalari UTC degil, Istanbul timezone hesaplamasi ile yapilir.

### 1.7 Firebase platform governance
- Firebase platformunun uzun omurlu kurulum standardi `docs/firebase_platform_blueprint.md` dokumaninda tutulur.
- Proje naming, IAM, budget, backup, App Check ve secret yonetimi kararlarinda bu blueprint esas alinir.
- Blueprint ile runbook/teknik plan arasinda celiski varsa:
  - runtime davranis kurallari icin Teknik Plan kazanir
  - platform operasyon detaylarinda blueprint kazanir
- `dev/staging/prod` ortamlarinda service account key dosyasi yerine keyless deploy modeli (WIF) tercih edilir.

### Risk
- Ortam/region karisikliklari ve data governance riski.

### Onlem
- CI release gate: env guard + region assertion.

### Done kriteri
- Deploy scriptleri dev/staging/prod ayrimini ve region kontrolunu zorunlu kiliyor olmali.

---

## 2) Veri Sozlesmesi (Single Source of Truth)

## 2.1 Firestore koleksiyonlari

### `users/{uid}` (role authority)
- `role: "driver" | "passenger" | "guest"`
- `displayName: string`
- `phone: string | null`
- `email: string | null`
- `createdAt: Timestamp` (server)
- `updatedAt: Timestamp` (server)
- `deletedAt: Timestamp | null` (server)

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var (`bootstrapUserProfile`, `updateUserProfile`)

### `driver_directory/{driverId}` (masked lookup)
- `displayName: string`
- `plateMasked: string`
- `searchPhoneHash: string`
- `searchPlateHash: string`
- `isActive: bool`

Yazim yetkisi:
- Client: yok
- Server: var

Not:
- Ikame sofor ekleme akisinda tam telefon/plaka yerine directory kullanilir.

### `drivers/{driverId}`
- `name: string`
- `phone: string`
- `plate: string`
- `showPhoneToPassengers: bool`
- `companyId: string | null` (server)
- `subscriptionStatus: "trial" | "active" | "expired"` (server)
- `trialStartDate: Timestamp | null` (server)
- `trialEndsAt: Timestamp | null` (server)
- `lastPaywallShownAt: Timestamp | null` (server, rate-limit icin)
- `activeDeviceToken: string | null` (server)
- `createdAt: Timestamp` (server)
- `updatedAt: Timestamp` (server)

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var (`upsertDriverProfile`)

### `routes/{routeId}`
- `name: string`
- `driverId: string`
- `authorizedDriverIds: string[]`
- `memberIds: string[]` (server-managed)
- `companyId: string | null` (server)
- `srvCode: string` (server-generated, unique)
- `visibility: "private"` (V1.0 sabit)
- `allowGuestTracking: bool`
- `creationMode: "manual_pin" | "ghost_drive"` (server)
- `routePolyline: string | null` (encoded polyline, ghost drive/manual simplify sonucu)
- `startPoint: GeoPoint`
- `startAddress: string`
- `endPoint: GeoPoint`
- `endAddress: string`
- `scheduledTime: string` (`HH:mm`)
- `timeSlot: "morning" | "evening" | "midday" | "custom"`
- `isArchived: bool`
- `vacationUntil: Timestamp | null`
- `passengerCount: number` (server-managed)
- `lastTripStartedNotificationAt: Timestamp | null` (server-managed)
- `createdAt: Timestamp` (server)
- `updatedAt: Timestamp` (server)

Turetilen alan kurali:
- `memberIds = [driverId] U authorizedDriverIds U routePassengersIds`
- Hesaplama kaynagi server'dir (`joinRouteBySrvCode`, `leaveRoute`, `updateRoute`, `syncRouteMembership`).

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var

### `routes/{routeId}/stops/{stopId}`
- `name: string`
- `location: GeoPoint`
- `order: number`
- `createdAt: Timestamp` (server)
- `updatedAt: Timestamp` (server)

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var

### `routes/{routeId}/passengers/{passengerId}`
- `name: string`
- `phone: string | null`
- `showPhoneToDriver: bool`
- `boardingArea: string`
- `virtualStop: {lat: number, lng: number} | null`
- `virtualStopLabel: string | null`
- `notificationTime: string` (`HH:mm`)
- `joinedAt: Timestamp` (server)
- `updatedAt: Timestamp` (server)

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var (`joinRouteBySrvCode`, `leaveRoute`, `updatePassengerSettings`)

KVKK kurali:
- `showPhoneToDriver == false` ise `phone == null` tutulur.

### `routes/{routeId}/skip_requests/{skipRequestId}`
- `passengerId: string`
- `dateKey: string` (`YYYY-MM-DD`)
- `status: "skip_today"`
- `createdAt: Timestamp` (server)

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var (`submitSkipToday`)

### `support_reports/{reportId}` (opsiyonel ama onerilen)
- `uid: string`
- `role: "driver" | "passenger" | "guest"`
- `routeId: string | null`
- `tripId: string | null`
- `trigger: "manual" | "shake"`
- `note: string | null`
- `last5mLogSummary: object`
- `diagnostics: {permissionState, networkType, batteryLevel, queueDepth, appState}`
- `createdAt: Timestamp` (server)

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var (`createSupportReport`)

Gizlilik kurali:
- PII redaction zorunlu (ham telefon/e-posta/mesaj icerigi tutulmaz).

### `trips/{tripId}`
- `routeId: string`
- `driverId: string`
- `driverSnapshot: {name, plate, phone: string | null}`
- `status: "active" | "completed" | "abandoned"`
- `startedAt: Timestamp`
- `endedAt: Timestamp | null`
- `lastLocationAt: Timestamp`
- `endReason: "driver_finished" | "auto_abandoned" | null`
- `startedByDeviceId: string`
- `transitionVersion: number`
- `updatedAt: Timestamp`

Yazim yetkisi:
- Client direct write: yok
- Callable/scheduled functions: var

Gizlilik kurali:
- `driverSnapshot.phone`, `showPhoneToPassengers == false` ise `null` yazilir.

### `trips/{tripId}/location_history/{eventId}`
- `routeId: string`
- `driverId: string`
- `lat: number`
- `lng: number`
- `accuracy: number`
- `speed: number | null`
- `heading: number | null`
- `sampledAtMs: number` (cihazda olculen zaman)
- `ingestedAt: Timestamp` (server)
- `source: "live" | "offline_replay"`

Yazim yetkisi:
- Client direct write: yok
- Server ingestion: var

### `announcements/{announcementId}`
- `routeId: string`
- `driverId: string`
- `templateKey: string`
- `customText: string | null`
- `channels: string[]` (`fcm`, `whatsapp_link`)
- `createdAt: Timestamp` (server)

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var

### `guest_sessions/{sessionId}`
- `routeId: string`
- `guestUid: string`
- `expiresAt: Timestamp`
- `status: "active" | "expired" | "revoked"`
- `createdAt: Timestamp`

Yazim yetkisi:
- Client direct write: yok
- Callable/scheduled functions: var

### `consents/{uid}`
- `privacyVersion: string`
- `kvkkTextVersion: string`
- `locationConsent: bool`
- `acceptedAt: Timestamp`
- `platform: "android" | "ios"`

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var (`upsertConsent`)

### `trip_requests/{uid_idempotencyKey}`
- `requestType: "start_trip" | "finish_trip"`
- `uid: string`
- `resultRef: string`
- `createdAt: Timestamp`
- `expiresAt: Timestamp`

Yazim yetkisi:
- Client direct write: yok
- Callable functions: var

## 2.2 RTDB path'leri

### `/locations/{routeId}`
- `lat`, `lng`, `heading`, `speed`, `accuracy`, `timestamp`
- `tripId`, `driverId`

### `/routeReaders/{routeId}/{uid}: true|false` (server)
- Uye yolcu + ilgili sofor(ler) okuma yetkisi

### `/routeWriters/{routeId}/{uid}: true|false` (server)
- Sadece aktif trip'i yuruten sofor yazabilir

### `/guestReaders/{routeId}/{guestUid}`
- `active: true|false`
- `expiresAtMs: number`

## 2.3 Sorgu kurallari
- Route listesi: `where("memberIds", arrayContains: uid)` disinda genis sorgu yok.
- Trip listesi: sadece kullanicinin uye oldugu routeId listesi ile.
- Driver arama: Firestore direct read yok; yalniz `searchDriverDirectory` callable uzerinden.

## 2.4 Composite index listesi
1. `routes`: `memberIds ARRAY_CONTAINS`, `isArchived ASC`, `timeSlot ASC`, `scheduledTime ASC`
2. `routes`: `driverId ASC`, `isArchived ASC`, `scheduledTime ASC`
3. `routes`: `srvCode ASC`
4. `trips`: `routeId ASC`, `status ASC`, `startedAt DESC`
5. `trips`: `status ASC`, `lastLocationAt ASC`
6. `announcements`: `routeId ASC`, `createdAt DESC`
7. Collection group `skip_requests`: `dateKey ASC`, `passengerId ASC`

## 2.5 Role gecis matrisi
- `guest -> passenger`: `bootstrapUserProfile` (anonim hesabin kimlik baglama/normal auth sonrasi)
- `guest(anonymous) -> passenger(google/email)`: auth link sonrasi local Drift tablolarinda `ownerUid` atomik devredilir; migration yarida kalirsa tekrar calisabilir (idempotent).
- Migration crash-safe kurali: `migration_lock` + `migration_version` ile yarim kalan owner transfer app startup'ta devam ettirilir.
- `passenger -> driver`: `upsertDriverProfile` + rol guncellemesi (server-side)
- `driver -> passenger`: yok (driver rolu passenger yeteneklerini kapsar)

## 2.6 Drift sema ve migration kurali
- Drift `schemaVersion` explicit tutulur (V1.0 baslangic: `1`).
- `MigrationStrategy` zorunlu:
  - `onCreate`: tum tablolar bir kerede olusturulur.
  - `onUpgrade`: her versiyon gecisi icin explicit migration adimi bulunur.
  - `beforeOpen`: migration lock/version kontrol logu yazilir.
- Her sema degisikliginde:
  - migration testi (eski DB -> yeni DB) zorunlu
  - ownerUid ve queue tablolari veri kaybi testleri zorunlu

### Risk
- Schema drift ve server-managed alanlara client mudahalesi.

### Onlem
- Hassas yazim path'leri direct client write'a kapali.
- Tum kritik write'lar callable/function transaction'i ile.

### Done kriteri
- Emulator testleri: field mutability + membership access + index gerektiren sorgular green.

---

## 3) Trip State Machine, Idempotency, Conflict Cozumu

### 3.1 Durumlar
- `start_pending_local` (client-only, max 10 sn undo penceresi)
- `active`
- `completed` (terminal)
- `abandoned` (terminal)

### 3.2 Gecerli gecisler
- `NONE -> start_pending_local` (kullanici `Seferi Baslat` basar)
- `start_pending_local -> NONE` (`Iptal`/undo)
- `start_pending_local -> active` (10 sn sonunda `startTrip` commit)
- `NONE -> active` (`startTrip`)
- `active -> completed` (`finishTrip`)
- `active -> abandoned` (`abandonedTripGuard`)
- Terminal -> terminal (aynisi) = no-op

### 3.3 Idempotency
- `startTrip` ve `finishTrip` zorunlu `idempotencyKey` alir.
- `trip_requests/{uid_key}` uzerinden dedupe yapilir.
- Ayni key ayni sonucu dondurur, yeni write olusmaz.

### 3.4 Race kurali
- Tum transition'lar Firestore transaction icinde.
- `status == active` kontrolu transaction icinde tekrar dogrulanir.
- Optimistic lock zorunlu:
  - Request `expectedTransitionVersion` alanini tasir.
  - Transaction'da `expectedTransitionVersion == currentTransitionVersion` degilse write yapilmaz (`FAILED_PRECONDITION`).
  - Basarili transition'da `transitionVersion` atomik olarak `+1` artar.
- `finishTrip` kazanirsa guard no-op olur.
- Guard kazanirsa `finishTrip` no-op donebilir, tutarlilik bozulmaz.

### 3.5 Heartbeat kaynagi
- `lastLocationAt` client tarafindan yazilmaz.
- RTDB `/locations/{routeId}` write trigger'i ile server tarafinda guncellenir.
- Replay ingestion'da `sampledAtMs` bazli stale filtre uygulanir; gec kalmis nokta heartbeat'i canliya cekmez.

### Risk
- Cift transition kaynakli bozuk trip state.

### Onlem
- Transaction + idempotency + terminal-state no-op.

### Done kriteri
- Concurrency testlerinde tek terminal state garanti.

---

## 4) Guvenlik Kurallari (Firestore + RTDB)

### 4.1 App Check
- Firestore, RTDB, Functions icin enforce.
- Prod'da debug token kesin kapali.

### 4.2 Firestore rules (ozet)

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isSelf(uid) { return signedIn() && request.auth.uid == uid; }
    function userRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isDriverRole() { return signedIn() && userRole() == 'driver'; }

    function isRouteMemberFromDoc(data) {
      return signedIn() && request.auth.uid in data.memberIds;
    }

    match /users/{uid} {
      allow read: if isSelf(uid);
      allow write: if false;
      allow delete: if false;
    }

    match /driver_directory/{driverId} {
      allow read: if false;
      allow write: if false;
    }

    match /drivers/{driverId} {
      allow read: if isSelf(driverId);
      allow write: if false;
      allow delete: if false;
    }

    match /routes/{routeId} {
      allow read: if isRouteMemberFromDoc(resource.data);
      allow write: if false;
    }

    match /routes/{routeId}/stops/{stopId} {
      allow read: if signedIn() &&
        request.auth.uid in get(/databases/$(database)/documents/routes/$(routeId)).data.memberIds;
      allow write: if false;
    }

    match /routes/{routeId}/passengers/{passengerId} {
      allow read: if isSelf(passengerId) || (
        signedIn() &&
        request.auth.uid in get(/databases/$(database)/documents/routes/$(routeId)).data.authorizedDriverIds
      ) || (
        signedIn() &&
        get(/databases/$(database)/documents/routes/$(routeId)).data.driverId == request.auth.uid
      );
      allow write: if false;
    }

    match /routes/{routeId}/skip_requests/{skipRequestId} {
      allow read: if (
        signedIn() && request.auth.uid == resource.data.passengerId
      ) || (
        signedIn() &&
        request.auth.uid in get(/databases/$(database)/documents/routes/$(routeId)).data.authorizedDriverIds
      ) || (
        signedIn() &&
        get(/databases/$(database)/documents/routes/$(routeId)).data.driverId == request.auth.uid
      );
      allow write: if false;
    }

    match /trips/{tripId} {
      allow read: if signedIn() &&
        request.auth.uid in get(/databases/$(database)/documents/routes/$(resource.data.routeId)).data.memberIds;
      allow write: if false;
    }

    match /announcements/{announcementId} {
      allow read: if signedIn() &&
        request.auth.uid in get(/databases/$(database)/documents/routes/$(resource.data.routeId)).data.memberIds;
      allow write: if false;
    }

    match /guest_sessions/{sessionId} {
      allow read: if signedIn() && request.auth.uid == resource.data.guestUid;
      allow write: if false;
    }

    match /consents/{uid} {
      allow read: if isSelf(uid);
      allow write: if false;
      allow delete: if false;
    }

    match /trip_requests/{id} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

`driver_directory` erisim kurali:
- Firestore direct read kapali (`allow read: if false`).
- Sadece `searchDriverDirectory` callable ile erisim verilir.
- Arama kontrati: min query uzunlugu, rate limit, max 10 sonuc, yalniz gerekli alanlar.

### 4.3 RTDB rules (ozet)

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "locations": {
      "$routeId": {
        ".read": "auth != null && (root.child('routeReaders').child($routeId).child(auth.uid).val() === true || (root.child('guestReaders').child($routeId).child(auth.uid).child('active').val() === true && root.child('guestReaders').child($routeId).child(auth.uid).child('expiresAtMs').val() > now))",
        ".write": "auth != null && root.child('routeWriters').child($routeId).child(auth.uid).val() === true",
        "lat": {".validate": "newData.isNumber() && newData.val() >= -90 && newData.val() <= 90"},
        "lng": {".validate": "newData.isNumber() && newData.val() >= -180 && newData.val() <= 180"},
        "speed": {".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 80"},
        "heading": {".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() < 360"},
        "accuracy": {".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 200"},
        "tripId": {".validate": "newData.isString()"},
        "driverId": {".validate": "newData.isString() && newData.val() === auth.uid"},
        "timestamp": {".validate": "newData.isNumber() && newData.val() <= now + 5000 && newData.val() >= now - 30000"}
      }
    },
    "routeReaders": {"$routeId": {"$uid": {".read": false, ".write": false}}},
    "routeWriters": {"$routeId": {"$uid": {".read": false, ".write": false}}},
    "guestReaders": {"$routeId": {"$uid": {".read": false, ".write": false}}}
  }
}
```

Not:
- `locations/{routeId}` yalniz canli/taze nokta icindir (30 sn pencere).
- Offline replay noktalarinin gecmis yazimi Firestore `location_history` path'inde yapilir; RTDB live path'e yazilmaz.

### Risk
- Rules acigi ile toplu veri sizmasi.

### Onlem
- Direct write kapatma + strict membership read + CI emulator tests.

### Done kriteri
- Yetkisiz senaryolarin tamami 403; tum yetkili senaryolar 200.

---

## 5) Cloud Functions Gen2 Kontratlari

**Runtime:** Node.js 20, region `europe-west3`, timeout default 30s

### 5.1 Function listesi (V1.0)
1. `bootstrapUserProfile` (callable)  
2. `updateUserProfile` (callable)  
3. `upsertConsent` (callable)  
4. `upsertDriverProfile` (callable)  
5. `createRoute` (callable)  
6. `updateRoute` (callable)  
7. `upsertStop` (callable)  
8. `deleteStop` (callable)  
9. `joinRouteBySrvCode` (callable)  
10. `leaveRoute` (callable)  
11. `updatePassengerSettings` (callable)  
12. `submitSkipToday` (callable)  
13. `createGuestSession` (callable, anonymous auth allowed)  
14. `startTrip` (callable)  
15. `finishTrip` (callable)  
16. `syncPassengerCount` (trigger)  
17. `syncRouteMembership` (trigger)  
18. `syncTripHeartbeatFromLocation` (RTDB trigger)  
19. `abandonedTripGuard` (event-driven stale sinyal + schedule/10dk fallback)  
20. `sendDriverAnnouncement` (callable)  
21. `morningReminderDispatcher` (schedule/1dk)  
22. `cleanupStaleData` (schedule/03:00)
23. `createRouteFromGhostDrive` (callable)
24. `createSupportReport` (callable)
25. `mapboxDirectionsProxy` (callable/http)
26. `mapboxMapMatchingProxy` (callable/http)
27. `searchDriverDirectory` (callable, limitli arama)

### 5.2 Zorunlu endpoint kurallari
- Tum callable endpointlerde auth zorunlu; `createGuestSession` anonim auth ile calisabilir, diger endpointler non-anonymous auth ister.
- Non-anonymous kontrolu: `auth.token.firebase.sign_in_provider != 'anonymous'`.
- Role kontrolu `users/{uid}.role` uzerinden server-side yapilir.
- Driver-only endpointlerde ek olarak `drivers/{uid}` varlik kontrolu zorunludur.
- `createGuestSession` cagrisi, `users/{uid}` yoksa atomik olarak `role=guest` profile bootstrap eder.
- `bootstrapUserProfile`, anonimden normal hesaba geciste `guest -> passenger` rol gecisini idempotent sekilde yapar.
- `createRouteFromGhostDrive` yalniz driver rolu ile calisir; minimum iz uzunlugu + nokta limiti + point dedupe zorunludur.
- `createSupportReport` yalniz auth'lu kullanici icin calisir; payload server tarafinda PII redaction'dan gecmeden saklanmaz/forward edilmez.
- `startTrip` cagrisi istemci tarafi undo penceresi (`10 sn`) sonrasinda yapilir; pencere icinde iptal edilmis istek server'a gitmez.
- Tum write endpointleri transaction ile calisir.
- Her response `requestId` ve `serverTime` doner.
- Error contract: `PERMISSION_DENIED`, `FAILED_PRECONDITION`, `INVALID_ARGUMENT`, `RESOURCE_EXHAUSTED`.

### 5.3 Idempotency zorunlulugu
- `startTrip`, `finishTrip`, `submitSkipToday`, `sendDriverAnnouncement` idempotencyKey alir.
- Ayni key tekrarinda duplicate write veya duplicate push yok.

### 5.4 Ozellik bazli kontratlar
- `joinRouteBySrvCode`: `role in {passenger, driver}` icin calisir; route preview doner, passenger kaydi olusturur, `memberIds` gunceller.
- `createRoute`: `srvCode` uretimi `nanoid(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')` ile yapilir; collision durumunda max 5 retry, limit asiminda deterministic hata (`RESOURCE_EXHAUSTED`, `SRVCODE_COLLISION_LIMIT`) doner.
- `createGuestSession`: `allowGuestTracking == true` degilse red; TTL varsayilan `30 dk`; route okumasi yalniz RTDB uzerinden guestReaders ile verilir.
- `submitSkipToday`: tek passenger + tek date icin tek kayit.
- `submitSkipToday`: gun degisiminde "reset write" yoktur; UI sadece `dateKey == today` kaydina bakar, eski kayitlar retention ile temizlenir.
- `sendDriverAnnouncement`: FCM + paylasim linki (`https://nerede.servis/r/{srvCode}`) payload doner.
- Paylasim linki kontrati:
  - App yuklu degilse landing page route preview + store CTA gosterir.
  - App yukluyse deep link ile route preview/katilim ekranina yonlendirir.
  - Landing metadata zorunlu: Open Graph (`og:title`, `og:description`, `og:image`) ve deep-link dogrulama dosyalari (`apple-app-site-association`, `assetlinks.json`).
- `startTrip`: `trip_started` push icin route bazli 15 dk cooldown uygular; cooldown icindeyse ikinci "hareket etti" push'ini bastirir veya "tekrar hareket etti" formatina indirger.
- `startTrip`: istemci undo penceresi sebebiyle en erken `t0+10 sn` civarinda commit edilir; pencere oncesi iptalde trip olusmaz.
- `registerDevice`: varsayilan politika `single-active-device`; yeni login eski aktif cihazi revoke eder ve bilgilendirme push'u gonderir.
- `finishTrip`: varsayilan olarak `startedByDeviceId` ile sinirli calisir; `deviceId` mismatch durumunda `PERMISSION_DENIED` doner; acil override yalniz server-admin yolu ve audit log ile mumkundur.
- `createRouteFromGhostDrive`: kaydedilen GPS izinden `start/end` ve durak adaylarini cikarir; sofor onayi olmadan route publish etmez.
- `createRouteFromGhostDrive` sadelestirme kontrati:
  - Ham trace dogrudan routePolyline olarak kaydedilmez.
  - Douglas-Peucker sadelestirme zorunlu.
  - Epsilon + max nokta limiti tanimlanir (render performansi + belge boyutu kontrolu).
  - DP sonrasi Map Matching post-process uygulanir; timeout/hata halinde DP sonucu fallback olarak kullanilir.
- `syncSubscriptionStatusFromRevenueCat` (webhook): `subscriptionStatus`, `trialEndsAt` alanlarini server-authoritative gunceller.
- `getSubscriptionState`: tek kaynak server state'tir; client local cache/override premium acamaz.
- Premium enforcement kontrati (V1.0):
  - `startTrip`/`finishTrip` abonelik nedeniyle bloklanmaz (core lifecycle acik).
  - `subscriptionStatus in {expired, mock}` ise server soft-lock uygular: dusuk oncelik publish politikasi + maliyetli servislerde fallback.
  - Premium zorunlu bir davranis tetiklenirse server `PERMISSION_DENIED` dondurur; client paywall UI tek basina yetki veremez.
- `morningReminderDispatcher`: `scheduledTime` degerlerini `Europe/Istanbul` timezone'una gore degerlendirir.
  - `target = scheduledTime - 5 dk`
  - gonderim penceresi: `[target, target+1dk)`
  - dedupe anahtari: `routeId + dateKey(Europe/Istanbul) + reminderType`
### 5.5 Callable I/O hizli sozlesme
- `bootstrapUserProfile(input: {displayName, phone?}) -> {uid, role, createdOrUpdated}`
- `updateUserProfile(input: {displayName, phone?}) -> {uid, updatedAt}`
- `upsertConsent(input: {privacyVersion, kvkkTextVersion, locationConsent, platform}) -> {uid, acceptedAt}`
- `upsertDriverProfile(input: {name, phone, plate, showPhoneToPassengers}) -> {driverId, role}`
- `createRoute(input: {name, startPoint, startAddress, endPoint, endAddress, scheduledTime, timeSlot, allowGuestTracking, authorizedDriverIds?}) -> {routeId, srvCode}`
- `updateRoute(input: {routeId, patch}) -> {routeId, updatedAt}`
- `upsertStop(input: {routeId, stopId?, name, location, order}) -> {routeId, stopId}`
- `deleteStop(input: {routeId, stopId}) -> {routeId, deleted: true}`
- `joinRouteBySrvCode(input: {srvCode, name, phone?, showPhoneToDriver, boardingArea, notificationTime}) -> {routeId, passengerId, joinedAt}`
- `leaveRoute(input: {routeId}) -> {routeId, leftAt}`
- `updatePassengerSettings(input: {routeId, showPhoneToDriver, phone?, boardingArea, virtualStop?, virtualStopLabel?, notificationTime}) -> {routeId, updatedAt}`
- `submitSkipToday(input: {routeId, dateKey, idempotencyKey}) -> {routeId, dateKey, status: "skip_today"}`
- `createGuestSession(input: {srvCode, ttlMinutes?}) -> {sessionId, routeId, expiresAt, rtdbReadPath}`
- `startTrip(input: {routeId, deviceId, idempotencyKey, expectedTransitionVersion}) -> {tripId, status, transitionVersion}`
- `finishTrip(input: {tripId, deviceId, idempotencyKey, expectedTransitionVersion}) -> {tripId, status, endedAt, transitionVersion}`
- `sendDriverAnnouncement(input: {routeId, templateKey, customText?, idempotencyKey}) -> {announcementId, fcmCount, shareUrl}`
- `createSupportReport(input: {routeId?, tripId?, trigger, note?, diagnostics}) -> {reportId, createdAt}`
- `mapboxDirectionsProxy(input: {routeId, origin, destination}) -> {etaSeconds, distanceMeters, source}`
- `mapboxMapMatchingProxy(input: {tracePoints, profile}) -> {snappedPolyline, confidence, fallbackUsed}`
- `searchDriverDirectory(input: {queryHash, limit?}) -> {results[]}`
- `getSubscriptionState(input: {}) -> {subscriptionStatus, trialEndsAt, products}`
- `createRouteFromGhostDrive(input: {name, tracePoints, scheduledTime, timeSlot, allowGuestTracking, authorizedDriverIds?}) -> {routeId, srvCode, inferredStops[]}`

Input validasyon kurallari:
- `scheduledTime`, `notificationTime`: `HH:mm`
- `dateKey`: `YYYY-MM-DD`
- `srvCode`: `^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$`
- `customText`: max `240` karakter
- `note`: max `500` karakter
- `ttlMinutes`: min `5`, max `60`
- `virtualStop.lat`: `[-90, 90]`, `virtualStop.lng`: `[-180, 180]`
- `expectedTransitionVersion`: integer, `>= 0`
- `searchDriverDirectory.limit`: min `1`, max `10`

### Risk
- Trigger tekrarlarinda duplicate state veya duplicate bildirim.

### Onlem
- Deterministic docId + idempotencyKey + transaction.

### Done kriteri
- Emulator + staging replay testlerinde duplicate write/bildirim yok.

---

## 6) Konum, ETA, Offline ve Maliyet Politikasi

### 6.1 Konum yayim
- Hareketli: `8 sn`
- Dusuk hareket: `20 sn`
- Min distance: `>= 15 m`
- `accuracy > 80m` drop
- Android background foreground-service notification zorunlu
- Android manifest + izin zorunlulugu:
  - Servis deklarasyonu `foregroundServiceType=\"location\"`
  - Izinler: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `WAKE_LOCK`
- Izin politikasi:
  - Sofor: once `while-in-use`, aktif seferde gerekliyse `background` izni istenir.
  - Yolcu/guest: konum izni istenmez (unnecessary permission yok).
  - Runtime gate: yolcu/guest rolde location service/prompt kod yolu acilmaz; yalniz sofor role path'i izin tetikler.
- Google Play background location gerekcesi sabit metinle kullanilir:
  - `Sofor aktif sefer baslattiginda yolcularin guvenli ve dogru takip edebilmesi icin uygulama arka planda konum paylasir. Sefer bitince takip durur.`

### 6.1B Izin isteme zamanlama matrisi
- Notification izni:
  - Onboarding'de toplu prompt yok.
  - Yolcu icin tetik: route katilimi sonrasi veya `Bildirim Acik Kalsin` CTA tiklaninca.
  - Sofor icin tetik: ilk duyuru/sabah hatirlatma ozelligi kullanilirken.
- GPS `while-in-use`:
  - Sadece sofor rolu.
  - Tetik: `Seferi Baslat` veya `Ghost Drive kaydi baslat`.
- GPS `background/always`:
  - Sadece sofor rolu ve `while-in-use` verildikten sonra.
  - Tetik: aktif sefer commit adimi.
- Android pil optimizasyonu istisnasi:
  - Tetik: ilk basarili aktif sefer sonrasi veya OEM kill/publish kesinti sinyali.
  - Prompt: sistem ayarina yonlendirme + neden aciklamasi.
- Tekrar isteme:
  - `Don't ask again` sonrasi otomatik prompt yok; yalniz Ayarlar CTA.
  - Ayni izin icin otomatik tekrar isteme cooldown: en az 24 saat.

### 6.1C Izin red davranisi (zorunlu fallback)
- Notification red:
  - Push gonderimi yok; in-app banner/kart fallback aktif.
  - Kritik olaylar yalniz uygulama icinde gorunur.
- GPS `while-in-use` red:
  - Sofor aktif sefer baslatamaz (hard-block).
  - Route yonetimi, yolcu listesi ve gecmis ekranlari kullanilabilir.
- GPS `background/always` red:
  - Foreground-only tracking moduna gecilir.
  - Ekran kapaninca/stale riski oldugu sofore acik metinle gosterilir.
- Pil optimizasyonu red (Android):
  - Background servis OEM tarafinda kesilebilir; publish araligi degrade olabilir.
  - Heartbeat uyarisi ve `Ayarlar'dan Ac` CTA zorunlu.

### 6.1D Sofor guidance + heartbeat kontrati
- Aktif sefer ekraninda sade harita vardir: rota cizgisi + arac marker + siradaki durak marker.
- Harita uzerine buyuk durum etiketi bindirilir: `YAYINDASIN`.
- Driver Guidance Lite alanlari:
  - `Siradaki Durak: {stopName}`
  - `Kus ucusu mesafe: {distanceM} m`
- Durumlar:
  - `green`: konum publish + RTDB ack son 20 sn icinde
  - `yellow`: publish var ama ack gecikmeli (20-90 sn)
- `red`: publish/ack yok veya kritik hata (>90 sn)
- Heartbeat her 1 sn animasyonla yenilenir; renk degisimi aninda haptik + metin uretir.
- `red` durumunda periferik uyari zorunlu: tam ekran kenarinda kirmizi flash + ayri haptic ritmi (normal bildirim titresiminden farkli).
- `red -> yellow/green` donusunde tek-shot "iyilesme" geri bildirimi verilir.
- Sesli geri bildirim zorunlu (toggle acik/kapali):
  - red: `Baglanti kesildi`
  - yellow/green iyilesme: `Baglandim`
  - finish: `Sefer sonlandirildi`
- `finish_trip` yikici aksiyonu tek-tap olamaz; `slide-to-finish` veya `uzun bas` ile tetiklenir.
- OLED burn-in korumasi zorunlu: heartbeat halkasi + `YAYINDASIN` etiketi her 60 sn'de 2-3 px micro-shift uygular.
- Canli marker gostergesi icin Kalman smoothing kullanilir (ham GPS saklanir, UI'da filtreli marker gosterilir).
- Varsayilan Kalman parametreleri: `processNoise=0.01`, `measurementNoise=3.0`, `updateIntervalMs=1000`.

### 6.1E iOS silent-kill mitigasyonu
- iOS tarafinda yalniz tek strateji kullanilmaz; hybrid izleme zorunlu:
  - standard location updates (aktif sefer)
  - significant-change monitoring (dusus enerji modu)
- Hareket tekrar basladiginda sistem uyanmasini iyilestirmek icin Activity Recognition sinyali kullanilir.
- BGTaskScheduler watchdog gorevi best-effort calisir:
  - pending queue var mi kontrol eder
  - uygun kosulda flush/restart tetikler
- iOS agresif guc modunda bile "kesintisiz degil ama toparlanabilir" davranis hedeflenir.

### 6.2 Stale-data seviyeleri
- `0-30 sn`: Fresh
- `31-120 sn`: Gecikmeli
- `121-300 sn`: Bayat
- `>300 sn`: Konum guncel degil

### 6.2A Delay inference kontrati
- Kosul: `now > scheduledTime + 10 dk` ve route icin `activeTrip == null`.
- Yolcu kartinda zorunlu etiket: `Sofor henuz baslatmadi (Olasi Gecikme)`.
- Bu durum teknik ariza metniyle karistirilmaz; stale metninden ayri gorunur.

### 6.3 Offline queue
- `location_queue`: max 400 kayit/route, flush 20 kayit/batch
- `trip_action_queue`: `start_trip` / `finish_trip`, max 20 action
  - `status`: `pending | in_flight | failed_permanent`
  - `failed_retry_count` tutulur; 3 deneme sonrasi `failed_permanent`
  - `failed_permanent` kayitlari otomatik replay edilmez, manuel mudahale gerekir
- Aksiyon kuyrugu item'lari idempotencyKey ile tasinir
- Trip action queue, location queue'dan once flush edilir
- Historical ingestion / live broadcast ayrimi zorunlu:
  - Replay item icin `now - sampledAtMs > 60 sn` ise `RTDB /locations/{routeId}` canli path'ine yazilmaz.
  - Bu kayitlar yalniz `trips/{tripId}/location_history` altina `source=offline_replay` olarak yazilir.
  - Canli path'e sadece taze nokta (`<= 60 sn`) gider.
- UI state'i domain state'den ayrilir: `local_done != synced` olabilir.
- Kritik aksiyon (`finish_trip`) pending iken kapama denemesinde `PopScope` uyarisi zorunlu.
- Tum lokal tablolarda `ownerUid` tutulur; auth link sonrasi owner devri atomik migration ile yapilir.
- Owner migration tamamlanmadan queue flush baslatilmaz.
- Terminated app flush:
  - Android: WorkManager periyodik gorev (`~15 dk`) pending queue kontrolu yapar.
  - iOS: BGTask/BackgroundFetch uygun pencerede pending queue flush dener.
  - Baglanti geldiginde ve kosullar uygunsa sessiz flush yapilir; tekrarlar idempotency ile guvenli kalir.

### 6.4 ETA kontrati
- Birincil kaynak: Mapbox Directions API
- Refresh kosulu: `>= 30 sn` veya `>= 150 m` fark
- Rate cap: route basina `<= 1 istek / 20 sn`
- API hata durumunda fallback: `crowFlyETA * 1.3`
- Yolcuya ETA ile birlikte `lastEtaSource` (`directions|fallback`) gosterilir
- Ghost Drive polyline toleransi: aracin kayitli polyline'a mesafesi `>500 m` ise `off_route_eta` moduna gecilir.
- `off_route_eta` modunda marker zorla polyline'a snap edilmez; ham GPS marker gosterilir.
- `off_route_eta` modunda hedefe dogrudan rota (gecerli konum -> hedef/durak) ile ETA hesaplanir.
- ETA hedef onceligi:
  - 1) Yolcu `virtualStop` secmisse hedef odur.
  - 2) `virtualStop` yoksa `boardingArea`/route baslangici fallback kullanilir.

### 6.5 Mapbox token guvenligi
- Mobile tokenlar platform bazli kisitlanir (Android package name + SHA-256, iOS bundle id).
- Public token sadece read-only scope ile kullanilir.
- Secret token mobil uygulamaya konmaz; yalniz server ortaminda tutulur.
- Token rotasyonu: 90 gunde bir veya sizinti supesinde aninda.

### 6.5A Mapbox cache politikasi
- Style pack preload: aktif tema stili ilk acilista cihaz cache'ine alinir.
- Tile cache: sik kullanilan guzergah bolgelerinde cache onceliklendirilir.
- Cache size limiti + eviction kurali zorunlu (disk sismez).
- Harita acilisinda cache-first davranisi tercih edilir; gereksiz map load/network maliyeti azaltilir.
- Flutter entegrasyonunda Mapbox `OfflineManager` + `TileStore` kullanimi zorunludur.

### 6.6 Maliyet guardrail
- Pilot: `<= 50` aktif sofor
- RTDB write hedefi: `< 3M/ay`
- Firestore read hedefi: `< 1.5M/ay`
- Map Matching aylik istek limiti remote config ile sinirlanir; limit asiminda otomatik DP fallback.
- Weekly cost report zorunlu

### 6.7 Onboarding video entegrasyon kontrati
- Onboarding video "en sona birak" modeliyle degil, 3 asama ile uygulanir:
  - Asama-1 (erken UI): video-ready shell (poster + CTA + skip + fail-safe fallback).
  - Asama-2 (core stabil): gercek video asset/oynatma entegrasyonu.
  - Asama-3 (release yakini): codec/sikistirma/performance ve dusuk cihaz optimizasyonu.
- Fail-safe zorunlu:
  - Video decode/asset/network hatasinda statik poster fallback calisir.
  - Video problemi auth/onboarding ilerlemesini bloklayamaz.
- Oynatma politikasi:
  - varsayilan sessiz autoplay
  - ilk acilista max 1 dongu
  - sonrasinda hizli gecis (uygulama acilis suresi korunur)
- Performans butcesi:
  - video acikken cold-start regresyonu sinirli olmalidir (`<= 300 ms` hedef)
  - iPhone 11 + Samsung A24 cihazlarinda jank/crash artisi kabul edilmez
- Erisilebilirlik:
  - sistemde `reduce motion` aktifse statik poster yoluna dusme desteklenir.
- Dagitim:
  - ilk acilis deneyimi ag bagimliligina baglanmaz; yerel poster/video varligi ile calisir.

### 6.8 Glance surfaces (Yolcu)
- iOS: Live Activities (Lock Screen + Dynamic Island, destekli modeller).
- Android (oncelik): Android 14+ Live Updates API (uygun cihaz/surumlerde).
- Android (fallback): promoted ongoing notification + policy uyumlu foreground-service bildirimi.
- Kaynak veri: aktif trip ETA + stale state.
- Fallback: desteklenmeyen cihazlarda standart push + uygulama icinde map sheet.
- V1.1 kesif: QR giriste iOS App Clip / Android Instant App POC (mini native takip karti).

### 6.9 Monetization surface (Sofor)
- Paywall sadece sofor rolune gosterilir; yolcuya asla gosterilmez.
- V1.0 kilidi: production billing kapali, subscription state mock/read-only modda calisir.
- V1.1'de RevenueCat production entegrasyonu acilir.
- Paywall copy single source of truth: `docs/NeredeServis_Paywall_Copy_TR.md`
  - Teknik plan metin kaynagi degildir; paywall metin degisikligi once bu dosyada yapilir.
  - Teknik plan bu dosyanin entegrasyon kurallarini ve policy guard'larini tanimlar.
- Entry point:
  - `Ayarlar > Abonelik`
  - Trial bitiminde persistent banner
  - Premium aksiyon tetiginde intent-driven acilis (ornek: canli publish ayari)
- Store uyumu:
  - iOS dijital ozellik satin alimlari yalniz App Store IAP.
  - Android dijital ozellik satin alimlari yalniz Google Play Billing.
  - iOS ekraninda buton etiketi: `Restore Purchases`.
  - Android ekraninda buton etiketi: `Satin Alimlari Geri Yukle`.
  - Her iki platformda `Manage Subscription` linki zorunlu.
  - Google Play Billing Library `6.x` uyum kaniti release gate'te zorunlu.
  - Varsayilan global akista uygulama ici harici odeme linki/yonlendirmesi yok.
  - Bolgesel policy istisnasi kullanilacaksa storefront bazli feature flag + hukuk onayi + policy checklist zorunlu.
- Soft-lock gorunurlugu:
  - Yolcu stale bandinda acik statü metni kullanilir: `Servis Baglantisi: Dusuk Oncelik Modu`.
  - Teknik sorun metni ile karistirilmaz (`Baglanti zayif` ile ayni yerde kullanilmaz).
- Copy entegrasyon kurali:
  - Zorunlu buton/label metinleri (`Restore Purchases`, `Satin Alimlari Geri Yukle`, `Manage Subscription`) ve delete interceptor metinleri `docs/NeredeServis_Paywall_Copy_TR.md` ile birebir eslesir.
  - l10n anahtar seti, `docs/NeredeServis_Paywall_Copy_TR.md` icindeki "l10n Anahtar Onerisi" bolumunu referans alir.

### 6.10 Pil hedefi
- Orta segment Android'de 2 saat aktif seferde ek tuketim `<= %8`

### Risk
- OEM kill, zayif baglantida veri kaybi, offline replay'de hayalet arac etkisi, ETA API maliyet sismesi.

### Onlem
- OEM yonlendirme akisi + stale alarm + ETA rate cap + fallback + historical/live ayrimi.

### Done kriteri
- Samsung/Xiaomi 60 dk ekran kapali test + ETA fallback testleri green.

---

## 7) KVKK, Gizlilik ve Veri Yasam Dongusu

### 7.1 Acik riza
- Zorunlu KVKK metni + checkbox olmadan konum takibi acilmaz
- `consents/{uid}` versiyonlu kayit zorunlu
- Riza geri cekilirse aktif trip baslatma engellenir

### 7.2 Veri minimizasyonu
- Misafir modunda Firestore'da kalici yolcu kaydi tutulmaz
- `showPhoneToDriver=false` ise passenger phone null
- `showPhoneToPassengers=false` ise `driverSnapshot.phone=null`
- Guest/yolcu cihazi konumu toplanmaz; konum verisi yalniz sofor aktif sefer yayinindan gelir.

### 7.3 Retention
- RTDB location: yalniz son nokta
- `trips`: 180 gun
- `announcements`: 30 gun
- `trip_requests`: 7 gun
- `guest_sessions`: max 24 saat
- Telemetri: 30 gun

### 7.4 Hesap silme
- App ici silme talebi
- `deleteUserData` callable talebi alir
- Off-boarding interceptor zorunlu:
  - `subscriptionStatus in {active, trial}` ise once `Manage Subscription` yonlendirmesi + acik uyari metni gosterilir.
  - Uyari: `Hesabi silmek odemeyi durdurmaz. Once store aboneligini iptal et.`
- UI erisim kurali: `Hesabimi Sil` aksiyonu Ayarlar icinde derine gomulmez (max 2 seviye).
- 7 gun icinde hard delete + bagli PII temizligi
- Audit log zorunlu

### 7.5 Destek raporu veri kurali
- `Sorun Bildir`/`Shake to Report` tanilama paketleri max 30 gun tutulur.
- Rapor iceriginde ham PII tutulmaz; alanlar redacted/hashed olur.
- Support kanalina (email/slack) giden payload da ayni redaction kurallarina tabidir.

### 7.6 Region
- Tum runtime servisleri `europe-west3` standardina bagli
- Region degisikligi ancak migration runbook ile

### Risk
- Riza ve veri silme sureclerinin eksik kalmasi.

### Onlem
- Consent gate hard-block + retention cron + delete SLA takibi.

### Done kriteri
- KVKK checklist: consent, retention, delete, audit testleri green.

---

## 8) Test Stratejisi ve Kabul Kriterleri

### 8.1 Test katmanlari
1. Unit: use-case, mapper, validator (`>= %80`)
2. Emulator integration: auth, rules, callable, trigger
3. E2E fiziksel cihaz: sofor/yolcu/guest tam akislari
4. Soak: 60 dk background tracking + 30 dk zayif network

### 8.2 Zorunlu guvenlik testleri
- Uye olmayan kullanici route/trip okuyamaz
- Client direct write ile users/drivers/consents/route/trip/passenger degisimi yapamaz
- Guest session suresi dolunca RTDB read kesilir
- `showPhone*` flag'leri tum ekranlarda gercekten maskelenir
- `skip_requests` sadece ilgili yolcu ve sofor(ler) tarafindan okunur

### 8.3 Fonksiyonel test senaryolari
- SRV kodu ile katilim
- Guest -> passenger rol gecisi ve sonrasinda SRV katilim
- Anonymous -> Google/Email link sonrasi local ownership transfer (Drift) veri kaybi olmadan tamamlaniyor mu
- Drift migration testi: `schemaVersion` artinca mevcut kullanici verisi kayipsiz tasiniyor mu
- Bugun Binmiyorum
- Bugun Binmiyorum sonrasi sofor listesinde satir altta + strikethrough; gun degisiminde otomatik reset
- Sofor duyuru + WhatsApp share payload
- ETA directions + fallback
- `searchDriverDirectory` testleri: direct read kapali, callable limitli sonuc ve rate limit ile calisiyor mu
- Ghost Drive map matching testi: ham trace -> snapped rota kalitesi tutarli mi, fallbackte rota uretiliyor mu
- Kalman smoothing testi: marker titremesi azalirken kabul edilebilir gecikme korunuyor mu
- Mapbox token kisit testleri (yanlis package/bundle ile erisim reddi)
- Mapbox cache testi: `OfflineManager` + `TileStore` aktifken ikinci acilista ag cagrisi/maliyet dusuyor mu
- Offline start/finish queue replay
- Terminated queue flush testi: app kapaliyken (Android WorkManager/iOS BGTask) pending actionlar baglanti gelince bosaliyor mu
- iOS + Android 60 dk ekran kapali tracking testi: publish araligi hedef toleransta mi
- iOS silent-kill toparlanma testi: uygulama suspend olduktan sonra hareket yeniden baslayinca Activity Recognition + BGTask watchdog ile yayin toparlaniyor mu
- `startTrip` undo penceresi testi: ilk 10 sn `Iptal` ile trip/push olusmuyor mu
- TransitionVersion optimistic lock testi: parallel `startTrip/finishTrip` istekleri ikinci yazimi reddediyor mu
- Heartbeat renk/state gecisi (`green -> yellow -> red`) dogru mu
- Heartbeat red periferal alarm testi (kirmizi flash + ayri haptic pattern) dogru mu
- Heartbeat sesli geri bildirim testi (`Baglanti kesildi` / `Baglandim` / `Sefer sonlandirildi`) dogru tetikleniyor mu
- OLED burn-in micro-shift testi: 2 saatlik aktif seferde sabit piksel birikimi azaltiliyor mu
- Seferi Bitir guvenli aksiyon testi (yanlis dokunus finish yapmiyor mu)
- Pending `finish_trip` durumunda uygulama kapanis korumasi calisiyor mu (`PopScope`)
- Trial bitisi -> paywall acilisi -> satin alma/restore/manage akislari dogru mu
- iOS/Android restore buton etiketi platforma gore dogru mu
- Android 14/15 Live Updates gorunurluk + fallback testleri (kilit ekrani + uygulama kapaliyken) green mi
- Yolcu/guest roluyle konum izni dialogu hic acilmiyor mu
- Sofor roluyle izin akisi incremental mi (`while-in-use` -> `background`)
- Notification izni red testi: push yokken in-app fallback + ayarlar CTA calisiyor mu
- `while-in-use` red testi: sofor `Seferi Baslat` adiminda hard-block + acik neden metni aliyor mu
- `background/always` red testi: foreground-only moda gecis + stale risk uyarisi dogru mu
- Android pil optimizasyonu red testi: degrade izleme modu + heartbeat uyari seviyesi + ayarlar yonlendirmesi gorunuyor mu
- Android manifest/service dogrulamasi: `foregroundServiceType=location` + gerekli izinler mevcut mu
- Onboarding video shell testi: video kapali/hatali durumda poster fallback ile onboarding/auth kesintisiz devam ediyor mu
- Onboarding video performans testi: iPhone 11 + Samsung A24'te acilis suresi/jank hedefte mi
- UTF-8/l10n testi: `ı, ş, ğ, ü, ö, ç` karakterleri bozulmadan gosteriliyor mu
- Offline replay stale filtre testi: `>60 sn` noktalar canli RTDB'ye dusmuyor mu
- `startTrip` bildirim cooldown testi: 15 dk icinde tekrarlayan start event push firtinasi uretmiyor mu
- `getSubscriptionState`/premium guard testi: client manipule edilse de premium endpoint server-side deny ediyor mu
- Driver Guidance Lite testi: aktif seferde "siradaki durak + mesafe" alani tutarli mi
- Virtual stop testi: secilen nokta ETA hedefinde birincil kaynak olarak kullaniliyor mu
- Ghost Drive testi: kayitli izden rota + durak adaylari makul sekilde olusuyor mu
- Ghost Drive off-route testi: `>500m` sapmada `off_route_eta` moduna geciyor mu, marker snap olmadan kalıyor mu
- Delay inference testi: `scheduled + 10 dk` esiginde yolcu karti dogru etikete geciyor mu
- Hesap silme interceptor testi: aktif abonelikte delete bloklaniyor ve `Manage Subscription` akisi aciliyor mu
- `Sorun Bildir` / `Shake to Report` testi: rapor paketi olusuyor mu, PII redaction dogru mu

### 8.4 Cihaz matrisi
- Samsung A24 (Android 14)
- Xiaomi Redmi Note serisi (Android 13/14)
- Pixel 7
- iPhone 11 (iOS 17)
- iPhone 13 (iOS 18)

### 8.5 P0 kabul kriterleri
- Yetkisiz read/write sifir
- Trip state corruption sifir
- Konum stale KPI hedefte
- Crash-free `>= 99.5%`

### Risk
- Yetersiz fiziksel cihaz testi.

### Onlem
- Her release oncesi minimum 3 fiziksel cihaz checklist zorunlu.

### Done kriteri
- P0 testleri green olmadan prod rollout yok.

---

## 9) Release, CI/CD, Rollback

### 9.1 Branch modeli
- `feature/*` -> PR -> `develop` (staging)
- `release/*` -> `main` (prod)

### 9.2 CI adimlari
1. `flutter analyze`
2. `flutter test`
3. Emulator integration suite
4. Android/iOS build smoke
5. Rules/functions deploy staging
6. Release config gate: V1.0'da analytics-amacli toplama kapali (Data Safety ile uyumlu)
7. Manual approval -> prod

### 9.3 Rollout
- `%5` (24 saat) -> `%20` (24 saat) -> `%100`
- Stop kriteri:
  - Crash-free `< 99.0%`
  - Konum stale alarmi `> %20`
  - Guvenlik incident

### 9.4 Rollback
- Son stabil mobil surume rollback
- Functions previous revision rollback
- Remote config kill-switch:
  - `tracking_enabled`
  - `announcement_enabled`
  - `guest_tracking_enabled`
  - `force_update_min_version`
  - `directions_enabled`
  - `map_matching_enabled`
  - `kalman_process_noise`
  - `kalman_measurement_noise`
  - `kalman_update_interval_ms`
  - `mapbox_monthly_directions_cap`
  - `mapbox_monthly_map_matching_cap`
  - `mapbox_tile_cache_mb`
  - `mapbox_style_preload_enabled`
- Feature flag sozlesmesi `docs/feature_flags.md` dosyasinda tek kaynak olarak tutulur (tip + varsayilan + ortam bazli override).

### 9.5 Store billing uyum gate
- Copy governance:
  - Paywall/store metinlerinin canonical kaynagi `docs/NeredeServis_Paywall_Copy_TR.md` dosyasidir.
  - Listing/paywall metin degisikliklerinde bu dosya guncellenmeden release cikilmaz.
- App Store Connect:
  - Subscription group + products (`monthly`, `yearly`) hazir
  - Trial suresi store tarafinda dogru
  - `Restore Purchases` UI videosu review notuna eklendi
  - Billing grace period acik ve odeme-basarisiz yenileme senaryosu testli
  - Review notu terminolojisi policy uyumlu (`tracking` yerine `Route Coordination` / `Trip Sharing`)
- Google Play Console:
  - Subscription base plan + trial aktif
  - Country pricing ve vergi ayarlari tamam
  - Android canli bildirim yolunda kullanilan API/FGS tipleri policy checklist ile dogrulandi
  - App category: `Travel & Local` secildi
  - Background location declaration metni urun davranisiyla birebir uyumlu
  - Store listing metni policy uyumlu:
    - `Konum paylasimi sadece aktif seferde soforden alinir`
    - `Sefer bitince takip durur`
    - `Yolcu/guest konumu alinmaz`
    - `Veri ucuncu taraflarla paylasilmaz`
  - Closed testing kosulu ve kanitlari tamam (hesap tipine gore min testci/sure)
  - Billing Library `6.x` uyumu dokumante + release build kaniti mevcut
- Storefront policy:
  - Hangi ulkede hangi billing akisinin acik oldugu dokumante
  - Istisna programlari yalniz ilgili ulke ve policy onayi ile acik
- RevenueCat:
  - Product -> entitlement mapping staging/prod ayrik
  - Webhook olaylari (`INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`) dogrulandi
  - V1.0 modunda production purchase kapaliysa `subscriptionStatus=trial/mock` davranisi ile uyumlu fallback acik
- Delete flow uyumu:
  - Aktif abonelikte hesap silme oncesi zorunlu uyari + `Manage Subscription` linki dogrulandi
  - "Hesabi sildim ama odeme devam etti" riskine karsi support macro ve in-app yonlendirme hazir
- Data Safety uyumu:
  - Collected data: `Location (driver)`, `Personal Info`, `Auth Info`
  - Guest/yolcu konumu toplanmiyor beyanı acik
  - Data usage amaci: `App functionality` (advertising yok, analytics amaci release beyaninda yok)
  - Third-party data sharing: `No`
  - Account deletion mekanizmasi: `Yes`

### Risk
- Hatali surumun hizli yayilmasi.

### Onlem
- Staged rollout + net stop kriteri + kill-switch.

### Done kriteri
- Staging->prod dry-run ve rollback tatbikati tamamlanmis.

---

## 10) 30 Gunluk Uygulama Fazlari

### Faz 1 (Gun 1-7) - Foundation + Security
- Flavor/env setup
- Auth + users/drivers/consents modeli
- Firestore/RTDB rules v1
- App Check enforcement
- `bootstrapUserProfile`, `updateUserProfile`, `upsertConsent`, `upsertDriverProfile`

Exit kriteri:
- Emulator'da auth/rules suite green

### Faz 2 (Gun 8-15) - Sofor cekirdegi
- `createRoute`, `updateRoute`, `upsertStop`, `deleteStop`
- `createRouteFromGhostDrive` + trace sanitize + stop candidate onayi
- Ghost Drive kalite hatti: DP + Map Matching post-process + fallback
- `driver_directory` lookup ve ikame sofor atama
- `startTrip`, `finishTrip`, `syncTripHeartbeatFromLocation`
- `startTrip/finishTrip` icin `expectedTransitionVersion` optimistic lock
- Background tracking + RTDB writer control
- `registerDevice` single-active-device politikasi + finishTrip cihaz kurali
- Android `foregroundServiceType=location` + `WAKE_LOCK` izin/manifest dogrulamasi
- Heartbeat red periferal alarm + `Seferi Bitir` guvenli etkileşim
- Heartbeat sesli geri bildirim + Kalman marker smoothing
- `startTrip` icin 10 sn undo penceresi (lokal pending -> commit)
- OLED burn-in micro-shift korumasi

Exit kriteri:
- 30 dk kesintisiz aktif trip + state tutarliligi green

### Faz 3 (Gun 16-23) - Yolcu + Guest + ETA
- `joinRouteBySrvCode`, `leaveRoute`, `updatePassengerSettings`
- `createGuestSession` (TTL + revoke)
- Guest->registered local ownership transfer migration
- Mapbox Directions ETA + fallback
- Mapbox style/tile cache stratejisi (cache-first + size limit)
- Virtual stop secimi + ETA hedef onceligi
- Ghost Drive off-route ETA toleransi (`>500m`, no-snap marker)
- Yolcu Servislerim + stale UI
- Delay inference karti (`Sofor henuz baslatmadi`)
- `submitSkipToday`

Exit kriteri:
- Yolcu ve guest akislari production-benzeri ortamda green

### Faz 4 (Gun 24-30) - Bildirim + Hardening
- `sendDriverAnnouncement` + WhatsApp share payload
- `morningReminderDispatcher`, `abandonedTripGuard`
- `morningReminderDispatcher` timezone enforce (`Europe/Istanbul`)
- `searchDriverDirectory` callable + driver_directory direct-read kapatma
- Offline action queue + replay
- Terminated queue flush (Android WorkManager / iOS BGTask)
- `createSupportReport` + opsiyonel `Shake to Report` akisi
- KVKK delete flow + retention cron
- Hesap silme + aktif abonelik interceptor + manage yonlendirme
- Soak test + bugfix + rollout hazirligi

Exit kriteri:
- P0 checklist tamami green

### Risk
- Fazlar arasi bagimlilikta gecikme.

### Onlem
- Her faz sonunda zorunlu gate review.

### Done kriteri
- Gun 30 sonunda pilotta 3-5 sofor ile saha testi.

### 10.1) No-Mac/iPhone Operasyon Modu (Gecici)
- Lokal Mac/iPhone yoksa iOS gelistirmesi durdurulmaz; asagidaki guard zorunludur:
  - Her PR'da `flutter build ios --no-codesign` CI compile kontrolu calisir.
  - iOS flavor/scheme fiziksel olarak acilmadan once prod entrypoint compile guard korunur.
  - App Store yayini oncesi tek seferlik fiziksel iOS gate zorunludur (Mac + en az 1 iPhone).
- Operasyon referansi: `docs/ios_macos_gate_plan.md`

---

## 11) V1.0 P0 Checklist (Release Gate)

- [ ] Direct client write kapali: `users`, `drivers`, `consents`, `routes`, `stops`, `passengers`, `trips`, `announcements`
- [ ] Route/trip read sadece membership ile
- [ ] `joinRouteBySrvCode` haric route kesif yolu yok
- [ ] `srvCode` unique ve server-generated
- [ ] `srvCode` algoritmasi `nanoid(6, A-Z2-9)` + collision retry max 5 ile calisiyor
- [ ] `passengerCount` + `memberIds` server-managed
- [ ] App Check prod enforce, debug token kapali
- [ ] Guest session TTL dolunca RTDB read kesiliyor
- [ ] `showPhone*` gizlilik kurallari UI ve payload'da dogru
- [ ] Bugun Binmiyorum tek-gun tek-kayit garanti
- [ ] Bugun Binmiyorum satiri sofor listesinde alt sirada + strikethrough
- [ ] Guest->registered owner migration veri kaybi olmadan tamam
- [ ] Drift schema migration stratejisi (`schemaVersion`, `onUpgrade`, migration testleri) aktif
- [ ] ETA directions + fallback testleri green
- [ ] Ghost Drive rota olusturma saha testinde calisiyor
- [ ] Ghost Drive map matching post-process + fallback kurali aktif
- [ ] Kalman smoothing ile marker jitter kabul edilebilir seviyeye inmis
- [ ] Delay inference karti (`+10 dk`) dogru tetikleniyor
- [ ] Heartbeat red periferal alarm + guvenli Seferi Bitir aksiyonu testte green
- [ ] Heartbeat sesli geri bildirim (red/iyilesme/finish) testte green
- [ ] Start undo penceresi (`10 sn`) yanlis start'i server'a yazmadan iptal edebiliyor
- [ ] Onboarding video fail-safe fallback testte green (video yok/hata var -> poster + akisa devam)
- [ ] TransitionVersion optimistic lock race testleri green
- [ ] OLED burn-in micro-shift korumasi aktif seferde etkin
- [ ] Ghost Drive off-route (`>500m`) modunda ETA ve marker davranisi dogru
- [ ] Virtual stop secimi varsa ETA hedefi olarak birincil kullaniliyor
- [ ] Terminated queue flush (Android/iOS) pending aksiyonlari baglanti gelince bosaltiyor
- [ ] Hesap silme oncesi aktif abonelik interceptor + manage link akisi dogru
- [ ] Yolcu/guest roluyle konum izni istenmiyor
- [ ] Bildirim izni red durumunda push yerine in-app fallback + settings CTA calisiyor
- [ ] `while-in-use` red durumunda aktif sefer hard-block; `background` red durumunda foreground-only degrade dogru
- [ ] Android pil optimizasyonu red durumunda degrade izleme modu ve heartbeat uyari metni tutarli
- [ ] iOS/Android 60 dk ekran kapali tracking PoC green
- [ ] Mac/iPhone yok surecinde iOS `no-codesign` CI compile guard her PR'da green
- [ ] Final iOS Gate (Mac + fiziksel iPhone + TestFlight) tamam
- [ ] Play Data Safety formu ile gercek veri davranisi birebir tutarli
- [ ] Android FGS manifest/izin seti policy uyumlu (`foregroundServiceType=location`, `WAKE_LOCK`)
- [ ] Ghost Drive polyline Douglas-Peucker sadeleştirme + boyut guard aktif
- [ ] RTDB live timestamp validate penceresi `now-30000` ile enforce
- [ ] `driver_directory` Firestore direct read kapali, sadece callable search acik
- [ ] Timezone policy (`scheduledTime=Europe/Istanbul`, timestamps=UTC) fonksiyon testlerinde green
- [ ] Premium entitlement guard server-side enforce (client tamper ile bypass yok)
- [ ] iOS/Android restore etiketleri dogru (iOS restore, Android satin alimlari geri yukle)
- [ ] UTF-8/TR karakter kalite testi green
- [ ] `Sorun Bildir` / `Shake to Report` paketi PII redaction ile dogru uretiliyor
- [ ] Offline trip action replay idempotent
- [ ] Idempotency race testleri green
- [ ] KVKK consent + delete + retention testleri green
- [ ] Staging->prod rollout + rollback dry-run tamam

---

## 12) Cursor'a Uygulama Talimati (Dogrudan Kullan)

```text
Bu teknik plana gore ilerle. Kurallar zorunlu:

1) users/drivers/consents/routes/stops/passengers/trips/announcements icin client direct write YASAK.
2) Tum kritik write'lar callable/function transaction'i ile yapilsin.
3) Role kontrolu server tarafinda users/{uid}.role uzerinden yapilsin.
4) Route ve trip read yalnizca memberIds baglantisiyla izinlendirilsin.
5) Misafir takip createGuestSession ile TTL'li olsun; sure dolunca erisim kesilsin.
6) startTrip/finishTrip/submitSkipToday/sendDriverAnnouncement idempotencyKey zorunlu olsun.
7) showPhoneToDriver/showPhoneToPassengers kurallari payload seviyesinde zorunlu uygulansin.
8) Her PR'da emulator integration suite zorunlu calissin.
9) Her task sonunda Risk / Onlem / Done notu yazilsin.
10) Faz 1 ve Faz 2 tamamlanmadan Faz 3'e gecilmesin.
```

Bu dokuman V1.0 icin teknik referanstir. Yeni kapsam yalnizca degisiklik kaydi ile eklenebilir.



