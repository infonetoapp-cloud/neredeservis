# DO Backend Migration Plan

Tarih: 2026-03-19
Durum: Aktif

## 1. Bugunku durum

Web cutover tamamlandi:
- `neredeservis.app`
- `www.neredeservis.app`
- `app.neredeservis.app`
- `stg-app.neredeservis.app`

Bu hostlar artik DigitalOcean uzerindeki Coolify deployment'ina gidiyor.

Ancak uygulama backend olarak hala asagidaki yonetilen servislere bagli:
- Firebase Auth
- Firestore
- Realtime Database
- Firebase Functions
- Firebase Storage

## 2. Kod tabanindaki bagimlilik ozeti

### Web

Web istemcisi dogrudan Firebase istemcilerini olusturuyor:
- `website/apps/web/src/lib/firebase/client.ts`

Web tarafinda yuksek yogunluklu callable kullanimi var:
- `website/apps/web/src/features/company/company-client-members.ts`
- `website/apps/web/src/features/company/company-client-routes.ts`
- `website/apps/web/src/features/company/company-client-vehicles.ts`
- `website/apps/web/src/features/company/company-client-settings.ts`

Web tarafinda RTDB canli konum streami de var:
- `website/apps/web/src/features/company/use-route-live-location-stream.ts`

### Mobil

Mobil taraf dogrudan Firebase Auth/Firestore/RTDB/Functions kullaniyor:
- `lib/app/router/router_firebase_runtime_gateway.dart`
- `lib/features/location/application/location_publish_service.dart`
- `lib/features/passenger/data/firebase_passenger_tracking_stream_repository.dart`
- `lib/features/domain/data/firestore_domain_repositories.dart`
- `lib/features/domain/data/rtdb_domain_repositories.dart`

### Functions backend

Mevcut backend Firebase Functions ustunde:
- `functions/src/index.ts`

Burada ayni anda su veri kaynaklari kullaniliyor:
- Firestore
- RTDB
- scheduled triggers
- callable HTTP functions
- Mapbox proxy callables

## 3. En saglikli migration sirasi

Firebase'den cikis tek seferde yapilmamali. En dusuk riskli sira:

1. Web host migrationini stabilize et
2. DO uzerinde ayri self-hosted backend servisini baslat
3. Ilk asamada sadece `health/version` ve web-only read endpointleri ekle
4. Web tarafinda yeni backend endpointleri icin ayri bir entegrasyon katmani olustur
5. Secili read-only callable'lari yeni HTTP API'ye tasi
6. Sonra write endpointlerini tasi
7. En son RTDB canli konum akisini Redis/SSE/WebSocket tarafina al
8. Auth ve dosya/storage cikisini en sona birak

## 4. Ilk tasinacak alanlar

Ilk backend kesiti su olmali:
- saglik endpointleri
- version/build metadata
- platform landing config
- company profile gibi read-only, web-only endpointler

Ilk fazda tasinmamasi gerekenler:
- live location
- trip lifecycle
- guest sessions
- route membership
- mapbox proxy
- mobil auth akislar

## 5. Hedef minimum self-hosted stack

Ilk backend fazi icin:
- Node HTTP API
- Coolify deployment
- Dockerfile
- environment variables

Bir sonraki fazda eklenecekler:
- PostgreSQL
- Redis
- background worker

## 6. Ilk risksiz teknik adim

Bu planla birlikte self-hosted backend bootstrap servisi eklendi:
- `backend/api/package.json`
- `backend/api/src/server.js`
- `backend/api/Dockerfile`

Ilk deployment sonrasi beklenen probe:
- `GET /healthz`
- `GET /readyz`
- `GET /version`

## 7. Sonraki somut is

Bir sonraki uygulama adimi:
- `backend/api` servisini Coolify'ye deploy etmek
- `api.neredeservis.app` veya `backend.neredeservis.app` gibi ayri bir subdomain baglamak
- web icin ilk read-only endpointi bu servise eklemek
