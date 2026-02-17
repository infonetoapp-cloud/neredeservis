# Mapbox Token Security Checklist (099D)

Tarih: 2026-02-17  
Durum: Hazirlandi (token bekleniyor)

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

## Mevcut Blokaj
- Bu checklist uygulamasi icin aktif Mapbox `pk/sk` token degerleri gerekli.
- Tokenlar paylasilmadigi icin 099D teknik olarak "hazir ama uygulanmadi" durumunda.
