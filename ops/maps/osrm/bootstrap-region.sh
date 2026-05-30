#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  echo ".env dosyasi bulunamadi. .env.example kopyalayip duzenle." >&2
  exit 1
fi

set -a
source .env
set +a

mkdir -p data

RAW_PBF="data/turkey-latest.osm.pbf"
REGION_PBF="data/region.osm.pbf"

echo "[1/5] Geofabrik extract indiriliyor"
curl -L --fail --progress-bar "${GEOFABRIK_SOURCE_URL}" -o "${RAW_PBF}"

echo "[2/5] BBOX ile bolgesel extract aliniyor: ${REGION_BBOX}"
osmium extract --overwrite -b "${REGION_BBOX}" "${RAW_PBF}" -o "${REGION_PBF}"

echo "[3/5] osrm-extract"
docker compose --profile tools run --rm osrm-extract

echo "[4/5] osrm-partition"
docker compose --profile tools run --rm osrm-partition

echo "[5/5] osrm-customize + osrm-router"
docker compose --profile tools run --rm osrm-customize
docker compose up -d osrm-router caddy

echo "Tamamlandi. Test:"
echo "  curl https://${ROUTING_DOMAIN}/healthz"
echo "  curl 'https://${ROUTING_DOMAIN}/route/v1/driving/29.4307,40.8028;29.3714,40.7755?overview=false'"
