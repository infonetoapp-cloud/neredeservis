# NeredeServis Tile Stack

Bu dizin, Faz 3 icin dusuk maliyetli raster tile altyapisini tutar.

Secilen yigin:

- `Planetiler` -> bolgesel `MBTiles` uretimi
- `TileServer GL` -> raster `/{z}/{x}/{y}.png` endpointleri
- `Caddy` -> `tiles.neredeservis.app` reverse proxy

Bu tasarim neden secildi:

- Mevcut web `Leaflet` ve mobil `flutter_map` katmani raster tile URL ile calisiyor.
- `tileserver-gl-light` resmi dokumanda server-side rasterization olmadigini belirtiyor; bu nedenle aktif istemci yiginimiz icin uygun degil.
- `maptiler/tileserver-gl` raster cikis verebildigi icin istemci tarafini tekrar tasarlamadan tile self-host fazini acabiliyoruz.

Onemli operasyon notu:

- `12 USD / 2 GB` droplet tile SERVE etmek icin uygundur.
- Tile BUILD almak icin ayni droplet iyi hedef degil.
- `Planetiler` resmi README, OpenMapTiles profili icin en az `.osm.pbf` boyutunun `0.5x` kadar RAM ve `5-10x` kadar SSD bos alani oneriyor.
- Bu nedenle `MBTiles` uretimini lokal makinede veya gecici daha buyuk bir builder droplet'te alip sadece sonuc dosyasini tile droplet'ine kopyalamak daha sagliklidir.

## Dizinler

- `bootstrap-region.sh` -> bolgesel `.osm.pbf` dosyasindan `MBTiles` uretir
- `docker-compose.yml` -> TileServer GL + Caddy stack
- `.env.example` -> host ve tileset ayarlari
- `gebze-corridor.geojson` -> ilk AOI siniri

## Onerilen akis

1. `gebze-corridor.geojson` sinirini gerekirse duzelt.
2. Geofabrik Turkey extract indir.
3. `osmium extract` ile sadece AOI bolgesini kes.
4. Builder ortaminda `bootstrap-region.sh` ile `gebze-corridor.mbtiles` uret.
5. Uretilen `mbtiles` dosyasini tile VPS'e kopyala.
6. Tile VPS'te `docker compose up -d` calistir.
7. Browser'da `https://tiles.neredeservis.app/` acip style listesi ve raster endpointlerini dogrula.

## Ornek istemci env

Tile server aktif oldugunda istemci env degerlerini sunlara cekebilirsin:

- Web: `NEXT_PUBLIC_MAP_TILE_URL=https://tiles.neredeservis.app/styles/bright/{z}/{x}/{y}.png`
- Web: `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=&copy; OpenStreetMap contributors`
- Mobil: `--dart-define=MAP_TILE_URL=https://tiles.neredeservis.app/styles/bright/{z}/{x}/{y}.png`
- Mobil: `--dart-define=MAP_TILE_ATTRIBUTION=OpenStreetMap contributors`

Not:

- Style adi `bright` varsayimidir. TileServer GL ana sayfasinda expose edilen style adini dogrulayip env'i o isimle sabitle.
- Istekler buyurse tile stack'i routing droplet'inden ayri droplet'e tasimak daha dogru olur.
