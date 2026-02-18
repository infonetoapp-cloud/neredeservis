#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: ./scripts/build_flavor.sh <dev|stg|prod> [apk-debug|apk-release]"
  exit 1
fi

flavor="$1"
mode="${2:-apk-debug}"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"

case "$flavor" in
  dev) target="lib/main_dev.dart" ;;
  stg) target="lib/main_stg.dart" ;;
  prod) target="lib/main_prod.dart" ;;
  *)
    echo "Unsupported flavor: $flavor"
    exit 1
    ;;
esac

define_file=""
case "$flavor" in
  dev)
    [[ -f "$repo_root/.env.dev" ]] && define_file="$repo_root/.env.dev"
    ;;
  stg)
    if [[ -f "$repo_root/.env.staging" ]]; then
      define_file="$repo_root/.env.staging"
    elif [[ -f "$repo_root/.env.stg" ]]; then
      define_file="$repo_root/.env.stg"
    fi
    ;;
  prod)
    [[ -f "$repo_root/.env.prod" ]] && define_file="$repo_root/.env.prod"
    ;;
esac

dart_define_args=(--dart-define="APP_FLAVOR=$flavor")
if [[ -n "$define_file" ]]; then
  dart_define_args+=(--dart-define-from-file="$define_file")
fi

case "$mode" in
  apk-debug) fvm flutter build apk --debug --flavor "$flavor" -t "$target" "${dart_define_args[@]}" ;;
  apk-release) fvm flutter build apk --release --flavor "$flavor" -t "$target" "${dart_define_args[@]}" ;;
  *)
    echo "Unsupported mode: $mode"
    exit 1
    ;;
esac
