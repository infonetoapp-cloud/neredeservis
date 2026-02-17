# Map Provider Decision (099/099B)

Tarih: 2026-02-17  
Durum: V1.0 icin kilitlendi

## Karar
- Birincil provider: `mapbox_maps_flutter`
- Exact paket surumu: `2.12.0`
- Flutter minimum uyum: `>=3.22.3` (paket `pubspec` kaniti)
- Dart minimum uyum: `>=3.4.4`

## Neden Mapbox
- Urun stratejisindeki canli takip + ETA + cache-first modeli ile uyumlu.
- Teknik plandaki `Directions` ve `Map Matching` proxy adimlariyla dogrudan uyumlu.
- Public token kisitlari ve secret/proxy modeli mevcut mimariyla uyumlu.

## MapLibre Alternatif Notu (099B)
- `MapLibre` V1.0 icin birincil secim degil.
- Alternatif fallback olarak degerlendirme notu:
  - arti: vendor lock-in riski daha dusuk
  - eksi: mevcut teknik planin ETA/Map Matching akisinda ek adapter ve ek operasyon maliyeti
- V1.0 karari: Mapbox ile cikis, abstraction katmani uzerinden provider degisimi opsiyonunu koru.

## Test ve Gate Notu
- 099A gercek cihaz smoke gate'i ayridir:
  - Android real device map render
  - iOS real device map render
- iOS fiziksel cihaz ve Apple hesap kismi hazir olmadigi surece 099A kapalidir.
