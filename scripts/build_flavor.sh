#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: ./scripts/build_flavor.sh <dev|stg|prod> [apk-debug|apk-release]"
  exit 1
fi

flavor="$1"
mode="${2:-apk-debug}"

case "$flavor" in
  dev) target="lib/main_dev.dart" ;;
  stg) target="lib/main_stg.dart" ;;
  prod) target="lib/main_prod.dart" ;;
  *)
    echo "Unsupported flavor: $flavor"
    exit 1
    ;;
esac

case "$mode" in
  apk-debug) fvm flutter build apk --debug --flavor "$flavor" -t "$target" ;;
  apk-release) fvm flutter build apk --release --flavor "$flavor" -t "$target" ;;
  *)
    echo "Unsupported mode: $mode"
    exit 1
    ;;
esac
