#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: ./scripts/run_flavor.sh <dev|stg|prod>"
  exit 1
fi

flavor="$1"
case "$flavor" in
  dev) target="lib/main_dev.dart" ;;
  stg) target="lib/main_stg.dart" ;;
  prod) target="lib/main_prod.dart" ;;
  *)
    echo "Unsupported flavor: $flavor"
    exit 1
    ;;
esac

fvm flutter run --flavor "$flavor" -t "$target"
