# NeredeServis Map Stack

Bu klasor, bolgesel ve dusuk maliyetli harita altyapisinin ilk fazi icin gerekli dosyalari tutar.

Hedef yigin:

- `routing.neredeservis.app` -> ayri DigitalOcean droplet uzerinde self-host `OSRM`
- `api.neredeservis.app/api/maps/*` -> mevcut backend API uzerinde merkezi `search / reverse / route`
- `Postgres place index` -> mevcut Postgres'e kurulacak arama katmani
- `tiles.neredeservis.app` -> ayri tile stack (`Planetiler` build + `TileServer GL` serve)

Ilk bolge:

- Gebze
- Darica
- Cayirova
- Dilovasi
- Tuzla
- Gerekli dogrulama ornekleri icin Istanbul dogu/orta koridoru

## Dizinler

- `do/` -> DigitalOcean ve Cloudflare otomasyon scriptleri
- `osrm/` -> route servisi icin VPS uzerinde calisacak compose + bootstrap dosyalari
- `place-index/` -> Postgres tabanli arama katmaninin ilk schema dosyalari
- `tiles/` -> raster tile servisi icin compose + build rehberi

## Ilk kurulum

1. `ops/maps/do/create-maps-droplet.ps1` ile `neredeservis-maps-dev` droplet'ini ac.
2. `ops/maps/do/upsert-dns-record.ps1` ile `routing.neredeservis.app` kaydini yeni IP'ye yonlendir.
3. Yeni droplet'te `ops/maps/osrm/` altindaki dosyalari `/opt/neredeservis/maps/osrm` altina koy.
4. `bootstrap-region.sh` ile bolgesel extract + OSRM build al.
5. Backend env'e `MAP_ROUTING_BASE_URL=https://routing.neredeservis.app` ekle.

## Tile fazi

Tile self-host ihtiyaci dogdugunda:

1. `ops/maps/tiles/` altindaki dosyalari ayri bir droplet'e veya ayni map host'a koy.
2. `Planetiler` ile bolgesel `MBTiles` uret.
3. `TileServer GL` ile raster endpoint ac.
4. Web ve mobil env'i `NEXT_PUBLIC_MAP_TILE_URL` / `MAP_TILE_URL` ile yeni host'a yonlendir.

## Neden bu tasarim?

- `OSRM` rota maliyetini hizli dusurur.
- `search/reverse` istemci yerine backend'e tasininca dogrudan tarayici API maliyeti kapanir.
- `place-index` tamamlandiginda search provider degisimi sadece backend env seviyesi olur.
- Tile stack ayri tutuldugu icin en pahali katman olan tile build/serve isi routing ve search'ten bagimsiz buyur.
