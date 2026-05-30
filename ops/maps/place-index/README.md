# Place Index Bootstrap

Ilk asamada istemci aramalarini backend'e tasirken, tam self-host arama icin mevcut Postgres ustunde bolgesel bir place index kurulacak.

Yaklasim:

1. OSM named place / poi verisini bolgesel extract'ten cikart.
2. Uygulamadaki route stop ve sik kullanilan adresleri ayni tabloya ekle.
3. `pg_trgm + unaccent` ile hizli Turkish text search yap.
4. `aliases` tablosu ile AVM, istasyon, mezarlik gibi varyasyonlari destekle.

Canli import sirasi:

1. `schema.sql` ile tabloyu ac.
2. `backend/api/scripts/seed-map-place-index.mjs` ile bootstrap seed'i yukle.
3. `backend/api/scripts/import-map-place-index-overpass.mjs` ile Gebze + Darica + Cayirova + Dilovasi + Tuzla OSM POI verisini cek.

Overpass importu bootstrap seed'i silmez; sadece `source='overpass'` kayitlarini yeniler.
