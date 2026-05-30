#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Kullanim: $0 <input.osm.pbf> <output.mbtiles>" >&2
  exit 1
fi

INPUT_PBF="$(realpath "$1")"
OUTPUT_MBTILES="$(realpath "$2")"
INPUT_DIR="$(dirname "$INPUT_PBF")"
DATA_DIR="$(dirname "$OUTPUT_MBTILES")"

if [[ ! -f "$INPUT_PBF" ]]; then
  echo "Input dosyasi bulunamadi: $INPUT_PBF" >&2
  exit 1
fi

mkdir -p "$DATA_DIR"

JAVA_OPTS="${JAVA_TOOL_OPTIONS:--Xmx1g}"

echo "[tiles] planetiler basliyor"
echo "[tiles] input:  $INPUT_PBF"
echo "[tiles] output: $OUTPUT_MBTILES"
echo "[tiles] java:   $JAVA_OPTS"

docker run --rm \
  -e JAVA_TOOL_OPTIONS="$JAVA_OPTS" \
  -v "$INPUT_DIR:/input:ro" \
  -v "$DATA_DIR:/data" \
  ghcr.io/onthegomap/planetiler:latest \
  --osm-path="/input/$(basename "$INPUT_PBF")" \
  --output="/data/$(basename "$OUTPUT_MBTILES")" \
  --download \
  --force

echo "[tiles] mbtiles hazir: $OUTPUT_MBTILES"
