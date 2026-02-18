# Mapbox Token Security Checklist (099D)

Tarih: 2026-02-18  
Durum: Uygulandi (sk token Secret Manager'a yazildi)

## Hedef
- Public token sadece mobil uygulama erisimi ile kisitli olacak.
- Secret token sadece server-side (Cloud Functions/Secret Manager) kullanilacak.

## Public Token Kurallari
1. Token tipi: `pk.*`
2. Scope: sadece gerekli map/style scope'lari acik.
3. Android kisiti:
   - Package name: `com.neredeservis.app`, `com.neredeservis.app.stg`, `com.neredeservis.app.dev`
   - SHA-1 fingerprintleri ilgili app'lerden girilecek.
4. iOS kisiti:
   - Bundle ID: `com.infonetoapp.neredeservis`, `com.infonetoapp.neredeservis.stg`, `com.infonetoapp.neredeservis.dev`
5. Not:
   - URL restriction tek basina yeterli degil (mobilde bypass edilebilir).

## Secret Token Kurallari
1. Token tipi: `sk.*`
2. Asla mobil istemciye gomulmez.
3. Firebase Secret Manager'da tutulur:
   - `MAPBOX_SECRET_TOKEN`
4. Sadece proxy function'lar erisir:
   - `mapboxDirectionsProxy`
   - `mapboxMapMatchingProxy`

## Dogrulama
- Yanlis package/bundle ile token erisimi reddedilmeli.
- Secret token istemci tarafina hic cikmamali.
- `directions_enabled=false` iken Directions cagrisi server tarafinda kapali olmali.

## Rotation ve Audit Notu (STEP-285)
- Rotasyon periyodu: 90 gun.
- Rotasyon akisi:
  1. Mapbox'tan yeni `sk.*` token olustur.
  2. `firebase functions:secrets:set MAPBOX_SECRET_TOKEN --project <dev|stg|prod> --data-file -`
  3. `firebase deploy --only functions --project <dev|stg|prod>`
  4. `mapboxDirectionsProxy` disabled mod ve `healthCheck` smoke dogrulamalarini tekrarla.
- Audit kaydi:
  - Secret version artis kaydi (`projects/*/secrets/MAPBOX_SECRET_TOKEN/versions/*`) iz kaydina append edilir.
  - GCP audit log filtre onerisi:
    - `protoPayload.methodName=("google.cloud.secretmanager.v1.SecretManagerService.AddSecretVersion" OR "google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion")`

## Mevcut Blokaj
- Public token kisitlama adimlari (package/bundle restriction) operasyonel olarak ayrica uygulanacak.
